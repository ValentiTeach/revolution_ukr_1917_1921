/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PixelAvatar } from './PixelAvatar';
import { Modal } from './Modal';
import { Artifact, ChapterId, Mission, DialogueChoice, DialogueStep, FactionId, GameMetrics, HeroSprite } from '../game/types';
import { CHAPTER_CONFIG, DIALOGUE_STEPS, FACTIONS } from '../game/historicalData';
import { BG_IMAGES, BG_TITLES } from '../game/assets';
import { COMPANION, getArtifactsForScene, getCompanionHint } from '../game/lore';
import { getMetricMeta } from '../game/metricsMeta';
import { sound } from '../game/sound';
import { Check, Compass, DoorOpen, HelpCircle, Lock, Search } from './icons';
import { PixelEmoji } from './PixelEmoji';
import { pxEase } from '../game/motion';

interface RpgAdventureViewProps {
  currentChapter: ChapterId;
  currentStepId: string;
  onMakeChoice: (choice: DialogueChoice, stepTitle: string, year: string) => void;
  onJumpToChapter: (chapterId: ChapterId) => void;
  isChapterOpen: (chapterId: ChapterId) => boolean;
  heroName: string;
  heroSprite: HeroSprite;
  foundArtifacts: string[];
  completedChapters: ChapterId[];
  onFindArtifact: (artifact: Artifact) => void;
  showHints: boolean;
  isChoiceUnlocked: (choice: DialogueChoice) => boolean;
  mission?: Mission;
  missionDone: boolean;
  onOpenMission: () => void;
  questionsAsked: string[];
  onAskQuestion: (questionId: string) => void;
}

/** Позначка типу варіанта відповіді. */
function ChoiceBadge({ choice }: { choice: DialogueChoice }) {
  const base = 'shrink-0 text-[10px] uppercase font-mono border px-2 py-0.5';
  if (choice.historicalCanon) return <span className={`${base} border-stone-600 bg-stone-800 text-stone-200`}>📜 Як було</span>;
  if (choice.style === 'secret') return <span className={`${base} border-violet-600 bg-violet-950 text-violet-200`}>🔓 Таємний</span>;
  if (choice.style === 'compromise') return <span className={`${base} border-sky-700 bg-sky-950 text-sky-200`}>🤝 Компроміс</span>;
  if (choice.style === 'daring') return <span className={`${base} border-rose-700 bg-rose-950 text-rose-200`}>🔥 Сміливо</span>;
  return <span className={`${base} border-amber-700 bg-amber-950 text-amber-300`}>⚡ А якби?</span>;
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
  isChapterOpen,
  heroName,
  heroSprite,
  foundArtifacts,
  completedChapters,
  onFindArtifact,
  showHints,
  isChoiceUnlocked,
  mission,
  missionDone,
  onOpenMission,
  questionsAsked,
  onAskQuestion,
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
  const [openAnswer, setOpenAnswer] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);
    setHintOpen(false);
    setOpenAnswer(null);

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
    if (!isChoiceUnlocked(choice)) {
      sound.playWrong();
      return;
    }
    if (isTyping) {
      handleSkipTyping();
      return;
    }
    sound.playChoiceMade();
    onMakeChoice(choice, chapterInfo?.title || 'Подія революції', chapterInfo?.period || '1917–1921');
  };

  // Клавіші 1–4 для швидкого вибору
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
          const isOpen = isChapterOpen(cid);
          return (
            <button
              key={cid}
              type="button"
              onClick={() => onJumpToChapter(cid)}
              aria-disabled={!isOpen}
              title={isOpen ? `${cfg.period} — ${cfg.title}` : 'Відкриється, коли пройдеш попередній акт'}
              className={`pixel-btn flex items-center gap-1 whitespace-nowrap px-2.5 py-1.5 text-xs border-2 ${
                isActive
                  ? 'border-amber-300 bg-amber-500 text-stone-950 font-bold'
                  : !isOpen
                  ? 'border-stone-900 bg-stone-950 text-stone-600 cursor-not-allowed'
                  : isDone
                  ? 'border-emerald-700 bg-emerald-950/60 text-emerald-200 hover:border-emerald-500'
                  : 'border-stone-700 bg-stone-900 text-stone-300 hover:border-amber-500'
              }`}
            >
              {!isOpen && <Lock className="h-3 w-3" />}
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
              className="px-pan pixelated absolute inset-0 h-full w-full object-cover object-center"
              initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: pxEase(8) }}
            />
          </AnimatePresence>
          {/* Атмосфера сцени */}
          {bgKey === 'kruty' && <div className="px-snow" />}
          {bgKey === 'rada' && <div className="px-flicker pointer-events-none absolute inset-0" />}
          {(bgKey === 'hero' || bgKey === 'rada') && <div className="px-dust" />}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
          <div className="px-crt pointer-events-none absolute inset-0" />

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
                  className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center border-2 ${
                    found
                      ? 'border-emerald-400 bg-stone-950/80'
                      : 'border-yellow-300 bg-amber-500/40 animate-sparkle'
                  }`}
                >
                  <PixelEmoji emoji={found ? a.emoji : '✨'} size={30} />
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
              <PixelAvatar id={step.avatar} size="lg" className="px-bob border-amber-400 shadow-[6px_6px_0_rgba(0,0,0,0.6)]" />
            </motion.div>
            <div className="px-notch bg-stone-950/95 border-2 border-amber-700 px-3 py-2 max-w-[11rem] sm:max-w-xs">
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
              <PixelAvatar id={heroSprite} size="md" className="px-bob" />
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
                <PixelEmoji emoji="🕊️" size={32} className="animate-flap" />
                <p className="text-sm sm:text-base text-sky-50 leading-relaxed">
                  <strong className="text-sky-300">{COMPANION.name}: </strong>
                  {hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Діалог і вибір */}
        <div key={step.id} className="px-open border-t-4 border-amber-800 bg-stone-950 p-4 sm:p-6 text-stone-200">
          {step.contextNote && (
            <div className="mb-3 border-l-4 border-amber-600 bg-stone-900/70 px-3 py-2 text-xs sm:text-sm text-stone-300 italic">
              📍 {step.contextNote}
            </div>
          )}

          <button type="button" onClick={handleSkipTyping} className="w-full text-left cursor-pointer group">
            <p className="font-serif text-base sm:text-xl leading-relaxed text-stone-50 min-h-[5rem]">
              «{displayedText}»
              {isTyping ? (
                <span className="px-blink ml-1 inline-block h-5 w-3 bg-amber-400 align-middle" />
              ) : (
                <span className="px-cursor ml-2 inline-block text-amber-400">▼</span>
              )}
            </p>
            {isTyping && (
              <span className="text-xs text-stone-500 group-hover:text-amber-400 transition-colors">
                Натисни на текст або пробіл, щоб показати все одразу
              </span>
            )}
          </button>

          {/* Питання до персонажа */}
          {step.questions && step.questions.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-300">
                <HelpCircle className="h-4 w-4 text-sky-400" />
                <span>Розпитати перед рішенням:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {step.questions.map((q) => {
                  const asked = questionsAsked.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        sound.playBlip(560);
                        setOpenAnswer(openAnswer === q.id ? null : q.id);
                        if (!asked) onAskQuestion(q.id);
                      }}
                      aria-expanded={openAnswer === q.id}
                      className={`border-2 px-3 py-1.5 text-left text-sm ${
                        openAnswer === q.id
                          ? 'border-sky-400 bg-sky-900 text-white'
                          : asked
                          ? 'border-stone-700 bg-stone-900 text-stone-400'
                          : 'border-sky-800 bg-sky-950/60 text-sky-100 hover:border-sky-400'
                      }`}
                    >
                      {asked ? '✓ ' : '❓ '}
                      {q.q}
                    </button>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                {openAnswer && (
                  <motion.div
                    key={openAnswer}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3 border-l-4 border-sky-500 bg-stone-900 p-3"
                  >
                    <PixelAvatar id={step.avatar} size="sm" />
                    <p className="font-serif text-sm sm:text-base leading-relaxed text-stone-100">
                      «{step.questions.find((q) => q.id === openAnswer)?.a}»
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Доручення акту */}
          {mission && (
            <div
              className={`mt-4 flex flex-col sm:flex-row sm:items-center gap-3 border-2 p-3 ${
                missionDone ? 'border-emerald-800 bg-emerald-950/30' : 'border-violet-700 bg-violet-950/30'
              }`}
            >
              <PixelEmoji emoji={missionDone ? '🏆' : '🚪'} size={44} className={missionDone ? '' : 'px-bob'} />
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider text-violet-300">Доручення акту · {mission.stations.length} дверей</div>
                <div className="font-serif text-base font-bold text-stone-100">{mission.title}</div>
                <div className="text-xs text-stone-400">
                  {missionDone ? 'Виконано! Таємний варіант відповіді відкрито.' : `Пройди всі двері — відкриєш таємний варіант відповіді та +${mission.rewardStars} ⭐`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  onOpenMission();
                }}
                className={`pixel-btn flex items-center justify-center gap-2 border-2 px-4 py-2 text-sm font-bold ${
                  missionDone ? 'border-stone-600 bg-stone-800 text-stone-200' : 'border-violet-300 bg-violet-600 text-white hover:bg-violet-500'
                }`}
              >
                <DoorOpen className="h-4 w-4" /> {missionDone ? 'Пройти ще раз' : 'Виконати'}
              </button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-300">
              <Compass className="h-4 w-4 text-amber-400" />
              <span>
                {heroName}, що порадиш? Обери рішення ({step.choices.filter(isChoiceUnlocked).length} з {step.choices.length} доступно):
              </span>
            </div>

            <div className={`grid grid-cols-1 gap-3 transition-opacity ${isTyping ? 'opacity-60' : 'opacity-100'}`}>
              {step.choices.map((choice, idx) => {
                const unlocked = isChoiceUnlocked(choice);
                if (!unlocked) {
                  return (
                    <div
                      key={choice.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 border-2 border-dashed border-violet-800 bg-stone-950 p-3.5 text-left"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-violet-900 text-violet-200">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-violet-200">🔒 Таємний варіант</div>
                        <div className="text-xs text-stone-400">Щоб відкрити: {choice.requires?.label}</div>
                      </div>
                      {choice.requires?.mission && mission && choice.requires.mission === mission.id && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playSelect();
                            onOpenMission();
                          }}
                          className="pixel-btn flex items-center gap-1.5 border-2 border-violet-400 bg-violet-700 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          <DoorOpen className="h-4 w-4" /> До дверей
                        </button>
                      )}
                    </div>
                  );
                }
                return (
                  <motion.button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className={`pixel-btn group relative flex flex-col text-left border-2 p-3.5 sm:p-4 hover:bg-stone-800 ${
                      choice.style === 'secret'
                        ? 'border-violet-500 bg-violet-950/40 hover:border-violet-300'
                        : 'border-stone-700 bg-stone-900 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="px-cursor absolute left-1 top-4 hidden text-amber-300 group-hover:inline group-focus-visible:inline" aria-hidden>
                        ▶
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-amber-500 font-pixel text-[10px] text-stone-950 shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.35)]">
                        {isTyping ? <Lock className="h-3.5 w-3.5" /> : idx + 1}
                      </span>
                      <span className="flex-1 font-semibold text-sm sm:text-base text-stone-100 group-hover:text-amber-100 leading-snug">
                        {choice.text}
                      </span>
                      <ChoiceBadge choice={choice} />
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
                );
              })}
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
            <div className="flex justify-center">
              <div className="px-pop border-4 border-amber-600 bg-stone-950 p-3 shadow-[6px_6px_0_rgba(0,0,0,0.6)]">
                <PixelEmoji emoji={openedArtifact.emoji} size={112} res={20} />
              </div>
            </div>
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
