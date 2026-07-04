/**
 * Сценарий 4 (docs/test-cases.md): защита страниц — гейты доступа для гостя.
 * Black-box: только URL и статусы, никаких внутренностей.
 */
import { test, expect } from "@playwright/test";

test("гость открывает /settings → серверный редирект на /login", async ({ page }) => {
  await page.goto("/ai-studio/settings");
  await expect(page).toHaveURL(/\/ai-studio\/login/);
});

test("не-админ (гость) открывает /admin/users → 404, не редирект", async ({ page }) => {
  const resp = await page.goto("/ai-studio/admin/users");
  expect(resp?.status()).toBe(404);
});
