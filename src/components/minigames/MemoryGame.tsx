/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { sound } from '../../game/sound';
import { PixelEmoji } from '../PixelEmoji';
import { pxEase } from '../../game/motion';

interface MemoryGameProps {
  pairs: { emoji: string; label: string }[];
  onFinish: (won: boolean) => void;
}

interface Card {
  key: number;
  pairId: number;
  emoji: string;
  label: string;
}

function buildDeck(pairs: MemoryGameProps['pairs']): Card[] {
  const deck: Card[] = [];
  pairs.forEach((p, idx) => {
    deck.push({ key: idx * 2, pairId: idx, ...p });
    deck.push({ key: idx * 2 + 1, pairId: idx, ...p });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const PEEK_MS = 1800;

/**
 * «Памʼять»: на початку всі картки на мить відкриваються — запамʼятовуй!
 * Пари поспіль дають серію, а за малу кількість ходів — три зірочки оцінки.
 */
export const MemoryGame: React.FC<MemoryGameProps> = ({ pairs, onFinish }) => {
  const [deck] = useState(() => buildDeck(pairs));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [peek, setPeek] = useState(true);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const t = setTimeout(() => setPeek(false), PEEK_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((k) => deck.find((c) => c.key === k)!);
    setMoves((m) => m + 1);
    if (a.pairId === b.pairId) {
      sound.playStar();
      setMatched((m) => [...m, a.pairId]);
      setLastFound(a.label);
      setStreak((s) => {
        setBestStreak((b2) => Math.max(b2, s + 1));
        return s + 1;
      });
      setOpen([]);
    } else {
      setStreak(0);
      const t = setTimeout(() => setOpen([]), 750);
      return () => clearTimeout(t);
    }
  }, [open, deck]);

  useEffect(() => {
    if (matched.length === pairs.length) {
      sound.playFanfare();
      const t = setTimeout(() => onFinishRef.current(true), 1400);
      return () => clearTimeout(t);
    }
  }, [matched, pairs.length]);

  const flip = (card: Card) => {
    if (peek || open.length >= 2 || open.includes(card.key) || matched.includes(card.pairId)) return;
    sound.playBlip(600);
    setOpen((o) => [...o, card.key]);
  };

  const rating = moves <= pairs.length + 2 ? 3 : moves <= pairs.length * 2 ? 2 : 1;
  const finished = matched.length === pairs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Знайдено пар: <strong className="text-amber-300">{matched.length}</strong> / {pairs.length}
        </span>
        {streak >= 2 && <span className="px-pop font-pixel text-[8px] text-yellow-300">СЕРІЯ ×{streak}</span>}
        <span>Ходів: {moves}</span>
      </div>

      {peek && <p className="px-blink text-center font-pixel text-[8px] text-amber-300">ЗАПАМʼЯТОВУЙ!</p>}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {deck.map((card) => {
          const isUp = peek || open.includes(card.key) || matched.includes(card.pairId);
          const isMatched = matched.includes(card.pairId);
          return (
            <motion.button
              key={card.key}
              type="button"
              onClick={() => flip(card)}
              aria-label={isUp ? card.label : 'Закрита картка'}
              whileTap={{ scale: 0.95 }}
              animate={{ rotateY: isUp ? 0 : 180 }}
              transition={{ duration: 0.24, ease: pxEase(3) }}
              className={`relative flex aspect-square flex-col items-center justify-center gap-1 border-2 p-1 ${
                isUp ? (isMatched ? 'border-emerald-500 bg-emerald-950/60' : 'border-amber-400 bg-stone-800') : 'border-stone-950 hover:border-amber-500'
              }`}
              style={
                isUp
                  ? undefined
                  : {
                      background: 'repeating-linear-gradient(45deg,#1e3a8a 0 6px,#1d4ed8 6px 12px)',
                      boxShadow: 'inset 3px 3px 0 rgba(255,255,255,0.2), inset -3px -3px 0 rgba(0,0,0,0.35)',
                    }
              }
            >
              {isUp ? (
                <>
                  <PixelEmoji emoji={card.emoji} size={44} className="px-pop" />
                  <span className="text-center text-xs leading-tight text-stone-200 sm:text-xs">{card.label}</span>
                </>
              ) : (
                <span className="flex h-9 w-9 items-center justify-center border-2 border-stone-950 bg-yellow-400 font-pixel text-[16px] text-blue-800">?</span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex min-h-[1.25rem] items-center justify-between text-xs text-stone-400">
        <span className="text-emerald-300">{lastFound && `Чудово: «${lastFound}»!`}</span>
        {finished && (
          <span className="text-amber-300" aria-label={`Оцінка: ${rating} з 3`}>
            {'★'.repeat(rating)}
            {'☆'.repeat(3 - rating)} · найдовша серія {bestStreak}
          </span>
        )}
      </div>
    </div>
  );
};
