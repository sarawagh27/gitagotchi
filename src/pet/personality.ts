import { isActiveDay } from './xp.js';
import { daysSinceActive } from './streak.js';
import { addDays } from '../util/dates.js';
import type { PetState } from './types.js';

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Same day + same pet = same line, so reruns never create noisy diffs. */
function pick(lines: readonly string[], seed: string): string {
  return lines[hash(seed) % lines.length];
}

function sumLastDays(state: PetState, today: string, days: number) {
  const total = { commits: 0, prs: 0, issues: 0 };
  for (let i = 0; i < days; i++) {
    const day = state.dailyLog[addDays(today, -i)];
    if (!day) continue;
    total.commits += day.commits;
    total.prs += day.prsOpened + day.prsMerged;
    total.issues += day.issuesOpened;
  }
  return total;
}

export function chooseMessage(state: PetState, today: string): string {
  const seed = `${state.name}:${today}`;
  const idleDays = daysSinceActive(state.dailyLog, today);
  const week = sumLastDays(state, today, 7);
  const commitsToday = state.dailyLog[today]?.commits ?? 0;

  if (idleDays === undefined) {
    return pick(['Make a commit to wake me up.', 'Feed me code?', 'Hello world?'], seed);
  }
  if (idleDays >= 7) {
    return pick(['Is this thing on?', 'Remember me?', 'It has been so quiet...'], seed);
  }
  if (idleDays >= 2) {
    return pick(['I miss you.', 'Just one commit? Please?', 'The repos are lonely.'], seed);
  }
  if (week.prs >= 10) return pick(['PR machine detected.', 'So many pull requests.'], seed);
  if (week.issues >= 8)
    return pick(['We need to talk about your bugs.', 'Issue tracker: full.'], seed);
  if (commitsToday >= 10) return pick(["You haven't stopped coding.", 'Touch grass? Later.'], seed);
  if (state.streak >= 14) return pick(["We're cooking.", 'The streak is sacred.'], seed);
  if (state.streak >= 3) return pick(["We're cooking.", 'Keep it going.', 'Streak mode on.'], seed);
  if (state.stats.hunger >= 70) return pick(['Feed me commits.', 'My tummy says merge.'], seed);
  if (isActiveDay(state.dailyLog[today])) {
    return pick(['Still coding. Respect.', 'Nice. Do that again.', 'Tasty commits.'], seed);
  }
  return pick(['Ready when you are.', 'Waiting for your next push.', 'Hi. Ship something?'], seed);
}
