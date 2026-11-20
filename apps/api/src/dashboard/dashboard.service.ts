import { Injectable } from '@nestjs/common';
import { ProjectStatus, TransactionStatus } from '@prisma/client';
import { monthRangeIst, yearRangeIst, getIstYearMonth } from '@siteflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { FinanceCalcService } from '../finance/finance-calc.service';
import { AuthUser } from '../auth/types';
import { decimalToString } from '../common/utils/money.util';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private finance: FinanceCalcService,
  ) {}

  async summary(
    user: AuthUser,
    query: {
      year?: number;
      month?: number;
      siteId?: string;
      status?: ProjectStatus;
      from?: string;
      to?: string;
    },
  ) {
    const accessible = await this.access.getAccessibleSiteIds(user);
    let siteIds: string[] | 'ALL' = accessible;
    if (query.siteId) {
      await this.access.assertSiteAccess(user, query.siteId);
      siteIds = [query.siteId];
    }

    const now = getIstYearMonth();
    const year = query.year || now.year;
    let incomeFrom: Date | undefined;
    let incomeTo: Date | undefined;

    if (query.from && query.to) {
      incomeFrom = new Date(query.from);
      incomeTo = new Date(query.to);
    } else if (query.month) {
      const range = monthRangeIst(year, query.month);
      incomeFrom = range.start;
      incomeTo = range.end;
    } else if (query.year) {
      const range = yearRangeIst(year);
      incomeFrom = range.start;
      incomeTo = range.end;
    }

    // Lifetime cash position for main cards (not period-scoped)
    const aggregates = await this.finance.aggregateForSites(user.organizationId, siteIds, {
      status: query.status,
    });

    // Period totals for the selected month/range (shown as monthIncome / monthExpenses)
    const periodAggregates = await this.finance.aggregateForSites(user.organizationId, siteIds, {
      incomeFrom,
      incomeTo,
      expenseFrom: incomeFrom,
      expenseTo: incomeTo,
      paymentFrom: incomeFrom,
      paymentTo: incomeTo,
      status: query.status,
    });

    const monthly = await this.finance.monthlySeries(user.organizationId, siteIds, year);
    const categories = await this.finance.categoryBreakdown(
      user.organizationId,
      siteIds,
      incomeFrom,
      incomeTo,
    );

    const siteFilter =
      siteIds === 'ALL'
        ? { organizationId: user.organizationId, archivedAt: null }
        : { organizationId: user.organizationId, id: { in: siteIds }, archivedAt: null };

    const sites = await this.prisma.site.findMany({
      where: {
        ...siteFilter,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const siteComparisons = await Promise.all(
      sites.map(async (s) => {
        const fin = await this.finance.siteFinancialSummary(user.organizationId, s.id);
        return {
          ...fin,
          id: s.id,
          siteId: s.id,
          name: s.name,
          code: s.code,
          status: s.status,
          clientName: s.clientName,
          city: s.city,
          contractAmount: fin.contractAmount,
          // Flat aliases for mobile SiteCard
          totalReceived: fin.totalReceived,
          totalExpensesPaid: fin.expensesPaid,
          totalExpensesIncurred: fin.expensesIncurred,
          netCash: fin.netCashBalance,
          availableAmount: fin.netCashBalance,
          outstanding: fin.clientOutstanding,
        };
      }),
    );

    const recentIncome = await this.prisma.incomeTransaction.findMany({
      where: {
        organizationId: user.organizationId,
        ...(siteIds === 'ALL' ? {} : { siteId: { in: siteIds } }),
      },
      include: { site: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentExpenses = await this.prisma.expense.findMany({
      where: {
        organizationId: user.organizationId,
        ...(siteIds === 'ALL' ? {} : { siteId: { in: siteIds } }),
      },
      include: {
        site: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentProgress = await this.prisma.progressUpdate.findMany({
      where: {
        organizationId: user.organizationId,
        ...(siteIds === 'ALL' ? {} : { siteId: { in: siteIds } }),
      },
      include: {
        site: { select: { id: true, name: true } },
        createdBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const approaching = await this.prisma.site.findMany({
      where: {
        ...siteFilter,
        status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] },
        expectedCompletionDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { expectedCompletionDate: 'asc' },
      take: 10,
    });

    const recentActivity = await this.prisma.activityLog.findMany({
      where: {
        organizationId: user.organizationId,
        ...(siteIds === 'ALL'
          ? {}
          : { OR: [{ siteId: { in: siteIds } }, { siteId: null }] }),
      },
      include: {
        actor: { select: { fullName: true } },
        site: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const recentTransactions = [
      ...recentIncome.map((i) => ({
        id: i.id,
        kind: 'INCOME' as const,
        type: 'INCOME',
        amount: decimalToString(i.amount),
        date: i.dateReceived,
        siteId: i.siteId,
        siteName: i.site.name,
        site: i.site,
        status: i.status,
        title: i.description || 'Client payment',
        description: i.description,
      })),
      ...recentExpenses.map((e) => ({
        id: e.id,
        kind: 'EXPENSE' as const,
        type: 'EXPENSE',
        amount: decimalToString(e.amount),
        date: e.expenseDate,
        siteId: e.siteId,
        siteName: e.site.name,
        site: e.site,
        status: e.paymentStatus || e.status,
        title: e.description || e.category?.name || 'Expense',
        description: e.description || e.category?.name,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    // Mobile-friendly flat summary + nested payload for admin
    const flatSummary = {
      activeSites: aggregates.activeSites,
      totalSites: sites.length,
      contractValue: aggregates.totalContractValue,
      totalReceived: aggregates.totalReceived,
      totalExpensesPaid: aggregates.expensesPaid,
      totalExpensesIncurred: aggregates.expensesIncurred,
      netCash: aggregates.netCashBalance,
      availableAmount: aggregates.netCashBalance,
      outstanding: aggregates.clientOutstanding,
      monthIncome: periodAggregates.totalReceived,
      monthExpenses: periodAggregates.expensesPaid,
    };

    return {
      ...flatSummary,
      filters: { year, month: query.month || null, siteId: query.siteId || null, status: query.status || null },
      summary: { ...aggregates, ...flatSummary },
      monthly,
      monthlySeries: monthly.map((m) => ({
        ...m,
        expense: m.expensesPaid,
        label: undefined as string | undefined,
      })),
      categories,
      siteComparisons,
      sites: siteComparisons,
      recentTransactions,
      latestProgress: recentProgress,
      recentProgress,
      approachingCompletion: approaching.map((s) => ({
        id: s.id,
        name: s.name,
        expectedCompletionDate: s.expectedCompletionDate,
        status: s.status,
      })),
      recentActivity,
    };
  }
}
