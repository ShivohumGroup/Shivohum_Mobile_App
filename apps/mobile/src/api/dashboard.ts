import { api } from './client';
import { normalizeSite } from '@/lib/finance';
import type { DashboardSummary, ListParams, Site, UnifiedTransaction } from '@/types/api';

type RawDashboard = DashboardSummary & {
  summary?: Record<string, string | number>;
  siteComparisons?: Site[];
  monthly?: Array<{ month: number; income: string | number; expensesPaid?: string | number; expense?: string | number }>;
  recentProgress?: DashboardSummary['latestProgress'];
};

export const dashboardApi = {
  summary: async (params?: ListParams): Promise<DashboardSummary> => {
    const raw = await api.get<RawDashboard>('/dashboard/summary', params as never);
    const nested = raw.summary ?? {};
    const sites = (raw.sites ?? raw.siteComparisons ?? []).map((s) => normalizeSite(s as Site));
    const monthlySource = raw.monthlySeries ?? raw.monthly ?? [];

    return {
      ...raw,
      activeSites: Number(raw.activeSites ?? nested.activeSites ?? 0),
      totalSites: Number(raw.totalSites ?? nested.totalSites ?? sites.length),
      contractValue: raw.contractValue ?? nested.contractValue ?? nested.totalContractValue ?? 0,
      totalReceived: raw.totalReceived ?? nested.totalReceived ?? 0,
      totalExpensesPaid:
        raw.totalExpensesPaid ?? nested.totalExpensesPaid ?? nested.expensesPaid ?? 0,
      totalExpensesIncurred:
        raw.totalExpensesIncurred ?? nested.totalExpensesIncurred ?? nested.expensesIncurred ?? 0,
      netCash: raw.netCash ?? nested.netCash ?? nested.netCashBalance ?? 0,
      outstanding: raw.outstanding ?? nested.outstanding ?? nested.clientOutstanding ?? 0,
      monthIncome: raw.monthIncome ?? nested.monthIncome ?? 0,
      monthExpenses: raw.monthExpenses ?? nested.monthExpenses ?? 0,
      monthlySeries: monthlySource.map((m) => ({
        month: m.month,
        label: (m as { label?: string }).label,
        income: m.income,
        expense: m.expense ?? m.expensesPaid ?? 0,
      })),
      sites,
      recentTransactions: (raw.recentTransactions ?? []) as UnifiedTransaction[],
      latestProgress: raw.latestProgress ?? raw.recentProgress ?? [],
    };
  },
};
