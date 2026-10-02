import { describe, expect, it } from 'vitest';
import { nextStage, stageForLevel } from '../src/pet/evolution.js';
import { MAX_LEVEL, levelForXp, levelProgress, xpForLevel } from '../src/pet/levels.js';

describe('levels', () => {
  it('starts at level 1 with no XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
  });

  it('is consistent with its own thresholds', () => {
    for (let level = 2; level <= 60; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
      expect(levelForXp(xpForLevel(level) - 1)).toBe(level - 1);
    }
  });

  it('caps at the max level', () => {
    expect(levelForXp(10 ** 9)).toBe(MAX_LEVEL);
    expect(levelProgress(10 ** 9).maxed).toBe(true);
  });

  it('reports progress toward the next level', () => {
    const xp = xpForLevel(3) + (xpForLevel(4) - xpForLevel(3)) / 2;
    const progress = levelProgress(xp);
    expect(progress.level).toBe(3);
    expect(progress.ratio).toBeCloseTo(0.5);
  });
});

describe('evolution', () => {
  it('maps levels to stages at the documented boundaries', () => {
    expect(stageForLevel(1).id).toBe('egg');
    expect(stageForLevel(2).id).toBe('hatchling');
    expect(stageForLevel(4).id).toBe('hatchling');
    expect(stageForLevel(5).id).toBe('developer');
    expect(stageForLevel(10).id).toBe('code_beast');
    expect(stageForLevel(20).id).toBe('git_monster');
    expect(stageForLevel(50).id).toBe('legend');
    expect(stageForLevel(99).id).toBe('legend');
  });

  it('knows the next stage', () => {
    expect(nextStage(1)?.id).toBe('hatchling');
    expect(nextStage(50)).toBeUndefined();
  });
});
