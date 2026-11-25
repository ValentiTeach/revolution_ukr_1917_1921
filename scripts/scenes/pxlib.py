"""
Маленька бібліотека для піксельних сцен «Вільної Долі».

Усе малюється вручну по пікселях: ступінчасті градієнти з матрицею Байєра,
силуети пагорбів із шуму, спрайти з ASCII-рядків, світло й туман.
Жодного згладжування — лише чисті пікселі обмеженої палітри.
"""

from __future__ import annotations

import math
import random
from typing import Iterable, Sequence

from PIL import Image

W, H = 384, 216

BAYER4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

Color = tuple[int, int, int]


def hexc(h: str) -> Color:
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def mix(a: Color, b: Color, t: float) -> Color:
    t = max(0.0, min(1.0, t))
    return (round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t), round(a[2] + (b[2] - a[2]) * t))


def dith(x: int, y: int, t: float) -> bool:
    """True, якщо в цій клітинці матриці має бути «другий» колір (поріг t від 0 до 1)."""
    return t * 16 > BAYER4[y % 4][x % 4] + 0.5


class Noise1D:
    """Гладкий одномірний шум (інтерполяція випадкових значень)."""

    def __init__(self, seed: int, step: float):
        self.r = random.Random(seed)
        self.step = step
        self.vals: dict[int, float] = {}

    def _v(self, i: int) -> float:
        if i not in self.vals:
            self.vals[i] = self.r.random()
        return self.vals[i]

    def __call__(self, x: float) -> float:
        p = x / self.step
        i = math.floor(p)
        f = p - i
        f = f * f * (3 - 2 * f)
        return self._v(i) * (1 - f) + self._v(i + 1) * f


def ridge(seed: int, w: int, base: float, amps: Sequence[tuple[float, float]]) -> list[int]:
    """Висоти лінії горизонту: base мінус сума шумів (амплітуда, крок)."""
    ns = [(Noise1D(seed + i * 17, step), amp) for i, (amp, step) in enumerate(amps)]
    return [round(base - sum(n(x) * a for n, a in ns)) for x in range(w)]


class Canvas:
    def __init__(self, w: int = W, h: int = H, bg: Color = (0, 0, 0)):
        self.w, self.h = w, h
        self.img = Image.new('RGB', (w, h), bg)
        self.px = self.img.load()

    # ------------------------------------------------------------ базове
    def set(self, x: int, y: int, c: Color) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c

    def get(self, x: int, y: int) -> Color:
        x = max(0, min(self.w - 1, x))
        y = max(0, min(self.h - 1, y))
        return self.px[x, y]

    def rect(self, x: int, y: int, w: int, h: int, c: Color) -> None:
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.px[xx, yy] = c

    def hline(self, x0: int, x1: int, y: int, c: Color) -> None:
        for x in range(min(x0, x1), max(x0, x1) + 1):
            self.set(x, y, c)

    def vline(self, x: int, y0: int, y1: int, c: Color) -> None:
        for y in range(min(y0, y1), max(y0, y1) + 1):
            self.set(x, y, c)

    def line(self, x0: int, y0: int, x1: int, y1: int, c: Color) -> None:
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    def blend(self, x: int, y: int, c: Color, a: float) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = mix(self.px[x, y], c, a)

    # ------------------------------------------------------------ фігури
    def poly(self, pts: Sequence[tuple[float, float]], c: Color | None = None, shader=None) -> None:
        """Заливка многокутника рядками. shader(x, y) -> Color, якщо треба текстура."""
        ys = [p[1] for p in pts]
        for y in range(max(0, int(min(ys))), min(self.h, int(math.ceil(max(ys))) + 1)):
            xs = []
            n = len(pts)
            for i in range(n):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % n]
                if (y0 <= y + 0.5 < y1) or (y1 <= y + 0.5 < y0):
                    xs.append(x0 + (y + 0.5 - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(max(0, int(round(xs[i]))), min(self.w, int(round(xs[i + 1])))):
                    self.px[x, y] = shader(x, y) if shader else c

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, c: Color | None = None, shader=None) -> None:
        for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
            for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                    if 0 <= x < self.w and 0 <= y < self.h:
                        self.px[x, y] = shader(x, y) if shader else c

    # ------------------------------------------------------------ градієнти
    def vgrad(self, y0: int, y1: int, stops: Sequence[Color], x0: int = 0, x1: int | None = None) -> None:
        """Вертикальний ступінчастий градієнт через кілька кольорів."""
        x1 = self.w if x1 is None else x1
        bands = len(stops) - 1
        for y in range(y0, y1):
            t = (y - y0) / max(1, (y1 - y0 - 1)) * bands
            i = min(bands - 1, int(t))
            f = t - i
            for x in range(x0, x1):
                self.set(x, y, stops[i + 1] if dith(x, y, f) else stops[i])

    def fill_below(self, heights: Sequence[int], bottom: int, shader) -> None:
        for x, top in enumerate(heights):
            for y in range(max(0, top), min(self.h, bottom)):
                self.px[x, y] = shader(x, y, top)

    # ------------------------------------------------------------ світло
    def glow(self, cx: float, cy: float, r: float, c: Color, strength: float = 0.6, squash: float = 1.0) -> None:
        """Ступінчасте світіння: колір додається кільцями з дизерингом."""
        for y in range(int(cy - r * squash) - 1, int(cy + r * squash) + 2):
            for x in range(int(cx - r) - 1, int(cx + r) + 2):
                d = math.hypot(x - cx, (y - cy) / squash) / r
                if d >= 1 or not (0 <= x < self.w and 0 <= y < self.h):
                    continue
                t = (1 - d) ** 1.6 * strength
                level = math.floor(t * 8) / 8
                if dith(x, y, (t * 8) % 1):
                    level += 0.125
                if level > 0:
                    self.px[x, y] = mix(self.px[x, y], c, min(1, level))

    def haze(self, y0: int, y1: int, c: Color, a0: float, a1: float) -> None:
        """Атмосферний серпанок: вертикальна вуаль кольору з дизерингом."""
        for y in range(max(0, y0), min(self.h, y1)):
            t = (y - y0) / max(1, y1 - y0)
            a = a0 + (a1 - a0) * t
            lvl = math.floor(a * 4) / 4
            for x in range(self.w):
                aa = lvl + (0.25 if dith(x, y, (a * 4) % 1) else 0)
                if aa > 0:
                    self.px[x, y] = mix(self.px[x, y], c, min(1, aa))

    def darken(self, factor: float) -> None:
        for y in range(self.h):
            for x in range(self.w):
                r, g, b = self.px[x, y]
                self.px[x, y] = (int(r * factor), int(g * factor), int(b * factor))

    # ------------------------------------------------------------ спрайти
    def sprite(self, rows: Sequence[str], pal: dict[str, Color], x: int, y: int, flip: bool = False) -> None:
        w = max(len(r) for r in rows)
        for yy, row in enumerate(rows):
            for xx, ch in enumerate(row):
                if ch == '.' or ch == ' ':
                    continue
                c = pal.get(ch)
                if c is None:
                    continue
                px = x + (w - 1 - xx if flip else xx)
                self.set(px, y + yy, c)

    def stars(self, seed: int, count: int, y_max: int, colors: Iterable[Color]) -> None:
        r = random.Random(seed)
        cols = list(colors)
        for _ in range(count):
            x, y = r.randrange(self.w), r.randrange(y_max)
            c = r.choice(cols)
            self.set(x, y, c)
            if r.random() < 0.08:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    self.blend(x + dx, y + dy, c, 0.5)

    def save(self, path: str) -> None:
        self.img.save(path, optimize=True)


# ---------------------------------------------------------------------------
# Спільні дрібні фігури
# ---------------------------------------------------------------------------

def pine(cv: Canvas, x: int, base: int, h: int, dark: Color, mid: Color, light: Color, snow: Color | None = None, trunk: Color | None = None) -> None:
    """Ялина з ярусами, тінню праворуч і (за бажанням) снігом на гілках."""
    tiers = max(3, h // 6)
    top = base - h
    for t in range(tiers):
        ty = top + int(t * h / (tiers + 0.6))
        th = int(h / tiers * 1.5)
        half = 2 + int((t + 1) * h / tiers * 0.36)
        for yy in range(th):
            w = int(half * (yy + 1) / th)
            for xx in range(-w, w + 1):
                c = mid if xx < w * 0.35 else dark
                if xx < -w * 0.4 and yy % 3 == 0:
                    c = light
                cv.set(x + xx, ty + yy, c)
            if snow and yy == th - 1:
                for xx in range(-w, int(w * 0.5)):
                    if (xx + t) % 3:
                        cv.set(x + xx, ty + yy - 1, snow)
        if snow:
            cv.set(x, ty, snow)
    if trunk:
        cv.rect(x - 1, base - 2, 2, 3, trunk)


def bare_tree(cv: Canvas, x: int, base: int, h: int, c: Color, seed: int, spread: float = 0.6) -> None:
    """Голе дерево гілками-лініями (для зими й памʼятного поля)."""
    r = random.Random(seed)

    def branch(x0: float, y0: float, ang: float, length: float, depth: int) -> None:
        if depth == 0 or length < 2:
            return
        x1 = x0 + math.cos(ang) * length
        y1 = y0 - math.sin(ang) * length
        cv.line(round(x0), round(y0), round(x1), round(y1), c)
        if depth > 3:
            cv.line(round(x0) + 1, round(y0), round(x1) + 1, round(y1), c)
        for _ in range(2):
            branch(x1, y1, ang + r.uniform(-spread, spread), length * r.uniform(0.6, 0.78), depth - 1)

    branch(x, base, math.pi / 2 + r.uniform(-0.08, 0.08), h * 0.38, 6)
