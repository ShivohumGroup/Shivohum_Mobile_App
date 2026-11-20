import { api } from './client';
import type { ExpenseCategory } from '@/types/api';

export const categoriesApi = {
  list: () => api.get<ExpenseCategory[] | { items: ExpenseCategory[] }>('/categories'),
};
