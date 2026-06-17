# Security checklist — Axon

> Растущий чек-лист безопасности. Пополняется каждый этап.
> Последний прогон: [audits/security-check-2026-06-17.md](audits/security-check-2026-06-17.md) (Урок 4, Шаг 13 — auth/IDOR/сессии/инъекции).
> `[x]` — проверено и закрыто · `[ ]` — открыто / проверить на сервере / бэклог.

## A. Authorization & IDOR
- [x] Каждое серверное действие с ресурсом проверяет сессию
- [x] `entity.ownerId === session.user.id` на ресурсах с владельцем (boards, share)
- [x] `ownerId`/`userId` берётся ТОЛЬКО из серверной сессии, не от клиента
- [x] Чужой/несуществующий ресурс → «не найдено» (без утечки существования)
- [x] Публичные данные (share-дека) урезаны — без инсайтов/связей/позиций
- [x] Эмпирический 2-аккаунт IDOR-тест (2026-06-17): `getBoard`/`saveBoard` чужой доски под B → `null`/`false`, данные нетронуты

## B. Inputs & Injection
- [x] Только Prisma query-builder, без raw SQL (`$queryRaw`/`Unsafe` — нет)
- [x] Нет mass-assignment (явные поля, не `data: req.body`)
- [x] CSV/формулы нейтрализуются (`neutralizeFormula` в insight-engine)
- [x] Нет `dangerouslySetInnerHTML` — рендер через React (автоэкранирование)

## D. CSRF
- [x] cookie сессии `SameSite=Lax`
- [x] Server Actions — встроенная Origin/Host-защита (Next 15)
- [x] Better Auth — встроенная CSRF на /api/auth/*
- [x] POST-роут аватара полагается на SameSite (cross-site POST не шлёт cookie)

## E. Authentication / Sessions
- [x] Хеш паролей — scrypt (Better Auth, memory-hard ≈/сильнее bcrypt-12)
- [x] Сессии в БД с `expiresAt` (модель Session)
- [x] cookie `HttpOnly` + `Secure`(HTTPS) + `SameSite=Lax`
- [x] Rate-limit /api/auth/*: sign-in 10/60s, sign-up 5/60s, reset 3/60s
- [x] login / forgot-password — без user-enumeration (общий ответ / всегда успех)
- [ ] sign-up раскрывает «email занят» — принятый компромисс / TODO при необходимости
- [ ] rate-limit in-memory → внешний стор, если когда-то >1 инстанса

## F. File uploads
- [x] avatar: magic-bytes (PNG/JPEG/WEBP) + лимит 2МБ + сессия + ключ от `userId`
- [x] отдача файлов с `nosniff`/CSP/sandbox + image-allowlist (`/api/files`)
- [x] CSV/xlsx — лимит 50МБ, разбор в браузере (на сервер не грузятся)

## G. Secrets
- [x] `.env` / `.env.local` в `.gitignore`
- [x] Нет хардкода секретов в коде (`secret:` берётся из `process.env`)
- [] **прод:** `BETTER_AUTH_SECRET` ≥ 32 байт, ≠ dev, не дефолт (проверить на сервере)

## H. HTTP headers
- [x] X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (`next.config.ts`)
- [ ] HSTS — ставит nginx/Certbot на проде (проверить)
- [ ] CSP на HTML-страницы (на будущее; сейчас CSP только на `/api/files`)

## L. Deployment / Infra (проверять на сервере)
- [ ] `DATABASE_URL` прод = Selectel (не dev-Neon)
- [ ] Postgres 5432 закрыт UFW
- [ ] SSH-ключи / fail2ban
- Детали → [memory/infrastructure.md](memory/infrastructure.md)

## Прочее (наблюдения, не критично)
- [ ] `/storybook` публично доступен в проде — данных нет, но внутрянка; гейт/убрать
- [ ] share-token = `cuid` (неугадываем на практике); при необходимости → crypto-random
