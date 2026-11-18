/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Тести воріт гри: без чинного запрошення не відкривається жоден файл,
 * підроблену сесію не прийнято, одноразове посилання не згоряє від прев'ю.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGate, signSession, verifySession, readCookie, GateEnv, SESSION_COOKIE, HERO_COOKIE } from './gate';

const ENV: GateEnv = {
  MAIN_SITE_URL: 'https://site.example',
  GAME_REDEEM_SECRET: 'redeem-secret-0123456789',
  GAME_SESSION_SECRET: 'session-secret-0123456789-0123456789-abcdef',
  GAME_SESSION_VERSION: '1',
};
const NOW = 1_800_000_000_000;
const TOKEN = 'AQ' + 'x'.repeat(90);

type Call = { url: string; init: RequestInit };

function fakeFetch(reply: unknown, status = 200) {
  const calls: Call[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify(reply), { status, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const deps = (f = fakeFetch({ ok: false }).fn) => ({ fetch: f, now: () => NOW });

async function validCookie(version = '1', exp = NOW / 1000 + 3600) {
  const v = await signSession({ exp, k: 'shared', v: version, r: 'abc' }, ENV.GAME_SESSION_SECRET!);
  return `${SESSION_COOKIE}=${v}`;
}

test('без сесії гра закрита: і сторінка, і файли', async () => {
  for (const path of ['/', '/index.html', '/assets/index-abc.js', '/assets/hero.jpg']) {
    const res = await handleGate(new Request(`https://game.example${path}`), ENV, deps());
    assert.ok(res, path);
    assert.equal(res!.status, 401, path);
    assert.match(res!.headers.get('x-robots-tag') || '', /noindex/);
  }
});

test('robots.txt доступний без сесії', async () => {
  assert.equal(await handleGate(new Request('https://game.example/robots.txt'), ENV, deps()), null);
});

test('без налаштувань ворота зачинені, а не відчинені', async () => {
  const res = await handleGate(new Request('https://game.example/'), { MAIN_SITE_URL: 'https://site.example' }, deps());
  assert.equal(res!.status, 503);
});

test('з чинною сесією файли гри віддаються', async () => {
  const req = new Request('https://game.example/assets/index.js', { headers: { cookie: await validCookie() } });
  assert.equal(await handleGate(req, ENV, deps()), null);
});

test('підроблена, прострочена або стара сесія не приймається', async () => {
  const good = (await validCookie()).split('=')[1];
  const [v, body, sig] = good.split('.');
  const forged = `${v}.${body}.${sig.slice(0, -2)}AA`;
  assert.equal(await verifySession(forged, ENV.GAME_SESSION_SECRET!, '1', NOW), null);
  assert.equal(await verifySession(good, 'інший-секрет-0123456789-0123456789', '1', NOW), null);
  const expired = (await validCookie('1', NOW / 1000 - 1)).split('=')[1];
  assert.equal(await verifySession(expired, ENV.GAME_SESSION_SECRET!, '1', NOW), null);
  // GAME_SESSION_VERSION змінили — усі старі сесії недійсні
  assert.equal(await verifySession(good, ENV.GAME_SESSION_SECRET!, '2', NOW), null);
});

test('GET запрошення лише показує кнопку і НЕ погашає його (захист від прев’ю месенджерів)', async () => {
  const f = fakeFetch({ ok: true });
  const res = await handleGate(new Request(`https://game.example/i/${TOKEN}`), ENV, deps(f.fn));
  assert.equal(res!.status, 200);
  assert.match(await res!.text(), /method="post"/);
  assert.equal(f.calls.length, 0);
});

test('сміття замість токена не доходить до сайту', async () => {
  const f = fakeFetch({ ok: true });
  const res = await handleGate(new Request('https://game.example/i/<script>', { method: 'POST' }), ENV, deps(f.fn));
  assert.equal(res!.status, 400);
  assert.equal(f.calls.length, 0);
});

test('POST чинного запрошення: перевірка на сайті із секретом, сесія, редирект без токена', async () => {
  const f = fakeFetch({ ok: true, kind: 'personal', sessionHours: 12, heroName: 'Орися' });
  const res = await handleGate(new Request(`https://game.example/i/${TOKEN}`, { method: 'POST' }), ENV, deps(f.fn));

  assert.equal(res!.status, 303);
  assert.equal(res!.headers.get('location'), '/');

  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].url, 'https://site.example/api/game-invite');
  assert.equal((f.calls[0].init.headers as Record<string, string>)['x-game-secret'], ENV.GAME_REDEEM_SECRET);
  assert.deepEqual(JSON.parse(String(f.calls[0].init.body)), { action: 'redeem', token: TOKEN });

  const cookies = res!.headers.getSetCookie();
  const session = cookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`))!;
  assert.match(session, /HttpOnly/);
  assert.match(session, /Secure/);
  assert.match(session, /Max-Age=43200/);
  const value = readCookie(session.split(';')[0], SESSION_COOKIE);
  assert.ok(await verifySession(value, ENV.GAME_SESSION_SECRET!, '1', NOW));

  const hero = cookies.find((c) => c.startsWith(`${HERO_COOKIE}=`))!;
  assert.match(hero, new RegExp(encodeURIComponent('Орися')));
});

test('відхилене запрошення пояснює причину і не дає сесії', async () => {
  const f = fakeFetch({ ok: false, reason: 'used_up' });
  const res = await handleGate(new Request(`https://game.example/i/${TOKEN}`, { method: 'POST' }), ENV, deps(f.fn));
  assert.equal(res!.status, 403);
  assert.match(await res!.text(), /скористалися/);
  assert.equal(res!.headers.get('set-cookie'), null);
});

test('сайт недоступний — гра лишається зачиненою', async () => {
  const failing = (async () => { throw new Error('network'); }) as unknown as typeof fetch;
  const res = await handleGate(new Request(`https://game.example/i/${TOKEN}`, { method: 'POST' }), ENV, deps(failing));
  assert.equal(res!.status, 502);
  assert.equal(res!.headers.get('set-cookie'), null);
});

test('хто вже в грі, повторно запрошення не витрачає', async () => {
  const f = fakeFetch({ ok: true });
  const req = new Request(`https://game.example/i/${TOKEN}`, { method: 'POST', headers: { cookie: await validCookie() } });
  const res = await handleGate(req, ENV, deps(f.fn));
  assert.equal(res!.status, 303);
  assert.equal(f.calls.length, 0);
});

test('/logout стирає сесію', async () => {
  const res = await handleGate(new Request('https://game.example/logout', { headers: { cookie: await validCookie() } }), ENV, deps());
  assert.match(res!.headers.get('set-cookie') || '', /Max-Age=0/);
});
