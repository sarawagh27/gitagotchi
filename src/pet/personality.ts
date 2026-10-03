import { daysSinceActive, isActiveDay } from './mechanics.js';
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

export function chooseMessage(state: PetState, today: string): string {
  const seed = `${state.name}:${today}`;
  const idleDays = daysSinceActive(state.dailyLog, today);
  const todayEntry = state.dailyLog[today];
  const commitsToday = todayEntry?.commits ?? 0;
  const nightCommitsToday = todayEntry?.nightCommits ?? 0;
  const prsToday = (todayEntry?.prsOpened ?? 0) + (todayEntry?.prsMerged ?? 0);
  const issuesClosedToday = todayEntry?.issuesClosed ?? 0;

  if (idleDays === undefined) {
    return pick(['working tree clean.', 'git init complete.', 'awaiting first push.'], seed);
  }

  if (idleDays >= 2) {
    return pick(
      ['quiet week. still alive.', 'working tree clean.', 'no commits recently. standing by.'],
      seed,
    );
  }

  if (nightCommitsToday > 0) {
    return pick(['push detected late.', 'compiling in the dark.', 'midnight commit landed.'], seed);
  }

  if (prsToday > 0) {
    return pick(['PR merged.', 'merged into main.', 'clean merge.'], seed);
  }

  if (issuesClosedToday > 0) {
    return pick(['issue closed.', 'bug squashed.', 'clean fix landed.'], seed);
  }

  if (commitsToday >= 8) {
    return pick(['busy day in the repo.', 'commit log moving fast.', 'clean diff.'], seed);
  }

  if (state.streak >= 7) {
    return pick(
      ['main survived another week.', 'streak continuing.', 'clean commit log this week.'],
      seed,
    );
  }

  if (state.streak >= 3) {
    return pick(['steady cadence.', 'clean rhythm.', 'branch active.'], seed);
  }

  if (isActiveDay(state.dailyLog[today])) {
    return pick(
      ['working tree clean.', 'pushed to branch.', 'main survived another commit.'],
      seed,
    );
  }

  return pick(['working tree clean.', 'standing by.', 'ready when you are.'], seed);
}
