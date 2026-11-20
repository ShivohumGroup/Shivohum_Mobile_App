import {
  addMoney,
  calculateExpenseOutstanding,
  calculateMargin,
  calculateNetCash,
  calculateOutstanding,
  compareMoney,
  deriveExpensePaymentStatus,
  formatInr,
  fromPaise,
  toPaise,
} from '@siteflow/shared';

describe('Financial calculations (INR / paise)', () => {
  it('converts rupees to paise without float drift', () => {
    expect(toPaise('10.10')).toBe(1010);
    expect(toPaise('0.01')).toBe(1);
    expect(toPaise(100.5)).toBe(10050);
    expect(fromPaise(1010)).toBe('10.10');
  });

  it('handles multiple and partial client payments', () => {
    const contract = '2500000.00';
    const p1 = '500000.00';
    const p2 = '750000.00';
    const received = addMoney(p1, p2);
    expect(received).toBe('1250000.00');
    const { outstanding, overpayment } = calculateOutstanding(contract, received);
    expect(outstanding).toBe('1250000.00');
    expect(overpayment).toBe('0.00');
  });

  it('shows overpayment when receipts exceed contract', () => {
    const { outstanding, overpayment } = calculateOutstanding('1000.00', '1200.50');
    expect(outstanding).toBe('0.00');
    expect(overpayment).toBe('200.50');
  });

  it('does not treat unpaid expenses as cash outflow', () => {
    const received = '100000.00';
    const incurred = '80000.00';
    const paid = '30000.00';
    const unpaid = calculateExpenseOutstanding(incurred, paid);
    expect(unpaid).toBe('50000.00');
    expect(calculateNetCash(received, paid)).toBe('70000.00');
    expect(calculateMargin('200000.00', incurred)).toBe('120000.00');
  });

  it('derives partial payment status correctly', () => {
    expect(deriveExpensePaymentStatus('100.00', '0.00')).toBe('UNPAID');
    expect(deriveExpensePaymentStatus('100.00', '40.00')).toBe('PARTIALLY_PAID');
    expect(deriveExpensePaymentStatus('100.00', '100.00')).toBe('PAID');
    expect(deriveExpensePaymentStatus('100.00', '100.01')).toBe('PAID');
  });

  it('keeps site totals independent conceptually', () => {
    const siteA = addMoney('100.00', '50.00');
    const siteB = addMoney('200.00', '25.00');
    expect(siteA).toBe('150.00');
    expect(siteB).toBe('225.00');
    expect(compareMoney(siteA, siteB)).toBeLessThan(0);
  });

  it('formats INR with Indian grouping', () => {
    expect(formatInr('1234567.89')).toBe('₹12,34,567.89');
  });

  it('handles zero balances', () => {
    expect(calculateNetCash('0.00', '0.00')).toBe('0.00');
    expect(calculateOutstanding('0.00', '0.00').outstanding).toBe('0.00');
  });

  it('voided amounts are excluded by caller (confirmed-only sums)', () => {
    const confirmed = ['100.00', '50.00'];
    const voided = ['25.00'];
    const total = confirmed.reduce((s, a) => addMoney(s, a), '0.00');
    expect(total).toBe('150.00');
    expect(addMoney(total, ...voided)).not.toBe(total);
  });
});
