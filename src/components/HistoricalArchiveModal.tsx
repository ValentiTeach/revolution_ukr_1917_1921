/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, User, Calendar, Quote, CheckCircle } from 'lucide-react';
import { HISTORICAL_FIGURES, HISTORICAL_CHRONOLOGY } from '../game/historicalData';
import { PixelAvatar } from './PixelAvatar';
import { sound } from '../game/sound';

export const HistoricalArchiveModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'figures' | 'chronology' | 'lexicon'>('figures');
  const [selectedFigureId, setSelectedFigureId] = useState<string>(HISTORICAL_FIGURES[0].id);

  const selectedFigure =
    HISTORICAL_FIGURES.find((f) => f.id === selectedFigureId) || HISTORICAL_FIGURES[0];

  const lexiconTerms = [
    {
      term: 'Українська Центральна Рада (УЦР)',
      desc: 'Представницький орган українських політичних, громадських, культурних та професійних організацій; після Всеукраїнського національного конгресу — революційний парламент України (березень 1917 — квітень 1918). Очолював Михайло Грушевський.',
    },
    {
      term: 'Генеральний Секретаріат',
      desc: 'Перший український уряд, утворений Центральною Радою після прийняття I Універсалу в червні 1917 року. Першим головою став Володимир Винниченко.',
    },
    {
      term: 'Універсали УЦР (I, II, III, IV)',
      desc: 'Державно-політичні акти, які визначали етапи становлення української державності: від автономії у складі Росії (I та II) до проголошення УНР (III) та повної суверенної незалежності (IV від 22 січня 1918).',
    },
    {
      term: 'Вільне Козацтво',
      desc: 'Добровільні міліцейські та самооборонні формування селянства й робітників для захисту сіл від мародерства та більшовицької анархії у 1917–1918 роках. Першим отаманом обрано Павла Скоропадського.',
    },
    {
      term: 'Бій під Крутами (29 січня 1918)',
      desc: 'Оборонний бій на залізничній станції Крути, де близько 400 курсантів 1-ї Української військової школи та бійців Студентського куреня героїчно затримали 4-тисячний більшовицький загін Муравйова.',
    },
    {
      term: 'Українська Держава (Гетьманат)',
      desc: 'Державний устрій України на чолі з гетьманом Павлом Скоропадським (29 квітня — 14 грудня 1918 р.). Час активної розбудови академічних інституцій (НАНУ, бібліотека), стабільної валюти (гривня) та міжнародного визнання.',
    },
    {
      term: 'Акт Злуки (22 січня 1919)',
      desc: 'Урочисте проголошення на Софійському майдані в Києві обʼєднання Української Народної Республіки та Західноукраїнської Народної Республіки в єдину соборну державу.',
    },
    {
      term: '«Трикутник смерті» (1919–1920)',
      desc: 'Район на Поділлі (Любар–Шепетівка–Миропіль), де армія УНР опинилася затиснутою між трьома ворожими силами: червоними більшовиками, білогвардійцями Денікіна та польськими військами в умовах епідемії тифу.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Archive Header */}
      <div className="border border-stone-800 bg-stone-900/90 p-5 text-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-300">
                Історичний Архів: Постаті та Документи 1917–1921
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-400 max-w-xl">
              Автентичні біографічні довідки, хронологія подій та енциклопедичний словник доби Української революції.
            </p>
          </div>

          {/* Subtabs */}
          <div className="flex items-center gap-1 bg-stone-950 p-1 border border-stone-800 text-xs">
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setActiveTab('figures');
              }}
              className={`px-3 py-1.5 transition-colors ${
                activeTab === 'figures' ? 'bg-amber-950/80 text-amber-300 font-bold' : 'text-stone-400'
              }`}
            >
              Діячі Революції
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setActiveTab('chronology');
              }}
              className={`px-3 py-1.5 transition-colors ${
                activeTab === 'chronology' ? 'bg-amber-950/80 text-amber-300 font-bold' : 'text-stone-400'
              }`}
            >
              Хронологія
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setActiveTab('lexicon');
              }}
              className={`px-3 py-1.5 transition-colors ${
                activeTab === 'lexicon' ? 'bg-amber-950/80 text-amber-300 font-bold' : 'text-stone-400'
              }`}
            >
              Словник Епохи
            </button>
          </div>
        </div>
      </div>

      {/* Figures Tab */}
      {activeTab === 'figures' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of figures */}
          <div className="space-y-2">
            {HISTORICAL_FIGURES.map((fig) => {
              const isSelected = fig.id === selectedFigureId;
              return (
                <button
                  key={fig.id}
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    setSelectedFigureId(fig.id);
                  }}
                  className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-stone-850 shadow-md'
                      : 'border-stone-800 bg-stone-900/60 hover:border-stone-700'
                  }`}
                >
                  <PixelAvatar id={fig.sprite} size="sm" />
                  <div className="overflow-hidden">
                    <div className="font-serif text-sm font-bold text-stone-100 truncate">
                      {fig.nameUk}
                    </div>
                    <div className="text-[11px] text-stone-400 truncate">{fig.years}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Figure Detail */}
          <div className="lg:col-span-2 border border-stone-800 bg-stone-900/90 p-6 text-stone-200 space-y-4 shadow-md">
            <div className="flex items-start gap-4 border-b border-stone-800 pb-4">
              <PixelAvatar id={selectedFigure.sprite} size="lg" className="border-2 border-amber-500" />
              <div>
                <h3 className="font-serif text-xl font-bold text-amber-300">
                  {selectedFigure.nameUk}
                </h3>
                <div className="text-xs text-stone-400">{selectedFigure.years}</div>
                <div className="text-xs text-stone-300 font-medium mt-1">
                  {selectedFigure.role}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">
                Біографічний нарис:
              </h4>
              <p className="text-sm leading-relaxed text-stone-300">
                {selectedFigure.bio}
              </p>
            </div>

            <div className="border border-stone-800 bg-stone-950 p-4 relative">
              <Quote className="h-4 w-4 text-amber-400/60 absolute top-2 right-2" />
              <p className="font-serif italic text-stone-200 text-sm leading-relaxed">
                «{selectedFigure.quote}»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chronology Tab */}
      {activeTab === 'chronology' && (
        <div className="border border-stone-800 bg-stone-900/90 p-6 space-y-4">
          <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
            {HISTORICAL_CHRONOLOGY.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-amber-500 bg-stone-950 text-amber-400 text-xs font-mono">
                  {idx + 1}
                </div>
                <div className="border border-stone-800 bg-stone-950/70 p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {item.date}
                    </span>
                    <span className="text-stone-500">·</span>
                    <h4 className="font-serif text-sm font-bold text-stone-100">
                      {item.event}
                    </h4>
                  </div>
                  <p className="mt-1 text-xs text-stone-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lexicon Tab */}
      {activeTab === 'lexicon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lexiconTerms.map((term, idx) => (
            <div key={idx} className="border border-stone-800 bg-stone-900/80 p-4 space-y-1.5">
              <h4 className="font-serif text-sm font-bold text-amber-300">
                {term.term}
              </h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                {term.desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
