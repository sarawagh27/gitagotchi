export class GitagotchiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Missing or invalid environment configuration. */
export class ConfigError extends GitagotchiError {}

/** The persisted pet file is unreadable or malformed. */
export class StateError extends GitagotchiError {}

export class GitHubApiError extends GitagotchiError {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

/** GitHub asked us to stop. Not fatal: the next scheduled run will catch up. */
export class RateLimitError extends GitHubApiError {
  constructor(
    message: string,
    readonly resetAt?: Date,
  ) {
    super(message, 429);
  }
}

/** Replace any secret values that might have leaked into text. */
export function redactSecrets(text: string, secrets: (string | undefined)[]): string {
  return secrets.reduce<string>(
    (out, secret) => (secret ? out.split(secret).join('***') : out),
    text,
  );
}
