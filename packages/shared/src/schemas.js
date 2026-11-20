"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpensePaymentStatus = exports.TransactionStatus = exports.phoneSchema = exports.optionalMoneySchema = exports.moneySchema = exports.dashboardFilterSchema = exports.paginationSchema = exports.inviteUserSchema = exports.createProgressSchema = exports.updateContactSchema = exports.createContactSchema = exports.createExpensePaymentSchema = exports.createExpenseSchema = exports.voidTransactionSchema = exports.createIncomeSchema = exports.updateSiteSchema = exports.createSiteSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("./enums");
Object.defineProperty(exports, "ExpensePaymentStatus", { enumerable: true, get: function () { return enums_1.ExpensePaymentStatus; } });
Object.defineProperty(exports, "TransactionStatus", { enumerable: true, get: function () { return enums_1.TransactionStatus; } });
const moneySchema = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform((v) => (typeof v === 'number' ? v.toFixed(2) : v.trim()))
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
    message: 'Amount must be a positive number with up to 2 decimals',
});
exports.moneySchema = moneySchema;
const optionalMoneySchema = zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .transform((v) => (typeof v === 'number' ? v.toFixed(2) : v.trim()))
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) >= 0, {
    message: 'Amount must be a non-negative number with up to 2 decimals',
});
exports.optionalMoneySchema = optionalMoneySchema;
const phoneSchema = zod_1.z
    .string()
    .min(7)
    .max(20)
    .regex(/^[+\d][\d\s-]{6,18}$/, 'Invalid phone number');
exports.phoneSchema = phoneSchema;
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    password: zod_1.z.string().min(8).max(128),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(20),
    password: zod_1.z.string().min(8).max(128),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(8).max(128),
    newPassword: zod_1.z.string().min(8).max(128),
});
exports.createSiteSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(200),
    code: zod_1.z.string().min(2).max(50).optional(),
    clientName: zod_1.z.string().min(1).max(200),
    clientPhone: phoneSchema.optional().nullable(),
    address: zod_1.z.string().min(1).max(500),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(1).max(100),
    projectType: zod_1.z.nativeEnum(enums_1.ProjectType),
    description: zod_1.z.string().max(2000).optional().nullable(),
    contractAmount: moneySchema,
    agreedStartDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    expectedCompletionDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
    status: zod_1.z.nativeEnum(enums_1.ProjectStatus).default(enums_1.ProjectStatus.PLANNING),
    projectManagerId: zod_1.z.string().uuid().optional().nullable(),
    notes: zod_1.z.string().max(5000).optional().nullable(),
});
exports.updateSiteSchema = exports.createSiteSchema.partial().extend({
    actualCompletionDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
});
exports.createIncomeSchema = zod_1.z.object({
    siteId: zod_1.z.string().uuid(),
    clientId: zod_1.z.string().uuid().optional().nullable(),
    amount: moneySchema,
    dateReceived: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    paymentMethod: zod_1.z.nativeEnum(enums_1.PaymentMethod),
    referenceNumber: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(1000).optional().nullable(),
    attachmentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.voidTransactionSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).max(1000),
});
exports.createExpenseSchema = zod_1.z.object({
    siteId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid(),
    vendorId: zod_1.z.string().uuid().optional().nullable(),
    contactId: zod_1.z.string().uuid().optional().nullable(),
    vendorName: zod_1.z.string().max(200).optional().nullable(),
    amount: moneySchema,
    expenseDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    paymentMethod: zod_1.z.nativeEnum(enums_1.PaymentMethod).optional().nullable(),
    referenceNumber: zod_1.z.string().max(100).optional().nullable(),
    description: zod_1.z.string().max(1000).optional().nullable(),
    notes: zod_1.z.string().max(2000).optional().nullable(),
    attachmentId: zod_1.z.string().uuid().optional().nullable(),
    initialPaymentAmount: optionalMoneySchema.optional(),
});
exports.createExpensePaymentSchema = zod_1.z.object({
    amount: moneySchema,
    paidAt: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    paymentMethod: zod_1.z.nativeEnum(enums_1.PaymentMethod),
    referenceNumber: zod_1.z.string().max(100).optional().nullable(),
    notes: zod_1.z.string().max(1000).optional().nullable(),
    attachmentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.createContactSchema = zod_1.z.object({
    siteIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    personName: zod_1.z.string().min(1).max(200),
    companyName: zod_1.z.string().max(200).optional().nullable(),
    workCategory: zod_1.z.string().min(1).max(100),
    designation: zod_1.z.string().max(100).optional().nullable(),
    primaryPhone: phoneSchema,
    alternatePhone: phoneSchema.optional().nullable(),
    whatsappNumber: phoneSchema.optional().nullable(),
    email: zod_1.z.string().email().optional().nullable().or(zod_1.z.literal('')),
    address: zod_1.z.string().max(500).optional().nullable(),
    notes: zod_1.z.string().max(2000).optional().nullable(),
});
exports.updateContactSchema = exports.createContactSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
exports.createProgressSchema = zod_1.z.object({
    siteId: zod_1.z.string().uuid(),
    updateDate: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(5000),
    workCategory: zod_1.z.string().max(100).optional().nullable(),
    completedWork: zod_1.z.string().max(2000).optional().nullable(),
    workInProgress: zod_1.z.string().max(2000).optional().nullable(),
    blockers: zod_1.z.string().max(2000).optional().nullable(),
    nextDayPlan: zod_1.z.string().max(2000).optional().nullable(),
    completionPercent: zod_1.z.number().min(0).max(100).optional().nullable(),
});
exports.inviteUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase(),
    fullName: zod_1.z.string().min(1).max(200),
    role: zod_1.z.nativeEnum(enums_1.UserRole),
    phone: phoneSchema.optional().nullable(),
    siteIds: zod_1.z.array(zod_1.z.string().uuid()).default([]),
    password: zod_1.z.string().min(8).max(128).optional(),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    pageSize: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    search: zod_1.z.string().max(200).optional(),
    sortBy: zod_1.z.string().max(50).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
exports.dashboardFilterSchema = zod_1.z.object({
    year: zod_1.z.coerce.number().int().min(2000).max(2100).optional(),
    month: zod_1.z.coerce.number().int().min(1).max(12).optional(),
    siteId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(enums_1.ProjectStatus).optional(),
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map