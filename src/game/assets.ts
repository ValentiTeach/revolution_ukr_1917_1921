/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import heroImg from '../assets/images/hero_ukraine_revolution_1917_1794394443346.jpg';
import radaImg from '../assets/images/pixel_rada_hall_1917_1794394444860.jpg';
import mapImg from '../assets/images/pixel_map_ukraine_1918_1794394445811.jpg';
import krutyImg from '../assets/images/pixel_kruty_station_1918_1794394445137.jpg';
// Сцени 1919–1921 намальовано піксель за пікселем генератором scripts/scenes/scenes.py
import winterImg from '../assets/images/scenes/winter.png';
import steppeImg from '../assets/images/scenes/steppe.png';
import forestImg from '../assets/images/scenes/forest.png';
import harborImg from '../assets/images/scenes/harbor.png';
import syvashImg from '../assets/images/scenes/syvash.png';
import armoredImg from '../assets/images/scenes/armored.png';
import kamianetsImg from '../assets/images/scenes/kamianets.png';
import fortressImg from '../assets/images/scenes/fortress.png';
import memorialImg from '../assets/images/scenes/memorial.png';
import { BgKey } from './types';

/** Фонові піксельні сцени. Імпортуються через Vite, тому працюють і в dev, і у production. */
export const BG_IMAGES: Record<BgKey, string> = {
  hero: heroImg,
  rada: radaImg,
  map: mapImg,
  kruty: krutyImg,
  winter: winterImg,
  steppe: steppeImg,
  forest: forestImg,
  harbor: harborImg,
  syvash: syvashImg,
  armored: armoredImg,
  kamianets: kamianetsImg,
  fortress: fortressImg,
  memorial: memorialImg,
};

export const BG_TITLES: Record<BgKey, string> = {
  hero: 'Софійська площа, Київ',
  rada: 'Зала засідань Центральної Ради',
  map: 'Воєнна карта України',
  kruty: 'Станція Крути, січень 1918',
  winter: 'Шлях Зимового походу, 1919–1920',
  steppe: 'Степ біля Гуляйполя, 1919',
  forest: 'Холодний Яр уночі',
  harbor: 'Севастопольська бухта, листопад 1920',
  syvash: 'Брід через Сиваш, листопад 1920',
  armored: 'Донецька станція, 1919',
  kamianets: 'Камʼянець-Подільський, 1919',
  fortress: 'Мури Замостя, серпень 1920',
  memorial: 'Поле памʼяті під Базаром',
};

/** Чи це маленька піксельна сцена (її треба збільшувати без згладжування). */
export const PIXEL_SCENES: ReadonlySet<BgKey> = new Set<BgKey>(['winter', 'steppe', 'forest', 'harbor', 'syvash', 'armored', 'kamianets', 'fortress', 'memorial']);
