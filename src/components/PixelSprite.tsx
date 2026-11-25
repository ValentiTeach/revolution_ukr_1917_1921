/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { SPRITES, SPRITE_PALETTE, SpriteId } from '../game/sprites';

/** Збирає рядки спрайта у прямокутники: сусідні пікселі одного кольору в рядку — один rect. */
function toRects(rows: string[]) {
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !SPRITE_PALETTE[ch]) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      rects.push({ x, y, w: end - x, c: SPRITE_PALETTE[ch] });
      x = end;
    }
  });
  return rects;
}

const cache = new Map<string, ReturnType<typeof toRects>>();

/** Піксельний спрайт із sprites.ts, намальований чіткими SVG-прямокутниками. */
export const PixelSprite: React.FC<{ id: SpriteId; size?: number; flip?: boolean; className?: string; title?: string }> = ({
  id,
  size = 32,
  flip = false,
  className = '',
  title,
}) => {
  const rows = SPRITES[id].rows;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const rects = useMemo(() => {
    if (!cache.has(id)) cache.set(id, toRects(rows));
    return cache.get(id)!;
  }, [id, rows]);
  const scale = size / Math.max(w, h);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={`inline-block ${className}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
      ))}
    </svg>
  );
};

/** Малює спрайт на canvas (кешує готове полотно). */
const canvasCache = new Map<string, HTMLCanvasElement>();
export function spriteCanvas(id: SpriteId, tint?: (hex: string) => string): HTMLCanvasElement {
  const key = `${id}|${tint ? 't' : ''}`;
  const hit = canvasCache.get(key);
  if (hit) return hit;
  const rows = SPRITES[id].rows;
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  if (ctx) {
    rows.forEach((row, y) =>
      row.split('').forEach((ch, x) => {
        const col = SPRITE_PALETTE[ch];
        if (ch === '.' || !col) return;
        ctx.fillStyle = tint ? tint(col) : col;
        ctx.fillRect(x, y, 1, 1);
      }),
    );
  }
  canvasCache.set(key, cv);
  return cv;
}
