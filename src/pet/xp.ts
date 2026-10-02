import { COUNT_FIELDS, type CountField, type DayRecord } from './types.js';

interface Rule {
  xp: number;
  /** Max countable units per calendar day. Stops spam from farming XP. */
  dailyCap: number;
}

export const XP_RULES: Record<CountField, Rule> = {
  commits: { xp: 10, dailyCap: 10 },
  prsOpened: { xp: 25, dailyCap: 4 },
  prsMerged: { xp: 50, dailyCap: 4 },
  issuesOpened: { xp: 5, dailyCap: 5 },
  issuesClosed: { xp: 20, dailyCap: 3 },
  reposCreated: { xp: 75, dailyCap: 2 },
};

/** Awarded once per active day when the streak is 2+ days long. */
export const STREAK_XP = 10;
export const ACHIEVEMENT_XP = 25;

const STREAK_MILESTONES: Record<number, number> = { 7: 50, 30: 200, 100: 500, 365: 1000 };

/** Units that newly count toward XP when a day's counter moves from `before` to `after`. */
export function cappedDelta(before: number, after: number, cap: number): number {
  return Math.max(0, Math.min(after, cap) - Math.min(before, cap));
}

/** XP earned by the activity that moved a day's counters from `before` to `after`. */
export function activityXp(before: DayRecord, after: DayRecord): number {
  return COUNT_FIELDS.reduce((sum, field) => {
    const { xp, dailyCap } = XP_RULES[field];
    return sum + cappedDelta(before[field], after[field], dailyCap) * xp;
  }, 0);
}

export function streakMilestoneBonus(streak: number): number {
  return STREAK_MILESTONES[streak] ?? 0;
}

export function isActiveDay(record: DayRecord | undefined): boolean {
  return record !== undefined && COUNT_FIELDS.some((field) => record[field] > 0);
}
