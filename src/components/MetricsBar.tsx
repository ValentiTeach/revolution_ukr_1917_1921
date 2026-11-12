/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Backpack,
  BookOpen,
  GitBranch,
  Lightbulb,
  LightbulbOff,
  Map as MapIcon,
  MessageSquare,
  Scroll,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameMetrics, ChapterId, HeroSprite } from '../game/types';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { METRIC_META } from '../game/metricsMeta';
import { getRank } from '../game/rules';
import { sound } from '../game/sound';
import { PixelAvatar } from './PixelAvatar';

export type GameTab = 'rpg' | 'satchel' | 'tree' | 'map' | 'universals' | 'archive';

interface MetricsBarProps {
  metrics: GameMetrics;
  currentChapter: ChapterId;
  isAlternateHistory: boolean;
  activeTab: GameTab;
  onSelectTab: (tab: GameTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showHints: boolean;
  onToggleHints: () => void;
  heroName: string;
  heroSprite: HeroSprite;
  stars: number;
}

const TABS: { id: GameTab; label: string; icon: React.ElementType }[] = [
  { id: 'rpg', label: 'Пригода', icon: MessageSquare },
  { id: 'satchel', label: 'Торба', icon: Backpack },
  { id: 'map', label: 'Штаб', icon: MapIcon },
  { id: 'universals', label: 'Універсали', icon: Scroll },
  { id: 'tree', label: 'Дерево Долі', icon: GitBranch },
  { id: 'archive', label: 'Архів', icon: BookOpen },
];

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  currentChapter,
  isAlternateHistory,
  activeTab,
  onSelectTab,
  isMuted,
  onToggleMute,
  showHints,
  onToggleHints,
  heroName,
  heroSprite,
  stars,
}) => {
  const chapterInfo = CHAPTER_CONFIG[currentChapter];
  const rank = getRank(stars);

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-amber-900/80 bg-stone-950/95 text-stone-200 backdrop-blur-md">
      <div className="flag-strip" />
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-3 sm:px-4 py-2">
        {/* Герой */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              onSelectTab('satchel');
            }}
            className="flex items-center gap-2 text-left"
            title="Відкрити Торбу джури"
          >
            <PixelAvatar id={heroSprite} size="sm" />
            <div>
              <div className="font-serif text-sm sm:text-base font-bold text-amber-200 leading-tight">{heroName}</div>
              <div className="flex items-center gap-2 text-[11px] text-stone-400">
                <span>{rank.title}</span>
                <motion.span
                  key={stars}
                  initial={{ scale: 1.6, color: '#fde047' }}
                  animate={{ scale: 1, color: '#fcd34d' }}
                  className="flex items-center gap-0.5 font-bold"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {stars}
                </motion.span>
                <span className="hidden sm:inline">· {chapterInfo?.period}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5 lg:hidden">
            {isAlternateHistory && (
              <span title="Ти змінив(-ла) хід історії" className="border border-amber-600/60 bg-amber-950/50 px-1.5 py-1 text-[10px] text-amber-200">
                ⚡
              </span>
            )}
            <IconToggle
              on={showHints}
              onClick={onToggleHints}
              labelOn="Сховати підказки"
              labelOff="Показати підказки"
              iconOn={Lightbulb}
              iconOff={LightbulbOff}
            />
            <IconToggle on={!isMuted} onClick={onToggleMute} labelOn="Вимкнути звук" labelOff="Увімкнути звук" iconOn={Volume2} iconOff={VolumeX} />
          </div>
        </div>

        {/* Навігація */}
        <nav aria-label="Головна навігація" className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sound.playSelect();
                  onSelectTab(t.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
                  active ? 'border-amber-400 bg-stone-800 text-amber-300' : 'border-transparent text-stone-300 hover:bg-stone-900 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-1.5">
          {isAlternateHistory && (
            <span
              title="Твої рішення відхилилися від того, як було насправді"
              className="inline-flex items-center gap-1 border border-amber-600/60 bg-amber-950/50 px-2 py-1 text-[11px] text-amber-200"
            >
              ⚡ Альтернатива
            </span>
          )}
          <IconToggle
            on={showHints}
            onClick={onToggleHints}
            labelOn="Сховати підказки"
            labelOff="Показати підказки"
            iconOn={Lightbulb}
            iconOff={LightbulbOff}
          />
          <IconToggle on={!isMuted} onClick={onToggleMute} labelOn="Вимкнути звук" labelOff="Увімкнути звук" iconOn={Volume2} iconOff={VolumeX} />
        </div>
      </div>

      {/* Показники держави */}
      <div className="border-t border-stone-800/80 bg-stone-900/90 px-3 sm:px-4 py-1.5">
        <div className="mx-auto grid max-w-7xl grid-cols-5 gap-2 sm:gap-4 text-xs">
          {METRIC_META.map((m) => {
            const value = metrics[m.key];
            const low = value < 25;
            return (
              <div key={m.key} title={`${m.fullName}: ${m.kidHint}`} className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <span aria-hidden>{m.emoji}</span>
                  <span className="hidden md:inline text-stone-400 text-[11px]">{m.label}</span>
                  <motion.span
                    key={value}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className={`font-mono font-bold tabular-nums ${low ? 'text-rose-400' : 'text-stone-100'}`}
                  >
                    {value}
                  </motion.span>
                </span>
                <div className="h-1.5 w-full bg-stone-800 overflow-hidden">
                  <motion.div className={`h-full ${m.bar}`} animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};

const IconToggle: React.FC<{
  on: boolean;
  onClick: () => void;
  labelOn: string;
  labelOff: string;
  iconOn: React.ElementType;
  iconOff: React.ElementType;
}> = ({ on, onClick, labelOn, labelOff, iconOn: On, iconOff: Off }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={on ? labelOn : labelOff}
    title={on ? labelOn : labelOff}
    className="flex h-8 w-8 items-center justify-center border border-stone-700 bg-stone-900 text-stone-300 hover:border-amber-500 hover:text-amber-300"
  >
    {on ? <On className="h-4 w-4" /> : <Off className="h-4 w-4" />}
  </button>
);
