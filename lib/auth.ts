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
 * Секрет — BETTER_AUTH_SECRET, адрес — BETTER_AUTH_URL, ключ писем — RESEND_API_KEY.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { resolveLocaleFromHeaders, defaultLocale, type Locale } from "@/i18n/request";
import {
  sendPasswordResetEmail, sendPasswordChangedEmail, sendWelcomeEmail,
} from "@/lib/email";

function localeFrom(headers?: Headers | null): Locale {
  return headers ? resolveLocaleFromHeaders(headers) : defaultLocale;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }, request) => {
      try {
        await sendPasswordResetEmail(user.email, url, localeFrom(request?.headers));
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
