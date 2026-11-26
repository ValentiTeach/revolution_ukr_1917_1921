"""
Перетворює три намальовані художні картини (Софійська площа, зала Ради, Крути)
на справжній піксель-арт 384×216, як і решта сцен гри.

Запуск із кореня репозиторію:
    python3 scripts/scenes/pixelize.py [--preview DIR]

Що робить:
1. обрізає оригінал до 16:9 і зменшує усередненням пікселів (BOX), щоб кожен
   піксель сцени був чесним середнім кольором ділянки, а не випадковою точкою;
2. трохи піднімає контраст і насиченість, бо усереднення їх «зʼїдає»;
3. зводить палітру до обмеженого набору кольорів без дизерингу — так зникають
   JPEG-шуми й розмиті переходи, а пласкі ділянки стають рівними;
4. прибирає поодинокі «сирітські» пікселі;
5. перемальовує написи на транспарантах і вивісках піксельним шрифтом:
   у вихідних картинах літери були розмиті й нечитабельні.
"""

from __future__ import annotations

import os
import sys
from collections import Counter

from PIL import Image, ImageEnhance

sys.path.insert(0, os.path.dirname(__file__))

from pxfont import draw_centered, measure  # noqa: E402
from pxlib import Canvas, hexc  # noqa: E402

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, 'sources')
OUT = os.path.join(HERE, '..', '..', 'src', 'assets', 'images', 'scenes')
W, H = 384, 216


def pixelize(name: str, colors: int, contrast: float = 1.08, saturation: float = 1.12) -> Canvas:
    im = Image.open(os.path.join(SRC, f'{name}.jpg')).convert('RGB')
    w, h = im.size
    cw = round(h * 16 / 9)
    x0 = (w - cw) // 2
    im = im.crop((x0, 0, x0 + cw, h)).resize((W, H), Image.Resampling.BOX)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Color(im).enhance(saturation)
    im = im.quantize(colors=colors, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')
    cv = Canvas()
    cv.img.paste(im)
    cv.px = cv.img.load()
    despeckle(cv)
    return cv


def despeckle(cv: Canvas) -> None:
    """Піксель, не схожий на жодного з 8 сусідів, а ті майже однакові, — шум."""
    src = cv.img.copy().load()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            c = src[x, y]
            ns = [src[x + dx, y + dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy]
            if c in ns:
                continue
            top, n = Counter(ns).most_common(1)[0]
            if n >= 6:
                cv.px[x, y] = top


def sign(cv: Canvas, x: int, y: int, w: int, h: int, lines: list[str], bg, fg, border, shade=None) -> None:
    """Вивіска чи транспарант: рамка, тло й рядки тексту шрифтом 3×5."""
    cv.rect(x, y, w, h, border)
    cv.rect(x + 1, y + 1, w - 2, h - 2, bg)
    if shade:
        cv.rect(x + 1, y + h - 2, w - 2, 1, shade)
    total = len(lines) * 6 - 1
    base = y + (h - total) // 2 + 4
    for ln in lines:
        assert measure(ln) <= w - 2, f'«{ln}» не влазить у {w - 2} px'
        draw_centered(cv, x + w // 2, base, ln, fg)
        base += 6


def scene_hero() -> Canvas:
    cv = pixelize('hero', 64)
    cloth, ink, pole = hexc('#f1ead8'), hexc('#1d1a2a'), hexc('#5a4632')
    # Транспарант «Вільна Україна» (знахідка: x≈35%, y≈60%)
    sign(cv, 119, 122, 31, 16, ['ВІЛЬНА', 'УКРАЇНА'], cloth, ink, hexc('#7a6a55'), hexc('#d8ccb2'))
    cv.rect(121, 138, 1, 5, pole)
    cv.rect(147, 138, 1, 5, pole)
    # «Слава Україні!» праворуч
    sign(cv, 263, 118, 35, 14, ['СЛАВА', 'УКРАЇНІ!'], cloth, ink, hexc('#7a6a55'), hexc('#d8ccb2'))
    cv.rect(265, 132, 1, 6, pole)
    cv.rect(295, 132, 1, 6, pole)
    # «УЦР» — Українська Центральна Рада
    sign(cv, 309, 122, 17, 10, ['УЦР'], cloth, ink, hexc('#7a6a55'), hexc('#d8ccb2'))
    cv.rect(317, 132, 1, 5, pole)
    return cv


def scene_rada() -> Canvas:
    cv = pixelize('rada', 64, contrast=1.1, saturation=1.08)
    # Табличка на трибуні
    sign(cv, 258, 110, 23, 9, ['РАДА'], hexc('#e9d9a6'), hexc('#3b2a16'), hexc('#5c3d1e'))
    return cv


def scene_kruty() -> Canvas:
    cv = pixelize('kruty', 64, contrast=1.06, saturation=1.1)
    # Номер на паровозі
    sign(cv, 141, 112, 19, 9, ['1918'], hexc('#d9dde3'), hexc('#1b1f2a'), hexc('#3d434f'))
    # Вивіска станції (знахідка: x≈85%, y≈48%)
    sign(cv, 310, 95, 33, 15, ['СТАНЦІЯ', 'КРУТИ'], hexc('#efe6cf'), hexc('#2a1d12'), hexc('#4a3424'), hexc('#d5c8a8'))
    return cv


SCENES = {'hero': scene_hero, 'rada': scene_rada, 'kruty': scene_kruty}


def main(argv: list[str]) -> None:
    preview = None
    if '--preview' in argv:
        i = argv.index('--preview')
        preview = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    names = argv or list(SCENES)
    os.makedirs(OUT, exist_ok=True)
    for n in names:
        cv = SCENES[n]()
        cv.save(os.path.join(OUT, f'{n}.png'))
        if preview:
            os.makedirs(preview, exist_ok=True)
            cv.img.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(preview, f'{n}.png'))
        print('→', n)


if __name__ == '__main__':
    main(sys.argv[1:])
