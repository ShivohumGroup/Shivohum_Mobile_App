import type { Site, SiteFinancialSummary } from '@/types/api';

type FinancialLike = {
  totalReceived?: string | number;
  totalExpensesPaid?: string | number;
  totalExpensesIncurred?: string | number;
  expensesPaid?: string | number;
  expensesIncurred?: string | number;
  netCash?: string | number;
  netCashBalance?: string | number;
  availableAmount?: string | number;
  outstanding?: string | number;
  clientOutstanding?: string | number;
  overpayment?: string | number;
  clientOverpayment?: string | number;
  expensesOutstanding?: string | number;
  supplierOutstanding?: string | number;
  margin?: string | number;
  estimatedMargin?: string | number;
  contractAmount?: string | number;
  incomeCount?: number;
  expenseCount?: number;
};

/** Flatten nested API financials onto the shape mobile screens expect. */
export function normalizeSiteFinancials<T extends FinancialLike & { financials?: FinancialLike }>(
  raw: T,
): T & {
  totalReceived: string | number;
  totalExpensesPaid: string | number;
  totalExpensesIncurred: string | number;
  netCash: string | number;
  availableAmount: string | number;
  outstanding: string | number;
} {
  const fin = raw.financials ?? raw;
  const totalReceived = raw.totalReceived ?? fin.totalReceived ?? 0;
  const totalExpensesPaid =
    raw.totalExpensesPaid ?? fin.totalExpensesPaid ?? fin.expensesPaid ?? 0;
  const totalExpensesIncurred =
    raw.totalExpensesIncurred ?? fin.totalExpensesIncurred ?? fin.expensesIncurred ?? 0;
  const netCash =
    raw.netCash ?? raw.availableAmount ?? fin.netCash ?? fin.netCashBalance ?? fin.availableAmount ?? 0;
  const outstanding = raw.outstanding ?? fin.outstanding ?? fin.clientOutstanding ?? 0;

  return {
    ...raw,
    totalReceived,
    totalExpensesPaid,
    totalExpensesIncurred,
    netCash,
    availableAmount: raw.availableAmount ?? fin.availableAmount ?? netCash,
    outstanding,
    overpayment: raw.overpayment ?? fin.overpayment ?? fin.clientOverpayment ?? 0,
    expensesOutstanding:
      raw.expensesOutstanding ?? fin.expensesOutstanding ?? fin.supplierOutstanding ?? 0,
    margin: raw.margin ?? fin.margin ?? fin.estimatedMargin ?? 0,
  };
}

export function normalizeSite(site: Site & { financials?: FinancialLike }): Site {
  return normalizeSiteFinancials(site) as Site;
}

export function normalizeSiteSummary(raw: SiteFinancialSummary & FinancialLike): SiteFinancialSummary {
  const n = normalizeSiteFinancials(raw);
  return {
    siteId: raw.siteId,
    contractAmount: raw.contractAmount ?? n.contractAmount ?? 0,
    totalReceived: n.totalReceived,
    outstanding: n.outstanding,
    overpayment: (n.overpayment as string | number) ?? 0,
    totalExpensesIncurred: n.totalExpensesIncurred,
    totalExpensesPaid: n.totalExpensesPaid,
    expensesOutstanding: (n.expensesOutstanding as string | number) ?? 0,
    netCash: n.netCash,
    margin: (n.margin as string | number) ?? 0,
    incomeCount: raw.incomeCount ?? 0,
    expenseCount: raw.expenseCount ?? 0,
  };
}
