/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Routing Middleware: виконується на сервері Vercel ПЕРЕД тим, як
 * віддати будь-який файл гри. Уся логіка — у server/gate.ts.
 *
 * Якщо функція повертає Response — Vercel віддає його замість файлу
 * (сторінка «Вхід за запрошенням», перенаправлення тощо).
 * Якщо нічого не повертає — запит іде далі, до звичайних файлів гри.
 *
 * Локально (`bun run dev`) middleware не працює: Vite про нього не знає,
 * тож у розробці гра відкривається без запрошення. Ворота діють лише
 * на Vercel.
 */

import { handleGate, GateEnv } from './server/gate';

export const config = {
  // Усі шляхи: HTML, скрипти, стилі, картинки
  matcher: '/:path*',
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const res = await handleGate(request, process.env as GateEnv, { fetch, now: Date.now });
  return res ?? undefined;
}
