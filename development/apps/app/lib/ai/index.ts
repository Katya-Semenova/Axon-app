import "server-only";
import type { LLMClient } from "./types";
import { OpenRouterClient } from "./openrouter";
import { GigaChatClient } from "./gigachat";

/**
 * Сборка ИИ-клиента из env (см. docs/decisions/ADR-008-ai-provider.md).
 * Дефолт-провайдер — OpenRouter; смена провайдера = смена конфига, не кода.
 *
 *   AI_PROVIDER    = openrouter | gigachat   (дефолт: openrouter)
 *   AI_MODEL       = id модели у провайдера   (дефолт см. DEFAULT_MODEL ниже)
 *   AI_TIMEOUT_MS  = таймаут запроса, мс       (дефолт: 30000)
 *   OPENROUTER_API_KEY / GIGACHAT_API_KEY      — ключи (только сервер)
 *   APP_URL        = публичный URL приложения  (идентификация в OpenRouter, опц.)
 */
const provider = (process.env.AI_PROVIDER ?? "openrouter").toLowerCase();
const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? "30000");

/** Дефолт-модель на провайдера (переопределяется AI_MODEL; для OpenRouter — точный slug). */
const DEFAULT_MODEL: Record<string, string> = {
  openrouter: "anthropic/claude-sonnet-4.6",
  gigachat: "GigaChat",
};

/** Настроен ли ИИ (есть ключ выбранного провайдера). Иначе вызывающий → fallback на правила. */
export function aiConfigured(): boolean {
  if (provider === "openrouter") return !!process.env.OPENROUTER_API_KEY;
  if (provider === "gigachat") return !!process.env.GIGACHAT_API_KEY;
  return false;
}

/** Клиент выбранного провайдера или null, если не настроен. */
export function getAIClient(): LLMClient | null {
  const model = process.env.AI_MODEL ?? DEFAULT_MODEL[provider] ?? DEFAULT_MODEL.openrouter;

  if (provider === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;
    return new OpenRouterClient(model, key, timeoutMs, process.env.APP_URL);
  }

  if (provider === "gigachat") {
    if (!process.env.GIGACHAT_API_KEY) return null;
    return new GigaChatClient(model);
  }

  return null;
}
