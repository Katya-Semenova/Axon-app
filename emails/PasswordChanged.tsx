import * as React from "react";
import { Heading, Link, Text } from "@react-email/components";
import { Layout, COLORS, type EmailLocale } from "./Layout";

/** Уведомление «пароль изменён» (Урок 4, Шаг 6) — отправляется после смены/сброса. */

const T: Record<EmailLocale, {
  preview: string; heading: string; intro: string; warn: string;
}> = {
  ru: {
    preview: "Пароль аккаунта Axon изменён",
    heading: "Пароль изменён",
    intro: "Пароль вашего аккаунта Axon был успешно изменён.",
    warn: "Если это были не вы — немедленно сбросьте пароль и проверьте безопасность почты:",
  },
  en: {
    preview: "Your Axon password was changed",
    heading: "Password changed",
    intro: "The password for your Axon account was successfully changed.",
    warn: "If this wasn’t you, reset your password immediately and check your email security:",
  },
};

export function PasswordChanged({ locale = "en" }: { locale?: EmailLocale }) {
  const t = T[locale];
  const resetUrl = "https://axon-app.ru/forgot-password";
  return (
    <Layout preview={t.preview} locale={locale}>
      <Heading style={{ fontSize: 20, color: COLORS.NAVY, margin: "0 0 16px" }}>{t.heading}</Heading>
      <Text style={{ fontSize: 14, lineHeight: "22px", color: COLORS.NAVY, margin: "0 0 16px" }}>{t.intro}</Text>
      <Text style={{ fontSize: 12.5, lineHeight: "18px", color: COLORS.MUTED, margin: 0 }}>
        {t.warn}<br />
        <Link href={resetUrl} style={{ color: COLORS.GOLD }}>{resetUrl}</Link>
      </Text>
    </Layout>
  );
}

export default PasswordChanged;
PasswordChanged.PreviewProps = { locale: "ru" } as { locale?: EmailLocale };
