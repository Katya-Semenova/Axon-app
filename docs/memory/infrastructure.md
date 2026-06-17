# Инфраструктура Axon

> Памятка: как устроен бэкенд проекта. Обновлено 2026-06-17 (конец Урока 4).
> Решения по каждому пункту — в `docs/decisions/` (ADR-002…007).

## Хостинг и деплой
- **Сервер:** VPS Selectel, домен **axon-app.ru** (HTTPS через Certbot). ADR-002.
- **Упаковка:** Docker + `docker-compose` (приложение + PostgreSQL), nginx — обратный прокси.
- **Next.js** 15.5.18, сборка `output: "standalone"` (для Docker).
- **Деплой:** `./scripts/deploy-remote.sh` (rsync на сервер, **исключает `.env*`**) → на сервере
  `deploy.sh` поднимает `docker compose up` и применяет миграции `npx prisma migrate deploy`.

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

## Прочее
- **i18n:** next-intl, RU/EN через cookie.
- **Секреты:** все в `.env*` (в `.gitignore`), в git НЕ попадают.
