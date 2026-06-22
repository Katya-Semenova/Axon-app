/**
 * Better Auth — серверная конфигурация (Урок 4, Шаги 5 и 6).
 * Вход по email+паролю. Подтверждение email пока ВЫКЛ (включим после Урока 5).
 * Пароли хешируются библиотекой (scrypt) — в открытом виде в базе их нет.
 *
 * Шаг 6 — письма аккаунта через Resend (lib/email.ts):
 *  - sendResetPassword  → письмо «сброс пароля» со ссылкой;
 *  - onPasswordReset    → уведомление «пароль изменён»;
 *  - databaseHooks.user.create.after → welcome при регистрации.
 * Локаль письма берётся из заголовков запроса (cookie выбора / Accept-Language).
 * Любой сбой отправки изолирован (try/catch) и НЕ ломает вход/регистрацию.
 *
 * Шаг 9 — защита входа: rate-limit на чувствительные эндпоинты (перебор пароля,
 * «бомбинг» письмами сброса). Реальный IP приходит через X-Forwarded-For от nginx.
 * Cookie сессии у Better Auth по умолчанию HttpOnly + Secure (на HTTPS) + SameSite=lax.
 *
 * Секрет — BETTER_AUTH_SECRET, адрес — BETTER_AUTH_URL, ключ писем — RESEND_API_KEY.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { resolveLocaleFromHeaders, defaultLocale, type Locale } from "@/i18n/request";
import {
  sendPasswordResetEmail, sendPasswordChangedEmail, sendWelcomeEmail,
} from "@/lib/email";
import { BASE_PATH } from "@/lib/base-path";

function localeFrom(headers?: Headers | null): Locale {
  return headers ? resolveLocaleFromHeaders(headers) : defaultLocale;
}

/* Дописывает приставку /ai-studio к абсолютной ссылке из письма сброса пароля.
   baseURL у Better Auth — голый домен (см. base-path.ts: Next срезает basePath из входящего
   адреса), поэтому сгенерированная ссылка идёт без /ai-studio и ведёт на лендинг → 404.
   Возвращаем ссылку с префиксом: …/ai-studio/api/auth/reset-password?… */
function withBasePath(absoluteUrl: string): string {
  if (!BASE_PATH) return absoluteUrl;
  try {
    const u = new URL(absoluteUrl);
    if (u.pathname !== BASE_PATH && !u.pathname.startsWith(`${BASE_PATH}/`)) {
      u.pathname = `${BASE_PATH}${u.pathname}`;
    }
    return u.toString();
  } catch {
    return absoluteUrl;
  }
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  /* ── Защита входа (Шаг 9) ─ rate-limit по IP (хранение в памяти, без миграции). ─
     Базовый лимит — мягкий, чувствительные пути — строгие. */
  rateLimit: {
    enabled: true,            // включаем и локально (по умолчанию — только прод)
    window: 10,
    max: 100,
    customRules: {
      "/sign-in/email":          { window: 60, max: 10 }, // перебор пароля
      "/sign-up/email":          { window: 60, max: 5 },  // спам-регистрации
      "/request-password-reset": { window: 60, max: 3 },  // «бомбинг» письмами
      "/forget-password":        { window: 60, max: 3 },
      "/reset-password":         { window: 60, max: 5 },
    },
  },
  user: {
    // Удаление аккаунта (Шаг 7, «Опасная зона»). Без письма-подтверждения —
    // удаляем сразу; на клиенте требуем пароль. Каскад в схеме удалит и доски.
    deleteUser: { enabled: true },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }, request) => {
      try {
        await sendPasswordResetEmail(user.email, withBasePath(url), localeFrom(request?.headers));
      } catch (err) {
        console.error("[auth] sendResetPassword:", err);
      }
    },
    onPasswordReset: async ({ user }, request) => {
      try {
        await sendPasswordChangedEmail(user.email, localeFrom(request?.headers));
      } catch (err) {
        console.error("[auth] onPasswordReset:", err);
      }
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          try {
            await sendWelcomeEmail(user.email, user.name ?? "", localeFrom(context?.headers));
          } catch (err) {
            console.error("[auth] welcome email:", err);
          }
        },
      },
    },
  },
});
