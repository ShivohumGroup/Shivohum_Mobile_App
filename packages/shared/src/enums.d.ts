export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    PARTNER = "PARTNER",
    SITE_MANAGER = "SITE_MANAGER",
    VIEWER = "VIEWER"
}
export declare enum ProjectStatus {
    PLANNING = "PLANNING",
    ACTIVE = "ACTIVE",
    ON_HOLD = "ON_HOLD",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    ARCHIVED = "ARCHIVED"
}
export declare enum ProjectType {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
    INTERIOR = "INTERIOR",
    RENOVATION = "RENOVATION",
    OTHER = "OTHER"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    UPI = "UPI",
    CHEQUE = "CHEQUE",
    OTHER = "OTHER"
}
export declare enum TransactionStatus {
    CONFIRMED = "CONFIRMED",
    PENDING = "PENDING",
    VOIDED = "VOIDED",
    REJECTED = "REJECTED"
}
export declare enum ExpensePaymentStatus {
    PAID = "PAID",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    UNPAID = "UNPAID"
}
export declare enum ActivityType {
    SITE_CREATED = "SITE_CREATED",
    SITE_UPDATED = "SITE_UPDATED",
    SITE_STATUS_CHANGED = "SITE_STATUS_CHANGED",
    INCOME_RECORDED = "INCOME_RECORDED",
    INCOME_VOIDED = "INCOME_VOIDED",
    EXPENSE_ADDED = "EXPENSE_ADDED",
    EXPENSE_UPDATED = "EXPENSE_UPDATED",
    EXPENSE_PAYMENT_ADDED = "EXPENSE_PAYMENT_ADDED",
    CONTACT_ADDED = "CONTACT_ADDED",
    CONTACT_UPDATED = "CONTACT_UPDATED",
    PROGRESS_POSTED = "PROGRESS_POSTED",
    PROGRESS_UPDATED = "PROGRESS_UPDATED",
    REPORT_GENERATED = "REPORT_GENERATED",
    USER_INVITED = "USER_INVITED",
    MEMBERSHIP_CHANGED = "MEMBERSHIP_CHANGED"
}
export declare enum NotificationType {
    ACTIVITY = "ACTIVITY",
    SYSTEM = "SYSTEM",
    REMINDER = "REMINDER"
}
export declare const DEFAULT_EXPENSE_CATEGORIES: readonly ["POP", "Furniture", "Labour", "Building materials", "Electrical", "Plumbing", "Paint", "Contractor", "Transportation", "Equipment rental", "Design and consultancy", "Miscellaneous"];
