# Состояние проекта (state)

> Где мы сейчас + что осталось. Обновлено 2026-06-17.

## Текущий этап
**Урок 5 (расширяем сервис) — Шаг 1 (ИИ) готов: обе фичи (а) извлечение инсайтов и (б) AI-чат по данным.**
Провайдер-агностичный слой `lib/ai/` (дефолт OpenRouter, GigaChat — опция; [ADR-008](../decisions/ADR-008-ai-provider.md)).
- **(а) Извлечение инсайтов:** реальный ИИ в разъёме `ParsedTable → BoardData` рядом с правилами (fallback);
  гибрид (ИИ выбирает колонки/график/нарратив, числа считает код); только вошедшим; приватность (схема+выборка);
  синхронно. Файлы: `lib/ai/*`, `lib/insight-engine/ai-plan.ts` + `extract.ts`, route `app/api/ai/extract`.
- **(б) AI-чат по данным:** в Data-рейле ИИ отвечает словами по сводке доски + «Советник + Построить инсайт»
  (Apply строит новый инсайт на реальных числах через executePlan; правки существующего — руками, не чат);
  только вошедшим; чат хранится в `BoardData` (ADR-003); `sourceTable` в памяти (не персист). Файлы:
  `lib/ai/chat.ts`, route `app/api/ai/chat`, `lib/store.ts` (applyAddInsight/dataChatMessages/sourceTable), `ChatRail.tsx`.

**Проверено живьём** (OpenRouter, dev): загрузка → ИИ строит 5 инсайтов разными графиками на реальных числах;
чат отвечает корректными числами и по «Построй график …» предлагает Apply → новый инсайт ложится на холст (6/6).
`tsc`/`eslint`/`build` чисты, гейт 401. **Живой путь включается ключом `OPENROUTER_API_KEY`** (в `.env`/`.env.local`).
Следующее: починка Donut-`%` (пункт 9c CLAUDE.md). `AI_MODEL=anthropic/claude-sonnet-4.6`.

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
