import "server-only";

/**
 * Простой in-memory rate-limit на пользователя для /api/ai/* (Урок 5, Шаг 1).
 * Скользящее окно. Среда — один сервер (VPS docker), поэтому память процесса
 * допустима для MVP; при масштабировании на несколько инстансов — вынести в Redis.
 *
 *   AI_RATE_MAX     = запросов в окне на пользователя (дефолт 10)
 *   AI_RATE_WINDOW  = длина окна, сек               (дефолт 60)
 */
const MAX = Number(process.env.AI_RATE_MAX ?? "10");
const WINDOW_MS = Number(process.env.AI_RATE_WINDOW ?? "60") * 1000;

const hits = new Map<string, number[]>();

/** true — запрос разрешён (и учтён); false — лимит исчерпан. */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}
