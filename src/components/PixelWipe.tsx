/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';

const COLS = 16;
const ROWS = 9;

/**
 * Перехід між екранами: поверх нового екрана лежить сітка темних квадратів,
 * які зникають у випадковому порядку — класичний «dissolve» старих консолей.
 * Рендерити з key, що змінюється при переході.
 */
export const PixelWipe: React.FC<{ duration?: number }> = ({ duration = 420 }) => {
  const [done, setDone] = useState(false);
  const delays = useMemo(
    () => Array.from({ length: COLS * ROWS }, () => Math.floor(Math.random() * 8) * (duration / 8)),
    [duration],
  );

  useEffect(() => {
    const t = setTimeout(() => setDone(true), duration + 80);
    return () => clearTimeout(t);
  }, [duration]);

  if (done) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 grid"
      style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
    >
      {delays.map((d, i) => (
        <div key={i} className="px-wipe-cell bg-stone-950" style={{ animationDelay: `${d}ms` }} />
      ))}
    </div>
  );
};
