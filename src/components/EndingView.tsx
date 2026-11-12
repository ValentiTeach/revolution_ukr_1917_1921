/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, RotateCcw, GitBranch, CheckCircle2, ShieldCheck } from 'lucide-react';
import { EndingResult, GameMetrics } from '../game/types';
import { sound } from '../game/sound';

interface EndingViewProps {
  ending: EndingResult;
  metrics: GameMetrics;
  onRestart: () => void;
  onViewTree: () => void;
}

export const EndingView: React.FC<EndingViewProps> = ({
  ending,
  metrics,
  onRestart,
  onViewTree,
}) => {
  const getBannerColor = () => {
    switch (ending.type) {
      case 'SOBORNA_VICTORY':
        return 'border-sky-500 bg-sky-950/40 text-sky-200';
      case 'HETMANATE_STATEHOOD':
        return 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
      case 'BALTIC_BLACK_SEA_LEAGUE':
        return 'border-cyan-500 bg-cyan-950/40 text-cyan-200';
      case 'PEASANT_INSURGENT_REPUBLIC':
        return 'border-amber-500 bg-amber-950/40 text-amber-200';
      default:
        return 'border-amber-700 bg-stone-900/90 text-stone-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Epilogue Banner */}
      <div className={`border p-6 md:p-8 space-y-4 shadow-xl ${getBannerColor()}`}>
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-400">
          <Award className="h-4 w-4" />
          <span>Підсумок Визвольних Змагань 1917–1921</span>
        </div>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-amber-300">
          {ending.title}
        </h1>
        <div className="text-sm font-medium text-stone-300">{ending.subtitle}</div>

        <p className="text-sm sm:text-base leading-relaxed text-stone-100 font-serif">
          {ending.description}
        </p>

        {/* Unlocked Achievements */}
        <div className="border-t border-stone-800/80 pt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Здобутки Вашого Правління:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ending.achievements.map((ach, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-stone-950/70 border border-stone-800 p-2.5 text-xs text-stone-200"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{ach}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical comparison */}
        <div className="border-t border-stone-800/80 pt-4 text-xs text-stone-400 leading-relaxed bg-stone-950/50 p-4 border">
          <strong className="text-stone-300">Історична паралель: </strong>
          {ending.historicalComparison}
        </div>
      </div>

      {/* Final Metrics overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-stone-800 bg-stone-900/90 p-3 text-center">
          <div className="text-[11px] text-stone-400">Єдність:</div>
          <div className="font-mono text-lg font-bold text-sky-400">{metrics.nationalUnity}%</div>
        </div>
        <div className="border border-stone-800 bg-stone-900/90 p-3 text-center">
          <div className="text-[11px] text-stone-400">Армія:</div>
          <div className="font-mono text-lg font-bold text-amber-400">{metrics.armyReadiness}%</div>
        </div>
        <div className="border border-stone-800 bg-stone-900/90 p-3 text-center">
          <div className="text-[11px] text-stone-400">Дипломатія:</div>
          <div className="font-mono text-lg font-bold text-emerald-400">{metrics.diplomacy}%</div>
        </div>
        <div className="border border-stone-800 bg-stone-900/90 p-3 text-center">
          <div className="text-[11px] text-stone-400">Довіра:</div>
          <div className="font-mono text-lg font-bold text-rose-400">{metrics.popularTrust}%</div>
        </div>
        <div className="border border-stone-800 bg-stone-900/90 p-3 text-center col-span-2 sm:col-span-1">
          <div className="text-[11px] text-stone-400">Скарбниця:</div>
          <div className="font-mono text-lg font-bold text-yellow-400">{metrics.treasury}%</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => {
            sound.playSelect();
            onViewTree();
          }}
          className="flex items-center gap-2 border border-amber-600 bg-stone-900 px-5 py-2.5 text-xs font-bold text-amber-300 hover:bg-stone-800 transition-colors"
        >
          <GitBranch className="h-4 w-4" />
          <span>Переглянути Дерево Долі</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playSelect();
            onRestart();
          }}
          className="flex items-center gap-2 border border-stone-700 bg-stone-900 px-5 py-2.5 text-xs font-bold text-stone-200 hover:bg-stone-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Почати нову кампанію 1917</span>
        </button>
      </div>
    </div>
  );
};
