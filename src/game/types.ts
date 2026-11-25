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
  | 'ACT_RED_MASKS'              // Республіки-маски: другий наступ червоних (зима 1919)
  | 'ACT_OTAMANSHCHYNA'          // Отаманщина й повстанські республіки (весна–літо 1919)
  | 'ACT_AUGUST_1919'            // Київ, Денікін і рейд Махна (серпень–жовтень 1919)
  | 'CH9_TRIANGLE_OF_DEATH'      // Трикутник смерті (листопад 1919)
  | 'ACT_FIRST_WINTER_CAMPAIGN'  // Перший Зимовий похід (грудень 1919 – травень 1920)
  | 'ACT_1920_WARSAW'            // Варшавський союз і Замостя (1920)
  | 'ACT_CRIMEA_1920'            // Старобільськ, Сиваш, евакуація білих (жовтень–листопад 1920)
  | 'ACT_1921_FALL'              // Рига, Другий Зимовий похід, Базар (1921)
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
  bgImageKey: BgKey;
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

export interface ChapterConfig {
  title: string;
  period: string;
  summary: string;
  bgKey: BgKey;
  startStepId: string;
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
  /** Справжня цитата або гасло. Порожній рядок — цитати немає, показуємо факт. */
  quote: string;
  /** Звідки цитата (наприклад, «напис на прапорі»). */
  quoteNote?: string;
  /** Памʼятний факт замість вигаданої цитати. */
  fact?: string;
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

export type BgKey =
  | 'hero'
  | 'rada'
  | 'map'
  | 'kruty'
  | 'winter'     // засніжений шлях Зимового походу
  | 'steppe'     // степ на заході сонця, тачанки
  | 'forest'     // нічний ліс Холодного Яру
  | 'harbor'     // Севастопольська бухта, евакуація
  | 'syvash'     // нічний брід через Сиваш
  | 'armored'    // бронепотяг на донецькій станції
  | 'kamianets'  // фортеця Камʼянця-Подільського
  | 'fortress'   // мури Замостя, 1920
  | 'memorial';  // поле памʼяті під Базаром

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

/** Міні-гра на привалі після акту: будь-який вид «дверей» зі своїми параметрами. */
export interface MinigameConfig {
  chapterId: ChapterId;
  kind: StationKind;
  title: string;
  intro: string;
  /** Місце дії (для ігор, яким воно потрібне). */
  place?: string;
  params: StationParams;
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
  | 'sorting'
  | 'tachanka'   // мчи тачанкою степом, оминай перешкоди
  | 'ford'       // промацуй брід жердиною (Сиваш, лід)
  | 'ships'      // розподіли людей по пароплавах
  | 'route'      // проклади маршрут походу картою з туманом
  | 'cipher'     // розшифруй телеграму шифрувальним колом
  | 'stealth';   // прокрадися повз вартових покроково

/** Вартовий у грі «Прокрадися»: стартова клітинка та маршрут (U/D/L/R, W — чекати). */
export interface StealthGuard {
  x: number;
  y: number;
  path: string;
}

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
  sortItems?: { item: string; target: string; why?: string }[];  // sorting
  sortTargets?: string[];
  decoys?: string[];                               // telegram: зайві слова-пастки
  distance?: number;                               // tachanka: скільки метрів проїхати
  night?: boolean;                                 // tachanka: нічний рейд
  fordTheme?: 'sea' | 'ice';                       // ford: солона вода чи лід
  fordCols?: number;
  fordRows?: number;
  ships?: { name: string; capacity: number }[];    // ships: пароплави
  groups?: { label: string; emoji: string; size: number }[]; // ships: групи людей
  shipSeconds?: number;
  routeMap?: string[];                             // route: мапа (див. RouteGame)
  routeFood?: number;
  routeWarmth?: number;
  cipherText?: string;                             // cipher: відкритий текст
  cipherShift?: number;                            // cipher: зсув шифру
  stealthMap?: string[];                           // stealth: рівень (див. StealthGame)
  guards?: StealthGuard[];
  stealthTheme?: 'forest' | 'station' | 'snow';    // stealth: як виглядає рівень
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
