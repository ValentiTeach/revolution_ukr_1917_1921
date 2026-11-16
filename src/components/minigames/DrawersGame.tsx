/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { sound } from '../../game/sound';
import { StationGameProps } from './shared';

const JUNK = ['🧦', '📎', '🪶', '🕯️', '🧵', '🪙', '🗝️', '📮', '🧽', '🥄', '🍂', '🕸️'];

/**
 * «Знайди річ» (як пошук ключа в DOORS): відкривай шухляди.
 * Порожня шухляда підказує, наскільки близько схованка: «гаряче / тепло / холодно».
 */
export const DrawersGame: React.FC<StationGameProps & { drawers: number; item: string }> = ({ drawers, item, onFinish }) => {
  const cols = drawers <= 9 ? 3 : 4;
  const [target] = useState(() => Math.floor(Math.random() * drawers));
  const [opened, setOpened] = useState<number[]>([]);
  const [done, setDone] = useState<'won' | 'lost' | null>(null);
  const maxTries = drawers <= 9 ? 5 : drawers <= 12 ? 6 : 7;
  const triesLeft = maxTries - opened.length;

  const dist = (i: number) => {
    const ax = i % cols;
    const ay = Math.floor(i / cols);
    const bx = target % cols;
    const by = Math.floor(target / cols);
    return Math.abs(ax - bx) + Math.abs(ay - by);
  };

  const hint = (i: number) => {
    const d = dist(i);
    if (d === 1) return { emoji: '🔥', text: 'Гаряче!', cls: 'text-rose-300' };
    if (d === 2) return { emoji: '♨️', text: 'Тепло', cls: 'text-amber-300' };
    return { emoji: '❄️', text: 'Холодно', cls: 'text-sky-300' };
  };

  const open = (i: number) => {
    if (done || opened.includes(i)) return;
    const next = [...opened, i];
    setOpened(next);
    if (i === target) {
      sound.playFanfare();
      setDone('won');
      setTimeout(() => onFinish(true), 1100);
      return;
    }
    const d = dist(i);
    sound.playBlip(d === 1 ? 760 : d === 2 ? 560 : 320);
    if (next.length >= maxTries) {
      sound.playWrong();
      setDone('lost');
      setTimeout(() => onFinish(false), 1300);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Шукаємо: <strong className="text-amber-300">{item}</strong>
        </span>
        <span>
          Спроб: <strong className={triesLeft <= 2 ? 'text-rose-400' : 'text-stone-100'}>{Math.max(0, triesLeft)}</strong>
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: drawers }).map((_, i) => {
          const isOpen = opened.includes(i) || (done === 'lost' && i === target);
          const isTarget = i === target;
          const h = hint(i);
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => open(i)}
              disabled={!!done || opened.includes(i)}
              whileTap={{ scale: 0.95 }}
              aria-label={isOpen ? (isTarget ? item : h.text) : `Шухляда ${i + 1}`}
              className={`flex h-16 sm:h-20 flex-col items-center justify-center border-2 ${
                isOpen
                  ? isTarget
                    ? 'border-emerald-400 bg-emerald-950/70'
                    : 'border-stone-700 bg-stone-950'
                  : 'border-amber-900 bg-gradient-to-b from-amber-800 to-amber-950 hover:border-amber-500'
              }`}
            >
              {isOpen ? (
                isTarget ? (
                  <span className="text-3xl">{item.split(' ')[0]}</span>
                ) : (
                  <>
                    <span className="text-lg">{JUNK[i % JUNK.length]}</span>
                    <span className={`text-[11px] font-bold ${h.cls}`}>
                      {h.emoji} {h.text}
                    </span>
                  </>
                )
              ) : (
                <span className="h-1.5 w-6 rounded-full bg-amber-300/70" aria-hidden />
              )}
            </motion.button>
          );
        })}
      </div>
      {done === 'won' && <p className="text-center font-bold text-emerald-300">Знайдено! 🎉</p>}
      {done === 'lost' && <p className="text-center text-rose-300">Спроби скінчилися… Ось де воно було!</p>}
      <p className="text-xs text-stone-500">🔥 — поруч (одна шухляда), ♨️ — через одну, ❄️ — далеко.</p>
    </div>
  );
};
