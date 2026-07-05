/**
 * Сценарий 6 (docs/test-cases.md): публичная презентация по ссылке —
 * создать → открыть без входа → таб-дашборд (?view=dashboard) → отозвать →
 * «Презентация недоступна». Слайды берутся из демо-сида нового проекта.
 */
import { test, expect } from "@playwright/test";
import { registerFreshUser, dismissTourIfShown } from "./helpers";

test("Сценарий 6: ссылка + Web-dashboard, отзыв гасит оба вида", async ({ page, browser }) => {
  test.setTimeout(90_000);
  await registerFreshUser(page, "share");

  // Новый проект: клиент наполняет его демо-сидом (3 слайда) и сохраняет.
  await page.getByRole("button", { name: /Новый проект/ }).click();
  await expect(page.getByRole("tab", { name: "Холст" })).toBeVisible({ timeout: 20_000 });
  await dismissTourIfShown(page); // модальный тур первого входа перехватывает клики

  // Показ: формат по умолчанию «Ссылка для просмотра» → «Поделиться».
  await page.getByRole("tab", { name: "Показ" }).click();
  const shareBtn = page.getByRole("button", { name: "Поделиться" });
  await expect(shareBtn).toBeEnabled({ timeout: 15_000 }); // демо-сид доехал (слайды > 0)
  await shareBtn.click();

  // Ссылка на экране: .../ai-studio/p/<токен>
  const urlEl = page.getByText(/\/ai-studio\/p\//).first();
  await expect(urlEl).toBeVisible({ timeout: 15_000 });
  const shareUrl = (await urlEl.textContent())?.trim();
  expect(shareUrl).toBeTruthy();

  // Получатель БЕЗ входа: обычный вид — слайд + листание.
  // (ручной newContext НЕ наследует locale из конфига — задаём явно)
  // Демо-сид нового проекта доезжает в БД асинхронно (BoardSync), а страница
  // /p/[id] серверная и сама не обновится — как человек, перезагружаем до готовности.
  const viewer = await browser.newContext({ locale: "ru-RU" });
  const pub = await viewer.newPage();
  await expect(async () => {
    await pub.goto(shareUrl!);
    await expect(pub.getByText(/^1 \/ \d+$/)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await expect(pub.getByRole("button", { name: "Следующий слайд" })).toBeVisible();

  // Тот же токен + ?view=dashboard: закладки по слайдам вместо стрелок.
  // Подпись закладки = название дата-сета или «Слайд N», поэтому цепляемся
  // за aria-current активной закладки, а не за текст.
  await pub.goto(`${shareUrl}?view=dashboard`);
  await expect(pub.locator('button[aria-current="page"]')).toBeVisible({ timeout: 15_000 });
  await expect(pub.getByRole("button", { name: "Следующий слайд" })).toHaveCount(0);

  // Владелец отзывает — оба вида «недоступны».
  await page.getByRole("button", { name: "Отозвать ссылку" }).click();
  await expect(page.getByRole("button", { name: "Поделиться" })).toBeVisible({ timeout: 15_000 });
  await pub.goto(shareUrl!);
  await expect(pub.getByText("Презентация недоступна")).toBeVisible({ timeout: 15_000 });
  await pub.goto(`${shareUrl}?view=dashboard`);
  await expect(pub.getByText("Презентация недоступна")).toBeVisible({ timeout: 15_000 });

  await viewer.close();
});
