# Инфраструктура Axon

> Памятка: как устроен бэкенд проекта. Обновлено 2026-06-17 (конец Урока 4).
> Решения по каждому пункту — в `docs/decisions/` (ADR-002…007).

## Монорепо (Урок 6, Шаг 0 — с 2026-06-20). ADR-009.
Весь код переехал из корня в **`development/`** (npm workspace). Корень репозитория
теперь чистый: `docs/` + `development/` + правила (`CLAUDE.md`/`AGENTS.md`/`.claude/`).
- **`development/apps/app/`** — сервис (Next 15.5). Бывший корневой код (app, lib, prisma,
  public, emails, i18n, messages + конфиги, `.env`).
- **`development/apps/landing/`** — лендинг (Next 16; framer-motion/gsap/lenis/lottie).
  Перенесён из соседнего проекта `../axon-landing` (его git-история осталась там).
- **`development/packages/ui/`** — `@axon/ui`: токены бренда (цвета+радиусы) в
  `src/styles/theme.css`. **Единый источник** (DESIGN.md); импортят обе apps.
- **Workspace:** `development/package.json` (`workspaces: ["apps/*","packages/*"]`),
  единый `development/package-lock.json`. Установка: `cd development && npm install`.
- **Сборки (раздельные):** `npm run build -w apps/app` и `npm run build -w axon-landing`.
- **Dev:** `cd development && npm run dev -w apps/app -- -p 3001` (и `-w axon-landing -- -p 3002`).

## Хостинг и деплой
- **Сервер:** VPS Selectel, домен **axon-app.ru** (HTTPS через Certbot). ADR-002.
- **URL-топология (Урок 6, Задание 1.1 — ADR-010):** один домен `axon-app.ru`, один origin.
  nginx: `/` → лендинг (`apps/landing`), `/app` + внутренние маршруты сервиса (`/login`,
  `/signup`, `/settings`, `/admin`, `/api`) → сервис (`apps/app`). Поддомен `app.` НЕ заводим
  (отложен до роста). PWA `start_url: "/app"`. Cookie входа и языка общие (один origin).
- **Упаковка:** Docker + `docker-compose` (3 сервиса: `landing`, `web`, `db`), nginx — обратный прокси.
- **Next.js** сборка `output: "standalone"` + `outputFileTracingRoot` = корень workspace `development/`
  (иначе монорепо-standalone не дотягивает общие `node_modules`/`@axon/ui`). У обоих приложений.

### Деплой (монорепо, починен 2026-06-22) — РАБОЧИЙ рецепт
- **Два образа** (раздельные юниты), контекст сборки = `development/`:
  - `landing` (`apps/landing/Dockerfile`, Next 16) → порт `127.0.0.1:3001`, nginx отдаёт `/`.
  - `web` (`apps/app/Dockerfile`, Next 15) → порт `127.0.0.1:3000`, nginx отдаёт `/app`,`/login`,`/api`…
  - `db` (postgres). `web` ждёт `db` (healthcheck). Лимиты памяти 256/448/256 (бокс 1 ГБ).
- **`server.js` в standalone** лежит по `apps/<app>/server.js` (из-за `outputFileTracingRoot`) — это путь в CMD.
- ⚠️ **`NEXT_PUBLIC_YM_ID` нужен НА СБОРКЕ** (NEXT_PUBLIC_* впекается в бандл, не рантайм):
  пробрасывается как `build.args` из `.env.production`. **Обязательно вписать его в `.env.production`.**
- **Команда деплоя (с Mac):** `./scripts/deploy-remote.sh` → rsync (исключает `node_modules/.next/.env*/docs`)
  → на сервере `deploy.sh`: `docker compose --env-file .env.production up -d --build` + миграции
  (`prisma migrate deploy`, схема `development/apps/app/prisma`).
- **Перед прод-деплоем — локальная проверка сборки:** `cd development && docker compose -f ../docker-compose.yml config -q`
  и `docker compose -f ../docker-compose.yml --env-file <env> build` (контекст уже `./development`).
- **nginx (черновик, финал — на сервере):** `location / { proxy_pass http://127.0.0.1:3001; }` (лендинг)
  + `location ~ ^/(app|login|register|settings|admin|api|p)(/|$) { proxy_pass http://127.0.0.1:3000; }` (сервис).
  ⚠️ **ОТКРЫТО:** оба Next-приложения отдают ассеты под `/_next/` → коллизия при делении по пути.
  Чистое решение — `basePath:'/app'` на сервисе ИЛИ поддомен `app.` (ADR-010 отложил детали).
  Тонкую маршрутизацию `/app` доводим на сервере; механизм деплоя (образы/compose/скрипты) — готов.
- **`.env` после переезда:** dev — `development/apps/app/.env` (не в git). Прод —
  `.env.production` на сервере в `/var/www/axon-app` (источник правды для секретов; при починке
  деплоя путь/расположение пересмотреть). `.env.deploy` (доступ по SSH) — в корне репо, не в git.

## База данных
- **PostgreSQL** + **Prisma** (ORM). Решение — ADR-003 (доски хранятся как JSON-документ).
- Схема: `prisma/schema.prisma`. Миграции: `prisma/migrations/` (применяются `prisma migrate deploy`).
- Клиент (singleton): `lib/db.ts`.
- **Где какая база:**
  - **dev (локально):** Neon — облачный Postgres (free-tier «засыпает»; будим `npx prisma migrate status`).
  - **prod:** Postgres в `docker-compose` на сервере.
- **Таблицы:** `User`, `Board` (поле `data` — весь холст одним JSON), `ShareLink`, плюс служебные
  Better Auth: `Session`, `Account`, `Verification`.

## Вход в аккаунт (Auth)
- **Библиотека: Better Auth** (email + пароль). Решение — ADR-004. *(НЕ NextAuth — образец урока про неё.)*
- Конфиг: `lib/auth.ts`. Клиент: `lib/auth-client.ts`. API: `app/api/auth/[...all]/route.ts`.
- **Пароли:** хешируются scrypt (дефолт Better Auth) — открытых паролей в базе нет.
- **Сессии:** в БД (таблица `Session`), длительность — дефолт Better Auth (~7 дней).
  Cookie: `HttpOnly` + `Secure` (на HTTPS) + `SameSite=Lax`.
- **Защита роутов:** middleware НЕТ. Приватные страницы проверяют сессию на сервере и редиректят
  (пример: `app/settings/page.tsx` → `if (!session) redirect("/login")`). Доски — через server-actions
  с проверкой владельца (`ownerId`), см. `app/actions/board.ts`.
- **Лимит запросов (от перебора), `lib/auth.ts`:** sign-in 10/60s, sign-up 5/60s,
  запрос сброса 3/60s, сброс 5/60s, общий 100/10s. Реальный IP — из `X-Forwarded-For` (nginx).
- **Удаление аккаунта:** включено (`deleteUser`), каскадом удаляет доски.
- **ENV:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (разные значения в dev и prod).

## Письма
- **Resend** + **React Email**. Решение — ADR-005. Конфиг: `lib/email.ts`, шаблоны: `emails/`.
- Письма: приветствие (регистрация), сброс пароля, «пароль изменён». Язык — по заголовкам запроса.
- Локально без ключа письма НЕ шлются (тихо пропускаются с логом). **ENV:** `RESEND_API_KEY`.
- Отправитель: `noreply@axon-app.ru`. Сбой отправки изолирован — не ломает вход/регистрацию.

## Хранилище файлов
- **Selectel Object Storage** (S3-совместимое). Решение — ADR-006. Код: `lib/storage.ts`.
- Файлы отдаём **через наш домен** (`app/api/files/[...key]`), бакет приватный; открыт только
  префикс `avatars/`. Отдача с `nosniff`/CSP, только image-типы.
- Загрузка аватара: `app/api/avatar` — проверка по magic-bytes, лимит 2 МБ, только для вошедшего.
- **ENV:** `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`.

## Публичные ссылки (шаринг)
- Read-only показ деки по ссылке. Решение — ADR-007. Таблица `ShareLink` (токен, `revoked`).
- Действия владельца (создать/отозвать) — `app/actions/share.ts` (только владелец доски).
- Публичная страница: `app/p/[id]/page.tsx` → `getSharedBoard(token)` (без входа, отдаёт урезанную деку).

## Разбор файлов (CSV/Excel) — в браузере, не на сервере
- CSV/Excel разбираются **в браузере** (`lib/file-parsing`), затем «движок инсайтов»
  (`lib/insight-engine`) собирает из таблицы холст (`BoardData`). На сервер для разбора не грузятся.

## ИИ (Урок 5) — извлечение инсайтов + чат по данным
- **Провайдер-агностичный слой `lib/ai/`** (ADR-008): дефолт **OpenRouter** (Claude для MVP-демо),
  **GigaChat** — опция «после подтверждения руководством». Гибрид: ИИ выбирает колонки/график/нарратив,
  числа считает код. Роуты `app/api/ai/extract` и `app/api/ai/chat` — только для вошедших (гостю 401),
  rate-limit. Разбор: `lib/insight-engine/ai-plan.ts` + `extract.ts`, чат: `lib/ai/chat.ts`.
- **ENV:** `OPENROUTER_API_KEY`, `AI_PROVIDER` (openrouter|gigachat), `AI_MODEL`
  (напр. `anthropic/claude-sonnet-4.6`). Опц. с дефолтами в коде: `AI_RATE_MAX`, `AI_RATE_WINDOW`,
  `AI_TIMEOUT_MS`, `APP_URL`, `GIGACHAT_API_KEY`.
- ⚠️ **ДЕПЛОЙ ИИ-env — ДВЕ точки, обе обязательны** (грабли 2026-06-19): переменную надо
  (1) вписать в серверный `.env.production` И (2) перечислить в `docker-compose.yml → web.environment`.
  Compose прокидывает в контейнер ТОЛЬКО перечисленные переменные — забыли в compose → контейнер
  не видит ключ → ИИ молча не работает, хотя ключ «есть» в `.env.production`.
- **Геоблок OpenRouter с РФ-сервера?** Нет: с Selectel достижим (проверено 2026-06-19, HTTP 200 ~0.2с).

## Мониторинг (uptime) — Урок 5, Шаг 4
- **UptimeRobot** (free) пингует `https://axon-app.ru` каждые 5 мин (HTTP/S). Падение/восстановление →
  **email-алерт (бесплатно)**. Кнопка «Test Notification» в мониторе — проверить доставку.
- **Telegram-алерты — платно** (~$7/мес, платный план UptimeRobot). **Отложено** (решение 2026-06-19):
  подключить позже, если понадобится второй канал; сейчас платить смысла нет — email-алертов достаточно.

## Прочее
- **i18n:** next-intl, RU/EN через cookie.
- **Секреты:** все в `.env*` (в `.gitignore`), в git НЕ попадают.
