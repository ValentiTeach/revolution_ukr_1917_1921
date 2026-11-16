/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Delete } from '../icons';
import { sound } from '../../game/sound';
import { StationGameProps } from './shared';

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

/** «Кодовий замок» (як бібліотека в DOORS): підказки + цифрова панель. */
export const CodeLockGame: React.FC<StationGameProps & { code: string; clues: string[] }> = ({ code, clues, onFinish }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ guess: string; marks: Mark[] }[]>([]);
  const [done, setDone] = useState<'won' | 'lost' | null>(null);

  const press = (d: string) => {
    if (done || input.length >= code.length) return;
    sound.playBeep(500 + Number(d) * 40, 0.06);
    setInput(input + d);
  };

  const submit = () => {
    if (done || input.length !== code.length) return;
    const marks = grade(input, code);
    const next = [...history, { guess: input, marks }];
    setHistory(next);
    setInput('');
    if (input === code) {
      sound.playFanfare();
      setDone('won');
      setTimeout(() => onFinish(true), 1100);
    } else if (next.length >= MAX_ATTEMPTS) {
      sound.playWrong();
      setDone('lost');
      setTimeout(() => onFinish(false), 1400);
    } else {
      sound.playWrong();
    }
  };

  const markCls: Record<Mark, string> = {
    ok: 'border-emerald-400 bg-emerald-700 text-white',
    near: 'border-amber-400 bg-amber-600 text-stone-950',
    no: 'border-stone-600 bg-stone-800 text-stone-400',
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="parchment border-2 border-amber-900/60 p-4 space-y-1">
        <div className="text-xs uppercase tracking-widest text-amber-900/80">Записка</div>
        {clues.map((c, i) => (
          <p key={i} className="handwriting text-xl leading-tight">
            • {c}
          </p>
        ))}
        <div className="pt-2 text-xs text-amber-900/80">
          🟩 — цифра на місці, 🟨 — є, але не тут, ⬛ — немає
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          {Array.from({ length: code.length }).map((_, i) => (
            <span key={i} className="flex h-12 w-10 items-center justify-center border-2 border-amber-600 bg-stone-950 font-pixel text-sm text-amber-200">
              {input[i] ?? (done === 'won' ? code[i] : '')}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" onClick={() => press(d)} className="pixel-btn border-2 border-stone-600 bg-stone-800 py-2.5 font-pixel text-xs hover:border-amber-400">
              {d}
            </button>
          ))}
          <button type="button" onClick={() => setInput(input.slice(0, -1))} aria-label="Стерти" className="pixel-btn flex items-center justify-center border-2 border-stone-600 bg-stone-900">
            <Delete className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => press('0')} className="pixel-btn border-2 border-stone-600 bg-stone-800 py-2.5 font-pixel text-xs hover:border-amber-400">
            0
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={input.length !== code.length}
            className="pixel-btn border-2 border-amber-400 bg-amber-500 font-bold text-stone-950 disabled:opacity-40"
          >
            OK
          </button>
        </div>
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
          {done === 'won'
            ? '🔓 Відчинено!'
            : done === 'lost'
            ? `🔒 Замок заклинило. Код був ${code}.`
            : `Спроб лишилося: ${MAX_ATTEMPTS - history.length}`}
        </p>
      </div>
    </div>
  );
};
