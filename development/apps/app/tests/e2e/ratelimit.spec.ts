/**
 * Сценарий 2, хвост (docs/test-cases.md): rate-limit отвечает 429.
 * Бьём в /request-password-reset (лимит 3/60с, lib/auth.ts) — НЕ в sign-in:
 * его ведро (10/60с) делят параллельные логин-тесты, и мы бы их залочили.
 * Ведро лимитера живёт в памяти сервера: если прошлый прогон его уже наполнил,
 * 429 придёт раньше 4-го запроса — поэтому ловим «встретился 429 в серии»,
 * а не «ровно на 4-м».
 */
import { test, expect } from "@playwright/test";
import { freshEmail } from "./helpers";

test("429: серия запросов сброса пароля упирается в rate-limit", async ({ request }) => {
  const email = freshEmail("ratelimit");
  const statuses: number[] = [];
  for (let i = 0; i < 4; i++) {
    const resp = await request.post("/ai-studio/api/auth/request-password-reset", {
      data: { email, redirectTo: "/ai-studio/reset-password" },
    });
    statuses.push(resp.status());
    if (resp.status() === 429) break;
  }
  expect(statuses, `статусы серии: ${statuses.join(", ")}`).toContain(429);
});
