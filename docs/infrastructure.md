# Infrastructure — Axon

> Снимок production-инфраструктуры. Обновлять при крупных изменениях.
> Пароли/ключи сюда НЕ писать — здесь только адреса, имена, пути, структура.
> Снимок под реальность Axon (хостинг-платформа Vercel, БЕЗ своего сервера) —
> VPS/nginx/Docker из шаблона урока не применяются.

## Обзор (одной строкой)
Чистый фронтенд на Next.js, задеплоен на **Vercel** с авто-сборкой по push в `main`.
Своего сервера, БД, бэкенда и секретов **нет** (на 2026-06-14). Стратегия — [ADR-001](decisions/ADR-001-deploy-strategy.md).

## Хостинг (Vercel)
- Платформа: **Vercel** (сборка + CDN + HTTPS «из коробки»)
- Прод-URL: https://axon-app-chi.vercel.app/
- Источник деплоя: ветка `main` репозитория на GitHub (авто-деплой по push)
- Сборка: `next build` (Next.js 15.5.18), пакетный менеджер — npm (`package-lock.json`)
- Регион/название проекта/команда в Vercel: смотреть в дашборде Vercel (Project → Settings)
- HTTPS: автоматический (Vercel managed), HSTS Vercel ставит сам

## Код (GitHub)
- Репозиторий: `git@github.com:Katya-Semenova/Axon-app.git` (доступ по SSH)
- Главная ветка (= прод): `main`
- Прочие ветки: `feature/disruptive-visual`, `feature/new-concept` (рабочие, не в проде)
- История = единственный бэкап кода (отдельных бэкапов кода не держим — git/GitHub достаточно)

## Структура проекта (локально/в репо)
```
axon-app/
├── app/                ← Next.js App Router (страницы, компоненты) — в КОРНЕ, не src/
│   ├── components/ui/  ← дизайн-система (кит компонентов)
│   └── ...
├── lib/                ← types, store (Zustand), charts, mockData
├── docs/               ← вся документация (spec, PRD, DESIGN, architecture, audits, decisions)
├── next.config.ts      ← конфиг: оптимизация картинок + security-заголовки
├── package.json
└── .gitignore          ← прячет .env*, .vercel, node_modules, .next
```

## Деплой-флоу
```
правка кода → next build (локальная проверка) → git commit → git push origin main
                                                                      ↓ (авто)
                                          Vercel пересобирает (~1 мин) → live
```
- Деплой запускается **сам** при push в `main` (подтверждено рабочим 2026-06-14, ~45 сек до live).
- Перед push — ворота: проверка сборки + `/security-check`.

## Безопасность
- HTTP security-заголовки заданы в `next.config.ts` (`headers()`):
  X-Frame-Options: DENY, X-Content-Type-Options: nosniff,
  Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo off).
- HSTS (Strict-Transport-Security) — добавляет Vercel автоматически.
- CSP — отложен (для Next нужен nonce). Бэклог.
- Последний аудит: [docs/audits/security-check-2026-06-14.md](audits/security-check-2026-06-14.md) — 🔴=0.

## Секреты / переменные окружения
- **Сейчас НЕТ ни одного.** Нет бэкенда/БД/auth; «AI» = `lib/mockData.ts` (демо на клиенте).
- Когда появятся (реальный AI/auth/БД): значения → **Vercel → Settings → Environment Variables**
  + запасная копия в **Bitwarden** (НЕ iCloud, НЕ git). Завести `.env.example` (шаблон без значений).
  См. [architecture.md](architecture.md) → «Секреты».

## Откат (rollback)
- Быстрый: дашборд Vercel → Deployments → выбрать прошлый успешный → «Promote to Production».
- Через git: `git revert <commit>` → `git push origin main` (Vercel пересоберёт прошлое состояние).
- Подстраховка: если сборка падает, Vercel оставляет живой прошлый деплой (сломанное не выкатывается).

## Что добавится дальше (когда появится бэкенд)
- Реальный AI (напр. GigaChat), БД, авторизация → секреты, env-переменные, возможно отдельный раздел «БД».
- Кастомный домен (вместо `*.vercel.app`) → настройка DNS в Vercel.
- Опционально CI/CD (GitHub Actions) при появлении тестов.
