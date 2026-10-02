import { levelForXp } from './levels.js';
import { initialStats } from './stats.js';
import { StateError } from '../errors.js';
import {
  ACHIEVEMENT_IDS,
  COUNT_FIELDS,
  STATE_VERSION,
  emptyTotals,
  type AchievementId,
  type DayRecord,
  type PetState,
  type Totals,
} from './types.js';

export function createPet(name: string, today: string): PetState {
  return {
    version: STATE_VERSION,
    name,
    species: 'blob',
    xp: 0,
    level: 1,
    stats: initialStats(),
    streak: 0,
    longestStreak: 0,
    totals: emptyTotals(),
    achievements: [],
    lastTickDay: today,
    dailyLog: {},
    seenEventIds: [],
  };
}

export function serializePetState(state: PetState): string {
  return `${JSON.stringify(state, null, 2)}\n`;
}

function fail(path: string, expected: string): never {
  throw new StateError(
    `Invalid pet state: "${path}" should be ${expected}. ` +
      'Fix the file by hand or delete it to hatch a new pet.',
  );
}

function asObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(path, 'an object');
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, path: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    fail(path, `a number between ${min} and ${max}`);
  }
  return value as number;
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(path, 'a non-empty string');
  return value as string;
}

function asDay(value: unknown, path: string): string {
  const text = asString(value, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(path, 'a YYYY-MM-DD date');
  return text;
}

function parseCounts(raw: Record<string, unknown>, path: string): Omit<Totals, never> {
  const totals = emptyTotals();
  for (const field of COUNT_FIELDS) totals[field] = asNumber(raw[field], `${path}.${field}`);
  totals.nightCommits = asNumber(raw.nightCommits ?? 0, `${path}.nightCommits`);
  return totals;
}

function parseDailyLog(value: unknown): Record<string, DayRecord> {
  const raw = asObject(value, 'dailyLog');
  const log: Record<string, DayRecord> = {};
  for (const [day, entry] of Object.entries(raw)) {
    const path = `dailyLog.${day}`;
    asDay(day, path);
    const obj = asObject(entry, path);
    log[day] = { ...parseCounts(obj, path), streakAwarded: obj.streakAwarded === true };
  }
  return log;
}

/** Validate untrusted JSON (a hand-edited or corrupted file) into a PetState. */
export function parsePetState(input: unknown): PetState {
  const raw = asObject(input, 'state');
  if (raw.version !== STATE_VERSION) fail('version', `${STATE_VERSION}`);

  const stats = asObject(raw.stats, 'stats');
  const xp = asNumber(raw.xp, 'xp');
  const known = new Set<string>(ACHIEVEMENT_IDS);
  const achievements = (Array.isArray(raw.achievements) ? raw.achievements : [])
    .map((a, i) => asObject(a, `achievements[${i}]`))
    .filter((a) => known.has(String(a.id)))
    .map((a, i) => ({
      id: a.id as AchievementId,
      unlockedOn: asDay(a.unlockedOn, `achievements[${i}].unlockedOn`),
    }));

  return {
    version: STATE_VERSION,
    name: asString(raw.name, 'name'),
    species: asString(raw.species ?? 'blob', 'species'),
    xp,
    level: levelForXp(xp),
    stats: {
      health: asNumber(stats.health, 'stats.health', 0, 100),
      energy: asNumber(stats.energy, 'stats.energy', 0, 100),
      hunger: asNumber(stats.hunger, 'stats.hunger', 0, 100),
      happiness: asNumber(stats.happiness, 'stats.happiness', 0, 100),
    },
    streak: asNumber(raw.streak, 'streak'),
    longestStreak: asNumber(raw.longestStreak, 'longestStreak'),
    totals: parseCounts(asObject(raw.totals, 'totals'), 'totals'),
    achievements,
    lastTickDay: asDay(raw.lastTickDay, 'lastTickDay'),
    dailyLog: parseDailyLog(raw.dailyLog),
    seenEventIds: (Array.isArray(raw.seenEventIds) ? raw.seenEventIds : []).map((id, i) =>
      asString(id, `seenEventIds[${i}]`),
    ),
  };
}
