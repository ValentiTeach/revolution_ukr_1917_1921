/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, shuffle } from './shared';

const MAX_MISTAKES = 3;

/** «Розклади по місцях»: кожну річ — у правильну скриньку. */
export const SortingGame: React.FC<StationGameProps & { items: { item: string; target: string }[]; targets: string[] }> = ({
  items,
  targets,
  onFinish,
}) => {
  const [queue] = useState(() => shuffle(items));
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string[]>>({});
  const [done, setDone] = useState(false);

  const current = queue[index];

  const choose = (target: string) => {
    if (done || !current) return;
    if (target === current.target) {
      sound.playBlip(700);
      setPlaced((p) => ({ ...p, [target]: [...(p[target] ?? []), current.item] }));
      if (index + 1 >= queue.length) {
        setDone(true);
        sound.playFanfare();
        setTimeout(() => onFinish(true), 1000);
      }
      setIndex(index + 1);
    } else {
      sound.playWrong();
      setWrong(target);
      setTimeout(() => setWrong(null), 400);
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= MAX_MISTAKES) {
        setDone(true);
        setTimeout(() => onFinish(false), 900);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Розкладено: <strong className="text-amber-300">{Math.min(index, queue.length)}</strong> / {queue.length}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>

      <div className="flex min-h-[72px] items-center justify-center">
        <AnimatePresence mode="wait">
          {current && !done && (
            <motion.div
              key={current.item}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="border-2 border-amber-500 bg-stone-800 px-4 py-3 text-center text-base font-semibold text-stone-100"
            >
              {current.item}
            </motion.div>
          )}
          {done && mistakes < MAX_MISTAKES && <p className="font-bold text-emerald-300">Усе на своїх місцях! 🎉</p>}
          {done && mistakes >= MAX_MISTAKES && <p className="text-rose-300">Забагато плутанини…</p>}
        </AnimatePresence>
      </div>

      <div className={`grid gap-2 grid-cols-2`}>
        {targets.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => choose(t)}
            disabled={done}
            className={`pixel-btn flex min-h-[84px] flex-col items-center justify-start gap-1 border-2 p-2 text-sm font-bold ${
              wrong === t ? 'border-rose-500 bg-rose-950/50 animate-shake' : 'border-sky-700 bg-sky-950 hover:border-amber-400'
            }`}
          >
            <span>📥 {t}</span>
            <span className="flex flex-wrap justify-center gap-1 text-lg font-normal">
              {(placed[t] ?? []).map((p) => (
                <span key={p} title={p}>
                  {/^\p{L}/u.test(p) ? '✔' : p.split(' ')[0]}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
