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
