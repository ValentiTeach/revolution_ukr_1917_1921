"""
Воєнна карта України 1917–1921 — піксельна сцена 384×216.

Попередня карта була згенерована нейромережею: міста стояли не там, а підписи
були вигадані («Ханомив», «Галанськая», дві Полтави). Цю карту намальовано
з реальних географічних координат (довгота, широта) у рівнопроміжній проєкції.

Запуск:  python3 scripts/scenes/map_scene.py [--preview DIR]

Координати міст для «Штабу» (src/game/historicalData.ts, поля x/y у %) і знахідок
(src/game/lore.ts) рахуються тією ж функцією project(); їх друкує --coords.
"""

from __future__ import annotations

import math
import os
import random
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))

from pxfont import draw_centered, draw_text, measure  # noqa: E402
from pxlib import H, W, Canvas, dith, hexc  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'images', 'scenes', 'map.png')

# Проєкція: 1° широти = 24 px, 1° довготи = 24·cos(48.5°) ≈ 15.9 px
LON0, LAT0 = 22.0, 52.55
KX, KY = 15.9, 24.0
X0, Y0 = 46, 10


def project(lon: float, lat: float) -> tuple[float, float]:
    return X0 + (lon - LON0) * KX, Y0 + (LAT0 - lat) * KY


def pts(seq: list[tuple[float, float]]) -> list[tuple[float, float]]:
    return [project(lon, lat) for lon, lat in seq]


# ---------------------------------------------------------------------------
# Географія (довгота, широта)
# ---------------------------------------------------------------------------
UKRAINE = [
    # Дунай і кордон з Молдовою
    (28.2, 45.47), (28.55, 45.75), (28.75, 46.0), (28.95, 46.35), (29.3, 46.45), (29.75, 46.42), (30.1, 46.4),
    (29.95, 46.85), (29.6, 47.35), (29.2, 47.95), (28.7, 48.12), (28.2, 48.25), (27.6, 48.48), (26.95, 48.3), (26.63, 48.26),
    # Буковина й Закарпаття
    (26.2, 48.05), (25.6, 47.92), (24.9, 47.73), (24.55, 47.95), (23.9, 47.98), (23.1, 48.0), (22.88, 47.95),
    (22.6, 48.12), (22.15, 48.42), (22.3, 48.7), (22.56, 49.08),
    # Польща
    (22.75, 49.55), (23.05, 49.95), (23.6, 50.35), (24.05, 50.5), (24.1, 50.85), (23.95, 51.2), (23.62, 51.53),
    # Білорусь
    (24.3, 51.9), (25.2, 51.96), (26.2, 51.85), (27.2, 51.65), (27.85, 51.6), (28.6, 51.45), (29.25, 51.38), (29.8, 51.45),
    (30.3, 51.3), (30.55, 51.25), (30.62, 51.6), (30.95, 52.05), (31.5, 52.1), (31.78, 52.1),
    # Росія
    (32.2, 52.08), (32.8, 52.28), (33.4, 52.37), (33.9, 52.3), (34.1, 52.0), (34.4, 51.72), (35.1, 51.22), (35.35, 50.65),
    (36.1, 50.42), (36.6, 50.25), (37.4, 50.4), (38.0, 50.0), (38.3, 50.05), (39.2, 49.85), (39.75, 49.55), (40.15, 49.6),
    (40.1, 49.25), (39.7, 48.85), (40.0, 48.55), (39.85, 48.2), (39.75, 47.85), (38.9, 47.85), (38.3, 47.55), (38.22, 47.1),
    # Азовське й Чорне море
    (37.55, 47.08), (37.3, 46.95), (36.8, 46.76), (36.75, 46.62), (36.3, 46.66), (35.75, 46.55), (35.35, 46.42), (35.15, 46.3),
    (34.85, 46.17), (34.55, 46.2), (34.2, 46.17), (33.95, 46.15), (33.68, 46.15), (33.3, 46.09), (32.8, 46.1), (32.25, 46.16),
    (31.8, 46.32), (31.55, 46.58), (31.15, 46.63), (30.95, 46.6), (30.75, 46.48), (30.62, 46.32), (30.45, 46.12), (30.2, 45.92),
    (29.95, 45.72), (29.75, 45.45), (29.68, 45.22), (29.35, 45.38), (28.85, 45.32), (28.5, 45.45),
]

CRIMEA = [
    (33.68, 46.16), (33.55, 45.95), (33.1, 45.88), (32.75, 45.84), (32.55, 45.6), (32.48, 45.36), (32.9, 45.3), (33.36, 45.2),
    (33.6, 44.98), (33.52, 44.62), (33.4, 44.56), (33.75, 44.4), (34.17, 44.48), (34.42, 44.66), (34.75, 44.8), (34.98, 44.84),
    (35.38, 45.02), (35.85, 45.02), (36.4, 45.1), (36.47, 45.3), (36.62, 45.43), (36.4, 45.47), (36.0, 45.45), (35.55, 45.33),
    (35.1, 45.36), (34.75, 45.5), (34.45, 45.72), (34.05, 45.8), (33.8, 45.97),
]

# Море: від румунського берега через український до кубанського, униз до краю
SEA_WEST = [(28.4, 43.8), (28.65, 44.4), (28.85, 44.85), (29.2, 45.0), (29.68, 45.22)]
SEA_EAST = [(39.25, 47.15), (38.9, 47.22), (38.3, 46.72), (38.1, 46.4), (37.8, 46.05), (37.5, 45.6), (37.3, 45.3),
            (36.9, 45.35), (36.65, 45.2), (36.85, 45.05), (37.3, 44.9), (37.8, 44.68), (38.4, 44.35), (39.0, 43.9), (40.5, 43.5)]

RIVERS = {
    'dnipro': [(30.2, 52.4), (30.45, 51.7), (30.55, 51.25), (30.55, 50.95), (30.52, 50.45), (30.85, 50.15), (31.45, 49.75),
               (32.05, 49.45), (32.6, 49.2), (33.4, 49.07), (34.0, 48.9), (34.6, 48.6), (35.05, 48.45), (35.15, 48.1),
               (35.15, 47.85), (34.8, 47.62), (34.4, 47.57), (33.9, 47.2), (33.5, 46.8), (33.0, 46.7), (32.6, 46.65),
               (32.2, 46.58), (31.8, 46.56)],
    'desna': [(33.3, 52.4), (33.3, 52.0), (32.6, 51.62), (31.9, 51.62), (31.3, 51.5), (30.9, 51.0), (30.6, 50.6)],
    'prypiat': [(24.3, 51.8), (25.5, 52.05), (27.0, 52.1), (28.5, 52.0), (29.4, 51.6), (30.1, 51.4), (30.5, 51.27)],
    'bug': [(26.6, 49.75), (27.6, 49.4), (28.47, 49.23), (29.0, 48.75), (29.8, 48.4), (30.85, 48.05), (31.2, 47.6),
            (31.9, 47.2), (32.0, 46.97), (31.8, 46.7), (31.6, 46.6)],
    'dnister': [(22.9, 49.5), (24.0, 49.3), (24.7, 49.12), (25.4, 48.85), (26.0, 48.6), (26.5, 48.5), (27.25, 48.55),
                (27.8, 48.45), (28.3, 48.2), (28.95, 47.8), (29.15, 47.3), (29.55, 46.9), (29.95, 46.5), (30.3, 46.22)],
    'donets': [(36.6, 50.7), (36.75, 50.1), (37.0, 49.6), (37.3, 49.2), (37.9, 48.95), (38.4, 48.9), (39.2, 48.6), (40.2, 48.3)],
    'prut': [(24.6, 48.15), (25.3, 48.4), (25.95, 48.3), (26.6, 48.25), (27.3, 47.7), (27.9, 46.9), (28.15, 46.2), (28.2, 45.5)],
    'danube': [(27.0, 44.2), (27.8, 44.3), (28.0, 45.0), (28.2, 45.47), (28.85, 45.32), (29.35, 45.38), (29.68, 45.22)],
}

CITIES = {
    # id: (назва, довгота, широта, бік підпису)
    'kyiv': ('КИЇВ', 30.52, 50.45, 'capital'),
    'lviv': ('ЛЬВІВ', 24.03, 49.84, 'left'),
    'kharkiv': ('ХАРКІВ', 36.23, 49.99, 'below'),
    'poltava': ('ПОЛТАВА', 34.55, 49.59, 'below'),
    'katerynoslav': ('КАТЕРИНОСЛАВ', 35.05, 48.46, 'below'),
    'odesa': ('ОДЕСА', 30.73, 46.48, 'left'),
    'kruty': ('КРУТИ', 32.07, 51.06, 'right'),
    'kamianets': ('КАМʼЯНЕЦЬ', 26.58, 48.68, 'below'),
    'vinnytsia': ('ВІННИЦЯ', 28.47, 49.23, 'below'),
}
TOWNS = {
    'ЧЕРНІГІВ': (31.29, 51.49, 'right'),
    'ЖИТОМИР': (28.66, 50.25, 'above'),
    'ТЕРНОПІЛЬ': (25.6, 49.55, 'below'),
    'ХЕРСОН': (32.62, 46.64, 'below'),
    'СЕВАСТОПОЛЬ': (33.52, 44.6, 'left'),
    'ЧЕРНІВЦІ': (25.93, 48.29, 'below'),
    'ГУЛЯЙПОЛЕ': (36.27, 47.66, 'right'),
    'ПРОСКУРІВ': (27.0, 49.42, 'above'),
}

RAILWAYS = [
    [(24.03, 49.84), (25.6, 49.55), (27.0, 49.42), (28.1, 49.04), (28.84, 49.71), (29.7, 50.05), (30.52, 50.45)],
    [(28.1, 49.04), (29.0, 48.4), (29.6, 47.77), (30.2, 47.1), (30.73, 46.48)],
    [(30.52, 50.45), (31.2, 50.75), (31.9, 51.05), (32.07, 51.06), (32.8, 51.18), (33.5, 51.7), (34.0, 52.2)],
    [(30.52, 50.45), (31.4, 50.3), (32.4, 50.1), (33.0, 50.0), (34.55, 49.59), (35.4, 49.85), (36.23, 49.99), (37.0, 50.6)],
    [(36.23, 49.99), (36.33, 48.89), (35.8, 48.5), (35.05, 48.46), (35.15, 47.85), (35.37, 46.85), (34.4, 45.71), (34.1, 44.95), (33.52, 44.6)],
    [(36.33, 48.89), (37.6, 48.0), (38.4, 48.3), (39.3, 48.57)],
    [(24.03, 49.84), (25.93, 48.29)],
    [(26.58, 48.68), (27.0, 49.42)],
]
FRONT = [(37.0, 51.0), (36.9, 50.4), (37.4, 49.6), (37.8, 48.9), (37.6, 48.2), (37.2, 47.4), (36.9, 46.9)]

REGIONS = [
    ('ВОЛИНЬ', 26.0, 50.95), ('ГАЛИЧИНА', 23.4, 48.98), ('ПОДІЛЛЯ', 29.0, 48.3),
    ('СЛОБОЖАНЩИНА', 35.6, 50.35), ('ТАВРІЯ', 34.4, 46.95), ('КРИМ', 34.2, 45.3), ('ДОНБАС', 38.2, 48.05),
]

# ---------------------------------------------------------------------------
# Палітра «старий папір»
# ---------------------------------------------------------------------------
PAPER = hexc('#ead6a6')
PAPER_D = hexc('#d9bf88')
PAPER_DD = hexc('#c3a06a')
LAND_UA = hexc('#f3e2b4')
LAND_UA2 = hexc('#ecd7a2')
BORDER_UA = hexc('#a8452f')
BORDER_TINT = hexc('#e9be92')
SEA = hexc('#9cc1c6')
SEA_D = hexc('#86aeb6')
COAST = hexc('#3e6670')
COAST_2 = hexc('#7fa8b0')
RIVER = hexc('#4a86a6')
INK = hexc('#2e2015')
INK_SOFT = hexc('#6e5236')
RED = hexc('#b8322a')
FOREST = hexc('#6f8a43')
FOREST_D = hexc('#4f6a2e')
MOUNT = hexc('#9a7448')
MOUNT_D = hexc('#6a4c2c')
BURN = hexc('#8a5a2c')
BURN_D = hexc('#5a3618')


def mask(polys: list[list[tuple[float, float]]]) -> list[list[bool]]:
    im = Image.new('1', (W, H), 0)
    d = ImageDraw.Draw(im)
    for p in polys:
        d.polygon(p, fill=1)
    px = im.load()
    return [[bool(px[x, y]) for x in range(W)] for y in range(H)]


def polyline(cv: Canvas, seq: list[tuple[float, float]], c, width: int = 1, pattern: str | None = None) -> list[tuple[int, int]]:
    """Ламана через точки (у пікселях); повертає всі намальовані пікселі по порядку."""
    out: list[tuple[int, int]] = []
    for (ax, ay), (bx, by) in zip(seq, seq[1:]):
        x0, y0, x1, y1 = round(ax), round(ay), round(bx), round(by)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            if not out or out[-1] != (x0, y0):
                out.append((x0, y0))
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy
    for i, (x, y) in enumerate(out):
        if pattern and pattern[i % len(pattern)] == '.':
            continue
        cv.set(x, y, c)
        if width > 1:
            cv.set(x, y + 1, c)
    return out


def scene_map() -> Canvas:
    cv = Canvas(bg=PAPER)
    r = random.Random(1917)

    # Папір: дрібна плямиста фактура й темніші краї
    for y in range(H):
        for x in range(W):
            edge = min(x, y, W - 1 - x, H - 1 - y)
            n = math.sin(x * 0.07 + y * 0.03) * 0.5 + math.sin(x * 0.013 - y * 0.05) * 0.5
            c = PAPER
            if dith(x, y, 0.25 + 0.2 * n):
                c = PAPER_D
            if edge < 14 and dith(x, y, (14 - edge) / 16):
                c = PAPER_DD
            cv.set(x, y, c)

    ua_main = pts(UKRAINE)
    crimea = pts(CRIMEA)
    # Море будуємо явно: захід → український берег (з заходу на схід) → схід → низ карти
    coast_ua = UKRAINE[UKRAINE.index((38.22, 47.1)):] + [UKRAINE[0]]
    coast_ua = list(reversed(coast_ua))  # від Дунаю на схід до Таганрозької затоки
    sea_poly = pts(SEA_WEST) + pts(coast_ua) + pts(SEA_EAST) + [(W + 20, H + 20), (-20, H + 20)]
    sea = mask([sea_poly])
    ua = mask([ua_main, crimea])
    crim = mask([crimea])

    # Суходіл: Україна світліша, з тонованою смугою вздовж кордону
    for y in range(H):
        for x in range(W):
            if sea[y][x] and not crim[y][x]:
                c = SEA if not dith(x, y, 0.18) else SEA_D
                if (y + (x // 7) * 3) % 6 == 0 and (x + y * 3) % 9 < 4:
                    c = SEA_D  # хвилі-штрихи
                cv.set(x, y, c)
            elif ua[y][x]:
                cv.set(x, y, LAND_UA if not dith(x, y, 0.12) else LAND_UA2)

    def is_sea(x: int, y: int) -> bool:
        return 0 <= x < W and 0 <= y < H and sea[y][x] and not crim[y][x]

    def is_ua(x: int, y: int) -> bool:
        return 0 <= x < W and 0 <= y < H and ua[y][x] and not is_sea(x, y)

    # Берегова лінія і «відлуння» берега у воді, як на старих гравюрах
    for y in range(H):
        for x in range(W):
            if not is_sea(x, y):
                continue
            near = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and not is_sea(x + dx, y + dy) and 0 <= x + dx < W and 0 <= y + dy < H]
            if near:
                cv.set(x, y, COAST)
                continue
            ring = any(0 <= x + dx < W and 0 <= y + dy < H and not is_sea(x + dx, y + dy) for dx in range(-3, 4) for dy in range(-3, 4) if max(abs(dx), abs(dy)) == 3)
            if ring and (x + y) % 2 == 0:
                cv.set(x, y, COAST_2)

    # Тонована смуга вздовж сухопутного кордону України (з боку України)
    border_px = []
    for y in range(H):
        for x in range(W):
            if not is_ua(x, y):
                continue
            outside = [(dx, dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and not is_ua(x + dx, y + dy) and not is_sea(x + dx, y + dy)]
            if outside:
                border_px.append((x, y))
    for (x, y) in border_px:
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2):
                if is_ua(x + dx, y + dy) and (x + dx, y + dy) not in border_px and abs(dx) + abs(dy) <= 2:
                    cv.set(x + dx, y + dy, BORDER_TINT)
    for (x, y) in border_px:
        cv.set(x, y, BORDER_UA if (x + y) % 3 else LAND_UA)

    # Полісся: ліси; Карпати: гори
    for _ in range(170):
        lon, lat = r.uniform(23.9, 33.6), r.uniform(50.75, 51.95)
        x, y = map(round, project(lon, lat))
        if is_ua(x, y) and is_ua(x + 2, y + 2) and cv.get(x, y) in (LAND_UA, LAND_UA2):
            cv.set(x, y, FOREST)
            cv.set(x - 1, y + 1, FOREST)
            cv.set(x, y + 1, FOREST_D)
            cv.set(x + 1, y + 1, FOREST_D)
            cv.set(x, y + 2, INK_SOFT)
    # Карпати: окремі вершини вздовж дуги, через одну вищі
    ax, ay = project(22.75, 48.72)
    bx, by = project(25.3, 47.98)
    n = 8
    for i in range(n):
        t = i / (n - 1)
        x, y = round(ax + (bx - ax) * t), round(ay + (by - ay) * t)
        peak(cv, x, y + (2 if i % 2 else 0), 6 if i % 2 else 8)
    # Ріки
    for name, seq in RIVERS.items():
        polyline(cv, pts(seq), RIVER)
    # Дніпрові пороги: ширше русло біля Катеринослава
    polyline(cv, pts(RIVERS['dnipro'][8:15]), RIVER, width=2)

    # Залізниці: чорна лінія з білими «шпалами»
    for seq in RAILWAYS:
        line = polyline(cv, pts(seq), INK)
        for i, (x, y) in enumerate(line):
            if i % 4 == 2:
                cv.set(x, y, hexc('#f6ecd0'))
    # Лінія фронту 1919 року — червоний пунктир
    polyline(cv, pts(FRONT), RED, pattern='##..')
    for (lon, lat) in FRONT[1:-1:2]:
        x, y = map(round, project(lon, lat))
        # стрілки наступу на захід
        cv.set(x - 2, y, RED)
        cv.set(x - 3, y, RED)
        cv.set(x - 2, y - 1, RED)
        cv.set(x - 2, y + 1, RED)

    # Підписи регіонів (блідо, під містами)
    for region, lon, lat in REGIONS:
        x, y = map(round, project(lon, lat))
        draw_centered(cv, x, y, region, hexc('#a07a4c'), outline=LAND_UA)
    draw_centered(cv, *map(round, project(30.1, 44.95)), 'ЧОРНЕ МОРЕ', hexc('#3f6872'))
    draw_centered(cv, *map(round, project(37.0, 46.35)), 'АЗОВСЬКЕ', hexc('#3f6872'))
    ax, ay = map(round, project(37.0, 46.35))
    draw_centered(cv, ax, ay + 6, 'МОРЕ', hexc('#3f6872'))
    # Назва ріки вздовж русла
    draw_text(cv, round(project(32.2, 48.6)[0]), round(project(32.2, 48.6)[1]), 'ДНІПРО', RIVER)

    # Кораблі в морі (знахідка «Корабель»: x≈48%, y≈79%)
    ship(cv, *map(round, project(30.95, 45.62)), flag=True)
    ship(cv, *map(round, project(35.0, 44.55)), flag=False)

    # Міста
    for name, (lon, lat, side) in TOWNS.items():
        x, y = map(round, project(lon, lat))
        cv.rect(x - 1, y - 1, 2, 2, INK)
        label(cv, x, y, name, side, INK_SOFT)
    for cid, (name, lon, lat, side) in CITIES.items():
        x, y = map(round, project(lon, lat))
        if cid == 'kyiv':
            capital(cv, x, y)
            draw_text(cv, x + 6, y + 3, 'Київ', INK, font='big', outline=LAND_UA)
            continue
        if cid == 'lviv':
            castle(cv, x, y)
        else:
            cv.rect(x - 2, y - 2, 4, 4, INK)
            cv.rect(x - 1, y - 1, 2, 2, RED)
        label(cv, x, y + (3 if cid == 'lviv' else 0), name, side, INK)

    # Компас-роза (знахідка: x≈12%, y≈78%)
    compass(cv, 46, 170, 15)

    # Заголовок-картуш угорі праворуч (ліворуч у грі лежить плашка акту)
    cartouche(cv, W - 118, 5, 112, 20)
    draw_centered(cv, W - 62, 13, 'ВОЄННА КАРТА УКРАЇНИ', INK)
    draw_centered(cv, W - 62, 21, '1917–1921', RED)

    # Легенда праворуч унизу (знахідка: x≈92%, y≈78%)
    legend(cv, 318, 148, 62, 62)

    # Обпалені краї паперу
    for y in range(H):
        for x in range(W):
            edge = min(x, y, W - 1 - x, H - 1 - y)
            wob = 2.2 * math.sin(x * 0.21 + y * 0.17) + 1.4 * math.sin(x * 0.53 - y * 0.31)
            if edge + wob < 2:
                cv.set(x, y, BURN_D)
            elif edge + wob < 3.6 and dith(x, y, 0.6):
                cv.set(x, y, BURN)
    return cv


def peak(cv: Canvas, x: int, base: int, h: int) -> None:
    """Гора: світлий лівий схил, темний правий, сніг на вершині, темний контур."""
    for k in range(h):
        y = base - h + k
        for dx in range(-k, k + 1):
            c = MOUNT if dx < 0 else MOUNT_D
            if k < 2:
                c = hexc('#f6f1e4')
            if abs(dx) == k:
                c = INK_SOFT
            cv.set(x + dx, y, c)


def label(cv: Canvas, x: int, y: int, name: str, side: str, color) -> None:
    w = measure(name)
    if side == 'below':
        draw_centered(cv, x, y + 9, name, color, outline=LAND_UA)
    elif side == 'above':
        draw_centered(cv, x, y - 4, name, color, outline=LAND_UA)
    elif side == 'left':
        draw_text(cv, x - 4 - w, y + 3, name, color, outline=LAND_UA)
    else:
        draw_text(cv, x + 4, y + 3, name, color, outline=LAND_UA)


def capital(cv: Canvas, x: int, y: int) -> None:
    """Київ: собор із золотою банею і синьо-жовтим прапором."""
    cv.rect(x - 3, y - 2, 7, 5, INK)
    cv.rect(x - 2, y - 1, 5, 3, hexc('#f4efe2'))
    cv.rect(x - 1, y - 4, 3, 2, hexc('#e0a92a'))
    cv.set(x, y - 5, hexc('#e0a92a'))
    cv.set(x, y + 1, INK)
    cv.vline(x + 4, y - 9, y - 2, INK)
    cv.rect(x + 5, y - 9, 4, 2, hexc('#1d6fd1'))
    cv.rect(x + 5, y - 7, 4, 2, hexc('#f7c948'))


def castle(cv: Canvas, x: int, y: int) -> None:
    """Львів: ратуша з вежею (знахідка «Львівська ратуша»)."""
    stone, stone_d = hexc('#c9b48a'), hexc('#8e7a56')
    cv.rect(x - 4, y - 2, 9, 5, INK)
    cv.rect(x - 3, y - 1, 7, 3, stone)
    cv.rect(x - 1, y - 7, 3, 6, INK)
    cv.set(x, y - 6, stone)
    cv.set(x, y - 5, stone_d)
    cv.set(x, y - 4, stone)
    cv.set(x - 3, y - 3, INK)
    cv.set(x + 3, y - 3, INK)
    cv.set(x, y + 1, INK)
    cv.vline(x, y - 10, y - 8, INK)
    cv.rect(x + 1, y - 10, 3, 1, hexc('#1d6fd1'))
    cv.rect(x + 1, y - 9, 3, 1, hexc('#f7c948'))


def ship(cv: Canvas, x: int, y: int, flag: bool) -> None:
    hull, deck = hexc('#3a2a1e'), hexc('#6b5038')
    cv.rect(x - 6, y, 13, 2, hull)
    cv.set(x - 7, y, hull)
    cv.set(x + 7, y, hull)
    cv.rect(x - 4, y - 1, 9, 1, deck)
    cv.rect(x - 1, y - 3, 3, 2, hexc('#e8e2d2'))
    cv.rect(x, y - 5, 1, 2, INK)
    cv.vline(x - 4, y - 8, y - 1, INK)
    cv.vline(x + 4, y - 7, y - 1, INK)
    cv.hline(x - 4, x + 4, y - 7, INK_SOFT)
    if flag:
        cv.rect(x - 3, y - 8, 3, 1, hexc('#1d6fd1'))
        cv.rect(x - 3, y - 7, 3, 1, hexc('#f7c948'))
    for k in range(-8, 9, 3):
        cv.set(x + k, y + 3, hexc('#e6f0ee'))


def compass(cv: Canvas, cx: int, cy: int, R: int) -> None:
    ring, ring_d = hexc('#b08a5a'), hexc('#6e5236')
    for a in range(0, 360, 3):
        t = math.radians(a)
        cv.set(round(cx + math.cos(t) * R), round(cy + math.sin(t) * R), ring_d)
        if a % 30 == 0:
            cv.set(round(cx + math.cos(t) * (R - 1)), round(cy + math.sin(t) * (R - 1)), ring_d)
    for k in range(8):
        t = math.radians(k * 45 - 90)
        L = R - 2 if k % 2 == 0 else R * 0.55
        for i in range(1, round(L)):
            w = (1 - i / L) * (2.4 if k % 2 == 0 else 1.4)
            px, py = cx + math.cos(t) * i, cy + math.sin(t) * i
            for s in range(-round(w), round(w) + 1):
                ox, oy = -math.sin(t) * s, math.cos(t) * s
                c = (RED if k == 0 else INK) if s <= 0 else (hexc('#f3e2b4') if k != 0 else hexc('#e88a7a'))
                cv.set(round(px + ox), round(py + oy), c)
    cv.rect(cx - 1, cy - 1, 3, 3, ring)
    cv.set(cx, cy, INK)
    draw_centered(cv, cx + 1, cy - R - 2, 'Пн', INK, font='tiny')


def cartouche(cv: Canvas, x: int, y: int, w: int, h: int) -> None:
    cv.rect(x, y, w, h, INK)
    cv.rect(x + 1, y + 1, w - 2, h - 2, hexc('#f6e9c4'))
    cv.rect(x + 2, y + 2, w - 4, 1, hexc('#c9a86e'))
    cv.rect(x + 2, y + h - 3, w - 4, 1, hexc('#c9a86e'))
    # кутики-вишиванка
    for (cx, cy) in ((x + 3, y + 4), (x + w - 5, y + 4), (x + 3, y + h - 6), (x + w - 5, y + h - 6)):
        cv.set(cx, cy, RED)
        cv.set(cx + 1, cy + 1, RED)
        cv.set(cx, cy + 2, RED)
        cv.set(cx - 1 if cx > x + 5 else cx + 2, cy + 1, RED)


def legend(cv: Canvas, x: int, y: int, w: int, h: int) -> None:
    cartouche(cv, x, y, w, h)
    draw_centered(cv, x + w // 2, y + 10, 'ЛЕГЕНДА', INK)
    rows = [('city', 'МІСТО'), ('rail', 'ЗАЛІЗНИЦЯ'), ('front', 'ФРОНТ'), ('river', 'РІЧКА'), ('border', 'КОРДОН')]
    for i, (kind, text) in enumerate(rows):
        ly = y + 17 + i * 8
        sx = x + 5
        if kind == 'city':
            cv.rect(sx + 2, ly - 2, 4, 4, INK)
            cv.rect(sx + 3, ly - 1, 2, 2, RED)
        elif kind == 'rail':
            for k in range(9):
                cv.set(sx + k, ly, hexc('#f6ecd0') if k % 4 == 2 else INK)
        elif kind == 'front':
            for k in range(9):
                if k % 4 < 2:
                    cv.set(sx + k, ly, RED)
        elif kind == 'river':
            for k in range(9):
                cv.set(sx + k, ly + (1 if k % 4 in (1, 2) else 0), RIVER)
        else:
            for k in range(9):
                if k % 3:
                    cv.set(sx + k, ly, BORDER_UA)
        draw_text(cv, sx + 12, ly + 3, text, INK)


def coords() -> None:
    for cid, (name, lon, lat, _) in CITIES.items():
        x, y = project(lon, lat)
        print(f"{cid:14s} x: {x / W * 100:.1f}, y: {y / H * 100:.1f}")


def main(argv: list[str]) -> None:
    if '--coords' in argv:
        coords()
        return
    cv = scene_map()
    cv.save(OUT)
    print('→ map')
    if '--preview' in argv:
        d = argv[argv.index('--preview') + 1]
        os.makedirs(d, exist_ok=True)
        cv.img.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(d, 'map.png'))


if __name__ == '__main__':
    main(sys.argv[1:])
