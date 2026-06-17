import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAIClient } from "@/lib/ai";
import { AIError } from "@/lib/ai/types";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { buildExtractionMessages, parsePlan, type AIExtractionInput } from "@/lib/insight-engine/ai-plan";

/**
 * ИИ-извлечение инсайтов (Урок 5, Шаг 1) — серверная граница, где живёт ключ
 * провайдера (см. docs/decisions/ADR-008-ai-provider.md). Только вошедшим; вход —
 * схема колонок + выборка строк (не весь файл); ответ — план (executePlan его
 * исполнит на клиенте на реальных числах). Любая не-200 → клиент уходит в fallback
 * на правила (lib/insight-engine), поэтому ошибки тут не фатальны для пользователя.
 */
const MAX_BODY_BYTES = 256 * 1024; // вход компактный (схема + ~20 строк)
const MAX_COLUMNS = 200;
const MAX_SAMPLE_ROWS = 50;
const MAX_PLAN_TOKENS = 1500;

export async function POST(req: NextRequest) {
  // 1. Гейт сессии — ИИ только вошедшим (контроль расхода/абьюза). Гость → 401.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 2. Rate-limit на пользователя.
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "rate-limit" }, { status: 429 });
  }

  // 3. Защита от крупного тела.
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return NextResponse.json({ error: "too-large" }, { status: 413 });

  // 4. Разбор и валидация входа.
  let input: AIExtractionInput;
  try {
    input = (await req.json()) as AIExtractionInput;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!input || !Array.isArray(input.columns) || input.columns.length === 0) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  // Подрезаем вход — не доверяем размерам от клиента.
  input.columns = input.columns.slice(0, MAX_COLUMNS);
  input.sampleRows = Array.isArray(input.sampleRows) ? input.sampleRows.slice(0, MAX_SAMPLE_ROWS) : [];

  // 5. Клиент ИИ (ключ выбранного провайдера). Нет → 503, клиент уходит в fallback.
  const client = getAIClient();
  if (!client) return NextResponse.json({ error: "ai-unavailable" }, { status: 503 });

  // 6. Вызов ИИ → план.
  try {
    const res = await client.complete({
      messages: buildExtractionMessages(input),
      temperature: 0.2,
      maxTokens: MAX_PLAN_TOKENS,
      json: true,
    });
    const plan = parsePlan(res.content);
    return NextResponse.json({ plan });
  } catch (err) {
    const code = err instanceof AIError ? err.code : "bad-response";
    console.error("[ai/extract] failed:", err);
    return NextResponse.json({ error: code }, { status: 502 });
  }
}
