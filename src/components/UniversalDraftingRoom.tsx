/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Scroll, CheckSquare, Square, Award, Sparkles, AlertCircle } from 'lucide-react';
import { UniversalClause } from '../game/types';
import { UNIVERSALS_CLAUSES_POOL, FACTIONS } from '../game/historicalData';
import { evaluateUniversalDraft } from '../game/rules';
import { sound } from '../game/sound';
import confetti from 'canvas-confetti';

interface UniversalDraftingRoomProps {
  onUniversalEnacted: (metricsGained: any, textTitle: string) => void;
}

export const UniversalDraftingRoom: React.FC<UniversalDraftingRoomProps> = ({
  onUniversalEnacted,
}) => {
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([
    'clause_autonomy_proclaim',
    'clause_land_socialization',
  ]);
  const [customTitle, setCustomTitle] = useState('Універсал Національної Згоди');
  const [hasProclaimed, setHasProclaimed] = useState(false);

  const toggleClause = (id: string) => {
    sound.playSelect();
    setHasProclaimed(false);
    setSelectedClauseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedClauses = UNIVERSALS_CLAUSES_POOL.filter((c) =>
    selectedClauseIds.includes(c.id)
  );

  const draftEvaluation = evaluateUniversalDraft(selectedClauses);

  const handleProclaim = () => {
    sound.playFanfare();
    setHasProclaimed(true);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#eab308', '#f8fafc'],
      });
    } catch {
      // Ignore
    }

    onUniversalEnacted(draftEvaluation.projectedMetrics, customTitle);
  };

  const categories = [
    { id: 'statehood', name: 'Державний Устрій' },
    { id: 'army', name: 'Військова Організація' },
    { id: 'land', name: 'Земельне Питання' },
    { id: 'diplomacy', name: 'Міжнародний Курс' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="border border-stone-800 bg-stone-900/90 p-5 text-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scroll className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-300">
                Кабінет Універсалів: Законодавча Майстерня УЦР
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-400 max-w-xl">
              Сформуйте власний доленосний Універсал! Обирайте статті, балансуючи вимоги селян, офіцерів, соціалістів та консерваторів, щоб здобути максимальну підтримку нації.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 px-4 py-2 text-xs">
            <span>Загальна підтримка проекту:</span>
            <strong
              className={`font-mono text-sm tabular-nums ${
                draftEvaluation.totalSupport >= 20
                  ? 'text-emerald-400'
                  : draftEvaluation.totalSupport >= 5
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {draftEvaluation.totalSupport > 0 ? `+${draftEvaluation.totalSupport}%` : `${draftEvaluation.totalSupport}%`}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clause Selector by Category (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="border border-stone-800 bg-stone-950 p-4">
            <label className="block text-xs font-semibold text-stone-400 mb-1">
              Назва або девіз документу:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 font-serif focus:border-amber-400 focus:outline-hidden"
              placeholder="Введіть назву Універсалу..."
            />
          </div>

          {categories.map((cat) => {
            const catClauses = UNIVERSALS_CLAUSES_POOL.filter((c) => c.category === cat.id);
            return (
              <div key={cat.id} className="space-y-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-amber-300 border-b border-stone-800 pb-1">
                  {cat.name}
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {catClauses.map((clause) => {
                    const isSelected = selectedClauseIds.includes(clause.id);
                    return (
                      <button
                        key={clause.id}
                        type="button"
                        onClick={() => toggleClause(clause.id)}
                        className={`flex items-start gap-3 p-3 text-left border transition-all ${
                          isSelected
                            ? 'border-amber-400 bg-amber-950/20 text-stone-100'
                            : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                        }`}
                      >
                        <div className="mt-0.5 text-amber-400">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4 text-stone-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-xs font-bold text-stone-200">
                              {clause.title}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-stone-400 leading-normal">
                            {clause.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Parliamentary Debate & Proclamation Desk */}
        <div className="space-y-4">
          <div className="border border-stone-800 bg-stone-900/90 p-5 space-y-4 text-xs text-stone-300">
            <h3 className="font-serif text-sm font-bold text-stone-100 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <span>Реакція Фракцій на Проект</span>
            </h3>

            <div className="space-y-2.5">
              {(Object.keys(draftEvaluation.factionApprovals) as (keyof typeof FACTIONS)[]).map(
                (fid) => {
                  const score = draftEvaluation.factionApprovals[fid];
                  const info = FACTIONS[fid];
                  return (
                    <div key={fid} className="flex items-center justify-between text-xs">
                      <span className="text-stone-300 truncate max-w-[140px]">
                        {info.name.split(' ')[0]}:
                      </span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          score > 0
                            ? 'text-emerald-400'
                            : score < 0
                            ? 'text-rose-400'
                            : 'text-stone-500'
                        }`}
                      >
                        {score > 0 ? `+${score}%` : `${score}%`}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            <div className="border-t border-stone-800 pt-3">
              <button
                type="button"
                onClick={handleProclaim}
                disabled={selectedClauseIds.length === 0}
                className="w-full flex items-center justify-center gap-2 border border-amber-500 bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 uppercase tracking-wider hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Урочисто Проголосити</span>
              </button>
            </div>

            {hasProclaimed && (
              <div className="border border-emerald-700 bg-emerald-950/60 p-3 text-emerald-200 text-xs space-y-1">
                <div className="font-bold font-serif">«{customTitle}» проголошено!</div>
                <p className="text-[11px] text-emerald-300">
                  Текст зачитано перед народом на Софійській площі. Зміни внесено у показники держави.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
