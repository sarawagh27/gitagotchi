import { loadConfig, type Config } from './config.js';
import { demoPet } from './demo.js';
import { simulate, markEventsSeen } from './simulation.js';
import { GitagotchiError, RateLimitError, redactSecrets } from './errors.js';
import { fetchUserEvents, toActivityEvents } from './github/activity.js';
import { GitHubClient } from './github/client.js';
import { createPet, serializePetState } from './pet/pet.js';
import { chooseMessage } from './pet/personality.js';
import { readState, writeIfChanged } from './storage.js';
import { renderPetSvg } from './svg/renderer.js';
import { dayKey } from './dates.js';

const inActions = process.env.GITHUB_ACTIONS === 'true';

function warn(message: string): void {
  console.warn(inActions ? `::warning::${message}` : `warning: ${message}`);
}

function fail(message: string): void {
  console.error(inActions ? `::error::${message}` : `error: ${message}`);
}

async function runDemo(): Promise<void> {
  const now = new Date();
  const state = demoPet('Nova', now);
  const svg = renderPetSvg(state, {
    message: chooseMessage(state, dayKey(now, 'UTC')),
    owner: 'you',
  });
  await writeIfChanged('out/demo.svg', svg);
  console.log(
    `Demo pet: level ${state.level}, ${state.xp} XP, ${state.streak}-day streak.\n` +
      'Wrote out/demo.svg. Set GITHUB_USERNAME and run `npm run tick` to hatch your own.',
  );
}

async function runTick(config: Config, dryRun: boolean): Promise<void> {
  const now = new Date();
  const today = dayKey(now, config.timeZone);

  if (!config.token) {
    warn('No GITHUB_TOKEN set: using unauthenticated requests (public activity, low rate limit).');
  }

  const existing = await readState(config.statePath);
  const client = new GitHubClient({ token: config.token, baseUrl: config.apiUrl });
  const events = toActivityEvents(await fetchUserEvents(client, config.username));
  if (events.length === 0) console.log('No recent public activity found.');

  const hatching = existing === undefined;
  let previous = existing ?? createPet(config.petName, today);
  if (hatching && !config.backfill) previous = markEventsSeen(previous, events);

  const result = simulate(previous, hatching && !config.backfill ? [] : events, {
    now,
    timeZone: config.timeZone,
  });
  const { state } = result;

  const svg = renderPetSvg(state, {
    message: chooseMessage(state, today),
    owner: config.username,
  });

  if (dryRun) {
    console.log('Dry run: not writing files.');
  } else {
    const stateChanged = await writeIfChanged(config.statePath, serializePetState(state));
    const svgChanged = await writeIfChanged(config.svgPath, svg);
    console.log(stateChanged || svgChanged ? 'Pet updated.' : 'Nothing changed.');
  }

  if (hatching) console.log(`${state.name} hatched!`);
  console.log(
    `${state.name}: level ${state.level}, ${state.xp} XP (+${result.xpGained}), ` +
      `${result.processedEvents} new event(s), streak ${state.streak}.`,
  );
  if (result.levelAfter > result.levelBefore) {
    console.log(`Level up! ${result.levelBefore} -> ${result.levelAfter}`);
  }
  for (const a of result.newAchievements) console.log(`Achievement unlocked: ${a.title}`);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  if (args.has('--demo')) return runDemo();
  await runTick(loadConfig(process.env), args.has('--dry-run'));
}

main().catch((error: unknown) => {
  const secrets = [process.env.GITAGOTCHI_TOKEN, process.env.GITHUB_TOKEN];
  const text = error instanceof Error ? error.message : String(error);
  const message = redactSecrets(text, secrets);
  if (error instanceof RateLimitError) {
    // Not fatal: the next scheduled run picks up where this one stopped.
    warn(`${message} Skipping this run.`);
    return;
  }
  fail(error instanceof GitagotchiError ? message : `Unexpected failure: ${message}`);
  process.exitCode = 1;
});
