/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Backpack, BookOpen, Medal, Star } from 'lucide-react';
import { PixelAvatar } from './PixelAvatar';
import { Modal } from './Modal';
import { Artifact, ChapterId, HeroSprite } from '../game/types';
import { ACHIEVEMENTS, ARTIFACTS, DIARY_ENTRIES } from '../game/lore';
import { BG_TITLES } from '../game/assets';
import { HERO_RANKS, getNextRank, getRank } from '../game/rules';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { sound } from '../game/sound';

interface SatchelViewProps {
  heroName: string;
  heroSprite: HeroSprite;
  stars: number;
  artifacts: string[];
  achievements: string[];
  completedChapters: ChapterId[];
  onRename: () => void;
}

type Tab = 'artifacts' | 'medals' | 'diary';

export const SatchelView: React.FC<SatchelViewProps> = ({
  heroName,
  heroSprite,
  stars,
  artifacts,
  achievements,
  completedChapters,
  onRename,
}) => {
  const [tab, setTab] = useState<Tab>('artifacts');
  const [opened, setOpened] = useState<Artifact | null>(null);
  const rank = getRank(stars);
  const next = getNextRank(stars);
  const progressToNext = next ? Math.round(((stars - rank.minStars) / (next.minStars - rank.minStars)) * 100) : 100;
  const unlockedDiary = DIARY_ENTRIES.filter(
    (d) => completedChapters.includes(d.chapterId) || (d.chapterId === 'EPILOGUE' && completedChapters.includes('CH9_TRIANGLE_OF_DEATH')),
  );

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: string }[] = [
    { id: 'artifacts', label: 'Знахідки', icon: Backpack, count: `${artifacts.length}/${ARTIFACTS.length}` },
    { id: 'medals', label: 'Медалі', icon: Medal, count: `${achievements.length}/${ACHIEVEMENTS.length}` },
    { id: 'diary', label: 'Щоденник', icon: BookOpen, count: `${unlockedDiary.length}/${DIARY_ENTRIES.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Картка героя */}
      <section className="bg-stone-900 pixel-frame overflow-hidden">
        <div className="embroidery-strip" />
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
          <PixelAvatar id={heroSprite} size="lg" className="animate-float" />
          <div className="flex-1 w-full space-y-2 text-center sm:text-left">
            <div className="font-pixel text-[10px] text-amber-400">ЗВАННЯ: {rank.title.toUpperCase()}</div>
            <h2 className="font-serif text-2xl font-bold text-amber-200">
              {heroName}{' '}
              <button type="button" onClick={onRename} className="text-xs font-sans font-normal text-stone-400 underline hover:text-amber-300">
                змінити
              </button>
            </h2>
            <p className="text-sm text-stone-300">{rank.description}</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="flex items-center gap-1 text-amber-300 font-bold text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {stars}
                </span>
                <span>{next ? `до звання «${next.title}»: ще ${next.minStars - stars} ⭐` : 'Найвище звання здобуто!'}</span>
              </div>
              <div className="h-3 bg-stone-800 border border-stone-700 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Драбина звань */}
        <div className="flex overflow-x-auto scrollbar-none border-t border-stone-800">
          {HERO_RANKS.map((r) => {
            const reached = stars >= r.minStars;
            return (
              <div
                key={r.id}
                className={`flex-1 min-w-[96px] px-2 py-2 text-center text-[11px] border-r border-stone-800 ${
                  r.id === rank.id ? 'bg-amber-500 text-stone-950 font-bold' : reached ? 'bg-stone-800 text-amber-200' : 'text-stone-500'
                }`}
              >
                <div>{r.title}</div>
                <div className="opacity-80">{r.minStars} ⭐</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Вкладки */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                sound.playSelect();
                setTab(t.id);
              }}
              className={`pixel-btn flex items-center gap-2 border-2 px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                tab === t.id ? 'border-amber-400 bg-amber-500 text-stone-950' : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className="font-mono text-xs opacity-80">{t.count}</span>
            </button>
          );
        })}
      </div>

      {tab === 'artifacts' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-400">
            Знахідки сховані на картинах сцен. Під час розмови натисни кнопку «🔍 Знахідки», щоб побачити, де щось сяє.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ARTIFACTS.map((a) => {
              const has = artifacts.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!has}
                  onClick={() => {
                    sound.playSelect();
                    setOpened(a);
                  }}
                  className={`flex flex-col items-center gap-2 border-2 p-3 text-center ${
                    has ? 'border-amber-700 bg-stone-900 hover:border-amber-400' : 'border-dashed border-stone-800 bg-stone-950'
                  }`}
                >
                  <span className={`text-4xl ${has ? '' : 'grayscale opacity-20'}`}>{has ? a.emoji : '❔'}</span>
                  <span className={`text-xs leading-tight ${has ? 'text-stone-100' : 'text-stone-600'}`}>
                    {has ? a.name : BG_TITLES[a.bgKey]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'medals' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((m) => {
            const has = achievements.includes(m.id);
            return (
              <div
                key={m.id}
                className={`flex items-center gap-3 border-2 p-3 ${has ? 'border-sky-600 bg-sky-950/40' : 'border-stone-800 bg-stone-950'}`}
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-3xl ${
                  has ? 'border-yellow-400 bg-amber-900/60' : 'border-stone-700 grayscale opacity-30'
                }`}>
                  {m.emoji}
                </span>
                <div>
                  <div className={`font-bold ${has ? 'text-sky-100' : 'text-stone-500'}`}>{m.title}</div>
                  <div className="text-xs text-stone-400">{m.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'diary' && (
        <div className="space-y-4">
          {unlockedDiary.length === 0 && (
            <p className="text-sm text-stone-400">Щоденник порожній. Заверши перший акт — і зʼявиться перший запис.</p>
          )}
          {unlockedDiary.map((d) => (
            <article key={d.chapterId} className="parchment border-2 border-amber-900/60 p-5">
              <div className="flex items-center justify-between text-xs text-amber-900/80 border-b border-amber-900/30 pb-1 mb-2">
                <span>{CHAPTER_CONFIG[d.chapterId].title.split(':')[0]}</span>
                <span className="italic">{d.date}</span>
              </div>
              <h3 className="handwriting text-2xl font-bold">{d.title}</h3>
              <p className="handwriting text-xl leading-snug">{d.text}</p>
            </article>
          ))}
        </div>
      )}

      <Modal open={opened !== null} onClose={() => setOpened(null)} title={opened ? `${opened.emoji} ${opened.name}` : ''} maxWidth="max-w-lg">
        {opened && (
          <div className="space-y-3">
            <div className="text-center text-7xl">{opened.emoji}</div>
            <div className="text-xs text-stone-400 text-center">Знайдено: {BG_TITLES[opened.bgKey]}</div>
            <p className="text-base leading-relaxed text-stone-200">{opened.fact}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};
