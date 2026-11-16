/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { MORSE_UA } from '../../game/missions';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps } from './shared';

const MAX_MISTAKES = 3;

/** «Азбука Морзе»: подивись і послухай сигнал, потім повтори його. */
export const MorseGame: React.FC<StationGameProps & { word: string }> = ({ word, onFinish }) => {
  const letters = word.toUpperCase().split('');
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'watch' | 'input' | 'done'>('watch');
  const [input, setInput] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const letter = letters[index];
  const code = MORSE_UA[letter] ?? '';

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Відтворити сигнал поточної літери
  useEffect(() => {
    if (phase !== 'watch') return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    let t = 400;
    code.split('').forEach((sym, i) => {
      const dur = sym === '.' ? 180 : 480;
      timers.current.push(
        setTimeout(() => {
          setLit(i);
          sound.playBeep(720, dur / 1000);
        }, t),
      );
      timers.current.push(setTimeout(() => setLit(null), t + dur));
      t += dur + 220;
    });
    timers.current.push(setTimeout(() => setPhase('input'), t + 600));
  }, [phase, code]);

  const tap = (sym: '.' | '-') => {
    if (phase !== 'input') return;
    sound.playBeep(720, sym === '.' ? 0.08 : 0.25);
    const next = input + sym;
    if (!code.startsWith(next)) {
      sound.playWrong();
      const m = mistakes + 1;
      setMistakes(m);
      setInput('');
      if (m >= MAX_MISTAKES) {
        setPhase('done');
        setTimeout(() => onFinish(false), 900);
      } else {
        setPhase('watch');
      }
      return;
    }
    setInput(next);
    if (next === code) {
      sound.playStar();
      if (index + 1 >= letters.length) {
        setPhase('done');
        sound.playFanfare();
        setTimeout(() => onFinish(true), 1000);
      } else {
        setTimeout(() => {
          setIndex(index + 1);
          setInput('');
          setPhase('watch');
        }, 500);
      }
    }
  };

  const renderSymbols = (str: string, highlight?: number | null) =>
    str.split('').map((s, i) => (
      <span
        key={i}
        className={`inline-block ${s === '.' ? 'h-4 w-4 rounded-full' : 'h-4 w-10'} ${
          highlight === undefined || highlight === i ? 'bg-amber-300 shadow-[0_0_10px_#fcd34d]' : 'bg-stone-600'
        }`}
      />
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span className="font-pixel text-xs tracking-widest">
          {letters.map((l, i) => (
            <span key={i} className={i < index || phase === 'done' ? 'text-emerald-400' : i === index ? 'text-amber-300' : 'text-stone-600'}>
              {l}
            </span>
          ))}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>

      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 border-2 border-stone-700 bg-stone-950 p-4">
        <div className="font-pixel text-3xl text-amber-200">{letter}</div>
        {phase === 'watch' && (
          <>
            <div className="flex items-center gap-2">{renderSymbols(code, lit)}</div>
            <div className="text-xs text-stone-400">👀 Дивись і слухай…</div>
          </>
        )}
        {phase === 'input' && (
          <>
            <div className="flex min-h-4 items-center gap-2">{input ? renderSymbols(input) : <span className="text-xs text-stone-500">Повтори сигнал!</span>}</div>
          </>
        )}
        {phase === 'done' && <div className="text-sm font-bold text-emerald-300">{mistakes >= MAX_MISTAKES ? 'Сигнал загубився…' : 'Сигнал прийнято! 📡'}</div>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button type="button" onClick={() => tap('.')} disabled={phase !== 'input'} className="pixel-btn border-2 border-amber-400 bg-amber-500 py-4 text-2xl font-bold text-stone-950 disabled:opacity-40">
          ●
        </button>
        <button type="button" onClick={() => tap('-')} disabled={phase !== 'input'} className="pixel-btn border-2 border-amber-400 bg-amber-500 py-4 text-2xl font-bold text-stone-950 disabled:opacity-40">
          ▬
        </button>
        <button
          type="button"
          onClick={() => {
            setInput('');
            setPhase('watch');
          }}
          disabled={phase !== 'input'}
          className="pixel-btn border-2 border-stone-600 bg-stone-800 text-sm text-stone-200 disabled:opacity-40"
        >
          🔁 Ще раз
        </button>
      </div>
      <p className="text-xs text-stone-500">● — коротко (крапка), ▬ — довго (тире).</p>
    </div>
  );
};
