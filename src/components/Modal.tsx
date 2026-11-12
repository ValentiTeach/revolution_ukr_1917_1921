/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  /** Якщо false — вікно не закривається кліком поза ним (для міні-ігор). */
  dismissible?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
  dismissible = true,
}) => {
  useEffect(() => {
    if (!open || !dismissible || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dismissible && onClose?.()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto bg-stone-900 text-stone-100 pixel-frame`}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flag-strip" />
            {(title || (dismissible && onClose)) && (
              <div className="flex items-center justify-between gap-3 border-b border-stone-800 px-4 sm:px-6 py-3">
                <div className="font-serif text-lg sm:text-xl font-bold text-amber-300">{title}</div>
                {dismissible && onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрити"
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-stone-700 bg-stone-950 text-stone-300 hover:border-amber-500 hover:text-amber-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            <div className="p-4 sm:p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
