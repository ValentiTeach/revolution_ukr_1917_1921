/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GitBranch, CheckCircle2, Circle, Clock, Info, ArrowRight } from 'lucide-react';
import { ChapterId, DecisionTreeNode } from '../game/types';
import { CHAPTER_CONFIG } from '../game/historicalData';
import { sound } from '../game/sound';

interface DecisionTreeModalProps {
  decisionHistory: DecisionTreeNode[];
  currentChapter: ChapterId;
  isAlternateHistory: boolean;
  onJumpToChapter: (chapterId: ChapterId) => void;
}

export const DecisionTreeModal: React.FC<DecisionTreeModalProps> = ({
  decisionHistory,
  currentChapter,
  isAlternateHistory,
  onJumpToChapter,
}) => {
  const [selectedNode, setSelectedNode] = useState<DecisionTreeNode | null>(
    decisionHistory.length > 0 ? decisionHistory[decisionHistory.length - 1] : null
  );

  const chapters = Object.keys(CHAPTER_CONFIG) as ChapterId[];

  const canonChoicesCount = decisionHistory.filter((d) => d.wasCanon).length;
  const altChoicesCount = decisionHistory.filter((d) => !d.wasCanon).length;
  const totalDecisions = decisionHistory.length;
  const canonPercent = totalDecisions > 0 ? Math.round((canonChoicesCount / totalDecisions) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="border border-stone-800 bg-stone-900/90 p-5 text-stone-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-amber-400" />
              <h2 className="font-serif text-lg font-bold text-amber-300">
                Дерево Долі: Хроніка Моральних Виборів
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-400 max-w-xl">
              Кожне рішення залишає незгладимий слід на балансі фракцій та долі державності. Ви можете дослідити як історичний канон, так і альтернативні шляхи розбудови України.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-stone-950/80 border border-stone-800 px-4 py-2.5 text-xs">
            <div>
              <span className="text-stone-400 text-[11px] block">Канонічність лінії:</span>
              <span className="font-mono font-bold text-amber-300 text-sm">{canonPercent}%</span>
            </div>
            <div className="h-8 w-px bg-stone-800" />
            <div>
              <span className="text-stone-400 text-[11px] block">Історичні вибори:</span>
              <span className="font-mono font-bold text-stone-200 text-sm">{canonChoicesCount}</span>
            </div>
            <div className="h-8 w-px bg-stone-800" />
            <div>
              <span className="text-stone-400 text-[11px] block">Альтернативні:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{altChoicesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Branching Timeline Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Tree Visual Nodes */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-serif text-sm font-semibold text-stone-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Вузли Історичного Розгалуження (1917–1921)</span>
          </h3>

          <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
            {chapters.map((cid, idx) => {
              const cfg = CHAPTER_CONFIG[cid];
              const historyNode = decisionHistory.find((d) => d.chapterId === cid);
              const isCurrent = currentChapter === cid;
              const isDone = !!historyNode;

              return (
                <div key={cid} className="relative">
                  {/* Node marker on vertical timeline */}
                  <div
                    className={`absolute -left-6 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-mono transition-colors ${
                      isCurrent
                        ? 'border-amber-400 bg-amber-950 text-amber-300 shadow-md'
                        : isDone
                        ? historyNode.wasCanon
                          ? 'border-stone-500 bg-stone-800 text-stone-200'
                          : 'border-emerald-500 bg-emerald-950 text-emerald-300'
                        : 'border-stone-800 bg-stone-900 text-stone-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : isCurrent ? (
                      <Circle className="h-3.5 w-3.5 fill-amber-400" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Node card */}
                  <div
                    onClick={() => {
                      if (historyNode) {
                        sound.playSelect();
                        setSelectedNode(historyNode);
                      }
                    }}
                    className={`border p-4 transition-all ${
                      historyNode
                        ? selectedNode?.id === historyNode.id
                          ? 'border-amber-400 bg-stone-850 shadow-md cursor-pointer'
                          : 'border-stone-800 bg-stone-900/80 hover:border-stone-700 cursor-pointer'
                        : isCurrent
                        ? 'border-amber-600/70 bg-amber-950/20'
                        : 'border-stone-900 bg-stone-950/40 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm font-bold text-stone-100">
                          {cfg.title}
                        </span>
                        <span className="text-xs text-stone-400">({cfg.period})</span>
                      </div>

                      {historyNode ? (
                        historyNode.wasCanon ? (
                          <span className="text-[10px] font-mono uppercase border border-stone-700 bg-stone-800 px-2 py-0.5 text-stone-300">
                            Історичний канон
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono uppercase border border-emerald-800 bg-emerald-950 px-2 py-0.5 text-emerald-300">
                            Альтернативна гілка
                          </span>
                        )
                      ) : isCurrent ? (
                        <span className="text-[10px] font-mono uppercase border border-amber-600 bg-amber-900/60 px-2 py-0.5 text-amber-300">
                          Поточна подія
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-600">Очікується</span>
                      )}
                    </div>

                    {historyNode && (
                      <div className="mt-2 text-xs text-stone-300">
                        <span className="text-stone-400">Обраний крок: </span>
                        <strong>«{historyNode.chosenOptionText}»</strong>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-stone-800/60">
                      <p className="text-stone-400 text-[11px] truncate max-w-sm">
                        {cfg.summary}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playSelect();
                          onJumpToChapter(cid);
                        }}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:underline shrink-0"
                      >
                        <span>Перейти</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right col: Selected Node Inspector */}
        <div className="space-y-4">
          <h3 className="font-serif text-sm font-semibold text-stone-300 flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-400" />
            <span>Аналіз Наслідків Вибору</span>
          </h3>

          {selectedNode ? (
            <div className="border border-stone-800 bg-stone-900/90 p-5 space-y-4 text-xs text-stone-300 shadow-md">
              <div className="border-b border-stone-800 pb-3">
                <span className="text-[11px] text-stone-400">{selectedNode.year}</span>
                <h4 className="font-serif text-base font-bold text-amber-300 mt-0.5">
                  {selectedNode.title}
                </h4>
              </div>

              <div>
                <span className="text-stone-400 block mb-1">Прийняте рішення:</span>
                <div className="bg-stone-950 p-3 border border-stone-800 text-stone-100 font-medium leading-relaxed">
                  «{selectedNode.chosenOptionText}»
                </div>
              </div>

              <div>
                <span className="text-stone-400 block mb-1">Наслідки для нації:</span>
                <p className="text-stone-300 leading-relaxed bg-stone-950/60 p-3 border border-stone-800/80">
                  {selectedNode.consequences}
                </p>
              </div>

              <div className="border-t border-stone-800 pt-3">
                <div className="flex items-center justify-between text-stone-400">
                  <span>Тип гілки:</span>
                  <span className={selectedNode.wasCanon ? 'text-stone-200' : 'text-emerald-400 font-semibold'}>
                    {selectedNode.wasCanon ? 'Відповідає історії 1917–1921' : 'Сформовано нову гілку подій'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-stone-800 bg-stone-900/50 p-6 text-center text-xs text-stone-500">
              Виберіть будь-який завершений вузол ліворуч, щоб переглянути історичний аналіз прийнятого рішення.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
