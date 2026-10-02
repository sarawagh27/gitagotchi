import type { Stats } from './types.js';

export type Mood = 'happy' | 'content' | 'hungry' | 'sleepy' | 'sad' | 'weak';

export function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Health is just a weighted blend: a fed, rested, happy pet is a healthy pet. */
export function deriveHealth(s: Omit<Stats, 'health'>): number {
  return clamp(0.4 * (100 - s.hunger) + 0.3 * s.energy + 0.3 * s.happiness);
}

function build(energy: number, hunger: number, happiness: number): Stats {
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
  return build(60, 40, 60);
}

/** Applied once per calendar day. Skipping a day makes things noticeably worse. */
export function applyDailyDecay(s: Stats, previousDayActive: boolean): Stats {
  const idle = previousDayActive ? 0 : 1;
  return build(s.energy - 8, s.hunger + 10 + 8 * idle, s.happiness - 5 - 6 * idle);
}

/** Activity feeds the pet in proportion to the XP it earned. */
export function feedPet(s: Stats, xp: number, happinessBonus = 0): Stats {
  return build(s.energy + xp * 0.2, s.hunger - xp * 0.25, s.happiness + xp * 0.12 + happinessBonus);
}

export function moodOf(s: Stats): Mood {
  if (s.health <= 15) return 'weak';
  if (s.hunger >= 75) return 'hungry';
  if (s.energy <= 20) return 'sleepy';
  if (s.happiness <= 30) return 'sad';
  if (s.happiness >= 70 && s.hunger < 60) return 'happy';
  return 'content';
}
