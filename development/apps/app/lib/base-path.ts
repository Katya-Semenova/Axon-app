/**
 * Единый источник приставки адреса сервиса (Урок 6, топология — ADR-010).
 *
 * Сервис живёт на подстранице `/ai-studio` того же домена, что и лендинг
 * (`axon-app.ru`). Это задаётся в `next.config.ts` как `basePath` — оттуда Next.js
 * САМ дописывает префикс ко всем внутренним ссылкам (<Link>), редиректам и ассетам.
 *
 * НО Next не трогает то, что идёт мимо его роутера. Эти места импортируют `BASE_PATH`
 * и дописывают вручную:
 *   - клиент входа Better Auth (lib/auth-client.ts) — путь `${BASE_PATH}/api/auth`;
 *   - «сырые» fetch к нашим API (ChatRail, insight-engine/extract, settings/avatar);
 *   - склейка абсолютных ссылок (PresentExport «поделиться», api/avatar → файл);
 *   - картинки через next/image по строковому src (OnboardingModal) — иначе оптимизатор 404;
 *   - ссылка письма «сброс пароля» (lib/auth.ts, sendResetPassword) + redirectTo в forgot-password.
 *
 * ⚠️ `BETTER_AUTH_URL` — наоборот, БЕЗ `/ai-studio` (голый домен): Next срезает basePath из
 * адреса запроса до Better Auth, поэтому baseURL c префиксом ломает вход (404). См. .env.example.
 *
 * ⚠️ Значение ДОЛЖНО совпадать с `basePath` в `next.config.ts` (там тоже импортируется отсюда).
 * Откат топологии: вернуть "" здесь, убрать basePath в конфиге (BETTER_AUTH_URL и так голый).
 */
export const BASE_PATH = "/ai-studio";
