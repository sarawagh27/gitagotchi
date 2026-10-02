import { mkdir, writeFile } from 'node:fs/promises';
import { renderEvolutionStrip } from '../src/svg/renderer.js';

/** Regenerates the README showcase evolution banner. Run with `npm run gallery`. */
await mkdir('docs', { recursive: true });
await writeFile('docs/evolution.svg', renderEvolutionStrip());
console.log('Wrote docs/evolution.svg');
