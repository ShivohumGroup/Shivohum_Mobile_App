import type {
  ExpensePaymentStatus,
  PaymentMethod,
  ProjectStatus,
  ProjectType,
  ScheduleTaskStatus,
  TransactionStatus,
  UserRole,
} from '@siteflow/shared';

export type ApiSuccess<T> = T;

export interface PaginatedMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorBody {
  success: false;
  statusCode: number;
  code?: string;
  message: string | string[];
  path?: string;
  timestamp?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface Site {
  id: string;
  name: string;
  code: string;
  clientName: string;
  clientPhone?: string | null;
  address: string;
  city: string;
  state: string;
  projectType: ProjectType;
  description?: string | null;
  contractAmount: string | number;
  agreedStartDate: string;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status: ProjectStatus;
  projectManagerId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  totalReceived?: string | number;
  totalExpensesPaid?: string | number;
  totalExpensesIncurred?: string | number;
  netCash?: string | number;
  availableAmount?: string | number;
  outstanding?: string | number;
  completionPercent?: number | null;
  projectManager?: { id: string; fullName: string } | null;
}

export interface SiteFinancialSummary {
  siteId: string;
  contractAmount: string | number;
  totalReceived: string | number;
  outstanding: string | number;
  overpayment: string | number;
  totalExpensesIncurred: string | number;
  totalExpensesPaid: string | number;
  expensesOutstanding: string | number;
  netCash: string | number;
  availableAmount?: string | number;
  margin: string | number;
  incomeCount: number;
  expenseCount: number;
}

export interface IncomeTransaction {
  id: string;
  siteId: string;
  clientId?: string | null;
  amount: string | number;
  dateReceived: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  description?: string | null;
  status: TransactionStatus;
  voidReason?: string | null;
  voidedAt?: string | null;
  createdAt: string;
  site?: Pick<Site, 'id' | 'name' | 'code'>;
  createdBy?: { id: string; fullName: string };
}

export interface Expense {
  id: string;
  siteId: string;
  categoryId: string;
  vendorId?: string | null;
  contactId?: string | null;
  vendorName?: string | null;
  amount: string | number;
  amountPaid: string | number;
  expenseDate: string;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
  description?: string | null;
  notes?: string | null;
  status: TransactionStatus;
  voidReason?: string | null;
  voidedAt?: string | null;
  createdAt: string;
  site?: Pick<Site, 'id' | 'name' | 'code'>;
  category?: { id: string; name: string };
  payments?: ExpensePayment[];
  createdBy?: { id: string; fullName: string };
}

export interface ExpensePayment {
  id: string;
  expenseId: string;
  amount: string | number;
  paidAt: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  status: TransactionStatus;
  createdAt: string;
}

export type TransactionKind = 'INCOME' | 'EXPENSE' | 'EXPENSE_PAYMENT';

export interface UnifiedTransaction {
  id: string;
  kind: TransactionKind;
  siteId: string;
  siteName?: string;
  amount: string | number;
  /** Cash actually paid for expenses (Available uses this). */
  amountPaid?: string | number;
  date: string;
  title: string;
  subtitle?: string;
  status: TransactionStatus | ExpensePaymentStatus;
  paymentMethod?: PaymentMethod | null;
  referenceNumber?: string | null;
}

export interface Contact {
  id: string;
  personName: string;
  companyName?: string | null;
  workCategory: string;
  designation?: string | null;
  primaryPhone: string;
  alternatePhone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  sites?: Array<{ id: string; name: string; code?: string }>;
  siteIds?: string[];
}

export interface ProgressUpdate {
  id: string;
  siteId: string;
  updateDate: string;
  title: string;
  description: string;
  workCategory?: string | null;
  completedWork?: string | null;
  workInProgress?: string | null;
  blockers?: string | null;
  nextDayPlan?: string | null;
  completionPercent?: number | null;
  createdAt: string;
  updatedAt: string;
  site?: Pick<Site, 'id' | 'name' | 'code'>;
  createdBy?: { id: string; fullName: string };
  photos?: ProgressPhoto[];
}

export interface ProgressPhoto {
  id: string;
  progressUpdateId: string;
  attachmentId: string;
  caption?: string | null;
  sortOrder: number;
  url?: string;
  attachment?: {
    id: string;
    fileName: string;
    mimeType: string;
    url?: string;
  };
}

export interface ScheduleTask {
  id: string;
  organizationId: string;
  siteId?: string | null;
  title: string;
  notes?: string | null;
  category?: string | null;
  scheduledDate: string;
  status: ScheduleTaskStatus;
  assigneeId?: string | null;
  createdById: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  site?: Pick<Site, 'id' | 'name' | 'code'> | null;
  createdBy?: { id: string; fullName: string };
  assignee?: { id: string; fullName: string } | null;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface DashboardSummary {
  greetingName?: string;
  activeSites: number;
  totalSites: number;
  contractValue: string | number;
  totalReceived: string | number;
  totalExpensesPaid: string | number;
  totalExpensesIncurred: string | number;
  netCash: string | number;
  outstanding: string | number;
  monthIncome: string | number;
  monthExpenses: string | number;
  monthlySeries?: Array<{ month: number; label: string; income: string | number; expense: string | number }>;
  sites?: Site[];
  recentTransactions?: UnifiedTransaction[];
  latestProgress?: ProgressUpdate[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  siteId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  siteId?: string;
  status?: string;
  from?: string;
  to?: string;
  year?: number;
  month?: number;
  categoryId?: string;
  workCategory?: string;
  kind?: string;
}
