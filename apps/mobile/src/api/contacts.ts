import type { CreateContactInput } from '@siteflow/shared';
import { api } from './client';
import type { Contact, ListParams, Paginated } from '@/types/api';

export const contactsApi = {
  list: (params?: ListParams) =>
    api.get<Paginated<Contact> | Contact[]>('/contacts', params as never),

  get: (id: string) => api.get<Contact>(`/contacts/${id}`),

  create: (payload: CreateContactInput) => api.post<Contact>('/contacts', payload),

  update: (id: string, payload: Partial<CreateContactInput> & { isActive?: boolean }) =>
    api.patch<Contact>(`/contacts/${id}`, payload),
};
