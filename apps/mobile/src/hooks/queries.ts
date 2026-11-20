import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories';
import { contactsApi } from '@/api/contacts';
import { dashboardApi } from '@/api/dashboard';
import { financeApi } from '@/api/finance';
import { notificationsApi } from '@/api/notifications';
import { progressApi } from '@/api/progress';
import { scheduleApi } from '@/api/schedule';
import { sitesApi } from '@/api/sites';
import { normalizeSite, normalizeSiteSummary } from '@/lib/finance';
import { unwrapList } from '@/lib/utils';
import type { ListParams, UnifiedTransaction } from '@/types/api';

export const queryKeys = {
  dashboard: (params?: ListParams) => ['dashboard', params] as const,
  sites: (params?: ListParams) => ['sites', params] as const,
  site: (id: string) => ['site', id] as const,
  siteSummary: (id: string) => ['site-summary', id] as const,
  income: (params?: ListParams) => ['income', params] as const,
  expenses: (params?: ListParams) => ['expenses', params] as const,
  incomeOne: (id: string) => ['income', id] as const,
  expenseOne: (id: string) => ['expense', id] as const,
  contacts: (params?: ListParams) => ['contacts', params] as const,
  contact: (id: string) => ['contact', id] as const,
  progress: (params?: ListParams) => ['progress', params] as const,
  progressOne: (id: string) => ['progress', id] as const,
  schedule: (params?: ListParams & { status?: string }) => ['schedule', params] as const,
  scheduleOne: (id: string) => ['schedule', id] as const,
  notifications: (params?: ListParams) => ['notifications', params] as const,
  categories: ['categories'] as const,
};

export function useDashboard(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.dashboard(params),
    queryFn: () => dashboardApi.summary(params),
  });
}

export function useSites(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.sites(params),
    queryFn: async () => unwrapList(await sitesApi.list(params)).map(normalizeSite),
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: queryKeys.site(id),
    queryFn: async () => normalizeSite(await sitesApi.get(id)),
    enabled: !!id,
  });
}

export function useSiteSummary(id: string) {
  return useQuery({
    queryKey: queryKeys.siteSummary(id),
    queryFn: async () => normalizeSiteSummary(await sitesApi.summary(id)),
    enabled: !!id,
  });
}

export function useIncomeList(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.income(params),
    queryFn: async () => unwrapList(await financeApi.listIncome(params)),
  });
}

export function useExpensesList(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.expenses(params),
    queryFn: async () => unwrapList(await financeApi.listExpenses(params)),
  });
}

export function useMergedTransactions(params?: ListParams) {
  const incomeQ = useIncomeList(params);
  const expenseQ = useExpensesList(params);

  const items: UnifiedTransaction[] = [
    ...(incomeQ.data ?? []).map((i) => ({
      id: i.id,
      kind: 'INCOME' as const,
      siteId: i.siteId,
      siteName: i.site?.name,
      amount: i.amount,
      date: i.dateReceived,
      title: i.description || 'Client payment',
      subtitle: i.paymentMethod,
      status: i.status,
      paymentMethod: i.paymentMethod,
      referenceNumber: i.referenceNumber,
    })),
    ...(expenseQ.data ?? []).map((e) => ({
      id: e.id,
      kind: 'EXPENSE' as const,
      siteId: e.siteId,
      siteName: e.site?.name,
      amount: e.amount,
      amountPaid: e.amountPaid,
      date: e.expenseDate,
      title: e.description || e.category?.name || e.vendorName || 'Expense',
      subtitle: e.paymentStatus,
      status: e.paymentStatus,
      paymentMethod: e.paymentMethod,
      referenceNumber: e.referenceNumber,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    data: items,
    isLoading: incomeQ.isLoading || expenseQ.isLoading,
    isRefetching: incomeQ.isRefetching || expenseQ.isRefetching,
    error: incomeQ.error || expenseQ.error,
    refetch: async () => {
      await Promise.all([incomeQ.refetch(), expenseQ.refetch()]);
    },
  };
}

export function useContacts(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.contacts(params),
    queryFn: async () => unwrapList(await contactsApi.list(params)),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
  });
}

export function useProgressList(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.progress(params),
    queryFn: async () => unwrapList(await progressApi.list(params)),
  });
}

export function useProgress(id: string) {
  return useQuery({
    queryKey: queryKeys.progressOne(id),
    queryFn: () => progressApi.get(id),
    enabled: !!id,
  });
}

export function useScheduleList(params?: ListParams & { status?: string }) {
  return useQuery({
    queryKey: queryKeys.schedule(params),
    queryFn: async () => unwrapList(await scheduleApi.list(params)),
  });
}

export function useScheduleTask(id: string) {
  return useQuery({
    queryKey: queryKeys.scheduleOne(id),
    queryFn: () => scheduleApi.get(id),
    enabled: !!id,
  });
}

export function useNotifications(params?: ListParams) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: async () => unwrapList(await notificationsApi.list(params)),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const data = await categoriesApi.list();
      return Array.isArray(data) ? data : data.items ?? [];
    },
  });
}
