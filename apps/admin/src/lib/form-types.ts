import type {
  changePasswordSchema,
  createContactSchema,
  createExpensePaymentSchema,
  createExpenseSchema,
  createIncomeSchema,
  createProgressSchema,
  createSiteSchema,
  inviteUserSchema,
  loginSchema,
} from '@siteflow/shared';
import type { z } from 'zod';

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateExpensePaymentInput = z.infer<typeof createExpensePaymentSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateProgressInput = z.infer<typeof createProgressSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
