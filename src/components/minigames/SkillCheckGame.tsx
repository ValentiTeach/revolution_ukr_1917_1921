/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps } from './shared';

const MAX_MISSES = 3;

function newZone(width: number) {
  const start = 10 + Math.random() * (80 - width);
  return { start, end: start + width };
}

/** «Влучи в зону» (skill check у Forsaken): тисни, коли стрілка в зеленому. */
export const SkillCheckGame: React.FC<StationGameProps & { hits: number; speed: number }> = ({ hits, speed, onFinish }) => {
  const width = Math.max(12, 22 - speed * 5);
  const [pos, setPos] = useState(0);
  const [zone, setZone] = useState(() => newZone(width));
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<'hit' | 'miss' | null>(null);
  const [done, setDone] = useState(false);
  const posRef = useRef(0);
  const dir = useRef(1);

  useEffect(() => {
    if (done) return;
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      let p = posRef.current + dir.current * dt * 60 * speed;
      if (p >= 100) {
        p = 100;
        dir.current = -1;
      } else if (p <= 0) {
        p = 0;
        dir.current = 1;
      }
      posRef.current = p;
      setPos(p);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [speed, done]);

  const press = useCallback(() => {
    if (done) return;
    const p = posRef.current;
    if (p >= zone.start && p <= zone.end) {
      sound.playStar();
      const s = score + 1;
      setScore(s);
      setFeedback('hit');
      setZone(newZone(width));
      if (s >= hits) {
        setDone(true);
        sound.playFanfare();
        setTimeout(() => onFinish(true), 900);
      }
    } else {
      sound.playWrong();
      const m = misses + 1;
      setMisses(m);
      setFeedback('miss');
      if (m >= MAX_MISSES) {
        setDone(true);
        setTimeout(() => onFinish(false), 700);
      }
    }
    setTimeout(() => setFeedback(null), 300);
  }, [done, zone, score, misses, hits, width, onFinish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Влучань: <strong className="text-amber-300">{score}</strong> / {hits}
        </span>
        <MistakeMeter mistakes={misses} max={MAX_MISSES} label="Промахи" />
      </div>
      <div className={`relative h-12 border-2 bg-stone-950 ${feedback === 'miss' ? 'border-rose-500 animate-shake' : feedback === 'hit' ? 'border-emerald-400' : 'border-stone-600'}`}>
        <div className="absolute inset-y-0 bg-emerald-600/80" style={{ left: `${zone.start}%`, width: `${zone.end - zone.start}%` }} />
        <div className="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-amber-300 shadow-[0_0_8px_#fcd34d]" style={{ left: `${pos}%` }} />
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
