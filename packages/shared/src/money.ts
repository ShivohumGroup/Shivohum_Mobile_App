/**
 * Money helpers for INR.
 * Canonical storage: decimal rupees with 2 fractional digits (paise).
 * Internal math uses integer paise to avoid floating-point drift.
 */

export type MoneyInput = string | number | { toString(): string };

export function toPaise(amount: MoneyInput): number {
  const raw = typeof amount === 'number' ? amount.toFixed(2) : String(amount).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(raw) && !/^-?\d+\.\d+$/.test(raw)) {
    const n = Number(raw);
    if (!Number.isFinite(n)) throw new Error(`Invalid money value: ${raw}`);
    return Math.round(n * 100);
  }
  const negative = raw.startsWith('-');
  const abs = negative ? raw.slice(1) : raw;
  const [rupees, frac = ''] = abs.split('.');
  const paise = Number(rupees) * 100 + Number((frac + '00').slice(0, 2));
  return negative ? -paise : paise;
}

export function fromPaise(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(Math.trunc(paise));
  const rupees = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${negative ? '-' : ''}${rupees}.${frac}`;
}

export function addMoney(...amounts: MoneyInput[]): string {
  return fromPaise(amounts.reduce<number>((sum, a) => sum + toPaise(a), 0));
}

export function subtractMoney(a: MoneyInput, b: MoneyInput): string {
  return fromPaise(toPaise(a) - toPaise(b));
}

export function maxMoney(a: MoneyInput, b: MoneyInput): string {
  return toPaise(a) >= toPaise(b) ? fromPaise(toPaise(a)) : fromPaise(toPaise(b));
}

export function minMoney(a: MoneyInput, b: MoneyInput): string {
  return toPaise(a) <= toPaise(b) ? fromPaise(toPaise(a)) : fromPaise(toPaise(b));
}

export function isPositiveMoney(amount: MoneyInput): boolean {
  return toPaise(amount) > 0;
}

export function isZeroMoney(amount: MoneyInput): boolean {
  return toPaise(amount) === 0;
}

export function compareMoney(a: MoneyInput, b: MoneyInput): number {
  return toPaise(a) - toPaise(b);
}

/** Format as Indian Rupees: ₹1,23,456.78 */
export function formatInr(amount: MoneyInput): string {
  const paise = toPaise(amount);
  const negative = paise < 0;
  const abs = fromPaise(Math.abs(paise));
  const [whole, frac] = abs.split('.');
  const withCommas = formatIndianNumber(whole);
  return `${negative ? '-' : ''}₹${withCommas}.${frac}`;
}

function formatIndianNumber(whole: string): string {
  if (whole.length <= 3) return whole;
  const last3 = whole.slice(-3);
  let rest = whole.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
}

export function calculateOutstanding(contractAmount: MoneyInput, totalReceived: MoneyInput): {
  outstanding: string;
  overpayment: string;
} {
  const diff = toPaise(contractAmount) - toPaise(totalReceived);
  if (diff >= 0) {
    return { outstanding: fromPaise(diff), overpayment: '0.00' };
  }
  return { outstanding: '0.00', overpayment: fromPaise(-diff) };
}

export function calculateExpenseOutstanding(incurred: MoneyInput, paid: MoneyInput): string {
  const diff = toPaise(incurred) - toPaise(paid);
  return fromPaise(Math.max(0, diff));
}

export function calculateNetCash(receipts: MoneyInput, outflows: MoneyInput): string {
  return subtractMoney(receipts, outflows);
}

export function calculateMargin(contract: MoneyInput, expensesIncurred: MoneyInput): string {
  return subtractMoney(contract, expensesIncurred);
}

export function deriveExpensePaymentStatus(
  amount: MoneyInput,
  amountPaid: MoneyInput,
): 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' {
  const a = toPaise(amount);
  const p = toPaise(amountPaid);
  if (p <= 0) return 'UNPAID';
  if (p >= a) return 'PAID';
  return 'PARTIALLY_PAID';
}
