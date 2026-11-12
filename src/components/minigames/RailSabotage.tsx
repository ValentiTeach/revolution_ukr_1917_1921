/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../../game/sound';

interface RailSabotageProps {
  target: number;
  seconds: number;
  onFinish: (won: boolean) => void;
}

const SLEEPERS = 12;

/**
 * Гра «Затримай ешелон»: натискай на шпали, що світяться, доки потяг не доїхав.
 * Кожна розібрана шпала відштовхує потяг трохи назад.
 */
export const RailSabotage: React.FC<RailSabotageProps> = ({ target, seconds, onFinish }) => {
  const [phase, setPhase] = useState<'ready' | 'play' | 'won' | 'lost'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [active, setActive] = useState<number>(() => Math.floor(Math.random() * SLEEPERS));
  const [trainPos, setTrainPos] = useState(0); // 0..100, 100 = доїхав
  const finished = useRef(false);

  useEffect(() => {
    if (phase !== 'play') return;
    const tick = setInterval(() => {
      setTimeLeft((t) => Math.max(0, +(t - 0.1).toFixed(1)));
      setTrainPos((p) => Math.min(100, p + 100 / (seconds * 10)));
    }, 100);
    return () => clearInterval(tick);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== 'play' || finished.current) return;
    if (score >= target) {
      finished.current = true;
      setPhase('won');
      sound.playFanfare();
      setTimeout(() => onFinish(true), 1400);
    } else if (timeLeft <= 0 || trainPos >= 100) {
      finished.current = true;
      setPhase('lost');
      sound.playTrain();
    }
  }, [score, timeLeft, trainPos, target, phase, onFinish]);

  const hit = (i: number) => {
    if (phase !== 'play') return;
    if (i === active) {
      sound.playMarch();
      setScore((s) => s + 1);
      setTrainPos((p) => Math.max(0, p - 3));
      let next = Math.floor(Math.random() * SLEEPERS);
      if (next === i) next = (next + 1) % SLEEPERS;
      setActive(next);
    } else {
      sound.playBlip(200);
    }
  };

  const start = () => {
    finished.current = false;
    setScore(0);
    setTimeLeft(seconds);
    setTrainPos(0);
    setPhase('play');
    sound.playTrain();
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden border-2 border-stone-700 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-800 h-44 sm:h-52">
        <div className="snow-layer absolute inset-0 pointer-events-none" />
        {/* Колія */}
        <div className="absolute left-0 right-0 bottom-10 h-1 bg-stone-500" />
        <div className="absolute left-0 right-0 bottom-6 h-1 bg-stone-500" />
        {/* Станція */}
        <div className="absolute right-2 bottom-12 text-4xl" aria-hidden>
          🏚️
        </div>
        <div className="absolute right-1 bottom-24 font-pixel text-[8px] text-amber-200 bg-stone-950/80 px-1">КРУТИ</div>
        {/* Потяг */}
        <div
          className="absolute bottom-8 text-5xl transition-[left] duration-100 ease-linear"
          style={{ left: `calc(${trainPos * 0.78}% - 10px)` }}
          aria-hidden
        >
          🚂
        </div>
        <div className="absolute top-2 left-2 right-2 flex justify-between font-pixel text-[9px] sm:text-[10px] text-amber-200">
          <span>⏱ {timeLeft.toFixed(1)}с</span>
          <span>
            🔧 {score}/{target}
          </span>
        </div>
      </div>

      {/* Шпали */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: SLEEPERS }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => hit(i)}
            disabled={phase !== 'play'}
            aria-label={i === active ? 'Розібрати цю шпалу' : 'Шпала'}
            className={`h-12 sm:h-14 border-2 transition-colors ${
              phase === 'play' && i === active
                ? 'border-amber-300 bg-amber-600 animate-sparkle'
                : 'border-stone-700 bg-amber-950/70'
            }`}
          >
            <span className="text-lg">{phase === 'play' && i === active ? '🔨' : ''}</span>
          </button>
        ))}
      </div>

      <div className="text-center space-y-3">
        {phase === 'ready' && (
          <>
            <p className="text-sm text-stone-300">
              Тисни на шпалу з молотком 🔨. Розбери <strong>{target}</strong> шпал за <strong>{seconds}</strong> секунд, поки потяг не доїхав до станції!
            </p>
            <button
              type="button"
              onClick={start}
              className="pixel-btn border-2 border-amber-400 bg-amber-500 px-6 py-3 font-bold text-stone-950 hover:bg-amber-400"
            >
              Почали!
            </button>
          </>
        )}
        {phase === 'won' && <p className="text-lg font-bold text-emerald-300">Ешелон зупинено! Київ має час! 🎉</p>}
        {phase === 'lost' && (
          <div className="space-y-2">
            <p className="text-base text-rose-300">Потяг прорвався… Але герої не здаються!</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={start}
                className="pixel-btn border-2 border-amber-400 bg-amber-500 px-5 py-2 font-bold text-stone-950"
              >
                Ще раз
              </button>
              <button
                type="button"
                onClick={() => onFinish(false)}
                className="pixel-btn border-2 border-stone-600 bg-stone-800 px-5 py-2 text-stone-200"
              >
                Далі
              </button>
            </div>
          </div>
        )}
        {phase !== 'won' && phase !== 'lost' && (
          <button type="button" onClick={() => onFinish(false)} className="text-xs text-stone-400 underline">
            Пропустити
          </button>
        )}
      </div>
    </div>
  );
};
