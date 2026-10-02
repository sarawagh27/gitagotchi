const DAY_MS = 86_400_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

function partsOf(input: Date | string, timeZone: string): Record<string, string> {
  const date = typeof input === 'string' ? new Date(input) : input;
  const parts: Record<string, string> = {};
  for (const part of formatterFor(timeZone).formatToParts(date)) parts[part.type] = part.value;
  return parts;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Calendar day (YYYY-MM-DD) of an instant in the given time zone. */
export function dayKey(input: Date | string, timeZone: string): string {
  const p = partsOf(input, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Local hour (0-23) of an instant in the given time zone. */
export function hourOf(input: Date | string, timeZone: string): number {
  return Number(partsOf(input, timeZone).hour) % 24;
}

function toUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  return new Date(toUtcMs(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOf(key: string): number {
  return new Date(toUtcMs(key)).getUTCDay();
}
