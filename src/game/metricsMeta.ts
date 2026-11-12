/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameMetrics } from './types';

export interface MetricMeta {
  key: keyof GameMetrics;
  label: string;
  fullName: string;
  emoji: string;
  bar: string;   // клас кольору смужки
  text: string;  // клас кольору тексту
  kidHint: string; // пояснення для дитини
}

export const METRIC_META: MetricMeta[] = [
  {
    key: 'nationalUnity',
    label: 'Єдність',
    fullName: 'Національна єдність',
    emoji: '🤝',
    bar: 'bg-sky-500',
    text: 'text-sky-300',
    kidHint: 'Наскільки дружно працюють усі партії та групи.',
  },
  {
    key: 'armyReadiness',
    label: 'Армія',
    fullName: 'Боєздатність армії',
    emoji: '🛡️',
    bar: 'bg-amber-500',
    text: 'text-amber-300',
    kidHint: 'Чи готові вояки захистити країну.',
  },
  {
    key: 'diplomacy',
    label: 'Дипломатія',
    fullName: 'Міжнародний авторитет',
    emoji: '🕊️',
    bar: 'bg-emerald-500',
    text: 'text-emerald-300',
    kidHint: 'Чи знають і поважають Україну інші країни.',
  },
  {
    key: 'popularTrust',
    label: 'Довіра',
    fullName: 'Народна підтримка',
    emoji: '❤️',
    bar: 'bg-rose-500',
    text: 'text-rose-300',
    kidHint: 'Чи вірять звичайні люди своїй владі.',
  },
  {
    key: 'treasury',
    label: 'Скарбниця',
    fullName: 'Державні фінанси',
    emoji: '💰',
    bar: 'bg-yellow-400',
    text: 'text-yellow-300',
    kidHint: 'Скільки грошей на школи, хліб і набої.',
  },
];

export function getMetricMeta(key: keyof GameMetrics): MetricMeta {
  return METRIC_META.find((m) => m.key === key)!;
}
