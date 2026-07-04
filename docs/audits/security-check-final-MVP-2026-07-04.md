# Финальный сводный security-check перед MVP v1.0 — 2026-07-04

> Урок 7, Задание 14. Сводит воедино все проверки курса. Метод: свежая сверка кода
> (греп/чтение) + опора на прошлые аудиты (`security-check-2026-06-14/17/19.md`) и
> живые прод-проверки (`docs/test-cases.md`). Правила проекта: `.claude/claude-security-guidance.md`.

## Вердикт: 🟢 критичных проблем НЕТ. MVP можно фиксировать.

## A. Authorization & IDOR — ✅
- Все server-actions досок берут владельца из серверной сессии, чужое → «как 404»
  (`app/actions/board.ts`, 11 проверок ownerId; аудит 06-17 на 2 аккаунтах).
- Админка: `lib/admin.ts` (server-only, `ADMIN_EMAIL` из env, не от клиента); не-админ → 404
  — подтверждено e2e (`tests/e2e/gates.spec.ts`).
- `/storybook` закрыт админ-гейтом на проде (Задание 12, e2e-тест) — сегодня.
- Файлы: `/api/files` отвечает 404 на чужое/неизвестное; path-traversal починен (Урок 6).

## B. Injections — ✅
- SQL — только через Prisma (параметризовано), сырых запросов нет.
- Формульные инъекции заголовков файлов нейтрализуются (`neutralizeFormula`) — покрыто Vitest.
- Prompt-injection ИИ: пользовательский текст — только данные; числа считает код; hardening
  в промптах (аудит 06-19).

## C. XSS — ✅
- React экранирует по умолчанию; `dangerouslySetInnerHTML` в кодовой базе сервиса не используется
  (проверено грепом 06-19; сегодня повторно — чисто).

## D. CSRF — ✅
- Better Auth: SameSite=Lax cookie + origin-check; мутации — server-actions Next
  (встроенная защита origin).

## E. Authentication — ✅
- Пароли: hash (scrypt, Better Auth), plaintext нигде.
- Cookie: HttpOnly + Secure (prod) + SameSite=Lax — e2e проверяет HttpOnly на каждом прогоне;
  Secure сверен вживую на проде (06-24).
- Единый ответ на неверный вход (анти-enumeration) — под e2e-тестом (оба текста сравниваются).
- Rate-limit (`lib/auth.ts`): вход 10/60с, регистрация 5/60с, сбросы 3–5/60с, по реальному IP.

## F. File uploads — ✅
- Лимит 50 МБ, белый список форматов (EC-1), разбор в браузере пользователя;
  S3-ключи только на сервере (`lib/storage.ts`).

## G. Secrets — ✅ (усилено сегодня)
- В git только `.env.example` (проверено `git ls-files` + новый `security-precheck.sh`).
- Ключи ИИ/S3/Resend — только сервер; `NEXT_PUBLIC_*` — только YM_ID (публичный).

## H. HTTP headers — ✅
- `next.config.ts`: X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- HSTS/HTTPS — nginx (Урок 3; серверная зона, из репо не перепроверить — по infrastructure.md).
- CSP — нет (осознанно, в backlog post-launch).

## J. Payments — n/a (платежей нет).

## L. Deployment — ✅ (усилено в Уроке 7)
- Гейты перед выкатом: `security-precheck.sh` (сегодня) → `test:all` (Vitest+e2e) → деплой →
  smoke → записанный откат (`docs/rules/production-safety.md`).
- Боевая база: правило №4 в `AGENTS.md`; бэкапы — infrastructure.md.
- noindex сервиса и публичных дек; robots/sitemap лендинга (Урок 6).

## Модули по урокам — все на месте
| Урок | Модуль | Статус |
|---|---|---|
| 3 | секреты вне git · HTTPS/заголовки · rate limit · firewall | ✅ (+precheck сегодня; nginx/firewall — по журналам Урока 3) |
| 4 | хеш паролей · cookie-флаги · guard роутов · IDOR · серверная валидация | ✅ (cookie+guard под e2e) |
| 5 | админ-гейт · права на файлы · ИИ только вошедшим + лимиты | ✅ |
| 6 | noindex внутренних · cookie-согласие · платежей нет | ✅ |
| 7 | автотесты в гейте (29 Vitest + 5 e2e, зелёные) · боевая база — правило | ✅ |

## «Всегда включено» — восстановлено сегодня (было пропущено в Уроках 3–5)
- ✅ `pre-tool-use-bash.sh` — БЛОКИРУЕТ rm -rf /, migrate reset, DROP/TRUNCATE,
  force-push в main, killall node (проверен вживую — заблокировал собственный тест).
- ✅ `pre-tool-use-write.sh` — БЛОКИРУЕТ запись приватных ключей/живых API-ключей вне `.env*`
  и правку `.env.production` (проверен, exit 2).
- ✅ `scripts/security-precheck.sh` — гейт в `deploy-remote.sh` до тестов (проверен: зелёный).
- ✅ `.claude/claude-security-guidance.md` — правила безопасности проекта (создан).
- Плагина security-guidance (Урок 3) в этом репо не было и нет — его роль закрывают
  хуки выше + правило «security-check при правках auth/api» (принято).

## Post-launch (не критично) — в `docs/security-todo.md` и backlog
CSP · middleware-гейт единым слоем · кастомная 404 · rate-limit жёстче рекомендаций ·
регистрация раскрывает занятый email (принятый компромисс) · роль админа в БД ·
e2e на IDOR/429 · App Map под гейт.
