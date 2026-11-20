import { api } from './client';
import type { ListParams, Paginated, Site, SiteFinancialSummary } from '@/types/api';
import type { CreateSiteInput } from '@siteflow/shared';

export const sitesApi = {
  list: (params?: ListParams) =>
    api.get<Paginated<Site> | Site[]>('/sites', params as Record<string, string | number | undefined>),

  get: (id: string) => api.get<Site>(`/sites/${id}`),

  summary: (id: string) => api.get<SiteFinancialSummary>(`/sites/${id}/summary`),

  create: (body: CreateSiteInput) => api.post<Site>('/sites', body),

  update: (id: string, body: Partial<CreateSiteInput>) => api.patch<Site>(`/sites/${id}`, body),
};
