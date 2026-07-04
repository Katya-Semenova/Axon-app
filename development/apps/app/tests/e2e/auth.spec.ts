/**
 * Сценарии 1 и 2 (docs/test-cases.md): регистрация + первый вход;
 * неверный пароль → единый ответ (не раскрывает существование аккаунта).
 * Каждому прогону — свой уникальный email (тестовая БД axon_test копит их безвредно).
 */
import { test, expect } from "@playwright/test";

const PASSWORD = "e2e-Passw0rd!";

function freshEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}@test.local`;
}

test("Сценарий 1: регистрация → вход в приложение, сессия живая (cookie HttpOnly)", async ({ page, context }) => {
  const email = freshEmail("reg");
  await page.goto("/ai-studio/register");
  await page.fill("#name", "E2E Тест");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.check('input[type="checkbox"]');
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  // Редирект на вход в приложение (корень сервиса).
  await expect(page).toHaveURL(/\/ai-studio\/?$/, { timeout: 15_000 });

  // Cookie сессии Better Auth — HttpOnly (Secure не проверяем: локально http).
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name.includes("session_token"));
  expect(session).toBeDefined();
  expect(session!.httpOnly).toBe(true);

  // Сессия действует: /settings доступен БЕЗ редиректа на /login (сценарий 4, часть «после входа»).
  await page.goto("/ai-studio/settings");
  await expect(page).toHaveURL(/\/ai-studio\/settings/);
});

test("Сценарий 2: неверный пароль → общая ошибка, одинаковая для несуществующего email", async ({ page, browser }) => {
  // Реальный аккаунт с неверным паролем.
  const email = freshEmail("wrongpass");
  await page.goto("/ai-studio/register");
  await page.fill("#name", "E2E Тест");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.check('input[type="checkbox"]');
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/ai-studio\/?$/, { timeout: 15_000 });

  // Свежий контекст (без сессии): вход с НЕВЕРНЫМ паролем к существующему аккаунту.
  const ctx1 = await browser.newContext();
  const p1 = await ctx1.newPage();
  await p1.goto("/ai-studio/login");
  await p1.fill("#email", email);
  await p1.fill("#password", "wrong-password-123");
  await p1.getByRole("button", { name: "Войти" }).click();
  const err1 = await p1.locator("p.text-error, [class*='text-error']").first().textContent({ timeout: 10_000 });
  await ctx1.close();

  // Вход с НЕСУЩЕСТВУЮЩИМ email — текст ошибки должен быть ТОТ ЖЕ (защита от перебора).
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto("/ai-studio/login");
  await p2.fill("#email", freshEmail("ghost"));
  await p2.fill("#password", "whatever-123");
  await p2.getByRole("button", { name: "Войти" }).click();
  const err2 = await p2.locator("p.text-error, [class*='text-error']").first().textContent({ timeout: 10_000 });
  await ctx2.close();

  expect(err1?.trim()).toBeTruthy();
  expect(err1?.trim()).toBe(err2?.trim());
});
