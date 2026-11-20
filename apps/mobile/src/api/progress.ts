import type { CreateProgressInput } from '@siteflow/shared';
import { api } from './client';
import type { ListParams, Paginated, ProgressPhoto, ProgressUpdate } from '@/types/api';

export const progressApi = {
  list: (params?: ListParams) =>
    api.get<Paginated<ProgressUpdate> | ProgressUpdate[]>('/progress', params as never),

  get: (id: string) => api.get<ProgressUpdate>(`/progress/${id}`),

  create: (payload: CreateProgressInput) => api.post<ProgressUpdate>('/progress', payload),

  update: (id: string, payload: Partial<CreateProgressInput>) =>
    api.patch<ProgressUpdate>(`/progress/${id}`, payload),

  remove: (id: string) => api.delete<void>(`/progress/${id}`),

  uploadPhoto: async (progressId: string, uri: string, fileName: string, mimeType: string, caption?: string) => {
    const form = new FormData();
    form.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    if (caption) form.append('caption', caption);
    return api.upload<ProgressPhoto>(`/progress/${progressId}/photos`, form);
  },
};
