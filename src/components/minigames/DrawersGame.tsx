/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { sound } from '../../game/sound';
import { StationGameProps, useTimers } from './shared';
import { PixelEmoji } from '../PixelEmoji';

const JUNK = ['🧦', '📎', '🪶', '🕯️', '🧵', '🪙', '🗝️', '📮', '🧽', '🥄', '🍂', '🕸️', '📰', '🧷'];

/**
 * «Знайди річ» (як пошук ключа в DOORS): відкривай шухляди.
 * Порожня шухляда підказує, наскільки близько схованка: «гаряче / тепло / холодно».
 * Нове: деякі шухляди заїдають (треба смикнути двічі), а ліхтарик
 * один раз підсвічує «тепло» сусідніх шухляд.
 */
export const DrawersGame: React.FC<StationGameProps & { drawers: number; item: string }> = ({ drawers, item, onFinish }) => {
  const cols = drawers <= 9 ? 3 : 4;
  const [target] = useState(() => Math.floor(Math.random() * drawers));
  const [stuck] = useState(() => new Set(Array.from({ length: Math.floor(drawers / 4) }, () => Math.floor(Math.random() * drawers))));
  const [tugged, setTugged] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState<number[]>([]);
  const [glow, setGlow] = useState<number[]>([]);
  const [lampUsed, setLampUsed] = useState(false);
  const [lampMode, setLampMode] = useState(false);
  const [done, setDone] = useState<'won' | 'lost' | null>(null);
  const [rattle, setRattle] = useState<number | null>(null);
  const later = useTimers();
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
    if (d === 0) return { emoji: '✨', text: 'Тут!', cls: 'text-yellow-200', bg: 'bg-yellow-400/40' };
    if (d === 1) return { emoji: '🔥', text: 'Гаряче!', cls: 'text-rose-300', bg: 'bg-rose-500/35' };
    if (d === 2) return { emoji: '♨️', text: 'Тепло', cls: 'text-amber-300', bg: 'bg-amber-500/25' };
    return { emoji: '❄️', text: 'Холодно', cls: 'text-sky-300', bg: 'bg-sky-500/20' };
  };

  const shine = (i: number) => {
    // Ліхтарик освітлює шухляду та її сусідів — видно, де тепліше
    const x = i % cols;
    const y = Math.floor(i / cols);
    const lit = Array.from({ length: drawers }, (_, k) => k).filter((k) => Math.abs((k % cols) - x) + Math.abs(Math.floor(k / cols) - y) <= 1);
    setGlow(lit);
    setLampUsed(true);
    setLampMode(false);
    sound.playCoo();
    later(() => setGlow([]), 2600);
  };

  const open = (i: number) => {
    if (done || opened.includes(i)) return;
    if (lampMode) {
      shine(i);
      return;
    }
    if (stuck.has(i) && !tugged.has(i)) {
      sound.playCrack();
      setTugged((s) => new Set(s).add(i));
      setRattle(i);
      later(() => setRattle(null), 320);
      return;
    }
    const next = [...opened, i];
    setOpened(next);
    if (i === target) {
      sound.playFanfare();
      setDone('won');
      later(() => onFinish(true), 1200);
      return;
    }
    const d = dist(i);
    sound.playBlip(d === 1 ? 760 : d === 2 ? 560 : 320);
    if (next.length >= maxTries) {
      sound.playWrong();
      setDone('lost');
      later(() => onFinish(false), 1400);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-stone-300">
        <span>
          Шукаємо: <strong className="text-amber-300">{item}</strong>
        </span>
        <span>
          Спроб: <strong className={triesLeft <= 2 ? 'text-rose-400' : 'text-stone-100'}>{Math.max(0, triesLeft)}</strong>
        </span>
      </div>
      <div className="border-4 border-stone-950 bg-gradient-to-b from-amber-950 to-stone-950 p-2">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: drawers }).map((_, i) => {
            const isOpen = opened.includes(i) || (done === 'lost' && i === target);
            const isTarget = i === target;
            const h = hint(i);
            const lit = glow.includes(i);
            return (
              <motion.button
                key={i}
                type="button"
                onClick={() => open(i)}
                disabled={!!done || opened.includes(i)}
                whileTap={{ scale: 0.95 }}
                aria-label={isOpen ? (isTarget ? item : h.text) : `Шухляда ${i + 1}`}
                className={`relative flex h-16 flex-col items-center justify-center border-2 sm:h-20 ${rattle === i ? 'animate-shake' : ''} ${
                  isOpen
                    ? isTarget
                      ? 'border-emerald-400 bg-emerald-950/70'
                      : 'border-stone-700 bg-stone-950 shadow-[inset_4px_4px_0_#000]'
                    : lampMode
                    ? 'border-sky-400 bg-gradient-to-b from-amber-800 to-amber-950'
                    : 'border-stone-950 bg-gradient-to-b from-amber-700 to-amber-900 shadow-[inset_3px_3px_0_rgba(255,255,255,0.15),inset_-3px_-3px_0_rgba(0,0,0,0.35)] hover:border-amber-400'
                }`}
              >
                {lit && !isOpen && <span className={`absolute inset-0 ${h.bg}`} aria-hidden />}
                {isOpen ? (
                  isTarget ? (
                    <PixelEmoji emoji={item.split(' ')[0]} size={44} className="px-pop" />
                  ) : (
                    <>
                      <PixelEmoji emoji={JUNK[i % JUNK.length]} size={24} res={12} />
                      <span className={`text-xs font-bold ${h.cls}`}>
                        {h.emoji} {h.text}
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <span className="h-2 w-8 bg-amber-300 shadow-[0_2px_0_#78350f]" aria-hidden />
                    {tugged.has(i) && <span className="mt-1 text-xs text-amber-200">ще раз!</span>}
                    {lit && <span className={`mt-1 text-xs font-bold ${h.cls}`}>{h.emoji}</span>}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            sound.playSelect();
            setLampMode((m) => !m);
          }}
          disabled={lampUsed || !!done}
          className={`pixel-btn border-2 px-3 py-2 text-xs font-bold disabled:opacity-40 ${lampMode ? 'border-yellow-300 bg-yellow-500 text-stone-950' : 'border-sky-500 bg-sky-800 text-white'}`}
        >
          🔦 {lampMode ? 'Тепер натисни шухляду' : lampUsed ? 'Ліхтарик згас' : 'Посвітити ліхтариком ×1'}
        </button>
        <p className="text-xs text-stone-500">🔥 — поруч, ♨️ — через одну, ❄️ — далеко. Деякі шухляди заїдають.</p>
      </div>
      {done === 'won' && <p className="text-center font-bold text-emerald-300">Знайдено! 🎉</p>}
      {done === 'lost' && <p className="text-center text-rose-300">Спроби скінчилися… Ось де воно було!</p>}
    </div>
  );
};
