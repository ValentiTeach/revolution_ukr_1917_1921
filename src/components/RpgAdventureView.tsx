/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PixelAvatar } from './PixelAvatar';
import { ChapterId, DialogueChoice, DialogueStep } from '../game/types';
import { CHAPTER_CONFIG, DIALOGUE_STEPS } from '../game/historicalData';
import { sound } from '../game/sound';
import { Compass, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface RpgAdventureViewProps {
  currentChapter: ChapterId;
  currentStepId: string;
  onMakeChoice: (choice: DialogueChoice, stepTitle: string, year: string) => void;
  onJumpToChapter: (chapterId: ChapterId) => void;
  lastConsequence: string | null;
}

export const RpgAdventureView: React.FC<RpgAdventureViewProps> = ({
  currentChapter,
  currentStepId,
  onMakeChoice,
  onJumpToChapter,
  lastConsequence,
}) => {
  const step: DialogueStep = DIALOGUE_STEPS[currentStepId] || DIALOGUE_STEPS.step_ch1_1;
  const chapterInfo = CHAPTER_CONFIG[currentChapter];

  // Typewriter effect
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const fullSpeech = step.speech;
    const interval = setInterval(() => {
      index++;
      if (index <= fullSpeech.length) {
        setDisplayedText(fullSpeech.slice(0, index));
        if (index % 4 === 0) {
          sound.playBlip(380 + (index % 5) * 15);
        }
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [step.speech, currentStepId]);

  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedText(step.speech);
      setIsTyping(false);
    }
  };

  const handleSelectChoice = (choice: DialogueChoice) => {
    sound.playChoiceMade();
    onMakeChoice(choice, chapterInfo?.title || 'Подія революції', chapterInfo?.period || '1917–1921');
  };

  // Image mapping
  const bgImages = {
    hero: '/src/assets/images/hero_ukraine_revolution_1917_1794394443346.jpg',
    rada: '/src/assets/images/pixel_rada_hall_1917_1794394444860.jpg',
    map: '/src/assets/images/pixel_map_ukraine_1918_1794394445811.jpg',
    kruty: '/src/assets/images/pixel_kruty_station_1918_1794394445137.jpg',
  };

  const currentBg = bgImages[step.bgImageKey || chapterInfo?.bgKey || 'rada'];

  const allChapters = Object.keys(CHAPTER_CONFIG) as ChapterId[];

  return (
    <div className="flex flex-col gap-4">
      {/* Chapter timeline quick navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-400 font-medium whitespace-nowrap mr-1">Хроніка:</span>
        {allChapters.map((cid, idx) => {
          const cfg = CHAPTER_CONFIG[cid];
          const isActive = cid === currentChapter;
          return (
            <button
              key={cid}
              type="button"
              onClick={() => {
                sound.playSelect();
                onJumpToChapter(cid);
              }}
              title={`${cfg.period} — ${cfg.title}`}
              className={`whitespace-nowrap px-2.5 py-1 text-xs border transition-colors ${
                isActive
                  ? 'border-amber-400 bg-amber-950/80 text-amber-200 font-semibold'
                  : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              {idx === 9 ? 'Епілог' : `Акт ${idx + 1}`}
            </button>
          );
        })}
      </div>

      {/* Main RPG Visual Stage */}
      <div className="relative overflow-hidden border border-amber-950/80 bg-stone-950 shadow-xl">
        {/* Background pixel art scene with vintage overlay */}
        <div className="relative h-[280px] sm:h-[340px] md:h-[400px] w-full overflow-hidden bg-stone-900">
          <img
            src={currentBg}
            alt={chapterInfo?.title || 'Історична сцена'}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center filter contrast-105"
          />
          {/* Retro scanlines & vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-15 [background:repeating-linear-gradient(0deg,#000_0px,#000_2px,transparent_2px,transparent_4px)]" />

          {/* Scene Header Floating Badge */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="bg-stone-950/90 border border-amber-900/80 px-3 py-1.5 backdrop-blur-xs text-xs">
              <span className="font-serif font-bold text-amber-300">
                {chapterInfo?.title}
              </span>
              <span className="mx-2 text-stone-500">·</span>
              <span className="text-stone-300">{chapterInfo?.period}</span>
            </div>
            {lastConsequence && (
              <div className="hidden sm:flex items-center gap-1.5 bg-stone-900/90 border border-emerald-800/80 px-3 py-1 text-xs text-emerald-300 backdrop-blur-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="truncate max-w-xs">{lastConsequence}</span>
              </div>
            )}
          </div>

          {/* Character Stage representation */}
          <div className="absolute bottom-4 left-6 flex items-end gap-4">
            <PixelAvatar id={step.avatar} size="lg" className="border-2 border-amber-500 shadow-2xl" />
            <div className="bg-stone-950/90 border border-amber-900/80 p-2.5 backdrop-blur-sm max-w-sm">
              <div className="font-serif text-sm font-bold text-amber-200">{step.speaker}</div>
              <div className="text-xs text-stone-400">{step.role}</div>
            </div>
          </div>
        </div>

        {/* Dialogue & Decision Console */}
        <div className="border-t border-amber-950/90 bg-stone-950 p-4 sm:p-6 text-stone-200">
          {step.contextNote && (
            <div className="mb-3 border-l-2 border-amber-600/80 bg-stone-900/60 px-3 py-1.5 text-xs text-stone-400 italic">
              {step.contextNote}
            </div>
          )}

          {/* Speech Textbox with typewriter interaction */}
          <button
            type="button"
            onClick={handleSkipTyping}
            className="w-full text-left cursor-pointer group focus:outline-hidden"
          >
            <p className="font-serif text-base sm:text-lg leading-relaxed text-stone-100 min-h-[4rem]">
              «{displayedText}»
              {isTyping && <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />}
            </p>
            {isTyping && (
              <span className="text-[11px] text-stone-500 group-hover:text-amber-400 transition-colors">
                (Натисніть сюди, щоб показати весь текст)
              </span>
            )}
          </button>

          {/* Choices Tree Panel */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>Ваше рішення на роздоріжжі:</span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {step.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectChoice(choice)}
                  className="group relative flex flex-col text-left border border-stone-800 bg-stone-900/90 p-3.5 hover:border-amber-500 hover:bg-stone-850 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium text-sm text-stone-100 group-hover:text-amber-200 transition-colors leading-snug">
                      {choice.text}
                    </span>
                    {choice.historicalCanon ? (
                      <span className="shrink-0 text-[10px] uppercase font-mono tracking-wider border border-stone-700 bg-stone-800/80 px-2 py-0.5 text-stone-300">
                        📜 Канон
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase font-mono tracking-wider border border-amber-800 bg-amber-950/80 px-2 py-0.5 text-amber-300">
                        ⚡ Альтернатива
                      </span>
                    )}
                  </div>

                  {choice.ideologicalHint && (
                    <p className="mt-1.5 text-xs text-stone-400 leading-normal">
                      {choice.ideologicalHint}
                    </p>
                  )}

                  {/* Impact preview */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-stone-800/80 pt-2 text-[11px] text-stone-400">
                    <span className="text-stone-500">Вплив:</span>
                    {choice.metricEffects &&
                      Object.entries(choice.metricEffects).map(([k, v]) => (
                        <span
                          key={k}
                          className={v > 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}
                        >
                          {k === 'nationalUnity' && 'Єдність'}
                          {k === 'armyReadiness' && 'Армія'}
                          {k === 'diplomacy' && 'Дипломатія'}
                          {k === 'popularTrust' && 'Довіра'}
                          {k === 'treasury' && 'Скарбниця'}{' '}
                          {v > 0 ? `+${v}` : v}
                        </span>
                      ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
