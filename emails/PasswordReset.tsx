import * as React from "react";
import { Button, Heading, Link, Text } from "@react-email/components";
import { Layout, COLORS, headingStyle, type EmailLocale } from "./Layout";

/** Письмо сброса пароля (Урок 4, Шаг 6). url — ссылка от Better Auth с токеном. */

const T: Record<EmailLocale, {
  preview: string; heading: string; intro: string; button: string;
  ignore: string; expires: string; fallback: string;
}> = {
  ru: {
    preview: "Сброс пароля Axon",
    heading: "Сброс пароля",
    intro: "Мы получили запрос на сброс пароля для вашего аккаунта Axon. Нажмите кнопку ниже, чтобы задать новый пароль.",
    button: "Задать новый пароль",
    ignore: "Если вы не запрашивали сброс — просто проигнорируйте это письмо, пароль останется прежним.",
    expires: "Ссылка действует 1 час.",
    fallback: "Если кнопка не работает, скопируйте ссылку в браузер:",
  },
  en: {
    preview: "Reset your Axon password",
    heading: "Reset your password",
    intro: "We received a request to reset the password for your Axon account. Click the button below to set a new password.",
    button: "Set a new password",
    ignore: "If you didn’t request this, just ignore this email — your password will stay the same.",
    expires: "This link is valid for 1 hour.",
    fallback: "If the button doesn’t work, copy this link into your browser:",
  },
};

export function PasswordReset({ url, locale = "en" }: { url: string; locale?: EmailLocale }) {
  const t = T[locale];
  return (
    <Layout preview={t.preview} locale={locale}>
      <Heading style={headingStyle}>{t.heading}</Heading>
      <Text style={{ fontSize: 14, lineHeight: "22px", color: COLORS.NAVY, margin: "0 0 24px" }}>{t.intro}</Text>
      <Button href={url} style={{ backgroundColor: COLORS.NAVY, color: COLORS.PAPER, fontSize: 14, fontWeight: 600, padding: "12px 24px", borderRadius: 4, textDecoration: "none", display: "inline-block" }}>
        {t.button}
      </Button>
      <Text style={{ fontSize: 12.5, lineHeight: "18px", color: COLORS.MUTED, margin: "24px 0 4px" }}>{t.expires}</Text>
      <Text style={{ fontSize: 12.5, lineHeight: "18px", color: COLORS.MUTED, margin: "0 0 16px" }}>{t.ignore}</Text>
      <Text style={{ fontSize: 12, lineHeight: "18px", color: COLORS.MUTED, margin: 0 }}>
        {t.fallback}<br />
        <Link href={url} style={{ color: COLORS.GOLD_300, wordBreak: "break-all" }}>{url}</Link>
      </Text>
    </Layout>
  );
}

export default PasswordReset;
PasswordReset.PreviewProps = { url: "https://axon-app.ru/reset-password?token=preview-token", locale: "ru" } as {
  url: string; locale?: EmailLocale;
};
