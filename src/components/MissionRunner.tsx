/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, DoorOpen, RotateCcw } from './icons';
import { Modal } from './Modal';
import { PixelAvatar } from './PixelAvatar';
import { KIND_LABEL, StationGame as KindGame } from './minigames/StationGame';
import { Mission, MissionStation } from '../game/types';
import { MISSION_HEARTS } from '../game/missions';
import { COMPANION } from '../game/lore';
import { sound } from '../game/sound';
import { PixelEmoji } from './PixelEmoji';

type Station = Omit<MissionStation, 'fork'>;

/** Вмикає потрібну міні-гру для «дверей». */
export const StationGame: React.FC<{ station: Station; onFinish: (won: boolean) => void }> = ({ station, onFinish }) => (
  <KindGame kind={station.kind} params={station.params} place={station.place} onFinish={onFinish} />
);

type Stage = 'brief' | 'fork' | 'play' | 'won' | 'lost' | 'gameover' | 'complete';

interface MissionRunnerProps {
  mission: Mission | null;
  alreadyDone: boolean;
  onClose: () => void;
  onComplete: (missionId: string, bonusStars: number, flawless: boolean) => void;
}

const doorNo = (i: number) => String(i + 1).padStart(3, '0');

const MissionBody: React.FC<Omit<MissionRunnerProps, 'mission'> & { mission: Mission }> = ({
  mission,
  alreadyDone,
  onClose,
  onComplete,
}) => {
  const [stage, setStage] = useState<Stage>('brief');
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(MISSION_HEARTS);
  const [sideDoors, setSideDoors] = useState<Record<number, boolean>>({});
  const [attempt, setAttempt] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [pigeonUsed, setPigeonUsed] = useState(false);
  const [pigeonGift, setPigeonGift] = useState(false);

  const base = mission.stations[index];
  const usingSide = sideDoors[index] && base.fork;
  const station: Station = usingSide ? base.fork!.station : base;
  const bonusStars = Object.entries(sideDoors).reduce(
    (acc, [i, side]) => acc + (side ? mission.stations[Number(i)].fork?.bonusStars ?? 0 : 0),
    0,
  );

  const enterDoor = (i: number) => {
    setIndex(i);
    setAttempt((a) => a + 1);
    setStage(mission.stations[i].fork && sideDoors[i] === undefined ? 'fork' : 'play');
    sound.playPage();
  };

  const handleFinish = (won: boolean) => {
    if (won) {
      setStage(index + 1 >= mission.stations.length ? 'complete' : 'won');
      if (index + 1 >= mission.stations.length) {
        sound.playFanfare();
        onComplete(mission.id, bonusStars, heartsLost === 0);
      }
      return;
    }
    const h = hearts - 1;
    setHeartsLost((n) => n + 1);
    if (h <= 0) {
      setHearts(0);
      setStage('gameover');
      return;
    }
    if (h === 1 && !pigeonUsed) {
      setPigeonUsed(true);
      setPigeonGift(true);
      setHearts(2);
      sound.playCoo();
    } else {
      setHearts(h);
      setPigeonGift(false);
    }
    setStage('lost');
  };

  const restartMission = () => {
    setHearts(MISSION_HEARTS);
    setHeartsLost(0);
    setPigeonUsed(false);
    setSideDoors({});
    setIndex(0);
    setAttempt((a) => a + 1);
    setStage(mission.stations[0].fork ? 'fork' : 'play');
  };

  return (
    <div className="space-y-5">
      {/* Коридор дверей */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-end gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {mission.stations.map((s, i) => {
            const passed = i < index || stage === 'complete' || (i === index && stage === 'won');
            const state = passed ? 'open' : i === index && stage !== 'brief' ? 'here' : 'closed';
            return (
              <div key={s.id} className="flex flex-col items-center gap-0.5">
                <div
                  className={`flex h-14 w-10 items-center justify-center border-2 text-lg ${
                    state === 'open'
                      ? 'border-emerald-500 bg-emerald-950/60'
                      : state === 'here'
                      ? 'border-amber-300 bg-amber-900 animate-sparkle'
                      : 'border-amber-900 bg-gradient-to-b from-amber-800 to-amber-950'
                  }`}
                  title={s.title}
                >
                  {state === 'open' ? (
                    <span className="px-pop font-pixel text-xs text-emerald-300">✓</span>
                  ) : (
                    <PixelEmoji emoji={state === 'here' ? s.emoji : '🚪'} size={28} res={14} />
                  )}
                </div>
                <span className="font-pixel text-[7px] text-stone-400">{doorNo(i)}</span>
              </div>
            );
          })}
          <div className="flex flex-col items-center gap-0.5">
            <div className={`flex h-14 w-10 items-center justify-center border-2 ${stage === 'complete' ? 'border-yellow-300 bg-yellow-700 animate-sparkle' : 'border-stone-700 bg-stone-900'}`}>
              <PixelEmoji emoji="🏁" size={28} res={14} />
            </div>
            <span className="font-pixel text-[7px] text-stone-400">ФІНІШ</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-0.5 text-xl" aria-label={`Серця: ${hearts}`}>
          {Array.from({ length: MISSION_HEARTS }).map((_, i) => (
            <span key={`${i}-${i < hearts}`} className={i < hearts ? 'px-pop' : 'animate-shake opacity-40'}>
              <PixelEmoji emoji={i < hearts ? '❤️' : '🖤'} size={28} res={12} />
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stage === 'brief' && (
          <motion.div key="brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex gap-3">
              <PixelAvatar id={mission.giver} size="md" />
              <div className="flex-1 border-2 border-amber-800 bg-stone-950 p-3">
                <div className="text-xs font-bold text-amber-300">{mission.giverName}:</div>
                <p className="font-serif text-base leading-relaxed text-stone-100">«{mission.brief}»</p>
              </div>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {mission.stations.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2 border border-stone-800 bg-stone-900/70 px-2 py-1.5 text-sm">
                  <span className="font-pixel text-[8px] text-stone-500">{doorNo(i)}</span>
                  <span>{s.emoji}</span>
                  <span className="flex-1 text-stone-200">{s.title}</span>
                  <span className="text-[10px] text-stone-500">{KIND_LABEL[s.kind]}</span>
                  {s.fork && <span title="Є бічні двері">🔀</span>}
                </li>
              ))}
            </ul>
            <div className="border-l-4 border-sky-600 bg-sky-950/40 p-3 text-sm text-sky-100">
              🕊️ <strong>{COMPANION.name}:</strong> У тебе {MISSION_HEARTS} серця. Помилка коштує одне, але двері можна пройти знову.
              Позначка 🔀 — бічні двері: важче, зате більше зірок!
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-amber-300">
                Нагорода: +{mission.rewardStars} ⭐ {alreadyDone && <span className="text-stone-400">(уже виконано, можна пройти ще раз заради тренування)</span>}
              </span>
              <div className="flex gap-2">
              <button type="button" onClick={onClose} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-4 py-2.5 text-stone-200">
                Пізніше
              </button>
              <button
                type="button"
                onClick={() => enterDoor(0)}
                className="pixel-btn flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
              >
                <DoorOpen className="h-5 w-5" /> Відчинити двері {doorNo(0)}
              </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'fork' && base.fork && (
          <motion.div key={`fork-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-center text-stone-200">Перед тобою дві двері. Куди підеш?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  setSideDoors((d) => ({ ...d, [index]: false }));
                  setStage('play');
                }}
                className="pixel-btn flex flex-col items-center gap-2 border-2 border-amber-800 bg-gradient-to-b from-amber-900 to-stone-950 p-4 hover:border-amber-400"
              >
                <PixelEmoji emoji="🚪" size={72} className="px-bob" />
                <span className="font-bold">{base.title}</span>
                <span className="text-xs text-stone-400">Звичайний шлях</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  setSideDoors((d) => ({ ...d, [index]: true }));
                  setStage('play');
                }}
                className="pixel-btn flex flex-col items-center gap-2 border-2 border-violet-600 bg-gradient-to-b from-violet-950 to-stone-950 p-4 hover:border-violet-300"
              >
                <span className="flex items-end">
                  <PixelEmoji emoji="🚪" size={72} className="px-bob" />
                  <PixelEmoji emoji="✨" size={32} className="animate-sparkle" />
                </span>
                <span className="font-bold">{base.fork.label}</span>
                <span className="text-xs text-violet-300">Важче · +{base.fork.bonusStars} ⭐</span>
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'play' && (
          <motion.div key={`play-${index}-${attempt}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[9px] text-amber-400">ДВЕРІ {doorNo(index)}</span>
                {usingSide && <span className="text-[10px] text-violet-300">🔀 бічні двері</span>}
              </div>
              <h3 className="font-serif text-xl font-bold text-amber-200">
                {station.emoji} {station.title}
              </h3>
              <div className="text-xs text-stone-400">📍 {station.place}</div>
              <p className="mt-1 text-sm text-stone-200">{station.intro}</p>
            </div>
            <StationGame key={`${station.id}-${attempt}`} station={station} onFinish={handleFinish} />
          </motion.div>
        )}

        {stage === 'won' && (
          <motion.div key={`won-${index}`} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center">
            <div className="flex justify-center">
              <span className="px-door-open inline-block">
                <PixelEmoji emoji="🚪" size={88} />
              </span>
            </div>
            <p className="text-lg font-bold text-emerald-300">Двері {doorNo(index)} пройдено!</p>
            <p className="text-sm text-stone-300">
              Далі: {mission.stations[index + 1].emoji} {mission.stations[index + 1].title}
            </p>
            <button
              type="button"
              onClick={() => enterDoor(index + 1)}
              autoFocus
              className="pixel-btn inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
            >
              <DoorOpen className="h-5 w-5" /> До дверей {doorNo(index + 1)}
            </button>
          </motion.div>
        )}

        {stage === 'lost' && (
          <motion.div key={`lost-${index}-${attempt}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center">
            <div className="flex justify-center animate-shake">
              <PixelEmoji emoji="💔" size={80} />
            </div>
            <p className="text-lg font-bold text-rose-300">Не вийшло… мінус одне серце.</p>
            {pigeonGift && (
              <p className="border-l-4 border-sky-500 bg-sky-950/50 p-2 text-sm text-sky-100">
                🕊️ {COMPANION.name} приніс тобі паляницю! +1 ❤️ «Підкріпися — і вперед!»
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setAttempt((a) => a + 1);
                setStage('play');
              }}
              autoFocus
              className="pixel-btn inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
            >
              <RotateCcw className="h-5 w-5" /> Спробувати ще раз
            </button>
          </motion.div>
        )}

        {stage === 'gameover' && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center">
            <PixelAvatar id="pigeon" size="lg" className="animate-flap mx-auto" />
            <p className="text-lg font-bold text-rose-300">Серця скінчилися.</p>
            <p className="text-sm text-stone-300">
              «Курли! Не сумуй, навіть Петлюра не завжди перемагав із першого разу. Тепер ти знаєш, що за кожними дверима. Спробуймо знову!»
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={restartMission}
                className="pixel-btn inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-5 py-2.5 font-bold text-stone-950 hover:bg-amber-400"
              >
                <RotateCcw className="h-5 w-5" /> Почати доручення знову
              </button>
              <button type="button" onClick={onClose} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-5 py-2.5 text-stone-200">
                Пізніше
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'complete' && (
          <motion.div key="complete" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4 text-center">
            <div className="flex justify-center">
              <span className="px-pop animate-sparkle inline-block border-4 border-yellow-400 bg-amber-900 p-2">
                <PixelEmoji emoji="🏆" size={88} />
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-amber-300">Доручення виконано!</h3>
            <p className="font-serif text-base text-stone-200">{mission.finale}</p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="border border-amber-600 bg-amber-950/60 px-2 py-1 text-amber-200">
                +{alreadyDone ? 0 : mission.rewardStars + bonusStars} ⭐
              </span>
              {heartsLost === 0 && <span className="border border-sky-600 bg-sky-950/60 px-2 py-1 text-sky-200">❤️ Без жодної помилки!</span>}
              {!alreadyDone && <span className="border border-violet-600 bg-violet-950/60 px-2 py-1 text-violet-200">🔓 Відкрито таємний варіант у діалозі</span>}
            </div>
            <button
              type="button"
              onClick={onClose}
              autoFocus
              className="pixel-btn inline-flex items-center gap-2 border-2 border-amber-400 bg-amber-500 px-6 py-3 font-bold text-stone-950 hover:bg-amber-400"
            >
              Повернутися до розмови <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {stage === 'play' && (
        <div className="text-right">
          <button type="button" onClick={onClose} className="text-xs text-stone-500 underline hover:text-stone-300">
            Відступити (прогрес доручення не збережеться)
          </button>
        </div>
      )}
    </div>
  );
};

export const MissionRunner: React.FC<MissionRunnerProps> = ({ mission, ...rest }) => (
  <Modal
    open={mission !== null}
    onClose={rest.onClose}
    dismissible={false}
    frame="violet"
    maxWidth="max-w-3xl"
    title={mission ? `📜 Доручення: ${mission.title}` : ''}
  >
    {mission && <MissionBody key={mission.id} mission={mission} {...rest} />}
  </Modal>
);
