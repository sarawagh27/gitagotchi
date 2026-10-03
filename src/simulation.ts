import { findNewAchievements, type AchievementDef } from './achievements.js';
import { addDays, dayKey, daysBetween, hourOf } from './dates.js';
import {
  ACHIEVEMENT_XP,
  STREAK_XP,
  activityXp,
  applyDailyDecay,
  currentStreak,
  determineBranch,
  feedPet,
  isActiveDay,
  levelForXp,
  streakAt,
  streakMilestoneBonus,
} from './pet/mechanics.js';
import { KIND_TO_FIELD, emptyDay, type ActivityEvent, type PetState } from './pet/types.js';

const MAX_DECAY_DAYS = 60;
const MAX_LOG_DAYS = 400;
const MAX_SEEN_IDS = 400;
const NIGHT_END_HOUR = 5;

export interface SimulationOptions {
  now: Date;
  timeZone: string;
}

export interface SimulationResult {
  state: PetState;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  newAchievements: AchievementDef[];
  processedEvents: number;
}

function byTime(a: ActivityEvent, b: ActivityEvent): number {
  return a.at < b.at ? -1 : a.at > b.at ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Apply daily decay for every calendar day that started since the last run. */
function applyElapsedDays(state: PetState, today: string): void {
  const gap = daysBetween(state.lastTickDay, today);
  if (gap <= 0) return;
  // Stats saturate long before 60 days, so older gaps add nothing.
  for (let i = Math.max(1, gap - MAX_DECAY_DAYS + 1); i <= gap; i++) {
    const previous = addDays(state.lastTickDay, i - 1);
    state.stats = applyDailyDecay(state.stats, isActiveDay(state.dailyLog[previous]));
  }
  state.lastTickDay = today;
}

/** Fold one day's new events into the log; returns the XP they earned. */
function applyDay(state: PetState, day: string, events: ActivityEvent[], timeZone: string): number {
  const before = state.dailyLog[day] ?? emptyDay();
  const after = { ...before };
  state.dailyLog[day] = after;

  for (const event of events) {
    const field = KIND_TO_FIELD[event.kind];
    after[field] += event.count;
    state.totals[field] += event.count;
    if (event.kind === 'commit' && hourOf(event.at, timeZone) < NIGHT_END_HOUR) {
      after.nightCommits += event.count;
      state.totals.nightCommits += event.count;
    }
  }

  let xp = activityXp(before, after);
  let happinessBonus = 0;
  if (isActiveDay(after) && !after.streakAwarded) {
    after.streakAwarded = true;
    const streak = streakAt(state.dailyLog, day);
    state.longestStreak = Math.max(state.longestStreak, streak);
    if (streak >= 2) {
      xp += STREAK_XP + streakMilestoneBonus(streak);
      happinessBonus = Math.min(streak, 10);
    }
  }
  state.stats = feedPet(state.stats, xp, happinessBonus);
  return xp;
}

function prune(state: PetState, today: string): void {
  const oldest = addDays(today, -MAX_LOG_DAYS);
  for (const day of Object.keys(state.dailyLog)) if (day < oldest) delete state.dailyLog[day];
  state.seenEventIds = state.seenEventIds.slice(-MAX_SEEN_IDS);
}

/**
 * The whole pet engine: previous state + new activity + the clock -> next state.
 * Pure (no I/O, no randomness), so it is trivially testable and rerunnable.
 */
export function simulate(
  previous: PetState,
  events: ActivityEvent[],
  { now, timeZone }: SimulationOptions,
): SimulationResult {
  const state = structuredClone(previous);
  const today = dayKey(now, timeZone);
  const seen = new Set(state.seenEventIds);
  const fresh = events.filter((e) => e.count > 0 && !seen.has(e.id)).sort(byTime);

  applyElapsedDays(state, today);

  let xpGained = 0;
  const byDay = new Map<string, ActivityEvent[]>();
  for (const event of fresh) {
    const day = dayKey(event.at, timeZone);
    byDay.set(day, [...(byDay.get(day) ?? []), event]);
  }
  for (const [day, group] of byDay) xpGained += applyDay(state, day, group, timeZone);

  state.seenEventIds.push(...fresh.map((e) => e.id));
  state.streak = currentStreak(state.dailyLog, today);
  state.longestStreak = Math.max(state.longestStreak, state.streak);

  const newAchievements = findNewAchievements(state);
  for (const achievement of newAchievements) {
    state.achievements.push({ id: achievement.id, unlockedOn: today });
  }
  xpGained += newAchievements.length * ACHIEVEMENT_XP;

  state.xp += xpGained;
  state.level = levelForXp(state.xp);
  state.branch = determineBranch(state.totals);
  prune(state, today);

  return {
    state,
    xpGained,
    levelBefore: previous.level,
    levelAfter: state.level,
    newAchievements,
    processedEvents: fresh.length,
  };
}

/** Mark events as seen without awarding anything (used when backfill is disabled). */
export function markEventsSeen(previous: PetState, events: ActivityEvent[]): PetState {
  const state = structuredClone(previous);
  state.seenEventIds = [...state.seenEventIds, ...events.map((e) => e.id)].slice(-MAX_SEEN_IDS);
  return state;
}
