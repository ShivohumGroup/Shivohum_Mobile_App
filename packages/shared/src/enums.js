"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXPENSE_CATEGORIES = exports.NotificationType = exports.ActivityType = exports.ExpensePaymentStatus = exports.TransactionStatus = exports.PaymentMethod = exports.ProjectType = exports.ProjectStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["PARTNER"] = "PARTNER";
    UserRole["SITE_MANAGER"] = "SITE_MANAGER";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNING"] = "PLANNING";
    ProjectStatus["ACTIVE"] = "ACTIVE";
    ProjectStatus["ON_HOLD"] = "ON_HOLD";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["CANCELLED"] = "CANCELLED";
    ProjectStatus["ARCHIVED"] = "ARCHIVED";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var ProjectType;
(function (ProjectType) {
    ProjectType["RESIDENTIAL"] = "RESIDENTIAL";
    ProjectType["COMMERCIAL"] = "COMMERCIAL";
    ProjectType["INTERIOR"] = "INTERIOR";
    ProjectType["RENOVATION"] = "RENOVATION";
    ProjectType["OTHER"] = "OTHER";
})(ProjectType || (exports.ProjectType = ProjectType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CHEQUE"] = "CHEQUE";
    PaymentMethod["OTHER"] = "OTHER";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["CONFIRMED"] = "CONFIRMED";
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["VOIDED"] = "VOIDED";
    TransactionStatus["REJECTED"] = "REJECTED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var ExpensePaymentStatus;
(function (ExpensePaymentStatus) {
    ExpensePaymentStatus["PAID"] = "PAID";
    ExpensePaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    ExpensePaymentStatus["UNPAID"] = "UNPAID";
})(ExpensePaymentStatus || (exports.ExpensePaymentStatus = ExpensePaymentStatus = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["SITE_CREATED"] = "SITE_CREATED";
    ActivityType["SITE_UPDATED"] = "SITE_UPDATED";
    ActivityType["SITE_STATUS_CHANGED"] = "SITE_STATUS_CHANGED";
    ActivityType["INCOME_RECORDED"] = "INCOME_RECORDED";
    ActivityType["INCOME_VOIDED"] = "INCOME_VOIDED";
    ActivityType["EXPENSE_ADDED"] = "EXPENSE_ADDED";
    ActivityType["EXPENSE_UPDATED"] = "EXPENSE_UPDATED";
    ActivityType["EXPENSE_PAYMENT_ADDED"] = "EXPENSE_PAYMENT_ADDED";
    ActivityType["CONTACT_ADDED"] = "CONTACT_ADDED";
    ActivityType["CONTACT_UPDATED"] = "CONTACT_UPDATED";
    ActivityType["PROGRESS_POSTED"] = "PROGRESS_POSTED";
    ActivityType["PROGRESS_UPDATED"] = "PROGRESS_UPDATED";
    ActivityType["REPORT_GENERATED"] = "REPORT_GENERATED";
    ActivityType["USER_INVITED"] = "USER_INVITED";
    ActivityType["MEMBERSHIP_CHANGED"] = "MEMBERSHIP_CHANGED";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ACTIVITY"] = "ACTIVITY";
    NotificationType["SYSTEM"] = "SYSTEM";
    NotificationType["REMINDER"] = "REMINDER";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
exports.DEFAULT_EXPENSE_CATEGORIES = [
    'POP',
    'Furniture',
    'Labour',
    'Building materials',
    'Electrical',
    'Plumbing',
    'Paint',
    'Contractor',
    'Transportation',
    'Equipment rental',
    'Design and consultancy',
    'Miscellaneous',
];
//# sourceMappingURL=enums.js.map