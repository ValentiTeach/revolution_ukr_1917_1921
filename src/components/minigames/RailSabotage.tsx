/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { PixelSprite } from '../PixelSprite';
import { useGameKeys, useTimers } from './shared';

interface RailSabotageProps {
  /** Скільки гайок треба відкрутити. */
  target: number;
  /** За скільки секунд потяг доїде до станції. */
  seconds: number;
  onFinish: (won: boolean) => void;
}

const JOINTS = 6;
const TURNS = 3;

/**
 * «Затримай ешелон»: на стиках рейок світиться гайка. Натисни її кілька
 * разів (або цифру стику на клавіатурі), щоб відкрутити ключем. Кожна відкручена гайка відкидає
 * потяг назад, а серія без промахів — ще далі. Промах по неактивному стику
 * марнує час. Цифри 1–6 обирають стик із клавіатури.
 */
export const RailSabotage: React.FC<RailSabotageProps> = ({ target, seconds, onFinish }) => {
  const [phase, setPhase] = useState<'ready' | 'play' | 'won' | 'lost'>('ready');
  const [bolts, setBolts] = useState(0);
  const [turns, setTurns] = useState(0);
  const [active, setActive] = useState(() => Math.floor(Math.random() * JOINTS));
  const [trainPos, setTrainPos] = useState(0); // 0..100, 100 = доїхав
  const [combo, setCombo] = useState(0);
  const [miss, setMiss] = useState<number | null>(null);
  const [pop, setPop] = useState<number | null>(null);
  const finished = useRef(false);
  const later = useTimers();

  useEffect(() => {
    if (phase !== 'play') return;
    const tick = setInterval(() => setTrainPos((p) => Math.min(100, p + 100 / (seconds * 10))), 100);
    return () => clearInterval(tick);
  }, [phase, seconds]);

  useEffect(() => {
    if (phase !== 'play' || finished.current) return;
    if (bolts >= target) {
      finished.current = true;
      setPhase('won');
      sound.playFanfare();
      later(() => onFinish(true), 1500);
    } else if (trainPos >= 100) {
      finished.current = true;
      setPhase('lost');
      sound.playTrain();
      later(() => onFinish(false), 1800);
    }
  }, [bolts, trainPos, target, phase, onFinish]); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = (i: number) => {
    if (phase !== 'play') return;
    if (i !== active) {
      sound.playThud();
      setCombo(0);
      setMiss(i);
      later(() => setMiss(null), 300);
      setTrainPos((p) => Math.min(100, p + 1.5));
      return;
    }
    const t = turns + 1;
    sound.playRatchet(t);
    if (t < TURNS) {
      setTurns(t);
      return;
    }
    // Гайку відкручено!
    const c = combo + 1;
    setCombo(c);
    setBolts((b) => b + 1);
    setTurns(0);
    setPop(i);
    later(() => setPop(null), 400);
    setTrainPos((p) => Math.max(0, p - (3 + Math.min(4, c))));
    let next = Math.floor(Math.random() * JOINTS);
    if (next === i) next = (next + 1 + Math.floor(Math.random() * (JOINTS - 1))) % JOINTS;
    setActive(next);
  };

  const start = () => {
    finished.current = false;
    setBolts(0);
    setTurns(0);
    setCombo(0);
    setTrainPos(0);
    setPhase('play');
    sound.playTrain();
  };

  useGameKeys((e) => {
    if (e.key === ' ' && phase === 'ready') {
      e.preventDefault();
      start();
    } else {
      const n = Number(e.key);
      if (n >= 1 && n <= JOINTS) hit(n - 1);
    }
  });

  const trainLeft = Math.round(trainPos / 2.5) * 2.5 * 0.72;

  return (
    <div className="space-y-4">
      <div className="relative h-48 overflow-hidden border-4 border-stone-950 bg-gradient-to-b from-indigo-950 via-slate-800 to-slate-600 sm:h-52">
        <div className="snow-layer pointer-events-none absolute inset-0" />
        {/* Далекий ліс */}
        <div className="absolute inset-x-0 bottom-16 flex items-end opacity-70" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <PixelSprite key={i} id="pineSnow" size={i % 3 ? 30 : 40} />
          ))}
        </div>
        {/* Насип, шпали й рейки */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-slate-300 shadow-[inset_0_4px_0_#e2e8f0]" />
        <div className="absolute inset-x-0 bottom-9 flex justify-between px-1" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => (
            <span key={i} className="h-3 w-2 bg-amber-900" />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-12 h-1 bg-stone-700 shadow-[0_1px_0_#a8a29e]" />
        <div className="absolute inset-x-0 bottom-9 h-1 bg-stone-700 shadow-[0_1px_0_#a8a29e]" />
        {/* Станція */}
        <div className="absolute bottom-12 right-1 flex h-16 w-14 flex-col items-center border-4 border-stone-950 bg-amber-800" aria-hidden>
          <span className="h-3 w-[calc(100%+12px)] -translate-y-3 bg-stone-950" />
          <span className="mt-1 h-4 w-4 bg-amber-300" />
        </div>
        <div className="absolute bottom-[7.5rem] right-0 bg-stone-950/90 px-1 font-pixel text-[7px] text-amber-200">СТАНЦІЯ</div>
        {/* Потяг з димом */}
        <div className="absolute bottom-10" style={{ left: `calc(${trainLeft}% - 20px)` }} aria-hidden>
          {phase === 'play' && (
            <span className="absolute -top-6 left-2 flex gap-1">
              <span className="animate-float h-3 w-3 bg-slate-300/80" />
              <span className="animate-float h-4 w-4 bg-slate-400/60" style={{ animationDelay: '0.3s' }} />
            </span>
          )}
          <PixelSprite id="loco" size={84} className={phase === 'play' ? 'px-bob' : ''} />
        </div>
        <div className="absolute left-2 right-2 top-2 flex justify-between font-pixel text-[9px] text-amber-200 sm:text-[10px]">
          <span>🔩 {bolts}/{target}</span>
          {combo >= 2 && phase === 'play' && <span className="px-pop text-yellow-300">СЕРІЯ ×{combo}</span>}
          <span>{Math.max(0, Math.round(100 - trainPos))}% до станції</span>
        </div>
        {phase === 'won' && <div className="px-pop absolute inset-0 flex items-center justify-center bg-emerald-950/70 text-xl font-bold text-emerald-100">Ешелон зупинено! 🎉</div>}
        {phase === 'lost' && <div className="px-pop absolute inset-0 flex items-center justify-center bg-rose-950/70 p-3 text-center text-lg font-bold text-rose-100">Потяг прорвався… Але герої не здаються!</div>}
      </div>

      {/* Стики рейок з гайками */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: JOINTS }).map((_, i) => {
          const isActive = phase === 'play' && i === active;
          return (
            <button
              key={i}
              type="button"
              onClick={() => hit(i)}
              disabled={phase !== 'play'}
              aria-label={isActive ? `Відкрутити гайку (${TURNS - turns} оберти)` : `Стик ${i + 1}`}
              className={`relative flex h-16 flex-col items-center justify-center border-2 sm:h-20 ${
                miss === i ? 'animate-shake border-rose-500 bg-rose-950/50' : isActive ? 'border-amber-300 bg-amber-700' : 'border-stone-700 bg-stone-800'
              }`}
            >
              <span className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-stone-500" aria-hidden />
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center border-2 border-stone-950 ${isActive ? 'bg-yellow-300' : 'bg-stone-400'}`}
                style={{ transform: `rotate(${isActive ? turns * 30 : 0}deg)` }}
                aria-hidden
              >
                <span className="h-2 w-2 bg-stone-950" />
              </span>
              {isActive && (
                <span className="absolute -right-1 -top-2 z-20" style={{ transform: `rotate(${turns * 40 - 30}deg)` }} aria-hidden>
                  <PixelSprite id="wrench" size={28} />
                </span>
              )}
              {pop === i && <span className="px-rise absolute -top-2 font-pixel text-[9px] text-yellow-200">+1</span>}
              <span className="absolute bottom-0.5 font-pixel text-[7px] text-stone-400">{i + 1}</span>
              {isActive && (
                <span className="absolute bottom-0.5 right-1 flex gap-0.5">
                  {Array.from({ length: TURNS }).map((__, k) => (
                    <span key={k} className={`h-1.5 w-1.5 ${k < turns ? 'bg-emerald-300' : 'bg-stone-950'}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 text-center">
        {phase === 'ready' && (
          <>
            <p className="text-sm text-stone-300">
              Відкрути <strong>{target}</strong> гайок, поки потяг не доїхав (≈{seconds} с). Кожна гайка — {TURNS} оберти ключем: тисни на жовтий стик (або його цифру 1–6).
            </p>
            <button type="button" onClick={start} autoFocus className="pixel-btn border-2 border-amber-400 bg-amber-500 px-6 py-3 font-bold text-stone-950 hover:bg-amber-400">
              🔧 Почали! (пробіл)
            </button>
          </>
        )}
      </div>
    </div>
  );
};
