import { ConfigError } from './errors.js';
import { isValidTimeZone } from './dates.js';

export interface Config {
  username: string;
  token?: string;
  /** GitHub REST API root (GitHub Actions sets GITHUB_API_URL; useful for Enterprise). */
  apiUrl: string;
  petName: string;
  timeZone: string;
  statePath: string;
  svgPath: string;
  /** Count the ~90 days of history GitHub exposes when the pet first hatches. */
  backfill: boolean;
}

type Env = Record<string, string | undefined>;

const USERNAME_RE = /^[a-z\d](?:[a-z\d-]{0,38})$/i;
const PET_NAME_RE = /^[\p{L}\p{N} _'-]{1,16}$/u;

/** Treat empty strings (as GitHub Actions passes for unset vars) as unset. */
function read(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readBool(env: Env, key: string, fallback: boolean): boolean {
  const value = read(env, key)?.toLowerCase();
  if (value === undefined) return fallback;
  if (['1', 'true', 'yes'].includes(value)) return true;
  if (['0', 'false', 'no'].includes(value)) return false;
  throw new ConfigError(`${key} must be "true" or "false", got "${value}".`);
}

export function loadConfig(env: Env): Config {
  const username = read(env, 'GITHUB_USERNAME');
  if (!username) {
    throw new ConfigError(
      'GITHUB_USERNAME is not set. Set it to the GitHub user whose activity feeds the pet ' +
        '(or run `npm run dev` for an offline demo).',
    );
  }
  if (!USERNAME_RE.test(username)) {
    throw new ConfigError(`GITHUB_USERNAME "${username}" is not a valid GitHub username.`);
  }

  const petName = read(env, 'PET_NAME') ?? 'Nova';
  if (!PET_NAME_RE.test(petName)) {
    throw new ConfigError('PET_NAME must be 1-16 letters, numbers, spaces, apostrophes or dashes.');
  }

  const timeZone = read(env, 'PET_TIMEZONE') ?? 'UTC';
  if (!isValidTimeZone(timeZone)) {
    throw new ConfigError(
      `PET_TIMEZONE "${timeZone}" is not a valid IANA time zone (e.g. Asia/Kolkata).`,
    );
  }

  return {
    username,
    token: read(env, 'GITAGOTCHI_TOKEN') ?? read(env, 'GITHUB_TOKEN'),
    apiUrl: read(env, 'GITHUB_API_URL') ?? 'https://api.github.com',
    petName,
    timeZone,
    statePath: read(env, 'GITAGOTCHI_STATE_PATH') ?? 'data/pet.json',
    svgPath: read(env, 'GITAGOTCHI_SVG_PATH') ?? 'assets/pet.svg',
    backfill: readBool(env, 'GITAGOTCHI_BACKFILL', true),
  };
}
