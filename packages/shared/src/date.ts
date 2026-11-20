/** Asia/Kolkata date helpers. Storage should be UTC Instant; display in IST. */

export const APP_TIMEZONE = 'Asia/Kolkata';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Format Date or ISO string as DD MMM YYYY in Asia/Kolkata */
export function formatDateIst(input: Date | string | number): string {
  const d = toDate(input);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).formatToParts(d);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = parts.find((p) => p.type === 'month')?.value ?? '';
  const year = parts.find((p) => p.type === 'year')?.value ?? '';
  return `${day} ${month} ${year}`;
}

export function formatDateTimeIst(input: Date | string | number): string {
  const d = toDate(input);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/** Start of calendar day in Asia/Kolkata as UTC Date */
export function startOfDayIst(input: Date | string): Date {
  const { y, m, d } = getIstYmd(toDate(input));
  return istLocalToUtc(y, m, d, 0, 0, 0, 0);
}

/** End of calendar day in Asia/Kolkata as UTC Date (inclusive ms) */
export function endOfDayIst(input: Date | string): Date {
  const { y, m, d } = getIstYmd(toDate(input));
  return istLocalToUtc(y, m, d, 23, 59, 59, 999);
}

/** Month boundaries in Asia/Kolkata (1-based month) */
export function monthRangeIst(year: number, month: number): { start: Date; end: Date } {
  const start = istLocalToUtc(year, month, 1, 0, 0, 0, 0);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = new Date(istLocalToUtc(nextYear, nextMonth, 1, 0, 0, 0, 0).getTime() - 1);
  return { start, end };
}

export function yearRangeIst(year: number): { start: Date; end: Date } {
  const start = istLocalToUtc(year, 1, 1, 0, 0, 0, 0);
  const end = new Date(istLocalToUtc(year + 1, 1, 1, 0, 0, 0, 0).getTime() - 1);
  return { start, end };
}

export function getIstYearMonth(input: Date | string = new Date()): { year: number; month: number } {
  const { y, m } = getIstYmd(toDate(input));
  return { year: y, month: m };
}

export function monthLabel(month: number): string {
  return MONTHS[month - 1] ?? String(month);
}

function toDate(input: Date | string | number): Date {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${String(input)}`);
  return d;
}

function getIstYmd(d: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { y, m, d: day };
}

/** Convert IST wall-clock components to a UTC Date (IST = UTC+5:30) */
function istLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
): Date {
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms) - (5 * 60 + 30) * 60 * 1000;
  return new Date(utcMs);
}
