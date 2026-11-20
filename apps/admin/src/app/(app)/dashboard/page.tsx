'use client';

import {
  CategoryPieChart,
  IncomeExpenseChart,
  SitesStatusChart,
} from '@/components/charts/dashboard-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/lib/api-hooks';
import { getErrorMessage } from '@/lib/utils';
import { formatInr, getIstYearMonth, monthLabel } from '@siteflow/shared';
import {
  Banknote,
  Building2,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SummaryCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  icon: typeof Building2;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-1 text-xl font-semibold text-navy">{value}</div>
          {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}

type ApiDashboard = {
  summary?: {
    activeSites?: number;
    totalSites?: number;
    totalContractValue?: string | number;
    totalReceived?: string | number;
    expensesPaid?: string | number;
    expensesIncurred?: string | number;
    clientOutstanding?: string | number;
    supplierOutstanding?: string | number;
    netCashBalance?: string | number;
  };
  monthly?: Array<{
    month: number;
    income: string;
    expensesPaid: string;
    expensesIncurred: string;
  }>;
  categories?: Array<{ categoryName: string; amount: string }>;
  siteComparisons?: Array<{ status: string }>;
  recentActivity?: Array<{
    id: string;
    summary: string;
    actor?: { fullName?: string } | null;
    site?: { name?: string } | null;
  }>;
  // legacy flat shape fallbacks
  activeSites?: number;
  sitesCount?: number;
  totalContractValue?: string | number;
  totalReceived?: string | number;
  totalExpensesPaid?: string | number;
  outstandingReceivables?: string | number;
  netCash?: string | number;
};

function normalizeDashboard(raw: ApiDashboard) {
  const s = raw.summary || {};
  const siteComparisons = raw.siteComparisons || [];
  const statusCounts = new Map<string, number>();
  for (const site of siteComparisons) {
    statusCounts.set(site.status, (statusCounts.get(site.status) || 0) + 1);
  }

  return {
    activeSites: s.activeSites ?? raw.activeSites ?? 0,
    sitesCount: s.totalSites ?? raw.sitesCount ?? 0,
    totalContractValue: s.totalContractValue ?? raw.totalContractValue ?? 0,
    totalReceived: s.totalReceived ?? raw.totalReceived ?? 0,
    totalExpensesPaid: s.expensesPaid ?? raw.totalExpensesPaid ?? 0,
    outstandingReceivables: s.clientOutstanding ?? raw.outstandingReceivables ?? 0,
    netCash: s.netCashBalance ?? raw.netCash ?? 0,
    monthlyIncome: (raw.monthly || []).map((m) => ({
      month: monthLabel(m.month),
      amount: Number(m.income),
    })),
    monthlyExpenses: (raw.monthly || []).map((m) => ({
      month: monthLabel(m.month),
      amount: Number(m.expensesPaid),
    })),
    expensesByCategory: (raw.categories || []).map((c) => ({
      category: c.categoryName,
      amount: Number(c.amount),
    })),
    sitesByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    })),
    recentActivity: raw.recentActivity || [],
  };
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const now = getIstYearMonth();
  const year = Number(searchParams.get('year') || now.year);
  const monthParam = searchParams.get('month');
  const month = monthParam ? Number(monthParam) : undefined;
  const siteId = searchParams.get('siteId') || undefined;
  const status = searchParams.get('status') || undefined;

  const { data, isLoading, isError, error } = useDashboardSummary({
    year,
    // Only send month when explicitly chosen; yearly seed data spans many months
    ...(month ? { month } : {}),
    siteId,
    status,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-red-600">
          Failed to load dashboard: {getErrorMessage(error)}
        </CardContent>
      </Card>
    );
  }

  const summary = normalizeDashboard((data || {}) as ApiDashboard);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Portfolio overview for {month ? `${month}/` : ''}
          {year} (Asia/Kolkata)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Active sites"
          value={`${summary.activeSites} / ${summary.sitesCount}`}
          icon={Building2}
          hint="Active / total"
        />
        <SummaryCard
          title="Contract value"
          value={formatInr(summary.totalContractValue)}
          icon={CircleDollarSign}
        />
        <SummaryCard
          title="Received"
          value={formatInr(summary.totalReceived)}
          icon={TrendingUp}
        />
        <SummaryCard
          title="Expenses paid"
          value={formatInr(summary.totalExpensesPaid)}
          icon={TrendingDown}
        />
        <SummaryCard
          title="Outstanding receivables"
          value={formatInr(summary.outstandingReceivables)}
          icon={Banknote}
        />
        <SummaryCard
          title="Net cash"
          value={formatInr(summary.netCash)}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <IncomeExpenseChart income={summary.monthlyIncome} expenses={summary.monthlyExpenses} />
        <CategoryPieChart data={summary.expensesByCategory} />
      </div>

      <SitesStatusChart data={summary.sitesByStatus} />

      {summary.recentActivity.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentActivity.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 border-b border-surface-border pb-3 last:border-0"
              >
                <div>
                  <div className="text-sm font-medium text-navy">{item.summary}</div>
                  <div className="text-xs text-slate-500">
                    {item.actor?.fullName || 'System'}
                    {item.site?.name ? ` · ${item.site.name}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
