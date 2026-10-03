import { describe, expect, it } from 'vitest';
import { markEventsSeen, simulate } from '../src/simulation.js';
import { createPet, parsePetState, serializePetState } from '../src/pet/pet.js';
import { chooseMessage } from '../src/pet/personality.js';
import { StateError } from '../src/errors.js';
import { ev, newPet, noon, TZ } from './helpers.js';

const run = (state: ReturnType<typeof newPet>, events: ReturnType<typeof ev>[], day: string) =>
  simulate(state, events, { now: noon(day), timeZone: TZ });

describe('simulate: XP and levels', () => {
  it('awards XP for activity and levels the pet up', () => {
    const result = run(
      newPet(),
      [ev('commit', '2026-03-01', 5), ev('pr_merged', '2026-03-01')],
      '2026-03-01',
    );
    // 5 commits (50) + merged PR (50) + FIRST_COMMIT/FIRST_MERGE achievements (2 x 25)
    expect(result.xpGained).toBe(150);
    expect(result.state.level).toBe(3);
    expect(result.levelAfter).toBeGreaterThan(result.levelBefore);
  });

  it('is idempotent: replaying the same events changes nothing', () => {
    const events = [ev('commit', '2026-03-01', 3)];
    const first = run(newPet(), events, '2026-03-01');
    const second = run(first.state, events, '2026-03-01');
    expect(second.processedEvents).toBe(0);
    expect(second.xpGained).toBe(0);
    expect(serializePetState(second.state)).toBe(serializePetState(first.state));
  });

  it('enforces daily caps across separate runs', () => {
    const first = run(newPet(), [ev('commit', '2026-03-01', 8)], '2026-03-01');
    const second = run(first.state, [ev('commit', '2026-03-01', 8)], '2026-03-01');
    // only 2 more commits fit under the cap of 10
    expect(second.xpGained).toBe(20);
    expect(second.state.totals.commits).toBe(16);
  });

  it('handles an empty activity list', () => {
    const result = run(newPet(), [], '2026-03-01');
    expect(result.xpGained).toBe(0);
    expect(result.state.xp).toBe(0);
  });

  it('does not mutate the previous state', () => {
    const pet = newPet();
    const snapshot = serializePetState(pet);
    run(pet, [ev('commit', '2026-03-01', 3)], '2026-03-01');
    expect(serializePetState(pet)).toBe(snapshot);
  });
});

describe('simulate: streaks and achievements', () => {
  const week = ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-03-${d}`);

  it('builds a streak, pays the daily and milestone bonuses, unlocks streak achievements', () => {
    const events = week.map((day) => ev('commit', day, 1));
    const result = run(newPet(), events, '2026-03-07');
    expect(result.state.streak).toBe(7);
    expect(result.state.longestStreak).toBe(7);
    const ids = result.state.achievements.map((a) => a.id);
    expect(ids).toContain('THREE_DAY_STREAK');
    expect(ids).toContain('SEVEN_DAY_STREAK');
    // commits: 7*10, daily streak bonus: 6*10, milestone at 7: 50, achievements: 3*25
    expect(result.state.xp).toBe(70 + 60 + 50 + 75);
  });

  it('unlocks each achievement only once', () => {
    const first = run(newPet(), [ev('commit', '2026-03-01')], '2026-03-01');
    const second = run(first.state, [ev('commit', '2026-03-01', 2)], '2026-03-01');
    expect(second.newAchievements).toHaveLength(0);
    expect(second.state.achievements.filter((a) => a.id === 'FIRST_COMMIT')).toHaveLength(1);
  });

  it('unlocks count-based achievements', () => {
    const days = Array.from({ length: 12 }, (_, i) => `2026-03-${String(i + 1).padStart(2, '0')}`);
    const events = [
      ...days.map((d) => ev('commit', d, 10)),
      ...days.map((d) => ev('issue_closed', d)),
      ...days.slice(0, 10).map((d) => ev('repo_created', d)),
    ];
    const ids = run(newPet(), events, '2026-03-12').state.achievements.map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining(['HUNDRED_COMMITS', 'BUG_HUNTER', 'TEN_REPOSITORIES']),
    );
  });

  it('unlocks NIGHT_OWL from late-night commits and WEEKEND_WARRIOR from Sat+Sun', () => {
    // 2026-03-07 is a Saturday
    const events = [
      ev('commit', '2026-03-07', 3, 1),
      ev('commit', '2026-03-07', 2, 2),
      ev('commit', '2026-03-08', 1, 14),
    ];
    const ids = run(newPet(), events, '2026-03-08').state.achievements.map((a) => a.id);
    expect(ids).toContain('NIGHT_OWL');
    expect(ids).toContain('WEEKEND_WARRIOR');
  });

  it('unlocks PR_MACHINE after 25 PRs', () => {
    const events = Array.from({ length: 25 }, (_, i) =>
      ev('pr_opened', `2026-03-${String((i % 20) + 1).padStart(2, '0')}`),
    );
    const ids = run(newPet(), events, '2026-03-20').state.achievements.map((a) => a.id);
    expect(ids).toContain('PR_MACHINE');
    expect(ids).toContain('FIRST_PR');
  });
});

describe('simulate: inactivity', () => {
  it('makes the pet lose momentum, focus, and vitality each idle day', () => {
    const fed = run(newPet(), [ev('commit', '2026-03-01', 10)], '2026-03-01').state;
    const later = run(fed, [], '2026-03-05').state;
    expect(later.stats.momentum).toBeLessThan(fed.stats.momentum);
    expect(later.stats.focus).toBeLessThan(fed.stats.focus);
    expect(later.stats.vitality).toBeLessThan(fed.stats.vitality);
    expect(later.streak).toBe(0);
    expect(later.xp).toBe(fed.xp);
  });

  it('applies decay once per day, however often it runs', () => {
    const fed = run(newPet(), [ev('commit', '2026-03-01', 4)], '2026-03-01').state;
    const once = run(fed, [], '2026-03-03').state;
    const twice = run(run(fed, [], '2026-03-03').state, [], '2026-03-03').state;
    expect(twice.stats).toEqual(once.stats);
  });

  it('never underflows stats after a very long absence', () => {
    const pet = newPet('2020-01-01');
    const result = run(pet, [], '2026-03-01');
    expect(Object.values(result.state.stats).every((v) => v >= 0 && v <= 100)).toBe(true);
  });

  it('has the pet ask for you when idle', () => {
    const fed = run(newPet(), [ev('commit', '2026-03-01')], '2026-03-01').state;
    const idle = run(fed, [], '2026-03-04').state;
    expect([
      'quiet week. still alive.',
      'working tree clean.',
      'no commits recently. standing by.',
    ]).toContain(chooseMessage(idle, '2026-03-04'));
  });
});

describe('first-time setup', () => {
  it('backfills history without decaying the pet for past days', () => {
    const pet = newPet('2026-03-10');
    const events = [ev('commit', '2026-03-01', 5), ev('commit', '2026-03-02', 5)];
    const result = run(pet, events, '2026-03-10');
    expect(result.state.totals.commits).toBe(10);
    expect(result.state.stats.momentum).toBeGreaterThan(50);
  });

  it('can skip history entirely', () => {
    const events = [ev('commit', '2026-03-01', 5)];
    const seeded = markEventsSeen(newPet(), events);
    const result = run(seeded, events, '2026-03-01');
    expect(result.state.xp).toBe(0);
    expect(result.processedEvents).toBe(0);
  });
});

describe('state validation', () => {
  it('round-trips a valid state', () => {
    const state = run(newPet(), [ev('commit', '2026-03-01', 3)], '2026-03-01').state;
    expect(parsePetState(JSON.parse(serializePetState(state)))).toEqual(state);
  });

  it('rejects malformed state with a helpful message', () => {
    expect(() => parsePetState(null)).toThrow(StateError);
    expect(() => parsePetState({ version: 99 })).toThrow(/version/);
    const bad = JSON.parse(serializePetState(createPet('Nova', '2026-03-01')));
    bad.stats.vitality = 400;
    expect(() => parsePetState(bad)).toThrow(/stats\.vitality/);
  });
});
