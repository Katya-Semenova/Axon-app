import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Демо-вход для показа (Урок 7). Логинит ОБЩИЙ демо-аккаунт силами сервера —
 * чтобы его пароль не попадал в браузер/бандл. Кнопка «Попробовать демо» на
 * экране входа дёргает этот POST; в ответе — Set-Cookie сессии (asResponse).
 *
 * Включается двумя env (заданы оба → демо активно, иначе 404):
 *   DEMO_USER_EMAIL    — почта общего демо-аккаунта (она же включает лимит ИИ по IP);
 *   DEMO_USER_PASSWORD — его пароль (только на сервере).
 * Расход ИИ под этим аккаунтом ограничен лимитом по IP (lib/ai/rate-limit.ts).
 */
export async function POST() {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ error: "demo-disabled" }, { status: 404 });
  }
  try {
    // asResponse → готовый Response с куками сессии; отдаём клиенту как есть.
    return await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
      asResponse: true,
    });
  } catch (err) {
    console.error("[demo/login] failed:", err);
    return NextResponse.json({ error: "demo-login-failed" }, { status: 502 });
  }
}
