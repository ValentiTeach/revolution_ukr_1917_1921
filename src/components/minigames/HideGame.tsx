/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sound } from '../../game/sound';
import { StationGameProps } from './shared';

type Phase = 'calm' | 'warning' | 'passing';

const WARNING_MS = 1600;
const PASSING_MS = 1800;
const WORK_COOLDOWN_MS = 450;

/**
 * «Сховайся!» (як Rush у DOORS): виконуй роботу, але щойно чуєш кроки —
 * ховайся. Якщо патруль пройде, а ти не схований — тебе помітили.
 */
export const HideGame: React.FC<StationGameProps & { work: number; patrols: number; place: string }> = ({
  work,
  patrols,
  place,
  onFinish,
}) => {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [phase, setPhase] = useState<Phase>('calm');
  const [cooling, setCooling] = useState(false);
  const [result, setResult] = useState<'won' | 'caught' | null>(null);
  const triggered = useRef<Set<number>>(new Set());
  const hiddenRef = useRef(false);
  const pendingPatrol = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Точки роботи, на яких зʼявиться патруль
  const patrolPoints = useRef<number[]>(
    Array.from({ length: patrols }, (_, i) => Math.max(1, Math.round(((i + 1) * work) / (patrols + 1)))),
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const startPatrol = () => {
    pendingPatrol.current = true;
    setPhase('warning');
    sound.playAlarm();
    later(() => {
      setPhase('passing');
      sound.playMarch();
      if (!hiddenRef.current) {
        setResult('caught');
        sound.playWrong();
        later(() => onFinish(false), 1300);
        return;
      }
      later(() => {
        pendingPatrol.current = false;
        setPhase('calm');
      }, PASSING_MS);
    }, WARNING_MS);
  };

  const doWork = () => {
    if (hidden || cooling || result || phase === 'passing') return;
    sound.playBlip(480 + progress * 20);
    const p = progress + 1;
    setProgress(p);
    setCooling(true);
    later(() => setCooling(false), WORK_COOLDOWN_MS);
    patrolPoints.current.forEach((point, idx) => {
      if (p === point && !triggered.current.has(idx)) {
        triggered.current.add(idx);
        pendingPatrol.current = true;
        later(startPatrol, 200 + Math.random() * 700);
      }
    });
  };

  // Якщо роботу завершено під час патруля — перемога після того, як він пройде
  useEffect(() => {
    if (
      !result &&
      progress >= work &&
      phase === 'calm' &&
      !pendingPatrol.current &&
      triggered.current.size >= patrolPoints.current.length
    ) {
      setResult('won');
      sound.playFanfare();
      later(() => onFinish(true), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, progress]);

  const toggleHide = () => {
    if (result) return;
    sound.playBlip(hidden ? 520 : 300);
    hiddenRef.current = !hidden;
    setHidden(!hidden);
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative h-44 overflow-hidden border-2 ${
          phase === 'warning' ? 'border-amber-400' : phase === 'passing' ? 'border-rose-500' : 'border-stone-700'
        } bg-gradient-to-b from-slate-950 to-stone-900`}
      >
        <div className="absolute left-3 top-2 text-xs text-stone-400">{place}</div>
        <div className="absolute right-3 top-2 text-xs text-stone-400">
          👣 {triggered.current.size}/{patrols}
        </div>

        {/* Схованка */}
        <div className="absolute bottom-3 left-6 text-5xl" aria-hidden>
          {hidden ? '🛢️' : '🧺'}
        </div>
        {/* Джура */}
        <motion.div
          className="absolute bottom-3 text-4xl"
          animate={{ left: hidden ? '6%' : '38%', opacity: hidden ? 0.15 : 1 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          🧒
        </motion.div>

        <AnimatePresence>
          {phase === 'warning' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-8 text-center text-lg font-bold text-amber-300"
            >
              👣 Чути кроки… ХОВАЙСЯ!
            </motion.div>
          )}
          {phase === 'passing' && (
            <motion.div
              initial={{ left: '110%' }}
              animate={{ left: '-30%' }}
              transition={{ duration: PASSING_MS / 1000, ease: 'linear' }}
              className="absolute bottom-3 text-5xl"
              aria-hidden
            >
              🕵️🔦
            </motion.div>
          )}
        </AnimatePresence>

        {result === 'caught' && (
          <div className="absolute inset-0 flex items-center justify-center bg-rose-950/70 text-xl font-bold text-rose-100">
            Тебе помітили! 😱
          </div>
        )}
        {result === 'won' && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/70 text-xl font-bold text-emerald-100">
            Непомітно! Завдання виконано 🎉
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-stone-400 mb-1">
          <span>Прогрес</span>
          <span>
            {Math.min(progress, work)}/{work}
          </span>
        </div>
        <div className="h-3 border border-stone-700 bg-stone-900">
          <div className="h-full bg-amber-500 transition-all" style={{ width: `${(Math.min(progress, work) / work) * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={doWork}
          disabled={hidden || cooling || !!result || phase === 'passing'}
          className="pixel-btn border-2 border-amber-400 bg-amber-500 py-3 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
        >
          ✋ Працювати
        </button>
        <button
          type="button"
          onClick={toggleHide}
          disabled={!!result}
          className={`pixel-btn border-2 py-3 font-bold ${
            hidden ? 'border-sky-300 bg-sky-600 text-white' : 'border-stone-500 bg-stone-800 text-stone-100 hover:border-sky-400'
          }`}
        >
          {hidden ? '🙈 Вийти зі схованки' : '🛢️ Сховатися'}
        </button>
      </div>
      <p className="text-xs text-stone-500 text-center">Коли зʼявиться «Чути кроки» — ховайся. Коли патруль пройде — виходь і працюй далі.</p>
    </div>
  );
};
