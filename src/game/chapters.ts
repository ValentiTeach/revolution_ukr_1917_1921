/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Хронологічний порядок актів — єдине джерело правди для всієї гри.
 */

import { ChapterId } from './types';

export const CHAPTER_ORDER: ChapterId[] = [
  'CH1_RADA_CREATION',
  'CH2_NATIONAL_CONGRESS',
  'CH3_FIRST_UNIVERSAL',
  'CH4_SECOND_UNIVERSAL',
  'CH5_THIRD_UNIVERSAL',
  'CH6_FOURTH_UNIVERSAL_KRUTY',
  'CH7_HETMANATE_ORDER',
  'CH8_DIRECTORY_AND_ZLUKA',
  'ACT_RED_MASKS',
  'ACT_OTAMANSHCHYNA',
  'ACT_AUGUST_1919',
  'CH9_TRIANGLE_OF_DEATH',
  'ACT_FIRST_WINTER_CAMPAIGN',
  'ACT_1920_WARSAW',
  'ACT_CRIMEA_1920',
  'ACT_1921_FALL',
  'EPILOGUE',
];

/** Кількість сюжетних актів без епілогу. */
export const STORY_ACT_COUNT = CHAPTER_ORDER.length - 1;
