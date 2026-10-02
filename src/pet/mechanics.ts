import { addDays } from '../dates.js';
import { COUNT_FIELDS, type CountField, type DayRecord, type Stats } from './types.js';

/* ─── Levels & Evolution ─── */

export const MAX_LEVEL = 99;

export type StageId = 'egg' | 'hatchling' | 'developer' | 'code_beast' | 'git_monster' | 'legend';

export interface Stage {
  id: StageId;
  title: string;
  minLevel: number;
}

export const STAGES: readonly Stage[] = [
  { id: 'egg', title: 'Egg', minLevel: 1 },
  { id: 'hatchling', title: 'Hatchling', minLevel: 2 },
  { id: 'developer', title: 'Developer', minLevel: 5 },
  { id: 'code_beast', title: 'Code Beast', minLevel: 10 },
  { id: 'git_monster', title: 'Git Monster', minLevel: 20 },
  { id: 'legend', title: 'GitHub Legend', minLevel: 50 },
];

export function stageForLevel(level: number): Stage {
  let current = STAGES[0];
  for (const stage of STAGES) if (level >= stage.minLevel) current = stage;
  return current;
}

export function nextStage(level: number): Stage | undefined {
  return STAGES.find((stage) => stage.minLevel > level);
}

/** Total XP needed to reach `level`. Level 1 is free; the curve is gently quadratic. */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.min(level, MAX_LEVEL));
  return 25 * (n - 1) * n;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0-1 progress toward the next level (1 at max level). */
  ratio: number;
  maxed: boolean;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return { level, xpIntoLevel: 0, xpForNext: 0, ratio: 1, maxed: true };
  const floor = xpForLevel(level);
  const xpForNext = xpForLevel(level + 1) - floor;
  const xpIntoLevel = xp - floor;
  return { level, xpIntoLevel, xpForNext, ratio: xpIntoLevel / xpForNext, maxed: false };
}

/* ─── XP & Daily Caps ─── */

interface XpRule {
  xp: number;
  /** Max countable units per calendar day to avoid artificial farming. */
  dailyCap: number;
}

export const XP_RULES: Record<CountField, XpRule> = {
  commits: { xp: 10, dailyCap: 10 },
  prsOpened: { xp: 25, dailyCap: 4 },
  prsMerged: { xp: 50, dailyCap: 4 },
  issuesOpened: { xp: 5, dailyCap: 5 },
  issuesClosed: { xp: 20, dailyCap: 3 },
  reposCreated: { xp: 75, dailyCap: 2 },
};

export const STREAK_XP = 10;
export const ACHIEVEMENT_XP = 25;

const STREAK_MILESTONES: Record<number, number> = { 7: 50, 30: 200, 100: 500, 365: 1000 };

export function cappedDelta(before: number, after: number, cap: number): number {
  return Math.max(0, Math.min(after, cap) - Math.min(before, cap));
}

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

/* ─── Streaks ─── */

type DailyLog = Record<string, DayRecord>;

export function streakAt(log: DailyLog, day: string): number {
  let count = 0;
  let cursor = day;
  while (isActiveDay(log[cursor])) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function currentStreak(log: DailyLog, today: string): number {
  return isActiveDay(log[today]) ? streakAt(log, today) : streakAt(log, addDays(today, -1));
}

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

/* ─── Stats & Moods ─── */

export type Mood = 'happy' | 'content' | 'hungry' | 'sleepy' | 'sad' | 'weak';

export function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function deriveHealth(s: Omit<Stats, 'health'>): number {
  return clamp(0.4 * (100 - s.hunger) + 0.3 * s.energy + 0.3 * s.happiness);
}

function buildStats(energy: number, hunger: number, happiness: number): Stats {
  const e = clamp(energy);
  const h = clamp(hunger);
  const j = clamp(happiness);
  return {
    health: deriveHealth({ energy: e, hunger: h, happiness: j }),
    energy: e,
    hunger: h,
    happiness: j,
  };
}

export function initialStats(): Stats {
  return buildStats(60, 40, 60);
}

export function applyDailyDecay(s: Stats, previousDayActive: boolean): Stats {
  const idle = previousDayActive ? 0 : 1;
  return buildStats(s.energy - 8, s.hunger + 10 + 8 * idle, s.happiness - 5 - 6 * idle);
}

export function feedPet(s: Stats, xp: number, happinessBonus = 0): Stats {
  return buildStats(
    s.energy + xp * 0.2,
    s.hunger - xp * 0.25,
    s.happiness + xp * 0.12 + happinessBonus,
  );
}

export function moodOf(s: Stats): Mood {
  if (s.health <= 15) return 'weak';
  if (s.hunger >= 75) return 'hungry';
  if (s.energy <= 20) return 'sleepy';
  if (s.happiness <= 30) return 'sad';
  if (s.happiness >= 70 && s.hunger < 60) return 'happy';
  return 'content';
}
