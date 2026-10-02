import { describe, expect, it, vi } from 'vitest';
import { toActivityEvents, type RawGitHubEvent } from '../src/github/activity.js';
import { GitHubClient } from '../src/github/client.js';
import { GitHubApiError, RateLimitError, redactSecrets } from '../src/errors.js';
import { loadConfig } from '../src/config.js';
import { ConfigError } from '../src/errors.js';

describe('toActivityEvents', () => {
  const base = { created_at: '2026-03-01T10:00:00Z' };
  const raw: RawGitHubEvent[] = [
    { ...base, id: '1', type: 'PushEvent', payload: { size: 5, distinct_size: 3 } },
    { ...base, id: '2', type: 'PushEvent', payload: { size: 0, distinct_size: 0 } },
    { ...base, id: '3', type: 'PullRequestEvent', payload: { action: 'opened' } },
    {
      ...base,
      id: '4',
      type: 'PullRequestEvent',
      payload: { action: 'closed', pull_request: { merged: true } },
    },
    {
      ...base,
      id: '5',
      type: 'PullRequestEvent',
      payload: { action: 'closed', pull_request: { merged: false } },
    },
    { ...base, id: '6', type: 'IssuesEvent', payload: { action: 'opened' } },
    { ...base, id: '7', type: 'IssuesEvent', payload: { action: 'closed' } },
    { ...base, id: '8', type: 'CreateEvent', payload: { ref_type: 'repository' } },
    { ...base, id: '9', type: 'CreateEvent', payload: { ref_type: 'branch' } },
    { ...base, id: '10', type: 'WatchEvent' },
  ];

  it('maps relevant events and drops the rest', () => {
    const events = toActivityEvents(raw);
    expect(events.map((e) => [e.id, e.kind, e.count])).toEqual([
      ['1', 'commit', 3],
      ['3', 'pr_opened', 1],
      ['4', 'pr_merged', 1],
      ['6', 'issue_opened', 1],
      ['7', 'issue_closed', 1],
      ['8', 'repo_created', 1],
    ]);
  });
});

function response(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

describe('GitHubClient', () => {
  const sleep = vi.fn(async () => {});

  it('sends auth only when a token is configured', async () => {
    const fetchImpl = vi.fn(async () => response(200, { ok: true }));
    await new GitHubClient({ token: 'secret', fetchImpl: fetchImpl as never, sleep }).getJson('/x');
    await new GitHubClient({ fetchImpl: fetchImpl as never, sleep }).getJson('/x');
    const [first, second] = fetchImpl.mock.calls.map(
      (c) => (c as unknown as [URL, RequestInit])[1].headers as Record<string, string>,
    );
    expect(first.Authorization).toBe('Bearer secret');
    expect(second.Authorization).toBeUndefined();
  });

  it('retries server errors then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(502))
      .mockResolvedValueOnce(response(200, [1]));
    const out = await new GitHubClient({ fetchImpl: fetchImpl as never, sleep }).getJson('/x');
    expect(out).toEqual([1]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('honors retry-after for secondary limits', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(response(403, {}, { 'retry-after': '2' }))
      .mockResolvedValueOnce(response(200, { done: true }));
    await new GitHubClient({ fetchImpl: fetchImpl as never, sleep }).getJson('/x');
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('raises RateLimitError when the primary limit is exhausted', async () => {
    const fetchImpl = vi.fn(async () =>
      response(403, {}, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1900000000' }),
    );
    await expect(
      new GitHubClient({ fetchImpl: fetchImpl as never, sleep }).getJson('/x'),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('gives helpful errors for 401 and 404', async () => {
    const make = (status: number) =>
      new GitHubClient({ fetchImpl: (async () => response(status)) as never, sleep }).getJson(
        '/users/ghost/events',
      );
    await expect(make(401)).rejects.toThrow(/token/);
    await expect(make(404)).rejects.toThrow(/exist/);
    await expect(make(404)).rejects.toBeInstanceOf(GitHubApiError);
  });

  it('gives up after repeated network failures', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });
    await expect(
      new GitHubClient({ fetchImpl: fetchImpl as never, sleep, maxRetries: 2 }).getJson('/x'),
    ).rejects.toThrow(/network/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});

describe('redactSecrets', () => {
  it('removes secrets from text', () => {
    expect(redactSecrets('token abc123 leaked', ['abc123', undefined])).toBe('token *** leaked');
  });
});

describe('loadConfig', () => {
  it('requires a username', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
  });

  it('applies defaults and treats empty strings as unset', () => {
    const config = loadConfig({
      GITHUB_USERNAME: 'octocat',
      PET_NAME: '',
      PET_TIMEZONE: '',
      GITHUB_TOKEN: '',
    });
    expect(config).toMatchObject({
      petName: 'Nova',
      timeZone: 'UTC',
      backfill: true,
      token: undefined,
    });
  });

  it('prefers GITAGOTCHI_TOKEN over GITHUB_TOKEN', () => {
    const config = loadConfig({
      GITHUB_USERNAME: 'octocat',
      GITAGOTCHI_TOKEN: 'a',
      GITHUB_TOKEN: 'b',
    });
    expect(config.token).toBe('a');
  });

  it('rejects invalid values', () => {
    expect(() => loadConfig({ GITHUB_USERNAME: 'bad name!' })).toThrow(/valid GitHub username/);
    expect(() => loadConfig({ GITHUB_USERNAME: 'a', PET_TIMEZONE: 'Mars/Base' })).toThrow(
      /time zone/,
    );
    expect(() => loadConfig({ GITHUB_USERNAME: 'a', PET_NAME: '<script>' })).toThrow(/PET_NAME/);
    expect(() => loadConfig({ GITHUB_USERNAME: 'a', GITAGOTCHI_BACKFILL: 'maybe' })).toThrow(
      /true/,
    );
  });
});
