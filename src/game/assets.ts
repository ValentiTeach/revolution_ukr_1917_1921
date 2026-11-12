/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import heroImg from '../assets/images/hero_ukraine_revolution_1917_1794394443346.jpg';
import radaImg from '../assets/images/pixel_rada_hall_1917_1794394444860.jpg';
import mapImg from '../assets/images/pixel_map_ukraine_1918_1794394445811.jpg';
import krutyImg from '../assets/images/pixel_kruty_station_1918_1794394445137.jpg';
import { BgKey } from './types';

/** Фонові піксельні сцени. Імпортуються через Vite, тому працюють і в dev, і у production. */
export const BG_IMAGES: Record<BgKey, string> = {
  hero: heroImg,
  rada: radaImg,
  map: mapImg,
  kruty: krutyImg,
};

export const BG_TITLES: Record<BgKey, string> = {
  hero: 'Софійська площа, Київ',
  rada: 'Зала засідань Центральної Ради',
  map: 'Воєнна карта України',
  kruty: 'Станція Крути, січень 1918',
};
