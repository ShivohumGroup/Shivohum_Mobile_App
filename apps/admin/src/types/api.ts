import type {
  ExpensePaymentStatus,
  NotificationType,
  PaymentMethod,
  ProjectStatus,
  ProjectType,
  TransactionStatus,
  UserRole,
  ActivityType,
} from '@siteflow/shared';

export type { PaymentMethod, ProjectStatus, ProjectType, UserRole };

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
  user: AuthUser;
}

export interface Paginated<T> {
  items?: T[];
  data?: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount?: number;
    totalPages?: number;
  };
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
  projectManager?: { id: string; fullName: string } | null;
  notes?: string | null;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  totals?: SiteFinancialTotals;
}

export interface SiteFinancialTotals {
  totalReceived: string | number;
  totalExpensesIncurred: string | number;
  totalExpensesPaid: string | number;
  outstanding: string | number;
  overpayment: string | number;
  netCash: string | number;
  margin: string | number;
}

export interface IncomeTransaction {
  id: string;
  siteId: string;
  site?: { id: string; name: string; code: string };
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
  createdBy?: { id: string; fullName: string };
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Expense {
  id: string;
  siteId: string;
  site?: { id: string; name: string; code: string };
  categoryId: string;
  category?: ExpenseCategory;
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
  payments?: ExpensePayment[];
  createdAt: string;
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
  sites?: { id: string; name: string; code: string }[];
  siteIds?: string[];
  createdAt: string;
}

export interface ProgressUpdate {
  id: string;
  siteId: string;
  site?: { id: string; name: string; code: string };
  updateDate: string;
  title: string;
  description: string;
  workCategory?: string | null;
  completedWork?: string | null;
  workInProgress?: string | null;
  blockers?: string | null;
  nextDayPlan?: string | null;
  completionPercent?: number | null;
  createdBy?: { id: string; fullName: string };
  createdAt: string;
  editedAt?: string | null;
}

export interface DashboardSummary {
  sitesCount: number;
  activeSites: number;
  totalContractValue: string | number;
  totalReceived: string | number;
  totalExpensesIncurred: string | number;
  totalExpensesPaid: string | number;
  outstandingReceivables: string | number;
  outstandingPayables: string | number;
  netCash: string | number;
  monthlyIncome: { month: string; amount: number }[];
  monthlyExpenses: { month: string; amount: number }[];
  expensesByCategory: { category: string; amount: number }[];
  sitesByStatus: { status: string; count: number }[];
  recentActivity?: ActivityLog[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  siteId?: string | null;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  summary: string;
  siteId?: string | null;
  site?: { id: string; name: string } | null;
  actor?: { id: string; fullName: string } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface TeamUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  memberships?: { siteId: string; site?: { name: string } }[];
}

export interface ReportLink {
  name: string;
  description: string;
  path: string;
  formats: ('xlsx' | 'pdf' | 'json')[];
}

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
