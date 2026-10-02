import { describe, expect, it } from 'vitest';
import {
  applyDailyDecay,
  currentStreak,
  daysSinceActive,
  feedPet,
  initialStats,
  moodOf,
  streakAt,
} from '../src/pet/mechanics.js';
import { emptyDay, type DayRecord } from '../src/pet/types.js';

const active = (): DayRecord => ({ ...emptyDay(), commits: 1 });

describe('stats', () => {
  it('stays within 0-100 no matter what', () => {
    let s = initialStats();
    for (let i = 0; i < 200; i++) s = feedPet(s, 1000, 50);
    expect(Object.values(s).every((v) => v >= 0 && v <= 100)).toBe(true);
    for (let i = 0; i < 200; i++) s = applyDailyDecay(s, false);
    expect(Object.values(s).every((v) => v >= 0 && v <= 100)).toBe(true);
  });

  it('feeding lowers hunger and raises energy and happiness', () => {
    const before = initialStats();
    const after = feedPet(before, 100);
    expect(after.hunger).toBeLessThan(before.hunger);
    expect(after.energy).toBeGreaterThan(before.energy);
    expect(after.happiness).toBeGreaterThan(before.happiness);
  });

  it('inactive days hurt more than active days', () => {
    const s = initialStats();
    const afterActive = applyDailyDecay(s, true);
    const afterIdle = applyDailyDecay(s, false);
    expect(afterIdle.hunger).toBeGreaterThan(afterActive.hunger);
    expect(afterIdle.happiness).toBeLessThan(afterActive.happiness);
    expect(afterIdle.health).toBeLessThan(afterActive.health);
  });

  it('a long absence starves the pet', () => {
    let s = initialStats();
    for (let i = 0; i < 10; i++) s = applyDailyDecay(s, false);
    expect(s.hunger).toBe(100);
    expect(moodOf(s)).toBe('weak');
  });

  it('derives mood from stats', () => {
    expect(moodOf({ health: 90, energy: 90, hunger: 10, happiness: 90 })).toBe('happy');
    expect(moodOf({ health: 50, energy: 50, hunger: 80, happiness: 50 })).toBe('hungry');
    expect(moodOf({ health: 50, energy: 10, hunger: 40, happiness: 50 })).toBe('sleepy');
    expect(moodOf({ health: 50, energy: 50, hunger: 40, happiness: 20 })).toBe('sad');
  });
});

describe('streaks', () => {
  const log = {
    '2026-03-01': active(),
    '2026-03-02': active(),
    '2026-03-03': active(),
    '2026-03-05': active(),
  };

  it('counts consecutive active days', () => {
    expect(streakAt(log, '2026-03-03')).toBe(3);
    expect(streakAt(log, '2026-03-04')).toBe(0);
    expect(streakAt(log, '2026-03-05')).toBe(1);
  });

  it('keeps the streak alive through an idle morning', () => {
    expect(currentStreak(log, '2026-03-04')).toBe(3);
  });

  it('breaks the streak after a full idle day', () => {
    expect(currentStreak(log, '2026-03-06')).toBe(1);
    expect(currentStreak(log, '2026-03-07')).toBe(0);
  });

  it('measures days since last activity', () => {
    expect(daysSinceActive(log, '2026-03-05')).toBe(0);
    expect(daysSinceActive(log, '2026-03-09')).toBe(4);
    expect(daysSinceActive({}, '2026-03-09')).toBeUndefined();
  });
});
