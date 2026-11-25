/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Перевірки цілісності сюжету та лору: жодних «битих» посилань,
 * у кожного акту є щоденник, вікторина та міні-гра.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTER_CONFIG, DIALOGUE_STEPS, HISTORICAL_FIGURES } from './historicalData';
import {
  ACHIEVEMENTS,
  ARTIFACTS,
  COMPANION_HINTS,
  DIARY_ENTRIES,
  MINIGAMES,
  QUIZ_QUESTIONS,
} from './lore';
import { BgKey, ChapterId, StationKind, StationParams } from './types';
import { CHAPTER_ORDER } from './chapters';
import { MORSE_UA as MORSE } from './missions';
import { UA_ALPHABET, canFillShips, fordHasPath, generateFord, guardPose, mulberry32, parseStealth, solveRoute, solveStealth } from './minigameLogic';
import { NEW_FIGURES } from './story1919_1921';

const BG_KEYS: BgKey[] = ['hero', 'rada', 'map', 'kruty', 'winter', 'steppe', 'forest', 'harbor', 'syvash', 'armored', 'kamianets', 'fortress', 'memorial'];

/** Спільна перевірка параметрів для дверей доручень і міні-ігор привалів. */
function assertStationParams(kind: StationKind, p: StationParams, id: string) {
  switch (kind) {
    case 'codelock':
      assert.match(p.code ?? '', /^\d{3,6}$/, id);
      assert.ok((p.clues ?? []).length >= 2, id);
      break;
    case 'morse':
      for (const ch of (p.word ?? '').toUpperCase()) assert.ok(MORSE[ch], `${id}: no morse for ${ch}`);
      break;
    case 'sorting': {
      const targets = new Set(p.sortTargets ?? []);
      assert.ok(targets.size >= 2, id);
      assert.ok((p.sortItems ?? []).length >= 4, id);
      for (const it of p.sortItems ?? []) assert.ok(targets.has(it.target), `${id}: ${it.item}`);
      break;
    }
    case 'wires':
      assert.ok((p.wires ?? 0) >= 2 && (p.wires ?? 0) <= 6, id);
      break;
    case 'hide':
      assert.ok((p.work ?? 0) > (p.patrols ?? 0) && (p.patrols ?? 0) >= 1, id);
      break;
    case 'drawers':
      assert.ok((p.drawers ?? 0) >= 6 && !!p.item, id);
      break;
    case 'skillcheck':
      assert.ok((p.hits ?? 0) >= 1 && (p.speed ?? 0) > 0, id);
      break;
    case 'telegram':
      assert.ok((p.sentence ?? '').split(' ').length >= 3, id);
      for (const d of p.decoys ?? []) assert.ok(!(p.sentence ?? '').split(' ').includes(d), `${id}: decoy «${d}» is part of the sentence`);
      break;
    case 'memory':
      assert.ok((p.pairs ?? []).length >= 3, id);
      break;
    case 'rail':
      assert.ok((p.railTarget ?? 0) > 0 && (p.railSeconds ?? 0) >= 10, id);
      break;
    case 'tachanka':
      assert.ok((p.distance ?? 0) >= 200 && (p.distance ?? 0) <= 800, id);
      break;
    case 'ford':
      assert.ok((p.fordCols ?? 7) >= 4 && (p.fordRows ?? 7) >= 4, id);
      break;
    case 'ships': {
      const ships = p.ships ?? [];
      const groups = p.groups ?? [];
      assert.ok(ships.length >= 2 && groups.length >= 3, id);
      assert.ok(canFillShips(groups.map((g) => g.size), ships.map((sh) => sh.capacity)), `${id}: ships cannot be filled exactly`);
      break;
    }
    case 'route': {
      const map = p.routeMap ?? [];
      assert.ok(map.length >= 3 && map.every((r) => r.length === map[0].length), `${id}: ragged map`);
      assert.equal(map.join('').split('S').length - 1, 1, `${id}: one start`);
      assert.equal(map.join('').split('F').length - 1, 1, `${id}: one finish`);
      const food = p.routeFood ?? 0;
      const warmth = p.routeWarmth ?? 0;
      assert.ok(solveRoute(map, food, warmth) !== null, `${id}: route is impossible`);
      assert.equal(solveRoute(map.map((r) => r.replace(/V/g, '.')), food, warmth), null, `${id}: villages should matter`);
      break;
    }
    case 'cipher': {
      const text = (p.cipherText ?? '').toUpperCase();
      assert.ok(text.length >= 8, id);
      for (const ch of text) assert.ok(ch === ' ' || UA_ALPHABET.includes(ch), `${id}: «${ch}» is not in the cipher alphabet`);
      assert.ok((p.cipherShift ?? 0) % UA_ALPHABET.length !== 0, `${id}: shift 0 is no cipher`);
      break;
    }
    case 'stealth': {
      const map = p.stealthMap ?? [];
      const guards = p.guards ?? [];
      const level = parseStealth(map);
      for (const g of guards) {
        assert.notEqual(map[g.y][g.x], '#', `${id}: guard inside a wall`);
        const back = guardPose(level, g, g.path.length);
        assert.ok(back.x === g.x && back.y === g.y, `${id}: guard route must loop`);
      }
      const free = solveStealth(map, []);
      const withGuards = solveStealth(map, guards);
      assert.ok(withGuards !== null, `${id}: stealth level is impossible`);
      assert.ok(withGuards! >= free!, id);
      break;
    }
  }
}

const CHAPTERS = Object.keys(CHAPTER_CONFIG) as ChapterId[];
const STORY_CHAPTERS = CHAPTERS.filter((c) => c !== 'EPILOGUE');

test('every chapter starts at an existing dialogue step', () => {
  for (const c of CHAPTERS) {
    assert.ok(DIALOGUE_STEPS[CHAPTER_CONFIG[c].startStepId], `missing start step for ${c}`);
  }
});

test('every choice points to an existing step', () => {
  for (const step of Object.values(DIALOGUE_STEPS)) {
    for (const choice of step.choices) {
      if (choice.nextStepId) {
        assert.ok(DIALOGUE_STEPS[choice.nextStepId], `${step.id} → ${choice.nextStepId} is broken`);
      }
    }
  }
});

test('every dialogue step is reachable from the first one', () => {
  const seen = new Set<string>();
  const queue = ['step_ch1_1'];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    DIALOGUE_STEPS[id].choices.forEach((c) => c.nextStepId && queue.push(c.nextStepId));
  }
  for (const id of Object.keys(DIALOGUE_STEPS)) {
    assert.ok(seen.has(id), `${id} is unreachable`);
  }
});

test('choice ids are unique', () => {
  const ids = Object.values(DIALOGUE_STEPS).flatMap((s) => s.choices.map((c) => c.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('every story chapter has a diary page, a quiz and a minigame', () => {
  for (const c of STORY_CHAPTERS) {
    assert.ok(DIARY_ENTRIES.some((d) => d.chapterId === c), `diary missing for ${c}`);
    assert.ok(QUIZ_QUESTIONS.some((q) => q.chapterId === c), `quiz missing for ${c}`);
    assert.ok(MINIGAMES.some((m) => m.chapterId === c), `minigame missing for ${c}`);
  }
});

test('quiz answers point to a real option', () => {
  for (const q of QUIZ_QUESTIONS) {
    assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, q.id);
  }
});

test('minigames carry the data their kind needs', () => {
  for (const m of MINIGAMES) assertStationParams(m.kind, m.params, m.title);
});

test('artifacts have unique ids and sit inside the picture', () => {
  assert.equal(new Set(ARTIFACTS.map((a) => a.id)).size, ARTIFACTS.length);
  for (const a of ARTIFACTS) {
    assert.ok(a.x > 0 && a.x < 100 && a.y > 0 && a.y < 100, a.id);
    assert.ok(BG_KEYS.includes(a.bgKey), a.id);
  }
});

test('companion hints refer to existing steps and every step has one', () => {
  for (const h of COMPANION_HINTS) assert.ok(DIALOGUE_STEPS[h.stepId], h.stepId);
  for (const id of Object.keys(DIALOGUE_STEPS)) {
    assert.ok(COMPANION_HINTS.some((h) => h.stepId === id), `no hint for ${id}`);
  }
});

test('achievement ids are unique', () => {
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
});

test('every avatar used in the story has a pixel portrait', () => {
  const avatarSrc = readFileSync(new URL('../components/PixelAvatar.tsx', import.meta.url), 'utf8');
  const sprites = new Set([
    ...Object.values(DIALOGUE_STEPS).map((s) => s.avatar),
    ...HISTORICAL_FIGURES.map((f) => f.sprite),
    'hero_boy',
    'hero_girl',
    'pigeon',
  ]);
  for (const s of sprites) {
    assert.ok(avatarSrc.includes(`case '${s}'`), `no portrait for ${s}`);
  }
});

// ---------------------------------------------------------------------------
// Додаткові варіанти, питання та доручення
// ---------------------------------------------------------------------------
import { MISSIONS, MORSE_UA } from './missions';

const STORY_STEPS = Object.values(DIALOGUE_STEPS).filter((s) => s.id !== 'step_epilogue');

test('every story step offers at least three choices and some questions', () => {
  for (const step of STORY_STEPS) {
    assert.ok(step.choices.length >= 3, `${step.id} has only ${step.choices.length} choices`);
    assert.ok((step.questions ?? []).length >= 2, `${step.id} has no questions`);
  }
});

test('all choices of a step lead to the same next step', () => {
  for (const step of STORY_STEPS) {
    const targets = new Set(step.choices.map((c) => c.nextStepId));
    assert.equal(targets.size, 1, `${step.id} branches to ${[...targets].join(', ')}`);
  }
});

test('every step keeps at least two choices that need no unlocking', () => {
  for (const step of STORY_STEPS) {
    assert.ok(step.choices.filter((c) => !c.requires).length >= 2, step.id);
  }
});

test('choice requirements point to real missions and artifacts', () => {
  const missionIds = new Set(MISSIONS.map((m) => m.id));
  const artifactIds = new Set(ARTIFACTS.map((a) => a.id));
  for (const step of STORY_STEPS) {
    for (const c of step.choices) {
      if (!c.requires) continue;
      assert.ok(c.requires.label.length > 0, c.id);
      if (c.requires.mission) assert.ok(missionIds.has(c.requires.mission), `${c.id} → ${c.requires.mission}`);
      if (c.requires.artifact) assert.ok(artifactIds.has(c.requires.artifact), `${c.id} → ${c.requires.artifact}`);
    }
  }
});

test('question ids are unique', () => {
  const ids = STORY_STEPS.flatMap((s) => (s.questions ?? []).map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('every story chapter has exactly one mission, and each mission unlocks a secret choice in its act', () => {
  for (const c of STORY_CHAPTERS) {
    const list = MISSIONS.filter((m) => m.chapterId === c);
    assert.equal(list.length, 1, `${c} has ${list.length} missions`);
    const m = list[0];
    const unlocks = Object.values(DIALOGUE_STEPS).some((s) => s.choices.some((ch) => ch.requires?.mission === m.id));
    assert.ok(unlocks, `${m.id} unlocks nothing`);
  }
});

test('mission stations carry valid parameters', () => {
  const ids = new Set<string>();
  for (const m of MISSIONS) {
    assert.ok(m.stations.length >= 3, `${m.id} is too short`);
    const all = m.stations.flatMap((s) => (s.fork ? [s, s.fork.station] : [s]));
    for (const s of all) {
      assert.ok(!ids.has(s.id), `duplicate station ${s.id}`);
      ids.add(s.id);
      assertStationParams(s.kind, s.params, s.id);
    }
  }
});

test('mission givers have portraits', () => {
  const avatarSrc = readFileSync(new URL('../components/PixelAvatar.tsx', import.meta.url), 'utf8');
  for (const m of MISSIONS) assert.ok(avatarSrc.includes(`case '${m.giver}'`), m.giver);
});

// ---------------------------------------------------------------------------
// Акти 1919–1921
// ---------------------------------------------------------------------------
test('chapters run in chronological order with sixteen story acts', () => {
  assert.deepEqual(CHAPTERS, CHAPTER_ORDER);
  assert.equal(STORY_CHAPTERS.length, 16);
  for (const c of ['ACT_RED_MASKS', 'ACT_OTAMANSHCHYNA', 'ACT_AUGUST_1919', 'ACT_FIRST_WINTER_CAMPAIGN', 'ACT_1920_WARSAW', 'ACT_CRIMEA_1920', 'ACT_1921_FALL'] as ChapterId[]) {
    assert.ok(CHAPTERS.includes(c), c);
  }
});

test('the story chain visits every act in order', () => {
  const visited: ChapterId[] = [];
  const startOf = new Map(CHAPTERS.map((c) => [CHAPTER_CONFIG[c].startStepId, c]));
  let id: string | undefined = 'step_ch1_1';
  const guard = new Set<string>();
  while (id && !guard.has(id)) {
    guard.add(id);
    const c = startOf.get(id);
    if (c) visited.push(c);
    if (id === 'step_epilogue') break;
    id = DIALOGUE_STEPS[id].choices[0].nextStepId;
  }
  assert.deepEqual(visited, CHAPTERS);
});

test('roman numerals in act titles match their position', () => {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI'];
  STORY_CHAPTERS.forEach((c, i) => {
    assert.ok(CHAPTER_CONFIG[c].title.startsWith(`Акт ${roman[i]}:`), `${c}: ${CHAPTER_CONFIG[c].title}`);
  });
});

test('every scene used in the story has an image on disk', () => {
  const used = new Set<BgKey>([...Object.values(DIALOGUE_STEPS).map((s) => s.bgImageKey), ...ARTIFACTS.map((a) => a.bgKey)]);
  for (const key of used) {
    assert.ok(BG_KEYS.includes(key), key);
    if (['hero', 'rada', 'map', 'kruty'].includes(key)) continue;
    const file = new URL(`../assets/images/scenes/${key}.png`, import.meta.url);
    assert.ok(readFileSync(file).length > 1000, `missing scene ${key}`);
  }
});

test('every new scene hides at least three artifacts', () => {
  for (const key of BG_KEYS.slice(4)) {
    assert.ok(ARTIFACTS.filter((a) => a.bgKey === key).length >= 3, key);
  }
});

test('the ford generator always leaves a shallow path', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const cols = 5 + (seed % 4);
    const rows = 5 + (seed % 3);
    const { grid, startCol } = generateFord(cols, rows, mulberry32(seed));
    assert.equal(grid[rows - 1][startCol], 0, `seed ${seed}: start must be shallow`);
    assert.ok(fordHasPath(grid, startCol, 0), `seed ${seed}`);
  }
});

test('new historical figures carry a real quote or a fact, never an invented quote', () => {
  for (const f of NEW_FIGURES) {
    assert.ok(f.quote ? !!f.quoteNote : !!f.fact, f.id);
  }
});
