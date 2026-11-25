"""Процедурні піксельні фігурки: вояки, коні, сани, хати, церкви, дим, хмари."""

from __future__ import annotations

import math
import random

from pxlib import Canvas, Color, dith, mix


def soldier(
    cv: Canvas,
    x: int,
    base: int,
    h: int,
    coat: Color,
    coat_dark: Color,
    hat: Color,
    skin: Color,
    rifle: Color | None = None,
    step: int = 0,
    rim: Color | None = None,
    facing: int = 1,
    pack: Color | None = None,
    flag: tuple[Color, Color] | None = None,
    budenovka: bool = False,
) -> None:
    """Вояк у шинелі й папасі (або будьонівці), що крокує вбік facing."""
    hs = max(2, round(h / 6.5))
    shoulder = base - round(h * 0.78)
    hem = base - round(h * 0.2)
    top_w = max(3, round(h * 0.26))
    bot_w = max(4, round(h * 0.4))
    # Ноги
    leg_h = base - hem
    for i, off in enumerate((-1, 1)):
        lx = x + off * max(1, bot_w // 4) + (step if i == 0 else -step) * facing
        cv.rect(lx, hem, max(1, h // 12), leg_h, coat_dark)
        cv.rect(lx - (1 if facing < 0 else 0), base - 1, max(2, h // 8), 1, (20, 16, 14))
    # Шинель — трапеція
    for yy in range(shoulder, hem + 1):
        t = (yy - shoulder) / max(1, hem - shoulder)
        w = round(top_w + (bot_w - top_w) * t)
        for xx in range(-w // 2, w - w // 2):
            c = coat if xx * facing < 0 or xx * facing < w * 0.15 else coat_dark
            if rim and xx * facing == (w - w // 2 - 1 if facing > 0 else -(w // 2)) and yy < hem - 1:
                c = rim
            cv.set(x + xx, yy, c)
    # Пасок
    belt_y = shoulder + round((hem - shoulder) * 0.42)
    for xx in range(-top_w // 2 - 1, top_w - top_w // 2 + 1):
        cv.set(x + xx, belt_y, (40, 30, 22))
    # Наплічник
    if pack:
        cv.rect(x - facing * (top_w // 2 + 1) - (1 if facing > 0 else 0), shoulder + 1, max(2, h // 8), max(3, h // 5), pack)
    # Голова й шапка
    hx = x - hs // 2 + (1 if facing > 0 else 0)
    hy = shoulder - hs
    cv.rect(hx, hy, hs, hs, skin)
    if budenovka:
        cv.rect(hx - 1, hy - max(1, hs // 2), hs + 2, max(2, hs // 2 + 1), hat)
        cv.set(hx + hs // 2, hy - max(1, hs // 2) - 1, hat)
        cv.set(hx + hs // 2, hy - max(1, hs // 2), (200, 30, 30))
    else:
        ph = max(2, round(hs * 0.9))
        cv.rect(hx - 1, hy - ph + 1, hs + 2, ph, hat)
    # Гвинтівка на плечі з багнетом
    if rifle:
        rx = x - facing * (top_w // 2)
        length = round(h * 0.55)
        for i in range(length):
            px = rx - facing * round(i * 0.35)
            py = shoulder + 2 - i
            cv.set(px, py, rifle if i < length - 3 else (170, 178, 190))
    # Прапор
    if flag:
        px = x + facing * (top_w // 2 + 1)
        top = shoulder - round(h * 0.75)
        cv.vline(px, top, shoulder + 3, (90, 62, 40))
        fw, fh = max(5, h // 2), max(3, h // 4)
        for yy in range(fh):
            for xx in range(fw):
                wave = 1 if (xx // 2) % 2 == 0 else 0
                cv.set(px + facing * (xx + 1), top + yy + wave, flag[0] if yy < fh / 2 else flag[1])


def horse(cv: Canvas, x: int, base: int, h: int, body: Color, dark: Color, mane: Color, step: int = 0, facing: int = 1) -> None:
    """Кінь збоку: тулуб-еліпс, шия, голова, ноги в кроці."""
    bl = round(h * 1.25)
    by = base - round(h * 0.55)
    cv.ellipse(x, by, bl / 2, h * 0.2, shader=lambda xx, yy: body if yy < by + 1 else dark)
    # Ноги
    leg_top = by + round(h * 0.12)
    for i, off in enumerate((-0.38, -0.22, 0.25, 0.4)):
        lx = x + round(off * bl) * facing + (step if i % 2 else -step) * facing
        cv.vline(lx, leg_top, base - 1, dark if i % 2 else body)
        cv.set(lx, base - 1, (25, 20, 18))
    # Шия й голова
    nx = x + facing * round(bl * 0.42)
    for i in range(round(h * 0.42)):
        cv.set(nx + facing * round(i * 0.45), by - i, body)
        cv.set(nx + facing * round(i * 0.45) - facing, by - i, mane if i > 1 else body)
        cv.set(nx + facing * round(i * 0.45) + facing, by - i + 1, body)
    hx = nx + facing * round(h * 0.2)
    hy = by - round(h * 0.42)
    cv.rect(hx - (0 if facing > 0 else 2), hy, 3, 2, body)
    cv.set(hx + facing * 3, hy + 1, dark)
    cv.set(hx, hy - 1, dark)  # вухо
    # Хвіст
    tx = x - facing * round(bl / 2)
    for i in range(round(h * 0.35)):
        cv.set(tx - facing * (i // 3), by - 1 + i, mane)


def sled(cv: Canvas, x: int, base: int, w: int, wood: Color, wood_dark: Color, cargo: Color, cargo_dark: Color) -> None:
    """Сани з пораненими під ковдрою."""
    cv.hline(x, x + w, base - 1, wood_dark)
    cv.set(x + w + 1, base - 2, wood_dark)
    cv.set(x + w + 2, base - 3, wood_dark)
    for i in range(0, w, 4):
        cv.vline(x + i, base - 3, base - 1, wood_dark)
    cv.rect(x, base - 5, w + 1, 2, wood)
    cv.ellipse(x + w / 2, base - 6, w / 2.2, 2.6, shader=lambda xx, yy: cargo if (xx + yy) % 5 else cargo_dark)


def hut(cv: Canvas, x: int, base: int, w: int, h: int, wall: Color, wall_dark: Color, roof: Color, roof_dark: Color, window: Color | None, snow: Color | None = None, door: Color | None = None) -> list[tuple[int, int]]:
    """Українська хата-мазанка з солом’яною стріхою. Повертає координати вікон."""
    wall_h = round(h * 0.45)
    cv.rect(x, base - wall_h, w, wall_h, wall)
    cv.rect(x + w - max(2, w // 6), base - wall_h, max(2, w // 6), wall_h, wall_dark)
    cv.hline(x, x + w - 1, base - 1, wall_dark)
    # Стріха: чотирисхилий дах
    roof_h = h - wall_h
    over = max(2, w // 8)
    for yy in range(roof_h):
        t = yy / max(1, roof_h - 1)
        inset = round((1 - t) * (w * 0.32))
        for xx in range(x - over + inset, x + w + over - inset):
            c = roof if xx < x + w * 0.62 else roof_dark
            if snow and yy < roof_h - 2 and (xx + yy) % 4 != 0:
                c = snow if xx < x + w * 0.62 else mix(snow, roof_dark, 0.35)
            cv.set(xx, base - wall_h - roof_h + yy, c)
    windows = []
    if window:
        ww = max(2, w // 6)
        for i in range(2 if w > 14 else 1):
            wx = x + round(w * (0.22 + i * 0.4))
            wy = base - wall_h + round(wall_h * 0.3)
            cv.rect(wx, wy, ww, ww, window)
            cv.vline(wx + ww // 2, wy, wy + ww - 1, mix(window, wall_dark, 0.6))
            windows.append((wx + ww // 2, wy + ww // 2))
    if door:
        cv.rect(x + w - max(2, w // 6) - 3, base - round(wall_h * 0.75), 2, round(wall_h * 0.75), door)
    return windows


def church(cv: Canvas, x: int, base: int, s: int, wall: Color, wall_dark: Color, dome: Color, dome_dark: Color, cross: Color) -> None:
    """Дерев’яна церква з трьома банями (s — масштаб)."""
    cv.rect(x - s * 3, base - s * 3, s * 6, s * 3, wall)
    cv.rect(x + s, base - s * 3, s * 2, s * 3, wall_dark)
    cv.rect(x - s, base - s * 5, s * 2, s * 2, wall)
    for cx, cy, r in ((x, base - s * 5, s * 1.3), (x - s * 2.4, base - s * 3, s * 0.9), (x + s * 2.4, base - s * 3, s * 0.9)):
        cv.ellipse(cx, cy - r * 0.6, r, r, shader=lambda xx, yy, cx=cx: dome if xx < cx else dome_dark)
        top = round(cy - r * 1.7)
        cv.vline(round(cx), top - s, top, cross)
        cv.hline(round(cx) - 1, round(cx) + 1, top - s + 1, cross)


def smoke(cv: Canvas, x: int, y: int, length: int, c: Color, seed: int, drift: float = 0.35) -> None:
    r = random.Random(seed)
    for i in range(length):
        a = 0.75 * (1 - i / length)
        px = x + round(i * drift + math.sin(i / 3 + seed) * 1.5)
        rad = 1 + i // 6
        for dx in range(-rad, rad + 1):
            if r.random() < 0.85:
                cv.blend(px + dx, y - i, c, a)


def clouds(cv: Canvas, seed: int, y0: int, y1: int, count: int, body: Color, light: Color, shade: Color) -> None:
    """Пласкі піксельні хмари з підсвіченим низом."""
    r = random.Random(seed)
    for _ in range(count):
        cx = r.randrange(-20, cv.w + 20)
        cy = r.randrange(y0, y1)
        length = r.randrange(40, 120)
        th = r.randrange(4, 11)
        for i in range(length):
            hh = round(th * math.sin(math.pi * i / length) + r.random())
            for yy in range(hh):
                c = body
                if yy == hh - 1:
                    c = light
                elif yy == 0:
                    c = shade
                if dith(cx + i, cy - yy, 0.85):
                    cv.set(cx + i, cy - yy, c)


def snowfall(cv: Canvas, seed: int, count: int, c: Color, c2: Color) -> None:
    r = random.Random(seed)
    for _ in range(count):
        x, y = r.randrange(cv.w), r.randrange(cv.h)
        if r.random() < 0.25:
            cv.rect(x, y, 2, 2, c)
        else:
            cv.set(x, y, c2)


def wayside_cross(cv: Canvas, x: int, base: int, h: int, wood: Color, dark: Color, towel: Color | None = None) -> None:
    """Придорожній хрест із вишитим рушником."""
    cv.rect(x, base - h, 2, h, wood)
    cv.vline(x + 1, base - h, base, dark)
    arm = base - round(h * 0.72)
    cv.rect(x - round(h * 0.25), arm, round(h * 0.5) + 2, 2, wood)
    cv.rect(x - 1, base - h - 2, 4, 2, dark)  # дашок
    if towel:
        for i in range(round(h * 0.35)):
            cv.set(x + round(h * 0.25) + 1, arm + 2 + i, towel if i % 3 else (190, 30, 40))
            cv.set(x - round(h * 0.25), arm + 2 + i, towel if (i + 1) % 3 else (190, 30, 40))


def wheel(cv: Canvas, cx: int, cy: int, r: int, rim: Color, spoke: Color, t: float = 0.0) -> None:
    for a in range(0, 360, 6):
        ang = math.radians(a)
        cv.set(round(cx + math.cos(ang) * r), round(cy + math.sin(ang) * r), rim)
    for k in range(4):
        ang = t + k * math.pi / 4
        for i in range(-r + 1, r):
            cv.set(round(cx + math.cos(ang) * i), round(cy + math.sin(ang) * i), spoke)
    cv.set(cx, cy, rim)


def gallop_horse(cv: Canvas, x: int, base: int, h: int, body: Color, dark: Color, mane: Color, phase: int = 0) -> None:
    """Кінь у галопі праворуч: витягнуті ноги, голова вперед."""
    bl = round(h * 1.35)
    by = base - round(h * 0.6)
    cv.ellipse(x, by, bl / 2, h * 0.19, shader=lambda xx, yy: body if yy <= by else dark)
    # Ноги: передні вперед, задні назад (або зібрані)
    legs = [(-0.4, -0.9), (-0.3, -0.5), (0.3, 0.7), (0.42, 1.0)] if phase == 0 else [(-0.35, 0.1), (-0.25, 0.35), (0.3, -0.2), (0.38, 0.1)]
    for i, (off, lean) in enumerate(legs):
        lx = x + round(off * bl)
        ln = round(h * 0.45)
        for k in range(ln):
            cv.set(lx + round(lean * k * 0.6), by + 2 + k, dark if i % 2 else body)
    # Шия й голова вперед
    nx = x + round(bl * 0.45)
    for i in range(round(h * 0.35)):
        cv.set(nx + i, by - i // 2 - 1, body)
        cv.set(nx + i, by - i // 2, body)
        cv.set(nx + i - 1, by - i // 2 - 2, mane)
    hx = nx + round(h * 0.35)
    hy = by - round(h * 0.2)
    cv.rect(hx, hy - 1, 4, 3, body)
    cv.set(hx + 4, hy + 1, dark)
    # Хвіст розвівається
    tx = x - round(bl / 2)
    for i in range(round(h * 0.4)):
        cv.set(tx - i, by - 1 + i // 3, mane)


def tachanka(cv: Canvas, x: int, base: int, s: float, wood: Color, wood_dark: Color, metal: Color, coat: Color, skin: Color, hat: Color, horse_c: tuple[Color, Color, Color], phase: int = 0, flag: Color | None = None) -> None:
    """Тачанка: ресорний віз, два колеса, кулемет позаду, двоє вояків, трійка коней."""
    wr = round(5 * s)
    # Колеса
    wheel(cv, x + round(2 * s), base - wr, wr, wood_dark, wood, phase * 0.4)
    wheel(cv, x + round(16 * s), base - wr, wr, wood_dark, wood, phase * 0.4 + 0.3)
    # Кузов
    top = base - wr - round(6 * s)
    cv.poly([(x - 4 * s, top), (x + 20 * s, top), (x + 18 * s, top + 5 * s), (x - 2 * s, top + 5 * s)], shader=lambda xx, yy: wood if yy < top + 3 * s else wood_dark)
    # Кулемет позаду (стріляли назад)
    cv.rect(round(x - 8 * s), round(top - 2 * s), round(7 * s), max(1, round(s)), metal)
    cv.rect(round(x - 3 * s), round(top - 3 * s), round(3 * s), round(2 * s), metal)
    cv.rect(round(x - 2 * s), round(top - 1 * s), max(1, round(s * 0.6)), round(2 * s), metal)  # щиток
    # Кулеметник і візник
    for px, hgt in ((x + round(3 * s), round(9 * s)), (x + round(14 * s), round(10 * s))):
        cv.rect(px - round(1.5 * s), top - hgt + round(3 * s), round(3 * s), hgt - round(3 * s), coat)
        cv.rect(px - round(s), top - hgt, round(2 * s) + 1, round(2 * s), skin)
        cv.rect(px - round(1.3 * s), top - hgt - round(s), round(2.6 * s) + 1, round(s) + 1, hat)
    if flag:
        fx = x + round(9 * s)
        cv.vline(fx, top - round(18 * s), top, wood_dark)
        for yy in range(round(5 * s)):
            for xx in range(round(8 * s)):
                cv.set(fx - xx - 1, top - round(18 * s) + yy + (1 if (xx // 3) % 2 else 0), flag)
    # Дишло й трійка коней
    cv.line(round(x + 20 * s), round(top + 4 * s), round(x + 30 * s), round(base - 7 * s), wood_dark)
    body, dark, mane = horse_c
    for k, (hx, hb) in enumerate(((x + round(44 * s), base - round(3 * s)), (x + round(32 * s), base + round(1 * s)))):
        gallop_horse(cv, hx, hb, round(14 * s), body if k else mix(body, (0, 0, 0), 0.3), dark, mane, (phase + k) % 2)


def dust(cv: Canvas, x: int, y: int, length: int, c: Color, seed: int) -> None:
    r = random.Random(seed)
    for i in range(length):
        rad = 1 + i // 4
        for k in range(rad * 2):
            if r.random() < 0.6 * (1 - i / length):
                cv.blend(x - i + r.randrange(-1, 2), y - r.randrange(0, rad + 1), c, 0.7 * (1 - i / length))


def windmill(cv: Canvas, x: int, base: int, s: float, body: Color, dark: Color, sail: Color, sail_dark: Color, angle: float = 0.5) -> None:
    """Український вітряк-«козак» на стовпі з крилами-ґратками."""
    bw, bh = round(9 * s), round(14 * s)
    top = base - round(12 * s) - bh
    # Ноги-підпори
    cv.line(x - round(4 * s), base, x, base - round(12 * s), dark)
    cv.line(x + round(4 * s), base, x, base - round(12 * s), dark)
    cv.vline(x, base - round(12 * s), base, dark)
    # Корпус і дах
    cv.rect(x - bw // 2, top, bw, bh, body)
    cv.rect(x + bw // 2 - max(1, bw // 3), top, max(1, bw // 3), bh, dark)
    cv.poly([(x - bw / 2 - 1, top), (x + bw / 2 + 1, top), (x + 1, top - 5 * s), (x - 1, top - 5 * s)], dark)
    # Крила
    hub = (x - round(bw / 2) - 1, top + round(3 * s))
    for k in range(4):
        a = angle + k * math.pi / 2
        L = round(16 * s)
        for i in range(3, L):
            px = round(hub[0] + math.cos(a) * i)
            py = round(hub[1] + math.sin(a) * i)
            cv.set(px, py, sail_dark)
            if i > 5:
                ox = round(math.cos(a + math.pi / 2) * 2)
                oy = round(math.sin(a + math.pi / 2) * 2)
                cv.set(px + ox, py + oy, sail if i % 2 else sail_dark)
                cv.set(px + ox // 2, py + oy // 2, sail)
    cv.set(*hub, dark)


def sunflower(cv: Canvas, x: int, base: int, h: int, stem: Color, petal: Color, center: Color) -> None:
    """Соняшник: товсте стебло, листки й велика голова, що схилилася до сонця."""
    cv.rect(x, base - h, 2, h, stem)
    for ly in (base - h // 3, base - (2 * h) // 3):
        for k in range(5):
            cv.set(x + 2 + k, ly - k // 2, stem)
            cv.set(x - 1 - k, ly - k // 2 + 1, stem)
    cx, cy, r = x + 2, base - h - 2, 4
    for yy in range(-r - 2, r + 3):
        for xx in range(-r - 2, r + 3):
            d = math.hypot(xx, yy)
            if d <= r - 1:
                cv.set(cx + xx, cy + yy, center if (xx + yy) % 2 else mix(center, (0, 0, 0), 0.3))
            elif d <= r + 1.6 and (round(math.atan2(yy, xx) * 4) % 2 == 0 or d <= r):
                cv.set(cx + xx, cy + yy, petal)


def oak_crown(cv: Canvas, cx: int, cy: int, r: int, dark: Color, mid: Color, light: Color, seed: int, light_dir: tuple[float, float] = (0.6, -0.8)) -> None:
    """Крона дуба з кількох «грудок», підсвічена з боку місяця."""
    rr = random.Random(seed)
    blobs = [(cx + rr.randint(-r, r), cy + rr.randint(-r // 2, r // 2), rr.randint(r // 2, r)) for _ in range(6)]
    for bx, by, br in blobs:
        for y in range(by - br, by + br + 1):
            for x in range(bx - br, bx + br + 1):
                d = math.hypot(x - bx, y - by)
                if d > br:
                    continue
                lit = ((x - bx) * light_dir[0] + (y - by) * light_dir[1]) / br
                c = dark
                if lit > 0.45:
                    c = light if dith(x, y, min(1, (lit - 0.45) * 3)) else mid
                elif lit > -0.1:
                    c = mid if dith(x, y, (lit + 0.1) * 2) else dark
                if rr.random() < 0.05:
                    c = mix(c, (0, 0, 0), 0.3)
                cv.set(x, y, c)


def campfire(cv: Canvas, x: int, base: int, s: int = 1) -> None:
    for k in range(-3 * s, 3 * s + 1):
        cv.set(x + k, base, (70, 40, 20))
        cv.set(x + k, base - 1 if abs(k) < 2 * s else base, (90, 55, 30))
    flame = [(0, 6, (255, 240, 170)), (0, 4, (255, 200, 80)), (-1, 3, (255, 150, 40)), (1, 3, (255, 150, 40)), (-2, 2, (230, 90, 30)), (2, 2, (230, 90, 30))]
    for dx, hgt, c in flame:
        for k in range(hgt * s):
            cv.set(x + dx * s, base - 2 - k, c)
            if s > 1:
                cv.set(x + dx * s + 1, base - 2 - k, c)


def steamer(cv: Canvas, x: int, water: int, L: int, hull: Color, hull_light: Color, deck: Color, deck_dark: Color, funnel: Color, band: Color, window: Color, smoke_c: Color | None, seed: int, crowd: Color | None = None) -> None:
    """Пароплав: корпус із загостреним носом, надбудова, дві труби з димом, ілюмінатори."""
    hh = max(4, L // 9)
    # Корпус
    cv.poly([(x, water - hh), (x + L, water - hh - 2), (x + L - hh, water), (x + hh // 2, water)], shader=lambda xx, yy: hull_light if yy < water - hh + 2 else hull)
    cv.hline(x + hh // 2, x + L - hh, water - 1, (150, 40, 40))  # ватерлінія
    for k in range(x + 6, x + L - hh, max(4, L // 14)):
        cv.set(k, water - hh + 2, window)
    # Надбудова
    sh = max(3, L // 14)
    sx0, sx1 = x + round(L * 0.25), x + round(L * 0.7)
    cv.rect(sx0, water - hh - sh, sx1 - sx0, sh, deck)
    cv.rect(sx1 - (sx1 - sx0) // 4, water - hh - sh, (sx1 - sx0) // 4, sh, deck_dark)
    for k in range(sx0 + 2, sx1 - 2, 3):
        cv.set(k, water - hh - sh + 1, window)
    cv.rect(sx0 + round((sx1 - sx0) * 0.6), water - hh - sh * 2, round((sx1 - sx0) * 0.3), sh, deck)  # місток
    # Труби
    fw = max(2, L // 20)
    fh = max(5, L // 6)
    for fx in (x + round(L * 0.38), x + round(L * 0.52)):
        cv.rect(fx, water - hh - sh - fh, fw, fh, funnel)
        cv.rect(fx, water - hh - sh - fh + 2, fw, max(1, fh // 5), band)
        if smoke_c:
            smoke(cv, fx + fw // 2, water - hh - sh - fh - 1, round(L * 0.6), smoke_c, seed + fx, drift=-0.9)
    # Щогли з ваннами-штагами до носа й корми
    top_y = water - hh - fh - sh - 4
    for mx, end in ((x + round(L * 0.14), x + 1), (x + round(L * 0.84), x + L - 1)):
        cv.vline(mx, top_y, water - hh, deck_dark)
        cv.hline(mx - 2, mx + 2, top_y + 3, deck_dark)
        cv.line(mx, top_y, end, water - hh - 2, mix(deck_dark, (0, 0, 0), 0.2))
    # Люди на палубі
    if crowd:
        rr = random.Random(seed)
        for k in range(x + 4, x + L - hh, 2):
            if rr.random() < 0.7:
                hgt = rr.randint(2, 3)
                cv.vline(k, water - hh - hgt, water - hh - 1, crowd)


def colonnade(cv: Canvas, x: int, base: int, w: int, h: int, stone: Color, shade: Color, dark: Color) -> None:
    """Колонада Графської пристані з арковим портиком і сходами."""
    cv.rect(x, base - h, w, 3, stone)  # антаблемент
    cv.rect(x - 1, base - h - 1, w + 2, 1, shade)
    n = max(4, w // 5)
    for i in range(n):
        cx = x + 1 + round(i * (w - 3) / (n - 1))
        cv.rect(cx, base - h + 3, 2, h - 5, stone)
        cv.set(cx + 1, base - h + 3, shade)
    # Сходи до води
    for k in range(4):
        cv.rect(x - k * 2, base - 2 + k, w + k * 4, 1, shade if k % 2 else stone)
    # Портик посередині
    mx = x + w // 2
    cv.poly([(mx - 6, base - h), (mx + 6, base - h), (mx, base - h - 5)], stone)
    cv.rect(mx - 2, base - h + 4, 4, h - 6, dark)
