/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw } from '../icons';
import { sound } from '../../game/sound';
import { MistakeMeter, shuffle, useTimers } from './shared';

interface TelegramPuzzleProps {
  sentence: string;
  /** Зайві слова-пастки від цензора. */
  decoys?: string[];
  onFinish: (won: boolean) => void;
}

const MAX_MISTAKES = 4;

/**
 * «Телеграма»: набирай слова у правильному порядку — телеграфний апарат
 * друкує їх на стрічці літера за літерою. Серед набірних брусків є зайві
 * слова-пастки. Після двох помилок підсвічується наступне слово.
 */
export const TelegramPuzzle: React.FC<TelegramPuzzleProps> = ({ sentence, decoys = [], onFinish }) => {
  const words = useMemo(() => sentence.split(' '), [sentence]);
  const [pool, setPool] = useState(() => {
    const all = [...words.map((w, i) => ({ w, i })), ...decoys.map((w, k) => ({ w, i: -1 - k }))];
    let s = shuffle(all);
    if (s.every((x, idx) => x.i === idx) && all.length > 1) s = [...s.slice(1), s[0]];
    return s;
  });
  const [placed, setPlaced] = useState<{ w: string; i: number }[]>([]);
  const [typed, setTyped] = useState('');
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [lost, setLost] = useState(false);
  const later = useTimers();
  const done = placed.length === words.length;
  const target = placed.map((p) => p.w.toUpperCase()).join(' ');

  // Ефект телеграфного апарата: літери друкуються по одній
  useEffect(() => {
    if (typed.length >= target.length) return;
    const id = setTimeout(() => {
      setTyped(target.slice(0, typed.length + 1));
      if (target[typed.length] !== ' ') sound.playBlip(900 + (typed.length % 4) * 40);
    }, 35);
    return () => clearTimeout(id);
  }, [typed, target]);

  const pick = (item: { w: string; i: number }) => {
    if (done || lost) return;
    const expected = words[placed.length];
    if (item.i >= 0 && item.w === expected) {
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setPool((p) => p.filter((x) => x !== item));
      if (nextPlaced.length === words.length) {
        later(() => sound.playFanfare(), 500);
        later(() => onFinish(true), 1400);
      }
    } else {
      sound.playWrong();
      const m = mistakes + 1;
      setMistakes(m);
      setShake(item.i);
      later(() => setShake(null), 400);
      if (item.i < 0) setPool((p) => p.filter((x) => x !== item)); // пастку викидаємо
      if (m >= MAX_MISTAKES) {
        setLost(true);
        later(() => onFinish(false), 1500);
      }
    }
  };

  const reset = () => {
    sound.playSelect();
    setPool(shuffle([...words.map((w, i) => ({ w, i })), ...pool.filter((x) => x.i < 0)]));
    setPlaced([]);
    setTyped('');
  };

  const nextWord = words[placed.length];

  return (
    <div className="space-y-4">
      <div className={`parchment min-h-[96px] border-2 border-amber-800 p-4 font-mono text-base sm:text-lg ${shake !== null ? 'animate-shake' : ''}`}>
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-amber-900/80">
          <span>☎ Телеграма · Київ</span>
          <span>
            {placed.length}/{words.length}
          </span>
        </div>
        <p className="break-words font-bold tracking-wider">
          {typed}
          {!done && <span className="inline-block w-3 animate-pulse bg-amber-900/60">&nbsp;</span>}
          {done && typed.length >= target.length && <span> СТОП.</span>}
        </p>
      </div>

      <p className="text-sm text-stone-300">
        {done ? 'Телеграму відправлено! 🎉' : lost ? 'Телеграфіст заплутався…' : 'Натискай набірні бруски по порядку. Обережно: серед них можуть бути зайві слова!'}
      </p>

      <div className="flex flex-wrap gap-2">
        {pool.map((item, k) => {
          const isHint = mistakes >= 2 && item.i >= 0 && item.w === nextWord;
          return (
            <button
              key={`${item.i}-${k}`}
              type="button"
              onClick={() => pick(item)}
              disabled={done || lost}
              className={`pixel-btn border-2 px-3 py-2 font-mono text-base font-semibold ${
                shake === item.i ? 'animate-shake border-rose-500 bg-rose-950 text-rose-100' : isHint ? 'animate-sparkle border-yellow-300 bg-sky-900 text-yellow-100' : 'border-stone-950 bg-gradient-to-b from-slate-500 to-slate-700 text-white hover:from-amber-500 hover:to-amber-700'
              }`}
              style={{ boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.25), inset -2px -2px 0 rgba(0,0,0,0.35)' }}
            >
              {item.w}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400">
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
        <button type="button" onClick={reset} disabled={done || lost} className="flex items-center gap-1 hover:text-amber-300 disabled:opacity-40">
          <RotateCcw className="h-3.5 w-3.5" /> Почати знову
        </button>
      </div>
    </div>
  );
};
