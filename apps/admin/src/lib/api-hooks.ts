import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, downloadAuthenticated } from '@/lib/api';
import { buildQuery } from '@/lib/utils';
import type {
  ActivityLog,
  AuthTokens,
  AuthUser,
  Contact,
  DashboardSummary,
  Expense,
  ExpenseCategory,
  IncomeTransaction,
  NotificationItem,
  Paginated,
  ProgressUpdate,
  Site,
  TeamUser,
} from '@/types/api';
import type {
  ChangePasswordInput,
  CreateContactInput,
  CreateExpenseInput,
  CreateExpensePaymentInput,
  CreateIncomeInput,
  CreateProgressInput,
  CreateSiteInput,
  InviteUserInput,
  LoginInput,
} from './form-types';

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginInput) =>
      apiRequest<AuthTokens>('/auth/login', { method: 'POST', body, auth: false }),
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<AuthUser>('/auth/me'),
    enabled,
    retry: false,
  });
}

export function useDashboardSummary(filters: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () =>
      apiRequest<DashboardSummary>(`/dashboard/summary${buildQuery(filters)}`),
  });
}

export function useSites(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: () => apiRequest<Paginated<Site> | Site[]>(`/sites${buildQuery(params)}`),
  });
}

export function useSite(id: string) {
  return useQuery({
    queryKey: ['sites', id],
    queryFn: () => apiRequest<Site>(`/sites/${id}`),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSiteInput) =>
      apiRequest<Site>('/sites', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
}

export function useUpdateSite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CreateSiteInput>) =>
      apiRequest<Site>(`/sites/${id}`, { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sites'] });
      qc.invalidateQueries({ queryKey: ['sites', id] });
    },
  });
}

export function useArchiveSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/sites/${id}/archive`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
}

export function useIncome(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['income', params],
    queryFn: () =>
      apiRequest<Paginated<IncomeTransaction> | IncomeTransaction[]>(
        `/income${buildQuery(params)}`,
      ),
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateIncomeInput) =>
      apiRequest<IncomeTransaction>('/income', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['sites'] });
    },
  });
}

export function useVoidIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest(`/income/${id}/void`, { method: 'POST', body: { reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['income'] }),
  });
}

export function useExpenses(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () =>
      apiRequest<Paginated<Expense> | Expense[]>(`/expenses${buildQuery(params)}`),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => apiRequest<Expense>(`/expenses/${id}`),
    enabled: !!id,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExpenseInput) =>
      apiRequest<Expense>('/expenses', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddExpensePayment(expenseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExpensePaymentInput) =>
      apiRequest(`/expenses/${expenseId}/payments`, { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenses', expenseId] });
    },
  });
}

export function useVoidExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiRequest(`/expenses/${id}/void`, { method: 'POST', body: { reason } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiRequest<ExpenseCategory[] | Paginated<ExpenseCategory>>('/categories'),
  });
}

export function useContacts(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () =>
      apiRequest<Paginated<Contact> | Contact[]>(`/contacts${buildQuery(params)}`),
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContactInput) =>
      apiRequest<Contact>('/contacts', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CreateContactInput> & { isActive?: boolean }) =>
      apiRequest<Contact>(`/contacts/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
}

export function useProgress(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['progress', params],
    queryFn: () =>
      apiRequest<Paginated<ProgressUpdate> | ProgressUpdate[]>(
        `/progress${buildQuery(params)}`,
      ),
  });
}

export function useCreateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProgressInput) =>
      apiRequest<ProgressUpdate>('/progress', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<CreateProgressInput> & { id: string }) =>
      apiRequest<ProgressUpdate>(`/progress/${id}`, { method: 'PATCH', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
  });
}

export function useDeleteProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/progress/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
  });
}

export function useNotifications(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () =>
      apiRequest<Paginated<NotificationItem> | NotificationItem[]>(
        `/notifications${buildQuery(params)}`,
      ),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useActivity(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: () =>
      apiRequest<Paginated<ActivityLog> | ActivityLog[]>(`/activity${buildQuery(params)}`),
  });
}

export type AuditLogItem = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  reason?: string | null;
  createdAt: string;
  actor?: { id: string; fullName: string; email: string } | null;
};

export function useAuditLogs(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () =>
      apiRequest<Paginated<AuditLogItem> | AuditLogItem[]>(`/activity/audit${buildQuery(params)}`),
  });
}

export type Organization = {
  id: string;
  name: string;
  code: string;
  timezone: string;
  currency: string;
  isActive: boolean;
};

export function useOrganization() {
  return useQuery({
    queryKey: ['organization', 'me'],
    queryFn: () => apiRequest<Organization>('/organizations/me'),
  });
}

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<Organization, 'name' | 'timezone' | 'currency' | 'isActive'>>) =>
      apiRequest<Organization>('/organizations/me', { method: 'PATCH', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

export function useUsers(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () =>
      apiRequest<Paginated<TeamUser> | TeamUser[]>(`/users${buildQuery(params)}`),
  });
}

export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: InviteUserInput) =>
      apiRequest<TeamUser>('/users/invite', { method: 'POST', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: ChangePasswordInput) =>
      apiRequest('/auth/change-password', { method: 'POST', body }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (body: { email: string }) =>
      apiRequest('/auth/forgot-password', { method: 'POST', body, auth: false }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (body: { token: string; password: string }) =>
      apiRequest('/auth/reset-password', { method: 'POST', body, auth: false }),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST', body: {} });
      } catch {
        /* ignore network errors on logout */
      }
    },
  });
}

export async function exportReport(
  path: string,
  filename: string,
  params: Record<string, string | undefined> = {},
) {
  return downloadAuthenticated(path, filename, params);
}

/** Normalize list endpoints that may return array or paginated envelope */
export function unwrapList<T>(
  data: (Paginated<T> & { items?: T[] }) | T[] | undefined,
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? [];
}
