import { Decimal } from '@prisma/client/runtime/library';
import {
  addMoney,
  calculateExpenseOutstanding,
  calculateMargin,
  calculateNetCash,
  calculateOutstanding,
  compareMoney,
  deriveExpensePaymentStatus,
  fromPaise,
  isPositiveMoney,
  toPaise,
} from '@siteflow/shared';

export function decimalToString(value: Decimal | string | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  }
  if (typeof value === 'number') return value.toFixed(2);
  return value.toFixed(2);
}

export function toDecimal(value: string | number): Decimal {
  return new Decimal(typeof value === 'number' ? value.toFixed(2) : value);
}

export {
  addMoney,
  calculateExpenseOutstanding,
  calculateMargin,
  calculateNetCash,
  calculateOutstanding,
  compareMoney,
  deriveExpensePaymentStatus,
  fromPaise,
  isPositiveMoney,
  toPaise,
};
