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

  it('activity boosts momentum, sync, focus, and vitality', () => {
    const before = initialStats();
    const after = feedPet(before, 100, 5);
    expect(after.momentum).toBeGreaterThan(before.momentum);
    expect(after.sync).toBeGreaterThan(before.sync);
    expect(after.focus).toBeGreaterThan(before.focus);
    expect(after.vitality).toBeGreaterThan(before.vitality);
  });

  it('inactive days decay rhythm more than active days', () => {
    const s = initialStats();
    const afterActive = applyDailyDecay(s, true);
    const afterIdle = applyDailyDecay(s, false);
    expect(afterIdle.momentum).toBeLessThan(afterActive.momentum);
    expect(afterIdle.sync).toBeLessThan(afterActive.sync);
    expect(afterIdle.vitality).toBeLessThan(afterActive.vitality);
  });

  it('a long absence drops momentum and vitality to resting/weak', () => {
    let s = initialStats();
    for (let i = 0; i < 15; i++) s = applyDailyDecay(s, false);
    expect(s.momentum).toBe(0);
    expect(moodOf(s)).toBe('weak');
  });

  it('derives mood from rhythm vitals', () => {
    expect(moodOf({ vitality: 90, momentum: 90, sync: 90, focus: 90 })).toBe('happy');
    expect(moodOf({ vitality: 50, momentum: 30, sync: 50, focus: 50 })).toBe('hungry');
    expect(moodOf({ vitality: 50, momentum: 20, sync: 40, focus: 20 })).toBe('sleepy');
    expect(moodOf({ vitality: 50, momentum: 60, sync: 20, focus: 50 })).toBe('sad');
    expect(moodOf({ vitality: 15, momentum: 10, sync: 10, focus: 10 })).toBe('weak');
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
