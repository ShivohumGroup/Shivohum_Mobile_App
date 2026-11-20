import { z } from 'zod';
import { ExpensePaymentStatus, PaymentMethod, ProjectStatus, ProjectType, TransactionStatus, UserRole } from './enums';
declare const moneySchema: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
declare const optionalMoneySchema: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
declare const phoneSchema: z.ZodString;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const createSiteSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    clientName: z.ZodString;
    clientPhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    projectType: z.ZodNativeEnum<typeof ProjectType>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contractAmount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
    agreedStartDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    expectedCompletionDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof ProjectStatus>>;
    projectManagerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    clientName: string;
    address: string;
    city: string;
    state: string;
    projectType: ProjectType;
    contractAmount: string;
    agreedStartDate: string;
    status: ProjectStatus;
    code?: string | undefined;
    clientPhone?: string | null | undefined;
    description?: string | null | undefined;
    expectedCompletionDate?: string | null | undefined;
    projectManagerId?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    name: string;
    clientName: string;
    address: string;
    city: string;
    state: string;
    projectType: ProjectType;
    contractAmount: string | number;
    agreedStartDate: string;
    code?: string | undefined;
    clientPhone?: string | null | undefined;
    description?: string | null | undefined;
    expectedCompletionDate?: string | null | undefined;
    status?: ProjectStatus | undefined;
    projectManagerId?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const updateSiteSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    clientName: z.ZodOptional<z.ZodString>;
    clientPhone: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    address: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    projectType: z.ZodOptional<z.ZodNativeEnum<typeof ProjectType>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    contractAmount: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>>;
    agreedStartDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    expectedCompletionDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof ProjectStatus>>>;
    projectManagerId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
} & {
    actualCompletionDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    code?: string | undefined;
    clientName?: string | undefined;
    clientPhone?: string | null | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    projectType?: ProjectType | undefined;
    description?: string | null | undefined;
    contractAmount?: string | undefined;
    agreedStartDate?: string | undefined;
    expectedCompletionDate?: string | null | undefined;
    actualCompletionDate?: string | null | undefined;
    status?: ProjectStatus | undefined;
    projectManagerId?: string | null | undefined;
    notes?: string | null | undefined;
}, {
    name?: string | undefined;
    code?: string | undefined;
    clientName?: string | undefined;
    clientPhone?: string | null | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    projectType?: ProjectType | undefined;
    description?: string | null | undefined;
    contractAmount?: string | number | undefined;
    agreedStartDate?: string | undefined;
    expectedCompletionDate?: string | null | undefined;
    actualCompletionDate?: string | null | undefined;
    status?: ProjectStatus | undefined;
    projectManagerId?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const createIncomeSchema: z.ZodObject<{
    siteId: z.ZodString;
    clientId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
    dateReceived: z.ZodUnion<[z.ZodString, z.ZodString]>;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    referenceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    attachmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    siteId: string;
    amount: string;
    dateReceived: string;
    paymentMethod: PaymentMethod;
    description?: string | null | undefined;
    clientId?: string | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
}, {
    siteId: string;
    amount: string | number;
    dateReceived: string;
    paymentMethod: PaymentMethod;
    description?: string | null | undefined;
    clientId?: string | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
}>;
export declare const voidTransactionSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const createExpenseSchema: z.ZodObject<{
    siteId: z.ZodString;
    categoryId: z.ZodString;
    vendorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vendorName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
    expenseDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    paymentMethod: z.ZodNullable<z.ZodOptional<z.ZodNativeEnum<typeof PaymentMethod>>>;
    referenceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    attachmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    initialPaymentAmount: z.ZodOptional<z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>>;
}, "strip", z.ZodTypeAny, {
    siteId: string;
    amount: string;
    categoryId: string;
    expenseDate: string;
    description?: string | null | undefined;
    notes?: string | null | undefined;
    paymentMethod?: PaymentMethod | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
    vendorId?: string | null | undefined;
    contactId?: string | null | undefined;
    vendorName?: string | null | undefined;
    initialPaymentAmount?: string | undefined;
}, {
    siteId: string;
    amount: string | number;
    categoryId: string;
    expenseDate: string;
    description?: string | null | undefined;
    notes?: string | null | undefined;
    paymentMethod?: PaymentMethod | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
    vendorId?: string | null | undefined;
    contactId?: string | null | undefined;
    vendorName?: string | null | undefined;
    initialPaymentAmount?: string | number | undefined;
}>;
export declare const createExpensePaymentSchema: z.ZodObject<{
    amount: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string, string | number>, string, string | number>;
    paidAt: z.ZodUnion<[z.ZodString, z.ZodString]>;
    paymentMethod: z.ZodNativeEnum<typeof PaymentMethod>;
    referenceNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    attachmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    amount: string;
    paymentMethod: PaymentMethod;
    paidAt: string;
    notes?: string | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
}, {
    amount: string | number;
    paymentMethod: PaymentMethod;
    paidAt: string;
    notes?: string | null | undefined;
    referenceNumber?: string | null | undefined;
    attachmentId?: string | null | undefined;
}>;
export declare const createContactSchema: z.ZodObject<{
    siteIds: z.ZodArray<z.ZodString, "many">;
    personName: z.ZodString;
    companyName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    workCategory: z.ZodString;
    designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    primaryPhone: z.ZodString;
    alternatePhone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    whatsappNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    siteIds: string[];
    personName: string;
    workCategory: string;
    primaryPhone: string;
    address?: string | null | undefined;
    notes?: string | null | undefined;
    email?: string | null | undefined;
    companyName?: string | null | undefined;
    designation?: string | null | undefined;
    alternatePhone?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
}, {
    siteIds: string[];
    personName: string;
    workCategory: string;
    primaryPhone: string;
    address?: string | null | undefined;
    notes?: string | null | undefined;
    email?: string | null | undefined;
    companyName?: string | null | undefined;
    designation?: string | null | undefined;
    alternatePhone?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
}>;
export declare const updateContactSchema: z.ZodObject<{
    siteIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    personName: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    workCategory: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    primaryPhone: z.ZodOptional<z.ZodString>;
    alternatePhone: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    whatsappNumber: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
} & {
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    address?: string | null | undefined;
    notes?: string | null | undefined;
    email?: string | null | undefined;
    siteIds?: string[] | undefined;
    personName?: string | undefined;
    companyName?: string | null | undefined;
    workCategory?: string | undefined;
    designation?: string | null | undefined;
    primaryPhone?: string | undefined;
    alternatePhone?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
}, {
    isActive?: boolean | undefined;
    address?: string | null | undefined;
    notes?: string | null | undefined;
    email?: string | null | undefined;
    siteIds?: string[] | undefined;
    personName?: string | undefined;
    companyName?: string | null | undefined;
    workCategory?: string | undefined;
    designation?: string | null | undefined;
    primaryPhone?: string | undefined;
    alternatePhone?: string | null | undefined;
    whatsappNumber?: string | null | undefined;
}>;
export declare const createProgressSchema: z.ZodObject<{
    siteId: z.ZodString;
    updateDate: z.ZodUnion<[z.ZodString, z.ZodString]>;
    title: z.ZodString;
    description: z.ZodString;
    workCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    completedWork: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    workInProgress: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    blockers: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    nextDayPlan: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    completionPercent: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    siteId: string;
    description: string;
    title: string;
    updateDate: string;
    workCategory?: string | null | undefined;
    completedWork?: string | null | undefined;
    workInProgress?: string | null | undefined;
    blockers?: string | null | undefined;
    nextDayPlan?: string | null | undefined;
    completionPercent?: number | null | undefined;
}, {
    siteId: string;
    description: string;
    title: string;
    updateDate: string;
    workCategory?: string | null | undefined;
    completedWork?: string | null | undefined;
    workInProgress?: string | null | undefined;
    blockers?: string | null | undefined;
    nextDayPlan?: string | null | undefined;
    completionPercent?: number | null | undefined;
}>;
export declare const inviteUserSchema: z.ZodObject<{
    email: z.ZodString;
    fullName: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    siteIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: UserRole;
    email: string;
    fullName: string;
    siteIds: string[];
    password?: string | undefined;
    phone?: string | null | undefined;
}, {
    role: UserRole;
    email: string;
    fullName: string;
    password?: string | undefined;
    phone?: string | null | undefined;
    siteIds?: string[] | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    pageSize: number;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    sortBy?: string | undefined;
}, {
    search?: string | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const dashboardFilterSchema: z.ZodObject<{
    year: z.ZodOptional<z.ZodNumber>;
    month: z.ZodOptional<z.ZodNumber>;
    siteId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ProjectStatus>>;
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    siteId?: string | undefined;
    status?: ProjectStatus | undefined;
    year?: number | undefined;
    month?: number | undefined;
    from?: string | undefined;
    to?: string | undefined;
}, {
    siteId?: string | undefined;
    status?: ProjectStatus | undefined;
    year?: number | undefined;
    month?: number | undefined;
    from?: string | undefined;
    to?: string | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateExpensePaymentInput = z.infer<typeof createExpensePaymentSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type CreateProgressInput = z.infer<typeof createProgressSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
export { moneySchema, optionalMoneySchema, phoneSchema, TransactionStatus, ExpensePaymentStatus, };
