# Обновление памяти + save-session (после этапа БД и Auth)

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 04 (обезличено 2026-07-04).

> **Цель:** infrastructure.md дополнен разделами «БД» и «Auth», ADR слоя данных и ADR auth-библиотеки на месте, есть запись в `memory/sessions/`.

---

## Промт

```

1. Обнови docs/memory/infrastructure.md.

Раздел "БД" — добавь:
- ORM: Prisma (или Drizzle) — путь к schema: prisma/schema.prisma
- Миграции: prisma/migrations/, применяются через `npx prisma migrate deploy`
- Singleton client: src/shared/db.ts
- Локальная разработка: SSH-туннель к серверной БД (default) или локальный
  postgres-контейнер

Раздел "Auth" (новый) — добавь:
- Библиотека: better-auth (или NextAuth — по ADR auth-библиотеки)
- Конфиг: src/shared/lib/auth.ts
- API: app/api/auth/[...all]/route.ts
- Сессии: в БД (модель Session), длительность 30 дней, продление при активности
- Cookie: HttpOnly + Secure (prod) + SameSite=Lax
- ENV: NEXTAUTH_SECRET, NEXTAUTH_URL (в .env.local и .env.production)
- Защита роутов: src/middleware.ts (matcher + rate limit + auth-redirect)
- Rate limit: 5/min на /api/auth/*, 3/hour на /api/auth/sign-up

2. Обнови docs/memory/state.md:

- Текущий шаг → "БД и Auth готовы. Готов к следующему этапу: спецификации экранов и тест-кейсы"
- Активный бэклог:
  - docs/01-app-map.md по реальным маршрутам
  - docs/screens/ — spec на ключевые экраны
  - docs/test-cases.md — 3-5 BDD-сценариев на критичные пути
  - post-tool-use-edit hook против хардкода
  - feature-registry.md
- Ключевые файлы — добавь:
  - prisma/schema.prisma — схема БД
  - src/shared/db.ts — Prisma client
  - src/shared/lib/auth.ts — auth-конфиг
- Доступы — добавь:
  - DATABASE_URL в .env.local (через SSH-туннель) и в .env.production (внутри
    docker через имя сервиса db)
  - NEXTAUTH_SECRET в .env.local и .env.production (разные значения!)

3. Закрой сессию.

В Claude Code: /save-session
В Codex / Cursor: "прочитай prompts/save-session.md и выполни"

Параметры:
- slug: db-auth
- описание: "БД и Auth готовы. PostgreSQL в docker-compose, схема по PRD,
  миграции, seed. Моки заменены на Prisma. Better-auth: регистрация, логин,
  защита роутов, IDOR закрыт, базовая безопасность auth.
  Решения: ADR слоя данных (база + ORM), ADR выбора auth-библиотеки."

ПОКАЖИ МНЕ:
- Финальный infrastructure.md (разделы "БД" и "Auth")
- Обновлённый state.md (шаг + бэклог + доступы)
- Запись в INDEX.md в таблице Sessions
```

---

## Edge cases

- Если принято дополнительное решение (например, выбран Drizzle вместо Prisma в последний момент) — пиши новый ADR, не правь старый задним числом. История важна
- Если seed-данные не идеальны — нормально, дальше будем дополнять реальными при тестировании
