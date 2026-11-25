/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Чиста логіка нових міні-ігор (без React), щоб її можна було перевірити тестами:
 * шифрувальне коло, брід через Сиваш, покрокове прокрадання, маршрут походу,
 * розподіл людей по кораблях.
 */

import { StealthGuard } from './types';

// ---------------------------------------------------------------------------
// Випадковість із зерном (щоб рівні можна було перевіряти)
// ---------------------------------------------------------------------------
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Шифрувальне коло (шифр зсуву на українській абетці)
// ---------------------------------------------------------------------------
export const UA_ALPHABET = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

/** Зсуває кожну літеру абетки на shift позицій. Пробіли й розділові знаки не чіпає. */
export function caesar(text: string, shift: number): string {
  const n = UA_ALPHABET.length;
  return text
    .toUpperCase()
    .split('')
    .map((ch) => {
      const i = UA_ALPHABET.indexOf(ch);
      if (i < 0) return ch;
      return UA_ALPHABET[(((i + shift) % n) + n) % n];
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Брід: сітка глибин. 0 — мілко, 1 — по пояс, 2 — глибоко (з головою).
// Рядок 0 — протилежний берег, останній рядок — звідки починаємо.
// ---------------------------------------------------------------------------
export type Depth = 0 | 1 | 2;

export function generateFord(cols: number, rows: number, rng: () => number): { grid: Depth[][]; startCol: number } {
  const grid: Depth[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() < 0.55 ? 2 : 1) as Depth),
  );
  // Гарантований брід: випадкова «змійка» знизу вгору
  let x = Math.floor(rng() * cols);
  const startCol = x;
  for (let y = rows - 1; y >= 0; y--) {
    grid[y][x] = 0;
    // Інколи брід звертає вбік на 1–2 клітинки
    if (y > 0 && rng() < 0.6) {
      const dir = rng() < 0.5 ? -1 : 1;
      const steps = 1 + Math.floor(rng() * 2);
      for (let s = 0; s < steps; s++) {
        const nx = x + dir;
        if (nx < 0 || nx >= cols) break;
        x = nx;
        grid[y][x] = 0;
      }
    }
  }
  // Кілька мілин-обманок, щоб не було «очевидної» стежки
  const decoys = Math.floor((cols * rows) / 8);
  for (let i = 0; i < decoys; i++) {
    const dx = Math.floor(rng() * cols);
    const dy = 1 + Math.floor(rng() * Math.max(1, rows - 2));
    if (grid[dy][dx] === 2) grid[dy][dx] = 1;
  }
  return { grid, startCol };
}

/** Чи можна перейти від нижнього ряду до верхнього тільки мілкими й середніми клітинками. */
export function fordHasPath(grid: Depth[][], startCol: number, maxDepth: Depth = 0): boolean {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Set<string>();
  const q: [number, number][] = [[startCol, rows - 1]];
  while (q.length) {
    const [x, y] = q.shift()!;
    const k = `${x},${y}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (grid[y][x] > maxDepth) continue;
    if (y === 0) return true;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) q.push([nx, ny]);
    }
  }
  return false;
}

/** Вода прибуває: усе, що було «по пояс», стає глибоким. */
export function raiseWater(grid: Depth[][]): Depth[][] {
  return grid.map((row) => row.map((d) => (d === 1 ? 2 : d) as Depth));
}

// ---------------------------------------------------------------------------
// Прокрадання: покрокова гра з вартовими-ліхтарями
// Легенда мапи: # — стіна/дерево, . — прохід, b — кущ (ховає), S — старт,
// E — вихід, * — документ, який треба забрати.
// ---------------------------------------------------------------------------
export const DIRS: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];
const DIR_OF: Record<string, number> = { U: 0, R: 1, D: 2, L: 3 };

export interface StealthLevel {
  w: number;
  h: number;
  tiles: string[];
  start: [number, number];
  exit: [number, number];
  items: [number, number][];
}

export function parseStealth(map: string[]): StealthLevel {
  let start: [number, number] = [1, 1];
  let exit: [number, number] = [1, 1];
  const items: [number, number][] = [];
  map.forEach((row, y) =>
    row.split('').forEach((c, x) => {
      if (c === 'S') start = [x, y];
      if (c === 'E') exit = [x, y];
      if (c === '*') items.push([x, y]);
    }),
  );
  return { w: map[0].length, h: map.length, tiles: map, start, exit, items };
}

export function isWall(level: StealthLevel, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= level.w || y >= level.h) return true;
  return level.tiles[y][x] === '#';
}

export interface GuardPose {
  x: number;
  y: number;
  dir: number; // 0 вгору, 1 праворуч, 2 вниз, 3 ліворуч
}

/** Положення вартового після t кроків його маршруту (маршрут повторюється по колу). */
export function guardPose(level: StealthLevel, g: StealthGuard, t: number): GuardPose {
  const first = g.path.split('').find((c) => DIR_OF[c.toUpperCase()] !== undefined);
  let pose: GuardPose = { x: g.x, y: g.y, dir: first ? DIR_OF[first.toUpperCase()] : 2 };
  const len = g.path.length;
  if (!len) return pose;
  // Маршрут має повертати вартового на старт, тож досить t % len кроків
  const steps = t % len;
  for (let i = 0; i < steps; i++) pose = stepGuard(level, pose, g.path[i]);
  return pose;
}

function stepGuard(level: StealthLevel, p: GuardPose, cmd: string): GuardPose {
  if (cmd === 'W') return p;
  const d = DIR_OF[cmd.toUpperCase()];
  if (d === undefined) return p;
  if (cmd === cmd.toLowerCase()) return { ...p, dir: d };
  const [dx, dy] = DIRS[d];
  const nx = p.x + dx;
  const ny = p.y + dy;
  if (isWall(level, nx, ny)) return { ...p, dir: d };
  return { x: nx, y: ny, dir: d };
}

export const VISION_RANGE = 3;

/** Клітинки, які освітлює ліхтар вартового (разом із його власною). */
export function visionTiles(level: StealthLevel, p: GuardPose, range = VISION_RANGE): [number, number][] {
  const out: [number, number][] = [[p.x, p.y]];
  const [dx, dy] = DIRS[p.dir];
  for (let i = 1; i <= range; i++) {
    const x = p.x + dx * i;
    const y = p.y + dy * i;
    if (isWall(level, x, y)) break;
    out.push([x, y]);
  }
  return out;
}

/** Чи бачить хтось джуру. Кущ ховає, якщо вартовий не стоїть на тій самій клітинці. */
export function isSpotted(level: StealthLevel, guards: StealthGuard[], t: number, px: number, py: number): boolean {
  const inBush = level.tiles[py][px] === 'b';
  return guards.some((g) => {
    const pose = guardPose(level, g, t);
    if (pose.x === px && pose.y === py) return true;
    if (inBush) return false;
    return visionTiles(level, pose).some(([x, y]) => x === px && y === py);
  });
}

/**
 * Пошук розвʼязку (для тестів): чи можна дійти до виходу, зібравши всі документи.
 * Хід: джура рухається або чекає, після цього крокують вартові.
 */
export function solveStealth(map: string[], guards: StealthGuard[], maxTurns = 400): number | null {
  const level = parseStealth(map);
  const cycle = guards.reduce((acc, g) => lcm(acc, Math.max(1, g.path.length)), 1);
  const allItems = (1 << level.items.length) - 1;
  const key = (x: number, y: number, t: number, m: number) => `${x},${y},${t % cycle},${m}`;
  const seen = new Set<string>();
  let frontier: [number, number, number][] = [[level.start[0], level.start[1], 0]];
  for (let t = 0; t < maxTurns && frontier.length; t++) {
    const next: [number, number, number][] = [];
    for (const [x, y, m] of frontier) {
      for (const [dx, dy] of [[0, 0], ...DIRS]) {
        const nx = x + dx;
        const ny = y + dy;
        if (isWall(level, nx, ny)) continue;
        if (isSpotted(level, guards, t, nx, ny)) continue;
        if (isSpotted(level, guards, t + 1, nx, ny)) continue;
        let nm = m;
        level.items.forEach(([ix, iy], i) => {
          if (ix === nx && iy === ny) nm |= 1 << i;
        });
        if (nx === level.exit[0] && ny === level.exit[1] && nm === allItems) return t + 1;
        const k = key(nx, ny, t + 1, nm);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push([nx, ny, nm]);
      }
    }
    frontier = next;
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

// ---------------------------------------------------------------------------
// Маршрут походу. Легенда: . поле, T ліс, V село, R/W ворожий гарнізон,
// ~ річка (не пройти), = брід/міст, S старт, F мета.
// Поле: -1 харчі, -1 тепло. Ліс: -2 харчі (важка дорога), тепло не тратиться.
// Село: +4 харчі, +3 тепло (один раз). Гарнізон: не пройти.
// Відкрита клітинка поруч із гарнізоном: роз’їзд помічає колону, -1 сила духу.
// ---------------------------------------------------------------------------
export interface RouteCost {
  food: number;
  warmth: number;
}

export function routeTileCost(tile: string): RouteCost | null {
  switch (tile) {
    case 'T':
      return { food: -2, warmth: 0 };
    case 'V':
      return { food: 0, warmth: 0 };
    case '~':
    case 'R':
    case 'W':
      return null;
    default:
      return { food: -1, warmth: -1 };
  }
}

export const VILLAGE_FOOD = 4;
export const VILLAGE_WARMTH = 3;
export const ROUTE_MORALE = 2;

/** Відкрита клітинка поруч із гарнізоном: роз’їзд помітить колону (ліс ховає). */
export function isExposed(map: string[], x: number, y: number): boolean {
  if (map[y][x] === 'T') return false;
  return DIRS.some(([dx, dy]) => {
    const t = map[y + dy]?.[x + dx];
    return t === 'R' || t === 'W';
  });
}

export function findInMap(map: string[], ch: string): [number, number] {
  for (let y = 0; y < map.length; y++) {
    const x = map[y].indexOf(ch);
    if (x >= 0) return [x, y];
  }
  return [0, 0];
}

/** Найкоротший шлях до мети з такими запасами або null (для тестів). */
export function solveRoute(map: string[], food: number, warmth: number, morale = ROUTE_MORALE): number | null {
  const [sx, sy] = findInMap(map, 'S');
  const villages: string[] = [];
  map.forEach((row, y) => row.split('').forEach((c, x) => c === 'V' && villages.push(`${x},${y}`)));
  const h = map.length;
  const w = map[0].length;
  type S = { x: number; y: number; f: number; wa: number; m: number; v: number; d: number };
  const q: S[] = [{ x: sx, y: sy, f: food, wa: warmth, m: morale, v: 0, d: 0 }];
  const seen = new Set<string>();
  while (q.length) {
    const s = q.shift()!;
    for (const [dx, dy] of DIRS) {
      const nx = s.x + dx;
      const ny = s.y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const tile = map[ny][nx];
      const cost = routeTileCost(tile);
      if (!cost) continue;
      let f = s.f + cost.food;
      let wa = s.wa + cost.warmth;
      const m = s.m - (isExposed(map, nx, ny) ? 1 : 0);
      let v = s.v;
      const vi = villages.indexOf(`${nx},${ny}`);
      if (vi >= 0 && !(v & (1 << vi))) {
        v |= 1 << vi;
        f += VILLAGE_FOOD;
        wa += VILLAGE_WARMTH;
      }
      if (m <= 0) continue;
      if (tile === 'F' && f >= 0 && wa >= 0) return s.d + 1;
      if (f <= 0 || wa <= 0) continue;
      const k = `${nx},${ny},${v},${f},${wa},${m}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny, f, wa, m, v, d: s.d + 1 });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Кораблі: чи можна розсадити всі групи так, щоб кожен корабель був заповнений.
// ---------------------------------------------------------------------------
export function canFillShips(groups: number[], capacities: number[]): boolean {
  const total = groups.reduce((a, b) => a + b, 0);
  if (total !== capacities.reduce((a, b) => a + b, 0)) return false;
  const sorted = [...groups].sort((a, b) => b - a);
  const left = [...capacities];
  const place = (i: number): boolean => {
    if (i === sorted.length) return left.every((c) => c === 0);
    const tried = new Set<number>();
    for (let s = 0; s < left.length; s++) {
      if (left[s] < sorted[i] || tried.has(left[s])) continue;
      tried.add(left[s]);
      left[s] -= sorted[i];
      if (place(i + 1)) return true;
      left[s] += sorted[i];
    }
    return false;
  };
  return place(0);
}
