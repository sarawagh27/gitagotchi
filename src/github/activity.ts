import type { ActivityEvent, ActivityKind } from '../pet/types.js';
import type { GitHubClient } from './client.js';

/** The subset of the GitHub events payload we read. */
export interface RawGitHubEvent {
  id: string;
  type: string;
  created_at: string;
  payload?: {
    action?: string;
    size?: number;
    distinct_size?: number;
    ref_type?: string;
    pull_request?: { merged?: boolean };
  };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 3; // the events API only exposes the latest 300 events

function pushCount(payload: NonNullable<RawGitHubEvent['payload']>): number {
  return payload.distinct_size ?? payload.size ?? 0;
}

function normalize(event: RawGitHubEvent): { kind: ActivityKind; count: number } | undefined {
  const payload = event.payload ?? {};
  switch (event.type) {
    case 'PushEvent':
      return { kind: 'commit', count: pushCount(payload) };
    case 'PullRequestEvent':
      if (payload.action === 'opened') return { kind: 'pr_opened', count: 1 };
      if (payload.action === 'closed' && payload.pull_request?.merged) {
        return { kind: 'pr_merged', count: 1 };
      }
      return undefined;
    case 'IssuesEvent':
      if (payload.action === 'opened') return { kind: 'issue_opened', count: 1 };
      if (payload.action === 'closed') return { kind: 'issue_closed', count: 1 };
      return undefined;
    case 'CreateEvent':
      return payload.ref_type === 'repository' ? { kind: 'repo_created', count: 1 } : undefined;
    default:
      return undefined;
  }
}

/** Raw GitHub events -> engine events. Unknown or zero-count events are dropped. */
export function toActivityEvents(raw: RawGitHubEvent[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const event of raw) {
    const normalized = normalize(event);
    if (normalized && normalized.count > 0) {
      events.push({ id: event.id, at: event.created_at, ...normalized });
    }
  }
  return events;
}

export async function fetchUserEvents(
  client: GitHubClient,
  username: string,
): Promise<RawGitHubEvent[]> {
  const all: RawGitHubEvent[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await client.getJson<RawGitHubEvent[]>(
      `/users/${encodeURIComponent(username)}/events`,
      { per_page: PAGE_SIZE, page },
    );
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return all;
}
