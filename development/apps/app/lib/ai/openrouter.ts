import "server-only";
import type { LLMClient, LLMCompletionRequest, LLMCompletionResult } from "./types";
import { AIError } from "./types";

/**
 * Адаптер OpenRouter (дефолт-провайдер, см. ADR-008) — один ключ → актуальные
 * модели Claude/GPT. API OpenAI-совместимый: POST /chat/completions.
 * Ключ — только сервер (OPENROUTER_API_KEY). Таймаут — через AbortController.
 */
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Минимальная форма ответа chat/completions, которую читаем. */
interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenRouterClient implements LLMClient {
  readonly provider = "openrouter";

  constructor(
    readonly model: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly appUrl?: string,
  ) {}

  async complete(req: LLMCompletionRequest): Promise<LLMCompletionResult> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          // Идентификация приложения для OpenRouter — необязательно, но рекомендовано.
          ...(this.appUrl ? { "HTTP-Referer": this.appUrl } : {}),
          "X-Title": "Axon",
        },
        body: JSON.stringify({
          model: this.model,
          messages: req.messages,
          temperature: req.temperature ?? 0.2,
          ...(req.maxTokens ? { max_tokens: req.maxTokens } : {}),
          ...(req.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
    } catch (e) {
      const name = (e as Error).name;
      throw new AIError(
        name === "AbortError" ? "timeout" : "provider",
        `OpenRouter недоступен: ${(e as Error).message}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new AIError("rate-limit", "OpenRouter: лимит запросов (429)");
      throw new AIError("provider", `OpenRouter ${res.status}: ${body.slice(0, 200)}`);
    }

    let json: ChatCompletionResponse;
    try {
      json = (await res.json()) as ChatCompletionResponse;
    } catch {
      throw new AIError("bad-response", "OpenRouter: ответ не JSON");
    }

    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new AIError("bad-response", "OpenRouter: пустой ответ");
    }

    const usage = json.usage
      ? {
          promptTokens: json.usage.prompt_tokens ?? 0,
          completionTokens: json.usage.completion_tokens ?? 0,
        }
      : undefined;

    return { content, usage };
  }
}
