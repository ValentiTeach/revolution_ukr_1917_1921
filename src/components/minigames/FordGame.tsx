/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { sound } from '../../game/sound';
import { Depth, generateFord, mulberry32, raiseWater } from '../../game/minigameLogic';
import { PixelEmoji } from '../PixelEmoji';
import { PixelSprite } from '../PixelSprite';
import { DPad, ResultOverlay, StationGameProps, TimeBar, keyToDir, useGameKeys, useTimers } from './shared';

type Theme = 'sea' | 'ice';

const TEXT: Record<
  Theme,
  { probe: string; d: [string, string, string]; cold: string; far: string; near: string; won: string; lost: string; rise: string; guide: string }
> = {
  sea: {
    probe: 'Промацати жердиною',
    d: ['Мілко', 'По пояс', 'Глибоко!'],
    cold: 'Холод',
    far: '🏰 Литовський півострів',
    near: '🌾 Чонгарський берег',
    won: 'Ви на кримському березі!',
    lost: 'Вода повернулася… довелося відступити.',
    rise: '🌬️ Вітер змінюється! Вода прибуває — «по пояс» стає «глибоко».',
    guide: 'Порада провідника',
  },
  ice: {
    probe: 'Простукати багнетом',
    d: ['Товстий лід', 'Тонкий лід', 'Ополонка!'],
    cold: 'Тріщини',
    far: '🌲 Той берег',
    near: '🏕️ Табір',
    won: 'Колона на тому березі!',
    lost: 'Лід не витримав… колона повертається.',
    rise: '☀️ Відлига! Тонкий лід ламається — тепер там вода.',
    guide: 'Порада старого рибалки',
  },
};

const MAX_COLD = 4;

/**
 * «Брід»: промацуй дно (чи лід) і переходи на той берег.
 * Невідома клітинка — спершу промацай. Мілко/товстий лід — безпечно.
 * По пояс/тонкий лід — можна, але холодно (тріщить). Глибоко — не можна.
 * Через певний час вода прибуває, і небезпечних клітинок стає більше.
 */
export const FordGame: React.FC<StationGameProps & { theme?: Theme; cols?: number; rows?: number }> = ({
  theme = 'sea',
  cols = 7,
  rows = 7,
  onFinish,
}) => {
  const t = TEXT[theme];
  const seconds = 50 + rows * 4;
  const init = useMemo(() => generateFord(cols, rows, mulberry32(Math.floor(Math.random() * 1e9))), [cols, rows]);
  const [grid, setGrid] = useState<Depth[][]>(init.grid);
  const [pos, setPos] = useState<[number, number]>([init.startCol, rows - 1]);
  const [known, setKnown] = useState<Set<string>>(() => new Set([`${init.startCol},${rows - 1}`]));
  const [cold, setCold] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [risen, setRisen] = useState(false);
  const [guideUsed, setGuideUsed] = useState(false);
  const [poke, setPoke] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('Натисни на сусідню клітинку або стрілку: спершу промацаєш, потім ступиш.');
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const later = useTimers();

  // Час до зміни вітру
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, +(s - 0.25).toFixed(2))), 250);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    if (result || timeLeft > 0) return;
    if (!risen) {
      setRisen(true);
      setGrid((g) => raiseWater(g));
      setTimeLeft(20);
      setMsg(t.rise);
      sound.playAlarm();
      return;
    }
    setResult('lost');
    sound.playSplash();
    later(() => onFinish(false), 1600);
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (dx: number, dy: number) => {
    if (result) return;
    const [x, y] = pos;
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= cols || ny >= rows) return;
    if (ny < 0) {
      // Вихід на той берег з верхнього ряду
      setResult('won');
      sound.playFanfare();
      later(() => onFinish(true), 1400);
      return;
    }
    const k = `${nx},${ny}`;
    if (!known.has(k)) {
      const d = grid[ny][nx];
      setPoke(k);
      later(() => setPoke(null), 260);
      sound.playProbe(d);
      setKnown((s) => new Set(s).add(k));
      setTimeLeft((s) => Math.max(0, s - 1));
      setMsg(`${t.probe}: ${t.d[d]}`);
      return;
    }
    const d = grid[ny][nx];
    if (d === 2) {
      sound.playWrong();
      setMsg(`Туди не можна — ${t.d[2].toLowerCase()}`);
      return;
    }
    setPos([nx, ny]);
    if (d === 1) {
      theme === 'ice' ? sound.playCrack() : sound.playSplash();
      const c = cold + 1;
      setCold(c);
      setMsg(theme === 'ice' ? 'Лід тріщить під ногами!' : 'Брр! Вода по пояс, крижана!');
      if (c >= MAX_COLD) {
        setResult('lost');
        later(() => onFinish(false), 1600);
      }
    } else {
      sound.playBlip(420);
      setMsg(ny === 0 ? 'Берег уже поруч! Ще крок угору.' : 'Твердо під ногами.');
    }
  };

  const useGuide = () => {
    if (guideUsed || result) return;
    setGuideUsed(true);
    sound.playCoo();
    // Провідник показує мілину в трьох рядах попереду
    const [, y] = pos;
    const next = new Set(known);
    for (let ry = y - 1; ry >= Math.max(0, y - 3); ry--) {
      for (let rx = 0; rx < cols; rx++) if (grid[ry][rx] === 0) next.add(`${rx},${ry}`);
    }
    setKnown(next);
    setMsg('🧓 «Ось тут дно тверде, синку. Іди за мною».');
  };

  useGameKeys((e) => {
    const d = keyToDir(e);
    if (d) {
      e.preventDefault();
      act(d[0], d[1]);
    }
  });

  const tileStyle = (d: Depth, isKnown: boolean): React.CSSProperties => {
    if (!isKnown) {
      return theme === 'ice'
        ? { background: 'repeating-linear-gradient(45deg,#cbd5e1 0 4px,#94a3b8 4px 8px)' }
        : { background: 'repeating-linear-gradient(0deg,#0b1d3a 0 3px,#10294f 3px 6px)' };
    }
    if (theme === 'ice') {
      return [
        { background: '#f1f5f9', boxShadow: 'inset 3px 3px 0 #ffffff, inset -3px -3px 0 #cbd5e1' },
        { background: 'linear-gradient(135deg,#bae6fd 0 45%,#7dd3fc 45% 50%,#bae6fd 50%)', boxShadow: 'inset -3px -3px 0 #38bdf8' },
        { background: '#0c4a6e', boxShadow: 'inset 3px 3px 0 #082f49' },
      ][d];
    }
    return [
      { background: '#a3a37a', boxShadow: 'inset 3px 3px 0 #d6d3a1, inset -3px -3px 0 #78714a' },
      { background: '#2b6aa3', boxShadow: 'inset 3px 3px 0 #4f8fc9, inset -3px -3px 0 #1d4b7a' },
      { background: '#08152b', boxShadow: 'inset 3px 3px 0 #020617' },
    ][d];
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <TimeBar left={timeLeft} total={risen ? 20 : seconds} label={risen ? 'Вода прибуває!' : theme === 'ice' ? 'До відлиги' : 'До зміни вітру'} />
        <div className="flex items-center gap-1 text-xs text-stone-300" aria-label={`${t.cold}: ${cold} з ${MAX_COLD}`}>
          {t.cold}:
          {Array.from({ length: MAX_COLD }).map((_, i) => (
            <span key={i} className={i < cold ? '' : 'opacity-25'}>
              <PixelEmoji emoji={theme === 'ice' ? '💢' : '🥶'} size={18} res={12} />
            </span>
          ))}
        </div>
      </div>

      <div
        className="relative mx-auto w-full max-w-md overflow-hidden border-4 border-stone-950 p-2"
        style={{ background: theme === 'ice' ? 'linear-gradient(#1e293b,#334155)' : 'linear-gradient(#020617,#0b1d3a)' }}
      >
        {theme === 'sea' && <div className="pointer-events-none absolute right-4 top-1 h-6 w-6 bg-amber-100 shadow-[0_0_0_3px_#fef3c7,0_0_0_6px_rgba(253,230,138,0.35)]" aria-hidden />}
        <div className="mb-1 text-center text-xs font-bold text-amber-200">{t.far}</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {grid.map((row, y) =>
            row.map((d, x) => {
              const k = `${x},${y}`;
              const isKnown = known.has(k);
              const here = pos[0] === x && pos[1] === y;
              const adjacent = Math.abs(pos[0] - x) + Math.abs(pos[1] - y) === 1;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => adjacent && act(x - pos[0], y - pos[1])}
                  disabled={!!result}
                  aria-label={here ? 'Ти тут' : isKnown ? t.d[d] : 'Невідомо'}
                  className={`relative aspect-square border-2 ${adjacent && !result ? 'border-amber-300/80 cursor-pointer' : 'border-stone-950'} ${
                    poke === k ? 'animate-shake' : ''
                  }`}
                  style={tileStyle(d, isKnown)}
                >
                  {here ? (
                    <PixelSprite id="jura" size={30} className="px-bob" />
                  ) : isKnown ? (
                    <span className="font-pixel text-[8px] text-white/80 [text-shadow:1px_1px_0_#000]">{['', '~', '≋'][d]}</span>
                  ) : adjacent && !result ? (
                    <span className="text-xs text-amber-200/80">?</span>
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
        <div className="mt-1 text-center text-xs font-bold text-stone-300">{t.near}</div>
        <ResultOverlay result={result} won={t.won} lost={cold >= MAX_COLD ? (theme === 'ice' ? 'Лід проломився!' : 'Задубів від холоду…') : t.lost} />
      </div>

      <p className="min-h-[2.5rem] border-l-4 border-amber-600 bg-stone-900 px-3 py-2 text-sm text-stone-200">{msg}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DPad onMove={act} disabled={!!result} />
        <div className="flex-1 space-y-2 text-xs text-stone-400">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((d) => (
              <span key={d} className="flex items-center gap-1">
                <span className="inline-block h-4 w-4 border border-stone-950" style={tileStyle(d as Depth, true)} /> {t.d[d]}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={useGuide}
            disabled={guideUsed || !!result}
            className="pixel-btn border-2 border-sky-500 bg-sky-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            🧓 {t.guide} {guideUsed ? '(вже)' : '×1'}
          </button>
        </div>
      </div>
    </div>
  );
};
