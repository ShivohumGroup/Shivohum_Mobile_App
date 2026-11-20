import { api } from './client';
import type { AuthUser, LoginResponse } from '@/types/api';
import type { RegisterOrganizationInput } from '@siteflow/shared';

export const authApi = {
  registerOrganization: (body: RegisterOrganizationInput) =>
    api.post<
      LoginResponse & {
        organization: { id: string; name: string; code: string };
      }
    >('/auth/register-organization', body, false),

  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }, false),

  refresh: (refreshToken: string) =>
    api.post<LoginResponse>('/auth/refresh', { refreshToken }, false),

  logout: (refreshToken?: string | null) =>
    api.post<void>('/auth/logout', refreshToken ? { refreshToken } : {}),

  me: () => api.get<AuthUser>('/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }, false),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }, false),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),
};
