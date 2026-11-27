/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { MistakeMeter, StationGameProps, shuffle, useTimers } from './shared';

const COLORS = [
  { id: 'blue', hex: '#3b82f6', name: 'синій', mark: '■' },
  { id: 'yellow', hex: '#facc15', name: 'жовтий', mark: '▲' },
  { id: 'red', hex: '#ef4444', name: 'червоний', mark: '●' },
  { id: 'green', hex: '#22c55e', name: 'зелений', mark: '◆' },
  { id: 'purple', hex: '#a855f7', name: 'фіолетовий', mark: '★' },
  { id: 'white', hex: '#f5f5f4', name: 'білий', mark: '✚' },
];

const MAX_MISTAKES = 3;

/**
 * «Полагодь дроти» (як генератори у Forsaken): протягни дріт від клеми
 * ліворуч до клеми того ж кольору й знака праворуч. Можна тягнути пальцем
 * або натиснути одну клему, потім другу. Коли все зʼєднано — лампа загоряється.
 */
export const WiresGame: React.FC<StationGameProps & { wires: number }> = ({ wires, onFinish }) => {
  const colors = useMemo(() => COLORS.slice(0, Math.min(wires, COLORS.length)), [wires]);
  const [left] = useState(() => shuffle(colors));
  const [right] = useState(() => {
    let r = shuffle(colors);
    if (r.every((c, i) => c.id === left[i].id) && r.length > 1) r = [...r.slice(1), r[0]];
    return r;
  });
  const [picked, setPicked] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [spark, setSpark] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const later = useTimers();

  const n = colors.length;
  const rowY = (i: number) => ((i + 0.5) / n) * 100;

  const connect = (leftId: string, rightId: string) => {
    if (done || links.includes(leftId)) return;
    if (leftId === rightId) {
      sound.playRatchet(links.length);
      setSpark(rightId);
      later(() => setSpark(null), 350);
      const next = [...links, leftId];
      setLinks(next);
      setPicked(null);
      if (next.length === n) {
        setDone(true);
        sound.playFanfare();
        later(() => onFinish(true), 1100);
      }
    } else {
      sound.playThud();
      setFlash(rightId);
      later(() => setFlash(null), 380);
      const m = mistakes + 1;
      setMistakes(m);
      setPicked(null);
      if (m >= MAX_MISTAKES) {
        setDone(true);
        later(() => onFinish(false), 900);
      }
    }
  };

  // Перетягування: тягнемо від лівої клеми, відпускаємо над правою
  const toLocal = (e: React.PointerEvent | PointerEvent) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
  };

  const startDrag = (id: string, e: React.PointerEvent) => {
    if (done || links.includes(id)) return;
    e.preventDefault();
    sound.playBlip(500);
    setPicked(id);
    setPointer(toLocal(e));
    const move = (ev: PointerEvent) => setPointer(toLocal(ev));
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setPointer(null);
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const target = el?.closest('[data-wire-right]') as HTMLElement | null;
      if (target?.dataset.wireRight) connect(id, target.dataset.wireRight);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const pickedIdx = picked ? left.findIndex((c) => c.id === picked) : -1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-stone-300">
        <span>
          Зʼєднано: <strong className="text-amber-300">{links.length}</strong> / {n}
        </span>
        <MistakeMeter mistakes={mistakes} max={MAX_MISTAKES} label="Іскри" />
      </div>
      <p className="text-xs text-stone-400">Тягни дріт від клеми ліворуч до клеми з тим самим кольором і знаком праворуч.</p>

      <div className="border-4 border-stone-950 bg-gradient-to-b from-stone-700 to-stone-800 p-2 shadow-[inset_4px_4px_0_rgba(255,255,255,0.08)]">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="font-pixel text-[8px] text-stone-300">РОЗПОДІЛЬЧА КОРОБКА</span>
          <span
            className={`h-5 w-5 border-2 border-stone-950 ${done && links.length === n ? 'bg-yellow-300 shadow-[0_0_0_2px_#fde047,0_0_0_4px_rgba(253,224,71,0.35)]' : 'bg-stone-900'}`}
            aria-label={done && links.length === n ? 'Лампа світить' : 'Лампа не світить'}
          />
        </div>
        <div ref={boardRef} className="relative grid grid-cols-[auto_1fr_auto] bg-stone-950 p-3" style={{ minHeight: n * 52 }}>
          <div className="z-10 flex flex-col justify-around gap-2">
            {left.map((c) => {
              const linked = links.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={linked || done}
                  onPointerDown={(e) => startDrag(c.id, e)}
                  onClick={() => !linked && setPicked(c.id)}
                  aria-label={`Дріт ${c.name} ліворуч`}
                  className={`flex h-10 w-14 touch-none items-center justify-center border-2 font-bold text-stone-950 ${picked === c.id ? 'border-white -translate-x-1' : 'border-stone-950'}`}
                  style={{ backgroundColor: c.hex, opacity: linked ? 0.55 : 1, boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.35)' }}
                >
                  {c.mark}
                </button>
              );
            })}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none h-full w-full" aria-hidden>
            {left.map((c, i) =>
              links.includes(c.id) ? (
                <polyline
                  key={c.id}
                  points={`0,${rowY(i)} 30,${rowY(i)} 70,${rowY(right.findIndex((r) => r.id === c.id))} 100,${rowY(right.findIndex((r) => r.id === c.id))}`}
                  fill="none"
                  stroke={c.hex}
                  strokeWidth="5"
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
            )}
            {pointer && pickedIdx >= 0 && (
              <polyline
                points={`0,${rowY(pickedIdx)} ${Math.max(0, pointer.x - 14)},${rowY(pickedIdx)} ${Math.max(0, pointer.x - 10)},${pointer.y}`}
                fill="none"
                stroke={left[pickedIdx].hex}
                strokeWidth="5"
                strokeDasharray="6 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <div className="z-10 flex flex-col justify-around gap-2">
            {right.map((c) => (
              <button
                key={c.id}
                type="button"
                data-wire-right={c.id}
                disabled={links.includes(c.id) || done}
                onClick={() => picked && connect(picked, c.id)}
                aria-label={`Дріт ${c.name} праворуч`}
                className={`relative flex h-10 w-14 items-center justify-center border-2 font-bold text-stone-950 ${flash === c.id ? 'border-rose-500 animate-shake' : 'border-stone-950'}`}
                style={{ backgroundColor: c.hex, opacity: links.includes(c.id) ? 0.55 : 1, boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.35)' }}
              >
                {c.mark}
                {spark === c.id && <span className="px-pop absolute -left-3 text-lg text-yellow-200">✦</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      {done && links.length === n && <p className="text-center font-bold text-emerald-300">⚡ Струм пішов! Лінія працює.</p>}
      {done && links.length < n && <p className="text-center text-rose-300">Забагато іскор — запобіжник згорів…</p>}
    </div>
  );
};
