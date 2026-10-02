export const MAX_LEVEL = 99;

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
