import "server-only";

/**
 * In-memory rate-limit для /api/ai/* (Урок 5, Шаг 1; демо-режим — Урок 7).
 * Скользящее окно. Среда — один сервер (VPS docker), поэтому память процесса
 * допустима для MVP; при масштабировании на несколько инстансов — вынести в Redis.
 *
 * Два режима:
 *  - обычный вошедший пользователь — лимит ПО АККАУНТУ (как было):
 *      AI_RATE_MAX     = запросов в окне на пользователя (дефолт 10)
 *      AI_RATE_WINDOW  = длина окна, сек               (дефолт 60)
 *  - общий ДЕМО-аккаунт на показе — лимит ПО IP (все гости = один аккаунт,
 *    поэтому лимит по аккаунту бесполезен; режем по устройству/сети):
 *      AI_IP_RATE_MAX     = запросов в окне на один IP (дефолт 5)
 *      AI_IP_RATE_WINDOW  = длина окна, сек             (дефолт 3600 = час)
 */
const MAX = Number(process.env.AI_RATE_MAX ?? "10");
const WINDOW_MS = Number(process.env.AI_RATE_WINDOW ?? "60") * 1000;

const IP_MAX = Number(process.env.AI_IP_RATE_MAX ?? "5");
const IP_WINDOW_MS = Number(process.env.AI_IP_RATE_WINDOW ?? "3600") * 1000;

/** Лимит демо-окна — наружу, чтобы UI показал «N из IP_LIMIT_MAX». */
export const IP_LIMIT_MAX = IP_MAX;

const userHits = new Map<string, number[]>();
const ipHits = new Map<string, number[]>();

export type LimitResult = {
  /** true — запрос разрешён (и учтён); false — лимит исчерпан. */
  allowed: boolean;
  /** Сколько запросов осталось в текущем окне (для счётчика в UI). */
  remaining: number;
  /** Через сколько секунд окно освободится (для сообщения гостю). */
  resetInSec: number;
};

/** Общее скользящее окно: чистит старые отметки, учитывает попытку, считает остаток. */
function slide(store: Map<string, number[]>, key: string, max: number, windowMs: number): LimitResult {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    store.set(key, recent);
    const oldest = recent[0] ?? now;
    return { allowed: false, remaining: 0, resetInSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  recent.push(now);
  store.set(key, recent);
  return { allowed: true, remaining: Math.max(0, max - recent.length), resetInSec: Math.ceil(windowMs / 1000) };
}

/** Лимит по аккаунту (обычные вошедшие). true — разрешён (и учтён). */
export function checkRateLimit(userId: string): boolean {
  return slide(userHits, userId, MAX, WINDOW_MS).allowed;
}

/** Лимит по IP (демо-гости на показе). Возвращает остаток для счётчика «N из 5». */
export function checkIpLimit(ip: string): LimitResult {
  return slide(ipHits, ip, IP_MAX, IP_WINDOW_MS);
}

/** Реальный IP клиента: nginx кладёт его в X-Forwarded-For (первый в списке). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
