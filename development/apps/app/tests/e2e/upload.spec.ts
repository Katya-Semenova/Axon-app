/**
 * Сценарий 5 (docs/test-cases.md): главный флоу — файл → инсайты/дата-сеты →
 * авто-создание проекта у вошедшего → персист после перезагрузки.
 * ИИ в тестовом сервере выключен (пустой OPENROUTER_API_KEY) — разбор идёт
 * по правилам, детерминированно.
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import { registerFreshUser, dismissTourIfShown } from "./helpers";

const CSV = path.resolve(__dirname, "fixtures/e2e-sales.csv");

test("Сценарий 5: CSV через дропзону → воркспейс с дата-сетами, проект сохранён", async ({ page }) => {
  test.setTimeout(90_000);
  await registerFreshUser(page, "upload");

  // Главная приложения: дропзона с input[type=file] — кладём CSV как человек.
  await page.setInputFiles('input[type="file"]', CSV);

  // Файл разобран → открылся воркспейс (переключатель режимов — role=tab)
  // с карточками дата-сетов на холсте. Разбор + авто-создание проекта — даём запас.
  await expect(page.getByRole("tab", { name: "Холст" })).toBeVisible({ timeout: 30_000 });
  await dismissTourIfShown(page); // модальный тур первого входа
  await expect(page.getByText("ДАТА-СЕТ").first()).toBeVisible({ timeout: 15_000 });

  // Персист: перезагрузка возвращает на главную — проект с именем файла
  // в «Моих проектах» (авто-создан createProjectFromData).
  await page.goto("/ai-studio");
  await expect(page.getByText("Мои проекты")).toBeVisible({ timeout: 15_000 });
  const projectCard = page.getByText(/e2e-sales/).first();
  await expect(projectCard).toBeVisible({ timeout: 15_000 });

  // Открываем сохранённый проект — дата-сеты на месте (читаются из БД).
  await projectCard.click();
  await expect(page.getByText("ДАТА-СЕТ").first()).toBeVisible({ timeout: 15_000 });
});
