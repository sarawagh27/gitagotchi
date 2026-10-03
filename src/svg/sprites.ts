import type { Mood, StageId } from '../pet/mechanics.js';

export const GRID = 16;

export interface Pixel {
  x: number;
  y: number;
  color: string;
}

type Palette = Record<string, string>;

interface Layer {
  x: number;
  y: number;
  rows: string[];
  palette: Palette;
}

interface FaceAnchor {
  eyeY: number;
  leftX: number;
  rightX: number;
  mouthX: number;
  mouthY: number;
}

interface StageSpec {
  body: { w: number; h: number };
  palette: Palette;
  /** Layers drawn relative to the body's top-left corner. */
  accessories(bx: number, by: number, w: number): Layer[];
  face?: FaceAnchor;
  glasses?: boolean;
  fangs?: boolean;
}

const INK = '#0b0f1a';
const OUTLINE = '#151b2e';
const FACE: Palette = { X: INK, W: '#ffffff', R: '#ff8fab' };

const EYES: Record<Mood, string[]> = {
  happy: ['WX', 'XX'],
  content: ['WX', 'XX'],
  hungry: ['WX', 'XX'],
  sleepy: ['..', 'XX'],
  sad: ['XX', 'XW'],
  weak: ['X.', '.X'],
};

/** Eyes behind glasses: a single pupil inside each lens. */
const PUPILS: Record<Mood, string[]> = {
  happy: ['..', '.X'],
  content: ['..', '.X'],
  hungry: ['..', '.X'],
  sleepy: ['..', 'XX'],
  sad: ['..', 'X.'],
  weak: ['X.', '.X'],
};

const MOUTHS: Record<Mood, string[]> = {
  happy: ['X..X', '.XX.'],
  content: ['.XX.'],
  hungry: ['.XX.', '.XX.'],
  sleepy: ['..X.'],
  sad: ['.XX.', 'X..X'],
  weak: ['XXXX'],
};

/** A rounded pixel blob with a light top-left and a shaded bottom-right. */
function blob(w: number, h: number, radius = 4): string[] {
  const inset = (y: number): number => {
    const d = Math.min(y, h - 1 - y);
    if (d >= radius) return 0;
    return Math.round(radius - Math.sqrt(radius * radius - (radius - d - 0.5) ** 2));
  };
  const inMask = (x: number, y: number) =>
    y >= 0 && y < h && x >= inset(y) && x <= w - 1 - inset(y);

  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      if (!inMask(x, y)) row += '.';
      else if (!inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1)) {
        row += 'O';
      } else if ((x - inset(y) <= 2 && y <= h * 0.5) || (y === 1 && x - inset(y) <= w * 0.4)) {
        row += 'L';
      } else if ((w - 1 - inset(y) - x <= 2 && y >= h * 0.5) || y >= h - 3) {
        row += 'S';
      } else row += 'B';
    }
    rows.push(row);
  }
  const foot = w >= 12 ? 3 : 2;
  const feet = Array<string>(w).fill('.');
  for (let i = 0; i < foot; i++) {
    feet[2 + i] = 'O';
    feet[w - 2 - foot + i] = 'O';
  }
  rows.push(feet.join(''));
  return rows;
}

function egg(w: number, h: number): string[] {
  const inMask = (x: number, y: number) => {
    const nx = (x + 0.5 - w / 2) / (w / 2);
    const ny = (y + 0.5 - h / 2) / (h / 2);
    return (nx / (1 + 0.18 * ny)) ** 2 + ny ** 2 <= 1;
  };
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      if (!inMask(x, y)) row += '.';
      else if (!inMask(x - 1, y) || !inMask(x + 1, y) || !inMask(x, y - 1) || !inMask(x, y + 1)) {
        row += 'O';
      } else if ((x * 7 + y * 13) % 17 === 0) row += 'G';
      else if (x <= 3 && y <= h * 0.55) row += 'L';
      else if (x >= w - 4 || y >= h - 3) row += 'S';
      else row += 'B';
    }
    rows.push(row);
  }
  return rows;
}

const SPECS: Record<StageId, StageSpec> = {
  egg: {
    body: { w: 10, h: 12 },
    palette: { O: OUTLINE, B: '#f6efe0', L: '#fffaf0', S: '#d8ccb2', G: '#3fb950' },
    accessories: () => [],
  },
  sprout: {
    body: { w: 10, h: 8 },
    palette: { O: OUTLINE, B: '#5eead4', L: '#a7f3e6', S: '#2dbfa9', G: '#86efac' },
    accessories: (bx, by) => [
      {
        x: bx + 2,
        y: by - 3,
        rows: ['GG.GG', '.GGG.', '..O..'],
        palette: { O: OUTLINE, G: '#86efac' },
      },
    ],
    face: { eyeY: 2, leftX: 2, rightX: 6, mouthX: 3, mouthY: 4 },
  },
  builder: {
    body: { w: 12, h: 10 },
    palette: { O: OUTLINE, B: '#f59e0b', L: '#fde68a', S: '#b45309', G: '#fbbf24' },
    accessories: (bx, by) => [
      {
        x: bx + 1,
        y: by - 2,
        rows: ['.YYYYYYYY.', 'YYYYYYYYYY'],
        palette: { Y: '#fbbf24' },
      },
    ],
    face: { eyeY: 3, leftX: 3, rightX: 7, mouthX: 4, mouthY: 6 },
    glasses: true,
  },
  architect: {
    body: { w: 14, h: 11 },
    palette: { O: OUTLINE, B: '#f59e0b', L: '#fef08a', S: '#b45309', G: '#60a5fa' },
    accessories: (bx, by, w): Layer[] => [
      {
        x: bx + 2,
        y: by - 4,
        rows: ['C...CC...C', '.C..CC..C.', '..CCCCCC..'],
        palette: { C: '#60a5fa' },
      },
      { x: 0, y: by + 2, rows: ['.C.', 'CCC', '.C.'], palette: { C: '#93c5fd' } },
      { x: bx + w - 2, y: by + 2, rows: ['.C.', 'CCC', '.C.'], palette: { C: '#93c5fd' } },
    ],
    face: { eyeY: 3, leftX: 4, rightX: 8, mouthX: 5, mouthY: 6 },
    glasses: true,
  },
  shipwright: {
    body: { w: 12, h: 10 },
    palette: { O: OUTLINE, B: '#38bdf8', L: '#bae6fd', S: '#0284c7', G: '#0369a1' },
    accessories: (bx, by): Layer[] => [
      {
        x: bx + 2,
        y: by - 3,
        rows: ['..WWWW..', '.WWWWWW.', 'WWWWWWWW'],
        palette: { W: '#ffffff' },
      },
      { x: bx + 4, y: by - 1, rows: ['BBBB'], palette: { B: '#0369a1' } },
    ],
    face: { eyeY: 3, leftX: 3, rightX: 7, mouthX: 4, mouthY: 6 },
  },
  admiral: {
    body: { w: 14, h: 11 },
    palette: { O: OUTLINE, B: '#0284c7', L: '#7dd3fc', S: '#0369a1', G: '#facc15' },
    accessories: (bx, by, w): Layer[] => [
      {
        x: bx + 3,
        y: by - 4,
        rows: ['..GG..', '.GGGG.', 'GGGGGG', 'GGGGGG'],
        palette: { G: '#facc15' },
      },
      { x: 0, y: by + 1, rows: ['YY', 'YY'], palette: { Y: '#facc15' } },
      { x: bx + w - 2, y: by + 1, rows: ['YY', 'YY'], palette: { Y: '#facc15' } },
    ],
    face: { eyeY: 3, leftX: 4, rightX: 8, mouthX: 5, mouthY: 6 },
  },
  hunter: {
    body: { w: 12, h: 10 },
    palette: { O: OUTLINE, B: '#a855f7', L: '#e9d5ff', S: '#7e22ce', G: '#4ade80' },
    accessories: (bx, by): Layer[] => [
      {
        x: bx + 2,
        y: by - 3,
        rows: ['P....P', 'PP..PP', '.PPPP.'],
        palette: { P: '#6b21a8' },
      },
    ],
    face: { eyeY: 3, leftX: 3, rightX: 7, mouthX: 4, mouthY: 6 },
    fangs: true,
  },
  voidwalker: {
    body: { w: 14, h: 11 },
    palette: { O: OUTLINE, B: '#6366f1', L: '#c7d2fe', S: '#4338ca', G: '#c084fc' },
    accessories: (bx, by, w): Layer[] => [
      {
        x: bx + 3,
        y: by - 3,
        rows: ['N....N', 'NN..NN', '.NNNN.'],
        palette: { N: '#c084fc' },
      },
      {
        x: 0,
        y: by + 1,
        rows: ['V', 'V', 'V'],
        palette: { V: '#818cf8' },
      },
      {
        x: bx + w - 1,
        y: by + 1,
        rows: ['V', 'V', 'V'],
        palette: { V: '#818cf8' },
      },
    ],
    face: { eyeY: 3, leftX: 4, rightX: 8, mouthX: 5, mouthY: 6 },
    fangs: true,
  },
};

function paint(grid: Map<string, string>, layer: Layer): void {
  layer.rows.forEach((row, dy) => {
    [...row].forEach((ch, dx) => {
      const color = layer.palette[ch];
      if (color) grid.set(`${layer.x + dx},${layer.y + dy}`, color);
    });
  });
}

/** Pixels (on a 16x16 grid) for a stage and mood. */
export function buildSprite(stage: StageId, mood: Mood): Pixel[] {
  const spec = SPECS[stage];
  const { w, h } = spec.body;
  const bx = Math.floor((GRID - w) / 2);
  const isEgg = stage === 'egg';
  const by = isEgg ? GRID - h : GRID - 1 - h;
  const grid = new Map<string, string>();

  paint(grid, { x: bx, y: by, rows: isEgg ? egg(w, h) : blob(w, h), palette: spec.palette });
  for (const layer of spec.accessories(bx, by, w)) paint(grid, layer);

  const f = spec.face;
  if (f) {
    const at = (dx: number, dy: number) => ({ x: bx + dx, y: by + dy });
    if (spec.glasses) {
      for (const lx of [f.leftX, f.rightX]) {
        const ring = ['FFFF', 'F..F', 'F..F', 'FFFF'];
        paint(grid, {
          ...at(lx - 1, f.eyeY - 1),
          rows: ring,
          palette: { F: '#fbbf24' },
        });
        paint(grid, { ...at(lx, f.eyeY), rows: ['LL', 'LL'], palette: { L: '#e0f2fe' } });
      }
    }
    for (const ex of [f.leftX, f.rightX]) {
      const rows = spec.glasses ? PUPILS[mood] : EYES[mood];
      paint(grid, { ...at(ex, f.eyeY), rows, palette: FACE });
    }
    paint(grid, { ...at(f.mouthX, f.mouthY), rows: MOUTHS[mood], palette: FACE });
    if (mood === 'happy') {
      for (const bxr of [f.leftX - 1, f.rightX + 2]) {
        paint(grid, { ...at(bxr, f.mouthY), rows: ['R'], palette: FACE });
      }
    }
    if (spec.fangs && mood !== 'sleepy') {
      for (const fx of [f.mouthX, f.mouthX + 3]) {
        paint(grid, { ...at(fx, f.mouthY + 2), rows: ['W'], palette: FACE });
      }
    }
  }

  return [...grid].map(([key, color]) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y, color };
  });
}
