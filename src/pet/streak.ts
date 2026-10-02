import { addDays } from '../util/dates.js';
import { isActiveDay } from './xp.js';
import type { DayRecord } from './types.js';

type DailyLog = Record<string, DayRecord>;

/** Consecutive active days ending on `day` (0 if `day` itself is inactive). */
export function streakAt(log: DailyLog, day: string): number {
  let count = 0;
  let cursor = day;
  while (isActiveDay(log[cursor])) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

/** Today still counts as "alive" until it ends: an idle morning doesn't reset the streak. */
export function currentStreak(log: DailyLog, today: string): number {
  return isActiveDay(log[today]) ? streakAt(log, today) : streakAt(log, addDays(today, -1));
}

/** Whole days since the last active day, or undefined if the pet has never been fed. */
export function daysSinceActive(log: DailyLog, today: string): number | undefined {
  const lastActive = Object.keys(log)
    .filter((day) => isActiveDay(log[day]))
    .sort()
    .pop();
  if (!lastActive) return undefined;
  let gap = 0;
  let cursor = lastActive;
  while (cursor < today) {
    cursor = addDays(cursor, 1);
    gap++;
  }
  return gap;
}
