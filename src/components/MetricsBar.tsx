/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Shield, Users, Landmark, Award, Coins, GitBranch } from 'lucide-react';
import { GameMetrics, ChapterId } from '../game/types';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { sound } from '../game/sound';

interface MetricsBarProps {
  metrics: GameMetrics;
  currentChapter: ChapterId;
  isAlternateHistory: boolean;
  activeTab: 'rpg' | 'tree' | 'map' | 'universals' | 'archive';
  onSelectTab: (tab: 'rpg' | 'tree' | 'map' | 'universals' | 'archive') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  currentChapter,
  isAlternateHistory,
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
}) => {
  const chapterInfo = CHAPTER_CONFIG[currentChapter];

  const metricItems = [
    {
      id: 'unity',
      label: 'Єдність',
      fullName: 'Національна Єдність',
      value: metrics.nationalUnity,
      icon: Users,
      color: 'bg-sky-500',
      textColor: 'text-sky-300',
    },
    {
      id: 'army',
      label: 'Армія',
      fullName: 'Боєздатність Армії',
      value: metrics.armyReadiness,
      icon: Shield,
      color: 'bg-amber-500',
      textColor: 'text-amber-300',
    },
    {
      id: 'diplomacy',
      label: 'Дипломатія',
      fullName: 'Міжнародний Авторитет',
      value: metrics.diplomacy,
      icon: Award,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-300',
    },
    {
      id: 'trust',
      label: 'Довіра',
      fullName: 'Народна Підтримка',
      value: metrics.popularTrust,
      icon: Landmark,
      color: 'bg-rose-500',
      textColor: 'text-rose-300',
    },
    {
      id: 'treasury',
      label: 'Скарбниця',
      fullName: 'Державні Фінанси',
      value: metrics.treasury,
      icon: Coins,
      color: 'bg-yellow-400',
      textColor: 'text-yellow-300',
    },
  ];

  const handleTabClick = (tab: 'rpg' | 'tree' | 'map' | 'universals' | 'archive') => {
    sound.playSelect();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-950/80 bg-stone-950/95 text-stone-200 backdrop-blur-md">
      {/* Top zone: Brand & Main Navigation & Primary Controls */}
      <div className="mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 px-4 py-2">
        {/* Brand Zone */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇺🇦</span>
            <div>
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-amber-300 whitespace-nowrap">
                Вільна Доля: 1917–1921
              </span>
              <div className="text-[10px] sm:text-[11px] text-stone-400">
                {chapterInfo?.period || '1917–1921'} · {chapterInfo?.title?.split(':')[0] || 'УЦР'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAlternateHistory && (
              <span
                title="Ваші рішення відхилилися від історичного канону"
                className="inline-flex items-center gap-1 border border-amber-600/60 bg-amber-950/50 px-2 py-0.5 text-[10px] sm:text-[11px] text-amber-200"
              >
                <GitBranch className="h-3 w-3 text-amber-400" />
                <span className="hidden xs:inline">Альтернатива</span>
              </span>
            )}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
              title={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
              className="sm:hidden flex h-7 w-7 items-center justify-center border border-stone-700 bg-stone-900 text-stone-300 hover:border-amber-500 hover:text-amber-300 transition-colors"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Single line, accessible native buttons) */}
        <nav aria-label="Головна навігація" className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleTabClick('rpg')}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === 'rpg'
                ? 'border-b-2 border-amber-400 bg-stone-800 text-amber-300 font-semibold'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white'
            }`}
          >
            RPG Сюжет
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('tree')}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === 'tree'
                ? 'border-b-2 border-amber-400 bg-stone-800 text-amber-300 font-semibold'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white'
            }`}
          >
            Дерево Долі
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('map')}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === 'map'
                ? 'border-b-2 border-amber-400 bg-stone-800 text-amber-300 font-semibold'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white'
            }`}
          >
            Штабний Стіл
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('universals')}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === 'universals'
                ? 'border-b-2 border-amber-400 bg-stone-800 text-amber-300 font-semibold'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white'
            }`}
          >
            Кабінет Універсалів
          </button>
          <button
            type="button"
            onClick={() => handleTabClick('archive')}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === 'archive'
                ? 'border-b-2 border-amber-400 bg-stone-800 text-amber-300 font-semibold'
                : 'text-stone-300 hover:bg-stone-900 hover:text-white'
            }`}
          >
            Історичний Архів
          </button>
        </nav>

        {/* Audio & Utility controls (Desktop) */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
            title={isMuted ? 'Увімкнути звук' : 'Вимкнути звук'}
            className="flex h-8 w-8 items-center justify-center border border-stone-700 bg-stone-900 text-stone-300 hover:border-amber-500 hover:text-amber-300 transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="border-t border-stone-800/80 bg-stone-900/90 px-4 py-1.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto text-xs">
          {metricItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                title={item.fullName}
                className="flex items-center gap-2 whitespace-nowrap min-w-[120px]"
              >
                <Icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                <span className="text-stone-400 text-[11px] font-medium">{item.label}:</span>
                <span className="font-mono font-bold text-stone-100 tabular-nums text-xs">
                  {item.value}%
                </span>
                <div className="h-1.5 w-16 bg-stone-800 overflow-hidden rounded-xs">
                  <div
                    className={`h-full ${item.color} transition-all duration-300`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
