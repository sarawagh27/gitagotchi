import { findAchievement } from '../achievements/achievements.js';
import { STAGES, stageForLevel, type StageId } from '../pet/evolution.js';
import { levelProgress } from '../pet/levels.js';
import { moodOf, type Mood } from '../pet/stats.js';
import type { PetState } from '../pet/types.js';
import { buildSprite, type Pixel } from './sprites.js';

export interface RenderOptions {
  /** The pet's one-liner. */
  message: string;
  /** Shown top-right as @owner. */
  owner?: string;
}

const WIDTH = 540;
const HEIGHT = 300;
const FONT =
  "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const ACCENTS: Record<StageId, string> = {
  egg: '#e8dcc0',
  hatchling: '#5eead4',
  developer: '#818cf8',
  code_beast: '#fb7185',
  git_monster: '#a78bfa',
  legend: '#fbbf24',
};

const FLAME = ['..O..', '.OO..', '.OOO.', 'OOYOO', 'OYYYO', '.OYO.'];

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Merge horizontal runs of same-colored pixels into single rects. */
function pixelRects(pixels: Pixel[], size: number): string {
  const rows = new Map<number, Pixel[]>();
  for (const p of pixels) rows.set(p.y, [...(rows.get(p.y) ?? []), p]);
  const rects: string[] = [];
  for (const [y, row] of [...rows].sort((a, b) => a[0] - b[0])) {
    row.sort((a, b) => a.x - b.x);
    let i = 0;
    while (i < row.length) {
      let j = i;
      while (
        j + 1 < row.length &&
        row[j + 1].x === row[j].x + 1 &&
        row[j + 1].color === row[i].color
      )
        j++;
      rects.push(
        `<rect x="${row[i].x * size}" y="${y * size}" width="${(j - i + 1) * size}" height="${size}" fill="${row[i].color}"/>`,
      );
      i = j + 1;
    }
  }
  return rects.join('');
}

function segmentBar(
  x: number,
  y: number,
  ratio: number,
  segments: number,
  segW: number,
  gap: number,
  height: number,
  color: string,
): string {
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * segments);
  let out = '';
  for (let i = 0; i < segments; i++) {
    const fill = i < filled ? color : '#21262d';
    out += `<rect x="${x + i * (segW + gap)}" y="${y}" width="${segW}" height="${height}" rx="1" fill="${fill}"/>`;
  }
  return out;
}

function flameIcon(x: number, y: number, active: boolean): string {
  const colors = active ? { O: '#ff7b1c', Y: '#ffd33d' } : { O: '#484f58', Y: '#6e7681' };
  const pixels: Pixel[] = [];
  FLAME.forEach((row, py) =>
    [...row].forEach((ch, px) => {
      if (ch === 'O' || ch === 'Y') pixels.push({ x: px, y: py, color: colors[ch] });
    }),
  );
  return `<g transform="translate(${x} ${y})">${pixelRects(pixels, 3)}</g>`;
}

function pad(level: number): string {
  return String(level).padStart(2, '0');
}

export function renderPetSvg(state: PetState, options: RenderOptions): string {
  const stage = stageForLevel(state.level);
  const mood = moodOf(state.stats);
  const accent = ACCENTS[stage.id];
  const progress = levelProgress(state.xp);
  const sprite = pixelRects(buildSprite(stage.id, mood), 10);
  const latest = state.achievements.at(-1);
  const latestTitle = latest ? findAchievement(latest.id)?.title : undefined;

  const stats = [
    { label: 'HEALTH', value: state.stats.health, color: '#f85149' },
    { label: 'ENERGY', value: state.stats.energy, color: '#e3b341' },
    { label: 'FOOD', value: 100 - state.stats.hunger, color: '#3fb950' },
    { label: 'JOY', value: state.stats.happiness, color: '#db61a2' },
  ];
  const statRows = stats
    .map((s, i) => {
      const y = 138 + i * 22;
      return (
        `<text x="236" y="${y}" font-size="11" fill="#8b949e">${s.label}</text>` +
        segmentBar(296, y - 9, s.value / 100, 20, 7, 2, 9, s.color) +
        `<text x="516" y="${y}" font-size="11" fill="#c9d1d9" text-anchor="end">${s.value}</text>`
      );
    })
    .join('');

  const pillText = stage.title.toUpperCase();
  const pillW = pillText.length * 7.2 + 24;
  const xpLabel = progress.maxed
    ? 'MAX LEVEL'
    : `${progress.xpIntoLevel} / ${progress.xpForNext} XP  ·  ${Math.floor(progress.ratio * 100)}%`;
  const streakText = state.streak > 0 ? `${state.streak} DAY STREAK` : 'NO STREAK YET';
  const name = escapeXml(state.name.toUpperCase());
  const message = escapeXml(options.message);
  const summary = `${state.name}, level ${state.level} ${stage.title}, ${state.streak} day streak`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escapeXml(summary)}" font-family="${FONT}">
<title>${escapeXml(summary)}</title>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1117"/><stop offset="1" stop-color="#161b22"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${accent}" stop-opacity="0.32"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="#ffffff" opacity="0.05"/></pattern>
</defs>
<style>
.bob{animation:bob 1.1s steps(1) infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@media (prefers-reduced-motion:reduce){.bob{animation:none}}
</style>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="16" fill="url(#bg)" stroke="#30363d"/>
<rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" rx="16" fill="url(#dots)"/>
<text x="24" y="30" font-size="10" letter-spacing="3" fill="#6e7681">GITAGOTCHI</text>
${options.owner ? `<text x="516" y="30" font-size="10" fill="#6e7681" text-anchor="end">@${escapeXml(options.owner)}</text>` : ''}
<circle cx="116" cy="126" r="92" fill="url(#glow)"/>
<ellipse cx="116" cy="210" rx="58" ry="7" fill="#000" opacity="0.4"/>
<g transform="translate(36 46)" shape-rendering="crispEdges"><g class="bob">${sprite}</g></g>
<rect x="${116 - pillW / 2}" y="224" width="${pillW}" height="22" rx="11" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.6"/>
<text x="116" y="239" font-size="11" font-weight="700" letter-spacing="1" fill="${accent}" text-anchor="middle">${escapeXml(pillText)}</text>
<text x="236" y="68" font-size="24" font-weight="700" letter-spacing="2" fill="#e6edf3">${name}</text>
<rect x="446" y="46" width="70" height="26" rx="6" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.6"/>
<text x="481" y="64" font-size="13" font-weight="700" fill="${accent}" text-anchor="middle">LV ${pad(state.level)}</text>
${segmentBar(236, 84, progress.ratio, 28, 8, 2, 10, accent)}
<text x="236" y="110" font-size="10" fill="#8b949e">${escapeXml(xpLabel)}</text>
${statRows}
${flameIcon(236, 226, state.streak > 0)}
<text x="258" y="241" font-size="12" font-weight="700" fill="${state.streak > 0 ? '#ffa657' : '#6e7681'}">${streakText}</text>
${latestTitle ? `<text x="516" y="241" font-size="11" fill="#d2a8ff" text-anchor="end">★ ${escapeXml(latestTitle.toUpperCase())}</text>` : ''}
<rect x="24" y="258" width="492" height="28" rx="8" fill="#161b22" stroke="#30363d"/>
<text x="270" y="276" font-size="12" font-style="italic" fill="#c9d1d9" text-anchor="middle">“${message}”</text>
</svg>
`;
}

/** A row of every evolution stage, for the README. */
export function renderEvolutionStrip(mood: Mood = 'happy'): string {
  const cell = 120;
  const width = cell * STAGES.length;
  const cells = STAGES.map((stage, i) => {
    const accent = ACCENTS[stage.id];
    return (
      `<g transform="translate(${i * cell + 20} 14)" shape-rendering="crispEdges">${pixelRects(buildSprite(stage.id, mood), 5)}</g>` +
      `<text x="${i * cell + cell / 2}" y="112" font-size="10" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(stage.title.toUpperCase())}</text>` +
      `<text x="${i * cell + cell / 2}" y="126" font-size="9" fill="#8b949e" text-anchor="middle">LV ${stage.minLevel}+</text>`
    );
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="140" viewBox="0 0 ${width} 140" role="img" aria-label="Gitagotchi evolution stages" font-family="${FONT}">
<rect x="0.5" y="0.5" width="${width - 1}" height="139" rx="12" fill="#0d1117" stroke="#30363d"/>
${cells}
</svg>
`;
}
