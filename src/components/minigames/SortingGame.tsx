/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, shuffle, usePointerDrag, useTimers } from './shared';

const MAX_MISTAKES = 3;

/**
 * «Розклади по місцях»: перетягни картку в правильну скриньку
 * (або натисни скриньку). Після кожної відповіді — коротке «чому».
 */
export const SortingGame: React.FC<StationGameProps & { items: { item: string; target: string; why?: string }[]; targets: string[] }> = ({
  items,
  targets,
  onFinish,
}) => {
  const [queue] = useState(() => shuffle(items));
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, string[]>>({});
  const [why, setWhy] = useState<{ ok: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const later = useTimers();

  const current = queue[index];

  const choose = (target: string) => {
    if (done || !current) return;
    if (target === current.target) {
      sound.playBlip(700);
      setPlaced((p) => ({ ...p, [target]: [...(p[target] ?? []), current.item] }));
      setWhy(current.why ? { ok: true, text: current.why } : null);
      if (index + 1 >= queue.length) {
        setDone(true);
        sound.playFanfare();
        later(() => onFinish(true), 1400);
      }
      setIndex(index + 1);
    } else {
      sound.playWrong();
      setWrong(target);
      later(() => setWrong(null), 400);
      setWhy({ ok: false, text: current.why ?? 'Подумай ще раз!' });
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= MAX_MISTAKES) {
        setDone(true);
        later(() => onFinish(false), 1300);
      }
    }
  };

  const { drag, over, bind, dragging } = usePointerDrag(
    (_id, drop) => drop && choose(drop),
    () => sound.playSelect(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Розкладено: <strong className="text-amber-300">{Math.min(index, queue.length)}</strong> / {queue.length}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>

      <div className="flex min-h-[76px] items-center justify-center">
        <AnimatePresence mode="wait">
          {current && !done && (
            <motion.div
              key={current.item}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              {...bind('card')}
              className={`cursor-grab select-none border-2 border-amber-400 bg-stone-800 px-4 py-3 text-center text-base font-semibold text-stone-100 shadow-[4px_4px_0_#0c0a09] ${dragging ? 'opacity-30' : ''}`}
              style={{ touchAction: 'none' }}
            >
              ✋ {current.item}
            </motion.div>
          )}
          {done && mistakes < MAX_MISTAKES && <p className="font-bold text-emerald-300">Усе на своїх місцях! 🎉</p>}
          {done && mistakes >= MAX_MISTAKES && <p className="text-rose-300">Забагато плутанини…</p>}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {targets.map((t) => (
          <button
            key={t}
            type="button"
            data-drop={t}
            onClick={() => choose(t)}
            disabled={done}
            className={`pixel-btn flex min-h-[92px] flex-col items-center justify-start gap-1 border-2 p-2 text-sm font-bold ${
              wrong === t ? 'animate-shake border-rose-500 bg-rose-950/50' : over === t ? 'border-amber-300 bg-amber-900/40' : 'border-sky-700 bg-sky-950 hover:border-amber-400'
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

      {why && (
        <p className={`border-l-4 p-2 text-sm ${why.ok ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100' : 'border-rose-500 bg-rose-950/40 text-rose-100'}`}>
          {why.ok ? '✔ ' : '✖ '}
          {why.text}
        </p>
      )}

      {dragging && drag && current && (
        <div
          className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 border-2 border-white bg-stone-800 px-3 py-2 text-sm font-semibold text-stone-100 shadow-[4px_4px_0_#000]"
          style={{ left: drag.x, top: drag.y }}
        >
          {current.item}
        </div>
      )}
      <p className="text-xs text-stone-500">Тягни картку у скриньку або просто натисни потрібну скриньку.</p>
    </div>
  );
};
