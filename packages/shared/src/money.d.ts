export type MoneyInput = string | number | {
    toString(): string;
};
export declare function toPaise(amount: MoneyInput): number;
export declare function fromPaise(paise: number): string;
export declare function addMoney(...amounts: MoneyInput[]): string;
export declare function subtractMoney(a: MoneyInput, b: MoneyInput): string;
export declare function maxMoney(a: MoneyInput, b: MoneyInput): string;
export declare function minMoney(a: MoneyInput, b: MoneyInput): string;
export declare function isPositiveMoney(amount: MoneyInput): boolean;
export declare function isZeroMoney(amount: MoneyInput): boolean;
export declare function compareMoney(a: MoneyInput, b: MoneyInput): number;
export declare function formatInr(amount: MoneyInput): string;
export declare function calculateOutstanding(contractAmount: MoneyInput, totalReceived: MoneyInput): {
    outstanding: string;
    overpayment: string;
};
export declare function calculateExpenseOutstanding(incurred: MoneyInput, paid: MoneyInput): string;
export declare function calculateNetCash(receipts: MoneyInput, outflows: MoneyInput): string;
export declare function calculateMargin(contract: MoneyInput, expensesIncurred: MoneyInput): string;
export declare function deriveExpensePaymentStatus(amount: MoneyInput, amountPaid: MoneyInput): 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';
