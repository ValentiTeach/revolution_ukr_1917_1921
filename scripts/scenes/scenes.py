"""
Генератор піксельних сцен для актів 1919–1921 років.

Запуск із кореня репозиторію:
    python3 scripts/scenes/scenes.py            # усі сцени
    python3 scripts/scenes/scenes.py winter     # одна сцена
    python3 scripts/scenes/scenes.py --preview DIR   # ще й збільшені ×3 копії

Сцени мають розмір 384×216 і показуються в грі з image-rendering: pixelated.
Координати предметів, на яких сховані знахідки, описані в коментарях —
вони збігаються з полями x/y у src/game/missions1919_1921.ts.
"""

from __future__ import annotations

import math
import os
import random
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))

from figures import campfire, church, clouds, colonnade, oak_crown, steamer, wheel, dust, gallop_horse, horse, hut, sled, smoke, snowfall, soldier, sunflower, tachanka, wayside_cross, windmill  # noqa: E402
from pxlib import H, W, Canvas, bare_tree, dith, hexc, mix, pine, ridge  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'images', 'scenes')

UA_BLUE = hexc('#1d6fd1')
UA_YELLOW = hexc('#f7c948')


# ===========================================================================
# 1. Зимовий похід: засніжений шлях, колона, село з вогниками
# ===========================================================================
def scene_winter() -> Canvas:
    cv = Canvas()
    sky = [hexc(c) for c in ('#141a33', '#232c55', '#3d4677', '#6b6390', '#b07d8e', '#e9a67c')]
    cv.vgrad(0, 104, sky)
    cv.glow(286, 100, 70, hexc('#ffc98a'), 0.55, 0.5)
    cv.stars(3, 40, 40, [hexc('#c7d2fe'), hexc('#e0e7ff')])
    clouds(cv, 11, 20, 70, 9, hexc('#4b4f7e'), hexc('#c98f93'), hexc('#2b315c'))

    # Далекі пагорби з лісом
    far = ridge(5, W, 102, [(10, 70), (4, 18)])
    snow_far = hexc('#8f96c3')
    cv.fill_below(far, H, lambda x, y, top: mix(snow_far, hexc('#b5a6c4'), 0.3) if y - top < 2 else snow_far)
    r = random.Random(7)
    for x in range(0, W, 3):
        if r.random() < 0.55 and not (210 < x < 270):
            pine(cv, x, far[x] + 2, r.randrange(5, 10), hexc('#3a3f68'), hexc('#454b78'), hexc('#5b5f8f'))
    cv.haze(80, 112, hexc('#b48a9e'), 0.35, 0.0)

    # Середній план: пагорб із селом праворуч
    mid = ridge(9, W, 128, [(14, 120), (3, 20)])
    for x in range(W):
        mid[x] = min(mid[x], 132 - round(18 * math.exp(-((x - 320) / 60) ** 2)))
    snow_mid = hexc('#b8c0e0')
    cv.fill_below(mid, H, lambda x, y, top: hexc('#e3e7f7') if y - top < 1 else (snow_mid if dith(x, y, 0.2 + (y - top) / 60) else hexc('#a7b0d6')))
    for i, (hx, hw) in enumerate(((282, 22), (306, 26), (338, 22))):
        base = mid[hx + hw // 2] + 4
        wins = hut(cv, hx, base, hw, 18, hexc('#cdd3ee'), hexc('#9aa3cc'), hexc('#8c6a4a'), hexc('#5d4632'), hexc('#ffcf6b'), snow=hexc('#eef2ff'), door=hexc('#4b3a2a'))
        for wx, wy in wins:
            cv.glow(wx, wy, 9, hexc('#ffb54a'), 0.45)
        smoke(cv, hx + hw // 2, base - 18, 26, hexc('#c9c2d8'), 30 + i)
    church(cv, 262, mid[262] + 3, 3, hexc('#7a5c44'), hexc('#5a4332'), hexc('#3f8a6a'), hexc('#2c6650'), hexc('#f7c948'))
    # Тин біля хат
    for x in range(270, 370, 3):
        cv.vline(x, mid[x] + 2, mid[x] + 5, hexc('#5d4632'))
    cv.hline(270, 370, mid[300] + 3, hexc('#6f5640'))

    # Передній план: сніжне поле з наїждженою дорогою
    ground_top = 140
    for y in range(ground_top, H):
        t = (y - ground_top) / (H - ground_top)
        for x in range(W):
            if cv.get(x, y) != cv.get(x, y) or y >= max(mid[x], ground_top):
                c = mix(hexc('#c9d0ec'), hexc('#eef1fb'), t)
                if dith(x, y, 0.3 + 0.4 * math.sin(x / 17 + y / 9) ** 2):
                    c = mix(c, hexc('#aeb7dc'), 0.5)
                cv.set(x, y, c)
    # Дорога: від лівого нижнього кута до села
    road = hexc('#a89cb4')
    for y in range(128, H):
        t = (y - 128) / (H - 128)
        cx = 250 - 210 * t ** 0.9
        half = 4 + 34 * t
        for x in range(round(cx - half), round(cx + half)):
            if y >= mid[max(0, min(W - 1, x))]:
                c = road if dith(x, y, 0.7) else hexc('#bcb2c8')
                if abs(x - (cx - half * 0.45)) < 1 + t * 2 or abs(x - (cx + half * 0.45)) < 1 + t * 2:
                    c = hexc('#8d819c')  # колії від саней
                cv.set(x, y, c)

    # Колона: далекі фігурки біля села, ближчі — на передньому плані
    coat, coat_d = hexc('#4a5240'), hexc('#2f3529')
    hat, skin, rifle = hexc('#2a2220'), hexc('#d9a37f'), hexc('#5b4330')
    rim = hexc('#e8b48c')
    for i, (sx, sy, sh) in enumerate(((240, 132, 7), (234, 134, 7), (228, 137, 8), (220, 140, 9), (212, 143, 9), (203, 147, 10), (194, 151, 11), (128, 176, 14))):
        soldier(cv, sx, sy, sh, coat, coat_d, hat, skin, rifle, step=i % 2, rim=rim, facing=1)
    # Вершник із синьо-жовтим прапором (тут «Залізний хрест»: x≈64%, y≈70%)
    horse(cv, 246, 158, 15, hexc('#5a3b26'), hexc('#3a2618'), hexc('#1e140d'), step=1)
    soldier(cv, 247, 152, 12, coat, coat_d, hat, skin, None, rim=rim, flag=(UA_BLUE, UA_YELLOW))
    # Сани з пораненими (знахідка «Сани»: x≈38%, y≈76%)
    horse(cv, 172, 168, 16, hexc('#6b4a33'), hexc('#45301f'), hexc('#24170e'), step=0)
    sled(cv, 132, 170, 28, hexc('#8a6a48'), hexc('#4b3826'), hexc('#7d6b8c'), hexc('#5d4f6c'))
    soldier(cv, 140, 164, 10, hexc('#5b5f4a'), hexc('#3a3d30'), hat, skin, None)
    # Ближні вояки
    for i, (sx, sy, sh) in enumerate(((110, 182, 18), (86, 194, 20), (60, 208, 22))):
        soldier(cv, sx, sy, sh, coat, coat_d, hat, skin, rifle, step=i % 2, rim=rim, pack=hexc('#3b3226'))

    # Придорожній хрест із рушником і кущики з-під снігу
    wayside_cross(cv, 300, 176, 22, hexc('#6b4c34'), hexc('#3e2c1f'), hexc('#f1f5f9'))
    for bx, by in ((268, 186), (318, 180), (180, 196), (232, 204)):
        for k in range(5):
            cv.line(bx, by, bx - 3 + k * 2 - (k % 2), by - 3 - (k % 3) * 2, hexc('#5b4a5e'))
    # Легкі хвилі намету
    for y0 in (150, 162, 176, 192):
        for x in range(150, 384):
            yy = y0 + round(3 * math.sin(x / 23 + y0))
            if cv.get(x, yy)[2] > 200 and dith(x, yy, 0.5):
                cv.set(x, yy, hexc('#f5f7ff'))

    # Великі ялини обабіч
    for x, h in ((14, 120), (40, 92), (-6, 150), (362, 128), (384, 150), (340, 84)):
        pine(cv, x, H - 4 if x < 50 or x > 330 else 180, h, hexc('#1c2a3a'), hexc('#26394a'), hexc('#35506a'), snow=hexc('#e8eefc'), trunk=hexc('#3a2a1e'))
    # Кучугури
    for x, w in ((0, 70), (300, 90)):
        cv.ellipse(x + w / 2, H, w / 2, 10, shader=lambda xx, yy: hexc('#f4f7ff') if yy < H - 6 else hexc('#d5dcf3'))
    snowfall(cv, 99, 260, hexc('#f8fafc'), hexc('#dfe6fb'))
    return cv


# ===========================================================================
# 2. Степ на заході сонця: тачанки, вітряк, курган
# ===========================================================================
def scene_steppe() -> Canvas:
    cv = Canvas()
    sky = [hexc(c) for c in ('#241f45', '#4a2f5e', '#8c3f6a', '#d4596a', '#f08b4c', '#ffcf72')]
    cv.vgrad(0, 124, sky)
    # Велике смугасте сонце над обрієм
    sx, sy, sr = 286, 116, 26
    cv.glow(sx, sy, 80, hexc('#ffb36b'), 0.5, 0.55)
    for y in range(sy - sr, sy + 1):
        band = (y - (sy - sr)) / sr
        if band > 0.55 and (y // 3) % 2 == 0:
            continue  # класичні «прорізи» піксельного сонця
        for x in range(sx - sr, sx + sr + 1):
            if (x - sx) ** 2 + (y - sy) ** 2 <= sr * sr:
                cv.set(x, y, mix(hexc('#fff1b0'), hexc('#ffb347'), band))
    clouds(cv, 21, 24, 90, 10, hexc('#7b3a63'), hexc('#ffb07a'), hexc('#4a2a55'))

    # Обрій: далекий степ, курган із кам’яною бабою
    far = ridge(31, W, 122, [(3, 90), (1, 15)])
    for x in range(W):
        far[x] = min(far[x], 124 - round(10 * math.exp(-((x - 118) / 22) ** 2)))
    cv.fill_below(far, H, lambda x, y, top: hexc('#7a4058') if y - top < 2 else hexc('#5e3450'))
    cv.rect(116, far[118] - 6, 3, 6, hexc('#3f2238'))  # кам'яна баба
    cv.rect(115, far[118] - 8, 5, 2, hexc('#3f2238'))
    windmill(cv, 66, 128, 1.9, hexc('#5a3346'), hexc('#3a2034'), hexc('#8e5a6e'), hexc('#3a2034'), 0.4)
    cv.haze(104, 132, hexc('#f29a6a'), 0.45, 0.05)

    # Золота трава степу: дрібні стеблинки, світлі пасма від вітру
    rr = random.Random(77)
    hashv = {}
    for y in range(126, H):
        t = (y - 126) / (H - 126)
        base_c = mix(hexc('#a06a3c'), hexc('#d9a24c'), min(1, t * 1.5))
        light = mix(base_c, hexc('#f7d88a'), 0.6)
        shade = mix(base_c, hexc('#6a4226'), 0.45)
        streak = math.sin(y / 5.0) * 0.5 + 0.5
        for x in range(W):
            if y < far[x] + 4:
                continue
            key = (x, y // 2)
            if key not in hashv:
                hashv[key] = rr.random()
            hv = hashv[key]
            c = base_c
            gust = math.sin(x / 41 + y / 13) + math.sin(x / 17 - y / 29)
            if hv < 0.10 + 0.12 * streak * (gust > 0.6):
                c = light
            elif hv > 0.88:
                c = shade
            elif gust > 1.3 and dith(x, y, 0.5):
                c = mix(base_c, light, 0.5)
            cv.set(x, y, c)
    # Битий шлях
    for y in range(138, H):
        t = (y - 138) / (H - 138)
        cx = 120 + 260 * t
        half = 3 + 30 * t
        for x in range(round(cx - half), round(cx + half)):
            if dith(x, y, 0.55):
                cv.set(x, y, hexc('#b9875a'))

    # Вершник із чорним прапором на пагорбі (знахідка: x≈62%, y≈50%)
    gallop_horse(cv, 236, 134, 15, hexc('#2b1c18'), hexc('#160e0c'), hexc('#0b0706'), 1)
    soldier(cv, 238, 127, 12, hexc('#2c2420'), hexc('#1a1412'), hexc('#120d0b'), hexc('#c48a62'), None, flag=(hexc('#111111'), hexc('#1c1c1c')))
    # Головна тачанка (знахідка: x≈46%, y≈70%) і друга позаду
    horse_c = (hexc('#5c3a24'), hexc('#3a2416'), hexc('#1e120b'))
    dust(cv, 132, 176, 60, hexc('#f2c58a'), 3)
    tachanka(cv, 150, 178, 1.6, hexc('#8a5a32'), hexc('#4a2e1a'), hexc('#3a3d44'), hexc('#3c3a2a'), hexc('#d39a72'), hexc('#1e1712'), horse_c, phase=0)
    dust(cv, 40, 150, 40, hexc('#f2c58a'), 4)
    tachanka(cv, 52, 152, 1.05, hexc('#7a4e2c'), hexc('#45291a'), hexc('#3a3d44'), hexc('#3c3a2a'), hexc('#d39a72'), hexc('#1e1712'), horse_c, phase=1, flag=hexc('#141414'))

    # Передній план: ковила й соняшники
    r = random.Random(5)
    for _ in range(120):
        x = r.randrange(W)
        base = r.randrange(196, H + 4)
        hgt = r.randrange(6, 16)
        for k in range(hgt):
            cv.set(x + round(k * 0.35 * (1 if x % 2 else -1)), base - k, hexc('#f3e3b0') if k > hgt - 4 else hexc('#a37a44'))
    for x, h in ((326, 30), (344, 40), (362, 28), (378, 36), (306, 22)):
        sunflower(cv, x, H, h, hexc('#3d5a2a'), hexc('#f7c948'), hexc('#4a2e1a'))
    return cv


# ===========================================================================
# 3. Холодний Яр уночі: місяць, монастир на пагорбі, багаття повстанців
# ===========================================================================
def scene_forest() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 130, [hexc(c) for c in ('#050914', '#0b1630', '#142447', '#1f3358', '#2c4566')])
    cv.stars(41, 140, 90, [hexc('#cbd5e1'), hexc('#fef3c7'), hexc('#93c5fd')])
    # Місяць
    cv.glow(312, 34, 60, hexc('#9fb8e0'), 0.45)
    cv.ellipse(312, 34, 13, 13, shader=lambda x, y: hexc('#f8f3dc') if (x - 316) ** 2 + (y - 30) ** 2 > 18 else hexc('#e2dcc0'))
    for cx, cy in ((306, 30), (316, 40), (309, 41)):
        cv.set(cx, cy, hexc('#cfc7a8'))
    clouds(cv, 3, 40, 70, 4, hexc('#22345a'), hexc('#6b84ad'), hexc('#162445'))

    # Пагорб із монастирем (знахідка: x≈50%, y≈30%)
    hill = ridge(13, W, 96, [(18, 140), (4, 26)])
    for x in range(W):
        hill[x] = min(hill[x], 96 - round(26 * math.exp(-((x - 192) / 70) ** 2)))
    # Пласка вершина під монастирем, щоб мури стояли на землі, а не «висіли»
    mx, mb = 192, hill[192] + 2
    for x in range(mx - 40, mx + 41):
        hill[x] = min(hill[x], mb - 1 + round(abs(x - mx) / 40 * 2))
    # Пагорб: місячне світло на правому схилі, темний лівий
    def hill_shade(x, y, top):
        if y - top < 1:
            return hexc('#3a5878') if x > mx else hexc('#24405a')
        if y - top < 3 and x > mx and dith(x, y, 0.5):
            return hexc('#24405a')
        return hexc('#14263a') if not (x > mx and dith(x, y, 0.15)) else hexc('#1a3048')
    cv.fill_below(hill, H, hill_shade)
    # Стежка серпантином до брами
    for k in range(40):
        px = mx + 30 + round(10 * math.sin(k / 6))
        cv.set(px, mb + 2 + k // 2, hexc('#2a405a'))
    wall = hexc('#a9b6d2')
    wall_d = hexc('#66739a')
    cv.rect(mx - 34, mb - 10, 68, 10, wall)  # мури
    for k in range(mx - 34, mx + 34, 4):
        cv.rect(k, mb - 12, 2, 2, wall)
    cv.rect(mx + 14, mb - 10, 20, 10, wall_d)
    cv.rect(mx - 12, mb - 26, 24, 16, wall)  # собор
    cv.rect(mx + 4, mb - 26, 8, 16, wall_d)
    for wx in (mx - 8, mx - 2, mx + 6):
        cv.rect(wx, mb - 21, 2, 4, hexc('#ffcf6b'))
    church(cv, mx, mb - 24, 4, wall, wall_d, hexc('#3f8a6a'), hexc('#22513f'), hexc('#f7c948'))
    # Дзвіниця
    cv.rect(mx - 30, mb - 34, 9, 24, wall)
    cv.rect(mx - 28, mb - 30, 5, 5, hexc('#1b2a44'))
    cv.set(mx - 26, mb - 28, hexc('#f7c948'))  # дзвін
    cv.poly([(mx - 31, mb - 34), (mx - 20, mb - 34), (mx - 25.5, mb - 44)], hexc('#2f6a52'))
    cv.vline(mx - 26, mb - 48, mb - 44, hexc('#f7c948'))
    cv.glow(mx, mb - 18, 30, hexc('#ffcf6b'), 0.18)

    # Далекий ліс-яр: шари дубів
    r = random.Random(9)
    for layer, (base_y, cols, scale) in enumerate(((118, ('#0f2236', '#16304a', '#21405e'), 10), (138, ('#0b1a2a', '#12283f', '#1c3a55'), 13))):
        x = -10
        while x < W + 10:
            if layer == 0 and 150 < x < 236:
                x += 12
                continue
            oak_crown(cv, x, base_y - r.randrange(0, 10), scale + r.randrange(-2, 4), hexc(cols[0]), hexc(cols[1]), hexc(cols[2]), r.randrange(999))
            x += r.randrange(14, 24)
        for xx in range(W):
            for y in range(base_y + 4, H):
                if cv.get(xx, y) == (0, 0, 0) or y > base_y + 8:
                    cv.set(xx, y, hexc(cols[0]))

    # Галявина в яру
    for y in range(150, H):
        for x in range(W):
            t = (y - 150) / (H - 150)
            c = mix(hexc('#13241c'), hexc('#1d3526'), t)
            if dith(x, y, 0.25 + 0.2 * math.sin(x / 11 + y / 5)):
                c = mix(c, hexc('#0c1912'), 0.5)
            cv.set(x, y, c)
    # Багаття й повстанці (знахідка: x≈60%, y≈78%)
    fx, fb = 230, 172
    cv.glow(fx, fb - 6, 70, hexc('#ff9a3c'), 0.55, 0.7)
    campfire(cv, fx, fb, 2)
    sheep = hexc('#2a1e18')
    for i, (px, py, h) in enumerate(((204, 178, 16), (256, 178, 16), (218, 186, 17), (244, 188, 17))):
        soldier(cv, px, py, h, hexc('#3d3a2c'), hexc('#24231a'), sheep, hexc('#e3a070'), hexc('#4a3424') if i % 2 else None, rim=hexc('#ffb05a'), facing=1 if px < fx else -1)
    # Чорний прапор із тризубом на держаку
    cv.vline(276, 128, 176, hexc('#4a3424'))
    for yy in range(14):
        for xx in range(22):
            cv.set(277 + xx, 129 + yy + (1 if (xx // 4) % 2 else 0), hexc('#0b0b0c'))
    for dx, dy in ((10, 4), (10, 5), (10, 6), (10, 7), (10, 8), (8, 5), (8, 6), (12, 5), (12, 6), (9, 8), (11, 8)):
        cv.set(277 + dx, 129 + dy, hexc('#c9a227'))
    # Коні біля дерева
    horse(cv, 316, 180, 16, hexc('#3a281c'), hexc('#24180f'), hexc('#120c08'), facing=-1)
    horse(cv, 340, 186, 16, hexc('#4a3424'), hexc('#2c1e14'), hexc('#120c08'), step=1, facing=-1)

    # Старий дуб на передньому плані (знахідка: x≈10%, y≈52%): кривий стовбур,
    # що розширюється до коренів, глибока кора, місячне світло на правому боці, дупло
    def trunk_cx(y: int) -> float:
        return 12 + 4 * math.sin(y / 23) - (y - 40) * 0.02

    for y in range(30, H):
        w = 16 + (y - 30) * 0.1 + max(0, y - (H - 22)) * 1.4
        left, right = trunk_cx(y) - w / 2, trunk_cx(y) + w / 2
        for x in range(max(0, int(left)), int(right) + 1):
            u = (x - left) / w
            c = hexc('#24180f')
            if (x + round(2.5 * math.sin(y / 6 + x * 0.7))) % 4 == 0:
                c = hexc('#140d08')  # борозни кори
            elif u > 0.55:
                c = hexc('#33241a')
            if u > 0.82:
                c = hexc('#4e5a6a') if dith(x, y, 0.55) else hexc('#3a3a40')  # місяць
                if (x + round(2.5 * math.sin(y / 6 + x * 0.7))) % 4 == 0:
                    c = hexc('#22202a')
            cv.set(x, y, c)
    # Дупло
    cv.ellipse(trunk_cx(118) + 1, 118, 3, 6, hexc('#07060a'))
    for k in range(-6, 7):
        cv.set(round(trunk_cx(118) + 4), 118 + k, hexc('#4e5a6a') if abs(k) < 5 else hexc('#33241a'))
    # Великі гілки, що йдуть у крону
    for (sx, sy, ex, ey, wd) in ((18, 60, 52, 22, 4), (10, 52, 2, 18, 3), (20, 78, 44, 60, 2)):
        for k in range(wd):
            cv.line(sx + k, sy, ex + k, ey, hexc('#24180f') if k < wd - 1 else hexc('#3a3a40'))
    oak_crown(cv, 18, 20, 30, hexc('#0a1822'), hexc('#12293a'), hexc('#2b4a64'), 5)
    oak_crown(cv, 60, 6, 22, hexc('#0a1822'), hexc('#12293a'), hexc('#2b4a64'), 6)
    oak_crown(cv, 380, 18, 26, hexc('#0a1822'), hexc('#12293a'), hexc('#2b4a64'), 7)
    # Папороть
    for fx0 in range(0, W, 9):
        if 180 < fx0 < 290:
            continue
        base = H - r.randrange(0, 6)
        for k in range(-5, 6):
            cv.line(fx0, base, fx0 + k * 2, base - 9 + abs(k), hexc('#1f3b2a') if k % 2 else hexc('#2d5238'))
    return cv


# ===========================================================================
# 4. Севастополь, листопад 1920: евакуація білих
# ===========================================================================
def scene_harbor() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 120, [hexc(c) for c in ('#140f26', '#2c1a3a', '#5c2438', '#a33d36', '#e0703e', '#f6a65a')])
    clouds(cv, 51, 20, 80, 7, hexc('#3a2034'), hexc('#ff9a5a'), hexc('#221426'))
    # Дим пожеж над містом
    for sx, seed in ((40, 1), (96, 2), (150, 3)):
        smoke(cv, sx, 96, 70, hexc('#2b1f2c'), seed, drift=0.5)

    # Місто на пагорбах
    hills = ridge(61, W, 100, [(14, 90), (5, 20)])
    for x in range(W):
        hills[x] = hills[x] if x < 190 else 118 - round((x - 190) * 0.04)
    cv.fill_below(hills, 122, lambda x, y, top: hexc('#3c2436') if y - top < 2 else hexc('#2a1a2a'))
    r = random.Random(4)
    for x in range(0, 186, 7):
        bw, bh = r.randint(5, 9), r.randint(5, 12)
        by = hills[x] + 6
        cv.rect(x, by - bh, bw, bh, hexc('#c9a08a') if r.random() < 0.6 else hexc('#a77f74'))
        cv.rect(x + bw - 2, by - bh, 2, bh, hexc('#7d5a58'))
        cv.rect(x - 1, by - bh - 1, bw + 2, 1, hexc('#6a3a36'))
        if r.random() < 0.5:
            cv.set(x + 2, by - bh + 3, hexc('#ffcf6b'))
    # Собор на пагорбі
    cv.rect(118, hills[120] - 16, 12, 18, hexc('#d8c0a8'))
    cv.ellipse(124, hills[120] - 18, 5, 5, hexc('#8aa0a0'))
    cv.vline(124, hills[120] - 28, hills[120] - 23, hexc('#f7c948'))

    # Море з відблисками заходу
    for y in range(120, H):
        t = (y - 120) / (H - 120)
        for x in range(W):
            c = mix(hexc('#3a2a44'), hexc('#0f1a2e'), t ** 0.6)
            ripple = math.sin(x / 6 + y * 1.7) + math.sin(x / 15 - y / 2)
            if ripple > 1.3:
                c = mix(c, hexc('#f08a4a'), 0.55 * (1 - t))
            elif ripple < -1.4:
                c = mix(c, hexc('#05080f'), 0.4)
            cv.set(x, y, c)
    # Графська пристань (знахідка: x≈16%, y≈50%)
    colonnade(cv, 40, 124, 44, 18, hexc('#e2cdb4'), hexc('#a4887a'), hexc('#3a2430'))

    # Кораблі
    steamer(cv, 300, 124, 70, hexc('#1a1a24'), hexc('#2b2b38'), hexc('#a89a96'), hexc('#6d6070'), hexc('#1a1a1a'), hexc('#c8c0b0'), hexc('#ffcf6b'), hexc('#4a3a48'), 11, crowd=hexc('#141018'))
    steamer(cv, 120, 128, 52, hexc('#22202c'), hexc('#34313f'), hexc('#9b8c8a'), hexc('#5e5062'), hexc('#1a1a1a'), hexc('#b03030'), hexc('#ffcf6b'), hexc('#3b2e3c'), 12, crowd=hexc('#141018'))
    # Головний пароплав із біженцями (знахідка: x≈66%, y≈48%)
    steamer(cv, 186, 150, 140, hexc('#141420'), hexc('#262636'), hexc('#c2b4ae'), hexc('#7a6c74'), hexc('#111111'), hexc('#e6dccb'), hexc('#ffd27a'), hexc('#3e3240'), 13, crowd=hexc('#0e0c14'))
    # Відображення корабля у воді
    for y in range(150, 170):
        for x in range(190, 320):
            src = cv.get(x, 300 - y)
            if (x + y) % 3 and src[0] < 60:
                cv.blend(x, y, src, 0.45)

    # Причал на передньому плані з натовпом
    for y in range(176, H):
        for x in range(0, 230 - (y - 176)):
            c = hexc('#5b4a4a') if (x // 8 + y // 4) % 2 else hexc('#4c3d40')
            if y == 176:
                c = hexc('#8a7470')
            cv.set(x, y, c)
    for x in range(8, 220, 26):
        cv.rect(x, 168, 3, 9, hexc('#2a2224'))  # кнехти / ліхтарі
    cv.rect(96, 150, 2, 27, hexc('#2a2224'))
    cv.glow(97, 150, 16, hexc('#ffcf6b'), 0.6)
    cv.rect(95, 148, 4, 3, hexc('#ffe7a0'))
    rr = random.Random(8)
    for k in range(60):
        px = rr.randrange(4, 210)
        py = rr.randrange(184, 214)
        hgt = rr.randint(12, 18)
        coat = rr.choice([hexc('#2c2430'), hexc('#3a2e2a'), hexc('#24283a'), hexc('#3d3a30')])
        hat = rr.choice([hexc('#1a1416'), hexc('#4a3a30'), hexc('#d8d0c0')])
        soldier(cv, px, py, hgt, coat, mix(coat, (0, 0, 0), 0.35), hat, hexc('#d9a37f'), None, step=k % 2, rim=hexc('#e08a5a'), facing=1)
    # Валіза біженця (знахідка: x≈33%, y≈80%)
    cv.rect(122, 170, 12, 8, hexc('#7a4a2a'))
    cv.rect(122, 170, 12, 1, hexc('#a06a3a'))
    cv.rect(126, 168, 4, 2, hexc('#3a2418'))
    cv.rect(128, 171, 1, 7, hexc('#c8a050'))
    # Шлюпка
    cv.poly([(250, 186), (296, 186), (290, 194), (256, 194)], hexc('#5a3a28'))
    for k in range(256, 292, 5):
        cv.vline(k, 180, 186, hexc('#1a1416'))
    # Чайки
    for gx, gy in ((210, 40), (226, 34), (250, 52), (336, 30)):
        cv.set(gx, gy, hexc('#f1e6d8'))
        cv.set(gx - 1, gy - 1, hexc('#f1e6d8'))
        cv.set(gx + 1, gy - 1, hexc('#f1e6d8'))
        cv.set(gx - 2, gy - 1, hexc('#f1e6d8'))
        cv.set(gx + 2, gy - 1, hexc('#f1e6d8'))
    return cv


# ===========================================================================
# 5. Сиваш, ніч на 8 листопада 1920: брід, туман, прожектори Перекопу
# ===========================================================================
def wader(cv: Canvas, x: int, water: int, h: int, coat, coat_d, hat, skin, rifle, water_c, foam) -> None:
    """Вояк, що бреде по пояс у воді."""
    soldier(cv, x, water + round(h * 0.45), h, coat, coat_d, hat, skin, rifle, rim=hexc('#9fb6d8'))
    for xx in range(x - h // 3, x + h // 3 + 1):
        for yy in range(water, water + round(h * 0.5)):
            cv.set(xx, yy, water_c)
    cv.hline(x - h // 3 - 1, x + h // 3 + 1, water, foam)


def scene_syvash() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 98, [hexc(c) for c in ('#03050d', '#0a1024', '#141c3a', '#202a4c')])
    cv.stars(71, 160, 80, [hexc('#e2e8f0'), hexc('#a5b4fc'), hexc('#fef9c3')])
    cv.glow(70, 34, 48, hexc('#7d93c8'), 0.4)
    # Серп місяця: освітлена частина диска поза «тіньовим» колом. Тінь не малюємо
    # чорною плямою — там лишається небо з ледь помітним попелястим світлом.
    for y in range(22, 47):
        for x in range(58, 83):
            inside = (x + 0.5 - 70) ** 2 + (y + 0.5 - 34) ** 2 <= 100
            shadow = (x + 0.5 - 74) ** 2 + (y + 0.5 - 31) ** 2 <= 84
            if inside and not shadow:
                edge = (x + 0.5 - 74) ** 2 + (y + 0.5 - 31) ** 2 <= 110
                cv.set(x, y, hexc('#d9d2b4') if edge else hexc('#f6f2de'))
            elif inside and shadow:
                cv.blend(x, y, hexc('#3a4a78'), 0.35)

    # Протилежний берег: Литовський півострів і Перекопський вал
    shore = ridge(81, W, 96, [(4, 60), (2, 10)])
    for x in range(250, 384):
        shore[x] = min(shore[x], 92 - (2 if (x // 6) % 2 else 0))
    cv.fill_below(shore, 100, lambda x, y, top: hexc('#0c1220'))
    # Прожектори (знахідка: x≈78%, y≈42%)
    for (ox, oy, ang, spread) in ((300, 90, 2.25, 0.07), (346, 90, 1.9, 0.06)):
        for d in range(4, 190):
            half = d * spread
            for k in range(-round(half), round(half) + 1):
                px = round(ox + math.cos(ang) * d - math.sin(ang) * k * 0.0)
                py = round(oy - math.sin(ang) * d + k * 0.0)
                bx = round(ox + math.cos(ang) * d + math.cos(ang + math.pi / 2) * k)
                by = round(oy - math.sin(ang) * d - math.sin(ang + math.pi / 2) * k)
                a = 0.32 * (1 - d / 190)
                if dith(bx, by, 0.7):
                    cv.blend(bx, by, hexc('#e8f0ff'), a)
        cv.rect(ox - 2, oy - 2, 4, 3, hexc('#fffbe6'))
        cv.glow(ox, oy, 10, hexc('#fffbe6'), 0.7)

    # Вода Сивашу: брижі-штрихи, мулисті мілини, місячна доріжка
    rr = random.Random(5)
    for y in range(98, H):
        t = (y - 98) / (H - 98)
        base_c = mix(hexc('#1b2846'), hexc('#0d1526'), t)
        hi = mix(base_c, hexc('#4a5d84'), 0.6)
        lo = mix(base_c, hexc('#060a14'), 0.5)
        mud = mix(base_c, hexc('#3b3528'), 0.55)
        dash = 3 + round(t * 6)
        for x in range(W):
            cv.set(x, y, base_c)
        x = rr.randrange(dash)
        while x < W:
            v = rr.random()
            c = hi if v < 0.18 else lo if v < 0.32 else mud if (v < 0.37 and t > 0.25) else None
            if c:
                for k in range(dash):
                    cv.set(x + k, y, c)
            x += dash + rr.randrange(dash * 2)
        # Місячна доріжка
        for x in range(60 - round(t * 14), 80 + round(t * 14)):
            if (y // 2) % 2 == 0 and rr.random() < 0.55 - t * 0.3:
                cv.set(x + round(math.sin(y / 2) * 3), y, hexc('#c9d4ec'))
    # Туман смугами
    for fy, a in ((100, 0.35), (112, 0.22), (128, 0.15)):
        for y in range(fy, fy + 8):
            for x in range(W):
                if dith(x, y, a + 0.15 * math.sin(x / 40 + fy)):
                    cv.blend(x, y, hexc('#a8b8d6'), 0.5)

    # Колона вбрід: далекі менші, ближчі більші
    coat, coat_d, hat, skin, rifle = hexc('#3a4250'), hexc('#262c38'), hexc('#1a1c22'), hexc('#b89a88'), hexc('#4a3a30')
    water_c = hexc('#1f2d4c')
    foam = hexc('#8aa2c8')
    for i, (wx, wy, wh) in enumerate(((330, 104, 7), (316, 106, 7), (300, 108, 8), (284, 111, 9), (266, 114, 10), (246, 118, 11), (226, 123, 12))):
        wader(cv, wx, wy, wh, coat, coat_d, hat, skin, rifle if i % 2 else None, water_c, foam)
    # Вершники-махновці
    for hx, hy, hh in ((176, 132, 15), (150, 140, 17)):
        horse(cv, hx, hy + 9, hh, hexc('#2a1e18'), hexc('#18110d'), hexc('#0b0706'), step=1)
        soldier(cv, hx + 1, hy, 12, hexc('#2c2a22'), hexc('#1c1a16'), hexc('#0e0c0a'), skin, None)
        for xx in range(hx - 12, hx + 12):
            for yy in range(hy + 4, hy + 10):
                if dith(xx, yy, 0.8):
                    cv.set(xx, yy, water_c)
        cv.hline(hx - 13, hx + 12, hy + 4, foam)
    # Провідник із жердиною (знахідка: x≈52%, y≈66%)
    wader(cv, 204, 146, 16, hexc('#5a4a38'), hexc('#3a2e22'), hexc('#2a2018'), skin, None, water_c, foam)
    cv.line(212, 128, 198, 160, hexc('#8a6a3a'))

    # Береговий мул із сольовою кіркою (сіль: x≈24%, y≈82%)
    edge = [168 + round(6 * math.sin(x / 19) + (x / 150) ** 3 * 40) for x in range(W)]
    for x in range(0, 170):
        for y in range(edge[x], H):
            c = hexc('#3b3528') if (x * 5 + y * 3) % 7 else hexc('#2c271e')
            if y - edge[x] < 2:
                c = hexc('#e6e2d4')
            elif rr.random() < 0.06:
                c = hexc('#f4f1e6')
            cv.set(x, y, c)
    for base_x in list(range(0, 60, 3)) + list(range(330, 384, 3)):
        hgt = rr.randrange(18, 46)
        lean = rr.choice([-1, 1]) * rr.random() * 0.3
        for k in range(hgt):
            cv.set(base_x + round(k * lean), H - k, hexc('#141a14') if k < hgt - 6 else hexc('#3a3424'))
        cv.rect(base_x + round(hgt * lean) - 1, H - hgt - 3, 2, 5, hexc('#4a3a26'))
    return cv


# ===========================================================================
# 6. Донбас, лютий 1919: бронепотяг під червоними прапорами
# ===========================================================================
def scene_armored() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 120, [hexc(c) for c in ('#2a2d3e', '#4a4a5e', '#7d6a78', '#b98a86', '#d9a98e')])
    clouds(cv, 91, 20, 70, 8, hexc('#5a5568'), hexc('#d8a28c'), hexc('#3a3a4c'))
    # Терикони (знахідка: x≈12%, y≈38%)
    for cx, h, w in ((46, 52, 54), (112, 38, 44), (370, 30, 40)):
        cv.poly([(cx - w, 122), (cx + w, 122), (cx + 3, 122 - h), (cx - 3, 122 - h)], shader=lambda x, y, cx=cx: hexc('#2b2730') if x < cx + 4 else hexc('#1d1a22'))
        for k in range(6):
            cv.set(cx - 2 + k, 122 - h, hexc('#6a5a62'))
    # Шахтний копер із колесами
    kx = 196
    cv.line(kx - 12, 120, kx, 70, hexc('#262230'))
    cv.line(kx + 12, 120, kx, 70, hexc('#262230'))
    cv.line(kx - 6, 95, kx + 6, 95, hexc('#262230'))
    for wx in (kx - 3, kx + 4):
        for a in range(0, 360, 20):
            cv.set(round(wx + math.cos(math.radians(a)) * 4), round(72 + math.sin(math.radians(a)) * 4), hexc('#262230'))
    # Заводські труби з димом
    for tx in (232, 246):
        cv.rect(tx, 70, 5, 52, hexc('#3a2a2c'))
        cv.rect(tx - 1, 70, 7, 2, hexc('#2a1e20'))
        smoke(cv, tx + 2, 68, 60, hexc('#5a5260'), tx, drift=-0.8)
    cv.haze(90, 124, hexc('#c09a90'), 0.3, 0.0)

    # Станція з червоними прапорами й плакатом (плакат: x≈82%, y≈52%)
    cv.rect(268, 96, 104, 32, hexc('#8a3a2e'))
    for yy in range(96, 128, 4):
        for xx in range(268 + (yy // 4 % 2) * 4, 372, 8):
            cv.rect(xx, yy, 1, 4, hexc('#6a2a22'))
    cv.poly([(262, 96), (378, 96), (366, 84), (274, 84)], hexc('#3a3a44'))
    cv.hline(262, 378, 84, hexc('#e8eefc'))
    for wx in range(276, 366, 16):
        cv.rect(wx, 104, 7, 10, hexc('#ffcf6b'))
        cv.vline(wx + 3, 104, 113, hexc('#6a2a22'))
    cv.rect(306, 104, 18, 18, hexc('#f0e6d0'))  # плакат
    cv.rect(306, 104, 18, 6, hexc('#c0262d'))
    cv.rect(310, 111, 10, 2, hexc('#1a1a1a'))
    cv.rect(312, 115, 6, 4, hexc('#c0262d'))
    for fx in (282, 356):
        cv.vline(fx, 66, 84, hexc('#3a2a22'))
        for yy in range(8):
            for xx in range(12):
                cv.set(fx + 1 + xx, 66 + yy + (1 if (xx // 3) % 2 else 0), hexc('#c0262d') if yy < 7 else hexc('#8a1a1e'))

    # Сніг і колії
    for y in range(124, H):
        for x in range(W):
            c = mix(hexc('#a7a9bd'), hexc('#d8dbe8'), (y - 124) / (H - 124))
            if dith(x, y, 0.25 + 0.2 * math.sin(x / 9 + y / 4)):
                c = mix(c, hexc('#8d8fa6'), 0.5)
            cv.set(x, y, c)
    for ry in (146, 196):
        for x in range(W):
            if x % 7 < 4:
                cv.rect(x, ry - 1, 1, 6, hexc('#5a4030'))
        cv.hline(0, W, ry, hexc('#3a3a44'))
        cv.hline(0, W, ry + 3, hexc('#3a3a44'))
        cv.hline(0, W, ry - 1, hexc('#9a9cae'))

    # Бронепотяг (знахідка: x≈42%, y≈58%)
    plate, plate_d, plate_l = hexc('#3f4a3c'), hexc('#2a3128'), hexc('#5c6a56')
    for i, (wx, ww, turret) in enumerate(((20, 74, True), (98, 60, False), (162, 72, True))):
        top = 112
        cv.rect(wx, top, ww, 30, plate)
        cv.rect(wx, top, ww, 3, plate_l)
        cv.rect(wx + ww - 6, top, 6, 30, plate_d)
        for rx in range(wx + 3, wx + ww - 2, 6):
            cv.set(rx, top + 5, plate_l)
            cv.set(rx, top + 24, plate_l)
        for sx in range(wx + 8, wx + ww - 8, 14):
            cv.rect(sx, top + 12, 5, 3, hexc('#121410'))  # бійниці
        if turret:
            cv.rect(wx + ww // 2 - 10, top - 12, 20, 12, plate)
            cv.rect(wx + ww // 2 - 10, top - 12, 20, 2, plate_l)
            cv.rect(wx + ww // 2 - 30, top - 8, 22, 3, plate_d)  # гармата
        for k in range(3):
            wheel(cv, wx + 10 + k * (ww - 20) // 2, 143, 4, hexc('#1a1a1a'), hexc('#3a3a3a'))
        cv.rect(wx + ww, top + 22, 4, 3, hexc('#1a1a1a'))  # зчіпка
    # Броньований паровоз: будка машиніста ззаду, кутастий бронекожух котла,
    # труба й сухопарник, броньований фартух над колесами, прожектор спереду
    rivet = hexc('#7a8a72')
    wheel_y = 143
    for k, wx in enumerate((246, 258, 270)):
        wheel(cv, wx, wheel_y, 5, hexc('#151515'), hexc('#8a1c1e'), k * 0.5)
    wheel(cv, 283, wheel_y + 2, 3, hexc('#151515'), hexc('#3a3a3a'))
    cv.line(246, wheel_y, 270, wheel_y, hexc('#9a9aa6'))  # дишло
    cv.poly([(250, 112), (279, 112), (289, 121), (289, 131), (250, 131)], shader=lambda x, y: plate_l if y < 114 else (plate_d if x > 284 or y > 128 else plate))
    cv.rect(263, 108, 6, 4, plate)  # сухопарник
    cv.rect(263, 108, 6, 1, plate_l)
    cv.rect(276, 101, 5, 11, hexc('#23281f'))  # труба
    cv.rect(275, 100, 7, 2, hexc('#171a14'))
    cv.rect(235, 98, 19, 2, plate_d)  # дах будки
    cv.rect(236, 100, 16, 31, plate)
    cv.rect(236, 100, 16, 2, plate_l)
    cv.rect(249, 100, 3, 31, plate_d)
    cv.rect(239, 105, 7, 3, hexc('#121410'))  # оглядова щілина
    cv.rect(234, 131, 56, 9, plate_d)  # фартух
    cv.rect(234, 131, 56, 1, plate_l)
    for rx in range(236, 289, 4):
        cv.set(rx, 133, rivet)
        cv.set(rx, 138, rivet)
    for rx in range(252, 286, 5):
        cv.set(rx, 116, rivet)
    cv.rect(289, 117, 2, 3, hexc('#ffe9a8'))  # прожектор
    cv.glow(291, 118, 8, hexc('#ffd27a'), 0.5)
    cv.rect(289, 136, 3, 2, hexc('#1a1a1a'))  # буфер
    smoke(cv, 278, 99, 50, hexc('#e4e2ea'), 4, drift=-1.1)
    # Червоний прапор і зірка на вагоні
    cv.vline(60, 80, 100, hexc('#2a1e1a'))
    for yy in range(9):
        for xx in range(16):
            cv.set(61 + xx, 80 + yy + (1 if (xx // 4) % 2 else 0), hexc('#c0262d'))
    star = ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##']
    for yy, row in enumerate(star):
        for xx, ch in enumerate(row):
            if ch == '#':
                cv.set(195 + xx, 122 + yy, hexc('#c0262d'))
    # Вартові в будьонівках
    for gx, gy in ((120, 168), (300, 172), (330, 178)):
        soldier(cv, gx, gy, 18, hexc('#5a5e48'), hexc('#3a3d2e'), hexc('#4a4e3a'), hexc('#d9a37f'), hexc('#4a3424'), budenovka=True, facing=-1 if gx > 200 else 1)
    snowfall(cv, 17, 120, hexc('#f1f5f9'), hexc('#cbd5e1'))
    return cv


# ===========================================================================
# 7. Камʼянець-Подільський, осінь 1919: фортеця над каньйоном Смотрича
# ===========================================================================
def round_tower(cv: Canvas, x: int, base: int, w: int, h: int, stone, stone_d, roof, roof_d) -> None:
    for yy in range(base - h, base):
        for xx in range(x - w // 2, x + w // 2 + 1):
            rel = (xx - (x - w // 2)) / w
            # Циліндр: світла смуга ліворуч від центру, темніші краї, тінь праворуч
            c = stone if 0.12 < rel < 0.55 else stone_d
            if rel <= 0.12:
                c = mix(stone, stone_d, 0.5)
            if rel > 0.85:
                c = mix(stone_d, (0, 0, 0), 0.15)
            # Кладка: шви через ряд зі зсувом
            if yy % 4 == 0 or (xx + (yy // 4) * 3) % 6 == 0:
                c = mix(c, (60, 50, 40), 0.18)
            cv.set(xx, yy, c)
    cv.poly([(x - w / 2 - 2, base - h), (x + w / 2 + 2, base - h), (x, base - h - w * 1.1)], shader=lambda xx, yy: roof if xx < x else roof_d)
    for k in range(2):
        cv.rect(x - 1, base - h + 5 + k * 9, 2, 3, hexc('#1a1410'))


def autumn_tree(cv: Canvas, x: int, base: int, r: int, seed: int) -> None:
    rr = random.Random(seed)
    cols = [hexc('#c2571a'), hexc('#e08a1e'), hexc('#f2b632'), hexc('#9a3a12')]
    cv.vline(x, base - r, base, hexc('#4a2e1a'))
    for _ in range(r * 7):
        a = rr.random() * math.tau
        d = rr.random() ** 0.6 * r
        px, py = round(x + math.cos(a) * d), round(base - r - 2 + math.sin(a) * d * 0.8)
        c = cols[0] if py > base - r else rr.choice(cols)
        cv.set(px, py, c)
        cv.set(px + 1, py, c)


def scene_kamianets() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 110, [hexc(c) for c in ('#2f6fb7', '#4f8fd0', '#86b8e6', '#c7def2')])
    clouds(cv, 101, 18, 60, 6, hexc('#f4f7fb'), hexc('#ffffff'), hexc('#c4d4e8'))
    far = ridge(111, W, 96, [(10, 80), (3, 15)])
    cv.fill_below(far, H, lambda x, y, top: hexc('#8a9a6a') if dith(x, y, 0.4) else hexc('#7a8a5c'))
    cv.haze(80, 110, hexc('#c7def2'), 0.5, 0.0)

    # Трава на плато з осінніми вкрапленнями
    for y in range(100, H):
        for x in range(W):
            c = hexc('#7d8a5a')
            if ((x * 7 + y * 11) % 13) == 0 or dith(x, y, 0.2 + 0.15 * math.sin(x / 9 + y / 4)):
                c = hexc('#6c7a4c')
            if ((x * 5 + y * 3) % 31) == 0:
                c = hexc('#c9a040')
            cv.set(x, y, c)

    # Каньйон Смотрича: тягнеться з-під Турецького мосту вниз ліворуч, ширшає ближче до нас.
    # Лівий схил у тіні, правий освітлений; скелі з вертикальними тріщинами й уступами.
    def river_x(y: float) -> float:
        return 120 - (y - 108) * 0.55 + 7 * math.sin(y / 19)

    rock_l = [hexc('#8a7a5e'), hexc('#74664e'), hexc('#5e523e')]  # тіньовий схил
    rock_r = [hexc('#d2c29c'), hexc('#bcaa84'), hexc('#a4926c')]  # освітлений схил
    noise = random.Random(73)
    crack = {x: noise.random() for x in range(-40, W + 40)}
    for y in range(106, H):
        rx = river_x(y)
        river_hw = 3 + (y - 106) / 16
        wall_hw = 12 + (y - 106) * 0.42
        lip_l = rx - wall_hw + 3 * math.sin(y / 7)
        lip_r = rx + wall_hw + 3 * math.sin(y / 9 + 1)
        for x in range(max(0, int(lip_l) - 1), min(W, int(lip_r) + 2)):
            if abs(x - rx) < river_hw:
                c = hexc('#2f6c7c') if (x + y // 2) % 9 else hexc('#7ab8c4')
                if abs(x - rx) > river_hw - 1:
                    c = hexc('#21505c')  # темна смуга біля берега
                cv.set(x, y, c)
                continue
            if x < rx:
                depth = (x - lip_l) / max(1, (rx - river_hw) - lip_l)  # 0 біля краю, 1 біля води
                ramp = rock_l
            else:
                depth = ((rx + river_hw) - x) / max(1, (rx + river_hw) - lip_r) if lip_r != rx + river_hw else 0
                depth = 1 - (x - (rx + river_hw)) / max(1, lip_r - (rx + river_hw))
                ramp = rock_r
            if x < lip_l or x > lip_r:
                continue
            i = 0 if depth < 0.4 else (1 if depth < 0.75 else 2)
            c = ramp[i]
            if dith(x, y, (depth * 3) % 1) and i < 2:
                c = ramp[i + 1]
            if crack[x] < 0.18 and (y + x) % 5:
                c = mix(c, hexc('#3a3028'), 0.45)  # вертикальні тріщини
            if (y + round(crack[x] * 9)) % 11 == 0:
                c = mix(c, hexc('#f0e6c8'), 0.35)  # уступи
            cv.set(x, y, c)
        # Трав'яний край урвища
        for lx in (round(lip_l) - 1, round(lip_r) + 1):
            cv.set(lx, y, hexc('#4f5e36'))

    # Скельне плато з фортецею: прямовисна скеля під мурами, освітлена зліва
    plateau = 118
    for x in range(132, W):
        cliff_bottom = plateau + 16 + round(5 * math.sin(x / 11)) + round(3 * math.sin(x / 4.3))
        top = plateau - round(3 * math.sin(x / 13))
        for y in range(top, cliff_bottom):
            t = (y - top) / max(1, cliff_bottom - top)
            c = rock_r[0] if t < 0.3 else (rock_r[1] if t < 0.7 else rock_r[2])
            if dith(x, y, (t * 3) % 1) and t < 0.7:
                c = rock_r[1] if t < 0.3 else rock_r[2]
            if crack[x % W] < 0.2:
                c = mix(c, hexc('#3a3028'), 0.4)
            if x > 300:
                c = mix(c, hexc('#5e523e'), 0.25)
            cv.set(x, y, c)
        cv.set(x, cliff_bottom, hexc('#4f5e36'))
    stone, stone_d = hexc('#d9cdb2'), hexc('#a89a80')
    roof, roof_d = hexc('#9a3a22'), hexc('#6a2416')
    cv.rect(140, 96, 190, 22, stone)
    for k in range(140, 330, 5):
        cv.rect(k, 93, 3, 3, stone)
    cv.rect(270, 96, 60, 22, stone_d)
    for (tx, tw, th) in ((146, 16, 34), (215, 22, 56), (262, 18, 40), (318, 16, 30)):
        round_tower(cv, tx, 118, tw, th, stone, stone_d, roof, roof_d)
    # Прапор УНР на головній вежі (знахідка: x≈56%, y≈32%)
    cv.vline(215, 26, 40, hexc('#3a2a22'))
    for yy in range(8):
        for xx in range(14):
            cv.set(216 + xx, 26 + yy + (1 if (xx // 3) % 2 else 0), UA_BLUE if yy < 4 else UA_YELLOW)
    # Турецький міст через каньйон: проїзд угорі, арки з глибокою тінню під ними
    for x in range(98, 142):
        cv.rect(x, 112, 1, 7, stone_d if x > 128 else stone)
        cv.set(x, 111, stone)
        cv.set(x, 110, stone_d if x % 3 == 0 else stone)  # парапет
    for ax in (106, 120, 134):
        for yy in range(114, 119):
            for xx in range(ax - 4, ax + 5):
                if (xx - ax) ** 2 / 16 + (yy - 119) ** 2 / 25 <= 1:
                    cv.set(xx, yy, hexc('#2a241c') if yy > 115 else hexc('#3e3428'))
    # Осінні дерева на схилах
    for i, (ax, ab, ar) in enumerate(((20, 128, 10), (40, 140, 12), (112, 150, 9), (150, 138, 8), (350, 150, 12), (372, 138, 10), (330, 160, 14), (10, 170, 16))):
        autumn_tree(cv, ax, ab, ar, i)
    # Передній план: стежка до брами й скриня з гривнями (знахідка: x≈82%, y≈74%)
    path = [(334, 216), (318, 196), (292, 176), (252, 156), (206, 142), (168, 134)]
    for (ax, ay), (bx, by) in zip(path, path[1:]):
        steps = max(abs(bx - ax), abs(by - ay))
        for k in range(steps):
            t = k / steps
            px, py = ax + (bx - ax) * t, ay + (by - ay) * t
            half = 2 + (py - 130) / 9
            for xx in range(round(px - half), round(px + half) + 1):
                edge = abs(xx - px) > half - 1.2
                c = hexc('#9a8458') if dith(xx, round(py), 0.45) else hexc('#86714a')
                if edge:
                    c = hexc('#6a5a3a')
                cv.set(xx, round(py), c)
    cv.rect(304, 156, 24, 14, hexc('#7a4e2a'))
    cv.rect(304, 156, 24, 2, hexc('#a06a3a'))
    for k in range(3):
        cv.rect(307 + k * 6, 152 - k, 8, 4, hexc('#6fa86a') if k % 2 else hexc('#8ab8d8'))
        cv.rect(309 + k * 6, 153 - k, 3, 1, hexc('#2a4a2a'))
    soldier(cv, 290, 182, 22, hexc('#4a5240'), hexc('#2f3529'), hexc('#2a2220'), hexc('#d9a37f'), None, rim=hexc('#f2d0a0'))
    soldier(cv, 350, 186, 22, hexc('#2c3446'), hexc('#1c2230'), hexc('#3a2a22'), hexc('#d9a37f'), None, facing=-1, rim=hexc('#f2d0a0'))
    return cv


# ===========================================================================
# 8. Замостя, серпень 1920: мури фортеці й курява кінноти на обрії
# ===========================================================================
def scene_fortress() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 104, [hexc(c) for c in ('#5b8fcf', '#8eb6e0', '#cfe0ea', '#f2e6c4')])
    clouds(cv, 121, 14, 50, 5, hexc('#f8fafc'), hexc('#ffffff'), hexc('#c8d6e6'))
    # Ратуша й кольорові кам'яниці Замостя
    town_base = 98
    r = random.Random(12)
    x = 20
    cols = ['#d9a34a', '#c8705a', '#7aa0b8', '#e2c97a', '#a8c28a', '#d98a8a']
    while x < 230:
        w = r.randint(10, 16)
        h = r.randint(14, 22)
        c = hexc(r.choice(cols))
        cv.rect(x, town_base - h, w, h, c)
        cv.rect(x, town_base - h - 3, w, 3, hexc('#8a4a32'))
        for k in range(x + 1, x + w - 1, 4):
            cv.set(k, town_base - h - 4, hexc('#8a4a32'))  # аттик
            cv.rect(k, town_base - h + 4, 2, 3, hexc('#3a2a30'))
        x += w
    # Ратуша з високою вежею
    cv.rect(120, 50, 12, 50, hexc('#e8d8b8'))
    cv.rect(128, 50, 4, 50, hexc('#b8a888'))
    cv.poly([(118, 50), (134, 50), (126, 34)], hexc('#5a6a4a'))
    cv.vline(126, 28, 34, hexc('#3a3a2a'))
    cv.rect(108, 74, 36, 26, hexc('#f0e4c8'))
    for k in range(110, 142, 6):
        cv.rect(k, 80, 3, 6, hexc('#3a2a30'))
    cv.haze(60, 100, hexc('#f2e6c4'), 0.35, 0.0)

    # Поля пшениці праворуч і курява кінноти на обрії (x≈85%, y≈40%):
    # борозни в перспективі (далі густіші), світліше вдалині, колоски-зернятка ближче
    grain = random.Random(44)
    for y in range(92, H):
        t = (y - 92) / (H - 92)
        far_c = mix(hexc('#e6d6a0'), hexc('#d8b24c'), min(1, t * 2.2))
        furrow = mix(far_c, hexc('#a8822e'), 0.45)
        row = int((t ** 0.6) * 26)
        prev_row = int((max(0, (y - 1 - 92)) / (H - 92)) ** 0.6 * 26)
        for xx in range(200, W):
            c = far_c
            if row != prev_row:
                c = furrow
            elif dith(xx, y, 0.15 + 0.25 * t):
                c = mix(far_c, hexc('#c09a3a'), 0.5)
            if t > 0.2 and grain.random() < 0.05 * t:
                c = hexc('#f4e2a0')
            cv.set(xx, y, c)
    for (dx, dy, dl) in ((326, 88, 70), (300, 92, 40), (360, 90, 40)):
        for k in range(dl):
            for j in range(1 + k // 6):
                if dith(dx + k, dy - j, 0.6 - k / dl * 0.5):
                    cv.blend(dx + k, dy - j, hexc('#c9b48a'), 0.8)
    for k in range(14):
        hx = 300 + k * 5
        cv.rect(hx, 90 - (k % 2), 3, 2, hexc('#3a2a22'))
        cv.set(hx + 1, 88 - (k % 2), hexc('#2a1e18'))

    # Цегляні мури з бастіоном (x≈30%, y≈60%)
    brick, brick_d, brick_l, mortar = hexc('#a4482e'), hexc('#7a3220'), hexc('#c8664a'), hexc('#6a2a1c')

    def bricks(x: int, y: int, shade: float = 0.0):
        row = y // 3
        if y % 3 == 2 or (x + (row % 2) * 3) % 6 == 5:
            c = mortar
        else:
            c = brick_l if ((x + row * 7) * 13) % 23 == 0 else brick
        return mix(c, (20, 8, 6), shade)

    wall_top = 104
    # Рів із водою під мурами (спершу вода, потім бастіон, що стоїть у ній)
    for y in range(146, 186):
        for x in range(0, 250):
            if y >= 168 and abs(x - 115) / 72 + (y - 168) / 18 > 1:
                continue  # рів огинає наконечник бастіону
            cv.set(x, y, hexc('#4a6a6a') if (x // 5 + y) % 4 else hexc('#7a9a92'))
    cv.poly([(0, wall_top), (232, wall_top), (242, 150), (0, 150)], shader=lambda x, y: bricks(x, y, 0.05 if x < 226 else 0.3))
    # Бастіон-«наконечник», що виступає вперед: ліва грань на сонці, права в тіні,
    # зверху земляний вал із парапетом
    cv.poly([(62, 116), (115, 126), (115, 180), (56, 162)], shader=lambda x, y: bricks(x, y))
    cv.poly([(115, 126), (168, 116), (174, 162), (115, 180)], shader=lambda x, y: bricks(x, y, 0.38))
    cv.poly([(66, 104), (162, 104), (168, 116), (115, 126), (62, 116)], hexc('#7d7a4e'))
    for k in range(66, 162, 3):
        cv.set(k, 104 + (k % 2), hexc('#6a683e'))
    cv.line(62, 116, 115, 126, brick_l)
    cv.line(115, 126, 168, 116, hexc('#8a3a24'))
    cv.line(62, 115, 115, 125, brick_l)
    cv.line(115, 125, 168, 115, hexc('#8a3a24'))
    cv.vline(115, 126, 180, hexc('#5a2418'))  # ребро бастіону
    for k in range(0, 230, 12):
        cv.rect(k, wall_top - 6, 8, 6, brick)
        cv.rect(k, wall_top - 6, 8, 1, brick_l)
    for ex, ey in ((80, 136), (100, 140), (128, 140), (150, 136)):
        cv.rect(ex, ey, 5, 3, hexc('#1a0e0a'))  # амбразури
    # Прапори УНР і Польщі
    for fx, c1, c2 in ((96, UA_BLUE, UA_YELLOW), (140, hexc('#f4f4f4'), hexc('#d01c2a'))):
        cv.vline(fx, 70, 112, hexc('#3a2a22'))
        for yy in range(10):
            for xx in range(16):
                cv.set(fx + 1 + xx, 70 + yy + (1 if (xx // 4) % 2 else 0), c1 if yy < 5 else c2)
    # Гармата на бастіоні
    cv.rect(116, 104, 18, 4, hexc('#2a2a2a'))
    cv.rect(108, 103, 10, 2, hexc('#3a3a3a'))
    wheel(cv, 126, 110, 4, hexc('#3a2a1a'), hexc('#6a4a2a'))

    # Окоп із мішками й польовий телефон (x≈62%, y≈76%)
    for y in range(150, H):
        for x in range(W):
            if x < 250 and y < 168:
                continue
            if 40 <= x <= 190 and y < 186 and cv.get(x, y) != (0, 0, 0):
                continue  # бастіон і вода рову навколо нього
            c = hexc('#8a7a4a') if dith(x, y, 0.4 + 0.2 * math.sin(x / 7)) else hexc('#7a6a3e')
            if ((x * 7 + y * 13) % 29) == 0:
                c = hexc('#a8984e')
            cv.set(x, y, c)
    for k in range(170, 384, 10):
        cv.ellipse(k, 168 + (k // 10 % 2), 6, 4, shader=lambda x, y: hexc('#c8b48a') if y < 168 else hexc('#a8946a'))
    cv.rect(232, 160, 12, 9, hexc('#4a5a3a'))
    cv.rect(232, 160, 12, 2, hexc('#6a7a5a'))
    cv.rect(235, 157, 6, 3, hexc('#1a1a1a'))
    for k in range(60):
        cv.set(244 + k, 166 + round(3 * math.sin(k / 6)), hexc('#1a1a1a'))
    for sx, facing in ((200, 1), (270, -1), (300, -1)):
        soldier(cv, sx, 188, 22, hexc('#5a6a48'), hexc('#3a4630'), hexc('#4a5a3a'), hexc('#d9a37f'), hexc('#4a3424'), facing=facing, rim=hexc('#f2e6a0'))
    return cv


# ===========================================================================
# 9. Поле памʼяті під Базаром: хрест, лампадки, берези, журавлі
# ===========================================================================
def scene_memorial() -> Canvas:
    cv = Canvas()
    cv.vgrad(0, 132, [hexc(c) for c in ('#1a1838', '#33284e', '#5a3a5e', '#9a5a66', '#d68a6a', '#f2b27a')])
    cv.stars(131, 70, 50, [hexc('#e2e8f0'), hexc('#fef3c7')])
    clouds(cv, 131, 40, 100, 6, hexc('#4a3456'), hexc('#e8987a'), hexc('#2c2240'))
    # Ключ журавлів
    for i in range(9):
        side = 1 if i % 2 else -1
        k = (i + 1) // 2
        bx, by = 120 + k * 9, 46 + k * 5 * side * 0 + k * 4
        by = 46 + k * 4
        bx = 120 + k * 8 * side + (k * 6)
        cv.set(bx, by, hexc('#1a1424'))
        cv.set(bx - 1, by - 1, hexc('#1a1424'))
        cv.set(bx + 1, by - 1, hexc('#1a1424'))
        cv.set(bx - 2, by - 1, hexc('#1a1424'))
        cv.set(bx + 2, by - 1, hexc('#1a1424'))
    # Далеке село з церквою
    far = ridge(141, W, 128, [(5, 70), (2, 12)])
    cv.fill_below(far, H, lambda x, y, top: hexc('#3a2a44'))
    for hx in (40, 58, 80, 300, 322, 350):
        cv.rect(hx, far[hx] - 6, 10, 6, hexc('#2c2036'))
        cv.poly([(hx - 2, far[hx] - 6), (hx + 12, far[hx] - 6), (hx + 5, far[hx] - 11)], hexc('#241a2e'))
        cv.set(hx + 4, far[hx] - 3, hexc('#ffcf6b'))
    church(cv, 70, far[70] - 2, 2, hexc('#2c2036'), hexc('#241a2e'), hexc('#2c2036'), hexc('#241a2e'), hexc('#c9a24c'))

    # Поле: суха трава й латки першого снігу
    rr = random.Random(9)
    for y in range(132, H):
        t = (y - 132) / (H - 132)
        for x in range(W):
            c = mix(hexc('#5a4a4a'), hexc('#7a6448'), t)
            if rr.random() < 0.12:
                c = mix(c, hexc('#a88a60'), 0.6)
            n = math.sin(x / 21 + y / 6) + math.sin(x / 9 - y / 13) + math.sin(x / 4.3 + y / 2.1) * 0.6
            if n > 1.5 or (n > 1.15 and dith(x, y, (n - 1.15) * 2.5)):
                c = mix(hexc('#c8c4d8'), hexc('#ece8f4'), t)
            cv.set(x, y, c)
    # Берези праворуч (знахідка: x≈80%, y≈50%)
    for bx, bh in ((296, 120), (312, 104), (330, 130), (352, 96)):
        for y in range(H - bh, H - 30 + (bx % 7)):
            for k in range(3):
                c = hexc('#f2eee6') if k < 2 else hexc('#b8b0a8')
                if (y * 7 + bx) % 9 == 0 and k < 2:
                    c = hexc('#1a1414')
                cv.set(bx + k, y, c)
        bare_tree(cv, bx + 1, H - bh + 20, bh * 0.9, hexc('#3a2a2e'), bx, 0.5)
    # Памʼятний хрест на кургані
    # Курган: опуклий горбок, освітлений заходом ліворуч, з сухою травою й латками снігу
    def mound(x, y):
        nx, ny = (x - 192) / 70, (y - 176) / 14
        lit = -nx * 0.7 - ny * 0.9
        c = hexc('#7a6a52') if lit > 0.35 else (hexc('#6a5a4a') if lit > -0.1 else hexc('#55473a'))
        if 0.2 < lit < 0.5 and dith(x, y, 0.5):
            c = hexc('#6a5a4a')
        if ny < -0.75:
            c = hexc('#8a7a5c')  # гребінь
        if ((x * 7 + y * 13) % 17) == 0:
            c = hexc('#a08e62')  # сухі стеблини
        if ny < -0.3 and -0.6 < nx < -0.2 and dith(x, y, 0.6):
            c = hexc('#e6e4ee')  # латка снігу
        return c
    cv.ellipse(192, 176, 70, 14, shader=mound)
    for x in range(124, 261):
        yb = round(176 + 14 * math.sqrt(max(0, 1 - ((x - 192) / 70) ** 2)))
        cv.set(x, yb, hexc('#3e3328'))  # тінь біля підніжжя
    stone, stone_d, stone_l = hexc('#8a8478'), hexc('#5e5a52'), hexc('#b8b0a0')
    cv.rect(178, 150, 28, 18, stone)  # постамент
    cv.rect(178, 150, 28, 2, stone_l)
    cv.rect(198, 150, 8, 18, stone_d)
    cv.rect(188, 56, 8, 96, stone)  # хрест
    cv.rect(194, 56, 2, 96, stone_d)
    cv.rect(188, 56, 2, 96, stone_l)
    cv.rect(170, 78, 44, 8, stone)
    cv.rect(170, 78, 44, 2, stone_l)
    cv.rect(170, 84, 44, 2, stone_d)
    # Напис-риски на постаменті
    for k in range(4):
        cv.hline(182, 200 - (k % 2) * 4, 154 + k * 3, stone_d)
    cv.glow(192, 70, 40, hexc('#ffd8a0'), 0.18)
    # Лампадки (знахідка: x≈50%, y≈74%)
    for lx in (176, 184, 200, 208):
        cv.rect(lx, 164, 3, 4, hexc('#c0262d'))
        cv.set(lx + 1, 162, hexc('#fff0b0'))
        cv.set(lx + 1, 161, hexc('#ffb84a'))
        cv.glow(lx + 1, 162, 9, hexc('#ffb84a'), 0.5)
    # Вінок із синьо-жовтою стрічкою (знахідка: x≈36%, y≈76%)
    cx, cy = 140, 164
    for a in range(0, 360, 8):
        for rad in (6, 7):
            px = round(cx + math.cos(math.radians(a)) * rad)
            py = round(cy + math.sin(math.radians(a)) * rad * 0.8)
            cv.set(px, py, hexc('#2f5a2a') if (a // 8) % 3 else hexc('#c0262d'))
    for k in range(8):
        cv.set(cx - 2 + (k // 4), cy + 6 + k, UA_BLUE)
        cv.set(cx + 2 - (k // 4), cy + 6 + k, UA_YELLOW)
    # Колоски на передньому плані
    for x in range(0, W, 4):
        if 150 < x < 240:
            continue
        hgt = rr.randrange(8, 20)
        for k in range(hgt):
            cv.set(x + round(k * 0.2), H - k, hexc('#3a2e2a') if k < hgt - 4 else hexc('#c8a86a'))
    return cv


SCENES = {
    'winter': scene_winter,
    'steppe': scene_steppe,
    'forest': scene_forest,
    'harbor': scene_harbor,
    'syvash': scene_syvash,
    'armored': scene_armored,
    'kamianets': scene_kamianets,
    'fortress': scene_fortress,
    'memorial': scene_memorial,
}


def main(argv: list[str]) -> None:
    preview = None
    if '--preview' in argv:
        i = argv.index('--preview')
        preview = argv[i + 1]
        argv = argv[:i] + argv[i + 2 :]
    names = argv or list(SCENES)
    os.makedirs(OUT, exist_ok=True)
    for name in names:
        cv = SCENES[name]()
        assert cv.img.size == (W, H)
        path = os.path.join(OUT, f'{name}.png')
        cv.save(path)
        print('saved', os.path.relpath(path), os.path.getsize(path), 'bytes')
        if preview:
            os.makedirs(preview, exist_ok=True)
            cv.img.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(preview, f'{name}.png'))


if __name__ == '__main__':
    main(sys.argv[1:])
