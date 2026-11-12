/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChapterId,
  DialogueChoice,
  EndingResult,
  FactionId,
  FactionReputation,
  GameMetrics,
  UniversalClause,
  DecisionTreeNode,
  HeroRank,
  HeroSprite,
} from './types';

export interface GameState {
  version: number;
  chapter: ChapterId;
  currentStepId: string;
  metrics: GameMetrics;
  reputation: FactionReputation;
  decisionHistory: DecisionTreeNode[];
  unlockedChapters: ChapterId[];
  isAlternateHistory: boolean;
  activeUniversalClauses: string[];
  // --- Герой та прогрес ---
  heroName: string;
  heroSprite: HeroSprite;
  hasSeenPrologue: boolean;
  stars: number;
  artifacts: string[];            // зібрані знахідки
  achievements: string[];         // відкриті досягнення
  completedChapters: ChapterId[]; // акти, за які пройдено інтерлюдію
  quizCorrect: string[];          // id правильно відповіданих питань
  minigamesWon: string[];         // chapterId виграних міні-ігор
  usedOperations: string[];       // штабні операції, які вже проведено
  proclaimedUniversals: number;   // скільки Універсалів проголошено
}

export const STATE_VERSION = 2;

export const HERO_RANKS: HeroRank[] = [
  { id: 'dzhura', title: 'Джура', minStars: 0, description: 'Юний посильний Центральної Ради. Усе ще попереду!' },
  { id: 'kozak', title: 'Козак', minStars: 6, description: 'Тебе вже впізнають у коридорах Педагогічного музею.' },
  { id: 'khorunzhyi', title: 'Хорунжий', minStars: 14, description: 'Тобі довіряють нести прапор на урочистостях.' },
  { id: 'sotnyk', title: 'Сотник', minStars: 24, description: 'Ти вмієш домовлятися з делегатами та солдатами.' },
  { id: 'polkovnyk', title: 'Полковник', minStars: 36, description: 'Твоє слово важить на засіданнях уряду.' },
  { id: 'otaman', title: 'Отаман Долі', minStars: 50, description: 'Легенда революції. Про тебе складатимуть пісні!' },
];

export function getRank(stars: number): HeroRank {
  let current = HERO_RANKS[0];
  for (const rank of HERO_RANKS) {
    if (stars >= rank.minStars) current = rank;
  }
  return current;
}

export function getNextRank(stars: number): HeroRank | null {
  return HERO_RANKS.find((r) => r.minStars > stars) ?? null;
}

export const INITIAL_METRICS: GameMetrics = {
  nationalUnity: 50,
  armyReadiness: 35,
  diplomacy: 40,
  popularTrust: 65,
  treasury: 45,
};

export const INITIAL_REPUTATION: FactionReputation = {
  socialists: 60,
  independentists: 45,
  military: 50,
  conservatives: 40,
  peasantry: 65,
  galicians: 55,
};

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function createInitialGameState(): GameState {
  return {
    version: STATE_VERSION,
    chapter: 'CH1_RADA_CREATION',
    currentStepId: 'step_ch1_1',
    metrics: { ...INITIAL_METRICS },
    reputation: { ...INITIAL_REPUTATION },
    decisionHistory: [],
    unlockedChapters: ['CH1_RADA_CREATION'],
    isAlternateHistory: false,
    activeUniversalClauses: [],
    heroName: '',
    heroSprite: 'hero_boy',
    hasSeenPrologue: false,
    stars: 0,
    artifacts: [],
    achievements: [],
    completedChapters: [],
    quizCorrect: [],
    minigamesWon: [],
    usedOperations: [],
    proclaimedUniversals: 0,
  };
}

/**
 * Обережно піднімає старе збереження до поточної версії:
 * усі відсутні поля отримують значення за замовчуванням.
 */
export function migrateGameState(raw: unknown): GameState {
  const fresh = createInitialGameState();
  if (!raw || typeof raw !== 'object') return fresh;
  const saved = raw as Partial<GameState>;
  const merged: GameState = {
    ...fresh,
    ...saved,
    version: STATE_VERSION,
    metrics: { ...fresh.metrics, ...(saved.metrics ?? {}) },
    reputation: { ...fresh.reputation, ...(saved.reputation ?? {}) },
    decisionHistory: Array.isArray(saved.decisionHistory) ? saved.decisionHistory : [],
    artifacts: Array.isArray(saved.artifacts) ? saved.artifacts : [],
    achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
    completedChapters: Array.isArray(saved.completedChapters) ? saved.completedChapters : [],
    quizCorrect: Array.isArray(saved.quizCorrect) ? saved.quizCorrect : [],
    minigamesWon: Array.isArray(saved.minigamesWon) ? saved.minigamesWon : [],
    usedOperations: Array.isArray(saved.usedOperations) ? saved.usedOperations : [],
  };
  if (!merged.currentStepId || merged.currentStepId === 'rada_birth_1') {
    merged.currentStepId = 'step_ch1_1';
  }
  return merged;
}

/** Додає зірки та повертає новий стан (без мутації). */
export function awardStars(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;
  return { ...state, stars: state.stars + amount };
}

/** Відкриває досягнення, якщо воно ще не відкрите. Повертає [стан, чиНове]. */
export function unlockAchievement(state: GameState, id: string): [GameState, boolean] {
  if (state.achievements.includes(id)) return [state, false];
  return [{ ...state, achievements: [...state.achievements, id] }, true];
}

/** Перевіряє умови досягнень, які залежать від загального стану. */
export function evaluateAchievements(state: GameState, totalArtifacts: number): { state: GameState; newlyUnlocked: string[] } {
  let next = state;
  const unlocked: string[] = [];
  const tryUnlock = (id: string, condition: boolean) => {
    if (!condition) return;
    const [s, isNew] = unlockAchievement(next, id);
    next = s;
    if (isNew) unlocked.push(id);
  };

  tryUnlock('first_choice', state.decisionHistory.length >= 1);
  tryUnlock('alt_history', state.decisionHistory.some((d) => !d.wasCanon));
  tryUnlock('collector_3', state.artifacts.length >= 3);
  tryUnlock('collector_all', totalArtifacts > 0 && state.artifacts.length >= totalArtifacts);
  tryUnlock('quiz_master', state.quizCorrect.length >= 5);
  tryUnlock('kruty_hero', state.minigamesWon.includes('CH6_FOURTH_UNIVERSAL_KRUTY'));
  tryUnlock('lawmaker', state.proclaimedUniversals >= 1);
  tryUnlock('strategist', state.usedOperations.length >= 1);
  tryUnlock('unity_builder', state.metrics.nationalUnity >= 80);
  tryUnlock('soborna', state.chapter === 'EPILOGUE');
  tryUnlock('otaman', state.stars >= 50);

  return { state: next, newlyUnlocked: unlocked };
}

export function applyChoiceToState(
  state: GameState,
  choice: DialogueChoice,
  stepTitle: string,
  year: string
): GameState {
  const newMetrics: GameMetrics = { ...state.metrics };
  if (choice.metricEffects) {
    (Object.keys(choice.metricEffects) as (keyof GameMetrics)[]).forEach((key) => {
      const delta = choice.metricEffects[key] ?? 0;
      newMetrics[key] = clamp(newMetrics[key] + delta);
    });
  }

  const newReputation: FactionReputation = { ...state.reputation };
  if (choice.factionEffects) {
    (Object.keys(choice.factionEffects) as FactionId[]).forEach((faction) => {
      const delta = choice.factionEffects[faction] ?? 0;
      newReputation[faction] = clamp(newReputation[faction] + delta);
    });
  }

  const newDecision: DecisionTreeNode = {
    id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    chapterId: state.chapter,
    title: stepTitle,
    year,
    chosenOptionText: choice.text,
    wasCanon: choice.historicalCanon ?? true,
    consequences: choice.reflection,
  };

  const isAltNow = state.isAlternateHistory || choice.historicalCanon === false;

  return {
    ...state,
    metrics: newMetrics,
    reputation: newReputation,
    decisionHistory: [...state.decisionHistory, newDecision],
    isAlternateHistory: isAltNow,
  };
}

export function evaluateUniversalDraft(clauses: UniversalClause[]): {
  totalSupport: number;
  factionApprovals: Record<FactionId, number>;
  projectedMetrics: Partial<GameMetrics>;
} {
  const approvals: Record<FactionId, number> = {
    socialists: 0,
    independentists: 0,
    military: 0,
    conservatives: 0,
    peasantry: 0,
    galicians: 0,
  };

  const projectedMetrics: Partial<GameMetrics> = {
    nationalUnity: 0,
    armyReadiness: 0,
    diplomacy: 0,
    popularTrust: 0,
    treasury: 0,
  };

  clauses.forEach((clause) => {
    (Object.keys(clause.factionSupport) as FactionId[]).forEach((fid) => {
      approvals[fid] += clause.factionSupport[fid] ?? 0;
    });

    if (clause.metricsImpact) {
      (Object.keys(clause.metricsImpact) as (keyof GameMetrics)[]).forEach((k) => {
        projectedMetrics[k] = (projectedMetrics[k] ?? 0) + (clause.metricsImpact[k] ?? 0);
      });
    }
  });

  const totalSupport = Math.round(
    Object.values(approvals).reduce((acc, val) => acc + val, 0) /
      Math.max(1, Object.keys(approvals).length)
  );

  return {
    totalSupport,
    factionApprovals: approvals,
    projectedMetrics,
  };
}

export function resolveStaffBattle(
  friendlyTroops: number,
  enemyTroops: number,
  fortificationLevel: number,
  armyReadiness: number
): {
  victory: boolean;
  friendlyLosses: number;
  enemyLosses: number;
  tacticalReport: string;
} {
  const combatPower = friendlyTroops * (armyReadiness / 50) * (1 + fortificationLevel * 0.25);
  const enemyCombatPower = enemyTroops * 1.0;

  const victory = combatPower >= enemyCombatPower * 0.85;

  let friendlyLosses = 0;
  let enemyLosses = 0;

  if (victory) {
    friendlyLosses = Math.min(friendlyTroops, Math.round(friendlyTroops * (0.15 + (100 - armyReadiness) * 0.002)));
    enemyLosses = Math.min(enemyTroops, Math.round(enemyTroops * 0.45));
    return {
      victory: true,
      friendlyLosses,
      enemyLosses,
      tacticalReport: `Перемога! Вдалося утримати залізничний вузол та відкинути сили інтервентів. Ворог зазнав значних втрат (~${enemyLosses} бійців).`,
    };
  } else {
    friendlyLosses = Math.min(friendlyTroops, Math.round(friendlyTroops * 0.4));
    enemyLosses = Math.min(enemyTroops, Math.round(enemyTroops * 0.2));
    return {
      victory: false,
      friendlyLosses,
      enemyLosses,
      tacticalReport: `Позиції довелося залишити через чисельну перевагу супротивника. Частини організовано відійшли на запасні рубежі.`,
    };
  }
}

export function determineGameEnding(state: GameState): EndingResult {
  const { nationalUnity, armyReadiness, diplomacy, popularTrust, treasury } = state.metrics;
  const avgFactions =
    Object.values(state.reputation).reduce((a, b) => a + b, 0) / Object.keys(state.reputation).length;

  // 1. Great Soborna Victory (Requires high unity and high army, united fronts)
  if (nationalUnity >= 65 && armyReadiness >= 65 && popularTrust >= 55) {
    return {
      type: 'SOBORNA_VICTORY',
      title: 'Тріумф Соборної України',
      subtitle: 'Альтернативна історія: Єдність здолала імперії',
      description:
        'Вам вдалося неможливе: подолати розбрат між соціалістами Винниченка, самостійниками Міхновського, гетьманцями Скоропадського та галичанами Петрушевича! Створена регулярна 300-тисячна армія зупинила більшовицький наступ під Крутами та Полтавою, а Акт Злуки 1919 року став фундаментом непохитної європейської демократичної держави. Україна отримала міжнародне визнання у Версалі.',
      achievements: [
        'Створено професійну регулярну армію УНР та УГА',
        'Подолано внутрішній партійний розкол',
        'Дипломатичний тріумф на Паризькій мирній конференції',
        'Збережено суверенітет та територіальну цілісність усіх українських земель',
      ],
      historicalComparison:
        'В реальній історії 1917–1921 рр. взаємні чвари між лідерами та запізніле створення армії призвели до поразки. Ваш результат довів, що єдність була ключем до порятунку держави.',
    };
  }

  // 2. Hetmanate Institutional Order (High treasury, diplomacy, conservative backing)
  if (state.reputation.conservatives >= 65 && treasury >= 60 && armyReadiness >= 55) {
    return {
      type: 'HETMANATE_STATEHOOD',
      title: 'Модерна Українська Держава',
      subtitle: 'Шлях міцних інституцій та порядку',
      description:
        'Зберігши інституційну спадщину гетьмана Скоропадського та водночас давши гарантії соціальних реформ, Україна вибудувала сильну фінансову систему з гривнею, Національну Академію Наук та стабільну дипломатію. Більшовицький наступ розбився об залізні шеренги реорганізованого козацтва та професійних офіцерів.',
      achievements: [
        'Створено стабільну валюту — Українську Гривню',
        'Засновано Українську Академію Наук та університети',
        'Розбудовано регулярний офіцерський корпус',
        'Встановлено дипломатичні відносини з 30 країнами світу',
      ],
      historicalComparison:
        'У 1918 р. Скоропадський мав сильний економічний базис, але втратив підтримку через проросійську грамоту та конфлікт із соціалістами. Ви змогли уникнути цього фатального кроку.',
    };
  }

  // 3. Baltic-Black Sea League (High diplomacy, alliance strategy)
  if (diplomacy >= 70 && nationalUnity >= 50) {
    return {
      type: 'BALTIC_BLACK_SEA_LEAGUE',
      title: 'Міжморʼя: Балто-Чорноморський Союз',
      subtitle: 'Дипломатичний щит проти агресії зі Сходу',
      description:
        'Україна стала стрижнем оборонного союзу разом із Польщею, Фінляндією, Естонією, Латвією та Литвою. Спільний фронт демократій зупинив експансію більшовизму біля Дніпра, а спільна комісія закріпила кордони за міжнародним правом.',
      achievements: [
        'Укладено рівноправний договір про військову допомогу',
        'Створено пояс безпеки від Балтики до Чорного моря',
        'Врятовано державність ціною розумних дипломатичних поступок',
      ],
      historicalComparison:
        'Ідея Балто-Чорноморської конфедерації Михайла Грушевського та Юзефа Пілсудського була близька до втілення, але зірвалася через недовіру. Ви перетворили її на реальність.',
    };
  }

  // 4. Peasant Insurgent Republic (High popular trust & peasantry backing)
  if (popularTrust >= 75 && state.reputation.peasantry >= 70) {
    return {
      type: 'PEASANT_INSURGENT_REPUBLIC',
      title: 'Вільна Республіка Громад',
      subtitle: 'Народна самооборона та справедливий лан',
      description:
        'Спираючись на широкі селянські зʼїзди, вільне козацтво та отаманські загони, Україна обрала шлях максимальної децентралізації та народної справедливості. Окупанти загрузли у партизанській війні на кожному хуторі та змушені були підписати мир із суверенними радами.',
      achievements: [
        'Радикальна земельна реформа на користь селян-хліборобів',
        'Непереможний партизанський спротив окупантам',
        'Пряме народовладдя громад',
      ],
      historicalComparison:
        'У 1918–1920 рр. повстанський рух налічував понад 100 000 бійців (Холодний Яр, Гуляйполе), але діяв розрізнено. Ви змогли спрямувати народну стихію на захист єдиної держави.',
    };
  }

  // 5. Historical Canon Ending (Tragic heroism, unquenched torch of liberty)
  return {
    type: 'HISTORICAL_TRAGIC',
    title: 'Незламні в Трикутнику Смерті',
    subtitle: 'Історичний канон: Насіння майбутньої перемоги',
    description:
      'Опинившись між більшовицькою навалою, білогвардійцями Денікіна, тифом та байдужістю Антанти, Українська Народна Республіка боролася до останнього патрона. Армія пішла у Зимові походи, зберігши честь прапора. Землі були тимчасово розділені між сусідами, але вогонь 1917–1921 років, IV Універсал та Акт Злуки назавжди закарбували ідею незалежності, яка відродилася у 1991 році.',
    achievements: [
      'Ухвалено фундаментальні I, II, III та IV Універсали',
      'Проголошено історичний Акт Злуки УНР і ЗУНР (1919)',
      'Героїчний спротив під Крутами та в Першому Зимовому поході',
      'Сформовано правову основу української модерної державності',
    ],
    historicalComparison:
      'Це шлях реальної історії. Навіть зазнавши військової поразки через нерівні сили та розʼєднаність, покоління революції створило фундамент, без якого сучасна Україна була б неможливою.',
  };
}
