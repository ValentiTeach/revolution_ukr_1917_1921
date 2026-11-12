/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Gamepad2, MessageSquare, Play, RotateCcw, Search, Volume2, VolumeX } from 'lucide-react';
import { MetricsBar, GameTab } from './components/MetricsBar';
import { FactionsPanel } from './components/FactionsPanel';
import { RpgAdventureView } from './components/RpgAdventureView';
import { DecisionTreeModal } from './components/DecisionTreeModal';
import { StaffMapQuest } from './components/StaffMapQuest';
import { UniversalDraftingRoom } from './components/UniversalDraftingRoom';
import { HistoricalArchiveModal } from './components/HistoricalArchiveModal';
import { EndingView } from './components/EndingView';
import { PrologueView } from './components/PrologueView';
import { ChapterInterlude } from './components/ChapterInterlude';
import { ChoiceOutcome, PendingOutcome } from './components/ChoiceOutcome';
import { SatchelView } from './components/SatchelView';
import { Toast, Toasts } from './components/Toasts';
import { Modal } from './components/Modal';
import { PixelAvatar } from './components/PixelAvatar';
import { Artifact, ChapterId, DialogueChoice, GameMetrics, HeroSprite } from './game/types';
import {
  createInitialGameState,
  applyChoiceToState,
  determineGameEnding,
  evaluateAchievements,
  getRank,
  migrateGameState,
  GameState,
  clamp,
} from './game/rules';
import { CHAPTER_CONFIG, DIALOGUE_STEPS } from './game/historicalData';
import { ACHIEVEMENTS, ARTIFACTS, COMPANION, getAchievement } from './game/lore';
import { BG_IMAGES } from './game/assets';
import { sound } from './game/sound';

const STORAGE_KEY = 'vilna_dolia_rpg_state_v2';
const LEGACY_STORAGE_KEY = 'vilna_dolia_rpg_state_v1';
const HINTS_KEY = 'vilna_dolia_show_hints';
const ALL_CHAPTERS = Object.keys(CHAPTER_CONFIG) as ChapterId[];

type Screen = 'title' | 'prologue' | 'game';

function loadSavedState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) return migrateGameState(JSON.parse(raw));
  } catch {
    // Сховище недоступне або пошкоджене — починаємо з нуля
  }
  return createInitialGameState();
}

function loadHintsPref(): boolean {
  try {
    return localStorage.getItem(HINTS_KEY) !== 'off';
  } catch {
    return true;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(loadSavedState);
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      if (new URLSearchParams(window.location.search).get('autostart') === '1') return 'game';
    } catch {
      // Ignore
    }
    return 'title';
  });
  const [activeTab, setActiveTab] = useState<GameTab>('rpg');
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [showHints, setShowHints] = useState<boolean>(loadHintsPref);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pendingOutcome, setPendingOutcome] = useState<PendingOutcome | null>(null);
  const [queuedInterlude, setQueuedInterlude] = useState<ChapterId | null>(null);
  const [activeInterlude, setActiveInterlude] = useState<ChapterId | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const toastId = useRef(0);
  const prevRankId = useRef(getRank(gameState.stars).id);

  const hasProgress = gameState.decisionHistory.length > 0 || gameState.stars > 0;

  // --- Збереження ---
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // Ignore
    }
  }, [gameState]);

  useEffect(() => {
    try {
      localStorage.setItem(HINTS_KEY, showHints ? 'on' : 'off');
    } catch {
      // Ignore
    }
  }, [showHints]);

  // --- Сповіщення ---
  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const grantStars = useCallback(
    (amount: number, reason: string) => {
      if (amount <= 0) return;
      setGameState((s) => ({ ...s, stars: s.stars + amount }));
      sound.playStar();
      pushToast({ emoji: '⭐', title: `+${amount} ${amount === 1 ? 'зірка' : amount < 5 ? 'зірки' : 'зірок'}`, text: reason, tone: 'star' });
    },
    [pushToast],
  );

  // --- Досягнення та звання ---
  useEffect(() => {
    const { state, newlyUnlocked } = evaluateAchievements(gameState, ARTIFACTS.length);
    if (newlyUnlocked.length > 0) {
      setGameState(state);
      newlyUnlocked.forEach((id) => {
        const a = getAchievement(id);
        if (a) pushToast({ emoji: a.emoji, title: `Медаль: ${a.title}`, text: a.description, tone: 'medal' });
      });
      sound.playFanfare();
    }

    const rank = getRank(gameState.stars);
    if (rank.id !== prevRankId.current) {
      const wasLower = gameState.stars >= rank.minStars;
      prevRankId.current = rank.id;
      if (wasLower && rank.minStars > 0) {
        pushToast({ emoji: '🎖️', title: `Нове звання: ${rank.title}!`, text: rank.description, tone: 'medal' });
      }
    }
  }, [gameState, pushToast]);

  // --- Керування ---
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const enterGame = (tab: GameTab = 'rpg') => {
    setActiveTab(tab);
    setScreen('game');
  };

  const handleNewAdventure = () => {
    sound.playSelect();
    const fresh = createInitialGameState();
    prevRankId.current = getRank(0).id;
    setGameState({ ...fresh, heroName: gameState.heroName, heroSprite: gameState.heroSprite });
    setPendingOutcome(null);
    setQueuedInterlude(null);
    setActiveInterlude(null);
    setScreen('prologue');
  };

  const handlePrologueComplete = (name: string, sprite: HeroSprite) => {
    setGameState((s) => ({ ...s, heroName: name, heroSprite: sprite, hasSeenPrologue: true }));
    enterGame('rpg');
  };

  const handleStartFromChapter = (chapterId: ChapterId) => {
    sound.playSelect();
    setGameState((prev) => ({
      ...prev,
      heroName: prev.heroName || 'Джура',
      chapter: chapterId,
      currentStepId: CHAPTER_CONFIG[chapterId].startStepId,
    }));
    enterGame('rpg');
  };

  const handleMakeChoice = (choice: DialogueChoice, stepTitle: string, year: string) => {
    const prev = gameState;
    const updated = applyChoiceToState(prev, choice, stepTitle, year);

    let nextStepId = choice.nextStepId;
    let nextChapter = updated.chapter;

    if (!nextStepId || !DIALOGUE_STEPS[nextStepId]) {
      const curIdx = ALL_CHAPTERS.indexOf(updated.chapter);
      nextChapter = curIdx < ALL_CHAPTERS.length - 1 ? ALL_CHAPTERS[curIdx + 1] : 'EPILOGUE';
      nextStepId = CHAPTER_CONFIG[nextChapter].startStepId;
    } else {
      const matchingChapter = ALL_CHAPTERS.find((cid) => CHAPTER_CONFIG[cid].startStepId === nextStepId);
      if (matchingChapter) nextChapter = matchingChapter;
    }

    const starsGained = 1;
    setGameState({
      ...updated,
      stars: updated.stars + starsGained,
      chapter: nextChapter,
      currentStepId: nextStepId,
      unlockedChapters: updated.unlockedChapters.includes(nextChapter)
        ? updated.unlockedChapters
        : [...updated.unlockedChapters, nextChapter],
    });
    setPendingOutcome({ choice, before: prev.metrics, after: updated.metrics, starsGained });

    if (nextChapter !== prev.chapter && prev.chapter !== 'EPILOGUE' && !prev.completedChapters.includes(prev.chapter)) {
      setQueuedInterlude(prev.chapter);
    }
  };

  const handleOutcomeContinue = () => {
    setPendingOutcome(null);
    if (queuedInterlude) {
      setActiveInterlude(queuedInterlude);
      setQueuedInterlude(null);
    }
  };

  const handleJumpToChapter = (chapterId: ChapterId) => {
    setGameState((prev) => ({
      ...prev,
      chapter: chapterId,
      currentStepId: CHAPTER_CONFIG[chapterId]?.startStepId || 'step_ch1_1',
    }));
    setActiveTab('rpg');
  };

  const handleRestart = () => {
    sound.playSelect();
    setPendingOutcome(null);
    setQueuedInterlude(null);
    setActiveInterlude(null);
    setScreen('title');
    setActiveTab('rpg');
  };

  const handleFullReset = () => {
    sound.playSelect();
    const fresh = createInitialGameState();
    prevRankId.current = getRank(0).id;
    setGameState(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleFindArtifact = (artifact: Artifact) => {
    if (gameState.artifacts.includes(artifact.id)) return;
    setGameState((s) => (s.artifacts.includes(artifact.id) ? s : { ...s, artifacts: [...s.artifacts, artifact.id] }));
    grantStars(artifact.stars, `Знахідка: ${artifact.name}`);
  };

  const handleBattleResolved = (opId: string, victory: boolean) => {
    if (gameState.usedOperations.some((u) => u.startsWith(opId + ':'))) return;
    setGameState((prev) => ({
      ...prev,
      usedOperations: [...prev.usedOperations, `${opId}:${victory ? 'win' : 'lose'}`],
      metrics: {
        ...prev.metrics,
        armyReadiness: clamp(prev.metrics.armyReadiness + (victory ? 10 : -5)),
        nationalUnity: clamp(prev.metrics.nationalUnity + (victory ? 8 : -2)),
      },
    }));
    grantStars(victory ? 3 : 1, victory ? 'Перемога у штабній операції' : 'За сміливість у бою');
  };

  const handleUniversalEnacted = (projectedMetrics: Partial<GameMetrics>, title: string) => {
    setGameState((prev) => {
      const newMetrics = { ...prev.metrics };
      (Object.keys(projectedMetrics) as (keyof GameMetrics)[]).forEach((k) => {
        newMetrics[k] = clamp(newMetrics[k] + (projectedMetrics[k] ?? 0));
      });
      return { ...prev, metrics: newMetrics, proclaimedUniversals: prev.proclaimedUniversals + 1 };
    });
    grantStars(2, `Універсал «${title}» проголошено`);
  };

  // --- Інтерлюдія ---
  const handleDiaryRead = () => grantStars(1, 'Новий запис у щоденнику');

  const handleQuizAnswered = (questionId: string, correct: boolean) => {
    if (!correct || gameState.quizCorrect.includes(questionId)) return;
    setGameState((s) => ({ ...s, quizCorrect: [...s.quizCorrect, questionId] }));
    grantStars(2, 'Правильна відповідь');
  };

  const handleMinigameFinished = (chapterId: ChapterId, won: boolean, reward: number) => {
    if (!won || gameState.minigamesWon.includes(chapterId)) return;
    setGameState((s) => ({ ...s, minigamesWon: [...s.minigamesWon, chapterId] }));
    grantStars(reward, 'Міні-гру пройдено');
  };

  const handleInterludeClose = (chapterId: ChapterId) => {
    setGameState((s) =>
      s.completedChapters.includes(chapterId) ? s : { ...s, completedChapters: [...s.completedChapters, chapterId] },
    );
    setActiveInterlude(null);
  };

  const openRename = () => {
    setRenameDraft(gameState.heroName);
    setRenameOpen(true);
  };

  const currentEnding = determineGameEnding(gameState);
  const modalsBusy = pendingOutcome !== null || activeInterlude !== null || queuedInterlude !== null;
  const heroName = gameState.heroName || 'Джура';

  // ------------------------------------------------------------------------
  // Екрани
  // ------------------------------------------------------------------------
  if (screen === 'title') {
    return (
      <div className="min-h-screen flex flex-col text-stone-100">
        <TitleScreen
          hasProgress={hasProgress}
          heroName={heroName}
          heroSprite={gameState.heroSprite}
          stars={gameState.stars}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onNew={handleNewAdventure}
          onContinue={() => {
            sound.playSelect();
            if (!gameState.hasSeenPrologue) setScreen('prologue');
            else enterGame('rpg');
          }}
          onOpen={(tab) => {
            sound.playSelect();
            if (!gameState.heroName) setGameState((s) => ({ ...s, heroName: 'Джура' }));
            enterGame(tab);
          }}
          onStartChapter={handleStartFromChapter}
          onReset={handleFullReset}
          completedChapters={gameState.completedChapters}
        />
      </div>
    );
  }

  if (screen === 'prologue') {
    return (
      <div className="min-h-screen flex flex-col text-stone-100">
        <PrologueView
          initialName={gameState.heroName}
          initialSprite={gameState.heroSprite}
          onComplete={handlePrologueComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-stone-100 flex flex-col font-sans">
      <MetricsBar
        metrics={gameState.metrics}
        currentChapter={gameState.chapter}
        isAlternateHistory={gameState.isAlternateHistory}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        showHints={showHints}
        onToggleHints={() => setShowHints((v) => !v)}
        heroName={heroName}
        heroSprite={gameState.heroSprite}
        stars={gameState.stars}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-4 py-5">
        {activeTab === 'rpg' &&
          (gameState.chapter === 'EPILOGUE' ? (
            modalsBusy ? (
              <div className="py-20 text-center text-stone-400">Підбиваємо підсумки революції…</div>
            ) : (
              <EndingView
                ending={currentEnding}
                metrics={gameState.metrics}
                onRestart={handleNewAdventure}
                onViewTree={() => setActiveTab('tree')}
                onViewSatchel={() => setActiveTab('satchel')}
                heroName={heroName}
                heroSprite={gameState.heroSprite}
                stars={gameState.stars}
                artifactsCount={gameState.artifacts.length}
                achievementsCount={gameState.achievements.length}
              />
            )
          ) : (
            <div className="space-y-6">
              <RpgAdventureView
                currentChapter={gameState.chapter}
                currentStepId={gameState.currentStepId}
                onMakeChoice={handleMakeChoice}
                onJumpToChapter={handleJumpToChapter}
                heroName={heroName}
                heroSprite={gameState.heroSprite}
                foundArtifacts={gameState.artifacts}
                completedChapters={gameState.completedChapters}
                onFindArtifact={handleFindArtifact}
                showHints={showHints}
              />
              <FactionsPanel reputation={gameState.reputation} />
            </div>
          ))}

        {activeTab === 'satchel' && (
          <SatchelView
            heroName={heroName}
            heroSprite={gameState.heroSprite}
            stars={gameState.stars}
            artifacts={gameState.artifacts}
            achievements={gameState.achievements}
            completedChapters={gameState.completedChapters}
            onRename={openRename}
          />
        )}

        {activeTab === 'tree' && (
          <DecisionTreeModal
            decisionHistory={gameState.decisionHistory}
            currentChapter={gameState.chapter}
            isAlternateHistory={gameState.isAlternateHistory}
            onJumpToChapter={handleJumpToChapter}
          />
        )}

        {activeTab === 'map' && (
          <StaffMapQuest
            armyReadiness={gameState.metrics.armyReadiness}
            usedOperations={gameState.usedOperations}
            onBattleResolved={handleBattleResolved}
          />
        )}

        {activeTab === 'universals' && (
          <UniversalDraftingRoom proclaimedCount={gameState.proclaimedUniversals} onUniversalEnacted={handleUniversalEnacted} />
        )}

        {activeTab === 'archive' && <HistoricalArchiveModal />}
      </main>

      <footer className="border-t border-stone-800 bg-stone-950 px-4 py-3 text-xs text-stone-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <span>«Вільна Доля: 1917–1921» · Пригода юного джури Центральної Ради</span>
          <button type="button" onClick={handleRestart} className="flex items-center gap-1 text-stone-400 hover:text-amber-300">
            <RotateCcw className="h-3 w-3" />
            <span>Головне меню</span>
          </button>
        </div>
      </footer>

      <ChoiceOutcome outcome={pendingOutcome} onContinue={handleOutcomeContinue} />
      <ChapterInterlude
        chapterId={activeInterlude}
        heroName={heroName}
        heroSprite={gameState.heroSprite}
        onDiaryRead={handleDiaryRead}
        onQuizAnswered={handleQuizAnswered}
        onMinigameFinished={handleMinigameFinished}
        onClose={handleInterludeClose}
      />

      <Modal open={renameOpen} onClose={() => setRenameOpen(false)} title="Як тебе звати?" maxWidth="max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const name = renameDraft.trim();
            if (name) setGameState((s) => ({ ...s, heroName: name }));
            setRenameOpen(false);
          }}
        >
          <div className="flex gap-3">
            {(['hero_boy', 'hero_girl'] as HeroSprite[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setGameState((st) => ({ ...st, heroSprite: s }))}
                aria-pressed={gameState.heroSprite === s}
                className={`border-2 p-1 ${gameState.heroSprite === s ? 'border-amber-400' : 'border-stone-700'}`}
              >
                <PixelAvatar id={s} size="md" />
              </button>
            ))}
          </div>
          <input
            value={renameDraft}
            maxLength={18}
            onChange={(e) => setRenameDraft(e.target.value)}
            className="w-full border-2 border-stone-700 bg-stone-950 px-3 py-2.5 text-base"
            autoFocus
          />
          <button type="submit" className="pixel-btn w-full border-2 border-amber-400 bg-amber-500 py-2.5 font-bold text-stone-950">
            Зберегти
          </button>
        </form>
      </Modal>

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Титульний екран
// ---------------------------------------------------------------------------
interface TitleScreenProps {
  hasProgress: boolean;
  heroName: string;
  heroSprite: HeroSprite;
  stars: number;
  isMuted: boolean;
  completedChapters: ChapterId[];
  onToggleMute: () => void;
  onNew: () => void;
  onContinue: () => void;
  onOpen: (tab: GameTab) => void;
  onStartChapter: (chapterId: ChapterId) => void;
  onReset: () => void;
}

const FEATURES = [
  { icon: MessageSquare, title: 'Розмовляй з героями', text: 'Грушевський, Петлюра, Скоропадський чекають на твою пораду.' },
  { icon: Search, title: 'Шукай знахідки', text: `${ARTIFACTS.length} таємниць сховано на картинах доби.` },
  { icon: Gamepad2, title: 'Грай і вчися', text: 'Міні-ігри, вікторини та щоденник після кожного акту.' },
];

const TitleScreen: React.FC<TitleScreenProps> = ({
  hasProgress,
  heroName,
  heroSprite,
  stars,
  isMuted,
  completedChapters,
  onToggleMute,
  onNew,
  onContinue,
  onOpen,
  onStartChapter,
  onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl bg-stone-950 pixel-frame overflow-hidden">
        <div className="relative w-full overflow-hidden">
          <img src={BG_IMAGES.hero} alt="Софійська площа у Києві, 1917 рік" className="h-[300px] sm:h-[420px] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-stone-950/10" />

          <motion.div
            className="absolute right-4 top-4 sm:right-10 sm:top-8 flex flex-col items-center gap-1"
            initial={{ x: 120, y: -60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          >
            <PixelAvatar id="pigeon" size="md" className="animate-flap border-sky-300" />
            <span className="bg-sky-700 px-2 py-0.5 text-[10px] font-bold text-white">{COMPANION.name}</span>
          </motion.div>

          <div className="absolute bottom-5 left-4 right-4 sm:left-8 sm:right-8">
            <div className="font-pixel text-[9px] sm:text-[11px] text-amber-300 tracking-wider mb-2">
              ПІКСЕЛЬНА ПРИГОДА · 1917–1921
            </div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-amber-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.8)]"
            >
              Вільна Доля
            </motion.h1>
            <p className="mt-2 max-w-2xl font-serif text-sm sm:text-lg leading-relaxed text-stone-100">
              Стань юним джурою Центральної Ради! Разом із поштовим голубом Сизокрилом пройди шлях від перших зборів у Києві до Акту Злуки та Зимового походу. Твої поради змінюватимуть історію.
            </p>
          </div>
        </div>

        <div className="embroidery-strip" />

        <div className="p-4 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {hasProgress && (
              <button
                type="button"
                onClick={onContinue}
                className="pixel-btn flex-1 flex items-center justify-center gap-3 border-2 border-amber-300 bg-amber-500 px-5 py-4 text-base sm:text-lg font-bold text-stone-950 hover:bg-amber-400"
              >
                <PixelAvatar id={heroSprite} size="sm" className="border-stone-950" />
                <span className="text-left leading-tight">
                  Продовжити
                  <span className="block text-xs font-semibold opacity-80">
                    {heroName} · {stars} ⭐
                  </span>
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onNew}
              className={`pixel-btn flex-1 flex items-center justify-center gap-2 border-2 px-5 py-4 text-base sm:text-lg font-bold ${
                hasProgress
                  ? 'border-stone-600 bg-stone-800 text-stone-100 hover:border-amber-400'
                  : 'border-amber-300 bg-amber-500 text-stone-950 hover:bg-amber-400'
              }`}
            >
              <Play className="h-5 w-5" />
              {hasProgress ? 'Нова пригода' : 'Почати пригоду'}
            </button>
            <button
              type="button"
              onClick={() => onOpen('archive')}
              className="pixel-btn flex items-center justify-center gap-2 border-2 border-stone-700 bg-stone-900 px-5 py-4 text-sm font-semibold text-stone-200 hover:border-amber-500"
            >
              <BookOpen className="h-5 w-5" />
              Архів
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-3 border border-stone-800 bg-stone-900/70 p-3">
                  <Icon className="h-6 w-6 shrink-0 text-amber-400" />
                  <div>
                    <div className="text-sm font-bold text-stone-100">{f.title}</div>
                    <div className="text-xs text-stone-400">{f.text}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <details className="group border-t border-stone-800 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-stone-300 hover:text-amber-300">
              Для вчителів і батьків: обрати будь-який акт
            </summary>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
              {ALL_CHAPTERS.map((cid, idx) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => onStartChapter(cid)}
                  className="border border-stone-800 bg-stone-900/60 p-2 text-left hover:border-amber-500"
                >
                  <span className="font-mono text-[10px] text-amber-400 block truncate">{CHAPTER_CONFIG[cid].period}</span>
                  <span className="font-medium text-stone-200 block text-[11px]">
                    {completedChapters.includes(cid) && '✓ '}
                    {idx === ALL_CHAPTERS.length - 1 ? 'Епілог' : `Акт ${idx + 1}`}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              У грі {ACHIEVEMENTS.length} медалей, {ARTIFACTS.length} знахідок, 9 вікторин і 9 міні-ігор. Позначка «📜 Як було» показує справжній історичний вибір.
            </p>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 border-t border-stone-800 pt-4">
            <button type="button" onClick={onToggleMute} className="flex items-center gap-1.5 hover:text-stone-300">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span>{isMuted ? 'Звук вимкнено' : 'Звук увімкнено'}</span>
            </button>
            {hasProgress &&
              (confirmReset ? (
                <span className="flex items-center gap-2">
                  Стерти весь прогрес?
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                    }}
                    className="text-rose-400 underline"
                  >
                    Так
                  </button>
                  <button type="button" onClick={() => setConfirmReset(false)} className="underline">
                    Ні
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmReset(true)} className="hover:text-rose-300">
                  Стерти збереження
                </button>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};
