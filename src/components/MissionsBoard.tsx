/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DoorOpen, Lock } from './icons';
import { PixelAvatar } from './PixelAvatar';
import { ChapterId, Mission } from '../game/types';
import { MISSIONS } from '../game/missions';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { sound } from '../game/sound';
import { PixelEmoji } from './PixelEmoji';

interface MissionsBoardProps {
  missionsDone: string[];
  availableChapters: ChapterId[];
  onOpen: (mission: Mission) => void;
}

/** Дошка доручень: усі «коридори дверей» гри в одному місці. */
export const MissionsBoard: React.FC<MissionsBoardProps> = ({ missionsDone, availableChapters, onOpen }) => (
  <div className="space-y-6">
    <section className="bg-stone-900 pixel-frame overflow-hidden">
      <div className="embroidery-strip" />
      <div className="p-5 space-y-2">
        <h2 className="font-serif text-2xl font-bold text-amber-300">🚪 Доручення джури</h2>
        <p className="text-sm text-stone-300 max-w-3xl">
          Кожне доручення — це коридор дверей. За кожними дверима чекає випробування: полагодити дроти, сховатися від шпика, промчати степом на
          тачанці, промацати брід через Сиваш, прокрастися повз ліхтарі вартових, розшифрувати телеграму чи провести колону крізь туман. У тебе три серця. Виконане доручення відкриває 🔓 таємний варіант
          відповіді в розмовах свого акту.
        </p>
        <div className="text-sm text-amber-200">
          Виконано: <strong>{missionsDone.length}</strong> / {MISSIONS.length}
        </div>
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MISSIONS.map((m, i) => {
        const done = missionsDone.includes(m.id);
        const available = availableChapters.includes(m.chapterId);
        return (
          <article
            key={m.id}
            className={`flex flex-col gap-3 border-2 p-4 ${
              done ? 'border-emerald-700 bg-emerald-950/20' : available ? 'border-violet-700 bg-stone-900' : 'border-stone-800 bg-stone-950 opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <PixelAvatar id={m.giver} size="sm" />
              <div className="flex-1">
                <div className="text-xs text-stone-400">
                  {CHAPTER_CONFIG[m.chapterId].title.split(':')[0]} · {m.giverName}
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-100">{m.title}</h3>
              </div>
              <PixelEmoji emoji={done ? '🏆' : available ? '🚪' : '🔒'} size={36} className={available && !done ? 'px-bob' : ''} />
            </div>
            <div className="flex flex-wrap gap-1">
              {m.stations.map((s) => (
                <span key={s.id} title={s.title} className="flex h-8 w-8 items-center justify-center border border-stone-700 bg-stone-950 text-base">
                  {done ? <span className="font-pixel text-[8px] text-emerald-300">✓</span> : <PixelEmoji emoji={s.emoji} size={24} res={12} />}
                  {s.fork && <span className="sr-only"> (є бічні двері)</span>}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="text-xs text-amber-300">+{m.rewardStars} ⭐</span>
              {available ? (
                <button
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    onOpen(m);
                  }}
                  className={`pixel-btn flex items-center gap-1.5 border-2 px-3 py-1.5 text-sm font-bold ${
                    done ? 'border-stone-600 bg-stone-800 text-stone-200' : 'border-violet-300 bg-violet-600 text-white hover:bg-violet-500'
                  }`}
                >
                  <DoorOpen className="h-4 w-4" /> {done ? 'Ще раз' : 'Почати'}
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-stone-500">
                  <Lock className="h-3.5 w-3.5" /> Дійди до акту {i + 1}
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  </div>
);
