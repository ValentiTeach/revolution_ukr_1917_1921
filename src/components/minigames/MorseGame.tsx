/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { MORSE_UA } from '../../game/missions';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, useGameKeys, useTimers } from './shared';

const MAX_MISTAKES = 3;
/** Довше за це — тире, коротше — крапка (як на справжньому ключі). */
const DASH_MS = 230;

/**
 * «Азбука Морзе»: подивись і послухай сигнал, а потім відстукай його
 * на телеграфному ключі. Коротке натискання — крапка, довге — тире.
 * Можна тримати мишку, палець або пробіл. Для тих, кому важко тримати,
 * є запасні кнопки «●» і «▬».
 */
export const MorseGame: React.FC<StationGameProps & { word: string }> = ({ word, onFinish }) => {
  const letters = word.toUpperCase().split('');
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'watch' | 'input' | 'done'>('watch');
  const [input, setInput] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [tape, setTape] = useState<string>('');
  const pressStart = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useTimers();

  const letter = letters[index];
  const code = MORSE_UA[letter] ?? '';

  useEffect(
    () => () => {
      watchTimers.current.forEach(clearTimeout);
      if (holdTimer.current) clearInterval(holdTimer.current);
      sound.stopTone();
    },
    [],
  );

  // Відтворити сигнал поточної літери
  useEffect(() => {
    if (phase !== 'watch') return;
    watchTimers.current.forEach(clearTimeout);
    watchTimers.current = [];
    let t = 500;
    code.split('').forEach((sym, i) => {
      const dur = sym === '.' ? 160 : 460;
      watchTimers.current.push(
        setTimeout(() => {
          setLit(i);
          sound.playBeep(720, dur / 1000);
        }, t),
      );
      watchTimers.current.push(setTimeout(() => setLit(null), t + dur));
      t += dur + 220;
    });
    watchTimers.current.push(setTimeout(() => setPhase('input'), t + 450));
  }, [phase, code]);

  const addSymbol = (sym: '.' | '-') => {
    if (phase !== 'input') return;
    setTape((tp) => (tp + sym).slice(-40));
    const next = input + sym;
    if (!code.startsWith(next)) {
      sound.playWrong();
      const m = mistakes + 1;
      setMistakes(m);
      setInput('');
      setTape((tp) => tp + ' ✗ ');
      if (m >= MAX_MISTAKES) {
        setPhase('done');
        later(() => onFinish(false), 1200);
      } else {
        later(() => setPhase('watch'), 500);
      }
      return;
    }
    setInput(next);
    if (next === code) {
      sound.playStar();
      setTape((tp) => tp + '  ');
      if (index + 1 >= letters.length) {
        setPhase('done');
        sound.playFanfare();
        later(() => onFinish(true), 1200);
      } else {
        later(() => {
          setIndex((i) => i + 1);
          setInput('');
          setPhase('watch');
        }, 600);
      }
    }
  };

  // Телеграфний ключ: тримай довше — тире
  const keyDown = () => {
    if (phase !== 'input' || pressStart.current !== null) return;
    pressStart.current = performance.now();
    setPressed(true);
    setHoldMs(0);
    sound.startTone(720);
    holdTimer.current = setInterval(() => {
      if (pressStart.current !== null) setHoldMs(performance.now() - pressStart.current);
    }, 30);
  };
  const keyUp = () => {
    if (pressStart.current === null) return;
    const ms = performance.now() - pressStart.current;
    pressStart.current = null;
    setPressed(false);
    if (holdTimer.current) clearInterval(holdTimer.current);
    sound.stopTone();
    addSymbol(ms >= DASH_MS ? '-' : '.');
  };

  useGameKeys((e) => {
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      keyDown();
    } else if (e.key === '.') addSymbol('.');
    else if (e.key === '-') addSymbol('-');
  });
  useEffect(() => {
    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') keyUp();
    };
    window.addEventListener('keyup', up);
    return () => window.removeEventListener('keyup', up);
  });

  const renderSymbols = (str: string, highlight?: number | null) =>
    str.split('').map((s, i) => (
      <span
        key={i}
        className={`inline-block ${s === '.' ? 'h-4 w-4' : 'h-4 w-10'} ${
          highlight === undefined || highlight === i ? 'bg-amber-300 shadow-[0_0_0_2px_#fcd34d,0_0_0_4px_rgba(252,211,77,0.35)]' : 'bg-stone-600'
        }`}
      />
    ));

  const holdPct = Math.min(100, (holdMs / (DASH_MS * 1.6)) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span className="font-pixel text-[16px]">
          {letters.map((l, i) => (
            <span key={i} className={i < index || phase === 'done' ? 'text-emerald-400' : i === index ? 'text-amber-300' : 'text-stone-600'}>
              {l}
            </span>
          ))}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>

      <div className="flex min-h-[120px] flex-col items-center justify-center gap-3 border-2 border-stone-700 bg-stone-950 p-4">
        <div className="flex items-center gap-3">
          <span className={`h-5 w-5 border-2 border-stone-950 ${lit !== null || pressed ? 'bg-amber-300 shadow-[0_0_0_2px_#fcd34d,0_0_0_4px_rgba(252,211,77,0.35)]' : 'bg-stone-700'}`} aria-hidden />
          <span className="font-pixel text-[32px] text-amber-200">{letter}</span>
        </div>
        {phase === 'watch' && (
          <>
            <div className="flex items-center gap-2">{renderSymbols(code, lit)}</div>
            <div className="text-xs text-stone-400">👀 Дивись і слухай…</div>
          </>
        )}
        {phase === 'input' && (
          <div className="flex min-h-4 items-center gap-2">{input ? renderSymbols(input) : <span className="text-xs text-stone-500">Відстукай сигнал ключем!</span>}</div>
        )}
        {phase === 'done' && <div className="text-sm font-bold text-emerald-300">{mistakes >= MAX_MISTAKES ? 'Сигнал загубився…' : 'Сигнал прийнято! 📡'}</div>}
      </div>

      {/* Паперова стрічка телеграфного апарата */}
      <div className="parchment overflow-hidden border-2 border-amber-900/60 px-3 py-1">
        <div className="whitespace-nowrap text-right font-mono text-lg font-bold tracking-[0.3em] text-amber-950" aria-label="Стрічка">
          {tape.replace(/\./g, '•').replace(/-/g, '—') || '…'}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-stretch gap-3">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            keyDown();
          }}
          onPointerUp={keyUp}
          onPointerLeave={keyUp}
          onPointerCancel={keyUp}
          disabled={phase !== 'input'}
          className={`relative flex touch-none select-none flex-col items-center justify-end gap-1 overflow-hidden border-2 border-stone-950 bg-gradient-to-b from-stone-700 to-stone-900 py-3 disabled:opacity-50 ${
            pressed ? 'translate-y-1' : ''
          }`}
          aria-label="Телеграфний ключ: коротко — крапка, довго — тире"
        >
          {/* Важіль ключа */}
          <span className={`block h-3 w-40 max-w-[80%] border-2 border-stone-950 bg-amber-600 ${pressed ? 'translate-y-1' : ''}`} />
          <span className="block h-5 w-8 border-2 border-stone-950 bg-stone-950" />
          <span className="text-xs text-stone-300">Тримай ключ (або пробіл): коротко ●, довго ▬</span>
          <span className="absolute bottom-0 left-0 h-1 bg-amber-400" style={{ width: `${pressed ? holdPct : 0}%` }} />
          {pressed && <span className="absolute right-2 top-1 font-pixel text-[8px] text-amber-200">{holdMs >= DASH_MS ? '▬' : '●'}</span>}
        </button>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => addSymbol('.')} disabled={phase !== 'input'} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-3 py-1.5 text-lg disabled:opacity-40" aria-label="Крапка">
            ●
          </button>
          <button type="button" onClick={() => addSymbol('-')} disabled={phase !== 'input'} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-3 py-1.5 text-lg disabled:opacity-40" aria-label="Тире">
            ▬
          </button>
          <button
            type="button"
            onClick={() => {
              setInput('');
              setPhase('watch');
            }}
            disabled={phase !== 'input'}
            className="pixel-btn border-2 border-stone-600 bg-stone-900 px-2 py-1 text-xs text-stone-300 disabled:opacity-40"
          >
            🔁 Ще раз
          </button>
        </div>
      </div>
    </div>
  );
};
