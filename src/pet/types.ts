export const STATE_VERSION = 1;

export const COUNT_FIELDS = [
  'commits',
  'prsOpened',
  'prsMerged',
  'issuesOpened',
  'issuesClosed',
  'reposCreated',
] as const;
export type CountField = (typeof COUNT_FIELDS)[number];
export type Counts = Record<CountField, number>;

export type ActivityKind =
  'commit' | 'pr_opened' | 'pr_merged' | 'issue_opened' | 'issue_closed' | 'repo_created';

export const KIND_TO_FIELD: Record<ActivityKind, CountField> = {
  commit: 'commits',
  pr_opened: 'prsOpened',
  pr_merged: 'prsMerged',
  issue_opened: 'issuesOpened',
  issue_closed: 'issuesClosed',
  repo_created: 'reposCreated',
};

/** A normalized unit of GitHub activity. The engine never sees raw API payloads. */
export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** ISO timestamp */
  at: string;
  /** How many things this event stands for (a push can contain many commits). */
  count: number;
}

export interface DayRecord extends Counts {
  nightCommits: number;
  streakAwarded: boolean;
}

export interface Totals extends Counts {
  nightCommits: number;
}

export type BranchArchetype = 'builder' | 'shipwright' | 'hunter';

export interface Stats {
  /** 0-100, composite condition derived from momentum, sync, and focus. */
  vitality: number;
  /** 0-100, commit and build velocity. */
  momentum: number;
  /** 0-100, PR, review, and issue collaboration rhythm. */
  sync: number;
  /** 0-100, streak consistency and flow state. */
  focus: number;
}

export const ACHIEVEMENT_IDS = [
  'FIRST_COMMIT',
  'FIRST_PR',
  'FIRST_MERGE',
  'THREE_DAY_STREAK',
  'SEVEN_DAY_STREAK',
  'THIRTY_DAY_STREAK',
  'HUNDRED_COMMITS',
  'TEN_REPOSITORIES',
  'NIGHT_OWL',
  'WEEKEND_WARRIOR',
  'PR_MACHINE',
  'BUG_HUNTER',
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface UnlockedAchievement {
  id: AchievementId;
  /** Day key the achievement was unlocked on. */
  unlockedOn: string;
}

export interface PetState {
  version: typeof STATE_VERSION;
  name: string;
  species: string;
  branch: BranchArchetype;
  xp: number;
  level: number;
  stats: Stats;
  /** Current consecutive active days (alive until the day after the last active day ends). */
  streak: number;
  longestStreak: number;
  totals: Totals;
  achievements: UnlockedAchievement[];
  /** Last calendar day whose daily decay has been applied. */
  lastTickDay: string;
  /** Per-day activity counters, pruned to the last ~400 days. */
  dailyLog: Record<string, DayRecord>;
  /** Event ids already counted, so reruns never double-award. */
  seenEventIds: string[];
}

export function emptyDay(): DayRecord {
  return {
    commits: 0,
    prsOpened: 0,
    prsMerged: 0,
    issuesOpened: 0,
    issuesClosed: 0,
    reposCreated: 0,
    nightCommits: 0,
    streakAwarded: false,
  };
}

export function emptyTotals(): Totals {
  return {
    commits: 0,
    prsOpened: 0,
    prsMerged: 0,
    issuesOpened: 0,
    issuesClosed: 0,
    reposCreated: 0,
    nightCommits: 0,
  };
}
