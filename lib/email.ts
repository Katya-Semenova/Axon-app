import "server-only";
import * as React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PasswordReset } from "@/emails/PasswordReset";
import { PasswordChanged } from "@/emails/PasswordChanged";
import { Welcome } from "@/emails/Welcome";
import type { EmailLocale } from "@/emails/Layout";

/**
 * Отправка писем аккаунта через Resend (Урок 4, Шаг 6).
 * Ключ берётся из RESEND_API_KEY (env). Если ключа нет (локальная разработка —
 * письма с Мака не шлём, тестируем на проде) — отправка тихо пропускается с
 * логом, чтобы не ронять регистрацию/сборку.
 */
const FROM = "Axon <noreply@axon-app.ru>";

const SUBJECTS = {
  reset:   { ru: "Сброс пароля Axon",          en: "Reset your Axon password" },
  changed: { ru: "Пароль аккаунта Axon изменён", en: "Your Axon password was changed" },
  welcome: { ru: "Добро пожаловать в Axon",      en: "Welcome to Axon" },
} satisfies Record<string, Record<EmailLocale, string>>;

let _resend: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

async function send(to: string, subject: string, node: React.ReactElement): Promise<void> {
  const client = resend();
  const html = await render(node);
  if (!client) {
    console.warn(`[email] RESEND_API_KEY не задан — письмо «${subject}» для ${to} НЕ отправлено (ок для локальной разработки).`);
    return;
  }
  const { error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) console.error(`[email] не удалось отправить «${subject}» для ${to}:`, error);
}

export function sendPasswordResetEmail(to: string, url: string, locale: EmailLocale): Promise<void> {
  return send(to, SUBJECTS.reset[locale], React.createElement(PasswordReset, { url, locale }));
}

export function sendPasswordChangedEmail(to: string, locale: EmailLocale): Promise<void> {
  return send(to, SUBJECTS.changed[locale], React.createElement(PasswordChanged, { locale }));
}

export function sendWelcomeEmail(to: string, name: string, locale: EmailLocale): Promise<void> {
  return send(to, SUBJECTS.welcome[locale], React.createElement(Welcome, { name, locale }));
}
