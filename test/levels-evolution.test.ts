import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  levelForXp,
  levelProgress,
  nextStage,
  stageForLevel,
  xpForLevel,
} from '../src/pet/mechanics.js';

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
  it('maps levels to stages with branch archetype awareness', () => {
    expect(stageForLevel(1).id).toBe('egg');
    expect(stageForLevel(2).id).toBe('sprout');
    expect(stageForLevel(4).id).toBe('sprout');
    expect(stageForLevel(5, 'builder').id).toBe('builder');
    expect(stageForLevel(5, 'shipwright').id).toBe('shipwright');
    expect(stageForLevel(5, 'hunter').id).toBe('hunter');
    expect(stageForLevel(20, 'builder').id).toBe('architect');
    expect(stageForLevel(20, 'shipwright').id).toBe('admiral');
    expect(stageForLevel(20, 'hunter').id).toBe('voidwalker');
    expect(stageForLevel(99, 'builder').id).toBe('architect');
  });

  it('knows the next stage', () => {
    expect(nextStage(1)?.id).toBe('sprout');
    expect(nextStage(2, 'builder')?.id).toBe('builder');
    expect(nextStage(5, 'shipwright')?.id).toBe('admiral');
    expect(nextStage(20, 'builder')).toBeUndefined();
  });
});
