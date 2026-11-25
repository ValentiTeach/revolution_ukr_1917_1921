/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { UA_ALPHABET, caesar } from '../../game/minigameLogic';
import { MistakeMeter, StationGameProps, useGameKeys, useTimers } from './shared';

const MAX_MISTAKES = 3;
const N = UA_ALPHABET.length;

/**
 * «Шифрувальне коло»: зовнішнє кільце — літери шифровки, внутрішнє — справжні.
 * Повертай внутрішнє кільце, і стрічка внизу одразу показує розшифровку.
 * Коли вийшли справжні слова — тисни «Розшифровано!». Підбирати навмання не вийде:
 * за хибну відповідь — помилка.
 */
export const CipherGame: React.FC<StationGameProps & { text: string; shift: number }> = ({ text, shift, onFinish }) => {
  const plain = text.toUpperCase();
  const encrypted = useMemo(() => caesar(plain, shift), [plain, shift]);
  // Початковий поворот завжди «неправильний»
  const [offset, setOffset] = useState(() => (shift + 7 + Math.floor(Math.random() * (N - 14))) % N);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState<'won' | 'lost' | null>(null);
  const [shake, setShake] = useState(false);
  const later = useTimers();
  const dragAngle = useRef<number | null>(null);
  const wheelRef = useRef<SVGSVGElement | null>(null);

  const decoded = caesar(encrypted, -offset);
  const firstWord = plain.split(' ')[0];

  const rotate = (d: number) => {
    if (done) return;
    sound.playClick();
    setOffset((o) => (((o + d) % N) + N) % N);
  };

  const submit = () => {
    if (done) return;
    if (offset === ((shift % N) + N) % N) {
      sound.playFanfare();
      setDone('won');
      later(() => onFinish(true), 1400);
      return;
    }
    sound.playWrong();
    setShake(true);
    later(() => setShake(false), 350);
    const m = mistakes + 1;
    setMistakes(m);
    if (m >= MAX_MISTAKES) {
      setDone('lost');
      later(() => onFinish(false), 1600);
    }
  };

  useGameKeys((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      rotate(-1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      rotate(1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });

  // Перетягування кола пальцем: кожні 360/N градусів — один «клац»
  const angleOf = (e: React.PointerEvent) => {
    const r = wheelRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const step = 360 / N;

  const size = 260;
  const c = size / 2;
  const letterAt = (i: number, radius: number, rot: number) => {
    const a = ((i * step + rot - 90) * Math.PI) / 180;
    return { x: c + Math.cos(a) * radius, y: c + Math.sin(a) * radius };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Поворот кола: <strong className="font-pixel text-xs text-amber-300">{offset}</strong>
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <div className="relative mx-auto select-none" style={{ width: size, height: size }}>
          <svg
            ref={wheelRef}
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            shapeRendering="crispEdges"
            className="cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              dragAngle.current = angleOf(e);
            }}
            onPointerMove={(e) => {
              if (dragAngle.current === null) return;
              const a = angleOf(e);
              let diff = a - dragAngle.current;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
              if (Math.abs(diff) >= step) {
                const clicks = Math.trunc(diff / step);
                // Внутрішнє коло крутиться за пальцем: за годинниковою стрілкою — назад по абетці
                rotate(-clicks);
                dragAngle.current += clicks * step;
              }
            }}
            onPointerUp={() => (dragAngle.current = null)}
            onPointerCancel={() => (dragAngle.current = null)}
            onWheel={(e) => rotate(e.deltaY > 0 ? 1 : -1)}
            role="slider"
            aria-label="Шифрувальне коло"
            aria-valuemin={0}
            aria-valuemax={N - 1}
            aria-valuenow={offset}
          >
            {/* Зовнішній латунний диск */}
            <circle cx={c} cy={c} r={c - 2} fill="#78350f" stroke="#0c0a09" strokeWidth="4" />
            <circle cx={c} cy={c} r={c - 8} fill="#b45309" />
            <circle cx={c} cy={c} r={c - 40} fill="#1c1917" stroke="#f59e0b" strokeWidth="2" />
            <circle cx={c} cy={c} r={c - 72} fill="#292524" stroke="#0c0a09" strokeWidth="3" />
            {/* Літери шифровки (нерухомі) */}
            {UA_ALPHABET.split('').map((ch, i) => {
              const p = letterAt(i, c - 24, 0);
              return (
                <text key={`o${ch}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="700" fill="#fde68a" fontFamily="Pixelify Sans, monospace">
                  {ch}
                </text>
              );
            })}
            {/* Відкриті літери на внутрішньому колі: під шифр-літерою i стоїть літера (i - offset) */}
            {UA_ALPHABET.split('').map((ch, i) => {
              const p = letterAt(i + offset, c - 56, 0);
              return (
                <text key={`i${ch}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#bae6fd" fontFamily="Pixelify Sans, monospace">
                  {ch}
                </text>
              );
            })}
            {/* Стрілка на «А» */}
            <rect x={c - 3} y={2} width={6} height={10} fill="#ef4444" stroke="#0c0a09" strokeWidth="1" />
            <text x={c} y={c} textAnchor="middle" dominantBaseline="central" fontSize="22" fill="#f59e0b" fontFamily="Press Start 2P, monospace">
              ✦
            </text>
          </svg>
          <p className="mt-1 text-center text-[11px] text-stone-500">Крути колесом, пальцем або стрілками ← →</p>
        </div>

        <div className="space-y-3">
          <div className="parchment border-2 border-amber-900/60 p-3">
            <div className="mb-1 flex justify-between text-[11px] uppercase tracking-widest text-amber-900/80">
              <span>☎ Перехоплено</span>
              <span>ЦІЛКОМ ТАЄМНО</span>
            </div>
            <p className="font-mono text-base font-bold tracking-[0.18em] text-amber-950 break-words">{encrypted}</p>
          </div>
          <div className={`border-2 bg-stone-950 p-3 ${shake ? 'animate-shake border-rose-500' : done === 'won' ? 'border-emerald-400' : 'border-sky-800'}`}>
            <div className="mb-1 text-[11px] uppercase tracking-widest text-sky-400">Розшифровка</div>
            <p className={`font-mono text-base font-bold tracking-[0.18em] break-words ${done === 'won' ? 'text-emerald-300' : 'text-sky-100'}`}>{decoded}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => rotate(-1)} disabled={!!done} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-4 py-2 font-pixel text-xs" aria-label="Повернути назад">
              ◀
            </button>
            <button type="button" onClick={() => rotate(1)} disabled={!!done} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-4 py-2 font-pixel text-xs" aria-label="Повернути вперед">
              ▶
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!!done}
              className="pixel-btn flex-1 border-2 border-amber-400 bg-amber-500 px-4 py-2 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              🔓 Розшифровано!
            </button>
          </div>
          {mistakes >= 1 && !done && (
            <p className="border-l-4 border-sky-600 bg-sky-950/40 p-2 text-xs text-sky-100">
              🕊️ Підказка: перше слово має {firstWord.length} {firstWord.length < 5 ? 'літери' : 'літер'}
              {mistakes >= 2 && <> і починається на «{firstWord[0]}»</>}.
            </p>
          )}
          {done === 'won' && <p className="font-bold text-emerald-300">Шифр зламано! Тепер ми знаємо правду.</p>}
          {done === 'lost' && <p className="text-rose-300">Шифрувальник збився… Правильно було: «{plain}».</p>}
        </div>
      </div>
    </div>
  );
};
