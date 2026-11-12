/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  createInitialGameState,
  applyChoiceToState,
  evaluateUniversalDraft,
  resolveStaffBattle,
  determineGameEnding,
} from './rules';
import { DialogueChoice, UniversalClause } from './types';

test('clamp restricts numbers within [0, 100]', () => {
  assert.equal(clamp(-10), 0);
  assert.equal(clamp(150), 100);
  assert.equal(clamp(45.6), 46);
});

test('createInitialGameState initializes default metrics and reputation', () => {
  const state = createInitialGameState();
  assert.equal(state.chapter, 'CH1_RADA_CREATION');
  assert.equal(state.metrics.nationalUnity, 50);
  assert.equal(state.reputation.socialists, 60);
  assert.equal(state.decisionHistory.length, 0);
  assert.equal(state.isAlternateHistory, false);
});

test('applyChoiceToState updates metrics and logs decision', () => {
  const initialState = createInitialGameState();
  const choice: DialogueChoice = {
    id: 'test_choice_1',
    text: 'Створити спільний оборонний комітет',
    factionEffects: {
      military: 15,
      independentists: 10,
      socialists: -5,
    },
    metricEffects: {
      armyReadiness: 20,
      nationalUnity: 10,
    },
    historicalCanon: false,
    reflection: 'Військові радо вітали консолідацію сил.',
  };

  const nextState = applyChoiceToState(initialState, choice, 'Створення комітету', '1917');

  assert.equal(nextState.metrics.armyReadiness, 55); // 35 + 20
  assert.equal(nextState.metrics.nationalUnity, 60); // 50 + 10
  assert.equal(nextState.reputation.military, 65); // 50 + 15
  assert.equal(nextState.reputation.socialists, 55); // 60 - 5
  assert.equal(nextState.decisionHistory.length, 1);
  assert.equal(nextState.decisionHistory[0].title, 'Створення комітету');
  assert.equal(nextState.isAlternateHistory, true);
});

test('evaluateUniversalDraft aggregates clauses correctly', () => {
  const clauses: UniversalClause[] = [
    {
      id: 'clause_1',
      category: 'statehood',
      title: 'Проголошення автономії',
      description: 'Самі творитимемо лад',
      factionSupport: {
        socialists: 20,
        independentists: -10,
        peasantry: 15,
      },
      metricsImpact: {
        nationalUnity: 15,
      },
    },
    {
      id: 'clause_2',
      category: 'army',
      title: 'Вільне козацтво',
      description: 'Загони самооборони',
      factionSupport: {
        military: 25,
        socialists: 5,
      },
      metricsImpact: {
        armyReadiness: 20,
      },
    },
  ];

  const evalResult = evaluateUniversalDraft(clauses);
  assert.equal(evalResult.factionApprovals.military, 25);
  assert.equal(evalResult.factionApprovals.socialists, 25);
  assert.equal(evalResult.projectedMetrics.nationalUnity, 15);
  assert.equal(evalResult.projectedMetrics.armyReadiness, 20);
});

test('resolveStaffBattle simulates combat outcomes with losses', () => {
  const victoryResult = resolveStaffBattle(5000, 3000, 2, 80);
  assert.equal(victoryResult.victory, true);
  assert.ok(victoryResult.enemyLosses > 0);

  const defeatResult = resolveStaffBattle(500, 5000, 0, 30);
  assert.equal(defeatResult.victory, false);
  assert.ok(defeatResult.friendlyLosses > 0);
});

test('determineGameEnding evaluates Soborna victory when unity and army are high', () => {
  const state = createInitialGameState();
  state.metrics.nationalUnity = 80;
  state.metrics.armyReadiness = 75;
  state.metrics.popularTrust = 70;

  const ending = determineGameEnding(state);
  assert.equal(ending.type, 'SOBORNA_VICTORY');
});

test('determineGameEnding falls back to historical tragic when metrics are low', () => {
  const state = createInitialGameState();
  state.metrics.nationalUnity = 40;
  state.metrics.armyReadiness = 30;

  const ending = determineGameEnding(state);
  assert.equal(ending.type, 'HISTORICAL_TRAGIC');
});
