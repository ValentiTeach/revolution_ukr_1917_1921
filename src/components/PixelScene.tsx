/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PixelScene показує піксельну сцену 384×216 так, щоб кожен «художній» піксель
 * мав однакову ширину: масштаб округлюється до цілого числа фізичних пікселів
 * екрана (з урахуванням devicePixelRatio). Без цього при масштабі 2,7 одні
 * стовпчики виходили на 2 пікселі, інші на 3, і картина «рябіла».
 *
 * Сцена покриває контейнер (як object-fit: cover), а focusY визначає, яку
 * частину показати, коли кадр вищий за вікно. Дочірні елементи (знахідки,
 * вогники) лежать у тому самому кадрі й позиціонуються у відсотках картини.
 *
 * Панорама (pan) рухає кадр рівно на один художній піксель за крок.
 */

import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { pxEase } from '../game/motion';

export const ART_W = 384;
export const ART_H = 216;
/** На скільки художніх пікселів панорама відходить від центру в кожен бік. */
const PAN_PX = 6;

interface Fit {
  k: number;
  left: number;
  top: number;
}

export type SceneFit = 'cover' | 'contain';

/**
 * Масштаб кадру.
 * cover — найближчий більший цілий (у фізичних пікселях) масштаб, якщо він обрізає
 * не більше 15 %; інакше точне покриття.
 * contain — уся картина видна (для карти): найбільший цілий масштаб, що вміщується.
 */
export function pixelFit(cw: number, ch: number, focusY: number, pan: boolean, dpr: number, mode: SceneFit = 'cover'): Fit {
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  let k: number;
  if (mode === 'contain') {
    const contain = Math.min(cw / ART_W, ch / ART_H);
    const devInt = Math.floor(contain * dpr + 1e-6);
    k = devInt >= 1 && devInt / (contain * dpr) >= 0.85 ? devInt / dpr : contain;
  } else {
    const margin = pan ? PAN_PX * 2 : 0;
    const cover = Math.max(cw / (ART_W - margin), ch / ART_H);
    const dev = cover * dpr;
    const devInt = Math.ceil(dev - 1e-6);
    k = devInt >= 1 && devInt / dev <= 1.15 ? devInt / dpr : cover;
  }
  const fw = ART_W * k;
  const fh = ART_H * k;
  return { k, left: snap((cw - fw) / 2), top: snap((ch - fh) * (mode === 'contain' ? 0.5 : focusY / 100)) };
}

interface SceneView {
  fit: Fit | null;
  cw: number;
  ch: number;
  pan: boolean;
}
const SceneViewContext = createContext<SceneView>({ fit: null, cw: 0, ch: 0, pan: false });

/**
 * Позиція маркера (у % кадру), притиснута до видимої частини вікна сцени.
 * На вузьких екранах кадр обрізано з боків, тож знахідка біля краю картини
 * інакше опинилася б за межами вікна. Відступ згори більший: там плашки акту.
 */
export function useInView(xPct: number, yPct: number, margins = { top: 60, side: 26, bottom: 26 }): { left: string; top: string } {
  const { fit, cw, ch, pan } = useContext(SceneViewContext);
  if (!fit || !cw || !ch) return { left: `${xPct}%`, top: `${yPct}%` };
  const fw = ART_W * fit.k;
  const fh = ART_H * fit.k;
  const drift = pan ? PAN_PX * fit.k : 0;
  const x = fit.left + (xPct / 100) * fw;
  const y = fit.top + (yPct / 100) * fh;
  const cx = Math.min(Math.max(x, margins.side + drift), cw - margins.side - drift);
  const cy = Math.min(Math.max(y, margins.top), ch - margins.bottom);
  return { left: `${((cx - fit.left) / fw) * 100}%`, top: `${((cy - fit.top) / fh) * 100}%` };
}

interface PixelSceneProps {
  src: string;
  alt: string;
  /** Ключ сцени: при зміні картина «проявляється» кроками. */
  sceneKey?: string;
  /** 0 — показати верх картини, 100 — низ. */
  focusY?: number;
  pan?: boolean;
  fit?: SceneFit;
  /** Рядки розгортки старого монітора, вирівняні по художніх пікселях. */
  scanlines?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PixelScene: React.FC<PixelSceneProps> = ({ src, alt, sceneKey, focusY = 50, pan = false, fit: fitMode = 'cover', scanlines = true, className = '', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  const [size, setSize] = useState({ cw: 0, ch: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        setFit(pixelFit(r.width, r.height, focusY, pan, window.devicePixelRatio || 1, fitMode));
        setSize((prev) => (prev.cw === r.width && prev.ch === r.height ? prev : { cw: r.width, ch: r.height }));
      }
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [focusY, pan, fitMode]);

  // До першого виміру — звичайне покриття через одиниці контейнера
  const frameStyle: React.CSSProperties = fit
    ? { width: ART_W * fit.k, height: ART_H * fit.k, left: fit.left, top: fit.top, ['--apx' as string]: `${fit.k}px` }
    : {
        width: 'max(100cqw, calc(100cqh * 16 / 9))',
        height: 'max(100cqh, calc(100cqw * 9 / 16))',
        left: '50%',
        top: `${focusY}%`,
        transform: `translate(-50%, -${focusY}%)`,
      };

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden [container-type:size] ${className}`}>
      <div className="absolute" style={frameStyle}>
        <div className={`${pan ? 'px-pan-art' : ''} absolute inset-0`}>
          <AnimatePresence mode="wait">
            <motion.img
              key={sceneKey ?? src}
              src={src}
              alt={alt}
              draggable={false}
              className="pixelated absolute inset-0 h-full w-full select-none"
              initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: pxEase(8) }}
            />
          </AnimatePresence>
          <SceneViewContext.Provider value={{ fit, cw: size.cw, ch: size.ch, pan }}>{children}</SceneViewContext.Provider>
        </div>
        {scanlines && <div className="px-scanlines" />}
      </div>
    </div>
  );
};
