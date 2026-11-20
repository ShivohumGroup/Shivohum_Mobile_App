import { api } from './client';
import type { AppNotification, ListParams, Paginated } from '@/types/api';

export const notificationsApi = {
  list: (params?: ListParams) =>
    api.get<Paginated<AppNotification> | AppNotification[]>('/notifications', params as never),

  markRead: (id: string) => api.patch<AppNotification>(`/notifications/${id}/read`, {}),

  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all', {}),
};
