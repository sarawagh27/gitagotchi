import { describe, expect, it } from 'vitest';
import { STAGES, xpForLevel, type Mood } from '../src/pet/mechanics.js';
import {
  escapeXml,
  renderEvolutionStrip,
  renderPetSvg,
  renderPetMiniSvg,
  renderPetSpriteSvg,
} from '../src/svg/renderer.js';
import { buildSprite, GRID } from '../src/svg/sprites.js';
import { newPet } from './helpers.js';

const MOODS: Mood[] = ['happy', 'content', 'hungry', 'sleepy', 'sad', 'weak'];

describe('sprites', () => {
  it('draws every stage and mood inside the grid', () => {
    for (const stage of STAGES) {
      for (const mood of MOODS) {
        const pixels = buildSprite(stage.id, mood);
        expect(pixels.length).toBeGreaterThan(20);
        for (const p of pixels) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThan(GRID);
          expect(p.y).toBeLessThan(GRID);
        }
      }
    }
  });

  it('looks different at every evolution stage', () => {
    const looks = STAGES.map((s) => JSON.stringify(buildSprite(s.id, 'happy')));
    expect(new Set(looks).size).toBe(STAGES.length);
  });
});

describe('renderPetSvg', () => {
  it('renders a self-contained card with the pet details', () => {
    const state = { ...newPet(), name: 'Nova', xp: xpForLevel(7) + 20, level: 7, streak: 9 };
    const svg = renderPetSvg(state, { message: 'Still coding. Respect.', owner: 'octocat' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('NOVA');
    expect(svg).toContain('LV 07');
    expect(svg).toContain('COMMITS');
    expect(svg).toContain('9d');
    expect(svg).toContain('@octocat');
    expect(svg).not.toContain('<script');
    expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });

  it('is deterministic, so unchanged state never causes a new commit', () => {
    const state = newPet();
    const options = { message: 'hi' };
    expect(renderPetSvg(state, options)).toBe(renderPetSvg(state, options));
  });

  it('escapes untrusted text', () => {
    expect(escapeXml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;');
    const svg = renderPetSvg({ ...newPet(), name: 'A&B' }, { message: '<b>' });
    expect(svg).toContain('A&amp;B');
    expect(svg).toContain('&lt;b&gt;');
  });

  it('renders the evolution strip', () => {
    expect(renderEvolutionStrip()).toContain('GRAND ARCHITECT');
  });

  it('renders pure sprite SVG without dashboard chrome', () => {
    const state = { ...newPet(), name: 'Nova', level: 1 };
    const svg = renderPetSpriteSvg(state);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="160"');
    expect(svg).not.toContain('VITALITY');
    expect(svg).not.toContain('XP');
  });

  it('renders mini companion SVG with level badge', () => {
    const state = { ...newPet(), name: 'Nova', level: 2 };
    const svg = renderPetMiniSvg(state);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('LV 02');
    expect(svg).not.toContain('VITALITY');
  });
});
