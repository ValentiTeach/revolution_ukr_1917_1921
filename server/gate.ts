/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ВОРОТА ГРИ «Вільна Доля»
 * ------------------------
 * Гра — окремий сайт, але відкривається лише за запрошенням з основного
 * сайту (historic-up). Цей модуль працює в Vercel Routing Middleware
 * (middleware.ts) ДО того, як віддається будь-який файл гри:
 *
 *   GET  /i/<токен>   — сторінка «Тебе запрошено» з кнопкою «Увійти».
 *                       Нічого не погашає: месенджери (Telegram, Viber)
 *                       відкривають посилання для прев'ю, і одноразове
 *                       запрошення згоріло б ще до учня.
 *   POST /i/<токен>   — сервер гри питає основний сайт
 *                       (/api/game-invite, action=redeem) із секретом
 *                       GAME_REDEEM_SECRET. Якщо запрошення чинне —
 *                       видає підписану cookie-сесію і перенаправляє на «/»
 *                       (токен зникає з адресного рядка).
 *   /logout           — забути сесію на цьому пристрої.
 *   усе інше          — лише з чинною сесією, інакше сторінка «Вхід за
 *                       запрошенням». Без сесії не віддається жоден файл
 *                       гри: ні HTML, ні JS, ні картинки.
 *
 * Сам токен гра НЕ розшифровує і ключа шифрування не має: це робить лише
 * основний сайт. Гра знає два секрети:
 *   GAME_REDEEM_SECRET  — пароль «гра → сайт» (той самий, що на сайті);
 *   GAME_SESSION_SECRET — ключ підпису власних cookie (лише в грі).
 *
 * Модуль не залежить від Vercel: лише Web Crypto, Request і Response,
 * тож його перевіряють звичайні тести (server/gate.test.ts).
 */

export interface GateEnv {
  MAIN_SITE_URL?: string;
  GAME_REDEEM_SECRET?: string;
  GAME_SESSION_SECRET?: string;
  /** Змінити (наприклад, 1 → 2), щоб негайно вийти з гри на всіх пристроях. */
  GAME_SESSION_VERSION?: string;
}

export interface GateDeps {
  fetch: typeof fetch;
  now: () => number;
}

export const SESSION_COOKIE = 'vd_session';
export const HERO_COOKIE = 'vd_hero';
const TOKEN_RE = /^[A-Za-z0-9_-]{20,512}$/;
const MAX_SESSION_HOURS = 24 * 30;
const REDEEM_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Підпис сесії (HMAC-SHA256)
// ---------------------------------------------------------------------------

interface SessionData {
  exp: number;   // unix-секунди
  k: 'shared' | 'personal';
  v: string;     // версія сесій (GAME_SESSION_VERSION)
  r: string;     // випадковий ідентифікатор сесії
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(str: string): Uint8Array<ArrayBuffer> {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(data: SessionData, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(data)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(`v1.${body}`)));
  return `v1.${body}.${b64url(sig)}`;
}

/** Повертає дані сесії або null (підробка, інша версія, прострочено). */
export async function verifySession(
  value: string | undefined,
  secret: string,
  version: string,
  nowMs: number,
): Promise<SessionData | null> {
  if (!value || value.length > 1024) return null;
  const parts = value.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromB64url(parts[2]),
      enc.encode(`v1.${parts[1]}`),
    );
    if (!ok) return null;
    const data = JSON.parse(dec.decode(fromB64url(parts[1]))) as SessionData;
    if (data.v !== version || typeof data.exp !== 'number' || data.exp * 1000 <= nowMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Сторінки воріт (без зовнішніх ресурсів — гра ще закрита)
// ---------------------------------------------------------------------------

const BASE_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function page(title: string, text: string, action = ''): string {
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Вільна Доля</title>
<style>
*{box-sizing:border-box;border-radius:0}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0c0a09;color:#f5f5f4;font:18px/1.5 ui-monospace,monospace;padding:16px}
.card{max-width:520px;width:100%;background:#1c1917;padding:28px;box-shadow:0 0 0 4px #0c0a09,0 0 0 8px #b45309,8px 16px 0 8px rgba(0,0,0,.5)}
.flag{height:8px;background:linear-gradient(#1d6fd1 50%,#f7c948 50%);margin:-28px -28px 20px}
h1{font-size:22px;color:#fcd34d;margin:0 0 12px;letter-spacing:.04em}p{margin:0 0 18px;color:#d6d3d1}
button{font:inherit;font-weight:700;color:#0c0a09;background:#f59e0b;border:0;padding:12px 22px;cursor:pointer;box-shadow:inset -3px -4px 0 rgba(0,0,0,.35),inset 3px 3px 0 rgba(255,255,255,.25)}
button:active{transform:translateY(2px)}small{color:#78716c}
</style></head><body><main class="card"><div class="flag"></div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p>${action}<small>Вільна Доля: 1917–1921 · гра для учнів Historic_up</small></main></body></html>`;
}

function html(status: number, title: string, text: string, action = '', extra: Record<string, string> = {}): Response {
  return new Response(page(title, text, action), { status, headers: { ...BASE_HEADERS, ...extra } });
}

const LOCKED = () =>
  html(401, 'Вхід лише за запрошенням', 'Гра відкривається за особливим посиланням від твого викладача. Попроси його надіслати запрошення.');

const REASONS: Record<string, string> = {
  expired: 'Термін дії цього запрошення минув. Попроси викладача надіслати нове.',
  used_up: 'Цим запрошенням уже скористалися стільки разів, скільки було дозволено.',
  revoked: 'Викладач відкликав це запрошення.',
  not_found: 'Такого запрошення немає.',
  invalid: 'Посилання пошкоджене. Скопіюй його повністю або попроси нове.',
  secret: 'Гра й основний сайт не впізнали одне одного. Викладачу: перевір, що GAME_REDEEM_SECRET однаковий в обох проєктах.',
};

// ---------------------------------------------------------------------------
// Головна функція воріт
// ---------------------------------------------------------------------------

/**
 * Повертає Response (зупинити запит) або null (пропустити до файлів гри).
 */
export async function handleGate(request: Request, env: GateEnv, deps: GateDeps): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/robots.txt') return null;

  const mainSite = (env.MAIN_SITE_URL || '').replace(/\/+$/, '');
  const redeemSecret = env.GAME_REDEEM_SECRET || '';
  const sessionSecret = env.GAME_SESSION_SECRET || '';
  const version = env.GAME_SESSION_VERSION || '1';

  // Не налаштовано — тримаємо зачиненим (fail closed), а не відкритим
  if (!mainSite || redeemSecret.length < 16 || sessionSecret.length < 32) {
    return html(503, 'Гра ще не налаштована', 'Адміністратор має задати змінні оточення MAIN_SITE_URL, GAME_REDEEM_SECRET і GAME_SESSION_SECRET.');
  }

  const session = await verifySession(readCookie(request.headers.get('cookie'), SESSION_COOKIE), sessionSecret, version, deps.now());

  if (path === '/logout') {
    return html(200, 'Ти вийшов із гри', 'Щоб повернутися, відкрий запрошення ще раз.', '', {
      'set-cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    });
  }

  if (path.startsWith('/i/')) {
    const token = path.slice(3);
    if (!TOKEN_RE.test(token)) return html(400, 'Запрошення не спрацювало', REASONS.invalid);

    // Уже в грі на цьому пристрої — не витрачаємо запрошення вдруге
    if (session) return new Response(null, { status: 303, headers: { location: '/', 'cache-control': 'no-store' } });

    if (request.method !== 'POST') {
      const form = `<form method="post" action="/i/${token}"><p><button type="submit">▶ Увійти в гру</button></p></form>`;
      return html(200, 'Тебе запрошено до гри!', 'Стань юним джурою Центральної Ради й пройди шлях Української революції 1917–1921 років.', form);
    }

    let result: { ok?: boolean; reason?: string; kind?: string; sessionHours?: number; heroName?: string | null };
    try {
      const res = await deps.fetch(`${mainSite}/api/game-invite`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-game-secret': redeemSecret },
        body: JSON.stringify({ action: 'redeem', token }),
        signal: AbortSignal.timeout(REDEEM_TIMEOUT_MS),
      });
      if (res.ok) {
        result = await res.json();
      } else {
        // Без токена й секретів: лише куди стукали і що відповіли (видно в Runtime Logs)
        const body = (await res.text().catch(() => '')).slice(0, 200);
        console.error(`[gate] redeem: ${mainSite}/api/game-invite -> HTTP ${res.status} ${body}`);
        result = { ok: false, reason: res.status === 401 || res.status === 403 ? 'secret' : 'server' };
      }
    } catch (err) {
      console.error(`[gate] redeem: ${mainSite}/api/game-invite -> ${err instanceof Error ? err.message : String(err)}`);
      result = { ok: false, reason: 'server' };
    }
    if (!result.ok && result.reason && result.reason !== 'server' && result.reason !== 'secret') {
      console.error(`[gate] redeem refused: ${result.reason}`);
    }

    if (!result.ok) {
      const text = REASONS[result.reason || ''] || 'Не вдалося перевірити запрошення. Спробуй ще раз за хвилину.';
      return html(result.reason === 'server' || result.reason === 'secret' ? 502 : 403, 'Запрошення не спрацювало', text);
    }

    const hours = Math.min(MAX_SESSION_HOURS, Math.max(1, Number(result.sessionHours) || 168));
    const maxAge = Math.floor(hours * 3600);
    const rnd = new Uint8Array(12);
    crypto.getRandomValues(rnd);
    const cookieValue = await signSession(
      { exp: Math.floor(deps.now() / 1000) + maxAge, k: result.kind === 'personal' ? 'personal' : 'shared', v: version, r: b64url(rnd) },
      sessionSecret,
    );

    const headers = new Headers({ location: '/', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
    headers.append('set-cookie', `${SESSION_COOKIE}=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
    if (result.heroName) {
      // Імʼя учня для пролога гри. Не секрет: читає сама гра, живе 10 хвилин
      headers.append('set-cookie', `${HERO_COOKIE}=${encodeURIComponent(String(result.heroName).slice(0, 18))}; Path=/; Secure; SameSite=Lax; Max-Age=600`);
    }
    return new Response(null, { status: 303, headers });
  }

  return session ? null : LOCKED();
}
