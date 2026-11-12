/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MapPin, ShieldAlert, Swords, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CityNode } from '../game/types';
import { CITIES_DATA } from '../game/historicalData';
import { resolveStaffBattle } from '../game/rules';
import { BG_IMAGES } from '../game/assets';
import { sound } from '../game/sound';

interface StaffMapQuestProps {
  armyReadiness: number;
  usedOperations: string[];
  onBattleResolved: (opId: string, victory: boolean) => void;
}

type Tactic = 'defend' | 'flank' | 'scout';

const TACTICS: { id: Tactic; emoji: string; label: string; hint: string }[] = [
  { id: 'defend', emoji: '🛡️', label: 'Окопатися', hint: 'Сильні укріплення: +1 до оборони.' },
  { id: 'flank', emoji: '🐎', label: 'Обхід кіннотою', hint: 'Удар збоку: +25% до сили війська.' },
  { id: 'scout', emoji: '🔭', label: 'Розвідка', hint: 'Знаєш, де ворог: його сила -20%.' },
];

export const StaffMapQuest: React.FC<StaffMapQuestProps> = ({
  armyReadiness,
  usedOperations,
  onBattleResolved,
}) => {
  const [tactics, setTactics] = useState<Record<string, Tactic>>({});
  const [fightingOp, setFightingOp] = useState<string | null>(null);
  const [cities, setCities] = useState<CityNode[]>(() =>
    CITIES_DATA.map((c) => {
      const opCity = { op_kruty: 'kruty', op_poltava: 'poltava', op_kyiv_campaign: 'kyiv' } as Record<string, string>;
      const won = usedOperations.some((op) => op.endsWith(':win') && opCity[op.split(':')[0]] === c.id);
      return won ? { ...c, controlledBy: 'UNR' } : c;
    }),
  );
  const [selectedCity, setSelectedCity] = useState<CityNode | null>(CITIES_DATA[0]);
  const [activeOperation, setActiveOperation] = useState<{
    cityId: string;
    title: string;
    enemyPower: number;
    recommendedForce: number;
  } | null>(null);

  const [lastBattleResult, setLastBattleResult] = useState<{
    victory: boolean;
    friendlyLosses: number;
    enemyLosses: number;
    report: string;
  } | null>(null);

  const operations = [
    {
      id: 'op_kruty',
      cityName: 'Станція Крути',
      cityId: 'kruty',
      title: 'Оборона залізничного вузла Крути (Січень 1918)',
      desc: 'Більшовицькі загони Муравйова наступають на Київ ешелонами. Сили дуже нерівні, як і насправді: перемогти майже неможливо, але кожна година бою — це час для Києва.',
      enemyPower: 4000,
      friendlyTroops: 1200,
      fortificationLevel: 2,
    },
    {
      id: 'op_poltava',
      cityName: 'Полтава',
      cityId: 'poltava',
      title: 'Звільнення Полтавщини та Лівобережжя (Весна 1918)',
      desc: 'Мобілізація полків Вільного Козацтва та визволення залізничних станцій Лівобережної України.',
      enemyPower: 2800,
      friendlyTroops: 3500,
      fortificationLevel: 1,
    },
    {
      id: 'op_kyiv_campaign',
      cityName: 'Київ',
      cityId: 'kyiv',
      title: 'Спільний визвольний похід на Київ (Серпень 1919)',
      desc: 'Координація дій Армії УНР (Петлюра) та Української Галицької Армії (Тарнавський) для звільнення столиці.',
      enemyPower: 5500,
      friendlyTroops: 6200,
      fortificationLevel: 2,
    },
  ];

  const handleExecuteOperation = (op: typeof operations[0]) => {
    if (fightingOp) return;
    const tactic = tactics[op.id] ?? 'defend';
    setFightingOp(op.id);
    setLastBattleResult(null);
    [0, 350, 700, 1050].forEach((t) => setTimeout(() => sound.playMarch(), t));
    setTimeout(() => resolveOperation(op, tactic), 1500);
  };

  const resolveOperation = (op: typeof operations[0], tactic: Tactic) => {
    setFightingOp(null);
    const troops = tactic === 'flank' ? Math.round(op.friendlyTroops * 1.25) : op.friendlyTroops;
    const enemy = tactic === 'scout' ? Math.round(op.enemyPower * 0.8) : op.enemyPower;
    const fort = tactic === 'defend' ? op.fortificationLevel + 1 : op.fortificationLevel;
    const result = resolveStaffBattle(troops, enemy, fort, armyReadiness);

    setLastBattleResult({
      victory: result.victory,
      friendlyLosses: result.friendlyLosses,
      enemyLosses: result.enemyLosses,
      report: result.tacticalReport,
    });

    if (result.victory) {
      sound.playFanfare();
      // Update city control to UNR
      setCities((prev) =>
        prev.map((c) => (c.id === op.cityId ? { ...c, controlledBy: 'UNR' } : c))
      );
      onBattleResolved(op.id, true);
    } else {
      sound.playWrong();
      onBattleResolved(op.id, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header briefing */}
      <div className="border border-stone-800 bg-stone-900/90 p-5 text-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-300">
                Штабний Стіл: Стратегічна Карта України 1917–1921
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-400 max-w-xl">
              Обери тактику і веди війська! Кожну операцію можна провести лише раз, тож думай наперед: що вища боєздатність армії, то більше шансів. Натискай на міста, щоб дізнатися їхню історію.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 border border-stone-800 px-4 py-2 text-xs">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Бойова готовність Армії:</span>
            <strong className="font-mono text-amber-300 text-sm tabular-nums">
              {armyReadiness}%
            </strong>
          </div>
        </div>
      </div>

      {/* Map Surface & City Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tactical Map Container (2 cols) */}
        <div className="lg:col-span-2 border border-amber-950/90 bg-stone-950 overflow-hidden shadow-xl">
          <div className="relative aspect-16/9 w-full bg-stone-900 select-none">
            <img
              src={BG_IMAGES.map}
              alt="Воєнна карта України 1917-1921"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover filter contrast-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-stone-950/15" />

            {/* City interactive markers */}
            {cities.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              const isUNR = city.controlledBy === 'UNR' || city.controlledBy === 'ZUNR';

              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setSelectedCity(city);
                  }}
                  style={{
                    left: `${city.x}%`,
                    top: `${city.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 p-1 border transition-all ${
                    isSelected
                      ? 'scale-110 z-20 border-amber-300 bg-amber-950/90 text-amber-200 shadow-lg'
                      : isUNR
                      ? 'border-sky-500/80 bg-stone-950/80 text-sky-200 hover:scale-105'
                      : 'border-rose-600/80 bg-stone-950/80 text-rose-300 hover:scale-105'
                  }`}
                >
                  <MapPin
                    className={`h-3.5 w-3.5 ${
                      isSelected ? 'text-amber-300' : isUNR ? 'text-sky-400' : 'text-rose-400'
                    }`}
                  />
                  <span className="font-serif text-[11px] font-bold whitespace-nowrap px-1">
                    {city.nameUk}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map legend */}
          <div className="flex flex-wrap items-center justify-between border-t border-stone-800 bg-stone-950 px-4 py-2 text-xs text-stone-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" /> Під контролем УНР / ЗУНР
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Лінія боїв / Оспорюється
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono">
              Масштаб: 1 верста = 1.06 км · Залізнична сітка
            </span>
          </div>
        </div>

        {/* Selected City & Operations Dispatch Panel */}
        <div className="space-y-4">
          {/* City Card */}
          {selectedCity && (
            <div className="border border-stone-800 bg-stone-900/90 p-4 text-xs text-stone-300 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div>
                  <h3 className="font-serif text-base font-bold text-amber-300">
                    {selectedCity.nameUk}
                  </h3>
                  <span className="text-[11px] text-stone-400">
                    {selectedCity.importance === 'capital' && 'Столиця та центр уряду'}
                    {selectedCity.importance === 'major' && 'Стратегічний промисловий центр'}
                    {selectedCity.importance === 'fortress' && 'Залізничний оборонний вузол'}
                  </span>
                </div>
                <span
                  className={`border px-2 py-0.5 text-[10px] font-mono uppercase ${
                    selectedCity.controlledBy === 'UNR'
                      ? 'border-sky-500 bg-sky-950/80 text-sky-300'
                      : selectedCity.controlledBy === 'ZUNR'
                      ? 'border-cyan-500 bg-cyan-950/80 text-cyan-300'
                      : 'border-rose-500 bg-rose-950/80 text-rose-300'
                  }`}
                >
                  {selectedCity.controlledBy === 'UNR' && 'УНР'}
                  {selectedCity.controlledBy === 'ZUNR' && 'ЗУНР'}
                  {selectedCity.controlledBy === 'Contested' && 'Бойові дії'}
                </span>
              </div>

              <p className="text-stone-300 leading-relaxed text-[11px]">
                {selectedCity.historicalNote}
              </p>

              <div className="border border-stone-800 bg-stone-950 p-2 text-stone-400 flex items-center justify-between">
                <span>Гарнізон військ:</span>
                <strong className="font-mono text-stone-100">{selectedCity.garrison * 1000} багнетів</strong>
              </div>
            </div>
          )}

          {/* Strategic Quests list */}
          <div className="border border-stone-800 bg-stone-900/90 p-4 space-y-3 text-xs">
            <h4 className="font-serif font-bold text-stone-200 flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-400" />
              <span>Штабні Операції та Квести</span>
            </h4>

            <div className="space-y-2.5">
              {operations.map((op) => {
                const done = usedOperations.find((u) => u.startsWith(op.id + ':'));
                const chosen = tactics[op.id] ?? 'defend';
                const isFighting = fightingOp === op.id;
                return (
                  <div
                    key={op.id}
                    className={`border-2 p-3 transition-colors ${
                      done ? 'border-stone-800 bg-stone-950/50 opacity-80' : 'border-stone-700 bg-stone-950/80 hover:border-stone-600'
                    }`}
                  >
                    <h5 className="font-semibold text-amber-200 text-sm">{op.title}</h5>
                    <p className="mt-1 text-xs text-stone-400 leading-relaxed">{op.desc}</p>
                    {!done && (
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {TACTICS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            title={t.hint}
                            onClick={() => {
                              sound.playBlip(520);
                              setTactics((prev) => ({ ...prev, [op.id]: t.id }));
                            }}
                            aria-pressed={chosen === t.id}
                            className={`border px-1 py-1.5 text-[11px] leading-tight ${
                              chosen === t.id ? 'border-amber-400 bg-amber-950 text-amber-100' : 'border-stone-700 text-stone-400 hover:border-stone-500'
                            }`}
                          >
                            <span className="block text-base">{t.emoji}</span>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-stone-800/60">
                      <span className="text-[11px] text-stone-500">
                        Ворог: ~{op.enemyPower} · Наші: ~{op.friendlyTroops}
                      </span>
                      {done ? (
                        <span className={`text-xs font-bold ${done.endsWith(':win') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {done.endsWith(':win') ? '✅ Перемога' : '🕯️ Відступ'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExecuteOperation(op)}
                          disabled={fightingOp !== null}
                          className="pixel-btn border-2 border-amber-500 bg-amber-600 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-500 disabled:opacity-60"
                        >
                          {isFighting ? '⚔️ Бій триває…' : 'В атаку!'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Battle report modal / card */}
          {lastBattleResult && (
            <div
              className={`border p-4 text-xs space-y-2 ${
                lastBattleResult.victory
                  ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200'
                  : 'border-rose-700 bg-rose-950/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {lastBattleResult.victory ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Успіх операції!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>Тяжкий арʼєргардний бій</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">{lastBattleResult.report}</p>
              <div className="flex items-center justify-between font-mono text-[11px] pt-2 border-t border-stone-800">
                <span>Втрати захисників: ~{lastBattleResult.friendlyLosses}</span>
                <span>Втрати ворога: ~{lastBattleResult.enemyLosses}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
