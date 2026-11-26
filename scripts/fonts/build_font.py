"""
Збирає піксельний шрифт «Доля» (Dolia Pixel) із бітових гліфів glyphs.py.

Запуск із кореня репозиторію (потрібен fonttools і brotli):
    pip install fonttools brotli
    python3 scripts/fonts/build_font.py

Результат: src/assets/fonts/DoliaPixel-Regular.woff2 і DoliaPixel-Bold.woff2.

Сітка: 1 піксель шрифту = 1/12 кегля. Тому шрифт ідеально чіткий у 12, 24,
36 px (і 18 px на екранах з подвійною щільністю). Контури — справжні
обриси пікселів без перекриттів, тож на межах пікселів не буває швів.
"""

from __future__ import annotations

import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

sys.path.insert(0, os.path.dirname(__file__))
from glyphs import parse  # noqa: E402

PX = 100  # одиниць на піксель
EM_PX = 12
UPM = PX * EM_PX
ASCENT_PX = 10
DESCENT_PX = 2
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'fonts')


Bitmap = list[list[bool]]


def to_bitmap(rows: list[str]) -> Bitmap:
    return [[ch == '#' for ch in r] for r in rows]


def embolden(bm: Bitmap) -> Bitmap:
    """Жирний: подвоюємо кожен «стовбур» (стовпець із вертикальною лінією ≥ 3 пікселі).

    Звичайне «розмазування» на 1 піксель склеює ш, м, ж у суцільну пляму,
    а подвоєння стовбурів зберігає просвіти між ними.
    """
    h = len(bm)
    w = len(bm[0]) if h else 0

    def stem(c: int) -> bool:
        run = best = 0
        for r in range(h):
            run = run + 1 if bm[r][c] else 0
            best = max(best, run)
        return best >= 3

    cols = [c for c in range(w)]
    stems = [stem(c) for c in cols]
    if not any(stems):
        # Немає стовбурів (тире, крапки, x, v): розмазуємо праворуч, якщо не склеїться
        out = [row[:] + [False] for row in bm]
        for r in range(h):
            for c in range(w):
                if bm[r][c] and (c + 2 >= w or not bm[r][c + 2]) and (c + 1 >= w or not bm[r][c + 1]):
                    out[r][c + 1] = True
        return out
    out: Bitmap = [[] for _ in range(h)]
    for c in cols:
        for r in range(h):
            out[r].append(bm[r][c])
        if stems[c]:
            for r in range(h):
                # Горизонтальні перемички між подвоєним стовбуром і наступним стовпцем
                out[r].append(bm[r][c])
    return out


def trace(bm: Bitmap, top_y: int) -> list[list[tuple[int, int]]]:
    """Обриси групи пікселів: замкнені контури за годинниковою стрілкою (зовнішні)."""
    h = len(bm)
    w = len(bm[0]) if h else 0

    def on(c: int, r: int) -> bool:
        return 0 <= r < h and 0 <= c < w and bm[r][c]

    # Ребра в координатах сітки (x праворуч, y угору): піксель (c, r) займає
    # x від c до c+1, y від Y-1 до Y, де Y = top_y - r.
    edges: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def add(a: tuple[int, int], b: tuple[int, int]) -> None:
        edges.setdefault(a, []).append(b)

    for r in range(h):
        for c in range(w):
            if not on(c, r):
                continue
            y1 = top_y - r
            y0 = y1 - 1
            x0, x1 = c, c + 1
            # Обхід за годинниковою стрілкою (у системі y угору): заливка праворуч від ребра
            if not on(c, r - 1):
                add((x0, y1), (x1, y1))  # верх: зліва направо
            if not on(c + 1, r):
                add((x1, y1), (x1, y0))  # правий бік: униз
            if not on(c, r + 1):
                add((x1, y0), (x0, y0))  # низ: справа наліво
            if not on(c - 1, r):
                add((x0, y0), (x0, y1))  # лівий бік: угору

    contours: list[list[tuple[int, int]]] = []
    while edges:
        start = next(iter(edges))
        path = [start]
        cur = start
        prev_dir = None
        while True:
            outs = edges[cur]
            if len(outs) > 1 and prev_dir is not None:
                # Діагональний дотик: повертаємо праворуч, щоб пікселі не зливалися
                def turn(n: tuple[int, int]) -> int:
                    d = (n[0] - cur[0], n[1] - cur[1])
                    cross = prev_dir[0] * d[1] - prev_dir[1] * d[0]
                    return 0 if cross < 0 else 1
                outs.sort(key=turn)
            nxt = outs.pop(0)
            if not outs:
                del edges[cur]
            prev_dir = (nxt[0] - cur[0], nxt[1] - cur[1])
            cur = nxt
            if cur == start and (cur not in edges):
                break
            if cur == start:
                break
            path.append(cur)
        # Прибираємо точки посеред прямих відрізків
        simple = []
        n = len(path)
        for i in range(n):
            a, b, c2 = path[i - 1], path[i], path[(i + 1) % n]
            if (b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0]) != 0:
                simple.append(b)
        contours.append(simple)
    return contours


def glyph_name(ch: str) -> str:
    if ch == ' ':
        return 'space'
    return f'uni{ord(ch):04X}'


def build(bold: bool) -> None:
    data = parse()
    style = 'Bold' if bold else 'Regular'
    order = ['.notdef'] + [glyph_name(ch) for ch in data]
    cmap = {ord(ch): glyph_name(ch) for ch in data}
    glyphs = {}
    metrics = {}

    # .notdef — порожній прямокутник
    pen = TTGlyphPen(None)
    for (x0, y0, x1, y1) in ((0, 0, 4, 7),):
        pen.moveTo((x0 * PX, y0 * PX)); pen.lineTo((x0 * PX, y1 * PX)); pen.lineTo((x1 * PX, y1 * PX)); pen.lineTo((x1 * PX, y0 * PX)); pen.closePath()
        pen.moveTo((1 * PX, 1 * PX)); pen.lineTo((3 * PX, 1 * PX)); pen.lineTo((3 * PX, 6 * PX)); pen.lineTo((1 * PX, 6 * PX)); pen.closePath()
    glyphs['.notdef'] = pen.glyph()
    metrics['.notdef'] = (5 * PX, 0)

    done: dict[int, str] = {}
    for ch, (rows, below) in data.items():
        name = glyph_name(ch)
        bm = to_bitmap(rows)
        if ch == ' ':
            pen = TTGlyphPen(None)
            glyphs[name] = pen.glyph()
            metrics[name] = ((3 + (1 if bold else 0)) * PX, 0)
            continue
        if bold:
            bm = embolden(bm)
        w = len(bm[0])
        top_y = len(bm) - below
        pen = TTGlyphPen(None)
        for contour in trace(bm, top_y):
            pen.moveTo((contour[0][0] * PX, contour[0][1] * PX))
            for pt in contour[1:]:
                pen.lineTo((pt[0] * PX, pt[1] * PX))
            pen.closePath()
        glyphs[name] = pen.glyph()
        metrics[name] = ((w + 1) * PX, 0)
        done[ord(ch)] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    # Ліві поля з фактичних контурів
    glyf = fb.font['glyf']
    hmtx = {}
    for name in order:
        g = glyf[name]
        g.recalcBounds(glyf)
        lsb = getattr(g, 'xMin', 0) if g.numberOfContours else 0
        hmtx[name] = (metrics[name][0], lsb)
    fb.setupHorizontalMetrics(hmtx)
    fb.setupHorizontalHeader(ascent=ASCENT_PX * PX, descent=-DESCENT_PX * PX, lineGap=0)
    family = 'Dolia Pixel'
    fb.setupNameTable({
        'familyName': family,
        'styleName': style,
        'uniqueFontIdentifier': f'{family} {style} 1.0',
        'fullName': f'{family} {style}',
        'psName': f'DoliaPixel-{style}',
        'version': 'Version 1.000',
        'copyright': '«Вільна Доля», піксельний шрифт з українською абеткою',
        'licenseDescription': 'Apache-2.0, як і вся гра',
    })
    fb.setupOS2(
        sTypoAscender=ASCENT_PX * PX,
        sTypoDescender=-DESCENT_PX * PX,
        sTypoLineGap=0,
        usWinAscent=ASCENT_PX * PX,
        usWinDescent=DESCENT_PX * PX,
        sxHeight=5 * PX,
        sCapHeight=7 * PX,
        usWeightClass=700 if bold else 400,
        fsSelection=(0x20 if bold else 0x40) | 0x80,  # BOLD/REGULAR + USE_TYPO_METRICS
        achVendID='VDLA',
        version=4,
    )
    fb.setupPost()
    fb.font['head'].macStyle = 1 if bold else 0
    os.makedirs(OUT, exist_ok=True)
    fb.font.flavor = 'woff2'
    path = os.path.join(OUT, f'DoliaPixel-{style}.woff2')
    fb.save(path)
    print('→', os.path.relpath(path), len(order), 'гліфів')


if __name__ == '__main__':
    build(False)
    build(True)
