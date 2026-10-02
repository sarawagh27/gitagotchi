import { describe, expect, it } from 'vitest';
import {
  activityXp,
  cappedDelta,
  isActiveDay,
  streakMilestoneBonus,
  XP_RULES,
} from '../src/pet/xp.js';
import { emptyDay } from '../src/pet/types.js';

describe('xp rules', () => {
  it('awards the documented amounts', () => {
    const after = {
      ...emptyDay(),
      commits: 3,
      prsOpened: 1,
      prsMerged: 1,
      issuesOpened: 1,
      issuesClosed: 1,
      reposCreated: 1,
    };
    expect(activityXp(emptyDay(), after)).toBe(3 * 10 + 25 + 50 + 5 + 20 + 75);
  });

  it('caps daily XP so spam cannot be farmed', () => {
    const spam = { ...emptyDay(), commits: 500 };
    expect(activityXp(emptyDay(), spam)).toBe(XP_RULES.commits.dailyCap * XP_RULES.commits.xp);
  });

  it('only counts the portion of a batch that fits under the cap', () => {
    expect(cappedDelta(8, 15, 10)).toBe(2);
    expect(cappedDelta(12, 20, 10)).toBe(0);
  });

  it('awards nothing when nothing changed', () => {
    const day = { ...emptyDay(), commits: 4 };
    expect(activityXp(day, day)).toBe(0);
  });

  it('adds milestone bonuses only at milestones', () => {
    expect(streakMilestoneBonus(7)).toBeGreaterThan(0);
    expect(streakMilestoneBonus(8)).toBe(0);
  });

  it('detects active days', () => {
    expect(isActiveDay(undefined)).toBe(false);
    expect(isActiveDay(emptyDay())).toBe(false);
    expect(isActiveDay({ ...emptyDay(), issuesOpened: 1 })).toBe(true);
  });
});
