import { addDays, weekdayOf } from '../util/dates.js';
import { isActiveDay } from '../pet/xp.js';
import type { AchievementId, PetState } from '../pet/types.js';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  isUnlocked(state: PetState): boolean;
}

/** Active on both days of the same weekend. */
function hasActiveWeekend(state: PetState): boolean {
  return Object.keys(state.dailyLog).some(
    (day) =>
      weekdayOf(day) === 6 &&
      isActiveDay(state.dailyLog[day]) &&
      isActiveDay(state.dailyLog[addDays(day, 1)]),
  );
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'FIRST_COMMIT',
    title: 'First Commit',
    description: 'Make your first commit.',
    isUnlocked: (s) => s.totals.commits >= 1,
  },
  {
    id: 'FIRST_PR',
    title: 'First PR',
    description: 'Open your first pull request.',
    isUnlocked: (s) => s.totals.prsOpened >= 1,
  },
  {
    id: 'FIRST_MERGE',
    title: 'First Merge',
    description: 'Merge a pull request.',
    isUnlocked: (s) => s.totals.prsMerged >= 1,
  },
  {
    id: 'THREE_DAY_STREAK',
    title: 'Warming Up',
    description: 'Be active 3 days in a row.',
    isUnlocked: (s) => s.longestStreak >= 3,
  },
  {
    id: 'SEVEN_DAY_STREAK',
    title: 'Week Warrior',
    description: 'Be active 7 days in a row.',
    isUnlocked: (s) => s.longestStreak >= 7,
  },
  {
    id: 'THIRTY_DAY_STREAK',
    title: 'Unstoppable',
    description: 'Be active 30 days in a row.',
    isUnlocked: (s) => s.longestStreak >= 30,
  },
  {
    id: 'HUNDRED_COMMITS',
    title: 'Centurion',
    description: 'Reach 100 commits.',
    isUnlocked: (s) => s.totals.commits >= 100,
  },
  {
    id: 'TEN_REPOSITORIES',
    title: 'Repo Collector',
    description: 'Create 10 repositories.',
    isUnlocked: (s) => s.totals.reposCreated >= 10,
  },
  {
    id: 'NIGHT_OWL',
    title: 'Night Owl',
    description: 'Push 5 commits between midnight and 5am.',
    isUnlocked: (s) => s.totals.nightCommits >= 5,
  },
  {
    id: 'WEEKEND_WARRIOR',
    title: 'Weekend Warrior',
    description: 'Be active on both Saturday and Sunday.',
    isUnlocked: hasActiveWeekend,
  },
  {
    id: 'PR_MACHINE',
    title: 'PR Machine',
    description: 'Open 25 pull requests.',
    isUnlocked: (s) => s.totals.prsOpened >= 25,
  },
  {
    id: 'BUG_HUNTER',
    title: 'Bug Hunter',
    description: 'Close 10 issues.',
    isUnlocked: (s) => s.totals.issuesClosed >= 10,
  },
];

export function findAchievement(id: AchievementId): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Achievements whose conditions are now met but that aren't recorded yet. */
export function findNewAchievements(state: PetState): AchievementDef[] {
  const unlocked = new Set(state.achievements.map((a) => a.id));
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.isUnlocked(state));
}
