import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { FinanceCalcService } from './finance-calc.service';
import { AuthUser } from '../auth/types';
import {
  compareMoney,
  decimalToString,
  isPositiveMoney,
  toDecimal,
  toPaise,
} from '../common/utils/money.util';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateExpenseDto, CreateExpensePaymentDto, VoidDto } from './dto/finance.dto';

@Injectable()
export class ExpenseService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
    private calc: FinanceCalcService,
  ) {}

  async create(user: AuthUser, dto: CreateExpenseDto) {
    this.access.assertNotViewerWrite(user);
    await this.access.assertSiteAccess(user, dto.siteId, { requireFinanceWrite: true });

    if (!isPositiveMoney(dto.amount)) {
      throw new BadRequestException('Amount must be positive');
    }

    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: dto.categoryId, organizationId: user.organizationId, isActive: true },
    });
    if (!category) throw new BadRequestException('Invalid expense category');

    const initialPay = dto.initialPaymentAmount
      ? String(dto.initialPaymentAmount)
      : '0.00';
    if (toPaise(initialPay) < 0) {
      throw new BadRequestException('Initial payment cannot be negative');
    }
    if (compareMoney(initialPay, dto.amount) > 0) {
      throw new BadRequestException('Initial payment cannot exceed expense amount');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          organizationId: user.organizationId,
          siteId: dto.siteId,
          categoryId: dto.categoryId,
          vendorId: dto.vendorId || undefined,
          contactId: dto.contactId || undefined,
          vendorName: dto.vendorName,
          amount: toDecimal(dto.amount),
          amountPaid: toDecimal(initialPay),
          expenseDate: new Date(dto.expenseDate),
          paymentStatus: this.calc.reconcileExpensePaymentStatus(dto.amount, initialPay),
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
          description: dto.description,
          notes: dto.notes,
          attachmentId: dto.attachmentId || undefined,
          createdById: user.id,
          status: TransactionStatus.CONFIRMED,
        },
      });

      if (toPaise(initialPay) > 0) {
        if (!dto.paymentMethod) {
          throw new BadRequestException('Payment method required for initial payment');
        }
        await tx.expensePayment.create({
          data: {
            organizationId: user.organizationId,
            expenseId: expense.id,
            amount: toDecimal(initialPay),
            paidAt: new Date(dto.expenseDate),
            paymentMethod: dto.paymentMethod,
            referenceNumber: dto.referenceNumber,
            createdById: user.id,
            status: TransactionStatus.CONFIRMED,
          },
        });
      }

      return expense;
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: dto.siteId,
      type: ActivityType.EXPENSE_ADDED,
      summary: `Expense of ₹${dto.amount} added (${category.name})`,
      metadata: { expenseId: result.id },
    });

    await this.activity.audit({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: 'Expense',
      entityId: result.id,
      action: 'CREATE',
      after: { amount: dto.amount, amountPaid: initialPay },
    });

    return this.get(user, result.id);
  }

  async addPayment(user: AuthUser, expenseId: string, dto: CreateExpensePaymentDto) {
    this.access.assertNotViewerWrite(user);
    if (!isPositiveMoney(dto.amount)) {
      throw new BadRequestException('Amount must be positive');
    }

    const existing = await this.prisma.expense.findFirst({
      where: { id: expenseId, organizationId: user.organizationId },
    });
    if (!existing) throw new NotFoundException('Expense not found');
    await this.access.assertSiteAccess(user, existing.siteId, { requireFinanceWrite: true });

    await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, organizationId: user.organizationId },
      });
      if (!expense) throw new NotFoundException('Expense not found');
      if (expense.status === TransactionStatus.VOIDED) {
        throw new BadRequestException('Cannot pay a voided expense');
      }

      const outstandingPaise =
        toPaise(decimalToString(expense.amount)) - toPaise(decimalToString(expense.amountPaid));
      const payPaise = toPaise(dto.amount);
      if (payPaise > outstandingPaise) {
        throw new BadRequestException(
          `Payment exceeds outstanding balance of ${fromPaiseSafe(outstandingPaise)}`,
        );
      }

      await tx.expensePayment.create({
        data: {
          organizationId: user.organizationId,
          expenseId,
          amount: toDecimal(dto.amount),
          paidAt: new Date(dto.paidAt),
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
          attachmentId: dto.attachmentId || undefined,
          createdById: user.id,
          status: TransactionStatus.CONFIRMED,
        },
      });

      const newPaidPaise = toPaise(decimalToString(expense.amountPaid)) + payPaise;
      const newPaid = fromPaiseSafe(newPaidPaise);
      const amountStr = decimalToString(expense.amount);

      await tx.expense.update({
        where: { id: expenseId },
        data: {
          amountPaid: toDecimal(newPaid),
          paymentStatus: this.calc.reconcileExpensePaymentStatus(amountStr, newPaid),
        },
      });
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: existing.siteId,
      type: ActivityType.EXPENSE_PAYMENT_ADDED,
      summary: `Expense payment of ₹${dto.amount} recorded`,
      metadata: { expenseId },
    });

    await this.activity.audit({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: 'ExpensePayment',
      entityId: expenseId,
      action: 'CREATE_PAYMENT',
      after: { amount: dto.amount },
    });

    return this.get(user, expenseId);
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      siteId?: string;
      categoryId?: string;
      paymentStatus?: string;
      search?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const base = await this.access.siteWhereFilter(user, query.siteId);
    const where: Prisma.ExpenseWhereInput = {
      ...base,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus as never } : {}),
      ...(query.from || query.to
        ? {
            expenseDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' } },
              { vendorName: { contains: query.search, mode: 'insensitive' } },
              { referenceNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, fullName: true } },
          payments: {
            where: { status: TransactionStatus.CONFIRMED },
            orderBy: { paidAt: 'desc' },
          },
        },
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return paginatedResult(items.map((e) => this.serialize(e)), total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        site: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true } },
        payments: {
          where: { status: { not: undefined } },
          orderBy: { paidAt: 'desc' },
          include: { createdBy: { select: { id: true, fullName: true } } },
        },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.access.assertSiteAccess(user, expense.siteId);
    return this.serialize(expense);
  }

  async void(user: AuthUser, id: string, dto: VoidDto) {
    this.access.assertNotViewerWrite(user);
    const expense = await this.prisma.expense.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    await this.access.assertSiteAccess(user, expense.siteId, { requireFinanceWrite: true });
    if (expense.status === TransactionStatus.VOIDED) {
      throw new BadRequestException('Expense already voided');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          status: TransactionStatus.VOIDED,
          voidReason: dto.reason,
          voidedAt: new Date(),
        },
      });
      await tx.expensePayment.updateMany({
        where: { expenseId: id, status: TransactionStatus.CONFIRMED },
        data: {
          status: TransactionStatus.VOIDED,
          voidReason: dto.reason,
          voidedAt: new Date(),
        },
      });
    });

    await this.activity.audit({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: 'Expense',
      entityId: id,
      action: 'VOID',
      reason: dto.reason,
    });

    return this.get(user, id);
  }

  private serialize(expense: {
    id: string;
    siteId: string;
    amount: { toFixed(n: number): string };
    amountPaid: { toFixed(n: number): string };
    expenseDate: Date;
    paymentStatus: string;
    status: string;
    description: string | null;
    vendorName: string | null;
    payments?: Array<{
      id: string;
      amount: { toFixed(n: number): string };
      paidAt: Date;
      paymentMethod: string;
      status: string;
    }>;
    site?: { id: string; name: string; code: string };
    category?: { id: string; name: string };
    createdBy?: { id: string; fullName: string };
    [key: string]: unknown;
  }) {
    const amount = decimalToString(expense.amount as never);
    const amountPaid = decimalToString(expense.amountPaid as never);
    return {
      ...expense,
      amount,
      amountPaid,
      outstanding: fromPaiseSafe(Math.max(0, toPaise(amount) - toPaise(amountPaid))),
      type: 'EXPENSE' as const,
      payments: expense.payments?.map((p) => ({
        ...p,
        amount: decimalToString(p.amount as never),
      })),
    };
  }
}

function fromPaiseSafe(paise: number) {
  const negative = paise < 0;
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${rupees}.${frac}`;
}
