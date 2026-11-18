/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Імʼя учня з особистого запрошення. Ворота гри (server/gate.ts) кладуть
 * його в коротку cookie vd_hero на 10 хвилин після входу, а пролог
 * підставляє в поле «Як тебе звати?». Учень може змінити його.
 */

export function readHeroName(): string {
  try {
    const match = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('vd_hero='));
    if (!match) return '';
    return decodeURIComponent(match.slice('vd_hero='.length)).replace(/[^\p{L}\p{N}' -]/gu, '').slice(0, 18);
  } catch {
    return '';
  }
}
