/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../../game/sound';
import { SpriteId } from '../../game/sprites';
import { PixelSprite, spriteCanvas } from '../PixelSprite';
import { StationGameProps, useGameKeys, useTimers } from './shared';

const W = 320;
const H = 144;
const LANES = [86, 108, 130]; // нижня межа спрайтів у кожній колії
const PX_PER_M = 7;
const CART_X = 34;
const MAX_WHEELS = 3;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

type Kind = 'pit' | 'hay' | 'wire' | 'oats';
interface Thing {
  x: number;
  lane: number;
  kind: Kind;
}

/** Небо з піксельним (ступінчастим) градієнтом. */
function paintSky(ctx: CanvasRenderingContext2D, colors: string[], h: number) {
  const bands = colors.length - 1;
  for (let y = 0; y < h; y++) {
    const t = (y / h) * bands;
    const i = Math.min(bands - 1, Math.floor(t));
    const f = t - i;
    for (let x = 0; x < W; x++) {
      ctx.fillStyle = f * 16 > BAYER[y % 4][x % 4] ? colors[i + 1] : colors[i];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function hillsProfile(len: number, base: number, amp: number, seed: number) {
  return Array.from({ length: len }, (_, x) =>
    Math.round(base - amp * (0.55 * Math.sin((x / len) * Math.PI * 2 * 2 + seed) + 0.3 * Math.sin((x / len) * Math.PI * 2 * 5 + seed * 2) + 0.15 * Math.sin((x / len) * Math.PI * 2 * 11))),
  );
}

/**
 * «Тачанка»: степовий рейд у дусі runner-ігор. Тачанка мчить праворуч,
 * ти перемикаєш колії й оминаєш ями, копиці та колючий дріт.
 * Мішок вівса повертає зламане колесо.
 */
export const TachankaGame: React.FC<StationGameProps & { distance: number; night?: boolean }> = ({ distance, night = false, onFinish }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'ready' | 'run' | 'won' | 'lost'>('ready');
  const [hud, setHud] = useState({ dist: 0, wheels: MAX_WHEELS, speed: 0 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const later = useTimers();

  const game = useRef({
    lane: 1,
    y: LANES[1],
    dist: 0,
    speed: 9,
    wheels: MAX_WHEELS,
    things: [] as Thing[],
    nextSpawn: 1.2,
    nextOats: 7,
    invuln: 0,
    shake: 0,
    frame: 0,
    scroll: 0,
    dust: [] as { x: number; y: number; life: number }[],
    running: false,
    finished: false,
  });

  const changeLane = (d: number) => {
    const g = game.current;
    if (!g.running) return;
    const next = Math.max(0, Math.min(2, g.lane + d));
    if (next !== g.lane) {
      g.lane = next;
      sound.playBlip(d < 0 ? 620 : 420);
    }
  };

  useGameKeys((e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц') {
      e.preventDefault();
      changeLane(-1);
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'і' || e.key === 'І') {
      e.preventDefault();
      changeLane(1);
    } else if ((e.key === ' ' || e.key === 'Enter') && phase === 'ready' && countdown === null) {
      e.preventDefault();
      start();
    }
  });

  const start = () => {
    const g = game.current;
    Object.assign(g, {
      lane: 1,
      y: LANES[1],
      dist: 0,
      speed: 9,
      wheels: MAX_WHEELS,
      things: [],
      nextSpawn: 1.4,
      nextOats: 7,
      invuln: 0,
      shake: 0,
      dust: [],
      running: false,
      finished: false,
    });
    setHud({ dist: 0, wheels: MAX_WHEELS, speed: 9 });
    setCountdown(3);
    sound.playBeep(440, 0.1);
    later(() => {
      setCountdown(2);
      sound.playBeep(440, 0.1);
    }, 600);
    later(() => {
      setCountdown(1);
      sound.playBeep(440, 0.1);
    }, 1200);
    later(() => {
      setCountdown(null);
      sound.playBeep(880, 0.2);
      game.current.running = true;
      setPhase('run');
    }, 1800);
  };

  // Ігровий цикл і малювання
  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    // Статичні шари малюємо один раз
    const sky = document.createElement('canvas');
    sky.width = W;
    sky.height = 64;
    const sctx = sky.getContext('2d')!;
    paintSky(sctx, night ? ['#020617', '#0b1d3a', '#1e3a5f', '#334e68'] : ['#2b5f9e', '#5b8fc7', '#f0b35a', '#f7d98b'], 64);
    if (night) {
      for (let i = 0; i < 60; i++) {
        sctx.fillStyle = i % 5 ? '#cbd5e1' : '#fef3c7';
        sctx.fillRect((i * 97) % W, (i * 37) % 44, 1, 1);
      }
      sctx.fillStyle = '#fef3c7';
      sctx.fillRect(250, 10, 10, 10);
      sctx.fillRect(249, 12, 12, 6);
      sctx.fillStyle = '#e2e8f0';
      sctx.fillRect(253, 13, 2, 2);
    } else {
      // Сонце над обрієм
      sctx.fillStyle = '#fff3c4';
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y <= 81) sctx.fillRect(250 + x, 46 + y, 1, 1);
    }
    const far = hillsProfile(640, 58, 6, 1.3);
    const mid = hillsProfile(480, 63, 4, 4.1);

    const sprites: Record<string, HTMLCanvasElement> = {};
    (['cart', 'horseA', 'horseB', 'pit', 'hay', 'wire', 'oats'] as SpriteId[]).forEach((id) => (sprites[id] = spriteCanvas(id)));

    let raf = 0;
    let last = performance.now();
    let hudTimer = 0;
    let hoofTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game.current;

      if (g.running && !g.finished) {
        g.speed = Math.min(15, 9 + g.dist / 80);
        const dx = g.speed * PX_PER_M * dt;
        g.dist += g.speed * dt;
        g.scroll += dx;
        g.things.forEach((t) => (t.x -= dx));
        g.things = g.things.filter((t) => t.x > -24);
        g.invuln = Math.max(0, g.invuln - dt);
        g.shake = Math.max(0, g.shake - dt);

        // Нові перешкоди: ніколи не перекриваємо всі три колії
        g.nextSpawn -= dt;
        if (g.nextSpawn <= 0 && g.dist < distance - 12) {
          const kinds: Kind[] = ['pit', 'hay', 'wire'];
          const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
          const count = g.dist > distance * 0.4 && Math.random() < 0.45 ? 2 : 1;
          for (let i = 0; i < count; i++) g.things.push({ x: W + 10 + i * 6, lane: lanes[i], kind: kinds[Math.floor(Math.random() * 3)] });
          g.nextSpawn = Math.max(0.7, 1.55 - g.dist / 600) + Math.random() * 0.5;
        }
        g.nextOats -= dt;
        if (g.nextOats <= 0) {
          const busy = new Set(g.things.filter((t) => t.x > W - 30).map((t) => t.lane));
          const free = [0, 1, 2].filter((l) => !busy.has(l));
          if (free.length) g.things.push({ x: W + 30, lane: free[Math.floor(Math.random() * free.length)], kind: 'oats' });
          g.nextOats = 6 + Math.random() * 5;
        }

        // Зіткнення: тачанка займає x від CART_X до CART_X+38
        const laneY = LANES[g.lane];
        g.things = g.things.filter((t) => {
          if (t.lane !== g.lane) return true;
          if (t.x + 14 < CART_X + 4 || t.x + 2 > CART_X + 38) return true;
          if (t.kind === 'oats') {
            if (g.wheels < MAX_WHEELS) g.wheels += 1;
            sound.playStar();
            return false;
          }
          if (g.invuln > 0) return true;
          g.wheels -= 1;
          g.invuln = 1.2;
          g.shake = 0.3;
          sound.playThud();
          return false;
        });
        void laneY;

        // Пил з-під коліс
        if (Math.random() < 0.6) g.dust.push({ x: CART_X + 2, y: g.y - 2 - Math.random() * 3, life: 0.5 });

        hoofTimer += dt;
        if (hoofTimer > 0.18) {
          hoofTimer = 0;
          sound.playHoof(g.frame);
        }

        if (g.wheels <= 0) {
          g.finished = true;
          g.running = false;
          setPhase('lost');
          sound.playWrong();
          later(() => onFinish(false), 1800);
        } else if (g.dist >= distance) {
          g.finished = true;
          g.running = false;
          setPhase('won');
          sound.playFanfare();
          later(() => onFinish(true), 1800);
        }
      }
      g.dust.forEach((d) => {
        d.x -= 40 * dt + (g.running ? g.speed * PX_PER_M * dt * 0.6 : 0);
        d.y -= 6 * dt;
        d.life -= dt;
      });
      g.dust = g.dust.filter((d) => d.life > 0);
      // Плавний (але ступінчастий) перехід між коліями
      const target = LANES[g.lane];
      if (g.y !== target) g.y += Math.sign(target - g.y) * Math.min(Math.abs(target - g.y), 4);
      g.frame = Math.floor(now / (g.running ? 110 : 400)) % 2;

      // ----------------------------------------------------------- малюємо
      const shakeX = g.shake > 0 ? (Math.random() < 0.5 ? -2 : 2) : 0;
      ctx.save();
      ctx.translate(shakeX, 0);
      ctx.drawImage(sky, 0, 0);
      // Далекі пагорби
      const farOff = Math.floor(g.scroll * 0.15);
      ctx.fillStyle = night ? '#1e2a3f' : '#7a8f6a';
      for (let x = 0; x < W; x++) {
        const hgt = far[(x + farOff) % far.length];
        ctx.fillRect(x, hgt, 1, 64 - hgt);
      }
      // Ближчі кургани
      const midOff = Math.floor(g.scroll * 0.35);
      ctx.fillStyle = night ? '#16213a' : '#9a8f4a';
      for (let x = 0; x < W; x++) {
        const hgt = mid[(x + midOff) % mid.length];
        ctx.fillRect(x, hgt, 1, 66 - hgt);
      }
      // Вітряк і телеграфні стовпи на середньому плані
      const millX = Math.round(W - ((g.scroll * 0.35 + 120) % 520));
      drawWindmill(ctx, millX, 60, now / 400, night);
      ctx.fillStyle = night ? '#0f172a' : '#5b4a2b';
      const poleStep = 70;
      const poleOff = Math.floor(g.scroll * 0.6) % poleStep;
      for (let x = -poleOff; x < W; x += poleStep) {
        ctx.fillRect(x, 50, 1, 16);
        ctx.fillRect(x - 3, 52, 7, 1);
      }
      ctx.fillStyle = night ? '#1e293b55' : '#00000033';
      ctx.fillRect(0, 53, W, 1);

      // Земля зі штрихами трави, що біжать
      ctx.fillStyle = night ? '#1f2a1a' : '#b59a4a';
      ctx.fillRect(0, 66, W, H - 66);
      const gOff = Math.floor(g.scroll) % 8;
      for (let y = 68; y < H; y += 3) {
        ctx.fillStyle = night ? (y % 2 ? '#26331f' : '#1a2416') : y % 2 ? '#c9ad5a' : '#a3873c';
        for (let x = -gOff + ((y * 5) % 8); x < W; x += 8) ctx.fillRect(x, y, 2, 1);
      }
      // Колії
      ctx.fillStyle = night ? '#141c12' : '#8a6e32';
      LANES.forEach((ly) => {
        ctx.fillRect(0, ly - 1, W, 1);
        ctx.fillRect(0, ly + 1, W, 1);
      });

      // Перешкоди й овес (позаду тачанки — спершу ті, що вище)
      const drawThings = (filterLane: (l: number) => boolean) =>
        g.things
          .filter((t) => filterLane(t.lane))
          .forEach((t) => {
            const spr = sprites[t.kind];
            if (night) {
              const dist = t.x - CART_X;
              ctx.globalAlpha = dist > 150 ? 0.15 : dist > 90 ? 0.5 : 1;
            }
            ctx.drawImage(spr, Math.round(t.x), LANES[t.lane] - spr.height + 2);
            ctx.globalAlpha = 1;
          });
      const cartLane = LANES.indexOf(LANES.reduce((a, b) => (Math.abs(b - g.y) < Math.abs(a - g.y) ? b : a)));
      drawThings((l) => l <= cartLane);

      // Пил
      ctx.fillStyle = night ? '#64748b' : '#e8d9a8';
      g.dust.forEach((d) => ctx.fillRect(Math.round(d.x), Math.round(d.y), d.life > 0.25 ? 2 : 1, d.life > 0.25 ? 2 : 1));

      // Тачанка (блимає після удару)
      if (!(g.invuln > 0 && Math.floor(now / 90) % 2 === 0)) {
        const y = Math.round(g.y);
        const bob = g.running && g.frame ? 1 : 0;
        ctx.drawImage(sprites.cart, CART_X, y - sprites.cart.height + 1 - bob);
        const horse = g.frame ? sprites.horseB : sprites.horseA;
        ctx.drawImage(horse, CART_X + 18, y - horse.height - 1);
        ctx.drawImage(g.frame ? sprites.horseA : sprites.horseB, CART_X + 22, y - horse.height + 1);
      }
      drawThings((l) => l > cartLane);

      // Нічна темрява з ліхтарем навколо тачанки
      if (night) {
        for (let y = 0; y < H; y += 2) {
          for (let x = 0; x < W; x += 2) {
            const d = Math.hypot(x - (CART_X + 30), (y - g.y) * 1.6);
            const a = Math.min(1, Math.max(0, (d - 40) / 140));
            if (a * 16 > BAYER[(y >> 1) % 4][(x >> 1) % 4]) {
              ctx.fillStyle = 'rgba(2,6,23,0.55)';
              ctx.fillRect(x, y, 2, 2);
            }
          }
        }
      }
      // Фініш
      const finishX = CART_X + 40 + (distance - g.dist) * PX_PER_M;
      if (finishX < W + 10) {
        for (let y = 66; y < H; y += 4) {
          ctx.fillStyle = (y / 4) % 2 ? '#f8fafc' : '#0c0a09';
          ctx.fillRect(Math.round(finishX), y, 4, 4);
        }
      }
      ctx.restore();

      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        setHud({ dist: Math.min(distance, Math.floor(g.dist)), wheels: g.wheels, speed: g.speed });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [distance, night]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min(100, (hud.dist / distance) * 100);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm text-stone-300">
        <div className="min-w-[10rem] flex-1">
          <div className="mb-1 flex justify-between text-xs text-stone-400">
            <span>🐎 Проїхано</span>
            <span className="font-pixel text-[9px] text-amber-200">
              {hud.dist}/{distance} м
            </span>
          </div>
          <div className="px-bar h-3 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="flex items-center gap-1" aria-label={`Колеса: ${hud.wheels} з ${MAX_WHEELS}`}>
          {Array.from({ length: MAX_WHEELS }).map((_, i) => (
            <span key={i} className={i < hud.wheels ? '' : 'opacity-25 grayscale'}>
              <PixelSprite id="wheelIcon" size={20} />
            </span>
          ))}
        </span>
        <span className="font-pixel text-[9px] text-stone-400">{Math.round(hud.speed * 3.6)} км/год</span>
      </div>

      <div className="relative border-4 border-stone-950 bg-stone-900">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full touch-none select-none"
          style={{ imageRendering: 'pixelated', aspectRatio: `${W} / ${H}` }}
          onPointerDown={(e) => {
            if (phase !== 'run') return;
            const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
            const y = ((e.clientY - r.top) / r.height) * H;
            changeLane(y < game.current.y - 8 ? -1 : 1);
          }}
          aria-label="Степ, тачанка мчить праворуч"
        />
        {phase === 'ready' && countdown === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-950/60 p-4 text-center">
            <p className="max-w-sm text-sm text-stone-100">
              Проїдь <strong>{distance} м</strong>. Стрілки ⬆️⬇️ (або торкнися вище/нижче тачанки) — змінити колію. Ями 🕳️, копиці й дріт ламають колеса, мішок вівса лагодить.
            </p>
            <button type="button" onClick={start} autoFocus className="pixel-btn border-2 border-amber-400 bg-amber-500 px-6 py-3 font-bold text-stone-950 hover:bg-amber-400">
              🐎 Вйо! (пробіл)
            </button>
          </div>
        )}
        {countdown !== null && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="px-pop font-pixel text-4xl text-yellow-300 [text-shadow:4px_4px_0_#0c0a09]" key={countdown}>
              {countdown}
            </span>
          </div>
        )}
        {phase === 'won' && (
          <div className="px-pop absolute inset-0 flex items-center justify-center bg-emerald-950/70 text-xl font-bold text-emerald-100">Прорвалися! 🎉</div>
        )}
        {phase === 'lost' && (
          <div className="px-pop absolute inset-0 flex items-center justify-center bg-rose-950/70 p-3 text-center text-lg font-bold text-rose-100">
            Тачанка зламалася… Колеса не витримали.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => changeLane(-1)} disabled={phase !== 'run'} className="pixel-btn border-2 border-stone-500 bg-stone-800 py-3 font-bold text-amber-200 disabled:opacity-40">
          ▲ Вище
        </button>
        <button type="button" onClick={() => changeLane(1)} disabled={phase !== 'run'} className="pixel-btn border-2 border-stone-500 bg-stone-800 py-3 font-bold text-amber-200 disabled:opacity-40">
          ▼ Нижче
        </button>
      </div>
    </div>
  );
};

/** Український вітряк із крилами, що повільно обертаються (по чверті оберту). */
function drawWindmill(ctx: CanvasRenderingContext2D, x: number, baseY: number, t: number, night: boolean) {
  if (x < -20 || x > W + 20) return;
  const body = night ? '#0f172a' : '#6b4a2a';
  const roof = night ? '#111827' : '#4a3520';
  ctx.fillStyle = body;
  for (let i = 0; i < 14; i++) ctx.fillRect(x - 3 - Math.floor(i / 5), baseY - i, 7 + Math.floor(i / 5) * 2, 1);
  ctx.fillStyle = roof;
  ctx.fillRect(x - 3, baseY - 18, 7, 4);
  ctx.fillRect(x - 2, baseY - 20, 5, 2);
  ctx.fillStyle = night ? '#334155' : '#e7d8b0';
  const hubX = x;
  const hubY = baseY - 16;
  const step = Math.floor(t) % 2;
  for (let i = 1; i <= 9; i++) {
    if (step === 0) {
      ctx.fillRect(hubX + i, hubY, 1, 2);
      ctx.fillRect(hubX - i, hubY - 1, 1, 2);
      ctx.fillRect(hubX, hubY - i, 2, 1);
      ctx.fillRect(hubX - 1, hubY + i, 2, 1);
    } else {
      ctx.fillRect(hubX + i, hubY - i, 2, 1);
      ctx.fillRect(hubX - i, hubY + i, 2, 1);
      ctx.fillRect(hubX - i, hubY - i, 1, 2);
      ctx.fillRect(hubX + i, hubY + i, 1, 2);
    }
  }
}
