import type { CreateExpenseInput, CreateExpensePaymentInput, CreateIncomeInput } from '@siteflow/shared';
import { api } from './client';
import type { Expense, ExpensePayment, IncomeTransaction, ListParams, Paginated, UnifiedTransaction } from '@/types/api';

export const financeApi = {
  listIncome: (params?: ListParams) =>
    api.get<Paginated<IncomeTransaction> | IncomeTransaction[]>('/income', params as never),

  getIncome: (id: string) => api.get<IncomeTransaction>(`/income/${id}`),

  createIncome: (payload: CreateIncomeInput) =>
    api.post<IncomeTransaction>('/income', payload),

  listExpenses: (params?: ListParams) =>
    api.get<Paginated<Expense> | Expense[]>('/expenses', params as never),

  getExpense: (id: string) => api.get<Expense>(`/expenses/${id}`),

  createExpense: (payload: CreateExpenseInput) =>
    api.post<Expense>('/expenses', payload),

  addExpensePayment: (expenseId: string, payload: CreateExpensePaymentInput) =>
    api.post<ExpensePayment>(`/expenses/${expenseId}/payments`, payload),

  /** Combined ledger when backend supports it; otherwise client merges income/expenses. */
  listTransactions: (params?: ListParams) =>
    api.get<Paginated<UnifiedTransaction> | UnifiedTransaction[]>('/transactions', params as never),
};
