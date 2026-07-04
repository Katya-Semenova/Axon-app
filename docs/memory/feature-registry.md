# Feature Registry — AXON

> Каталог УЖЕ реализованного. Используется на вопросы «есть ли уже X?», «нужно ли делать Y
> или готово?» — вместо чтения всего spec.md. Только факт реализации + ссылка на спеку/код;
> детали — по ссылкам. Обновляется в конце каждого этапа (`/save-session`).
> Планы и отложенное — НЕ здесь, а в `docs/backlog.md`.

## Auth / аккаунт
- Регистрация + вход по email/паролю (Better Auth) → spec: `docs/screens/login.md`, `register.md`; код: `lib/auth.ts`
- Восстановление пароля (письмо со ссылкой) → `docs/screens/forgot-password.md`, `reset-password.md`
- Сессии-cookie HttpOnly + Secure + SameSite=Lax (проверено на проде, тест-кейсы §2)
- Настройки: профиль, аватар (S3), смена пароля, удаление аккаунта → `docs/screens/settings.md`
- Согласие с terms/privacy в форме регистрации + signup-цели Метрики
- Гейты: гость → /login; чужие данные закрыты (IDOR-аудит) → `docs/screens/_global.md`
- ⚠️ Известное: /login и /register НЕ редиректят уже вошедшего (backlog)

## Проекты / доски
- Доска как документ `BoardData` (JSON) в PostgreSQL (Prisma) → ADR-003; `prisma/schema.prisma`
- Автосейв вошедшему; гость — в памяти браузера
- Dashboard «Recent Projects» со статусами (на входном экране сервиса) → `docs/screens/landing.md`

## Файл → инсайты
- Загрузка CSV/Excel (dropzone + «+ Добавить файл» в чат-рейле, дозапись к доске) → `lib/file-parsing/`
- Движок правил `ParsedTable → BoardData` (без ИИ, fallback) → `lib/insight-engine/`
- PDF/картинки/SQL — принимаем, инсайты упрощённые + бейдж Beta (EC-1)
- Хранилище файлов — Selectel S3 → ADR-006; `lib/storage.ts`

## ИИ (только вошедшим)
- Извлечение инсайтов реальным ИИ (гибрид: ИИ выбирает/пишет словами, числа считает код) → ADR-008; `lib/ai/`, `app/api/ai/extract`
- AI-чат по данным в Data-рейле + «Построить инсайт» (Apply через executePlan) → `lib/ai/chat.ts`, `app/api/ai/chat`
- Провайдер-агностично: дефолт OpenRouter, GigaChat — опция-адаптер
- Fallback на правила при сбое/без ключа; приватность: провайдеру — схема + выборка
- Демо-режим для стенда: лимит ИИ 5/час на IP + демо-кнопка (код готов, НЕ выкачен — backlog п.0)

## Холст (Data mode)
- Node-граф Insight → Connection → DataSet; отсоединение/переподключение связей → `lib/store.ts`, `Canvas.tsx`
- Drill-in инсайта и дата-сета → `docs/screens/insight-drill-in.md`, `dataset-drill-in.md`
- 10 типов графиков (Treemap, Heatmap, Map, Donut, Scatter, Radar, Lollipop, Stacked Bar, Dot Matrix, Spline Area) → `ChartRenderer.tsx`
- Авто-пан к новым узлам; текст-инсайты (pull-quote)

## Слайды (Slides mode)
- 8 архетипов слайда + Layout-дропдаун + авто-подбор от ИИ → `docs/screens/slides.md`
- Темы деки (deck-wide, свои шрифтовые пары/форма графиков/heatmap): Editorial, Swiss, Soft, Web/Raycast… → `lib/types.ts` (PRESENTATION_THEMES)
- Лента слайдов с drag-сортировкой; inline-редактирование текста

## Показ / шаринг (Present)
- In-app показ + публичная ссылка `/p/[token]` (read-only, отзыв ссылки) → ADR-007; `app/p/`
- PDF / PPTX / Interactive — «скоро» (заглушки); PNG нет
- noindex на сервисе и публичных деках

## Админка
- Owner-панель v1 read-only по `ADMIN_EMAIL`: /admin/users + профиль юзера; не-админ → 404 → `lib/admin.ts`
- Роль в БД — НЕ сделана (backlog, после Урока 7)

## i18n
- Интерфейс сервиса RU/EN через next-intl → `messages/{ru,en}.json` (auth-экраны — ещё в backlog)
- Лендинг — только EN (двуязычие в backlog)

## Лендинг / публичная упаковка
- Лендинг `axon-app.ru`: hero-анимации, FAQ, юр-страницы (/privacy /terms /cookies), мобильный адаптив → `apps/landing/`
- SEO: мета, OG/Twitter-картинки, sitemap, robots, JSON-LD; GEO: llms.txt
- Яндекс.Метрика за cookie-согласием (баннер, RU/EN, отзыв согласия)

## Инфраструктура
- VPS Selectel + Docker (3 юнита: landing/web/db) + nginx по пути (`/` лендинг, `/ai-studio` сервис) → ADR-002/009/010; `docker-compose.yml`, `deploy.sh`
- Zero-downtime деплой + бэкапы БД → `docs/memory/infrastructure.md`
- Письма — Resend + React Email (prod) → ADR-005
- ⚠️ Времянка: Basic Auth на /ai-studio СНЯТ под показ 2026-06-28 — ВЕРНУТЬ (infrastructure.md)

## Документация / качество
- spec.md, DESIGN.md, паспорта всех экранов + `_global.md`, app-map (+HTML), test-cases (BDD, прогнаны на проде вручную)
- Хуки-страховки + реестр `docs/automations.md`; lint в сборке (0 замечаний)
- Автотесты (Playwright/Vitest) — НЕ сделаны (Урок 7, Задание 5.1)
