import { addDays } from '../dates.js';
import {
  COUNT_FIELDS,
  type BranchArchetype,
  type CountField,
  type DayRecord,
  type Stats,
  type Totals,
} from './types.js';

/* ─── Levels & Evolution ─── */

export const MAX_LEVEL = 99;

export type StageId =
  'egg' | 'sprout' | 'builder' | 'architect' | 'shipwright' | 'admiral' | 'hunter' | 'voidwalker';

export interface Stage {
  id: StageId;
  title: string;
  minLevel: number;
  branch?: BranchArchetype;
}

export const STAGES: readonly Stage[] = [
  { id: 'egg', title: 'Egg', minLevel: 1 },
  { id: 'sprout', title: 'Sprout', minLevel: 2 },
  { id: 'builder', title: 'Code Builder', minLevel: 5, branch: 'builder' },
  { id: 'shipwright', title: 'Shipwright', minLevel: 5, branch: 'shipwright' },
  { id: 'hunter', title: 'Night Owl', minLevel: 5, branch: 'hunter' },
  { id: 'architect', title: 'Grand Architect', minLevel: 20, branch: 'builder' },
  { id: 'admiral', title: 'Fleet Admiral', minLevel: 20, branch: 'shipwright' },
  { id: 'voidwalker', title: 'Void Walker', minLevel: 20, branch: 'hunter' },
];

export function determineBranch(totals: Totals): BranchArchetype {
  const prVolume = totals.prsOpened + totals.prsMerged;
  const nightBugVolume = totals.nightCommits + totals.issuesClosed;
  const commitVolume = totals.commits;
  const total = prVolume + nightBugVolume + commitVolume;

  if (total < 4) return 'builder';
  if (prVolume / total >= 0.25 && prVolume >= 2) return 'shipwright';
  if (nightBugVolume / total >= 0.25 && nightBugVolume >= 2) return 'hunter';
  return 'builder';
}

export function stageForLevel(level: number, branch: BranchArchetype = 'builder'): Stage {
  if (level < 2) return STAGES[0]; // egg
  if (level < 5) return STAGES[1]; // sprout

  if (branch === 'shipwright') {
    return level >= 20 ? STAGES[6] : STAGES[3]; // admiral or shipwright
  }
  if (branch === 'hunter') {
    return level >= 20 ? STAGES[7] : STAGES[4]; // voidwalker or hunter
  }
  return level >= 20 ? STAGES[5] : STAGES[2]; // architect or builder
}

export function nextStage(level: number, branch: BranchArchetype = 'builder'): Stage | undefined {
  if (level < 2) return STAGES[1]; // sprout
  if (level < 5) {
    if (branch === 'shipwright') return STAGES[3];
    if (branch === 'hunter') return STAGES[4];
    return STAGES[2];
  }
  if (level < 20) {
    if (branch === 'shipwright') return STAGES[6];
    if (branch === 'hunter') return STAGES[7];
    return STAGES[5];
  }
  return undefined;
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

/* ─── Stats & Rhythm Vitals ─── */

export type Mood = 'happy' | 'content' | 'hungry' | 'sleepy' | 'sad' | 'weak';

export function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function deriveVitality(s: Omit<Stats, 'vitality'>): number {
  return clamp(0.4 * s.focus + 0.35 * s.momentum + 0.25 * s.sync);
}

export function deriveHealth(s: {
  energy?: number;
  hunger?: number;
  happiness?: number;
  focus?: number;
  momentum?: number;
  sync?: number;
}): number {
  const focus = s.focus ?? s.energy ?? 50;
  const momentum = s.momentum ?? 100 - (s.hunger ?? 50);
  const sync = s.sync ?? s.happiness ?? 50;
  return deriveVitality({ focus, momentum, sync });
}

function buildStats(momentum: number, sync: number, focus: number): Stats {
  const m = clamp(momentum);
  const y = clamp(sync);
  const f = clamp(focus);
  return {
    vitality: deriveVitality({ momentum: m, sync: y, focus: f }),
    momentum: m,
    sync: y,
    focus: f,
  };
}

export function initialStats(): Stats {
  return buildStats(60, 50, 60);
}

export function applyDailyDecay(s: Stats, previousDayActive: boolean): Stats {
  const idle = previousDayActive ? 0 : 1;
  return buildStats(
    s.momentum - (6 + 8 * idle),
    s.sync - (4 + 6 * idle),
    s.focus - (2 + 10 * idle),
  );
}

export function feedPet(s: Stats, xp: number, streakBonus = 0): Stats {
  return buildStats(s.momentum + xp * 0.3, s.sync + xp * 0.25, s.focus + xp * 0.15 + streakBonus);
}

export function moodOf(s: Stats): Mood {
  if (s.vitality <= 20) return 'weak';
  if (s.momentum <= 25 && s.focus <= 25) return 'sleepy';
  if (s.momentum <= 35) return 'hungry';
  if (s.sync <= 25 && s.momentum >= 50) return 'sad';
  if (s.vitality >= 70 && s.momentum >= 50) return 'happy';
  return 'content';
}
