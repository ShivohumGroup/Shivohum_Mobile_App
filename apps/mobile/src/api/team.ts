import type { UserRole } from '@siteflow/shared';
import { api } from './client';
import type { Paginated } from '@/types/api';

export type TeamMembership = {
  id?: string;
  siteId: string;
  canViewFinance?: boolean;
  canEditFinance?: boolean;
  site?: { id: string; name: string; code: string };
};

export type TeamUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  memberships?: TeamMembership[];
  temporaryPassword?: string;
};

export const teamApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    api.get<Paginated<TeamUser> | TeamUser[]>(
      '/users',
      params as Record<string, string | number | undefined>,
    ),

  get: (id: string) => api.get<TeamUser>(`/users/${id}`),

  invite: (body: {
    email: string;
    fullName: string;
    role: UserRole;
    phone?: string | null;
    siteIds?: string[];
    password?: string;
  }) => api.post<TeamUser>('/users/invite', body),

  setMemberships: (id: string, siteIds: string[]) =>
    api.patch<TeamUser>(`/users/${id}/memberships`, { siteIds }),

  activate: (id: string) => api.patch<TeamUser>(`/users/${id}/activate`),

  deactivate: (id: string) => api.patch<TeamUser>(`/users/${id}/deactivate`),
};
