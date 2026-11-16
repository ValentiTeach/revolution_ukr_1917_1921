/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PixelEmoji перетворює звичайний емодзі на піксельний спрайт:
 * малює його на крихітному полотні (16×16), прибирає напівпрозорі краї,
 * обводить темним піксельним контуром і показує збільшеним без згладжування.
 * Так предмети, медалі та двері виглядають як справжні спрайти 8-бітної гри.
 */

import React, { useMemo } from 'react';

const cache = new Map<string, string | null>();
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

function rasterize(char: string, res: number, outline: boolean): string | null {
  const key = `${char}|${res}|${outline}`;
  if (cache.has(key)) return cache.get(key)!;
  let url: string | null = null;
  try {
    const pad = outline ? 1 : 0;
    const inner = res - pad * 2;
    // Малюємо у вищій роздільності, потім зменшуємо до res без згладжування
    const big = document.createElement('canvas');
    big.width = big.height = inner * 4;
    const bctx = big.getContext('2d');
    const out = document.createElement('canvas');
    out.width = out.height = res;
    const ctx = out.getContext('2d');
    if (bctx && ctx) {
      bctx.textAlign = 'center';
      bctx.textBaseline = 'middle';
      bctx.font = `${inner * 4 * 0.86}px ${EMOJI_FONT}`;
      bctx.fillText(char, (inner * 4) / 2, (inner * 4) / 2 + inner * 4 * 0.06);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(big, pad, pad, inner, inner);
      const img = ctx.getImageData(0, 0, res, res);
      const d = img.data;
      let painted = 0;
      // Жорстка альфа + легке зменшення палітри (4 рівні на канал)
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 110) {
          d[i + 3] = 0;
        } else {
          d[i + 3] = 255;
          painted++;
          for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] / 51) * 51;
        }
      }
      if (outline && painted > 0) {
        const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < res && y < res && d[(y * res + x) * 4 + 3] === 255;
        const edge: number[] = [];
        for (let y = 0; y < res; y++) {
          for (let x = 0; x < res; x++) {
            if (!solid(x, y) && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1))) {
              edge.push((y * res + x) * 4);
            }
          }
        }
        edge.forEach((i) => {
          d[i] = 18;
          d[i + 1] = 14;
          d[i + 2] = 12;
          d[i + 3] = 255;
        });
      }
      if (painted > 0) {
        ctx.putImageData(img, 0, 0);
        url = out.toDataURL();
      }
    }
  } catch {
    url = null;
  }
  cache.set(key, url);
  return url;
}

interface PixelEmojiProps {
  emoji: string;
  /** Розмір на екрані у пікселях. */
  size?: number;
  /** Роздільність спрайта (менше — «грубіші» пікселі). */
  res?: number;
  outline?: boolean;
  className?: string;
  label?: string;
}

export const PixelEmoji: React.FC<PixelEmojiProps> = ({ emoji, size = 32, res = 16, outline = true, className = '', label }) => {
  const url = useMemo(() => (typeof document === 'undefined' ? null : rasterize(emoji, res, outline)), [emoji, res, outline]);
  if (!url) {
    return (
      <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={url}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={`pixelated inline-block select-none ${className}`}
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
    />
  );
};
