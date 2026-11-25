/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { StationKind, StationParams } from '../../game/types';
import { TelegramPuzzle } from './TelegramPuzzle';
import { MemoryGame } from './MemoryGame';
import { RailSabotage } from './RailSabotage';
import { WiresGame } from './WiresGame';
import { SkillCheckGame } from './SkillCheckGame';
import { HideGame } from './HideGame';
import { DrawersGame } from './DrawersGame';
import { CodeLockGame } from './CodeLockGame';
import { MorseGame } from './MorseGame';
import { SortingGame } from './SortingGame';
import { TachankaGame } from './TachankaGame';
import { FordGame } from './FordGame';
import { ShipsGame } from './ShipsGame';
import { RouteGame } from './RouteGame';
import { CipherGame } from './CipherGame';
import { StealthGame } from './StealthGame';

export const KIND_LABEL: Record<StationKind, string> = {
  telegram: 'Склади речення',
  memory: 'Знайди пари',
  rail: 'Відкрути гайки',
  wires: 'Полагодь дроти',
  skillcheck: 'Влуч у зону',
  hide: 'Сховайся!',
  drawers: 'Знайди річ',
  codelock: 'Кодовий замок',
  morse: 'Азбука Морзе',
  sorting: 'Розклади по місцях',
  tachanka: 'Тачанка',
  ford: 'Брід',
  ships: 'Пароплави',
  route: 'Маршрут походу',
  cipher: 'Шифрувальне коло',
  stealth: 'Прокрадися',
};

export const KIND_EMOJI: Record<StationKind, string> = {
  telegram: '☎️',
  memory: '🃏',
  rail: '🔧',
  wires: '🔌',
  skillcheck: '🎯',
  hide: '🙈',
  drawers: '🗄️',
  codelock: '🔐',
  morse: '📡',
  sorting: '📥',
  tachanka: '🐎',
  ford: '🌊',
  ships: '🚢',
  route: '🧭',
  cipher: '🌀',
  stealth: '🔦',
};

/** Вмикає потрібну міні-гру за видом і параметрами. */
export const StationGame: React.FC<{ kind: StationKind; params: StationParams; place?: string; onFinish: (won: boolean) => void }> = ({
  kind,
  params: p,
  place = '',
  onFinish,
}) => {
  switch (kind) {
    case 'telegram':
      return <TelegramPuzzle sentence={p.sentence ?? 'Слава Україні'} decoys={p.decoys} onFinish={onFinish} />;
    case 'memory':
      return <MemoryGame pairs={p.pairs ?? []} onFinish={onFinish} />;
    case 'rail':
      return <RailSabotage target={p.railTarget ?? 10} seconds={p.railSeconds ?? 20} onFinish={onFinish} />;
    case 'wires':
      return <WiresGame wires={p.wires ?? 4} onFinish={onFinish} />;
    case 'skillcheck':
      return <SkillCheckGame hits={p.hits ?? 3} speed={p.speed ?? 1} onFinish={onFinish} />;
    case 'hide':
      return <HideGame work={p.work ?? 8} patrols={p.patrols ?? 2} place={place} onFinish={onFinish} />;
    case 'drawers':
      return <DrawersGame drawers={p.drawers ?? 9} item={p.item ?? '🗝️ Ключ'} onFinish={onFinish} />;
    case 'codelock':
      return <CodeLockGame code={p.code ?? '0000'} clues={p.clues ?? []} onFinish={onFinish} />;
    case 'morse':
      return <MorseGame word={p.word ?? 'УНР'} onFinish={onFinish} />;
    case 'sorting':
      return <SortingGame items={p.sortItems ?? []} targets={p.sortTargets ?? []} onFinish={onFinish} />;
    case 'tachanka':
      return <TachankaGame distance={p.distance ?? 400} night={p.night} onFinish={onFinish} />;
    case 'ford':
      return <FordGame theme={p.fordTheme} cols={p.fordCols} rows={p.fordRows} onFinish={onFinish} />;
    case 'ships':
      return <ShipsGame ships={p.ships ?? []} groups={p.groups ?? []} seconds={p.shipSeconds} onFinish={onFinish} />;
    case 'route':
      return <RouteGame map={p.routeMap ?? ['S.F']} food={p.routeFood ?? 8} warmth={p.routeWarmth ?? 6} onFinish={onFinish} />;
    case 'cipher':
      return <CipherGame text={p.cipherText ?? 'Слава Україні'} shift={p.cipherShift ?? 3} onFinish={onFinish} />;
    case 'stealth':
      return <StealthGame map={p.stealthMap ?? ['#####', '#S.E#', '#####']} guards={p.guards ?? []} theme={p.stealthTheme} onFinish={onFinish} />;
    default:
      return null;
  }
};
