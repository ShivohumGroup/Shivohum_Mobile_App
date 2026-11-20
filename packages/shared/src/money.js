"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPaise = toPaise;
exports.fromPaise = fromPaise;
exports.addMoney = addMoney;
exports.subtractMoney = subtractMoney;
exports.maxMoney = maxMoney;
exports.minMoney = minMoney;
exports.isPositiveMoney = isPositiveMoney;
exports.isZeroMoney = isZeroMoney;
exports.compareMoney = compareMoney;
exports.formatInr = formatInr;
exports.calculateOutstanding = calculateOutstanding;
exports.calculateExpenseOutstanding = calculateExpenseOutstanding;
exports.calculateNetCash = calculateNetCash;
exports.calculateMargin = calculateMargin;
exports.deriveExpensePaymentStatus = deriveExpensePaymentStatus;
function toPaise(amount) {
    const raw = typeof amount === 'number' ? amount.toFixed(2) : String(amount).trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(raw) && !/^-?\d+\.\d+$/.test(raw)) {
        const n = Number(raw);
        if (!Number.isFinite(n))
            throw new Error(`Invalid money value: ${raw}`);
        return Math.round(n * 100);
    }
    const negative = raw.startsWith('-');
    const abs = negative ? raw.slice(1) : raw;
    const [rupees, frac = ''] = abs.split('.');
    const paise = Number(rupees) * 100 + Number((frac + '00').slice(0, 2));
    return negative ? -paise : paise;
}
function fromPaise(paise) {
    const negative = paise < 0;
    const abs = Math.abs(Math.trunc(paise));
    const rupees = Math.floor(abs / 100);
    const frac = String(abs % 100).padStart(2, '0');
    return `${negative ? '-' : ''}${rupees}.${frac}`;
}
function addMoney(...amounts) {
    return fromPaise(amounts.reduce((sum, a) => sum + toPaise(a), 0));
}
function subtractMoney(a, b) {
    return fromPaise(toPaise(a) - toPaise(b));
}
function maxMoney(a, b) {
    return toPaise(a) >= toPaise(b) ? fromPaise(toPaise(a)) : fromPaise(toPaise(b));
}
function minMoney(a, b) {
    return toPaise(a) <= toPaise(b) ? fromPaise(toPaise(a)) : fromPaise(toPaise(b));
}
function isPositiveMoney(amount) {
    return toPaise(amount) > 0;
}
function isZeroMoney(amount) {
    return toPaise(amount) === 0;
}
function compareMoney(a, b) {
    return toPaise(a) - toPaise(b);
}
function formatInr(amount) {
    const paise = toPaise(amount);
    const negative = paise < 0;
    const abs = fromPaise(Math.abs(paise));
    const [whole, frac] = abs.split('.');
    const withCommas = formatIndianNumber(whole);
    return `${negative ? '-' : ''}₹${withCommas}.${frac}`;
}
function formatIndianNumber(whole) {
    if (whole.length <= 3)
        return whole;
    const last3 = whole.slice(-3);
    let rest = whole.slice(0, -3);
    const parts = [];
    while (rest.length > 2) {
        parts.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
    }
    if (rest)
        parts.unshift(rest);
    return `${parts.join(',')},${last3}`;
}
function calculateOutstanding(contractAmount, totalReceived) {
    const diff = toPaise(contractAmount) - toPaise(totalReceived);
    if (diff >= 0) {
        return { outstanding: fromPaise(diff), overpayment: '0.00' };
    }
    return { outstanding: '0.00', overpayment: fromPaise(-diff) };
}
function calculateExpenseOutstanding(incurred, paid) {
    const diff = toPaise(incurred) - toPaise(paid);
    return fromPaise(Math.max(0, diff));
}
function calculateNetCash(receipts, outflows) {
    return subtractMoney(receipts, outflows);
}
function calculateMargin(contract, expensesIncurred) {
    return subtractMoney(contract, expensesIncurred);
}
function deriveExpensePaymentStatus(amount, amountPaid) {
    const a = toPaise(amount);
    const p = toPaise(amountPaid);
    if (p <= 0)
        return 'UNPAID';
    if (p >= a)
        return 'PAID';
    return 'PARTIALLY_PAID';
}
//# sourceMappingURL=money.js.map