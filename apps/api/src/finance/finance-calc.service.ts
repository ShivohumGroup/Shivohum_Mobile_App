import { Injectable } from '@nestjs/common';
import { ExpensePaymentStatus, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addMoney,
  calculateExpenseOutstanding,
  calculateMargin,
  calculateNetCash,
  calculateOutstanding,
  decimalToString,
  toPaise,
  fromPaise,
} from '../common/utils/money.util';

@Injectable()
export class FinanceCalcService {
  constructor(private prisma: PrismaService) {}

  async siteFinancialSummary(organizationId: string, siteId: string) {
    const site = await this.prisma.site.findFirstOrThrow({
      where: { id: siteId, organizationId },
    });

    const [incomeAgg, expenseAgg, paidAgg, incomeCount, expenseCount] = await Promise.all([
      this.prisma.incomeTransaction.aggregate({
        where: {
          organizationId,
          siteId,
          status: TransactionStatus.CONFIRMED,
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          organizationId,
          siteId,
          status: TransactionStatus.CONFIRMED,
        },
        _sum: { amount: true, amountPaid: true },
      }),
      this.prisma.expensePayment.aggregate({
        where: {
          organizationId,
          status: TransactionStatus.CONFIRMED,
          expense: { siteId, organizationId, status: TransactionStatus.CONFIRMED },
        },
        _sum: { amount: true },
      }),
      this.prisma.incomeTransaction.count({
        where: { organizationId, siteId, status: TransactionStatus.CONFIRMED },
      }),
      this.prisma.expense.count({
        where: { organizationId, siteId, status: TransactionStatus.CONFIRMED },
      }),
    ]);

    const contractAmount = decimalToString(site.contractAmount);
    const totalReceived = decimalToString(incomeAgg._sum.amount);
    const expensesIncurred = decimalToString(expenseAgg._sum.amount);
    // Prefer payment ledger; fall back to denormalized amountPaid on expense rows
    const expensesPaidFromPayments = decimalToString(paidAgg._sum.amount);
    const expensesPaidDenorm = decimalToString(expenseAgg._sum.amountPaid);
    const expensesPaid =
      toPaise(expensesPaidFromPayments) >= toPaise(expensesPaidDenorm)
        ? expensesPaidFromPayments
        : expensesPaidDenorm;

    const { outstanding: clientOutstanding, overpayment } = calculateOutstanding(
      contractAmount,
      totalReceived,
    );
    const supplierOutstanding = calculateExpenseOutstanding(expensesIncurred, expensesPaid);
    const netCashBalance = calculateNetCash(totalReceived, expensesPaid);
    const estimatedMargin = calculateMargin(contractAmount, expensesIncurred);

    return {
      siteId,
      contractAmount,
      totalReceived,
      expensesIncurred,
      expensesPaid,
      clientOutstanding,
      clientOverpayment: overpayment,
      supplierOutstanding,
      netCashBalance,
      estimatedMargin,
      incomeCount,
      expenseCount,
      // Mobile-friendly aliases (flat field names used by the app)
      totalExpensesIncurred: expensesIncurred,
      totalExpensesPaid: expensesPaid,
      outstanding: clientOutstanding,
      overpayment,
      expensesOutstanding: supplierOutstanding,
      netCash: netCashBalance,
      availableAmount: netCashBalance,
      margin: estimatedMargin,
      labels: {
        netCashBalance: 'Actual client receipts minus actual outgoing payments',
        availableAmount: 'Same as net cash — cash available after paid expenses',
        estimatedMargin: 'Contract value minus valid expense amounts (not cash)',
        expensesIncurred: 'Total expense bills (paid + unpaid)',
        expensesPaid: 'Cash actually paid out to vendors',
      },
    };
  }

  async aggregateForSites(
    organizationId: string,
    siteIds: string[] | 'ALL',
    dateFilters?: {
      incomeFrom?: Date;
      incomeTo?: Date;
      expenseFrom?: Date;
      expenseTo?: Date;
      paymentFrom?: Date;
      paymentTo?: Date;
      status?: string;
    },
  ) {
    const siteWhere: Prisma.SiteWhereInput = {
      organizationId,
      ...(siteIds === 'ALL' ? {} : { id: { in: siteIds } }),
      ...(dateFilters?.status ? { status: dateFilters.status as never } : {}),
      archivedAt: null,
    };

    const sites = await this.prisma.site.findMany({ where: siteWhere });
    const ids = sites.map((s) => s.id);
    if (!ids.length) {
      return {
        activeSites: 0,
        totalContractValue: '0.00',
        totalReceived: '0.00',
        expensesPaid: '0.00',
        expensesIncurred: '0.00',
        clientOutstanding: '0.00',
        supplierOutstanding: '0.00',
        netCashBalance: '0.00',
        sites: [],
      };
    }

    const incomeWhere: Prisma.IncomeTransactionWhereInput = {
      organizationId,
      siteId: { in: ids },
      status: TransactionStatus.CONFIRMED,
      ...(dateFilters?.incomeFrom || dateFilters?.incomeTo
        ? {
            dateReceived: {
              ...(dateFilters.incomeFrom ? { gte: dateFilters.incomeFrom } : {}),
              ...(dateFilters.incomeTo ? { lte: dateFilters.incomeTo } : {}),
            },
          }
        : {}),
    };

    const expenseWhere: Prisma.ExpenseWhereInput = {
      organizationId,
      siteId: { in: ids },
      status: TransactionStatus.CONFIRMED,
      ...(dateFilters?.expenseFrom || dateFilters?.expenseTo
        ? {
            expenseDate: {
              ...(dateFilters.expenseFrom ? { gte: dateFilters.expenseFrom } : {}),
              ...(dateFilters.expenseTo ? { lte: dateFilters.expenseTo } : {}),
            },
          }
        : {}),
    };

    const paymentWhere: Prisma.ExpensePaymentWhereInput = {
      organizationId,
      status: TransactionStatus.CONFIRMED,
      expense: { siteId: { in: ids }, organizationId, status: TransactionStatus.CONFIRMED },
      ...(dateFilters?.paymentFrom || dateFilters?.paymentTo
        ? {
            paidAt: {
              ...(dateFilters.paymentFrom ? { gte: dateFilters.paymentFrom } : {}),
              ...(dateFilters.paymentTo ? { lte: dateFilters.paymentTo } : {}),
            },
          }
        : {}),
    };

    const [incomeAgg, expenseAgg, paymentAgg] = await Promise.all([
      this.prisma.incomeTransaction.aggregate({
        where: incomeWhere,
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
      }),
      this.prisma.expensePayment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      }),
    ]);

    // Outstanding should be based on all-time confirmed (not period), unless no period filter
    const usePeriod =
      dateFilters?.incomeFrom ||
      dateFilters?.incomeTo ||
      dateFilters?.expenseFrom ||
      dateFilters?.expenseTo;

    let totalContract = '0.00';
    for (const s of sites) {
      totalContract = addMoney(totalContract, decimalToString(s.contractAmount));
    }

    const totalReceived = decimalToString(incomeAgg._sum.amount);
    const expensesIncurred = decimalToString(expenseAgg._sum.amount);
    const expensesPaid = decimalToString(paymentAgg._sum.amount);

    let clientOutstanding = '0.00';
    let supplierOutstanding = '0.00';

    if (!usePeriod) {
      // all-time outstanding per site
      for (const s of sites) {
        const summary = await this.siteFinancialSummary(organizationId, s.id);
        clientOutstanding = addMoney(clientOutstanding, summary.clientOutstanding);
        supplierOutstanding = addMoney(supplierOutstanding, summary.supplierOutstanding);
      }
    } else {
      // Period view: outstanding not meaningful the same way; still compute all-time for cards
      for (const s of sites) {
        const summary = await this.siteFinancialSummary(organizationId, s.id);
        clientOutstanding = addMoney(clientOutstanding, summary.clientOutstanding);
        supplierOutstanding = addMoney(supplierOutstanding, summary.supplierOutstanding);
      }
    }

    return {
      activeSites: sites.filter((s) => s.status === 'ACTIVE' || s.status === 'PLANNING').length,
      totalSites: sites.length,
      totalContractValue: totalContract,
      totalReceived,
      expensesPaid,
      expensesIncurred,
      clientOutstanding,
      supplierOutstanding,
      netCashBalance: calculateNetCash(totalReceived, expensesPaid),
      reportingNotes: {
        incomeAndCashExpenses: 'Filtered by payment/received dates within selected period',
        expensesIncurred: 'Filtered by expense date within selected period',
      },
    };
  }

  async categoryBreakdown(organizationId: string, siteIds: string[] | 'ALL', from?: Date, to?: Date) {
    const ids =
      siteIds === 'ALL'
        ? (
            await this.prisma.site.findMany({
              where: { organizationId, archivedAt: null },
              select: { id: true },
            })
          ).map((s) => s.id)
        : siteIds;

    const expenses = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        organizationId,
        siteId: { in: ids },
        status: TransactionStatus.CONFIRMED,
        ...(from || to
          ? {
              expenseDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      _sum: { amount: true },
    });

    const categories = await this.prisma.expenseCategory.findMany({
      where: { organizationId },
    });
    const map = new Map(categories.map((c) => [c.id, c.name]));

    return expenses.map((e) => ({
      categoryId: e.categoryId,
      categoryName: map.get(e.categoryId) || 'Unknown',
      amount: decimalToString(e._sum.amount),
    }));
  }

  async monthlySeries(
    organizationId: string,
    siteIds: string[] | 'ALL',
    year: number,
  ) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const result: Array<{
      month: number;
      income: string;
      expensesPaid: string;
      expensesIncurred: string;
    }> = [];

    for (const month of months) {
      const { monthRangeIst } = await import('@siteflow/shared');
      const { start, end } = monthRangeIst(year, month);
      const agg = await this.aggregateForSites(organizationId, siteIds, {
        incomeFrom: start,
        incomeTo: end,
        expenseFrom: start,
        expenseTo: end,
        paymentFrom: start,
        paymentTo: end,
      });
      result.push({
        month,
        income: agg.totalReceived,
        expensesPaid: agg.expensesPaid,
        expensesIncurred: agg.expensesIncurred,
      });
    }
    return result;
  }

  reconcileExpensePaymentStatus(amount: string, amountPaid: string): ExpensePaymentStatus {
    const a = toPaise(amount);
    const p = toPaise(amountPaid);
    if (p <= 0) return ExpensePaymentStatus.UNPAID;
    if (p >= a) return ExpensePaymentStatus.PAID;
    return ExpensePaymentStatus.PARTIALLY_PAID;
  }

  sumPaise(values: string[]): number {
    return values.reduce((s, v) => s + toPaise(v), 0);
  }

  paiseToMoney(paise: number) {
    return fromPaise(paise);
  }
}
