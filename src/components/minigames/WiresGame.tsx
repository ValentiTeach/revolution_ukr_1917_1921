/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, shuffle } from './shared';

const COLORS = [
  { id: 'blue', hex: '#3b82f6', name: 'синій' },
  { id: 'yellow', hex: '#facc15', name: 'жовтий' },
  { id: 'red', hex: '#ef4444', name: 'червоний' },
  { id: 'green', hex: '#22c55e', name: 'зелений' },
  { id: 'purple', hex: '#a855f7', name: 'фіолетовий' },
  { id: 'white', hex: '#f5f5f4', name: 'білий' },
];

const MAX_MISTAKES = 3;

/** «Полагодь дроти» (як генератори у Forsaken): зʼєднай однакові кольори. */
export const WiresGame: React.FC<StationGameProps & { wires: number }> = ({ wires, onFinish }) => {
  const colors = useMemo(() => COLORS.slice(0, Math.min(wires, COLORS.length)), [wires]);
  const [right] = useState(() => {
    let r = shuffle(colors);
    if (r.every((c, i) => c.id === colors[i].id) && r.length > 1) r = [...r.slice(1), r[0]];
    return r;
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const n = colors.length;
  const y = (i: number) => ((i + 0.5) / n) * 100;

  const pickRight = (id: string) => {
    if (!picked || done || links.includes(id)) return;
    if (picked === id) {
      sound.playBlip(660);
      const next = [...links, id];
      setLinks(next);
      setPicked(null);
      if (next.length === n) {
        setDone(true);
        sound.playFanfare();
        setTimeout(() => onFinish(true), 900);
      }
    } else {
      sound.playWrong();
      setFlash(id);
      setTimeout(() => setFlash(null), 350);
      const m = mistakes + 1;
      setMistakes(m);
      setPicked(null);
      if (m >= MAX_MISTAKES) {
        setDone(true);
        setTimeout(() => onFinish(false), 700);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Зʼєднано: <strong className="text-amber-300">{links.length}</strong> / {n}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} />
      </div>
      <p className="text-xs text-stone-400">Натисни дріт ліворуч, потім — дріт того ж кольору праворуч.</p>
      <div className="relative grid grid-cols-[auto_1fr_auto] gap-0 border-2 border-stone-700 bg-stone-950 p-3" style={{ minHeight: n * 52 }}>
        <div className="flex flex-col justify-around gap-2">
          {colors.map((c) => {
            const linked = links.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={linked || done}
                onClick={() => {
                  sound.playBlip(500);
                  setPicked(c.id);
                }}
                aria-label={`Дріт ${c.name} ліворуч`}
                className={`h-10 w-14 border-2 ${picked === c.id ? 'border-white scale-110' : 'border-stone-600'} transition-transform`}
                style={{ backgroundColor: c.hex, opacity: linked ? 0.5 : 1 }}
              />
            );
          })}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden>
          {colors.map((c, i) =>
            links.includes(c.id) ? (
              <line
                key={c.id}
                x1="0"
                y1={y(i)}
                x2="100"
                y2={y(right.findIndex((r) => r.id === c.id))}
                stroke={c.hex}
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
            ) : null,
          )}
        </svg>
        <div className="flex flex-col justify-around gap-2">
          {right.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={links.includes(c.id) || done}
              onClick={() => pickRight(c.id)}
              aria-label={`Дріт ${c.name} праворуч`}
              className={`h-10 w-14 border-2 ${flash === c.id ? 'border-rose-500 animate-shake' : 'border-stone-600'}`}
              style={{ backgroundColor: c.hex, opacity: links.includes(c.id) ? 0.5 : 1 }}
            />
          ))}
        </div>
      </div>
      {done && links.length === n && <p className="text-center font-bold text-emerald-300">⚡ Струм пішов! Лінія працює.</p>}
    </div>
  );
};
