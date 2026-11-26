/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { PixelEmoji } from '../PixelEmoji';

/** Спільні пропси для всіх міні-ігор доручень. */
export interface StationGameProps {
  onFinish: (won: boolean) => void;
}

/** Рядок «помилок» у вигляді хрестиків — як у класичних іграх. */
export const MistakeMeter: React.FC<{ mistakes: number; max: number; label?: string }> = ({ mistakes, max, label = 'Помилки' }) => (
  <span className="flex items-center gap-1 text-xs text-stone-400" aria-label={`${label}: ${mistakes} з ${max}`}>
    {label}:
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={i < mistakes ? 'text-rose-400' : 'text-stone-700'}>
        ✖
      </span>
    ))}
  </span>
);

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Таймери, які автоматично прибираються, коли гра зникає з екрана. */
export function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

/**
 * Клавіатура для міні-гри. Ігнорує натискання, коли курсор у полі введення.
 * Обробник завжди свіжий, тож можна користуватися поточним станом.
 */
export function useGameKeys(handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** Напрямок зі стрілок або WASD. */
export function keyToDir(e: KeyboardEvent): [number, number] | null {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
    case 'ц':
    case 'Ц':
      return [0, -1];
    case 'ArrowDown':
    case 's':
    case 'S':
    case 'і':
    case 'І':
    case 'ы':
      return [0, 1];
    case 'ArrowLeft':
    case 'a':
    case 'A':
    case 'ф':
    case 'Ф':
      return [-1, 0];
    case 'ArrowRight':
    case 'd':
    case 'D':
    case 'в':
    case 'В':
      return [1, 0];
    default:
      return null;
  }
}

/** Хрестовина для сенсорних екранів. */
export const DPad: React.FC<{ onMove: (dx: number, dy: number) => void; onWait?: () => void; disabled?: boolean; waitLabel?: string }> = ({
  onMove,
  onWait,
  disabled,
  waitLabel = 'Чекати',
}) => {
  const btn =
    'pixel-btn flex h-12 w-12 items-center justify-center border-2 border-stone-500 bg-stone-800 font-pixel text-[16px] text-amber-200 hover:border-amber-400 disabled:opacity-40';
  return (
    <div className="grid w-max grid-cols-3 gap-1" aria-label="Керування">
      <span />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(0, -1)} aria-label="Вгору">
        ▲
      </button>
      <span />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(-1, 0)} aria-label="Ліворуч">
        ◀
      </button>
      {onWait ? (
        <button
          type="button"
          className={`${btn} text-xs leading-tight`}
          disabled={disabled}
          onClick={onWait}
          aria-label={waitLabel}
          title={`${waitLabel} (пробіл)`}
        >
          ⏸
        </button>
      ) : (
        <span />
      )}
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(1, 0)} aria-label="Праворуч">
        ▶
      </button>
      <span />
      <button type="button" className={btn} disabled={disabled} onClick={() => onMove(0, 1)} aria-label="Вниз">
        ▼
      </button>
      <span />
    </div>
  );
};

/** Велика плашка результату поверх ігрового поля. */
export const ResultOverlay: React.FC<{ result: 'won' | 'lost' | null; won: string; lost: string }> = ({ result, won, lost }) => {
  if (!result) return null;
  return (
    <div
      className={`px-pop absolute inset-0 z-20 flex items-center justify-center p-4 text-center text-lg font-bold sm:text-xl ${
        result === 'won' ? 'bg-emerald-950/80 text-emerald-100' : 'bg-rose-950/80 text-rose-100'
      }`}
      role="status"
    >
      <span className="flex flex-col items-center gap-2">
        <PixelEmoji emoji={result === 'won' ? '🎉' : '💥'} size={56} />
        {result === 'won' ? won : lost}
      </span>
    </div>
  );
};

/** Смужка часу, що спливає (сегментована, у піксельному стилі). */
export const TimeBar: React.FC<{ left: number; total: number; label?: string }> = ({ left, total, label = 'Час' }) => {
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-stone-400">
        <span>{label}</span>
        <span className={`font-pixel text-[8px] ${pct < 25 ? 'text-rose-300 px-blink' : 'text-amber-200'}`}>{Math.ceil(left)}с</span>
      </div>
      <div className="px-bar h-3 overflow-hidden">
        <div className={`h-full ${pct < 25 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Перетягування пальцем або мишкою (працює і на телефонах)
// ---------------------------------------------------------------------------
export interface DragState {
  id: string;
  x: number;
  y: number;
}

/**
 * Простий pointer-drag: елемент-ціль позначається атрибутом data-drop="<id>".
 * onDrop отримує id того, що тягнули, та id цілі (або null).
 * Якщо палець майже не рухався, це звичайне натискання (onTap).
 */
export function usePointerDrag(onDrop: (dragId: string, dropId: string | null) => void, onTap?: (dragId: string) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; id: string; moved: boolean } | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const tapRef = useRef(onTap);
  tapRef.current = onTap;

  const findDrop = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const target = el?.closest('[data-drop]') as HTMLElement | null;
    return target?.dataset.drop ?? null;
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const s = start.current;
      if (!s) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 6) s.moved = true;
      setDrag({ id: s.id, x: e.clientX, y: e.clientY });
      setOver(s.moved ? findDrop(e.clientX, e.clientY) : null);
    };
    const up = (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      setDrag(null);
      setOver(null);
      if (!s) return;
      if (!s.moved) tapRef.current?.(s.id);
      else dropRef.current(s.id, findDrop(e.clientX, e.clientY));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const bind = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      start.current = { x: e.clientX, y: e.clientY, id, moved: false };
      setDrag({ id, x: e.clientX, y: e.clientY });
    },
    style: { touchAction: 'none' as const },
  });

  return { drag, over, bind, dragging: drag !== null && !!start.current?.moved };
}
