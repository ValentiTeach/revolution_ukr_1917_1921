/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { sound } from '../../game/sound';

interface TelegramPuzzleProps {
  sentence: string;
  onFinish: (won: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Гра «Телеграма»: склади слова у правильному порядку. */
export const TelegramPuzzle: React.FC<TelegramPuzzleProps> = ({ sentence, onFinish }) => {
  const words = useMemo(() => sentence.split(' '), [sentence]);
  const [pool, setPool] = useState(() => {
    let s = shuffle(words.map((w, i) => ({ w, i })));
    // гарантуємо, що слова дійсно перемішані
    if (s.every((x, idx) => x.i === idx) && words.length > 1) s = [...s.slice(1), s[0]];
    return s;
  });
  const [placed, setPlaced] = useState<{ w: string; i: number }[]>([]);
  const [shake, setShake] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const done = placed.length === words.length;

  const pick = (item: { w: string; i: number }) => {
    const expected = words[placed.length];
    if (item.w === expected) {
      sound.playBlip(500 + placed.length * 40);
      const nextPlaced = [...placed, item];
      setPlaced(nextPlaced);
      setPool((p) => p.filter((x) => x !== item));
      if (nextPlaced.length === words.length) {
        sound.playFanfare();
        setTimeout(() => onFinish(true), 900);
      }
    } else {
      sound.playWrong();
      setMistakes((m) => m + 1);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const reset = () => {
    sound.playSelect();
    setPool(shuffle(words.map((w, i) => ({ w, i }))));
    setPlaced([]);
  };

  return (
    <div className="space-y-4">
      <div
        className={`parchment min-h-[96px] border-2 border-amber-800 p-4 font-mono text-base sm:text-lg ${shake ? 'animate-shake' : ''}`}
      >
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-widest text-amber-900/80">
          <span>☎ Телеграма · Київ</span>
          <span>
            {placed.length}/{words.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {placed.map((p) => (
            <span key={p.i} className="bg-amber-900/15 px-1.5 font-bold">
              {p.w.toUpperCase()}
            </span>
          ))}
          {!done && <span className="inline-block w-3 animate-pulse bg-amber-900/60">&nbsp;</span>}
          {done && <span className="font-bold"> СТОП.</span>}
        </div>
      </div>

      <p className="text-sm text-stone-300">
        {done ? 'Телеграму відправлено! 🎉' : 'Натискай слова по порядку, щоб скласти речення:'}
      </p>

      <div className="flex flex-wrap gap-2">
        {pool.map((item) => (
          <button
            key={item.i}
            type="button"
            onClick={() => pick(item)}
            className="pixel-btn border-2 border-sky-700 bg-sky-950 px-3 py-2 text-base font-semibold text-sky-100 hover:border-amber-400 hover:text-amber-200"
          >
            {item.w}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>Помилок: {mistakes} {mistakes >= 3 && '· Підказка: перше слово з великої літери!'}</span>
        <div className="flex gap-3">
          <button type="button" onClick={reset} className="flex items-center gap-1 hover:text-amber-300">
            <RotateCcw className="h-3.5 w-3.5" /> Почати знову
          </button>
          <button type="button" onClick={() => onFinish(false)} className="hover:text-stone-200 underline">
            Пропустити
          </button>
        </div>
      </div>
    </div>
  );
};
