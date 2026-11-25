/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw } from './icons';
import { MISSIONS } from '../game/missions';
import { MINIGAMES } from '../game/lore';
import { StationKind, StationParams } from '../game/types';
import { sound } from '../game/sound';
import { KIND_EMOJI, KIND_LABEL, StationGame } from './minigames/StationGame';
import { PixelEmoji } from './PixelEmoji';

interface Variant {
  title: string;
  place: string;
  intro: string;
  params: StationParams;
}

/** Що тренує кожна гра — коротко для дитини. */
const KIND_HINT: Record<StationKind, string> = {
  telegram: 'Склади речення з набірних брусків. Стережися зайвих слів!',
  memory: 'Запамʼятай картки, поки вони відкриті, і знайди пари.',
  rail: 'Відкручуй гайки на рейках, поки не доїхав ешелон.',
  wires: 'Протягни дроти до клем того ж кольору й знака.',
  skillcheck: 'Тисни, коли стрілка в зеленому секторі. Золото — ідеально!',
  hide: 'Працюй, ховайся від патруля, але стеж за подихом.',
  drawers: 'Шукай річ за підказками «гаряче — холодно».',
  codelock: 'Розгадай код за запискою й кольоровими підказками.',
  morse: 'Відстукай сигнал телеграфним ключем.',
  sorting: 'Розклади картки по скриньках і дізнайся, чому саме так.',
  tachanka: 'Мчи степом і перемикай колії, оминаючи перешкоди.',
  ford: 'Промацуй дно чи лід і переходь на той берег.',
  ships: 'Розсади людей так, щоб кожен пароплав був повний.',
  route: 'Веди колону від села до села крізь туман війни.',
  cipher: 'Крути шифрувальне коло, доки не прочитаєш правду.',
  stealth: 'Крок за кроком прокрадайся повз ліхтарі вартових.',
};

const ORDER: StationKind[] = [
  'tachanka',
  'stealth',
  'route',
  'ford',
  'cipher',
  'ships',
  'morse',
  'wires',
  'skillcheck',
  'hide',
  'rail',
  'drawers',
  'codelock',
  'sorting',
  'telegram',
  'memory',
];

/** Збирає всі варіанти кожної гри з доручень і привалів. */
function collectVariants(): Record<StationKind, Variant[]> {
  const out = Object.fromEntries(ORDER.map((k) => [k, [] as Variant[]])) as Record<StationKind, Variant[]>;
  for (const m of MISSIONS) {
    for (const s of m.stations) {
      for (const st of s.fork ? [s, s.fork.station] : [s]) {
        out[st.kind].push({ title: st.title, place: st.place, intro: st.intro, params: st.params });
      }
    }
  }
  for (const g of MINIGAMES) out[g.kind].push({ title: g.title, place: g.place ?? '', intro: g.intro, params: g.params });
  return out;
}

interface ArcadeViewProps {
  wins: string[];
  onWin: (kind: StationKind) => void;
}

/**
 * «Ігротека»: усі види міні-ігор в одному місці. Можна тренуватися без
 * ризику втратити серця, перемикати рівні з різних актів і збирати
 * перемоги для медалі «Майстер ігор».
 */
export const ArcadeView: React.FC<ArcadeViewProps> = ({ wins, onWin }) => {
  const variants = useMemo(collectVariants, []);
  const [kind, setKind] = useState<StationKind | null>(null);
  const [vi, setVi] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<boolean | null>(null);

  const list = kind ? variants[kind] : [];
  const v = list[vi % Math.max(1, list.length)];

  const open = (k: StationKind) => {
    sound.playSelect();
    setKind(k);
    setVi(0);
    setResult(null);
    setAttempt((a) => a + 1);
  };

  const finish = (won: boolean) => {
    setResult(won);
    if (won && kind) onWin(kind);
  };

  if (kind && v) {
    return (
      <div className="pixel-frame-violet pixel-frame mx-auto max-w-3xl space-y-4 bg-stone-950 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => setKind(null)} className="pixel-btn border-2 border-stone-600 bg-stone-800 px-3 py-1.5 text-sm">
            ◀ До Ігротеки
          </button>
          <span className="font-pixel text-[9px] text-violet-300">
            {KIND_LABEL[kind].toUpperCase()} · РІВЕНЬ {(vi % list.length) + 1}/{list.length}
          </span>
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold text-amber-300">
            {KIND_EMOJI[kind]} {v.title}
          </h2>
          {v.place && <div className="text-xs text-stone-400">📍 {v.place}</div>}
          <p className="mt-1 text-sm text-stone-200">{v.intro}</p>
        </div>
        {result === null ? (
          <StationGame key={`${kind}-${vi}-${attempt}`} kind={kind} params={v.params} place={v.place} onFinish={finish} />
        ) : (
          <div className={`space-y-3 border-2 p-4 text-center ${result ? 'border-emerald-600 bg-emerald-950/40' : 'border-rose-700 bg-rose-950/30'}`}>
            <PixelEmoji emoji={result ? '🏆' : '💔'} size={64} className="mx-auto" />
            <p className="font-bold">{result ? 'Перемога! Записано в Ігротеку.' : 'Не вийшло цього разу.'}</p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              setResult(null);
              setAttempt((a) => a + 1);
            }}
            className="pixel-btn flex items-center gap-1.5 border-2 border-stone-600 bg-stone-800 px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> Почати знову
          </button>
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setVi((i) => i + 1);
                setResult(null);
                setAttempt((a) => a + 1);
              }}
              className="pixel-btn flex items-center gap-1.5 border-2 border-amber-400 bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950"
            >
              Інший рівень <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="pixel-frame bg-stone-950 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-pixel text-[9px] text-violet-300">ІГРОТЕКА</div>
            <h2 className="font-serif text-2xl font-bold text-amber-300">Тренуйся в усіх міні-іграх</h2>
            <p className="max-w-2xl text-sm text-stone-300">
              Тут немає сердець і нічого не можна втратити. Обирай гру, перемикай рівні з різних актів і вигравай. Перемоги в десяти різних іграх дають медаль «Майстер ігор».
            </p>
          </div>
          <div className="border-2 border-violet-700 bg-violet-950/40 px-3 py-2 text-center">
            <div className="font-pixel text-lg text-violet-200">
              {wins.length}/{ORDER.length}
            </div>
            <div className="text-[11px] text-violet-300">ігор пройдено</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ORDER.map((k) => {
          const won = wins.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => open(k)}
              disabled={!variants[k].length}
              className={`pixel-btn flex flex-col items-start gap-2 border-2 p-3 text-left ${won ? 'border-emerald-600 bg-emerald-950/30' : 'border-stone-700 bg-stone-900 hover:border-violet-400'}`}
            >
              <span className="flex w-full items-center justify-between">
                <PixelEmoji emoji={KIND_EMOJI[k]} size={36} />
                {won && <span className="font-pixel text-[8px] text-emerald-300">✓ ПРОЙДЕНО</span>}
              </span>
              <span className="font-bold text-stone-100">{KIND_LABEL[k]}</span>
              <span className="text-xs leading-snug text-stone-400">{KIND_HINT[k]}</span>
              <span className="text-[10px] text-violet-300">Рівнів: {variants[k].length}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
