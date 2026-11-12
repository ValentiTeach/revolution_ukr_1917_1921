/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, Info } from 'lucide-react';
import { FactionId, FactionReputation } from '../game/types';
import { FACTIONS } from '../game/historicalData';

interface FactionsPanelProps {
  reputation: FactionReputation;
}

export const FactionsPanel: React.FC<FactionsPanelProps> = ({ reputation }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);

  const getReputationStatus = (value: number) => {
    if (value >= 75) return { text: 'Повний союз', color: 'text-emerald-400', border: 'border-emerald-500' };
    if (value >= 55) return { text: 'Підтримка', color: 'text-sky-400', border: 'border-sky-500' };
    if (value >= 40) return { text: 'Нейтралітет', color: 'text-amber-400', border: 'border-amber-500' };
    if (value >= 25) return { text: 'Настороженість', color: 'text-orange-400', border: 'border-orange-500' };
    return { text: 'Ворожість', color: 'text-rose-500', border: 'border-rose-600' };
  };

  const factionKeys = Object.keys(FACTIONS) as FactionId[];

  return (
    <aside
      aria-label="Баланс політичних фракцій"
      className="border border-stone-800 bg-stone-900/90 text-stone-200 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-stone-800 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-400" />
          <h2 className="font-serif text-sm font-semibold text-stone-100">
            Баланс Політичних Фракцій
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-300 transition-colors"
        >
          <span>{isExpanded ? 'Згорнути' : 'Деталі'}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Quick horizontal strip or compact grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-3 text-xs">
        {factionKeys.map((fid) => {
          const info = FACTIONS[fid];
          const val = reputation[fid] ?? 50;
          const status = getReputationStatus(val);
          const isSelected = selectedFaction === fid;

          return (
            <button
              key={fid}
              type="button"
              onClick={() => setSelectedFaction(isSelected ? null : fid)}
              className={`flex flex-col text-left p-2 border transition-all ${
                isSelected
                  ? 'border-amber-400 bg-stone-800'
                  : 'border-stone-800 bg-stone-950/60 hover:border-stone-700 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-semibold text-stone-200 truncate text-[11px]">
                  {info.name.split(' ')[0]}
                </span>
                <span className="font-mono text-stone-300 font-bold tabular-nums text-[11px]">
                  {val}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-stone-800 rounded-xs overflow-hidden mb-1">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${val}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className={status.color}>{status.text}</span>
                <Info className="h-3 w-3 text-stone-500" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded Faction Details */}
      {(isExpanded || selectedFaction) && (
        <div className="border-t border-stone-800 bg-stone-950/80 p-4 text-xs">
          {selectedFaction ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold text-amber-300">
                  {FACTIONS[selectedFaction].name}
                </h3>
                <span className="font-mono text-stone-400">
                  Лідер: <strong className="text-stone-200">{FACTIONS[selectedFaction].leader}</strong>
                </span>
              </div>
              <p className="text-stone-300 leading-relaxed">
                {FACTIONS[selectedFaction].description}
              </p>
              <div className="border border-stone-800 bg-stone-900/60 p-2 text-stone-400">
                <strong className="text-stone-300">Програмна мета: </strong>
                {FACTIONS[selectedFaction].historicalAim}
              </div>
            </div>
          ) : (
            <div className="text-stone-400 leading-relaxed">
              Натисніть на будь-яку фракцію вище, щоб переглянути їхніх лідерів, ідеологію та вимоги. Обʼєднання суперечливих інтересів — ключ до збереження незалежності УНР.
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
