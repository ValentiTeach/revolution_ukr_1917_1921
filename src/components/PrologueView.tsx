/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Shuffle } from 'lucide-react';
import { PixelAvatar } from './PixelAvatar';
import { COMPANION, DEFAULT_HERO_NAMES } from '../game/lore';
import { BG_IMAGES } from '../game/assets';
import { HeroSprite } from '../game/types';
import { sound } from '../game/sound';

interface PrologueViewProps {
  initialName: string;
  initialSprite: HeroSprite;
  onComplete: (name: string, sprite: HeroSprite) => void;
}

interface Page {
  bg: keyof typeof BG_IMAGES;
  speaker: 'narrator' | 'pigeon' | 'hrushevsky';
  text: (name: string) => string;
}

const PAGES: Page[] = [
  {
    bg: 'hero',
    speaker: 'narrator',
    text: () =>
      'Київ, весна 1917 року. Сніг тане, дзвонять дзвони Святої Софії, а люди на вулицях кажуть дивні, нові слова: «Царя більше немає!». Здається, сама історія відчинила вікно — і в нього ось-ось залетить щось важливе…',
  },
  {
    bg: 'hero',
    speaker: 'pigeon',
    text: (name) =>
      `${COMPANION.intro} А ти, мабуть, ${name}? Мені казали, що в Раді шукають спритного джуру — посильного, який носитиме листи найважливішим людям України.`,
  },
  {
    bg: 'rada',
    speaker: 'hrushevsky',
    text: (name) =>
      `Вітаю, ${name}! Я — Михайло Грушевський. Тут, у Педагогічному музеї, ми збираємо Центральну Раду. Ти побачиш, як народжується держава, і, хто знає, може, саме твоя порада змінить її долю. Головне — будь уважним: кожне рішення має наслідки.`,
  },
  {
    bg: 'rada',
    speaker: 'pigeon',
    text: () =>
      'Ось наш план, джуро! 🗝️ Обирай рішення в розмовах. ⭐ Збирай зірки, щоб отримувати нові звання — від Джури до Отамана Долі. 🔍 Шукай на картинах сяючі знахідки. 📔 Після кожного акту — сторінка щоденника, вікторина й міні-гра. А якщо щось незрозуміло — тисни на мене, я поясню!',
  },
];

export const PrologueView: React.FC<PrologueViewProps> = ({ initialName, initialSprite, onComplete }) => {
  const [stage, setStage] = useState<'create' | number>('create');
  const [name, setName] = useState(initialName);
  const [sprite, setSprite] = useState<HeroSprite>(initialSprite);

  const heroName = name.trim() || 'джуро';

  const randomName = () => {
    sound.playBlip(520);
    const pool = DEFAULT_HERO_NAMES.filter((n) => n !== name);
    setName(pool[Math.floor(Math.random() * pool.length)]);
  };

  if (stage === 'create') {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-stone-900 pixel-frame">
          <div className="embroidery-strip" />
          <div className="p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="font-pixel text-[10px] sm:text-xs text-amber-400 tracking-wider">ПРОЛОГ</div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">Хто ти, юний джуро?</h1>
              <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto">
                Джура — це юний помічник і посильний. Ти носитимеш листи Центральної Ради, слухатимеш великих людей і допомагатимеш їм приймати рішення.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {(['hero_boy', 'hero_girl'] as HeroSprite[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setSprite(s);
                  }}
                  aria-pressed={sprite === s}
                  className={`pixel-btn flex flex-col items-center gap-2 border-2 p-4 ${
                    sprite === s ? 'border-amber-400 bg-amber-950/50' : 'border-stone-700 bg-stone-950 hover:border-stone-500'
                  }`}
                >
                  <PixelAvatar id={s} size="lg" className={sprite === s ? 'animate-float' : ''} />
                  <span className="text-sm font-semibold">{s === 'hero_boy' ? 'Джура-хлопець' : 'Джура-дівчина'}</span>
                </button>
              ))}
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <label htmlFor="hero-name" className="block text-sm font-semibold text-stone-300">
                Як тебе звати?
              </label>
              <div className="flex gap-2">
                <input
                  id="hero-name"
                  type="text"
                  value={name}
                  maxLength={18}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Наприклад, Тарас або Орися"
                  className="flex-1 border-2 border-stone-700 bg-stone-950 px-3 py-2.5 text-base text-stone-100 focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={randomName}
                  title="Випадкове імʼя"
                  aria-label="Випадкове імʼя"
                  className="pixel-btn border-2 border-stone-700 bg-stone-950 px-3 text-stone-300 hover:border-amber-500 hover:text-amber-300"
                >
                  <Shuffle className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playFanfare();
                  setStage(0);
                }}
                className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-6 py-3 text-base font-bold text-stone-950 hover:bg-amber-400"
              >
                <span>Розпочати пригоду</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  onComplete(name.trim() || 'Джура', sprite);
                }}
                className="text-sm text-stone-400 underline-offset-4 hover:text-stone-200 hover:underline"
              >
                Пропустити вступ
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const page = PAGES[stage];
  const isLast = stage === PAGES.length - 1;
  const avatarId = page.speaker === 'pigeon' ? 'pigeon' : page.speaker === 'hrushevsky' ? 'hrushevsky' : sprite;
  const speakerName =
    page.speaker === 'pigeon' ? `${COMPANION.name}, ${COMPANION.species}` : page.speaker === 'hrushevsky' ? 'Михайло Грушевський' : 'Оповідач';

  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-stone-950 pixel-frame overflow-hidden">
        <div className="relative h-[240px] sm:h-[360px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={page.bg + stage}
              src={BG_IMAGES[page.bg]}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
          <div className="absolute top-3 right-3 font-pixel text-[10px] text-amber-300 bg-stone-950/80 px-2 py-1">
            {stage + 1} / {PAGES.length}
          </div>
        </div>
        <div className="p-5 sm:p-7 flex flex-col sm:flex-row gap-4 items-start">
          <PixelAvatar id={avatarId} size="lg" className={page.speaker === 'pigeon' ? 'animate-flap' : ''} />
          <div className="flex-1 space-y-3">
            <div className="text-sm font-bold text-amber-300">{speakerName}</div>
            <AnimatePresence mode="wait">
              <motion.p
                key={stage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-serif text-base sm:text-lg leading-relaxed text-stone-100"
              >
                {page.text(heroName)}
              </motion.p>
            </AnimatePresence>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playPage();
                  if (isLast) onComplete(name.trim() || 'Джура', sprite);
                  else setStage(stage + 1);
                  if (!isLast && PAGES[stage + 1].speaker === 'pigeon') sound.playCoo();
                }}
                className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 text-sm sm:text-base font-bold text-stone-950 hover:bg-amber-400"
              >
                <span>{isLast ? 'До Центральної Ради!' : 'Далі'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
