import { api } from './client';
import type { ListParams, Paginated, ScheduleTask } from '@/types/api';
import type { CreateScheduleTaskInput, UpdateScheduleTaskInput } from '@siteflow/shared';

export const scheduleApi = {
  list: (params?: ListParams & { status?: string }) =>
    api.get<Paginated<ScheduleTask> | ScheduleTask[]>(
      '/schedule',
      params as Record<string, string | number | undefined>,
    ),

  get: (id: string) => api.get<ScheduleTask>(`/schedule/${id}`),

  create: (body: CreateScheduleTaskInput) => api.post<ScheduleTask>('/schedule', body),

  update: (id: string, body: UpdateScheduleTaskInput) =>
    api.patch<ScheduleTask>(`/schedule/${id}`, body),

  remove: (id: string) => api.delete<{ success: boolean }>(`/schedule/${id}`),
};
