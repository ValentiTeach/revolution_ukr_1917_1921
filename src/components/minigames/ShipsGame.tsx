/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { sound } from '../../game/sound';
import { PixelEmoji } from '../PixelEmoji';
import { ResultOverlay, StationGameProps, TimeBar, shuffle, usePointerDrag, useTimers } from './shared';

interface Ship {
  name: string;
  capacity: number;
}
interface Group {
  label: string;
  emoji: string;
  size: number;
}

const GROUP_COLORS = ['#f59e0b', '#38bdf8', '#f472b6', '#4ade80', '#a78bfa', '#fb7185', '#facc15', '#2dd4bf', '#fdba74'];

/**
 * «Пароплави»: розсади всі групи людей так, щоб кожен корабель був заповнений
 * до краю. Групу не можна ділити. Тягни картку на корабель або натисни картку,
 * а потім корабель. Натисни групу на кораблі, щоб висадити її назад.
 */
export const ShipsGame: React.FC<StationGameProps & { ships: Ship[]; groups: Group[]; seconds?: number }> = ({
  ships,
  groups,
  seconds = 75,
  onFinish,
}) => {
  const [order] = useState(() => shuffle(groups.map((_, i) => i)));
  const [where, setWhere] = useState<(number | null)[]>(() => groups.map(() => null));
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [result, setResult] = useState<'won' | 'lost' | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const later = useTimers();

  const load = (s: number) => where.reduce<number>((acc, w, gi) => acc + (w === s ? groups[gi].size : 0), 0);

  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, +(t - 0.25).toFixed(2))), 250);
    return () => clearInterval(id);
  }, [result]);

  useEffect(() => {
    if (!result && timeLeft <= 0) {
      setResult('lost');
      sound.playWrong();
      later(() => onFinish(false), 1600);
    }
  }, [timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const put = (gi: number, s: number) => {
    if (result) return;
    const free = ships[s].capacity - load(s);
    if (groups[gi].size > free) {
      sound.playWrong();
      setFlash(s);
      later(() => setFlash(null), 400);
      return;
    }
    sound.playBlip(520 + s * 60);
    const next = [...where];
    next[gi] = s;
    setWhere(next);
    setSelected(null);
    // Корабель повний — гудок. Коли повні всі — флотилія відчалює.
    const loadOf = (ship: number) => next.reduce<number>((acc, w, i) => acc + (w === ship ? groups[i].size : 0), 0);
    if (loadOf(s) === ships[s].capacity) sound.playHorn();
    if (ships.every((sh, i) => loadOf(i) === sh.capacity)) {
      setResult('won');
      later(() => sound.playFanfare(), 500);
      later(() => onFinish(true), 1900);
    }
  };

  const unload = (gi: number) => {
    const s = where[gi];
    if (result || s === null) return;
    sound.playBlip(300);
    const next = [...where];
    next[gi] = null;
    setWhere(next);
  };

  const { drag, over, bind, dragging } = usePointerDrag(
    (id, drop) => {
      if (drop !== null && drop.startsWith('ship-')) put(Number(id), Number(drop.slice(5)));
    },
    (id) => {
      sound.playSelect();
      setSelected((cur) => (cur === Number(id) ? null : Number(id)));
    },
  );

  const waiting = order.filter((gi) => where[gi] === null);

  return (
    <div className="space-y-3">
      <TimeBar left={timeLeft} total={seconds} label="Червоні вже за Перекопом…" />

      <div
        className="relative overflow-hidden border-4 border-stone-950 p-2"
        style={{ background: 'linear-gradient(#3b1d2e 0%, #7c2d12 30%, #1e3a5f 31%, #0b1d3a 100%)' }}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {ships.map((ship, s) => {
            const l = load(s);
            const full = l === ship.capacity;
            const gone = result === 'won';
            const isOver = over === `ship-${s}`;
            const loaded = where.map((w, gi) => (w === s ? gi : -1)).filter((gi) => gi >= 0);
            return (
              <div
                key={ship.name}
                data-drop={`ship-${s}`}
                onClick={() => selected !== null && put(selected, s)}
                className={`relative min-h-[96px] border-2 p-2 transition-transform ${
                  flash === s
                    ? 'animate-shake border-rose-500'
                    : isOver
                    ? 'border-amber-300 bg-amber-900/30'
                    : full
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : selected !== null
                    ? 'border-sky-400/70'
                    : 'border-stone-900'
                } ${gone ? 'translate-x-6 opacity-60' : ''}`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-stone-100">
                  <span className="flex items-center gap-1">
                    <PixelEmoji emoji="🚢" size={28} className={gone ? '' : 'px-bob'} /> {ship.name}
                  </span>
                  <span className={`font-pixel text-[9px] ${l === ship.capacity ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {l}/{ship.capacity}
                  </span>
                </div>
                {/* Палуба: квадратик на кожну сотню місць */}
                <div className="mt-1 flex flex-wrap gap-0.5" aria-hidden>
                  {Array.from({ length: ship.capacity }).map((_, i) => {
                    let acc = 0;
                    let color: string | null = null;
                    for (const gi of loaded) {
                      if (i >= acc && i < acc + groups[gi].size) color = GROUP_COLORS[gi % GROUP_COLORS.length];
                      acc += groups[gi].size;
                    }
                    return <span key={i} className="h-4 w-4 border border-stone-950" style={{ background: color ?? '#1c1917' }} />;
                  })}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {loaded.map((gi) => (
                    <button
                      key={gi}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unload(gi);
                      }}
                      disabled={gone}
                      title={gone ? groups[gi].label : 'Висадити назад'}
                      className="flex items-center gap-1 border border-stone-950 px-1 text-[11px] text-stone-950"
                      style={{ background: GROUP_COLORS[gi % GROUP_COLORS.length] }}
                    >
                      {groups[gi].emoji} {groups[gi].size}
                    </button>
                  ))}
                </div>
                {full && <div className="absolute right-2 top-8 font-pixel text-[8px] text-emerald-300">{gone ? 'ВІДЧАЛИВ' : 'ГОТОВИЙ'} ⚓</div>}
              </div>
            );
          })}
        </div>
        <ResultOverlay result={result} won="Усі на борту! Кораблі виходять у море." lost="Не встигли… Частина людей лишилася на причалі." />
      </div>

      <div className="border-2 border-stone-700 bg-stone-900 p-2">
        <div className="mb-1 text-xs text-stone-400">
          На причалі (число — скільки сотень людей). {selected !== null ? 'Тепер натисни корабель.' : 'Тягни картку на корабель або натисни її.'}
        </div>
        <div className="flex min-h-[52px] flex-wrap gap-2">
          {waiting.map((gi) => (
            <div
              key={gi}
              {...bind(String(gi))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelected(gi)}
              className={`flex cursor-grab select-none items-center gap-2 border-2 px-2 py-1.5 text-sm font-semibold text-stone-950 shadow-[3px_3px_0_#0c0a09] ${
                selected === gi ? 'border-white -translate-y-1' : 'border-stone-950'
              } ${dragging && drag?.id === String(gi) ? 'opacity-40' : ''}`}
              style={{ background: GROUP_COLORS[gi % GROUP_COLORS.length], touchAction: 'none' }}
            >
              <PixelEmoji emoji={groups[gi].emoji} size={24} res={14} />
              <span>{groups[gi].label}</span>
              <span className="font-pixel text-[10px]">{groups[gi].size}</span>
            </div>
          ))}
          {waiting.length === 0 && !result && <span className="text-sm text-stone-500">Причал порожній.</span>}
        </div>
      </div>

      {dragging && drag && (
        <div
          className="pointer-events-none fixed z-[100] flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 border-2 border-white px-2 py-1 text-sm font-bold text-stone-950 shadow-[4px_4px_0_#000]"
          style={{ left: drag.x, top: drag.y, background: GROUP_COLORS[Number(drag.id) % GROUP_COLORS.length] }}
        >
          {groups[Number(drag.id)].emoji} {groups[Number(drag.id)].size}
        </div>
      )}
      <p className="text-xs text-stone-500">Порада: спершу розсади найбільші групи. Флотилія відчалить, коли кожен корабель буде заповнений до краю.</p>
    </div>
  );
};
