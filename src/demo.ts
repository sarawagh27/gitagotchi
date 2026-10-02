import { simulate } from './engine/simulation.js';
import { createPet } from './pet/pet.js';
import type { ActivityEvent, PetState } from './pet/types.js';
import { dayKey } from './util/dates.js';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Small deterministic PRNG so the demo looks the same every run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Synthetic activity: a few quiet days, then a hot streak ending today. */
export function demoEvents(now: Date, days = 24, seed = 7): ActivityEvent[] {
  const rand = mulberry32(seed);
  const events: ActivityEvent[] = [];
  let n = 0;
  const push = (kind: ActivityEvent['kind'], daysAgo: number, count = 1) => {
    const hoursAgo = daysAgo === 0 ? rand() * 4 : rand() * 20;
    const at = new Date(now.getTime() - daysAgo * DAY_MS - hoursAgo * HOUR_MS).toISOString();
    events.push({ id: `demo-${n++}`, kind, at, count });
  };

  for (let daysAgo = days; daysAgo >= 0; daysAgo--) {
    const inStreak = daysAgo <= 9;
    if (!inStreak && rand() < 0.3) continue;
    push('commit', daysAgo, 2 + Math.floor(rand() * 8));
    if (rand() < 0.4) push('pr_opened', daysAgo);
    if (rand() < 0.3) push('pr_merged', daysAgo);
    if (rand() < 0.25) push('issue_opened', daysAgo);
    if (rand() < 0.2) push('issue_closed', daysAgo);
    if (rand() < 0.05) push('repo_created', daysAgo);
  }
  return events;
}

export function demoPet(name: string, now: Date, timeZone = 'UTC'): PetState {
  const pet = createPet(name, dayKey(now, timeZone));
  return simulate(pet, demoEvents(now), { now, timeZone }).state;
}
