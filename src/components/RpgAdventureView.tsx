/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PixelAvatar } from './PixelAvatar';
import { Modal } from './Modal';
import { Artifact, ChapterId, DialogueChoice, DialogueStep, FactionId, GameMetrics, HeroSprite } from '../game/types';
import { CHAPTER_CONFIG, DIALOGUE_STEPS, FACTIONS } from '../game/historicalData';
import { BG_IMAGES, BG_TITLES } from '../game/assets';
import { COMPANION, getArtifactsForScene, getCompanionHint } from '../game/lore';
import { getMetricMeta } from '../game/metricsMeta';
import { sound } from '../game/sound';
import { Check, Compass, Lock, Search } from 'lucide-react';

interface RpgAdventureViewProps {
  currentChapter: ChapterId;
  currentStepId: string;
  onMakeChoice: (choice: DialogueChoice, stepTitle: string, year: string) => void;
  onJumpToChapter: (chapterId: ChapterId) => void;
  heroName: string;
  heroSprite: HeroSprite;
  foundArtifacts: string[];
  completedChapters: ChapterId[];
  onFindArtifact: (artifact: Artifact) => void;
  showHints: boolean;
}

const ALL_CHAPTERS = Object.keys(CHAPTER_CONFIG) as ChapterId[];

/** Скільки кроків (розмов) у поточному акті та котрий зараз. */
function getStepProgress(chapter: ChapterId, stepId: string): { index: number; total: number } {
  const start = CHAPTER_CONFIG[chapter]?.startStepId;
  if (!start) return { index: 1, total: 1 };
  const chain: string[] = [];
  let cur: string | undefined = start;
  while (cur && DIALOGUE_STEPS[cur] && !chain.includes(cur)) {
    chain.push(cur);
    const nextId: string | undefined = DIALOGUE_STEPS[cur].choices[0]?.nextStepId;
    const isNextChapterStart = ALL_CHAPTERS.some((c) => CHAPTER_CONFIG[c].startStepId === nextId);
    if (!nextId || isNextChapterStart) break;
    cur = nextId;
  }
  const idx = chain.indexOf(stepId);
  return { index: idx >= 0 ? idx + 1 : 1, total: Math.max(chain.length, 1) };
}

export const RpgAdventureView: React.FC<RpgAdventureViewProps> = ({
  currentChapter,
  currentStepId,
  onMakeChoice,
  onJumpToChapter,
  heroName,
  heroSprite,
  foundArtifacts,
  completedChapters,
  onFindArtifact,
  showHints,
}) => {
  const step: DialogueStep = DIALOGUE_STEPS[currentStepId] || DIALOGUE_STEPS.step_ch1_1;
  const chapterInfo = CHAPTER_CONFIG[currentChapter];
  const bgKey = step.bgImageKey || chapterInfo?.bgKey || 'rada';
  const sceneArtifacts = getArtifactsForScene(bgKey);
  const foundHere = sceneArtifacts.filter((a) => foundArtifacts.includes(a.id)).length;
  const progress = getStepProgress(currentChapter, currentStepId);
  const hint = getCompanionHint(step.id);

  // Ефект друкарської машинки
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [hintOpen, setHintOpen] = useState(false);
  const [openedArtifact, setOpenedArtifact] = useState<Artifact | null>(null);
  const [artifactIsNew, setArtifactIsNew] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);
    setHintOpen(false);

    const fullSpeech = step.speech;
    const interval = setInterval(() => {
      index += 2;
      if (index <= fullSpeech.length) {
        setDisplayedText(fullSpeech.slice(0, index));
        if (index % 6 === 0) {
          sound.playBlip(380 + (index % 5) * 15);
        }
      } else {
        setDisplayedText(fullSpeech);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22);
    typingTimer.current = interval;

    return () => clearInterval(interval);
  }, [step.speech, currentStepId]);

  const handleSkipTyping = () => {
    if (isTyping) {
      if (typingTimer.current) clearInterval(typingTimer.current);
      setDisplayedText(step.speech);
      setIsTyping(false);
    }
  };

  const handleSelectChoice = (choice: DialogueChoice) => {
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    sound.playChoiceMade();
    onMakeChoice(choice, chapterInfo?.title || 'Подія революції', chapterInfo?.period || '1917–1921');
  };

  // Клавіші 1/2/3 для швидкого вибору
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= step.choices.length) {
        handleSelectChoice(step.choices[n - 1]);
      } else if (e.key === ' ' && isTyping) {
        e.preventDefault();
        handleSkipTyping();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleArtifactClick = (artifact: Artifact) => {
    const isNew = !foundArtifacts.includes(artifact.id);
    sound.playStar();
    setOpenedArtifact(artifact);
    setArtifactIsNew(isNew);
    if (isNew) onFindArtifact(artifact);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Хроніка актів */}
      <nav aria-label="Хроніка актів" className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ALL_CHAPTERS.map((cid, idx) => {
          const cfg = CHAPTER_CONFIG[cid];
          const isActive = cid === currentChapter;
          const isDone = completedChapters.includes(cid);
          return (
            <button
              key={cid}
              type="button"
              onClick={() => {
                sound.playSelect();
                onJumpToChapter(cid);
              }}
              title={`${cfg.period} — ${cfg.title}`}
              className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 text-xs border-2 transition-colors ${
                isActive
                  ? 'border-amber-400 bg-amber-500 text-stone-950 font-bold'
                  : isDone
                  ? 'border-emerald-700 bg-emerald-950/60 text-emerald-200 hover:border-emerald-500'
                  : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
            >
              {isDone && !isActive && <Check className="h-3 w-3" />}
              {idx === ALL_CHAPTERS.length - 1 ? 'Епілог' : `Акт ${idx + 1}`}
            </button>
          );
        })}
      </nav>

      <div className="relative overflow-hidden bg-stone-950 pixel-frame">
        {/* Сцена */}
        <div className="relative h-[260px] sm:h-[360px] md:h-[440px] w-full overflow-hidden bg-stone-900">
          <AnimatePresence mode="wait">
            <motion.img
              key={bgKey}
              src={BG_IMAGES[bgKey]}
              alt={BG_TITLES[bgKey]}
              className="absolute inset-0 h-full w-full object-cover object-center"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          </AnimatePresence>
          {bgKey === 'kruty' && <div className="snow-layer pointer-events-none absolute inset-0" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
          <div className="pointer-events-none absolute inset-0 opacity-10 [background:repeating-linear-gradient(0deg,#000_0px,#000_2px,transparent_2px,transparent_4px)]" />

          {/* Знахідки на картині */}
          {showSearch &&
            sceneArtifacts.map((a) => {
              const found = foundArtifacts.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleArtifactClick(a)}
                  aria-label={found ? `Знахідка: ${a.name}` : 'Таємнича знахідка'}
                  title={found ? a.name : 'Що це сяє?'}
                  style={{ left: `${a.x}%`, top: `${a.y}%` }}
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border-2 text-xl ${
                    found
                      ? 'border-emerald-400/70 bg-stone-950/70'
                      : 'border-amber-300 bg-amber-400/30 animate-sparkle'
                  }`}
                >
                  {found ? a.emoji : '✨'}
                </button>
              );
            })}

          {/* Верхня плашка */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2">
            <div className="bg-stone-950/90 border-2 border-amber-800 px-3 py-1.5 text-xs sm:text-sm">
              <div className="font-serif font-bold text-amber-300">{chapterInfo?.title}</div>
              <div className="text-stone-300">
                {chapterInfo?.period} · розмова {progress.index} з {progress.total}
              </div>
            </div>
            {sceneArtifacts.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  setShowSearch((v) => !v);
                }}
                aria-pressed={showSearch}
                className={`pixel-btn flex items-center gap-1.5 border-2 px-3 py-1.5 text-xs sm:text-sm font-semibold ${
                  showSearch
                    ? 'border-amber-300 bg-amber-500 text-stone-950'
                    : 'border-amber-700 bg-stone-950/90 text-amber-200 hover:border-amber-400'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>
                  Знахідки {foundHere}/{sceneArtifacts.length}
                </span>
              </button>
            )}
          </div>

          {/* Персонажі */}
          <div className="absolute bottom-3 left-3 sm:left-6 flex items-end gap-3">
            <motion.div key={step.avatar} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <PixelAvatar id={step.avatar} size="lg" className="border-amber-400 shadow-2xl" />
            </motion.div>
            <div className="bg-stone-950/90 border-2 border-amber-800 px-3 py-2 max-w-[11rem] sm:max-w-xs">
              <div className="font-serif text-sm sm:text-base font-bold text-amber-200 leading-tight">{step.speaker}</div>
              <div className="text-[11px] sm:text-xs text-stone-400 leading-tight">{step.role}</div>
            </div>
          </div>

          <div className="absolute bottom-3 right-3 sm:right-6 flex items-end gap-2">
            {hint && (
              <button
                type="button"
                onClick={() => {
                  sound.playCoo();
                  setHintOpen((v) => !v);
                }}
                aria-expanded={hintOpen}
                title={`Спитати ${COMPANION.name}а`}
                className="flex flex-col items-center gap-1"
              >
                <PixelAvatar id="pigeon" size="md" className="animate-flap border-sky-400" />
                <span className="bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Що це?</span>
              </button>
            )}
            <div className="hidden sm:flex flex-col items-center gap-1">
              <PixelAvatar id={heroSprite} size="md" />
              <span className="bg-stone-950/90 px-1.5 py-0.5 text-[10px] text-stone-200">{heroName}</span>
            </div>
          </div>
        </div>

        {/* Підказка голуба */}
        <AnimatePresence>
          {hintOpen && hint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t-2 border-sky-700 bg-sky-950/80"
            >
              <div className="flex gap-3 p-4">
                <span className="text-2xl" aria-hidden>
                  🕊️
                </span>
                <p className="text-sm sm:text-base text-sky-50 leading-relaxed">
                  <strong className="text-sky-300">{COMPANION.name}: </strong>
                  {hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Діалог і вибір */}
        <div className="border-t-2 border-amber-900/80 bg-stone-950 p-4 sm:p-6 text-stone-200">
          {step.contextNote && (
            <div className="mb-3 border-l-4 border-amber-600 bg-stone-900/70 px-3 py-2 text-xs sm:text-sm text-stone-300 italic">
              📍 {step.contextNote}
            </div>
          )}

          <button type="button" onClick={handleSkipTyping} className="w-full text-left cursor-pointer group">
            <p className="font-serif text-base sm:text-xl leading-relaxed text-stone-50 min-h-[5rem]">
              «{displayedText}»
              {isTyping && <span className="inline-block w-2 h-5 bg-amber-400 ml-1 animate-pulse align-middle" />}
            </p>
            {isTyping && (
              <span className="text-xs text-stone-500 group-hover:text-amber-400 transition-colors">
                Натисни на текст або пробіл, щоб показати все одразу
              </span>
            )}
          </button>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-300">
              <Compass className="h-4 w-4 text-amber-400" />
              <span>{heroName}, що порадиш? Обери рішення:</span>
            </div>

            <div className={`grid grid-cols-1 gap-3 transition-opacity ${isTyping ? 'opacity-50' : 'opacity-100'}`}>
              {step.choices.map((choice, idx) => (
                <motion.button
                  key={choice.id}
                  type="button"
                  onClick={() => handleSelectChoice(choice)}
                  whileHover={{ x: isTyping ? 0 : 4 }}
                  className="pixel-btn group relative flex flex-col text-left border-2 border-stone-700 bg-stone-900 p-3.5 sm:p-4 hover:border-amber-400 hover:bg-stone-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-amber-500 font-pixel text-[10px] text-stone-950">
                      {isTyping ? <Lock className="h-3.5 w-3.5" /> : idx + 1}
                    </span>
                    <span className="flex-1 font-semibold text-sm sm:text-base text-stone-100 group-hover:text-amber-100 leading-snug">
                      {choice.text}
                    </span>
                    {choice.historicalCanon ? (
                      <span className="shrink-0 text-[10px] uppercase font-mono border border-stone-600 bg-stone-800 px-2 py-0.5 text-stone-200">
                        📜 Як було
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] uppercase font-mono border border-amber-700 bg-amber-950 px-2 py-0.5 text-amber-300">
                        ⚡ А якби?
                      </span>
                    )}
                  </div>

                  {showHints && choice.ideologicalHint && (
                    <p className="mt-2 pl-10 text-xs sm:text-sm text-stone-400 leading-normal">{choice.ideologicalHint}</p>
                  )}

                  {showHints && (
                    <div className="mt-2.5 pl-10 flex flex-wrap items-center gap-1.5 text-xs">
                      {(Object.entries(choice.metricEffects) as [keyof GameMetrics, number][]).map(([k, v]) => {
                        const meta = getMetricMeta(k);
                        return (
                          <span
                            key={k}
                            title={meta.kidHint}
                            className={`border px-1.5 py-0.5 font-mono ${
                              v > 0 ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300' : 'border-rose-800 bg-rose-950/60 text-rose-300'
                            }`}
                          >
                            {meta.emoji} {meta.label} {v > 0 ? `+${v}` : v}
                          </span>
                        );
                      })}
                      {(Object.entries(choice.factionEffects) as [FactionId, number][])
                        .filter(([, v]) => Math.abs(v) >= 15)
                        .map(([fid, v]) => (
                          <span key={fid} className="text-stone-500" title={FACTIONS[fid].name}>
                            {v > 0 ? '😊' : '😠'} {FACTIONS[fid].name.split(' ')[0]}
                          </span>
                        ))}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Модальне вікно знахідки */}
      <Modal
        open={openedArtifact !== null}
        onClose={() => setOpenedArtifact(null)}
        title={openedArtifact ? `${openedArtifact.emoji} ${openedArtifact.name}` : ''}
        maxWidth="max-w-lg"
      >
        {openedArtifact && (
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14 }}
              className="text-7xl"
            >
              {openedArtifact.emoji}
            </motion.div>
            <p className="text-base leading-relaxed text-stone-200 text-left">{openedArtifact.fact}</p>
            <div className="text-sm text-amber-300">
              {artifactIsNew
                ? `Знахідку додано до твоєї Торби 🎒 (+${openedArtifact.stars} ⭐)`
                : 'Ця знахідка вже лежить у твоїй Торбі 🎒'}
            </div>
            <button
              type="button"
              onClick={() => setOpenedArtifact(null)}
              className="pixel-btn border-2 border-amber-400 bg-amber-500 px-6 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
            >
              Цікаво!
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};
