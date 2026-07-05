import { defineConfig } from "@playwright/test";

/**
 * Браузерные e2e-тесты (Урок 7, Задание 5.1 ч.2) — против ПРОД-СБОРКИ
 * (next build + next start, порт 3101) на отдельной тестовой БД axon_test
 * (Neon, .env.test). Dev-сервер НЕ используется — правило docs/rules/dev-server.md.
 * ИИ в тестовом сервере выключен (пустой OPENROUTER_API_KEY) — разбор файлов
 * идёт по правилам, детерминированно.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  workers: 2,
  reporter: [["list"]],
  use: {
    // ВАЖНО: приставку /ai-studio пишем в самих goto() — путь с ведущим «/»
    // затирает путь из baseURL (правило new URL()), и тест бьёт мимо приложения.
    baseURL: "http://localhost:3101",
    // Локаль резолвится по Accept-Language (i18n/request.ts, fallback en) —
    // фиксируем ru, чтобы ярлыки в тестах были детерминированно русскими.
    locale: "ru-RU",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bash tests/e2e/server.sh",
    url: "http://localhost:3101/ai-studio/login",
    timeout: 300_000, // включает next build
    reuseExistingServer: true,
  },
});
