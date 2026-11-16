/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

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
