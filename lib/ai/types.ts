/**
 * Контракт ИИ-слоя (Урок 5, Шаг 1) — провайдер-агностичный разъём.
 *
 * Продукт общается с интерфейсом `LLMClient`, не зная, кто внутри (OpenRouter,
 * GigaChat…). Смена провайдера = смена адаптера/конфига, не переписывание кода.
 * Ключи провайдеров — только сервер (см. docs/decisions/ADR-008-ai-provider.md).
 */

export type LLMRole = "system" | "user" | "assistant";

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  /** 0..1; ниже — стабильнее/детерминированнее (для структурного плана берём низкую). */
  temperature?: number;
  /** Кап токенов ответа — контроль расхода. */
  maxTokens?: number;
  /** Просим строгий JSON в ответе (для плана инсайтов). */
  json?: boolean;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface LLMCompletionResult {
  /** Сырой текст ответа (JSON-строка, если запрошен json). */
  content: string;
  usage?: LLMUsage;
}

/** Единый клиент ИИ — реализуется адаптером конкретного провайдера. */
export interface LLMClient {
  readonly provider: string;
  readonly model: string;
  complete(req: LLMCompletionRequest): Promise<LLMCompletionResult>;
}

/** Код ошибки ИИ — по нему вызывающий решает о fallback на правила. */
export type AIErrorCode =
  | "not-configured" // нет ключа / провайдер не настроен
  | "timeout"        // вышло время ожидания
  | "rate-limit"     // провайдер вернул 429
  | "provider"       // ошибка/недоступность провайдера (5xx, сеть)
  | "bad-response";  // ответ не разобрать

export class AIError extends Error {
  code: AIErrorCode;
  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.name = "AIError";
    this.code = code;
  }
}
