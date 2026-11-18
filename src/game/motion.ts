/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ступінчасті криві руху для бібліотеки motion: замість плавного
 * перетікання елемент «перестрибує» кадрами, як спрайт у 8-бітній грі.
 */

/** Повертає функцію згладжування з n кадрами (аналог CSS steps(n)). */
export const pxEase =
  (frames = 4) =>
  (t: number): number =>
    t >= 1 ? 1 : Math.floor(t * frames) / frames;

/** Стандартний перехід для вікон і карток. */
export const PX_TRANSITION = { duration: 0.28, ease: pxEase(4) } as const;

/** Швидкий перехід для дрібних елементів. */
export const PX_FAST = { duration: 0.16, ease: pxEase(3) } as const;
