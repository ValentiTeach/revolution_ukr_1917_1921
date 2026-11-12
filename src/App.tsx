/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MetricsBar } from './components/MetricsBar';
import { FactionsPanel } from './components/FactionsPanel';
import { RpgAdventureView } from './components/RpgAdventureView';
import { DecisionTreeModal } from './components/DecisionTreeModal';
import { StaffMapQuest } from './components/StaffMapQuest';
import { UniversalDraftingRoom } from './components/UniversalDraftingRoom';
import { HistoricalArchiveModal } from './components/HistoricalArchiveModal';
import { EndingView } from './components/EndingView';
import {
  ChapterId,
  DialogueChoice,
  GameMetrics,
} from './game/types';
import {
  createInitialGameState,
  applyChoiceToState,
  determineGameEnding,
  GameState,
  clamp,
} from './game/rules';
import { CHAPTER_CONFIG, DIALOGUE_STEPS } from './game/historicalData';
import { sound } from './game/sound';
import { Play, BookOpen, GitBranch, RotateCcw, Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'vilna_dolia_rpg_state_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // Fallback
      }
    }
    return createInitialGameState();
  });

  const [inGame, setInGame] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('autostart') === '1') {
        return true;
      }
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'rpg' | 'tree' | 'map' | 'universals' | 'archive'>('rpg');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastConsequence, setLastConsequence] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch {
      // Ignore
    }
  }, [gameState]);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleStartGame = (startChapter: ChapterId = 'CH1_RADA_CREATION') => {
    sound.playSelect();
    const startStepId = CHAPTER_CONFIG[startChapter]?.startStepId || 'step_ch1_1';
    setGameState((prev) => ({
      ...prev,
      chapter: startChapter,
      currentStepId: startStepId,
    }));
    setInGame(true);
    setActiveTab('rpg');
  };

  const handleMakeChoice = (choice: DialogueChoice, stepTitle: string, year: string) => {
    setLastConsequence(choice.reflection);
    const updatedState = applyChoiceToState(gameState, choice, stepTitle, year);

    // Determine next step or next chapter
    let nextStepId = choice.nextStepId;
    let nextChapter = updatedState.chapter;

    if (!nextStepId || !DIALOGUE_STEPS[nextStepId]) {
      // Fallback or advance chapter
      const allChapters = Object.keys(CHAPTER_CONFIG) as ChapterId[];
      const curIdx = allChapters.indexOf(updatedState.chapter);
      if (curIdx < allChapters.length - 1) {
        nextChapter = allChapters[curIdx + 1];
        nextStepId = CHAPTER_CONFIG[nextChapter].startStepId;
      } else {
        nextChapter = 'EPILOGUE';
        nextStepId = 'step_epilogue';
      }
    } else {
      // If next step corresponds to a different chapter, update chapter
      const allChapters = Object.keys(CHAPTER_CONFIG) as ChapterId[];
      const matchingChapter = allChapters.find(
        (cid) => CHAPTER_CONFIG[cid].startStepId === nextStepId
      );
      if (matchingChapter) {
        nextChapter = matchingChapter;
      }
    }

    setGameState({
      ...updatedState,
      chapter: nextChapter,
      currentStepId: nextStepId,
    });
  };

  const handleJumpToChapter = (chapterId: ChapterId) => {
    const targetStep = CHAPTER_CONFIG[chapterId]?.startStepId || 'step_ch1_1';
    setGameState((prev) => ({
      ...prev,
      chapter: chapterId,
      currentStepId: targetStep,
    }));
    setActiveTab('rpg');
  };

  const handleRestart = () => {
    sound.playSelect();
    const fresh = createInitialGameState();
    setGameState(fresh);
    setLastConsequence(null);
    setInGame(false);
    setActiveTab('rpg');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleBattleResolved = (gainedArmy: number, gainedUnity: number) => {
    setGameState((prev) => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        armyReadiness: clamp(prev.metrics.armyReadiness + gainedArmy),
        nationalUnity: clamp(prev.metrics.nationalUnity + gainedUnity),
      },
    }));
  };

  const handleUniversalEnacted = (
    projectedMetrics: Partial<GameMetrics>,
    title: string
  ) => {
    setGameState((prev) => {
      const newMetrics = { ...prev.metrics };
      (Object.keys(projectedMetrics) as (keyof GameMetrics)[]).forEach((k) => {
        const delta = projectedMetrics[k] ?? 0;
        newMetrics[k] = clamp(newMetrics[k] + delta);
      });
      return {
        ...prev,
        metrics: newMetrics,
      };
    });
    setLastConsequence(`Універсал «${title}» введено в дію!`);
  };

  const currentEnding = determineGameEnding(gameState);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {!inGame ? (
        /* Title Screen */
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-4xl border border-amber-950/90 bg-stone-900/90 shadow-2xl overflow-hidden">
            {/* Hero image banner */}
            <div className="relative aspect-16/9 w-full overflow-hidden bg-stone-950">
              <img
                src="/src/assets/images/hero_ukraine_revolution_1917_1794394443346.jpg"
                alt="Українська революція 1917 року"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover filter contrast-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 uppercase mb-1">
                  <span>Історична піксельна RPG</span>
                  <span>·</span>
                  <span>1917–1921 рр.</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-amber-300">
                  Вільна Доля: 1917–1921
                </h1>
                <p className="mt-2 text-sm sm:text-base text-stone-200 max-w-2xl font-serif leading-relaxed">
                  Пройдіть шлях від створення Української Центральної Ради, проголошення чотирьох Універсалів та бою під Крутами до Гетьманату Скоропадського, Акта Злуки і боротьби в "Трикутнику Смерті". Чи вдасться вам об'єднати політичні фракції та відстояти незалежність?
                </p>
              </div>
            </div>

            {/* Campaign Options & Navigation */}
            <div className="p-6 md:p-8 space-y-6 bg-stone-950 border-t border-amber-950/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleStartGame('CH1_RADA_CREATION')}
                  className="flex items-center justify-center gap-2 border border-amber-500 bg-amber-600 px-5 py-3.5 text-sm font-bold text-stone-950 uppercase tracking-wider hover:bg-amber-500 transition-colors shadow-md"
                >
                  <Play className="h-4 w-4 fill-stone-950" />
                  <span>Почати Похід (1917)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setActiveTab('archive');
                    setInGame(true);
                  }}
                  className="flex items-center justify-center gap-2 border border-stone-700 bg-stone-900 px-5 py-3.5 text-sm font-medium text-stone-200 hover:border-amber-500 hover:text-amber-300 transition-colors"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Історичний Архів</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setActiveTab('tree');
                    setInGame(true);
                  }}
                  className="flex items-center justify-center gap-2 border border-stone-700 bg-stone-900 px-5 py-3.5 text-sm font-medium text-stone-200 hover:border-amber-500 hover:text-amber-300 transition-colors"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>Дерево Долі</span>
                </button>
              </div>

              {/* Fast Jump Chapter Grid */}
              <div className="border-t border-stone-800 pt-5">
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Обрати історичний етап революції:
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  {Object.entries(CHAPTER_CONFIG).map(([cid, cfg], idx) => (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => handleStartGame(cid as ChapterId)}
                      className="border border-stone-800 bg-stone-900/60 p-2 text-left hover:border-amber-500 hover:bg-stone-850 transition-colors"
                    >
                      <span className="font-mono text-[10px] text-amber-400 block truncate">
                        {cfg.period}
                      </span>
                      <span className="font-medium text-stone-200 block truncate text-[11px]">
                        {idx === 9 ? 'Епілог' : `Акт ${idx + 1}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound and footer credits */}
              <div className="flex items-center justify-between text-xs text-stone-500 border-t border-stone-800 pt-4">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="flex items-center gap-1.5 hover:text-stone-300 transition-colors"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  <span>{isMuted ? 'Звук вимкнено' : 'Звукові ефекти увімкнено'}</span>
                </button>
                <span>Українська революція 1917–1921 · Визвольні Змагання</span>
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* In-Game Active Layout */
        <>
          <MetricsBar
            metrics={gameState.metrics}
            currentChapter={gameState.chapter}
            isAlternateHistory={gameState.isAlternateHistory}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onRestart={handleRestart}
          />

          <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
            {activeTab === 'rpg' && (
              gameState.chapter === 'EPILOGUE' ? (
                <EndingView
                  ending={currentEnding}
                  metrics={gameState.metrics}
                  onRestart={handleRestart}
                  onViewTree={() => setActiveTab('tree')}
                />
              ) : (
                <div className="space-y-6">
                  <RpgAdventureView
                    currentChapter={gameState.chapter}
                    currentStepId={gameState.currentStepId}
                    onMakeChoice={handleMakeChoice}
                    onJumpToChapter={handleJumpToChapter}
                    lastConsequence={lastConsequence}
                  />
                  <FactionsPanel reputation={gameState.reputation} />
                </div>
              )
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
                onBattleResolved={handleBattleResolved}
              />
            )}

            {activeTab === 'universals' && (
              <UniversalDraftingRoom
                onUniversalEnacted={handleUniversalEnacted}
              />
            )}

            {activeTab === 'archive' && (
              <HistoricalArchiveModal />
            )}
          </main>

          {/* Bottom quiet status / restart footer */}
          <footer className="border-t border-stone-800 bg-stone-950 px-4 py-3 text-xs text-stone-500">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <span>
                «Вільна Доля: 1917–1921» · На основі історичних подій Української Центральної Ради, Гетьманату та Директорії
              </span>
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1 text-stone-400 hover:text-amber-300 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Головне меню</span>
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
