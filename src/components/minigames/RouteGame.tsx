/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../../game/sound';
import { ROUTE_MORALE, VILLAGE_FOOD, VILLAGE_WARMTH, findInMap, isExposed, routeTileCost } from '../../game/minigameLogic';
import { PixelEmoji } from '../PixelEmoji';
import { DPad, ResultOverlay, StationGameProps, keyToDir, useGameKeys, useTimers } from './shared';

const SCOUTS = 2;

/** Як виглядає кожна клітинка мапи. */
const TILE: Record<string, { emoji?: string; bg: string; name: string }> = {
  '.': { bg: 'repeating-linear-gradient(90deg,#e2e8f0 0 6px,#cbd5e1 6px 7px)', name: 'Поле: −1 🍞, −1 🔥' },
  S: { emoji: '⛺', bg: '#e2e8f0', name: 'Табір' },
  F: { emoji: '🏁', bg: '#fde68a', name: 'Мета' },
  T: { emoji: '🌲', bg: '#d1fae5', name: 'Ліс: −2 🍞, тепло береже' },
  V: { emoji: '🏠', bg: '#fef3c7', name: `Село: +${VILLAGE_FOOD} 🍞, +${VILLAGE_WARMTH} 🔥` },
  R: { emoji: '🚩', bg: '#fecaca', name: 'Червоний гарнізон' },
  W: { emoji: '🏳️', bg: '#e5e7eb', name: 'Білий гарнізон' },
  '~': { bg: 'repeating-linear-gradient(0deg,#7dd3fc 0 3px,#bae6fd 3px 6px)', name: 'Річка' },
  '=': { emoji: '🌉', bg: '#bae6fd', name: 'Брід' },
};

/**
 * «Маршрут походу»: покрокова мапа з туманом війни.
 * Поле холодне й голодне, ліс береже тепло, але дорога в ньому важча,
 * села нагодують і зігріють. Гарнізони ховаються в тумані — висилай розвідку.
 */
export const RouteGame: React.FC<StationGameProps & { map: string[]; food: number; warmth: number }> = ({ map, food: food0, warmth: warmth0, onFinish }) => {
  const h = map.length;
  const w = map[0].length;
  const [pos, setPos] = useState<[number, number]>(() => findInMap(map, 'S'));
  const [food, setFood] = useState(food0);
  const [warmth, setWarmth] = useState(warmth0);
  const [morale, setMorale] = useState(ROUTE_MORALE);
  const [scouts, setScouts] = useState(SCOUTS);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState<Set<string>>(() => reveal(new Set(), findInMap(map, 'S'), 1, w, h));
  const [day, setDay] = useState(1);
  const [log, setLog] = useState<string[]>(['Грудень. Колона вирушає. Куди підемо?']);
  const [bump, setBump] = useState<string | null>(null);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const later = useTimers();

  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 4));

  const finish = (won: boolean, line: string) => {
    say(line);
    setResult(won ? 'won' : 'lost');
    won ? sound.playFanfare() : sound.playWrong();
    later(() => onFinish(won), 1700);
  };

  const move = (dx: number, dy: number) => {
    if (result) return;
    const nx = pos[0] + dx;
    const ny = pos[1] + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const tile = map[ny][nx];
    const k = `${nx},${ny}`;
    const cost = routeTileCost(tile);
    if (!cost) {
      if (tile === '~') {
        sound.playBlip(200);
        say('Річка! Шукай брід 🌉.');
        return;
      }
      // Гарнізон: туди не можна, але й підходити до нього полем небезпечно
      sound.playThud();
      setBump(k);
      later(() => setBump(null), 400);
      setRevealed((r) => new Set(r).add(k));
      say(`Там ${tile === 'R' ? 'червоний' : 'білий'} гарнізон! Обійди його — краще лісом.`);
      return;
    }
    let f = food + cost.food;
    let wa = warmth + cost.warmth;
    const firstVisit = tile === 'V' && !visited.has(k);
    if (firstVisit) {
      f += VILLAGE_FOOD;
      wa += VILLAGE_WARMTH;
      setVisited((v) => new Set(v).add(k));
      sound.playStar();
      say(`Село нагодувало й зігріло: +${VILLAGE_FOOD} 🍞 +${VILLAGE_WARMTH} 🔥. Господарі сховали хворих.`);
    } else if (tile === 'T') {
      sound.playCrack();
      say('Лісом важко, зате вітер не дістає.');
    } else {
      sound.playHoof(day);
      say(tile === '=' ? 'Перейшли по кризі бродом.' : 'Відкрите поле, хуртовина січе обличчя.');
    }
    let m = morale;
    if (isExposed(map, nx, ny)) {
      m -= 1;
      setMorale(m);
      sound.playAlarm();
      setRevealed((r) => reveal(r, [nx, ny], 1, w, h));
      say('Ворожий роз’їзд помітив колону в полі! Довелося відбиватися.');
    }
    setFood(f);
    setWarmth(wa);
    setPos([nx, ny]);
    setDay((d) => d + 1);
    setRevealed((r) => reveal(r, [nx, ny], 1, w, h));
    if (tile === 'F') {
      finish(true, 'Дійшли! Колона зʼєдналася зі своїми.');
      return;
    }
    if (m <= 0) finish(false, 'Колону вистежили й розбили…');
    else if (f <= 0) finish(false, 'Харчі скінчилися — колона не може йти далі.');
    else if (wa <= 0) finish(false, 'Мороз переміг — вояки не можуть іти далі.');
  };

  const scout = () => {
    if (result || scouts <= 0) return;
    sound.playCoo();
    setScouts((s) => s - 1);
    setRevealed((r) => reveal(r, pos, 2, w, h));
    say('Розвідники повернулися й розповіли, що довкола.');
  };

  useGameKeys((e) => {
    const d = keyToDir(e);
    if (d) {
      e.preventDefault();
      move(d[0], d[1]);
    } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
      scout();
    }
  });

  const Stat: React.FC<{ emoji: string; value: number; label: string; low?: number }> = ({ emoji, value, label, low = 2 }) => (
    <span className={`flex items-center gap-1 border-2 px-2 py-1 text-sm font-bold ${value <= low ? 'border-rose-500 text-rose-200 px-blink' : 'border-stone-700 text-stone-100'}`} title={label}>
      <PixelEmoji emoji={emoji} size={20} res={12} /> {value}
    </span>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Stat emoji="🍞" value={food} label="Харчі" />
        <Stat emoji="🔥" value={warmth} label="Тепло" />
        <Stat emoji="❤️" value={morale} label="Сила духу" low={1} />
        <span className="ml-auto font-pixel text-[8px] text-stone-400">ДЕНЬ {day}</span>
      </div>

      <div className="relative overflow-hidden border-4 border-stone-950 bg-stone-800 p-1">
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${w}, minmax(0, 1fr))` }}>
          {map.map((row, y) =>
            row.split('').map((tile, x) => {
              const k = `${x},${y}`;
              const always = tile === '~' || tile === 'F' || tile === '=';
              const seen = revealed.has(k) || always;
              const here = pos[0] === x && pos[1] === y;
              const adjacent = Math.abs(pos[0] - x) + Math.abs(pos[1] - y) === 1;
              const info = TILE[tile] ?? TILE['.'];
              const villageDone = tile === 'V' && visited.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => adjacent && move(x - pos[0], y - pos[1])}
                  disabled={!!result}
                  title={seen ? info.name : 'Туман'}
                  aria-label={here ? 'Колона тут' : seen ? info.name : 'Туман'}
                  className={`relative flex aspect-square items-center justify-center border ${
                    adjacent && !result ? 'border-amber-400' : 'border-stone-900'
                  } ${bump === k ? 'animate-shake' : ''}`}
                  style={{ background: seen ? info.bg : 'repeating-linear-gradient(45deg,#475569 0 4px,#3f4c5f 4px 8px)' }}
                >
                  {seen && info.emoji && !here && (
                    <span className={villageDone ? 'opacity-40' : ''}>
                      <PixelEmoji emoji={info.emoji} size={22} res={14} />
                    </span>
                  )}
                  {here && <PixelEmoji emoji="🐎" size={26} className="px-bob" />}
                </button>
              );
            }),
          )}
        </div>
        <ResultOverlay result={result} won="Колона дійшла! «Залізний хрест» заслужено." lost="Колона зупинилася…" />
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-3">
          <DPad onMove={move} disabled={!!result} />
          <button
            type="button"
            onClick={scout}
            disabled={scouts <= 0 || !!result}
            className="pixel-btn flex flex-col items-center border-2 border-sky-500 bg-sky-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            title="Розвідка (клавіша R)"
          >
            <PixelEmoji emoji="🔭" size={28} />
            Розвідка ×{scouts}
          </button>
        </div>
        <ul className="space-y-1 text-sm">
          {log.map((l, i) => (
            <li key={`${day}-${i}`} className={i === 0 ? 'border-l-4 border-amber-500 bg-stone-900 px-2 py-1 text-stone-100' : 'px-2 text-xs text-stone-500'}>
              {l}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-stone-500">
        Поле: −1 🍞 −1 🔥 · Ліс: −2 🍞, тепло береже й ховає · Село: +{VILLAGE_FOOD} 🍞 +{VILLAGE_WARMTH} 🔥 (один раз) · 🚩🏳️ — гарнізони: у полі поруч із ними
        тебе помітять (−1 ❤️).
      </p>
    </div>
  );
};

function reveal(prev: Set<string>, [cx, cy]: [number, number], r: number, w: number, h: number): Set<string> {
  const next = new Set(prev);
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++) if (x >= 0 && y >= 0 && x < w && y < h) next.add(`${x},${y}`);
  return next;
}
