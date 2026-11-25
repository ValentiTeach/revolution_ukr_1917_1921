/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sound } from '../../game/sound';
import { StationGameProps, useGameKeys, useTimers } from './shared';

const MAX_ATTEMPTS = 4;

type Mark = 'ok' | 'near' | 'no';

function grade(guess: string, code: string): Mark[] {
  const marks: Mark[] = guess.split('').map((d, i) => (d === code[i] ? 'ok' : 'no'));
  const rest = code.split('').filter((_, i) => marks[i] !== 'ok');
  guess.split('').forEach((d, i) => {
    if (marks[i] === 'ok') return;
    const idx = rest.indexOf(d);
    if (idx >= 0) {
      marks[i] = 'near';
      rest.splice(idx, 1);
    }
  });
  return marks;
}

/**
 * «Кодовий замок» (як бібліотека в DOORS): записка з підказками +
 * сейф із барабанами. Крути барабани ▲▼ (або стрілками), потім тягни ручку.
 * Кольори підказують: 🟩 цифра на місці, 🟨 є, але не тут, ⬛ немає.
 */
export const CodeLockGame: React.FC<StationGameProps & { code: string; clues: string[] }> = ({ code, clues, onFinish }) => {
  const [digits, setDigits] = useState<number[]>(() => code.split('').map(() => 0));
  const [cursor, setCursor] = useState(0);
  const [history, setHistory] = useState<{ guess: string; marks: Mark[] }[]>([]);
  const [done, setDone] = useState<'won' | 'lost' | null>(null);
  const [pulled, setPulled] = useState(false);
  const later = useTimers();

  const spin = (i: number, d: number) => {
    if (done) return;
    sound.playClick();
    setDigits((ds) => ds.map((v, k) => (k === i ? (v + d + 10) % 10 : v)));
  };

  const submit = () => {
    if (done) return;
    const guess = digits.join('');
    const marks = grade(guess, code);
    const next = [...history, { guess, marks }];
    setHistory(next);
    setPulled(true);
    later(() => setPulled(false), 300);
    if (guess === code) {
      sound.playFanfare();
      setDone('won');
      later(() => onFinish(true), 1300);
    } else if (next.length >= MAX_ATTEMPTS) {
      sound.playWrong();
      setDone('lost');
      later(() => onFinish(false), 1600);
    } else {
      sound.playThud();
    }
  };

  useGameKeys((e) => {
    if (done) return;
    if (/^\d$/.test(e.key)) {
      setDigits((ds) => ds.map((v, k) => (k === cursor ? Number(e.key) : v)));
      sound.playClick();
      setCursor((c) => Math.min(code.length - 1, c + 1));
    } else if (e.key === 'ArrowLeft') setCursor((c) => Math.max(0, c - 1));
    else if (e.key === 'ArrowRight') setCursor((c) => Math.min(code.length - 1, c + 1));
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      spin(cursor, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      spin(cursor, -1);
    } else if (e.key === 'Enter') submit();
  });

  const markCls: Record<Mark, string> = {
    ok: 'border-emerald-400 bg-emerald-700 text-white',
    near: 'border-amber-400 bg-amber-600 text-stone-950',
    no: 'border-stone-600 bg-stone-800 text-stone-400',
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="parchment space-y-1 border-2 border-amber-900/60 p-4">
        <div className="text-xs uppercase tracking-widest text-amber-900/80">Записка</div>
        {clues.map((c, i) => (
          <p key={i} className="handwriting text-xl leading-tight">
            • {c}
          </p>
        ))}
        <div className="pt-2 text-xs text-amber-900/80">🟩 — цифра на місці, 🟨 — є, але не тут, ⬛ — немає</div>
      </div>

      <div className="space-y-3">
        {/* Сейф із барабанами */}
        <div className={`border-4 border-stone-950 bg-gradient-to-b from-slate-600 to-slate-800 p-3 shadow-[inset_4px_4px_0_rgba(255,255,255,0.15)] ${done === 'won' ? 'outline outline-2 outline-emerald-400' : ''}`}>
          <div className="flex items-center justify-center gap-2">
            {digits.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <button type="button" onClick={() => spin(i, 1)} disabled={!!done} className="pixel-btn h-6 w-10 border-2 border-stone-950 bg-stone-700 text-[10px] text-amber-200" aria-label={`Барабан ${i + 1} вгору`}>
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setCursor(i)}
                  className={`my-1 flex h-16 w-10 flex-col items-center justify-center overflow-hidden border-2 bg-stone-950 font-pixel ${cursor === i && !done ? 'border-amber-400' : 'border-stone-950'}`}
                  aria-label={`Барабан ${i + 1}: ${d}`}
                >
                  <span className="text-[9px] text-stone-600">{(d + 9) % 10}</span>
                  <span className={`text-sm ${done === 'won' ? 'text-emerald-300' : 'text-amber-200'}`}>{d}</span>
                  <span className="text-[9px] text-stone-600">{(d + 1) % 10}</span>
                </button>
                <button type="button" onClick={() => spin(i, -1)} disabled={!!done} className="pixel-btn h-6 w-10 border-2 border-stone-950 bg-stone-700 text-[10px] text-amber-200" aria-label={`Барабан ${i + 1} вниз`}>
                  ▼
                </button>
              </div>
            ))}
            {/* Ручка сейфа */}
            <button
              type="button"
              onClick={submit}
              disabled={!!done}
              className="ml-2 flex flex-col items-center"
              aria-label="Потягнути ручку"
              title="Потягнути ручку (Enter)"
            >
              <span className={`block h-14 w-3 border-2 border-stone-950 bg-amber-500 transition-transform ${pulled ? 'translate-y-3' : ''}`} />
              <span className="block h-5 w-5 border-2 border-stone-950 bg-stone-900" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!!done}
          className="pixel-btn w-full border-2 border-amber-400 bg-amber-500 py-2 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
        >
          🔓 Потягнути ручку
        </button>
        <div className="space-y-1">
          {history.map((h, i) => (
            <div key={i} className="flex justify-center gap-1">
              {h.guess.split('').map((d, j) => (
                <span key={j} className={`flex h-7 w-7 items-center justify-center border font-mono text-sm ${markCls[h.marks[j]]}`}>
                  {d}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-stone-400">
          {done === 'won' ? '🔓 Відчинено!' : done === 'lost' ? `🔒 Замок заклинило. Код був ${code}.` : `Спроб лишилося: ${MAX_ATTEMPTS - history.length} · цифри можна набирати з клавіатури`}
        </p>
      </div>
    </div>
  );
};
