/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, useGameKeys, useTimers } from './shared';

const MAX_MISSES = 3;
const SEGMENTS = 48;

function newZone(width: number, from = 0) {
  // Зона завжди трохи попереду стрілки, щоб устигнути зреагувати
  const start = (from + 90 + Math.random() * 180) % 360;
  return { start, width, perfect: Math.max(8, width * 0.3) };
}

function inArc(angle: number, start: number, width: number) {
  const d = (((angle - start) % 360) + 360) % 360;
  return d <= width;
}

/**
 * «Влуч у зону» (skill check у Forsaken): стрілка біжить по колу,
 * тисни, коли вона в зеленому секторі. Золотий центр — ідеальний удар,
 * він дає ще одне влучання. Після кожного влучання стрілка прискорюється,
 * а на важких рівнях іноді змінює напрямок.
 */
export const SkillCheckGame: React.FC<StationGameProps & { hits: number; speed: number }> = ({ hits, speed, onFinish }) => {
  const width = Math.max(26, 62 - speed * 18);
  const [angle, setAngle] = useState(0);
  const [zone, setZone] = useState(() => newZone(width));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<'hit' | 'perfect' | 'miss' | null>(null);
  const [done, setDone] = useState(false);
  const angleRef = useRef(0);
  const dir = useRef(1);
  const boost = useRef(1);
  const later = useTimers();

  useEffect(() => {
    if (done) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      // ~1 оберт за 2.4 с на швидкості 1
      const a = (angleRef.current + dir.current * dt * 150 * speed * boost.current + 360) % 360;
      angleRef.current = a;
      setAngle(Math.round(a / (360 / SEGMENTS)) * (360 / SEGMENTS));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed, done]);

  const press = useCallback(() => {
    if (done) return;
    const a = angleRef.current;
    const perfectStart = zone.start + (zone.width - zone.perfect) / 2;
    if (inArc(a, zone.start, zone.width)) {
      const perfect = inArc(a, perfectStart, zone.perfect);
      perfect ? sound.playFanfare() : sound.playStar();
      const s = Math.min(hits, score + (perfect ? 2 : 1));
      setScore(s);
      setFeedback(perfect ? 'perfect' : 'hit');
      boost.current = Math.min(1.6, boost.current + 0.08);
      if (speed >= 1.4 && Math.random() < 0.35) dir.current *= -1;
      setZone(newZone(width, a));
      if (s >= hits) {
        setDone(true);
        later(() => onFinish(true), 900);
      }
    } else {
      sound.playWrong();
      const m = misses + 1;
      setMisses(m);
      setFeedback('miss');
      setZone(newZone(width, a));
      if (m >= MAX_MISSES) {
        setDone(true);
        later(() => onFinish(false), 800);
      }
    }
    later(() => setFeedback(null), 350);
  }, [done, zone, score, misses, hits, width, speed, onFinish, later]);

  useGameKeys((e) => {
    if (e.code === 'Space' || e.key === 'Enter') {
      e.preventDefault();
      press();
    }
  });

  // Сегменти кільця: зелені — зона, золоті — ідеал
  const segAngle = 360 / SEGMENTS;
  const perfectStart = zone.start + (zone.width - zone.perfect) / 2;
  const size = 200;
  const c = size / 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Влучань: <strong className="text-amber-300">{score}</strong> / {hits}
        </span>
        <MistakeMeter mistakes={misses} max={MAX_MISSES} label="Промахи" />
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={press}
          disabled={done}
          className={`relative touch-manipulation ${feedback === 'miss' ? 'animate-shake' : ''}`}
          aria-label="Тисни, коли стрілка в зеленій зоні"
        >
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} shapeRendering="crispEdges">
            <circle cx={c} cy={c} r={c - 2} fill="#0c0a09" />
            {Array.from({ length: SEGMENTS }).map((_, i) => {
              const mid = i * segAngle + segAngle / 2;
              const isZone = inArc(mid, zone.start, zone.width);
              const isPerfect = inArc(mid, perfectStart, zone.perfect);
              const a = ((mid - 90) * Math.PI) / 180;
              const x = c + Math.cos(a) * (c - 18);
              const y = c + Math.sin(a) * (c - 18);
              return (
                <rect
                  key={i}
                  x={Math.round(x - 6)}
                  y={Math.round(y - 6)}
                  width={12}
                  height={12}
                  fill={isPerfect ? '#facc15' : isZone ? '#22c55e' : '#292524'}
                  stroke="#0c0a09"
                  strokeWidth={2}
                />
              );
            })}
            {/* Стрілка */}
            {(() => {
              const a = ((angle - 90) * Math.PI) / 180;
              return Array.from({ length: 7 }).map((_, i) => {
                const r = 14 + i * 10;
                return (
                  <rect key={i} x={Math.round(c + Math.cos(a) * r - 3)} y={Math.round(c + Math.sin(a) * r - 3)} width={6} height={6} fill={i === 6 ? '#fde68a' : '#f59e0b'} />
                );
              });
            })()}
            <rect x={c - 8} y={c - 8} width={16} height={16} fill="#b45309" stroke="#0c0a09" strokeWidth={2} />
          </svg>
          {feedback && (
            <span
              className={`px-pop absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-pixel text-[8px] [text-shadow:2px_2px_0_#000] ${
                feedback === 'miss' ? 'text-rose-300' : feedback === 'perfect' ? 'text-yellow-200' : 'text-emerald-200'
              }`}
            >
              {feedback === 'miss' ? 'ПРОМАХ' : feedback === 'perfect' ? 'ІДЕАЛЬНО! ×2' : 'ВЛУЧНО'}
            </span>
          )}
        </button>
        <div className="max-w-[14rem] space-y-2 text-xs text-stone-400">
          <p>
            <span className="inline-block h-3 w-3 bg-emerald-500 align-middle" /> зелена зона — влучання
          </p>
          <p>
            <span className="inline-block h-3 w-3 bg-yellow-400 align-middle" /> золотий центр — ідеально (+2)
          </p>
          <p>Тисни на коло, кнопку або пробіл. З кожним влучанням стрілка швидшає!</p>
        </div>
      </div>
      <button
        type="button"
        onClick={press}
        disabled={done}
        className="pixel-btn w-full border-2 border-amber-400 bg-amber-500 py-4 text-lg font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-60"
      >
        ТИСНИ! <span className="text-xs font-normal">(або пробіл)</span>
      </button>
    </div>
  );
};
