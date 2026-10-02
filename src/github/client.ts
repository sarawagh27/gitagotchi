import { GitHubApiError, RateLimitError } from '../errors.js';

const MAX_WAIT_MS = 60_000;

export interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
  maxRetries?: number;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Minimal GitHub REST client: auth, retries, and clear errors. Never logs credentials. */
export class GitHubClient {
  private readonly token?: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: GitHubClientOptions = {}) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? 'https://api.github.com';
    this.maxRetries = options.maxRetries ?? 3;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async getJson<T>(path: string, query: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));

    for (let attempt = 0; ; attempt++) {
      const canRetry = attempt < this.maxRetries;
      let response: Response;
      try {
        response = await this.fetchImpl(url, { headers: this.headers() });
      } catch {
        if (canRetry) {
          await this.sleep(500 * 2 ** attempt);
          continue;
        }
        throw new GitHubApiError(`Could not reach GitHub (network error) while fetching ${path}.`);
      }

      if (response.ok) return (await response.json()) as T;

      const wait = this.retryDelay(response, attempt);
      if (wait !== undefined && canRetry) {
        await this.sleep(wait);
        continue;
      }
      throw this.toError(response, path);
    }
  }

  private headers(): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'gitagotchi',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  /** How long to wait before retrying this response, or undefined if retrying won't help. */
  private retryDelay(response: Response, attempt: number): number | undefined {
    if (response.status >= 500) return 500 * 2 ** attempt;
    if (response.status !== 403 && response.status !== 429) return undefined;
    const retryAfter = Number(response.headers.get('retry-after'));
    if (retryAfter > 0 && retryAfter * 1000 <= MAX_WAIT_MS) return retryAfter * 1000;
    return undefined;
  }

  private toError(response: Response, path: string): GitHubApiError {
    const { status } = response;
    const limited =
      status === 429 ||
      (status === 403 &&
        (response.headers.get('x-ratelimit-remaining') === '0' ||
          response.headers.has('retry-after')));
    if (limited) {
      const reset = Number(response.headers.get('x-ratelimit-reset'));
      const resetAt = reset > 0 ? new Date(reset * 1000) : undefined;
      return new RateLimitError(
        `GitHub rate limit reached${resetAt ? ` (resets ${resetAt.toISOString()})` : ''}.`,
        resetAt,
      );
    }
    if (status === 401) {
      return new GitHubApiError('GitHub rejected the token (401). Check that it is valid.', status);
    }
    if (status === 404) {
      return new GitHubApiError(`GitHub returned 404 for ${path}. Does that user exist?`, status);
    }
    return new GitHubApiError(
      `GitHub API request failed with status ${status} for ${path}.`,
      status,
    );
  }
}
