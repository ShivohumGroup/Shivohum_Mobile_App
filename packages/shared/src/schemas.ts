import { z } from 'zod';
import {
  ExpensePaymentStatus,
  PaymentMethod,
  ProjectStatus,
  ProjectType,
  ScheduleTaskStatus,
  TransactionStatus,
  UserRole,
} from './enums';

const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v.toFixed(2) : String(v ?? '').trim()))
  .refine((v) => v.length > 0, { message: 'Please enter amount' })
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), {
    message: 'Enter a valid amount (e.g. 1000 or 1000.50)',
  })
  .refine((v) => Number(v) > 0, { message: 'Amount must be greater than 0' });

const optionalMoneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v.toFixed(2) : String(v ?? '').trim()))
  .refine((v) => v.length === 0 || /^\d+(\.\d{1,2})?$/.test(v), {
    message: 'Enter a valid amount (e.g. 1000 or 1000.50)',
  })
  .refine((v) => v.length === 0 || Number(v) >= 0, {
    message: 'Amount cannot be negative',
  });

const phoneSchema = z
  .string()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[+\d][\d\s-]{6,18}$/, 'Enter a valid phone number');

const requiredUuid = (label: string) =>
  z
    .string()
    .min(1, `Please select ${label}`)
    .uuid({ message: `Please select ${label}` });

const optionalUuid = (label: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().uuid({ message: `Please select a valid ${label}` }).optional().nullable(),
  );

/** Optional phone that treats blank input as null */
const optionalPhoneSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  phoneSchema.optional().nullable(),
);

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Reset link is invalid or expired'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters').max(128),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

export const createSiteSchema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters').max(200),
  code: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(2).max(50).optional(),
  ),
  clientName: z.string().min(1, 'Client name is required').max(200),
  clientPhone: optionalPhoneSchema,
  address: z.string().min(1, 'Address is required').max(500),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  projectType: z.nativeEnum(ProjectType, { message: 'Please select project type' }),
  description: z.string().max(2000).optional().nullable(),
  contractAmount: moneySchema,
  agreedStartDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  expectedCompletionDate: z
    .string()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    })
    .optional()
    .nullable(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  projectManagerId: optionalUuid('project manager'),
  notes: z.string().max(5000).optional().nullable(),
});

export const updateSiteSchema = createSiteSchema.partial().extend({
  actualCompletionDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
});

export const createIncomeSchema = z.object({
  siteId: requiredUuid('a site'),
  clientId: optionalUuid('client'),
  amount: moneySchema,
  dateReceived: z
    .string()
    .min(1, 'Date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Please select payment method' }),
  referenceNumber: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  attachmentId: optionalUuid('attachment'),
});

export const voidTransactionSchema = z.object({
  reason: z.string().min(3, 'Please enter a reason (min 3 characters)').max(1000),
});

export const createExpenseSchema = z.object({
  siteId: requiredUuid('a site'),
  categoryId: requiredUuid('a category'),
  vendorId: optionalUuid('vendor'),
  contactId: optionalUuid('contact'),
  vendorName: z.string().max(200).optional().nullable(),
  amount: moneySchema,
  expenseDate: z
    .string()
    .min(1, 'Expense date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  attachmentId: optionalUuid('attachment'),
  initialPaymentAmount: optionalMoneySchema.optional(),
});

export const createExpensePaymentSchema = z.object({
  amount: moneySchema,
  paidAt: z
    .string()
    .min(1, 'Payment date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  paymentMethod: z.nativeEnum(PaymentMethod, { message: 'Please select payment method' }),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  attachmentId: optionalUuid('attachment'),
});

export const createContactSchema = z.object({
  siteIds: z.array(z.string().uuid({ message: 'Please select at least one site' })).min(1, 'Please select at least one site'),
  personName: z.string().min(1, 'Person name is required').max(200),
  companyName: z.string().max(200).optional().nullable(),
  workCategory: z.string().min(1, 'Work category is required').max(100),
  designation: z.string().max(100).optional().nullable(),
  primaryPhone: phoneSchema,
  alternatePhone: phoneSchema.optional().nullable(),
  whatsappNumber: phoneSchema.optional().nullable(),
  email: z.string().email('Enter a valid email').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const createProgressSchema = z.object({
  siteId: requiredUuid('a site'),
  updateDate: z
    .string()
    .min(1, 'Update date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  workCategory: z.string().max(100).optional().nullable(),
  completedWork: z.string().max(2000).optional().nullable(),
  workInProgress: z.string().max(2000).optional().nullable(),
  blockers: z.string().max(2000).optional().nullable(),
  nextDayPlan: z.string().max(2000).optional().nullable(),
  completionPercent: z
    .number({ invalid_type_error: 'Completion % must be a number' })
    .min(0, 'Completion % cannot be below 0')
    .max(100, 'Completion % cannot be above 100')
    .optional()
    .nullable(),
});

export const createScheduleTaskSchema = z.object({
  siteId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().uuid({ message: 'Please select a valid site' }).optional().nullable(),
  ),
  title: z.string().min(2, 'Task title is required').max(200),
  notes: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  scheduledDate: z
    .string()
    .min(1, 'Schedule date is required')
    .refine((v) => /^\d{4}-\d{2}-\d{2}/.test(v) || !Number.isNaN(Date.parse(v)), {
      message: 'Enter date as YYYY-MM-DD',
    }),
  status: z.nativeEnum(ScheduleTaskStatus).default(ScheduleTaskStatus.PLANNED),
  assigneeId: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().uuid().optional().nullable(),
  ),
});

export const updateScheduleTaskSchema = createScheduleTaskSchema.partial().extend({
  status: z.nativeEnum(ScheduleTaskStatus).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email').toLowerCase(),
  fullName: z.string().min(1, 'Full name is required').max(200),
  role: z.nativeEnum(UserRole, { message: 'Please select a role' }),
  phone: optionalPhoneSchema,
  siteIds: z.array(z.string().uuid({ message: 'Invalid site selected' })).default([]),
  password: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(8, 'Password must be at least 8 characters').max(128).optional(),
  ),
});

export const registerOrganizationSchema = z.object({
  organizationName: z.string().min(2, 'Organisation name must be at least 2 characters').max(200),
  organizationCode: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z
      .string()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/i, 'Use letters, numbers, hyphen or underscore')
      .optional(),
  ),
  fullName: z.string().min(1, 'Your name is required').max(200),
  email: z.string().min(1, 'Email is required').email('Enter a valid email').toLowerCase(),
  phone: optionalPhoneSchema,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const updateMembershipsSchema = z.object({
  siteIds: z.array(z.string().uuid()),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dashboardFilterSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  siteId: z.string().uuid().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateExpensePaymentInput = z.infer<typeof createExpensePaymentSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateProgressInput = z.infer<typeof createProgressSchema>;
export type CreateScheduleTaskInput = z.infer<typeof createScheduleTaskSchema>;
export type UpdateScheduleTaskInput = z.infer<typeof updateScheduleTaskSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type RegisterOrganizationInput = z.infer<typeof registerOrganizationSchema>;
export type UpdateMembershipsInput = z.infer<typeof updateMembershipsSchema>;
export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;

export {
  moneySchema,
  optionalMoneySchema,
  phoneSchema,
  TransactionStatus,
  ExpensePaymentStatus,
};
