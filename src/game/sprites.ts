/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Піксельні спрайти міні-ігор. Кожен спрайт — рядки символів,
 * де символ — колір із палітри SPRITE_PALETTE, а «.» — прозорість.
 * Ті самі рядки малюються і в SVG (<PixelSprite />), і на canvas (тачанка).
 */

export const SPRITE_PALETTE: Record<string, string> = {
  k: '#0c0a09', // контур
  K: '#1c1917',
  w: '#f8fafc',
  W: '#cbd5e1',
  g: '#94a3b8',
  G: '#64748b',
  s: '#f5c9a0', // шкіра
  S: '#d39a72',
  b: '#1d6fd1', // синій
  B: '#1e3a8a',
  y: '#f7c948', // жовтий
  Y: '#b45309',
  r: '#dc2626', // червоний
  R: '#7f1d1d',
  o: '#8b5a2b', // коричневий
  O: '#4a2f1a',
  h: '#56634a', // шинель
  H: '#333d2b',
  t: '#2f855a', // хвоя
  T: '#1c4532',
  l: '#68d391',
  e: '#eef4fa', // сніг
  E: '#a5b4c8',
  c: '#c08a3e', // дерево
  C: '#744210',
  a: '#fbbf24', // ліхтар
  A: '#fff3c4',
  m: '#3f3f46', // метал
  M: '#8b8b94',
  n: '#6b4423', // кінь
  N: '#3d2614',
  u: '#c9a26b', // солома, віз
  U: '#8a6a3a',
  v: '#7c3aed',
};

export interface Sprite {
  rows: string[];
}

export const SPRITES = {
  /** Джура: кашкет, вишиванка, торба. */
  jura: {
    rows: [
      '................',
      '.....kkkkkk.....',
      '....kGGGGGGk....',
      '...kGGGGGGGGk...',
      '..kkkkkkkkkkkk..',
      '....kssssssk....',
      '....kskssksk....',
      '....kssssssk....',
      '.....kssrsk.....',
      '....kkwwwwkkk...',
      '...kwwwrrwwwOk..',
      '...kwkwrrwkOwk..',
      '...kskwwwwOkck..',
      '....kkbbbbkkCk..',
      '.....kOk.kOk....',
      '.....kkk.kkk....',
    ],
  },
  /** Червоноармієць у будьонівці з ліхтарем. */
  guard: {
    rows: [
      '.......kk.......',
      '......kHHk......',
      '.....kHHHHk.....',
      '....kHHrHHHk....',
      '...kkkkkkkkkk...',
      '....kssssssk....',
      '....kskssksk....',
      '....kssssssk....',
      '...kkhhkkhhkk...',
      '..khhhhrhhhhhk..',
      '..khkhhhhhhkhkk.',
      '..kskhhhhhhkkAAk',
      '...kkhhhhhhk.kak',
      '....khhkkhhk.kk.',
      '....kOOk.kOOk...',
      '....kkkk.kkkk...',
    ],
  },
  /** Ялина. */
  pine: {
    rows: [
      '.......kk.......',
      '......ktTk......',
      '.....ktttTk.....',
      '....kltttTTk....',
      '.....kttTTk.....',
      '....kltttTTk....',
      '...klltttTTTk...',
      '....kttttTTk....',
      '...klttttTTTk...',
      '..klltttttTTTk..',
      '.kllttttttTTTTk.',
      '..kkkkkkkkkkkk..',
      '.......kCk......',
      '.......kCk......',
      '......kkCkk.....',
      '................',
    ],
  },
  /** Ялина під снігом. */
  pineSnow: {
    rows: [
      '.......kk.......',
      '......keEk......',
      '.....kttTTk.....',
      '....keeeeEEk....',
      '.....kttTTk.....',
      '....ktttTTTk....',
      '...keeeeeEEEk...',
      '....kttttTTk....',
      '...kltttTTTTk...',
      '..keeeeeeeEEEk..',
      '.klttttttTTTTTk.',
      '..kkkkkkkkkkkk..',
      '.......kCk......',
      '.......kCk......',
      '.....eekCkee....',
      '................',
    ],
  },
  /** Кущ-схованка. */
  bush: {
    rows: [
      '................',
      '................',
      '................',
      '.....kkk.kkk....',
      '....kltTkltTk...',
      '...kllttkttTTk..',
      '..klltttttttTk..',
      '..klltlttttTTTk.',
      '.kllttttltttTTk.',
      '.klttttttttTTTk.',
      '.kttttTttttTTTk.',
      '..kTTTTTTTTTTk..',
      '...kkkkkkkkkk...',
      '................',
      '................',
      '................',
    ],
  },
  /** Ящик на станції. */
  crate: {
    rows: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kcccccccccccCk.',
      '.kcCkkkkkkkkCCk.',
      '.kckcccccccCkCk.',
      '.kckccCccccCkCk.',
      '.kckcccCcccCkCk.',
      '.kckccccCccCkCk.',
      '.kckcccccCcCkCk.',
      '.kckccccccCCkCk.',
      '.kckcccccccCkCk.',
      '.kcCkkkkkkkkCCk.',
      '.kCCCCCCCCCCCCk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
  },
  /** Сувій із документами. */
  scroll: {
    rows: [
      '................',
      '................',
      '...kkkkkkkkkk...',
      '..kAAAAAAAAAAk..',
      '..kuAAAAAAAAuk..',
      '...kAkkkkkkAk...',
      '...kAAAAAAAAk...',
      '...kAkkkkkAAk...',
      '...kAAAAAAAAk...',
      '...kAkkkkrrAk...',
      '...kAAAAArrAk...',
      '..kuAAAAAAAAuk..',
      '..kAAAAAAAAAAk..',
      '...kkkkkkkkkk...',
      '................',
      '................',
    ],
  },
  /** Двері-вихід. */
  door: {
    rows: [
      '...kkkkkkkkkk...',
      '..kCCCCCCCCCCk..',
      '..kCccccccccCk..',
      '..kCckkkkkkcCk..',
      '..kCckCCCCkcCk..',
      '..kCckCCCCkcCk..',
      '..kCckkkkkkcCk..',
      '..kCccccccccCk..',
      '..kCcccccayccCk.',
      '..kCccccccycCk..',
      '..kCckkkkkkcCk..',
      '..kCckCCCCkcCk..',
      '..kCckkkkkkcCk..',
      '..kCccccccccCk..',
      '..kkkkkkkkkkkk..',
      '................',
    ],
  },
  /** Кінь (біжить праворуч), кадр 1. */
  horseA: {
    rows: [
      '...............kk...',
      '..............kNNk..',
      '.............kNnnnk.',
      '............kNnnnnnk',
      '...........kNnnnkkk.',
      '..kkkkkkkkkNnnnk....',
      '.kNnnnnnnnnnnnnk....',
      'kNnnnnnnnnnnnnk.....',
      'kNnnnnnnnnnnnnk.....',
      'kN.knnkkkkknnk......',
      '...kNk...kNk.k......',
      '..kNk.....kNk.......',
      '..kk.......kk.......',
    ],
  },
  /** Кінь, кадр 2 (ноги зібрані). */
  horseB: {
    rows: [
      '...............kk...',
      '..............kNNk..',
      '.............kNnnnk.',
      '............kNnnnnnk',
      '...........kNnnnkkk.',
      '..kkkkkkkkkNnnnk....',
      '.kNnnnnnnnnnnnnk....',
      'kNnnnnnnnnnnnnk.....',
      'kNnnnnnnnnnnnnk.....',
      'kN..knnkkknnkk......',
      '.....kNkkNk.........',
      '.....kNk.kNk........',
      '.....kk...kk........',
    ],
  },
  /** Тачанка без коней: віз, візник, кулемет позаду. */
  cart: {
    rows: [
      '.......kkk..........',
      '......kGGGk.........',
      '......kssk..........',
      '..kk..kHHk..........',
      'kmmmmkkHHHk.........',
      '.kMMkkkHHHHk........',
      '..kk.kuuuuuuuuuuuk..',
      '.....kUuuuuuuuuuuuk.',
      '.....kUUUUUUUUUUUUk.',
      '....kkkkkkkkkkkkkkk.',
      '...kOOOk.....kOOOk..',
      '..kOcCcOk...kOcCcOk.',
      '..kOCkCOk...kOCkCOk.',
      '..kOcCcOk...kOcCcOk.',
      '...kOOOk.....kOOOk..',
    ],
  },
  /** Яма в степу. */
  pit: {
    rows: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '...kkkkkkkkkk...',
      '.kkOOOOOOOOOOkk.',
      'kOOKKKKKKKKKKOOk',
      'kOKKKKKKKKKKKKOk',
      '.kOOKKKKKKKKOOk.',
      '..kkkkkkkkkkkk..',
      '................',
      '................',
    ],
  },
  /** Копиця сіна. */
  hay: {
    rows: [
      '................',
      '.......kk.......',
      '.....kkuukk.....',
      '....kuuuuuUk....',
      '...kuuyuuuuUk...',
      '...kuuuuuyuUk...',
      '..kuuuuuuuuuUk..',
      '..kuyuuuuuuuUk..',
      '.kuuuuuyuuuuUUk.',
      '.kuuuuuuuuuuUUk.',
      'kuuuyuuuuuuuUUUk',
      'kuuuuuuuuyuuUUUk',
      'kUuuuuuuuuuUUUUk',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
    ],
  },
  /** Колючий дріт на кілках. */
  wire: {
    rows: [
      '................',
      '................',
      '..kk........kk..',
      '..kCk......kCk..',
      'kMkCkMkMkMkkCkMk',
      '.k.kCk.k.k.kCk.k',
      'kMkCkMkMkMkkCkMk',
      '..kCk......kCk..',
      'kMkCkMkMkMkkCkMk',
      '.k.kCk.k.k.kCk.k',
      'kMkCkMkMkMkkCkMk',
      '..kCk......kCk..',
      '..kCk......kCk..',
      '..kkk......kkk..',
      '................',
      '................',
    ],
  },
  /** Мішок вівса. */
  oats: {
    rows: [
      '................',
      '................',
      '......kkkk......',
      '.....kuyyuk.....',
      '......kYYk......',
      '.....kuuuuk.....',
      '....kuuuuuuk....',
      '...kuuuyyuuuk...',
      '...kuuyuuyuuk...',
      '...kuuuyyuuUk...',
      '...kuuuuuuuUk...',
      '...kuuuuuuUUk...',
      '....kUUUUUUk....',
      '.....kkkkkk.....',
      '................',
      '................',
    ],
  },
  /** Паровоз (їде праворуч). */
  loco: {
    rows: [
      '.....kkk....................',
      '....kmmmk...................',
      '....kMmmk..........kkkkk....',
      '.....kmk...........kmmmk....',
      '.....kmk..kkkkkkkk.kmmmk....',
      '..kkkkkkkkkmmmmmmkkkkkkkkk..',
      '.kmmmmmmmmmmmmmmmmkAAkmmmmk.',
      '.kmMMMMMMMMMMMMMmmkAAkmrrmk.',
      '.kmmmmmmmmmmmmmmmmkkkkmmmmk.',
      '.kmmrrrrrrrrrrrrrmmmmmmmmmkk',
      '.kmmmmmmmmmmmmmmmmmmmmmmmmMk',
      'kkkkkkkkkkkkkkkkkkkkkkkkkkkk',
      '.kmmmk.kmmmk..kmmmk..kmmmk..',
      'kmMkMmkmMkMmkkmMkMmkkmMkMmk.',
      '.kmmmk.kmmmk..kmmmk..kmmmk..',
      '..kkk...kkk....kkk....kkk...',
    ],
  },
  /** Колесо (лічильник життів тачанки). */
  wheelIcon: {
    rows: [
      '...kkkkk...',
      '..kCcccCk..',
      '.kCk.k.kCk.',
      'kCck.k.kcCk',
      'kck.kkk.kck',
      'kckkkCkkkck',
      'kck.kkk.kck',
      'kCck.k.kcCk',
      '.kCk.k.kCk.',
      '..kCcccCk..',
      '...kkkkk...',
    ],
  },
  /** Гайковий ключ. */
  wrench: {
    rows: [
      '..kkk...',
      '.kMMMk..',
      'kMk.kMk.',
      'kMk.kMk.',
      '.kMMMk..',
      '..kMk...',
      '..kMk...',
      '..kMk...',
      '..kMk...',
      '..kMk...',
      '..kMk...',
      '..kCk...',
      '..kCk...',
      '..kkk...',
    ],
  },
} satisfies Record<string, Sprite>;

export type SpriteId = keyof typeof SPRITES;

/** Ширина й висота спрайта. */
export function spriteSize(id: SpriteId): { w: number; h: number } {
  const rows = SPRITES[id].rows;
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length };
}
