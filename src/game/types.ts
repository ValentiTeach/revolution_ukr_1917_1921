/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FactionId =
  | 'socialists'      // Соціал-демократи та есери (Винниченко, Грушевський)
  | 'independentists'  // Самостійники (Міхновський, Полуботківці)
  | 'military'        // Військовики та вільне козацтво (Петлюра, Коновалець)
  | 'conservatives'   // Хлібороби-власники, промисловці (Скоропадський)
  | 'peasantry'       // Селянські громади та повстанці (Селянські з'їзди)
  | 'galicians';      // Західноукраїнські сили (ЗУНР, УГА - Петрушевич, Вітовський)

export interface FactionInfo {
  id: FactionId;
  name: string;
  leader: string;
  description: string;
  color: string;
  icon: string;
  historicalAim: string;
}

export interface GameMetrics {
  nationalUnity: number;    // 0..100: Згуртованість між політичними таборами
  armyReadiness: number;    // 0..100: Боєздатність регулярних та добровольчих частин
  diplomacy: number;        // 0..100: Авторитет на міжнародній арені (Антанта / Брест / Європа)
  popularTrust: number;     // 0..100: Довіра народу, селянства та інтелігенції
  treasury: number;         // 0..100: Фінанси, державна казна та постачання
}

export type FactionReputation = Record<FactionId, number>; // 0..100

export type ChapterId =
  | 'CH1_RADA_CREATION'
  | 'CH2_NATIONAL_CONGRESS'
  | 'CH3_FIRST_UNIVERSAL'
  | 'CH4_SECOND_UNIVERSAL'
  | 'CH5_THIRD_UNIVERSAL'
  | 'CH6_FOURTH_UNIVERSAL_KRUTY'
  | 'CH7_HETMANATE_ORDER'
  | 'CH8_DIRECTORY_AND_ZLUKA'
  | 'CH9_TRIANGLE_OF_DEATH'
  | 'EPILOGUE';

export interface ChoiceRequirement {
  mission?: string;                              // треба виконати доручення
  artifact?: string;                             // треба мати знахідку
  faction?: { id: FactionId; min: number };      // треба мати довіру фракції
  label: string;                                 // підказка: як відкрити
}

export type ChoiceStyle = 'compromise' | 'secret' | 'daring';

export interface DialogueQuestion {
  id: string;
  q: string;   // що питає джура
  a: string;   // що відповідає персонаж
}

export interface DialogueChoice {
  id: string;
  text: string;
  style?: ChoiceStyle;
  requires?: ChoiceRequirement;
  ideologicalHint?: string;
  factionEffects: Partial<Record<FactionId, number>>;
  metricEffects: Partial<GameMetrics>;
  nextStepId?: string;
  historicalCanon?: boolean;
  reflection: string;
}

export interface DialogueStep {
  id: string;
  speaker: string;
  role: string;
  avatar: string; // pixel sprite identifier
  bgImageKey: 'hero' | 'rada' | 'map' | 'kruty';
  speech: string;
  contextNote?: string;
  choices: DialogueChoice[];
  questions?: DialogueQuestion[];
}

export interface UniversalClause {
  id: string;
  category: 'statehood' | 'army' | 'land' | 'diplomacy';
  title: string;
  description: string;
  factionSupport: Partial<Record<FactionId, number>>;
  metricsImpact: Partial<GameMetrics>;
}

export interface CityNode {
  id: string;
  name: string;
  nameUk: string;
  x: number; // percentage on map
  y: number; // percentage on map
  controlledBy: 'UNR' | 'ZUNR' | 'Bolsheviks' | 'Whites' | 'Contested';
  importance: 'capital' | 'major' | 'fortress';
  garrison: number; // thousands
  historicalNote: string;
}

export interface DecisionTreeNode {
  id: string;
  chapterId: ChapterId;
  title: string;
  year: string;
  chosenOptionText: string;
  wasCanon: boolean;
  consequences: string;
}

export interface HistoricalFigure {
  id: string;
  name: string;
  nameUk: string;
  years: string;
  role: string;
  bio: string;
  quote: string;
  sprite: string;
  factionId: FactionId;
}

export type EndingType =
  | 'HISTORICAL_TRAGIC'
  | 'SOBORNA_VICTORY'
  | 'BALTIC_BLACK_SEA_LEAGUE'
  | 'HETMANATE_STATEHOOD'
  | 'PEASANT_INSURGENT_REPUBLIC';

export interface EndingResult {
  type: EndingType;
  title: string;
  subtitle: string;
  description: string;
  achievements: string[];
  historicalComparison: string;
}

// ---------------------------------------------------------------------------
// Лор, прогрес героя та інтерактивні елементи
// ---------------------------------------------------------------------------

export type HeroSprite = 'hero_boy' | 'hero_girl';

export type BgKey = 'hero' | 'rada' | 'map' | 'kruty';

export interface HeroRank {
  id: string;
  title: string;      // Джура, Козак, Хорунжий...
  minStars: number;
  description: string;
}

export interface Artifact {
  id: string;
  name: string;
  emoji: string;
  bgKey: BgKey;       // на якій сцені захований
  x: number;          // % координати маркера на картині
  y: number;
  fact: string;       // цікавий факт простими словами
  stars: number;
}

export interface QuizQuestion {
  id: string;
  chapterId: ChapterId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DiaryEntry {
  chapterId: ChapterId;
  date: string;
  title: string;
  text: string;       // запис від першої особи героя
}

export type MinigameKind = 'telegram' | 'rail' | 'memory';

export interface MinigameConfig {
  chapterId: ChapterId;
  kind: MinigameKind;
  title: string;
  intro: string;
  // telegram: слова, які треба скласти у правильному порядку
  sentence?: string;
  // memory: пари символів
  pairs?: { emoji: string; label: string }[];
  // rail: скільки шпал треба розібрати та за скільки секунд
  railTarget?: number;
  railSeconds?: number;
  rewardStars: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export interface CompanionHint {
  stepId: string;
  text: string;       // підказка голуба простими словами
}

// ---------------------------------------------------------------------------
// Доручення: ланцюжки «дверей» з міні-іграми (у дусі DOORS / Forsaken)
// ---------------------------------------------------------------------------

export type StationKind =
  | 'telegram'
  | 'memory'
  | 'rail'
  | 'wires'
  | 'skillcheck'
  | 'hide'
  | 'drawers'
  | 'codelock'
  | 'morse'
  | 'sorting';

export interface StationParams {
  sentence?: string;
  pairs?: { emoji: string; label: string }[];
  railTarget?: number;
  railSeconds?: number;
  wires?: number;                                  // wires: скільки дротів
  hits?: number;                                   // skillcheck: скільки влучань
  speed?: number;                                  // skillcheck: швидкість стрілки
  work?: number;                                   // hide: скільки разів «працювати»
  patrols?: number;                                // hide: скільки разів пройде патруль
  drawers?: number;                                // drawers: кількість шухляд
  item?: string;                                   // drawers: що шукаємо
  code?: string;                                   // codelock: правильний код
  clues?: string[];                                // codelock: підказки
  word?: string;                                   // morse: слово
  sortItems?: { item: string; target: string }[];  // sorting
  sortTargets?: string[];
}

export interface MissionStation {
  id: string;
  title: string;
  place: string;
  emoji: string;
  kind: StationKind;
  intro: string;
  params: StationParams;
  /** Бічні двері: можна обрати інший, складніший шлях за бонус. */
  fork?: { label: string; bonusStars: number; station: Omit<MissionStation, 'fork'> };
}

export interface Mission {
  id: string;
  chapterId: ChapterId;
  title: string;
  giver: string;        // аватар
  giverName: string;
  brief: string;
  finale: string;
  rewardStars: number;
  rewardMetrics: Partial<GameMetrics>;
  stations: MissionStation[];
}
