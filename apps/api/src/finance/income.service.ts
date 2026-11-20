import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/types';
import { decimalToString, isPositiveMoney, toDecimal, toPaise } from '../common/utils/money.util';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateIncomeDto, VoidDto } from './dto/finance.dto';

@Injectable()
export class IncomeService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
  ) {}

  async create(user: AuthUser, dto: CreateIncomeDto) {
    this.access.assertNotViewerWrite(user);
    await this.access.assertSiteAccess(user, dto.siteId, { requireFinanceWrite: true });

    if (!isPositiveMoney(dto.amount)) {
      throw new BadRequestException('Amount must be positive');
    }

    const record = await this.prisma.incomeTransaction.create({
      data: {
        organizationId: user.organizationId,
        siteId: dto.siteId,
        clientId: dto.clientId || undefined,
        amount: toDecimal(dto.amount),
        dateReceived: new Date(dto.dateReceived),
        paymentMethod: dto.paymentMethod,
        referenceNumber: dto.referenceNumber,
        description: dto.description,
        attachmentId: dto.attachmentId || undefined,
        createdById: user.id,
        status: TransactionStatus.CONFIRMED,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: dto.siteId,
      type: ActivityType.INCOME_RECORDED,
      summary: `Client payment of ₹${decimalToString(record.amount)} recorded`,
      metadata: { incomeId: record.id, amount: decimalToString(record.amount) },
    });

    await this.activity.audit({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: 'IncomeTransaction',
      entityId: record.id,
      action: 'CREATE',
      after: { amount: decimalToString(record.amount), siteId: dto.siteId },
    });

    return this.serialize(record);
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      siteId?: string;
      search?: string;
      from?: string;
      to?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const base = await this.access.siteWhereFilter(user, query.siteId);

    const where = {
      ...base,
      status: { not: undefined },
      ...(query.from || query.to
        ? {
            dateReceived: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { description: { contains: query.search, mode: 'insensitive' as const } },
              { referenceNumber: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.incomeTransaction.findMany({
        where,
        include: {
          site: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: [{ dateReceived: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.incomeTransaction.count({ where }),
    ]);

    return paginatedResult(items.map((i) => this.serialize(i)), total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    const record = await this.prisma.incomeTransaction.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!record) throw new NotFoundException('Income transaction not found');
    await this.access.assertSiteAccess(user, record.siteId);
    return this.serialize(record);
  }

  async void(user: AuthUser, id: string, dto: VoidDto) {
    this.access.assertNotViewerWrite(user);
    const record = await this.prisma.incomeTransaction.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!record) throw new NotFoundException('Income transaction not found');
    await this.access.assertSiteAccess(user, record.siteId, { requireFinanceWrite: true });
    if (record.status === TransactionStatus.VOIDED) {
      throw new BadRequestException('Transaction already voided');
    }

    const updated = await this.prisma.incomeTransaction.update({
      where: { id },
      data: {
        status: TransactionStatus.VOIDED,
        voidReason: dto.reason,
        voidedAt: new Date(),
        voidedById: user.id,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: record.siteId,
      type: ActivityType.INCOME_VOIDED,
      summary: `Client payment voided (₹${decimalToString(record.amount)})`,
      metadata: { incomeId: id, reason: dto.reason },
    });

    await this.activity.audit({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: 'IncomeTransaction',
      entityId: id,
      action: 'VOID',
      before: { status: record.status, amount: decimalToString(record.amount) },
      after: { status: TransactionStatus.VOIDED },
      reason: dto.reason,
    });

    return this.serialize(updated);
  }

  private serialize(record: {
    id: string;
    siteId: string;
    amount: { toFixed(n: number): string } | string;
    dateReceived: Date;
    paymentMethod: string;
    referenceNumber: string | null;
    description: string | null;
    status: string;
    voidReason: string | null;
    voidedAt: Date | null;
    createdAt: Date;
    site?: { id: string; name: string; code: string };
    createdBy?: { id: string; fullName: string };
  }) {
    return {
      ...record,
      amount: decimalToString(record.amount as never),
      type: 'INCOME' as const,
    };
  }
}
