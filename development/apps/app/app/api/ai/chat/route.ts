import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAIClient } from "@/lib/ai";
import { AIError } from "@/lib/ai/types";
import { checkRateLimit, checkIpLimit, clientIp, IP_LIMIT_MAX } from "@/lib/ai/rate-limit";
import { buildChatMessages, parseChatReply, type ChatRequest } from "@/lib/ai/chat";

/**
 * Живой AI-чат по данным (Урок 5, Шаг 1, фича «б») — серверная граница с ключом
 * провайдера (ADR-008). Только вошедшим; вход — вопрос + история + сводка доски +
 * схема колонок (не сырой файл); ответ — { answer, action? }. У чата НЕТ
 * rules-fallback (свободный вопрос правилами не ответить) → сбой возвращаем как
 * ошибку, клиент показывает её в чате с возможностью повтора.
 */
const MAX_BODY_BYTES = 128 * 1024;
const MAX_QUESTION_CHARS = 2000;
const MAX_SUMMARY_CHARS = 8000;
const MAX_HISTORY = 20;
const MAX_COLUMNS = 200;
const MAX_REPLY_TOKENS = 900;

export async function POST(req: NextRequest) {
  // 1. Гейт сессии — чат только вошедшим. Гость → 401.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 2. Rate-limit. Демо-аккаунт (показ) — по IP (все гости = один аккаунт);
  //    обычный пользователь — по аккаунту, как раньше.
  const demoEmail = process.env.DEMO_USER_EMAIL?.toLowerCase();
  const isDemo = !!demoEmail && session.user.email.toLowerCase() === demoEmail;
  let demoRemaining: number | undefined;
  if (isDemo) {
    const lim = checkIpLimit(clientIp(req.headers));
    if (!lim.allowed) {
      return NextResponse.json(
        { error: "demo-rate-limit", remaining: 0, limit: IP_LIMIT_MAX, resetInSec: lim.resetInSec },
        { status: 429 },
      );
    }
    demoRemaining = lim.remaining;
  } else if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "rate-limit" }, { status: 429 });
  }

  // 3. Защита от крупного тела.
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return NextResponse.json({ error: "too-large" }, { status: 413 });

  // 4. Разбор и валидация входа.
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!body || typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  // Подрезаем вход — не доверяем размерам от клиента.
  body.question = body.question.slice(0, MAX_QUESTION_CHARS);
  body.history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
  body.boardSummary = typeof body.boardSummary === "string" ? body.boardSummary.slice(0, MAX_SUMMARY_CHARS) : "";
  body.columns = Array.isArray(body.columns) ? body.columns.slice(0, MAX_COLUMNS) : [];

  // 5. Клиент ИИ (ключ провайдера). Нет → 503.
  const client = getAIClient();
  if (!client) return NextResponse.json({ error: "ai-unavailable" }, { status: 503 });

  // 6. Вызов ИИ → ответ + опц. действие.
  try {
    const res = await client.complete({
      messages: buildChatMessages(body),
      temperature: 0.4,
      maxTokens: MAX_REPLY_TOKENS,
      json: true,
    });
    const reply = parseChatReply(res.content);
    return NextResponse.json(
      demoRemaining !== undefined ? { reply, demoRemaining, demoLimit: IP_LIMIT_MAX } : { reply },
    );
  } catch (err) {
    const code = err instanceof AIError ? err.code : "bad-response";
    console.error("[ai/chat] failed:", err);
    return NextResponse.json({ error: code }, { status: 502 });
  }
}
