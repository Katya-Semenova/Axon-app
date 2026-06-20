import "server-only";
import type { LLMClient, LLMCompletionResult } from "./types";
import { AIError } from "./types";

/**
 * Адаптер GigaChat (Сбер) — ЗАГОТОВКА под прод-аудиторию РФ (см. ADR-008).
 *
 * GigaChat работает иначе, чем OpenAI-совместимые API: сначала получают OAuth
 * access-token (POST на ngw.devices.sberbank.ru с Authorization-key и scope),
 * затем шлют запрос на chat-эндпоинт gigachat.devices.sberbank.ru. Реквизиты —
 * GIGACHAT_* в env. Интерфейс реализован, чтобы провайдер переключался конфигом;
 * сам сетевой вызов допишем боем при включении на проде.
 */
export class GigaChatClient implements LLMClient {
  readonly provider = "gigachat";

  constructor(readonly model: string) {}

  async complete(): Promise<LLMCompletionResult> {
    throw new AIError(
      "not-configured",
      "GigaChat-адаптер пока заготовка. Переключитесь на OpenRouter (AI_PROVIDER=openrouter) или допишите вызов.",
    );
  }
}
