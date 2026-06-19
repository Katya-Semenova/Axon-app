# INDEX — решения проекта Axon

> Оглавление «памяти» проекта. ADR (записи об архитектурных решениях) живут в этой
> же папке `docs/decisions/`. Разделы findings и sessions появятся в следующих уроках.

## ADR — архитектурные решения

| # | Решение | Статус | Дата |
|---|---------|--------|------|
| [ADR-001](ADR-001-deploy-strategy.md) | Стратегия деплоя (Vercel) | ⚠️ Superseded → ADR-002 | 2026-06-14 |
| [ADR-002](ADR-002-hosting-migration.md) | Переезд хостинга на VPS Selectel (Docker+nginx+домен) | ✅ Выполнено | 2026-06-14 |
| [ADR-003](ADR-003-data-layer.md) | Слой данных: свой PostgreSQL + Prisma + доски как документы (JSON) | ✅ Принято | 2026-06-16 |
| [ADR-004](ADR-004-auth-library.md) | Библиотека авторизации — Better Auth (email+пароль) | ✅ Принято | 2026-06-16 |
| [ADR-005](ADR-005-email-provider.md) | Письма аккаунта — Resend + React Email | ✅ Принято | 2026-06-16 |
| [ADR-006](ADR-006-file-storage.md) | Хранилище файлов — Selectel Object Storage (S3) | ✅ Принято | 2026-06-16 |
| [ADR-007](ADR-007-sharing.md) | Публичная ссылка на презентацию (ShareLink + `/p/[token]`, read-only) | ✅ Принято | 2026-06-17 |
| [ADR-008](ADR-008-ai-provider.md) | ИИ в продукте — провайдер-агностичный слой (`lib/ai/`), дефолт OpenRouter, GigaChat — опция | ✅ Принято | 2026-06-17 |

## Findings — находки
_(появятся в следующих уроках)_

## Sessions — журнал сессий

| Дата | Сессия | Итог |
|------|--------|------|
| [2026-06-17](sessions/2026-06-17-urok-04.md) | Урок 4 — бэкенд | БД+Auth+письма+хранилище+разбор файлов+шаринг; смоук/security/review пройдены |
| [2026-06-17](sessions/2026-06-17-urok-05-step1.md) | Урок 5, Шаг 1 — ИИ | Агностичный lib/ai (OpenRouter); ИИ-извлечение инсайтов + AI-чат (Q&A+Apply); Donut % (9c); проверено живьём |
| [2026-06-19](sessions/2026-06-19-urok-05-step2-deploy.md) | Урок 5 — деплой + админка + security | Приёмка ИИ + 4 фикса; деплой на прод (грабли ИИ-env в compose); админка v1 read-only по ADMIN_EMAIL; security-check (критичных нет) |
