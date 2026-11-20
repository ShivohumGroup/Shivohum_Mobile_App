"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_TIMEZONE = void 0;
exports.formatDateIst = formatDateIst;
exports.formatDateTimeIst = formatDateTimeIst;
exports.startOfDayIst = startOfDayIst;
exports.endOfDayIst = endOfDayIst;
exports.monthRangeIst = monthRangeIst;
exports.yearRangeIst = yearRangeIst;
exports.getIstYearMonth = getIstYearMonth;
exports.monthLabel = monthLabel;
exports.APP_TIMEZONE = 'Asia/Kolkata';
const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
function formatDateIst(input) {
    const d = toDate(input);
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: exports.APP_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value ?? '';
    const month = parts.find((p) => p.type === 'month')?.value ?? '';
    const year = parts.find((p) => p.type === 'year')?.value ?? '';
    return `${day} ${month} ${year}`;
}
function formatDateTimeIst(input) {
    const d = toDate(input);
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: exports.APP_TIMEZONE,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).format(d);
}
function startOfDayIst(input) {
    const { y, m, d } = getIstYmd(toDate(input));
    return istLocalToUtc(y, m, d, 0, 0, 0, 0);
}
function endOfDayIst(input) {
    const { y, m, d } = getIstYmd(toDate(input));
    return istLocalToUtc(y, m, d, 23, 59, 59, 999);
}
function monthRangeIst(year, month) {
    const start = istLocalToUtc(year, month, 1, 0, 0, 0, 0);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const end = new Date(istLocalToUtc(nextYear, nextMonth, 1, 0, 0, 0, 0).getTime() - 1);
    return { start, end };
}
function yearRangeIst(year) {
    const start = istLocalToUtc(year, 1, 1, 0, 0, 0, 0);
    const end = new Date(istLocalToUtc(year + 1, 1, 1, 0, 0, 0, 0).getTime() - 1);
    return { start, end };
}
function getIstYearMonth(input = new Date()) {
    const { y, m } = getIstYmd(toDate(input));
    return { year: y, month: m };
}
function monthLabel(month) {
    return MONTHS[month - 1] ?? String(month);
}
function toDate(input) {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime()))
        throw new Error(`Invalid date: ${String(input)}`);
    return d;
}
function getIstYmd(d) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(d);
    const y = Number(parts.find((p) => p.type === 'year')?.value);
    const m = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    return { y, m, d: day };
}
function istLocalToUtc(year, month, day, hour, minute, second, ms) {
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms) - (5 * 60 + 30) * 60 * 1000;
    return new Date(utcMs);
}
//# sourceMappingURL=date.js.map