/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Gamepad2, HelpCircle, Star } from 'lucide-react';
import { Modal } from './Modal';
import { PixelAvatar } from './PixelAvatar';
import { TelegramPuzzle } from './minigames/TelegramPuzzle';
import { MemoryGame } from './minigames/MemoryGame';
import { RailSabotage } from './minigames/RailSabotage';
import { ChapterId, HeroSprite } from '../game/types';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { getDiaryEntry, getMinigameForChapter, getQuizForChapter, COMPANION } from '../game/lore';
import { sound } from '../game/sound';

interface ChapterInterludeProps {
  chapterId: ChapterId | null;
  heroName: string;
  heroSprite: HeroSprite;
  onQuizAnswered: (questionId: string, correct: boolean) => void;
  onMinigameFinished: (chapterId: ChapterId, won: boolean, rewardStars: number) => void;
  onDiaryRead: (chapterId: ChapterId) => void;
  onClose: (chapterId: ChapterId) => void;
}

type Stage = 'diary' | 'quiz' | 'game' | 'done';

const STAGES: { id: Stage; label: string; icon: React.ElementType }[] = [
  { id: 'diary', label: 'Щоденник', icon: BookOpen },
  { id: 'quiz', label: 'Вікторина', icon: HelpCircle },
  { id: 'game', label: 'Міні-гра', icon: Gamepad2 },
  { id: 'done', label: 'Підсумок', icon: Star },
];

const InterludeBody: React.FC<ChapterInterludeProps & { chapterId: ChapterId }> = ({
  chapterId,
  heroName,
  heroSprite,
  onQuizAnswered,
  onMinigameFinished,
  onDiaryRead,
  onClose,
}) => {
  const diary = getDiaryEntry(chapterId);
  const quiz = getQuizForChapter(chapterId);
  const game = getMinigameForChapter(chapterId);
  const [stage, setStage] = useState<Stage>('diary');
  const [answer, setAnswer] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<boolean | null>(null);
  const [earned, setEarned] = useState(0);

  const goNext = () => {
    sound.playPage();
    if (stage === 'diary') {
      onDiaryRead(chapterId);
      setEarned((e) => e + 1);
      setStage(quiz ? 'quiz' : game ? 'game' : 'done');
    } else if (stage === 'quiz') {
      setStage(game ? 'game' : 'done');
    } else if (stage === 'game') {
      setStage('done');
    }
  };

  const choose = (idx: number) => {
    if (answer !== null || !quiz) return;
    setAnswer(idx);
    const correct = idx === quiz.correctIndex;
    if (correct) {
      sound.playStar();
      setEarned((e) => e + 2);
    } else {
      sound.playWrong();
    }
    onQuizAnswered(quiz.id, correct);
  };

  const finishGame = (won: boolean) => {
    if (gameResult !== null || !game) return;
    setGameResult(won);
    if (won) setEarned((e) => e + game.rewardStars);
    onMinigameFinished(chapterId, won, game.rewardStars);
    setStage('done');
  };

  const stageIndex = STAGES.findIndex((s) => s.id === stage);
  const nextChapterTitle = (() => {
    const all = Object.keys(CHAPTER_CONFIG) as ChapterId[];
    const next = all[all.indexOf(chapterId) + 1];
    return next ? CHAPTER_CONFIG[next].title : null;
  })();

  return (
    <div className="space-y-5">
      {/* Прогрес інтерлюдії */}
      <ol className="flex items-center gap-1 sm:gap-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const state = i < stageIndex ? 'done' : i === stageIndex ? 'active' : 'todo';
          return (
            <li key={s.id} className="flex flex-1 items-center gap-1 sm:gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 ${
                  state === 'active'
                    ? 'border-amber-400 bg-amber-500 text-stone-950'
                    : state === 'done'
                    ? 'border-emerald-500 bg-emerald-900 text-emerald-100'
                    : 'border-stone-700 bg-stone-950 text-stone-500'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`hidden sm:inline text-xs ${state === 'active' ? 'text-amber-200 font-bold' : 'text-stone-400'}`}>
                {s.label}
              </span>
              {i < STAGES.length - 1 && <span className="h-0.5 flex-1 bg-stone-700" />}
            </li>
          );
        })}
      </ol>

      {stage === 'diary' && diary && (
        <motion.div initial={{ rotateX: 20, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} className="space-y-4">
          <div className="parchment border-2 border-amber-900/60 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-2 border-b border-amber-900/30 pb-2 mb-3">
              <span className="text-xs uppercase tracking-widest text-amber-900/80">Щоденник джури · {heroName}</span>
              <span className="text-xs italic text-amber-900/80">{diary.date}</span>
            </div>
            <h3 className="handwriting text-3xl font-bold mb-2">{diary.title}</h3>
            <p className="handwriting text-xl sm:text-2xl leading-snug">{diary.text}</p>
            <div className="mt-4 flex justify-end">
              <PixelAvatar id={heroSprite} size="sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNext}
              className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
            >
              Записати (+1 ⭐) <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {stage === 'quiz' && quiz && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <PixelAvatar id="pigeon" size="md" className="animate-flap" />
            <div className="flex-1 border-2 border-sky-800 bg-sky-950/50 p-3">
              <div className="text-xs font-bold text-sky-300 mb-1">{COMPANION.name} питає:</div>
              <p className="text-base sm:text-lg font-semibold text-stone-100">{quiz.question}</p>
            </div>
          </div>
          <div className="grid gap-2">
            {quiz.options.map((opt, idx) => {
              const isCorrect = idx === quiz.correctIndex;
              const isChosen = answer === idx;
              let cls = 'border-stone-700 bg-stone-950 hover:border-amber-400';
              if (answer !== null) {
                if (isCorrect) cls = 'border-emerald-500 bg-emerald-950/70';
                else if (isChosen) cls = 'border-rose-500 bg-rose-950/60 animate-shake';
                else cls = 'border-stone-800 bg-stone-950 opacity-60';
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => choose(idx)}
                  disabled={answer !== null}
                  className={`pixel-btn flex items-center gap-3 border-2 px-4 py-3 text-left text-base ${cls}`}
                >
                  <span className="font-pixel text-[10px] text-amber-300">{String.fromCharCode(1040 + idx)}</span>
                  <span>{opt}</span>
                  {answer !== null && isCorrect && <span className="ml-auto">✅</span>}
                </button>
              );
            })}
          </div>
          {answer !== null && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div
                className={`border-l-4 p-3 text-sm ${
                  answer === quiz.correctIndex ? 'border-emerald-500 bg-emerald-950/40 text-emerald-100' : 'border-amber-500 bg-amber-950/40 text-amber-100'
                }`}
              >
                <strong>{answer === quiz.correctIndex ? 'Правильно! +2 ⭐ ' : 'Не страшно, тепер ти знаєш! '}</strong>
                {quiz.explanation}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={goNext}
                  className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
                >
                  Далі <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {stage === 'game' && game && (
        <div className="space-y-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-amber-300">🎮 {game.title}</h3>
            <p className="text-sm text-stone-300">{game.intro}</p>
            <p className="text-xs text-amber-300 mt-1">Нагорода: +{game.rewardStars} ⭐</p>
          </div>
          {game.kind === 'telegram' && game.sentence && <TelegramPuzzle sentence={game.sentence} onFinish={finishGame} />}
          {game.kind === 'memory' && game.pairs && <MemoryGame pairs={game.pairs} onFinish={finishGame} />}
          {game.kind === 'rail' && (
            <RailSabotage target={game.railTarget ?? 12} seconds={game.railSeconds ?? 15} onFinish={finishGame} />
          )}
        </div>
      )}

      {stage === 'done' && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 py-2">
          <div className="text-6xl">{earned > 0 ? '🌟' : '📜'}</div>
          <h3 className="font-serif text-2xl font-bold text-amber-300">Акт завершено!</h3>
          <p className="text-stone-300">
            За цей перепочинок ти здобув(-ла) <strong className="text-amber-300">{earned} ⭐</strong>
            {gameResult === false && '. Міні-гру можна буде спробувати іншим разом.'}
          </p>
          {nextChapterTitle && (
            <p className="text-sm text-stone-400">
              Далі: <span className="text-stone-200">{nextChapterTitle}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              onClose(chapterId);
            }}
            className="pixel-btn inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-6 py-3 font-bold text-stone-950 hover:bg-amber-400"
          >
            Продовжити пригоду <ArrowRight className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export const ChapterInterlude: React.FC<ChapterInterludeProps> = (props) => {
  const { chapterId } = props;
  return (
    <Modal
      open={chapterId !== null}
      dismissible={false}
      maxWidth="max-w-2xl"
      title={chapterId ? `Привал після акту: ${CHAPTER_CONFIG[chapterId].title.split(':')[0]}` : ''}
    >
      {chapterId && <InterludeBody key={chapterId} {...props} chapterId={chapterId} />}
    </Modal>
  );
};
