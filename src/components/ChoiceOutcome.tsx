/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { DialogueChoice, FactionId, GameMetrics } from '../game/types';
import { FACTIONS } from '../game/historicalData';
import { METRIC_META } from '../game/metricsMeta';
import { sound } from '../game/sound';

export interface PendingOutcome {
  choice: DialogueChoice;
  before: GameMetrics;
  after: GameMetrics;
  starsGained: number;
}

interface ChoiceOutcomeProps {
  outcome: PendingOutcome | null;
  onContinue: () => void;
}

/** Вікно наслідків рішення: що змінилося і як зреагували фракції. */
export const ChoiceOutcome: React.FC<ChoiceOutcomeProps> = ({ outcome, onContinue }) => {
  const close = () => {
    sound.playPage();
    onContinue();
  };

  return (
    <Modal open={outcome !== null} onClose={close} title="Наслідки твого рішення" maxWidth="max-w-xl">
      {outcome && (
        <div className="space-y-5">
          <div
            className={`border-l-4 p-3 text-sm ${
              outcome.choice.historicalCanon
                ? 'border-stone-400 bg-stone-950 text-stone-200'
                : 'border-amber-400 bg-amber-950/40 text-amber-100'
            }`}
          >
            <div className="text-xs uppercase tracking-wider mb-1 opacity-80">
              {outcome.choice.historicalCanon ? '📜 Так сталося насправді' : '⚡ Нова гілка історії'}
            </div>
            <p className="font-serif text-base leading-relaxed">{outcome.choice.reflection}</p>
          </div>

          <div className="space-y-2">
            {METRIC_META.map((m, i) => {
              const b = outcome.before[m.key];
              const a = outcome.after[m.key];
              const delta = a - b;
              if (delta === 0) return null;
              return (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="w-28 shrink-0">
                    {m.emoji} {m.label}
                  </span>
                  <div className="relative h-3 flex-1 bg-stone-800 overflow-hidden">
                    <motion.div
                      className={`absolute inset-y-0 left-0 ${m.bar}`}
                      initial={{ width: `${b}%` }}
                      animate={{ width: `${a}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                    />
                  </div>
                  <span className={`w-12 text-right font-mono font-bold ${delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {delta > 0 ? `+${delta}` : delta}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {Object.keys(outcome.choice.factionEffects).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(Object.entries(outcome.choice.factionEffects) as [FactionId, number][]).map(([fid, v]) => (
                <span
                  key={fid}
                  className={`border px-2 py-1 text-xs ${
                    v > 0 ? 'border-emerald-800 bg-emerald-950/50 text-emerald-200' : 'border-rose-800 bg-rose-950/50 text-rose-200'
                  }`}
                  title={FACTIONS[fid].name}
                >
                  {v > 0 ? '😊' : '😠'} {FACTIONS[fid].name.split('(')[0].trim()} {v > 0 ? `+${v}` : v}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-stone-800 pt-4">
            <span className="text-amber-300 font-bold">+{outcome.starsGained} ⭐</span>
            <button
              type="button"
              onClick={close}
              autoFocus
              className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
            >
              Далі <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
