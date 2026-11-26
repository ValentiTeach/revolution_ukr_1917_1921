/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sound } from '../../game/sound';
import { StationGameProps, useGameKeys } from './shared';
import { PixelSprite } from '../PixelSprite';
import { pxEase } from '../../game/motion';

type Phase = 'calm' | 'warning' | 'passing' | 'fakeout';

const WARNING_MS = 1500;
const PASSING_MS = 1700;
const WORK_COOLDOWN_MS = 380;
/** Скільки секунд можна сидіти в схованці, затамувавши подих. */
const BREATH_SECONDS = 5;

/**
 * «Сховайся!» (як Rush у DOORS): працюй, а почувши кроки — ховайся.
 * Нове: у схованці закінчується подих (не сиди там завжди), швидка робота
 * шумить і кличе патруль раніше, а інколи кроки стихають — це хибна тривога,
 * і патруль приходить знову за мить. Пробіл — працювати, H або Shift — ховатися.
 */
export const HideGame: React.FC<StationGameProps & { work: number; patrols: number; place: string }> = ({ work, patrols, place, onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [phase, setPhase] = useState<Phase>('calm');
  const [cooling, setCooling] = useState(false);
  const [result, setResult] = useState<'won' | 'caught' | 'gasp' | null>(null);
  const [breath, setBreath] = useState(BREATH_SECONDS);
  const [noise, setNoise] = useState(0);
  const triggered = useRef<Set<number>>(new Set());
  const hiddenRef = useRef(false);
  const pendingPatrol = useRef(false);
  const lastWork = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fakeoutUsed = useRef(false);
  const breathRef = useRef(BREATH_SECONDS);
  breathRef.current = breath;

  // Точки роботи, на яких зʼявиться патруль
  const patrolPoints = useRef<number[]>(Array.from({ length: patrols }, (_, i) => Math.max(1, Math.round(((i + 1) * work) / (patrols + 1)))));

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  // Подих у схованці та шум, що поволі стихає
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => {
      setNoise((n) => Math.max(0, n - 4));
      if (hiddenRef.current) {
        setBreath((b) => {
          const nb = Math.max(0, +(b - 0.1).toFixed(2));
          if (nb <= 0) {
            // Подих скінчився — доводиться вийти
            hiddenRef.current = false;
            setHidden(false);
            sound.playBlip(260);
          }
          return nb;
        });
      } else {
        setBreath((b) => Math.min(BREATH_SECONDS, b + 0.15));
      }
    }, 100);
    return () => clearInterval(id);
  }, [result]);

  const patrolPasses = () => {
    setPhase('passing');
    sound.playMarch();
    if (!hiddenRef.current) {
      setResult(breathRef.current <= 0.3 ? 'gasp' : 'caught');
      sound.playWrong();
      later(() => onFinish(false), 1400);
      return;
    }
    later(() => {
      pendingPatrol.current = false;
      setPhase('calm');
    }, PASSING_MS);
  };

  const startPatrol = () => {
    pendingPatrol.current = true;
    setPhase('warning');
    sound.playAlarm();
    // Одного разу кроки стихають… і повертаються (як Ambush у DOORS)
    const fake = patrols >= 2 && !fakeoutUsed.current && Math.random() < 0.6;
    if (fake) {
      fakeoutUsed.current = true;
      later(() => setPhase('fakeout'), WARNING_MS);
      later(() => {
        setPhase('warning');
        sound.playAlarm();
      }, WARNING_MS + 1100);
      later(patrolPasses, WARNING_MS * 2 + 900);
      return;
    }
    later(patrolPasses, WARNING_MS);
  };

  const triggerPatrolAt = (p: number) => {
    patrolPoints.current.forEach((point, idx) => {
      if (p >= point && !triggered.current.has(idx)) {
        triggered.current.add(idx);
        pendingPatrol.current = true;
        later(startPatrol, 200 + Math.random() * 700);
      }
    });
  };

  const doWork = () => {
    if (hidden || cooling || result || phase === 'passing') return;
    const now = performance.now();
    const fast = now - lastWork.current < 520;
    lastWork.current = now;
    sound.playBlip(480 + progress * 20);
    const p = progress + 1;
    setProgress(p);
    setCooling(true);
    later(() => setCooling(false), WORK_COOLDOWN_MS);
    // Швидка робота шумить — патруль може прийти раніше
    const nn = Math.min(100, noise + (fast ? 34 : 14));
    setNoise(nn);
    if (nn >= 100 && !pendingPatrol.current) {
      const nextIdx = patrolPoints.current.findIndex((_, i) => !triggered.current.has(i));
      if (nextIdx >= 0) {
        triggered.current.add(nextIdx);
        pendingPatrol.current = true;
        setNoise(40);
        later(startPatrol, 150);
        return;
      }
    }
    triggerPatrolAt(p);
  };

  // Перемога — коли роботу завершено й усі патрулі пройшли
  useEffect(() => {
    if (!result && progress >= work && phase === 'calm' && !pendingPatrol.current && triggered.current.size >= patrolPoints.current.length) {
      setResult('won');
      sound.playFanfare();
      later(() => onFinish(true), 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, progress]);

  const toggleHide = () => {
    if (result) return;
    if (!hidden && breath < 1) {
      sound.playWrong();
      return;
    }
    sound.playBlip(hidden ? 520 : 300);
    hiddenRef.current = !hidden;
    setHidden(!hidden);
  };

  useGameKeys((e) => {
    if (e.key === ' ') {
      e.preventDefault();
      doWork();
    } else if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р' || e.key === 'Shift' || e.key === 'Enter') {
      e.preventDefault();
      toggleHide();
    }
  });

  const danger = phase === 'warning' || phase === 'passing';

  return (
    <div className="space-y-4">
      <div
        className={`relative h-48 overflow-hidden border-4 ${danger ? 'border-amber-400' : phase === 'fakeout' ? 'border-sky-500' : 'border-stone-950'} bg-gradient-to-b from-slate-950 via-slate-900 to-stone-800`}
      >
        {/* Місяць і вікна */}
        <div className="absolute right-6 top-4 h-6 w-6 bg-amber-100 shadow-[0_0_0_3px_#fef3c7]" aria-hidden />
        <div className="absolute left-1/3 top-10 grid grid-cols-3 gap-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className={`h-4 w-3 ${i % 3 === 1 ? 'bg-amber-300/80' : 'bg-slate-700'}`} />
          ))}
        </div>
        <div className="absolute left-3 top-2 text-xs text-stone-400">{place}</div>
        <div className="absolute right-12 top-2 text-xs text-stone-400">
          👣 {triggered.current.size}/{patrols}
        </div>

        {/* Схованка: бочка */}
        <div className="absolute bottom-3 left-5 flex h-14 w-12 items-end justify-center border-4 border-stone-950 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900" aria-hidden>
          <span className="mb-3 block h-1 w-full bg-stone-950" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3 bg-stone-700 shadow-[inset_0_3px_0_#57534e]" />

        {/* Джура */}
        <motion.div
          className="absolute bottom-3"
          animate={{ left: hidden ? '6%' : '42%', opacity: hidden ? 0 : 1 }}
          transition={{ duration: 0.2, ease: pxEase(3) }}
          aria-hidden
        >
          <PixelSprite id="jura" size={52} className={hidden ? '' : 'px-bob'} />
        </motion.div>
        {hidden && <div className="absolute bottom-16 left-7 font-pixel text-[8px] text-sky-200">👀</div>}

        <AnimatePresence>
          {phase === 'warning' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-blink absolute inset-x-0 top-9 text-center font-pixel text-[8px] text-amber-300 sm:text-[16px]">
              👣 Чути кроки… ХОВАЙСЯ!
            </motion.div>
          )}
          {phase === 'fakeout' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-0 top-9 text-center font-pixel text-[8px] text-sky-300">
              …тиша. Пішов? Не поспішай!
            </motion.div>
          )}
          {phase === 'passing' && (
            <motion.div
              initial={{ left: '105%' }}
              animate={{ left: '-25%' }}
              transition={{ duration: PASSING_MS / 1000, ease: pxEase(18) }}
              className="absolute bottom-3 flex items-end"
              aria-hidden
            >
              {/* Промінь ліхтаря */}
              <span className="mb-4 h-10 w-24 bg-gradient-to-l from-yellow-200/60 to-transparent [clip-path:polygon(100%_40%,0_0,0_100%,100%_60%)]" />
              <PixelSprite id="guard" size={58} flip className="px-bob" />
            </motion.div>
          )}
        </AnimatePresence>

        {result === 'caught' && <div className="absolute inset-0 flex items-center justify-center bg-rose-950/75 text-xl font-bold text-rose-100">Тебе помітили! 😱</div>}
        {result === 'gasp' && <div className="absolute inset-0 flex items-center justify-center bg-rose-950/75 p-4 text-center text-lg font-bold text-rose-100">Забракло подиху — ти визирнув(-ла) в найгірший момент!</div>}
        {result === 'won' && <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/75 text-xl font-bold text-emerald-100">Непомітно! Завдання виконано 🎉</div>}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Meter label="Прогрес" value={Math.min(progress, work)} max={work} color="bg-amber-500" right={`${Math.min(progress, work)}/${work}`} />
        <Meter label="Шум" value={noise} max={100} color={noise > 70 ? 'bg-rose-500' : 'bg-stone-400'} right={noise > 70 ? 'гучно!' : ''} />
        <Meter label="Подих" value={breath} max={BREATH_SECONDS} color={breath < 1.5 ? 'bg-rose-500' : 'bg-sky-500'} right={hidden ? 'затамуй…' : ''} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={doWork}
          disabled={hidden || cooling || !!result || phase === 'passing'}
          className="pixel-btn border-2 border-amber-400 bg-amber-500 py-3 font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-40"
        >
          ✋ Працювати <span className="text-xs font-normal">(пробіл)</span>
        </button>
        <button
          type="button"
          onClick={toggleHide}
          disabled={!!result}
          className={`pixel-btn border-2 py-3 font-bold ${hidden ? 'border-sky-300 bg-sky-600 text-white' : 'border-stone-500 bg-stone-800 text-stone-100 hover:border-sky-400'}`}
        >
          {hidden ? '🙈 Вийти' : '🛢️ Сховатися'} <span className="text-xs font-normal">(H)</span>
        </button>
      </div>
      <p className="text-center text-xs text-stone-500">Ховайся, коли чуєш кроки, і виходь, щойно патруль мине: у бочці не вистачить подиху надовго. Не поспішай працювати — шум кличе патруль.</p>
    </div>
  );
};

const Meter: React.FC<{ label: string; value: number; max: number; color: string; right?: string }> = ({ label, value, max, color, right }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs text-stone-400">
      <span>{label}</span>
      <span>{right}</span>
    </div>
    <div className="px-bar h-3 overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  </div>
);
