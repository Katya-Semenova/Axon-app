/**
 * Общее для e2e-спек: регистрация свежего пользователя через UI.
 * Каждому прогону — уникальный email (тестовая БД axon_test копит их безвредно).
 */
import { expect, type Page } from "@playwright/test";

export const PASSWORD = "e2e-Passw0rd!";

export function freshEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}@test.local`;
}

/** Регистрирует нового пользователя и ждёт редиректа на главную приложения. */
export async function registerFreshUser(page: Page, tag: string): Promise<string> {
  const email = freshEmail(tag);
  await page.goto("/ai-studio/register");
  await page.fill("#name", "E2E Тест");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.check('input[type="checkbox"]');
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();
  await expect(page).toHaveURL(/\/ai-studio\/?$/, { timeout: 15_000 });
  // Ждём, пока КЛИЕНТ узнает о сессии (кнопка «Выйти» в шапке): иначе
  // загрузка файла/действия пойдут по гостевой ветке (useSession ещё null).
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible({ timeout: 15_000 });
  return email;
}

/** Закрывает «Обучающий тур», если он показался (первый вход в воркспейс). */
export async function dismissTourIfShown(page: Page): Promise<void> {
  const tour = page.getByRole("dialog", { name: "Обучающий тур" });
  try {
    await tour.waitFor({ state: "visible", timeout: 7_000 });
    await page.getByRole("button", { name: "Пропустить" }).click();
    await tour.waitFor({ state: "hidden", timeout: 5_000 });
  } catch {
    // Тур не показался (уже пройден) — это нормально.
  }
}
