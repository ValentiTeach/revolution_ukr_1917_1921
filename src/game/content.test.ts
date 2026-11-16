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
import { ChapterId } from './types';

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
  for (const m of MINIGAMES) {
    if (m.kind === 'telegram') assert.ok((m.sentence ?? '').split(' ').length >= 3, m.title);
    if (m.kind === 'memory') assert.ok((m.pairs ?? []).length >= 4, m.title);
    if (m.kind === 'rail') assert.ok((m.railTarget ?? 0) > 0 && (m.railSeconds ?? 0) > 0, m.title);
  }
});

test('artifacts have unique ids and sit inside the picture', () => {
  assert.equal(new Set(ARTIFACTS.map((a) => a.id)).size, ARTIFACTS.length);
  for (const a of ARTIFACTS) {
    assert.ok(a.x > 0 && a.x < 100 && a.y > 0 && a.y < 100, a.id);
    assert.ok(['hero', 'rada', 'map', 'kruty'].includes(a.bgKey), a.id);
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
      const p = s.params;
      switch (s.kind) {
        case 'codelock':
          assert.match(p.code ?? '', /^\d{3,6}$/, s.id);
          assert.ok((p.clues ?? []).length >= 2, s.id);
          break;
        case 'morse':
          for (const ch of (p.word ?? '').toUpperCase()) assert.ok(MORSE_UA[ch], `${s.id}: no morse for ${ch}`);
          break;
        case 'sorting': {
          const targets = new Set(p.sortTargets ?? []);
          assert.ok(targets.size >= 2, s.id);
          for (const it of p.sortItems ?? []) assert.ok(targets.has(it.target), `${s.id}: ${it.item}`);
          break;
        }
        case 'wires':
          assert.ok((p.wires ?? 0) >= 2 && (p.wires ?? 0) <= 6, s.id);
          break;
        case 'hide':
          assert.ok((p.work ?? 0) > (p.patrols ?? 0) && (p.patrols ?? 0) >= 1, s.id);
          break;
        case 'drawers':
          assert.ok((p.drawers ?? 0) >= 6 && !!p.item, s.id);
          break;
        case 'skillcheck':
          assert.ok((p.hits ?? 0) >= 1 && (p.speed ?? 0) > 0, s.id);
          break;
        case 'telegram':
          assert.ok((p.sentence ?? '').split(' ').length >= 3, s.id);
          break;
        case 'memory':
          assert.ok((p.pairs ?? []).length >= 3, s.id);
          break;
        case 'rail':
          assert.ok((p.railTarget ?? 0) > 0 && (p.railSeconds ?? 0) > 0, s.id);
          break;
      }
    }
  }
});

test('mission givers have portraits', () => {
  const avatarSrc = readFileSync(new URL('../components/PixelAvatar.tsx', import.meta.url), 'utf8');
  for (const m of MISSIONS) assert.ok(avatarSrc.includes(`case '${m.giver}'`), m.giver);
});
