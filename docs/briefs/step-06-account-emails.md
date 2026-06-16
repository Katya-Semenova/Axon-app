# Бриф — Шаг 6: письма аккаунта (Resend + React Email)

> Урок 4 (Бэкенд), Шаг 6. Процесс: `/new-feature`. Сложность: **COMPLEX** (новые зависимости + секрет + auth-flow + новые роуты, без миграции БД). Дата: 2026-06-16.

## Намерение
Подключить письма аккаунта: **сброс пароля** (закрыть «забыл пароль»), уведомление **«пароль изменён»**, **welcome** при регистрации. Подтверждение email — **выкл** (после Урока 5). Письма **RU/EN по локали**, отправитель **Axon <noreply@axon-app.ru>**.

## Решения (из интервью)
- Подтверждение email (verify-email): **не сейчас**, после Урока 5.
- Набор писем: **сброс пароля + «пароль изменён» + welcome** (verify-email и magic-link — нет).
- Язык: **RU + EN по локали** пользователя.
- Отправитель: **Axon <noreply@axon-app.ru>**.

## Что построено
- **Resend + React Email**: пакеты `resend`, `react-email`, `@react-email/components`, `@react-email/render`. Шаблоны `emails/` (Layout + PasswordReset + PasswordChanged + Welcome), двуязычные. Скрипт `npm run email:dev` для превью.
- `lib/email.ts` — клиент Resend (ленивый; без ключа — тихий пропуск) + `sendPasswordResetEmail / sendPasswordChangedEmail / sendWelcomeEmail`.
- `lib/auth.ts` — колбэки `sendResetPassword`, `onPasswordReset`, `databaseHooks.user.create.after`; локаль из заголовков; отправка в try/catch.
- `i18n/request.ts` — экспорт `resolveLocaleFromHeaders`.
- Экраны `app/forgot-password` (нейтральный ответ) и `app/reset-password?token=`; ссылка «Забыли пароль?» на `/login`.
- `.env.example` — `RESEND_API_KEY=` (пустой плейсхолдер) + комментарий; `package.json` — `email:dev`.
- Доки: `spec.md`, `infrastructure.md`, **ADR-005**, `INDEX.md`, `security-todo.md`.

## За рамками
verify-email (после Урока 5); rate-limit `/api/auth/*` против бомбинга (Шаг 9); полный i18n auth-экранов (общий долг — пока RU-хардкод как у login/register).

## Крайние случаи
Несуществующий email → тот же нейтральный ответ; протухший/битый токен → понятная ошибка + «запросить новую»; сбой Resend → не ломает регистрацию (try/catch + лог); нет ключа локально → отправка пропускается с предупреждением.

## Чеклист ревью
- [x] Ключ только в env, не в коде/чате/git (в логах не светится)
- [x] `/forgot-password` не раскрывает наличие аккаунта
- [x] Сброс/смена → письмо «пароль изменён»
- [x] Сбой Resend не ломает регистрацию/вход
- [x] Письма RU/EN по локали
- [x] `npx tsc --noEmit` чистый; `next build` успешный

## Верификация
`tsc` чистый, `next build` успешный (роуты forgot/reset собрались, шаблоны скомпилировались; `BetterAuthError: default secret` — лишь локальное предупреждение, секрет только на сервере). Превью писем — `npm run email:dev`. **Реальная отправка проверяется на проде** после деплоя и после того, как `RESEND_API_KEY` вписан в серверный `.env.production`: «забыл пароль» → письмо → ссылка → новый пароль → письмо «пароль изменён»; регистрация → welcome.
