import { mkdir, writeFile } from 'node:fs/promises';
import { demoPet } from '../src/demo.js';
import { STAGES } from '../src/pet/evolution.js';
import { xpForLevel } from '../src/pet/levels.js';
import { chooseMessage } from '../src/pet/personality.js';
import { renderEvolutionStrip, renderPetSvg } from '../src/svg/renderer.js';
import { dayKey } from '../src/util/dates.js';

/** Regenerates the README showcase images. Run with `npm run gallery`. */
const now = new Date('2026-01-15T12:00:00Z');
const today = dayKey(now, 'UTC');
await mkdir('docs/stages', { recursive: true });
await mkdir('assets', { recursive: true });

const demo = demoPet('Nova', now);
const demoSvg = renderPetSvg(demo, { message: chooseMessage(demo, today), owner: 'you' });
await writeFile('docs/demo.svg', demoSvg);
// Placeholder until the first workflow run replaces it with the real pet.
await writeFile('assets/pet.svg', demoSvg);
await writeFile('docs/evolution.svg', renderEvolutionStrip());

for (const stage of STAGES) {
  const xp = xpForLevel(stage.minLevel) + 10;
  const state = { ...demo, xp, level: stage.minLevel };
  await writeFile(
    `docs/stages/${stage.id}.svg`,
    renderPetSvg(state, { message: chooseMessage(state, today), owner: 'you' }),
  );
}
console.log('Wrote docs/demo.svg, docs/evolution.svg, docs/stages/*.svg and assets/pet.svg');
