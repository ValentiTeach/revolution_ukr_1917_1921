/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { sound } from '../../game/sound';
import { StealthGuard } from '../../game/types';
import { guardPose, isSpotted, isWall, parseStealth, visionTiles } from '../../game/minigameLogic';
import { PixelEmoji } from '../PixelEmoji';
import { PixelSprite } from '../PixelSprite';
import { SpriteId } from '../../game/sprites';
import { DPad, ResultOverlay, StationGameProps, keyToDir, useGameKeys, useTimers } from './shared';

type Theme = 'forest' | 'station' | 'snow';

const THEMES: Record<Theme, { floor: string; wall: string; wallSprite: SpriteId; bush: string; bg: string }> = {
  forest: {
    floor: 'repeating-linear-gradient(90deg,#1f3b1f 0 5px,#234423 5px 10px)',
    wall: '#0b1a0b',
    wallSprite: 'pine',
    bush: '🌿',
    bg: '#05100a',
  },
  station: {
    floor: 'repeating-linear-gradient(0deg,#3f3f46 0 7px,#52525b 7px 8px)',
    wall: '#27272a',
    wallSprite: 'crate',
    bush: '🛢️',
    bg: '#09090b',
  },
  snow: {
    floor: 'repeating-linear-gradient(90deg,#cbd5e1 0 6px,#e2e8f0 6px 7px)',
    wall: '#1e293b',
    wallSprite: 'pineSnow',
    bush: '🌿',
    bg: '#0f172a',
  },
};

const ARROW = ['▲', '▶', '▼', '◀'];

/**
 * «Прокрадися»: покрокова гра. Ти робиш крок — вартові роблять крок.
 * Ліхтар світить на три клітинки вперед і не проходить крізь стіни.
 * Кущ ховає тебе, якщо вартовий не наступив саме на тебе.
 * Бліді клітинки показують, куди ліхтарі посвітять після твого ходу.
 */
export const StealthGame: React.FC<StationGameProps & { map: string[]; guards: StealthGuard[]; theme?: Theme }> = ({
  map,
  guards,
  theme = 'forest',
  onFinish,
}) => {
  const level = useMemo(() => parseStealth(map), [map]);
  const th = THEMES[theme];
  const [pos, setPos] = useState<[number, number]>(level.start);
  const [turn, setTurn] = useState(0);
  const [items, setItems] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [caughtBy, setCaughtBy] = useState<number | null>(null);
  const [hint, setHint] = useState('Стрілки або WASD — крок, пробіл — зачекати.');
  const later = useTimers();

  const poses = guards.map((g) => guardPose(level, g, turn));
  const nextPoses = guards.map((g) => guardPose(level, g, turn + 1));
  const lit = new Set<string>();
  poses.forEach((p) => visionTiles(level, p).forEach(([x, y]) => lit.add(`${x},${y}`)));
  const litNext = new Set<string>();
  nextPoses.forEach((p) => visionTiles(level, p).forEach(([x, y]) => litNext.add(`${x},${y}`)));
  const needItems = level.items.length;

  const step = (dx: number, dy: number) => {
    if (result) return;
    const nx = pos[0] + dx;
    const ny = pos[1] + dy;
    if (isWall(level, nx, ny)) {
      sound.playBlip(180);
      return;
    }
    const moved = dx !== 0 || dy !== 0;
    moved ? sound.playBlip(theme === 'station' ? 380 : 300) : sound.playBlip(240);
    // Спершу перевіряємо поточні ліхтарі, потім — після кроку вартових
    const caughtNow = isSpotted(level, guards, turn, nx, ny);
    const caughtAfter = !caughtNow && isSpotted(level, guards, turn + 1, nx, ny);
    setPos([nx, ny]);
    const nextItems = new Set(items);
    const tile = level.tiles[ny][nx];
    if (tile === '*' && !items.has(`${nx},${ny}`)) {
      nextItems.add(`${nx},${ny}`);
      setItems(nextItems);
      sound.playStar();
      setHint('📜 Документи в торбі! Тепер — до виходу.');
    }
    if (caughtNow || caughtAfter) {
      if (caughtAfter) setTurn((t) => t + 1);
      const who = guards.findIndex((g) => {
        const p = guardPose(level, g, caughtNow ? turn : turn + 1);
        return (p.x === nx && p.y === ny) || visionTiles(level, p).some(([x, y]) => x === nx && y === ny);
      });
      setCaughtBy(who);
      setResult('lost');
      sound.playAlarm();
      later(() => onFinish(false), 1700);
      return;
    }
    setTurn((t) => t + 1);
    if (nx === level.exit[0] && ny === level.exit[1]) {
      if (nextItems.size < needItems) {
        setHint('Без документів 📜 іти не можна! Повернися по них.');
        sound.playWrong();
        return;
      }
      setResult('won');
      sound.playFanfare();
      later(() => onFinish(true), 1500);
      return;
    }
    if (tile === 'b') setHint('Ти в схованці. Звідси тебе не видно, якщо вартовий не наступить на тебе.');
    else if (tile !== '*') setHint(litNext.size ? 'Тихо… Стеж за блідими плямами — туди світитимуть ліхтарі.' : '');
  };

  useGameKeys((e) => {
    const d = keyToDir(e);
    if (d) {
      e.preventDefault();
      step(d[0], d[1]);
    } else if (e.key === ' ') {
      e.preventDefault();
      step(0, 0);
    }
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-300">
        <span>
          Хід: <strong className="font-pixel text-[16px] text-amber-300">{turn}</strong>
        </span>
        {needItems > 0 && (
          <span>
            Документи: <strong className={items.size >= needItems ? 'text-emerald-300' : 'text-amber-300'}>{items.size}</strong>/{needItems}
          </span>
        )}
        <span className="text-xs text-stone-500">Вартових: {guards.length}</span>
      </div>

      <div className="relative mx-auto w-full overflow-hidden border-4 border-stone-950 p-1" style={{ background: th.bg, maxWidth: level.w * 46 }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${level.w}, minmax(0, 1fr))` }}>
          {level.tiles.map((row, y) =>
            row.split('').map((c, x) => {
              const k = `${x},${y}`;
              const wall = c === '#';
              const guardIdx = poses.findIndex((p) => p.x === x && p.y === y);
              const here = pos[0] === x && pos[1] === y;
              const isLit = lit.has(k) && !wall;
              const willLit = litNext.has(k) && !wall && !isLit;
              const adjacent = Math.abs(pos[0] - x) + Math.abs(pos[1] - y) === 1;
              return (
                <button
                  key={k}
                  type="button"
                  disabled={!!result || wall}
                  onClick={() => (adjacent ? step(x - pos[0], y - pos[1]) : here ? step(0, 0) : undefined)}
                  aria-label={wall ? 'Перешкода' : here ? 'Ти тут' : guardIdx >= 0 ? 'Вартовий' : isLit ? 'Освітлено' : 'Прохід'}
                  className={`relative flex aspect-square items-center justify-center ${adjacent && !result && !wall ? 'outline outline-1 -outline-offset-1 outline-amber-400/60' : ''}`}
                  style={{ background: wall ? th.wall : th.floor }}
                >
                  {wall && <PixelSprite id={th.wallSprite} size={34} />}
                  {!wall && isLit && <span className="absolute inset-0 bg-yellow-300/45 mix-blend-screen" aria-hidden />}
                  {!wall && willLit && <span className="absolute inset-0 bg-yellow-200/15" aria-hidden />}
                  {c === 'b' && !here && (theme === 'station' ? <PixelEmoji emoji="🛢️" size={24} res={14} /> : <PixelSprite id="bush" size={32} />)}
                  {c === '*' && !items.has(k) && !here && <PixelSprite id="scroll" size={28} className="animate-sparkle" />}
                  {c === 'E' && !here && <PixelSprite id="door" size={32} />}
                  {guardIdx >= 0 && (
                    <span className={`relative z-10 ${caughtBy === guardIdx ? 'animate-shake' : ''}`}>
                      <PixelSprite id="guard" size={32} flip={poses[guardIdx].dir === 3} />
                      <span className="absolute -right-1 -top-1 font-pixel text-[8px] text-yellow-300 [text-shadow:1px_1px_0_#000]">{ARROW[poses[guardIdx].dir]}</span>
                    </span>
                  )}
                  {here && (
                    <span className={`relative z-10 ${c === 'b' ? 'opacity-60' : ''}`}>
                      <PixelSprite id="jura" size={32} className="px-bob" />
                    </span>
                  )}
                </button>
              );
            }),
          )}
        </div>
        <ResultOverlay result={result} won="Непомітно вислизнув(-ла)!" lost="Тебе помітили! Ліхтар ударив в очі…" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <DPad onMove={step} onWait={() => step(0, 0)} disabled={!!result} />
        <div className="flex-1 space-y-1 text-xs text-stone-400">
          <p className="min-h-[2rem] border-l-4 border-amber-600 bg-stone-900 px-2 py-1 text-sm text-stone-200">{hint}</p>
          <p>
            <span className="inline-block h-3 w-3 bg-yellow-300/70 align-middle" /> світить зараз ·{' '}
            <span className="inline-block h-3 w-3 bg-yellow-200/30 align-middle" /> світитиме після твого ходу · {theme === 'station' ? '🛢️' : '🌿'} схованка · ▲▶▼◀ — куди дивиться вартовий
          </p>
        </div>
      </div>
    </div>
  );
};
