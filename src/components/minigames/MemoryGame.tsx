/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { sound } from '../../game/sound';

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

/** Гра «Памʼять»: знайди пари однакових карток. */
export const MemoryGame: React.FC<MemoryGameProps> = ({ pairs, onFinish }) => {
  const [deck] = useState(() => buildDeck(pairs));
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((k) => deck.find((c) => c.key === k)!);
    setMoves((m) => m + 1);
    if (a.pairId === b.pairId) {
      sound.playStar();
      setMatched((m) => [...m, a.pairId]);
      setLastFound(a.label);
      setOpen([]);
    } else {
      const t = setTimeout(() => setOpen([]), 750);
      return () => clearTimeout(t);
    }
  }, [open, deck]);

  useEffect(() => {
    if (matched.length === pairs.length) {
      sound.playFanfare();
      const t = setTimeout(() => onFinishRef.current(true), 1000);
      return () => clearTimeout(t);
    }
  }, [matched, pairs.length]);

  const flip = (card: Card) => {
    if (open.length >= 2 || open.includes(card.key) || matched.includes(card.pairId)) return;
    sound.playBlip(600);
    setOpen((o) => [...o, card.key]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Знайдено пар: <strong className="text-amber-300">{matched.length}</strong> / {pairs.length}
        </span>
        <span>Ходів: {moves}</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
        {deck.map((card) => {
          const isUp = open.includes(card.key) || matched.includes(card.pairId);
          const isMatched = matched.includes(card.pairId);
          return (
            <motion.button
              key={card.key}
              type="button"
              onClick={() => flip(card)}
              aria-label={isUp ? card.label : 'Закрита картка'}
              whileTap={{ scale: 0.95 }}
              animate={{ rotateY: isUp ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className={`relative aspect-square border-2 flex flex-col items-center justify-center gap-1 p-1 ${
                isUp
                  ? isMatched
                    ? 'border-emerald-500 bg-emerald-950/60'
                    : 'border-amber-400 bg-stone-800'
                  : 'border-sky-800 bg-sky-950 hover:border-amber-500'
              }`}
            >
              {isUp ? (
                <>
                  <span className="text-3xl sm:text-4xl">{card.emoji}</span>
                  <span className="text-[10px] sm:text-xs text-center leading-tight text-stone-200">{card.label}</span>
                </>
              ) : (
                <span className="text-2xl text-amber-400/70">🔱</span>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-stone-400 min-h-[1.25rem]">
        <span className="text-emerald-300">{lastFound && `Чудово: «${lastFound}»!`}</span>
        <button type="button" onClick={() => onFinish(false)} className="underline hover:text-stone-200">
          Пропустити
        </button>
      </div>
    </div>
  );
};
