import { addDays } from '../dates.js';
import { findAchievement } from '../achievements.js';
import {
  isActiveDay,
  levelProgress,
  moodOf,
  STAGES,
  stageForLevel,
  type Mood,
  type StageId,
} from '../pet/mechanics.js';
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
  sprout: '#5eead4',
  builder: '#fbbf24',
  architect: '#60a5fa',
  shipwright: '#38bdf8',
  admiral: '#facc15',
  hunter: '#c084fc',
  voidwalker: '#818cf8',
};

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

function pad(level: number): string {
  return String(level).padStart(2, '0');
}

function renderCommitTrack(state: PetState, accent: string): string {
  const startX = 52;
  const gap = 21;
  const y = 196;
  const endX = startX + 6 * gap;
  const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let out = `<line x1="${startX}" y1="${y}" x2="${endX}" y2="${y}" stroke="#30363d" stroke-width="2" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const day = addDays(state.lastTickDay, i - 6);
    const active = isActiveDay(state.dailyLog[day]);
    const cx = startX + i * gap;
    const weekday = DAYS_OF_WEEK[new Date(day + 'T12:00:00Z').getUTCDay()];
    if (active) {
      out += `<circle cx="${cx}" cy="${y}" r="4" fill="${accent}" stroke="#0d1117" stroke-width="1.5"/>`;
    } else {
      out += `<circle cx="${cx}" cy="${y}" r="2.8" fill="#161b22" stroke="#484f58" stroke-width="1.2"/>`;
    }
    if (i === 6) {
      out += `<circle cx="${cx}" cy="${y}" r="6.5" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="2 1.5"/>`;
    }
    out += `<text x="${cx}" y="${y + 13}" font-size="7.5" font-family="${FONT}" fill="${active ? accent : '#6e7681'}" text-anchor="middle">${weekday}</text>`;
  }
  return `<g class="commit-track">${out}</g>`;
}

function renderTelemetryCards(state: PetState): string {
  let weekCommits = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(state.lastTickDay, -i);
    weekCommits += state.dailyLog[d]?.commits ?? 0;
  }
  const totalPRs = state.totals.prsMerged + state.totals.prsOpened;
  const totalIssues = state.totals.issuesClosed + state.totals.issuesOpened;

  const cards = [
    {
      label: 'COMMITS',
      val: `${state.totals.commits}`,
      sub: `${weekCommits} this wk`,
      subColor: '#58a6ff',
      x: 236,
      y: 120,
    },
    {
      label: 'PULL REQS',
      val: `${totalPRs}`,
      sub: `${state.totals.prsMerged} merged`,
      subColor: '#38bdf8',
      x: 382,
      y: 120,
    },
    {
      label: 'ISSUES',
      val: `${totalIssues}`,
      sub: `${state.totals.issuesClosed} closed`,
      subColor: '#a371f7',
      x: 236,
      y: 182,
    },
    {
      label: 'STREAK',
      val: `${state.streak}d`,
      sub: `best: ${state.longestStreak}d`,
      subColor: '#ffa657',
      x: 382,
      y: 182,
    },
  ];

  return cards
    .map(
      (c) =>
        `<g transform="translate(${c.x} ${c.y})">` +
        `<rect width="134" height="54" rx="8" fill="#161b22" stroke="#30363d"/>` +
        `<text x="12" y="17" font-size="9" font-weight="700" letter-spacing="1" fill="#8b949e">${c.label}</text>` +
        `<text x="12" y="42" font-size="20" font-weight="700" fill="#e6edf3">${c.val}</text>` +
        `<text x="122" y="42" font-size="9" fill="${c.subColor}" text-anchor="end">${c.sub}</text>` +
        `</g>`,
    )
    .join('');
}

export function renderPetSvg(state: PetState, options: RenderOptions): string {
  const stage = stageForLevel(state.level, state.branch);
  const mood = moodOf(state.stats);
  const accent = ACCENTS[stage.id];
  const progress = levelProgress(state.xp);
  const sprite = pixelRects(buildSprite(stage.id, mood), 10);
  const latest = state.achievements.at(-1);
  const latestTitle = latest ? findAchievement(latest.id)?.title : undefined;

  const pillText = stage.title.toUpperCase();
  const pillW = pillText.length * 6.8 + 22;
  const xpLabel = progress.maxed
    ? 'MAX LEVEL'
    : `${progress.xpIntoLevel} / ${progress.xpForNext} XP  ·  ${Math.floor(progress.ratio * 100)}%`;
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
<text x="122" y="30" font-size="10" letter-spacing="1" fill="${accent}">feature/${escapeXml(state.branch)}</text>
${options.owner ? `<text x="516" y="30" font-size="10" fill="#6e7681" text-anchor="end">@${escapeXml(options.owner)}</text>` : ''}
<circle cx="116" cy="114" r="86" fill="url(#glow)"/>
<g transform="translate(36 30)" shape-rendering="crispEdges"><g class="bob">${sprite}</g></g>
${renderCommitTrack(state, accent)}
<rect x="${116 - pillW / 2}" y="222" width="${pillW}" height="20" rx="10" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.5"/>
<text x="116" y="236" font-size="10" font-weight="700" letter-spacing="1" fill="${accent}" text-anchor="middle">${escapeXml(pillText)}</text>
<text x="236" y="66" font-size="22" font-weight="700" letter-spacing="1" fill="#e6edf3">${name}</text>
<rect x="446" y="46" width="70" height="26" rx="6" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-opacity="0.6"/>
<text x="481" y="64" font-size="13" font-weight="700" fill="${accent}" text-anchor="middle">LV ${pad(state.level)}</text>
${segmentBar(236, 82, progress.ratio, 28, 8, 2, 8, accent)}
<text x="236" y="104" font-size="10" fill="#8b949e">${escapeXml(xpLabel)}</text>
${latestTitle ? `<text x="516" y="104" font-size="10" fill="#d2a8ff" text-anchor="end">★ ${escapeXml(latestTitle.toUpperCase())}</text>` : ''}
${renderTelemetryCards(state)}
<rect x="24" y="248" width="492" height="34" rx="8" fill="#161b22" stroke="#30363d"/>
<text x="270" y="270" font-size="12" fill="#c9d1d9" text-anchor="middle">“${message}”</text>
</svg>
`;
}

/** A row of every evolution stage, for the README. */
export function renderEvolutionStrip(mood: Mood = 'happy'): string {
  const cell = 110;
  const width = cell * STAGES.length;
  const cells = STAGES.map((stage, i) => {
    const accent = ACCENTS[stage.id];
    return (
      `<g transform="translate(${i * cell + 15} 14)" shape-rendering="crispEdges">${pixelRects(buildSprite(stage.id, mood), 5)}</g>` +
      `<text x="${i * cell + cell / 2}" y="112" font-size="9" font-weight="700" fill="${accent}" text-anchor="middle">${escapeXml(stage.title.toUpperCase())}</text>` +
      `<text x="${i * cell + cell / 2}" y="126" font-size="9" fill="#8b949e" text-anchor="middle">LV ${stage.minLevel}+</text>`
    );
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="140" viewBox="0 0 ${width} 140" role="img" aria-label="Gitagotchi evolution stages" font-family="${FONT}">
<rect x="0.5" y="0.5" width="${width - 1}" height="139" rx="12" fill="#0d1117" stroke="#30363d"/>
${cells}
</svg>
`;
}

/**
 * Renders just the pet sprite as an animated, transparent SVG without any dashboard cards or status bars.
 * Perfect for minimal profile README embeds.
 */
export function renderPetSpriteSvg(state: PetState): string {
  const stage = stageForLevel(state.level, state.branch);
  const mood = moodOf(state.stats);
  const sprite = pixelRects(buildSprite(stage.id, mood), 10);
  const summary = `${state.name}, level ${state.level} ${stage.title}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="175" viewBox="0 0 160 175" role="img" aria-label="${escapeXml(summary)}">
<title>${escapeXml(summary)}</title>
<style>
.bob{animation:bob 1.1s steps(1) infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@media (prefers-reduced-motion:reduce){.bob{animation:none}}
</style>
<ellipse cx="80" cy="162" rx="48" ry="6" fill="#000" opacity="0.35"/>
<g shape-rendering="crispEdges"><g class="bob">${sprite}</g></g>
</svg>
`;
}

/**
 * Renders a compact companion sticker with the animated pet and a minimal level pill below.
 */
export function renderPetMiniSvg(state: PetState): string {
  const stage = stageForLevel(state.level, state.branch);
  const mood = moodOf(state.stats);
  const accent = ACCENTS[stage.id];
  const sprite = pixelRects(buildSprite(stage.id, mood), 10);
  const summary = `${state.name}, level ${state.level} ${stage.title}`;
  const pillText = `LV ${pad(state.level)} · ${stage.title.toUpperCase()}`;
  const pillW = pillText.length * 7.2 + 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="210" viewBox="0 0 180 210" role="img" aria-label="${escapeXml(summary)}" font-family="${FONT}">
<title>${escapeXml(summary)}</title>
<defs>
<radialGradient id="mini-glow"><stop offset="0" stop-color="${accent}" stop-opacity="0.28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
</defs>
<style>
.bob{animation:bob 1.1s steps(1) infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@media (prefers-reduced-motion:reduce){.bob{animation:none}}
</style>
<circle cx="90" cy="85" r="70" fill="url(#mini-glow)"/>
<ellipse cx="90" cy="160" rx="46" ry="6" fill="#000" opacity="0.35"/>
<g transform="translate(10 0)" shape-rendering="crispEdges"><g class="bob">${sprite}</g></g>
<rect x="${90 - pillW / 2}" y="174" width="${pillW}" height="24" rx="12" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.5"/>
<text x="90" y="190" font-size="11" font-weight="700" letter-spacing="1" fill="${accent}" text-anchor="middle">${escapeXml(pillText)}</text>
</svg>
`;
}
