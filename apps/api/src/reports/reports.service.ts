import { Injectable } from '@nestjs/common';
import { ActivityType, TransactionStatus } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  addMoney,
  formatDateIst,
  formatInr,
  monthLabel,
  monthRangeIst,
  yearRangeIst,
} from '@siteflow/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { FinanceCalcService } from '../finance/finance-calc.service';
import { ActivityService } from '../activity/activity.service';
import { AuthUser } from '../auth/types';
import { decimalToString } from '../common/utils/money.util';

function sanitizeCell(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  const str = String(value);
  // Prevent formula injection in spreadsheets
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private access: AccessService,
    private finance: FinanceCalcService,
    private activity: ActivityService,
  ) {}

  async siteWise(user: AuthUser, year?: number) {
    const accessible = await this.access.getAccessibleSiteIds(user);
    const y = year || new Date().getFullYear();
    const sites =
      accessible === 'ALL'
        ? await this.prisma.site.findMany({
            where: { organizationId: user.organizationId, archivedAt: null },
          })
        : await this.prisma.site.findMany({
            where: { organizationId: user.organizationId, id: { in: accessible } },
          });

    const rows = await Promise.all(
      sites.map(async (s) => {
        const fin = await this.finance.siteFinancialSummary(user.organizationId, s.id);
        return {
          ...fin,
          siteId: s.id,
          siteName: s.name,
          code: s.code,
          status: s.status,
          year: y,
        };
      }),
    );

    await this.logReport(user, 'Site-wise financial report');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year: y },
      rows,
    };
  }

  async monthlyIncome(user: AuthUser, year: number, siteId?: string) {
    const siteIds = await this.resolveSites(user, siteId);
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const { start, end } = monthRangeIst(year, m);
      const agg = await this.finance.aggregateForSites(user.organizationId, siteIds, {
        incomeFrom: start,
        incomeTo: end,
      });
      months.push({
        month: m,
        label: monthLabel(m),
        income: agg.totalReceived,
      });
    }
    await this.logReport(user, 'Monthly income report');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year, siteId: siteId || null },
      reportingBasis: 'Income filtered by date received',
      months,
      yearTotal: months.reduce((sum, m) => addMoney(sum, m.income), '0.00'),
    };
  }

  async monthlyExpense(user: AuthUser, year: number, siteId?: string) {
    const siteIds = await this.resolveSites(user, siteId);
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const { start, end } = monthRangeIst(year, m);
      const agg = await this.finance.aggregateForSites(user.organizationId, siteIds, {
        expenseFrom: start,
        expenseTo: end,
        paymentFrom: start,
        paymentTo: end,
      });
      months.push({
        month: m,
        label: monthLabel(m),
        expensesIncurred: agg.expensesIncurred,
        expensesPaid: agg.expensesPaid,
      });
    }
    await this.logReport(user, 'Monthly expense report');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year, siteId: siteId || null },
      reportingBasis: {
        incurred: 'Expense date',
        paid: 'Payment date',
      },
      months,
    };
  }

  async yearlySummary(user: AuthUser, year: number, siteId?: string) {
    const siteIds = await this.resolveSites(user, siteId);
    const { start, end } = yearRangeIst(year);
    const agg = await this.finance.aggregateForSites(user.organizationId, siteIds, {
      incomeFrom: start,
      incomeTo: end,
      expenseFrom: start,
      expenseTo: end,
      paymentFrom: start,
      paymentTo: end,
    });
    const monthly = await this.finance.monthlySeries(user.organizationId, siteIds, year);
    await this.logReport(user, 'Yearly financial summary');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year, siteId: siteId || null },
      summary: agg,
      monthly,
    };
  }

  async ledger(
    user: AuthUser,
    query: { siteId?: string; from?: string; to?: string; page?: number; pageSize?: number },
  ) {
    const base = await this.access.siteWhereFilter(user, query.siteId);
    const dateFilter = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };

    const [income, expenses] = await Promise.all([
      this.prisma.incomeTransaction.findMany({
        where: {
          ...base,
          ...(query.from || query.to ? { dateReceived: dateFilter } : {}),
        },
        include: { site: { select: { name: true, code: true } } },
        orderBy: { dateReceived: 'asc' },
      }),
      this.prisma.expense.findMany({
        where: {
          ...base,
          ...(query.from || query.to ? { expenseDate: dateFilter } : {}),
        },
        include: {
          site: { select: { name: true, code: true } },
          category: { select: { name: true } },
        },
        orderBy: { expenseDate: 'asc' },
      }),
    ]);

    const rows = [
      ...income.map((i) => ({
        id: i.id,
        type: 'INCOME',
        date: i.dateReceived,
        site: i.site.name,
        description: i.description || 'Client payment',
        amount: decimalToString(i.amount),
        status: i.status,
        method: i.paymentMethod,
      })),
      ...expenses.map((e) => ({
        id: e.id,
        type: 'EXPENSE',
        date: e.expenseDate,
        site: e.site.name,
        description: e.description || e.category.name,
        amount: decimalToString(e.amount),
        status: e.status,
        method: e.paymentMethod,
        paymentStatus: e.paymentStatus,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await this.logReport(user, 'Transaction ledger');
    return {
      generatedAt: new Date().toISOString(),
      filters: query,
      rows,
    };
  }

  async expenseCategoryReport(user: AuthUser, year?: number, siteId?: string) {
    const y = year || new Date().getFullYear();
    const { start, end } = yearRangeIst(y);
    const base = await this.access.siteWhereFilter(user, siteId);
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...base,
        status: TransactionStatus.CONFIRMED,
        expenseDate: { gte: start, lte: end },
      },
      include: { category: { select: { id: true, name: true } } },
    });

    const map = new Map<
      string,
      { categoryId: string; category: string; incurred: string; paid: string; count: number }
    >();
    for (const e of expenses) {
      const key = e.categoryId;
      const current = map.get(key) || {
        categoryId: e.categoryId,
        category: e.category.name,
        incurred: '0.00',
        paid: '0.00',
        count: 0,
      };
      current.incurred = addMoney(current.incurred, decimalToString(e.amount));
      current.paid = addMoney(current.paid, decimalToString(e.amountPaid));
      current.count += 1;
      map.set(key, current);
    }

    await this.logReport(user, 'Expense category report');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year: y, siteId: siteId || null },
      reportingBasis: 'Expense incurred filtered by expense date',
      rows: [...map.values()].sort((a, b) => a.category.localeCompare(b.category)),
    };
  }

  async siteComparison(user: AuthUser, year?: number) {
    const report = await this.siteWise(user, year);
    await this.logReport(user, 'Site comparison report');
    return {
      generatedAt: new Date().toISOString(),
      filters: report.filters,
      rows: report.rows.map((r) => ({
        siteName: r.siteName,
        code: r.code,
        status: r.status,
        contractAmount: r.contractAmount,
        totalReceived: r.totalReceived,
        expensesIncurred: r.expensesIncurred,
        expensesPaid: r.expensesPaid,
        netCashBalance: r.netCashBalance,
        estimatedMargin: r.estimatedMargin,
        clientOutstanding: r.clientOutstanding,
        supplierOutstanding: r.supplierOutstanding,
      })),
    };
  }

  async profitability(user: AuthUser, year?: number, siteId?: string) {
    const report = await this.siteWise(user, year);
    const rows = report.rows
      .filter((r) => !siteId || r.siteId === siteId)
      .map((r) => ({
        siteName: r.siteName,
        code: r.code,
        contractAmount: r.contractAmount,
        expensesIncurred: r.expensesIncurred,
        estimatedMargin: r.estimatedMargin,
        marginNote:
          'Estimated project margin = contract value − confirmed expenses incurred (not cash)',
      }));
    await this.logReport(user, 'Project profitability estimate');
    return {
      generatedAt: new Date().toISOString(),
      filters: { year: report.filters.year, siteId: siteId || null },
      rows,
    };
  }

  async outstandingClients(user: AuthUser) {
    const report = await this.siteWise(user);
    return {
      generatedAt: new Date().toISOString(),
      rows: report.rows
        .filter((r) => r.clientOutstanding !== '0.00')
        .map((r) => ({
          siteName: r.siteName,
          code: r.code,
          contractAmount: r.contractAmount,
          totalReceived: r.totalReceived,
          outstanding: r.clientOutstanding,
          overpayment: r.clientOverpayment,
        })),
    };
  }

  async outstandingVendors(user: AuthUser, siteId?: string) {
    const base = await this.access.siteWhereFilter(user, siteId);
    const expenses = await this.prisma.expense.findMany({
      where: {
        ...base,
        status: TransactionStatus.CONFIRMED,
        paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: {
        site: { select: { name: true, code: true } },
        category: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
    await this.logReport(user, 'Vendor outstanding report');
    return {
      generatedAt: new Date().toISOString(),
      rows: expenses.map((e) => ({
        id: e.id,
        site: e.site.name,
        vendor: e.vendorName || 'Unknown',
        category: e.category.name,
        amount: decimalToString(e.amount),
        amountPaid: decimalToString(e.amountPaid),
        outstanding: decimalToString(
          // simple
          Number(decimalToString(e.amount)) - Number(decimalToString(e.amountPaid)),
        ),
        paymentStatus: e.paymentStatus,
      })),
    };
  }

  async exportExcel(user: AuthUser, kind: string, year?: number, siteId?: string) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SiteFlow';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Report');

    if (kind === 'site-wise') {
      const data = await this.siteWise(user, year);
      sheet.columns = [
        { header: 'Site', key: 'siteName', width: 28 },
        { header: 'Code', key: 'code', width: 12 },
        { header: 'Contract', key: 'contractAmount', width: 14 },
        { header: 'Received', key: 'totalReceived', width: 14 },
        { header: 'Expenses Incurred', key: 'expensesIncurred', width: 16 },
        { header: 'Expenses Paid', key: 'expensesPaid', width: 14 },
        { header: 'Client Outstanding', key: 'clientOutstanding', width: 16 },
        { header: 'Net Cash', key: 'netCashBalance', width: 14 },
        { header: 'Est. Margin', key: 'estimatedMargin', width: 14 },
      ];
      for (const row of data.rows) {
        sheet.addRow({
          siteName: sanitizeCell(row.siteName),
          code: sanitizeCell(row.code),
          contractAmount: sanitizeCell(row.contractAmount),
          totalReceived: sanitizeCell(row.totalReceived),
          expensesIncurred: sanitizeCell(row.expensesIncurred),
          expensesPaid: sanitizeCell(row.expensesPaid),
          clientOutstanding: sanitizeCell(row.clientOutstanding),
          netCashBalance: sanitizeCell(row.netCashBalance),
          estimatedMargin: sanitizeCell(row.estimatedMargin),
        });
      }
    } else if (kind === 'ledger') {
      const data = await this.ledger(user, { siteId });
      sheet.columns = [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Site', key: 'site', width: 24 },
        { header: 'Description', key: 'description', width: 36 },
        { header: 'Amount', key: 'amount', width: 14 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      for (const row of data.rows) {
        sheet.addRow({
          date: sanitizeCell(formatDateIst(row.date)),
          type: sanitizeCell(row.type),
          site: sanitizeCell(row.site),
          description: sanitizeCell(row.description),
          amount: sanitizeCell(row.amount),
          status: sanitizeCell(row.status),
        });
      }
    } else {
      const data = await this.yearlySummary(user, year || new Date().getFullYear(), siteId);
      sheet.columns = [
        { header: 'Month', key: 'month', width: 12 },
        { header: 'Income', key: 'income', width: 14 },
        { header: 'Expenses Paid', key: 'expensesPaid', width: 14 },
        { header: 'Expenses Incurred', key: 'expensesIncurred', width: 16 },
      ];
      for (const row of data.monthly) {
        sheet.addRow({
          month: sanitizeCell(monthLabel(row.month)),
          income: sanitizeCell(row.income),
          expensesPaid: sanitizeCell(row.expensesPaid),
          expensesIncurred: sanitizeCell(row.expensesIncurred),
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(user: AuthUser, kind: string, year?: number, siteId?: string): Promise<Buffer> {
    const data =
      kind === 'site-wise'
        ? await this.siteWise(user, year)
        : await this.yearlySummary(user, year || new Date().getFullYear(), siteId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('SiteFlow Report', { align: 'left' });
      doc.fontSize(10).fillColor('#444').text(`Generated: ${formatDateIst(new Date())}`);
      doc.moveDown();

      if ('rows' in data) {
        for (const row of data.rows.slice(0, 40)) {
          doc
            .fillColor('#000')
            .fontSize(11)
            .text(
              `${row.siteName} (${row.code}) — Contract ${formatInr(row.contractAmount)} | Received ${formatInr(row.totalReceived)} | Net ${formatInr(row.netCashBalance)}`,
            );
          doc.moveDown(0.3);
        }
      } else {
        doc.fontSize(12).text(`Year ${year} summary`);
        doc.text(`Income: ${formatInr(data.summary.totalReceived)}`);
        doc.text(`Expenses paid: ${formatInr(data.summary.expensesPaid)}`);
        doc.text(`Net cash: ${formatInr(data.summary.netCashBalance)}`);
      }

      doc.end();
    });
  }

  private async resolveSites(user: AuthUser, siteId?: string): Promise<string[] | 'ALL'> {
    if (siteId) {
      await this.access.assertSiteAccess(user, siteId);
      return [siteId];
    }
    return this.access.getAccessibleSiteIds(user);
  }

  private async logReport(user: AuthUser, name: string) {
    await this.activity.log({
      organizationId: user.organizationId,
      actorId: user.id,
      type: ActivityType.REPORT_GENERATED,
      summary: `Report generated: ${name}`,
    });
  }
}
