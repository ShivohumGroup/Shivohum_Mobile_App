import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma, ProjectStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ActivityService } from '../activity/activity.service';
import { FinanceCalcService } from '../finance/finance-calc.service';
import { AuthUser } from '../auth/types';
import { decimalToString, isPositiveMoney, toDecimal } from '../common/utils/money.util';
import { getPagination, paginatedResult } from '../common/utils/pagination';
import { CreateSiteDto, UpdateSiteDto } from './dto/sites.dto';

@Injectable()
export class SitesService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private activity: ActivityService,
    private finance: FinanceCalcService,
  ) {}

  async create(user: AuthUser, dto: CreateSiteDto) {
    this.access.assertNotViewerWrite(user);
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions to create sites');
    }
    if (!isPositiveMoney(dto.contractAmount)) {
      throw new BadRequestException('Contract amount must be positive');
    }

    const code =
      dto.code?.trim().toUpperCase() ||
      (await this.generateCode(user.organizationId, dto.name));

    const site = await this.prisma.site.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        code,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        projectType: dto.projectType,
        description: dto.description,
        contractAmount: toDecimal(dto.contractAmount),
        agreedStartDate: new Date(dto.agreedStartDate),
        expectedCompletionDate: dto.expectedCompletionDate
          ? new Date(dto.expectedCompletionDate)
          : undefined,
        status: dto.status || ProjectStatus.PLANNING,
        projectManagerId: dto.projectManagerId || undefined,
        notes: dto.notes,
        createdById: user.id,
      },
    });

    // Creator membership
    await this.prisma.siteMembership.create({
      data: {
        organizationId: user.organizationId,
        siteId: site.id,
        userId: user.id,
        role: user.role,
        canViewFinance: true,
        canEditFinance: true,
        canEditProgress: true,
        canEditContacts: true,
      },
    });

    if (dto.projectManagerId && dto.projectManagerId !== user.id) {
      await this.prisma.siteMembership.upsert({
        where: { siteId_userId: { siteId: site.id, userId: dto.projectManagerId } },
        create: {
          organizationId: user.organizationId,
          siteId: site.id,
          userId: dto.projectManagerId,
          role: UserRole.SITE_MANAGER,
          canViewFinance: true,
          canEditFinance: true,
          canEditProgress: true,
          canEditContacts: true,
        },
        update: { isActive: true },
      });
    }

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId: site.id,
      type: ActivityType.SITE_CREATED,
      summary: `Site created: ${site.name}`,
    });

    return this.serialize(site);
  }

  async list(
    user: AuthUser,
    query: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: ProjectStatus;
      projectType?: string;
      includeArchived?: string;
    },
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const accessible = await this.access.getAccessibleSiteIds(user);

    const where: Prisma.SiteWhereInput = {
      organizationId: user.organizationId,
      ...(accessible === 'ALL' ? {} : { id: { in: accessible } }),
      ...(query.includeArchived === 'true' ? {} : { archivedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.projectType ? { projectType: query.projectType as never } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { code: { contains: query.search, mode: 'insensitive' } },
              { clientName: { contains: query.search, mode: 'insensitive' } },
              { address: { contains: query.search, mode: 'insensitive' } },
              { city: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        include: {
          projectManager: { select: { id: true, fullName: true } },
          _count: { select: { memberships: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.site.count({ where }),
    ]);

    const withFinance = await Promise.all(
      items.map(async (site) => {
        const financials = await this.finance.siteFinancialSummary(
          user.organizationId,
          site.id,
        );
        return this.withFinancials(site, financials);
      }),
    );

    return paginatedResult(withFinance, total, page, pageSize);
  }

  async get(user: AuthUser, id: string) {
    await this.access.assertSiteAccess(user, id);
    const site = await this.prisma.site.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        projectManager: { select: { id: true, fullName: true, email: true, phone: true } },
        memberships: {
          where: { isActive: true },
          include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
        },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!site) throw new NotFoundException('Site not found');
    const financials = await this.finance.siteFinancialSummary(user.organizationId, id);
    return { ...this.withFinancials(site, financials), memberships: site.memberships };
  }

  async summary(user: AuthUser, id: string) {
    await this.access.assertSiteAccess(user, id);
    const site = await this.prisma.site.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true, name: true, code: true },
    });
    if (!site) throw new NotFoundException('Site not found');
    const financials = await this.finance.siteFinancialSummary(user.organizationId, id);
    return {
      ...financials,
      site,
    };
  }

  async update(user: AuthUser, id: string, dto: UpdateSiteDto) {
    this.access.assertNotViewerWrite(user);
    await this.access.assertSiteAccess(user, id);
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PARTNER, UserRole.SITE_MANAGER].includes(user.role as never)) {
      throw new BadRequestException('Insufficient permissions');
    }

    const before = await this.prisma.site.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!before) throw new NotFoundException('Site not found');

    const site = await this.prisma.site.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code.toUpperCase() } : {}),
        ...(dto.clientName !== undefined ? { clientName: dto.clientName } : {}),
        ...(dto.clientPhone !== undefined ? { clientPhone: dto.clientPhone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.projectType !== undefined ? { projectType: dto.projectType } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.contractAmount !== undefined
          ? { contractAmount: toDecimal(dto.contractAmount) }
          : {}),
        ...(dto.agreedStartDate !== undefined
          ? { agreedStartDate: new Date(dto.agreedStartDate) }
          : {}),
        ...(dto.expectedCompletionDate !== undefined
          ? {
              expectedCompletionDate: dto.expectedCompletionDate
                ? new Date(dto.expectedCompletionDate)
                : null,
            }
          : {}),
        ...(dto.actualCompletionDate !== undefined
          ? {
              actualCompletionDate: dto.actualCompletionDate
                ? new Date(dto.actualCompletionDate)
                : null,
            }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.projectManagerId !== undefined
          ? { projectManagerId: dto.projectManagerId }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    if (dto.status && dto.status !== before.status) {
      await this.activity.log({
        organizationId: user.organizationId,
        actorId: user.id,
        siteId: id,
        type: ActivityType.SITE_STATUS_CHANGED,
        summary: `Site status changed to ${dto.status}`,
      });
    } else {
      await this.activity.log({
        organizationId: user.organizationId,
        actorId: user.id,
        siteId: id,
        type: ActivityType.SITE_UPDATED,
        summary: `Site updated: ${site.name}`,
      });
    }

    return this.get(user, id);
  }

  async archive(user: AuthUser, id: string) {
    this.access.assertNotViewerWrite(user);
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Only admins can archive sites');
    }
    await this.access.assertSiteAccess(user, id);
    const site = await this.prisma.site.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        status: ProjectStatus.ARCHIVED,
      },
    });
    // Financial history retained — never hard-deleted
    return this.serialize(site);
  }

  async assignMember(
    user: AuthUser,
    siteId: string,
    body: {
      userId: string;
      role: UserRole;
      canViewFinance?: boolean;
      canEditFinance?: boolean;
      canEditProgress?: boolean;
      canEditContacts?: boolean;
    },
  ) {
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role as never)) {
      throw new BadRequestException('Only admins can assign members');
    }
    await this.access.assertSiteAccess(user, siteId);
    const target = await this.prisma.user.findFirst({
      where: { id: body.userId, organizationId: user.organizationId },
    });
    if (!target) throw new NotFoundException('User not found');

    const membership = await this.prisma.siteMembership.upsert({
      where: { siteId_userId: { siteId, userId: body.userId } },
      create: {
        organizationId: user.organizationId,
        siteId,
        userId: body.userId,
        role: body.role,
        canViewFinance: body.canViewFinance ?? true,
        canEditFinance: body.canEditFinance ?? false,
        canEditProgress: body.canEditProgress ?? true,
        canEditContacts: body.canEditContacts ?? true,
      },
      update: {
        role: body.role,
        isActive: true,
        canViewFinance: body.canViewFinance ?? true,
        canEditFinance: body.canEditFinance ?? false,
        canEditProgress: body.canEditProgress ?? true,
        canEditContacts: body.canEditContacts ?? true,
      },
    });

    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      siteId,
      type: ActivityType.MEMBERSHIP_CHANGED,
      summary: `Team membership updated for ${target.fullName}`,
    });

    return membership;
  }

  private async generateCode(organizationId: string, name: string) {
    const base = name
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 6)
      .toUpperCase() || 'SITE';
    for (let i = 1; i < 1000; i++) {
      const code = `${base}-${String(i).padStart(3, '0')}`;
      const exists = await this.prisma.site.findFirst({
        where: { organizationId, code },
      });
      if (!exists) return code;
    }
    return `${base}-${Date.now().toString().slice(-4)}`;
  }

  private serialize(site: {
    contractAmount: { toFixed(n: number): string };
    [key: string]: unknown;
  }) {
    return {
      ...site,
      contractAmount: decimalToString(site.contractAmount as never),
    };
  }

  /** Attach nested financials plus flat aliases the mobile app reads. */
  private withFinancials(
    site: {
      contractAmount: { toFixed(n: number): string };
      [key: string]: unknown;
    },
    financials: Awaited<ReturnType<FinanceCalcService['siteFinancialSummary']>>,
  ) {
    return {
      ...this.serialize(site),
      financials,
      totalReceived: financials.totalReceived,
      totalExpensesPaid: financials.expensesPaid,
      totalExpensesIncurred: financials.expensesIncurred,
      netCash: financials.netCashBalance,
      availableAmount: financials.netCashBalance,
      outstanding: financials.clientOutstanding,
      overpayment: financials.clientOverpayment,
      expensesOutstanding: financials.supplierOutstanding,
      margin: financials.estimatedMargin,
    };
  }
}
