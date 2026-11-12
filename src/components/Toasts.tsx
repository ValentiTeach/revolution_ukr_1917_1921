/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  text?: string;
  tone: 'star' | 'medal' | 'info';
}

interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const TONE_CLASSES: Record<Toast['tone'], string> = {
  star: 'border-amber-400 bg-amber-950/95 text-amber-100',
  medal: 'border-sky-400 bg-sky-950/95 text-sky-100',
  info: 'border-stone-600 bg-stone-900/95 text-stone-100',
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.tone === 'medal' ? 4200 : 2600);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <motion.button
      type="button"
      layout
      initial={{ x: 80, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0 }}
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto flex w-72 items-center gap-3 border-2 px-3 py-2.5 text-left shadow-xl ${TONE_CLASSES[toast.tone]}`}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {toast.emoji}
      </span>
      <span>
        <span className="block text-sm font-bold">{toast.title}</span>
        {toast.text && <span className="block text-xs opacity-80">{toast.text}</span>}
      </span>
    </motion.button>
  );
};

export const Toasts: React.FC<ToastsProps> = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
  >
    <AnimatePresence>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);
