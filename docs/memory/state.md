# Состояние проекта (state)

> Где мы сейчас + что осталось. Обновлено 2026-06-17.

## Текущий этап
**Урок 5 (расширяем сервис) — начат. Шаг 1 (ИИ), фича (а) «ИИ-извлечение инсайтов» — код готов.**
Реальный ИИ встал в разъём `ParsedTable → BoardData` рядом с правилами (правила = fallback).
Провайдер-агностичный слой `lib/ai/` (дефолт OpenRouter, GigaChat — опция; [ADR-008](../decisions/ADR-008-ai-provider.md));
гибрид (ИИ выбирает колонки/график/нарратив, числа считает код); только вошедшим; приватность —
шлём схему+выборку, не весь файл; синхронно; fallback на правила при сбое. Файлы: `lib/ai/*`,
`lib/insight-engine/ai-plan.ts` + `extract.ts`, route `app/api/ai/extract`, проводка `LandingPage`/`ChatRail`.
Проверено: `tsc`/`eslint`/`npm run build` чисты, гейт сессии (гость → 401). **Живой путь включается
ключом `OPENROUTER_API_KEY` в `.env.local` (см. `.env.example`).** Следующее в Шаге 1 — живой AI-чат по данным.

**Урок 4 (бэкенд) — завершён.** Сделано: база данных + Prisma, вход в аккаунт (Better Auth:
регистрация/логин/защита/удаление), письма (Resend), хранилище файлов (Selectel S3), разбор
CSV/Excel → инсайты, добавление файла на холст, публичные ссылки `/p/[token]`.

**Проверки пройдены:**
- Смоук сервиса — `docs/audits/persistence-check-2026-06-17.md`.
- Security-check, IDOR на 2 аккаунтах — `docs/audits/security-check-2026-06-17.md`.
- Code-review бэкенда (3 фикса: усечение CSV, евро-числа, сортировка ряда; починен ESLint).

**Готов к Уроку 5:** спецификации экранов + тест-кейсы.

## Бэклог
Полный список — `docs/backlog.md`. Кратко:
- **Фича (отложена):** центр уведомлений in-app — строим, когда появится первое
  асинхронное событие (ИИ-разбор файла). Сейчас уведомлять нечего.
- **UX:** предупреждение об усечении файла; двунаправленная связь инсайт↔датасет.
- **Тулинг:** lint-уборка (36 замечаний в UI), вернуть lint в сборку, обновить @react-email, npm audit.
- **Полировка:** письма, hydration #418, i18n auth-экранов, orphan-аватар при удалении.
- **Уборка (конец урока):** корневой мусор; опц. FSD-рефактор.

## Ключевые файлы
- `prisma/schema.prisma` — схема БД · `lib/db.ts` — Prisma client
- `lib/auth.ts` + `lib/auth-client.ts` — вход · `app/api/auth/[...all]/route.ts`
- `lib/email.ts` + `emails/` — письма · `lib/storage.ts` + `app/api/files`, `app/api/avatar` — файлы
- `app/actions/board.ts`, `app/actions/share.ts` — server-actions (доски, шаринг)
- `app/p/[id]/` — публичная дека · `lib/store.ts` — состояние холста
- `lib/file-parsing/`, `lib/insight-engine/` — разбор файла → холст

## Доступы (ENV — в `.env*`, не в git)
- `DATABASE_URL` — dev: Neon (облако); prod: Postgres в docker (`.env.production`).
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — **разные** в dev и prod.
- `RESEND_API_KEY` — только prod (локально письма не шлём).
- `S3_*` — Selectel Object Storage (endpoint/region/ключи/бакет).
