# Security check — Axon — 2026-06-14

> Урок 3, Шаг 4. Аудит как «ворота» перед первым осознанным деплоем на Vercel.
> Проверки **реальные** (grep по коду, git-история, `curl -I` живого прода), не теоретические.
> Структура разделов — из `security-checklist.md` (14 разделов OWASP-style фэшн-скилла),
> применена к реальности Axon (чистый фронтенд на Vercel, без бэкенда).

## Критерий ворот: 🔴 = 0 → **ПРОЙДЕНО**. Публиковать безопасно.

## Таблица: раздел × статус

| # | Раздел | Статус | Что проверено по факту |
|---|--------|--------|------------------------|
| A | Authorization & IDOR | ⚪ N/A | Нет бэкенда/API-роутов/сессий — авторизовывать нечего |
| B | Inputs & Injection | ⚪ N/A | Нет БД и серверного ввода (ноль `fetch` наружу, ноль `process.env`) |
| C | XSS | ⚠️ backlog | 1× `dangerouslySetInnerHTML` в `/storybook` на **захардкоженных строках разработчика** (с `<code>`); пользовательского ввода нет → **не эксплуатируется** |
| D | CSRF | ⚪ N/A | Нет cookie-сессий и серверных мутаций |
| E | Auth / Sessions | ⚪ N/A | Авторизации нет (прототип) |
| F | File uploads | ⚪ N/A | Dropzone есть в UI, но файлы на сервер не уходят (нет `fetch`/API) — обработка клиентская/мок |
| G | Secrets | ✅ | `.env` ни разу не в git-истории (0 коммитов); `git grep` секретов — чисто; `.gitignore` покрывает `.env*` и `.vercel`; ноль `process.env` |
| H | HTTP security headers | ✅ (починено) | HSTS Vercel ставит сам; X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy добавлены в `next.config.ts` (`headers()`). CSP — отложен (нужен nonce для Next) |
| I | Body size & timeouts | ⚪ N/A | Своего сервера/nginx нет — лимиты управляются Vercel |
| J | Webhooks / Payments | ⚪ N/A | Нет |
| K | Rate limiting | ⚪ N/A | Нет API/`middleware.ts`; статичный фронт |
| L | Deployment hardening | ✅ / ⚪ | Vercel-managed (TLS, non-root, инфра-хардинг — платформа); Docker/UFW/SSH/fail2ban N/A; бэкапить `.env` нечего (его нет) |
| M | Production-конфиг | ✅ | `next.config.ts` без `ignoreBuildErrors` / отключённого eslint/ts |
| N | Архитектурные ловушки | ✅ | Критичного нет. Инфо: `/storybook` публичен в проде (витрина дизайн-системы, без секретов/админки — приемлемо) |

## Находки

### 🔴 Критичные (чинить до деплоя)
**Нет.** Ворота пройдены.

### ✅ Починено в этом аудите
1. **H — security-заголовки добавлены** в `next.config.ts` (`headers()`):
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation off).
   CSP — отложен (для Next нужен nonce, иначе ломает inline-стили). Проверить `curl -I` после деплоя.

### ⚠️ Backlog (не блокеры)
2. **C — убрать `dangerouslySetInnerHTML`** в `app/storybook/page.tsx:225` (`DecisionList`).
   Сейчас безопасно (только статичные строки), но паттерн лучше заменить — гигиена на будущее.

## Вывод
Axon — чистый фронтенд без секретов, БД, auth и серверного ввода. Класс атак,
связанных с бэкендом (A–F, I–K), физически отсутствует. Секреты чисты, прод-конфиг
без послаблений, HTTPS+HSTS на проде уже есть. **🔴 = 0 — деплоить безопасно.**
Два ⚠️-пункта — улучшения «по желанию», не блокеры.
