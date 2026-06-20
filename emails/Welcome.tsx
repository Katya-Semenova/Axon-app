import * as React from "react";
import { Button, Heading, Text } from "@react-email/components";
import { Layout, COLORS, headingStyle, type EmailLocale } from "./Layout";

/** Приветственное письмо после регистрации (Урок 4, Шаг 6). */

const T: Record<EmailLocale, {
  preview: string; heading: (name: string) => string; intro: string;
  body: string; button: string;
}> = {
  ru: {
    preview: "Добро пожаловать в Axon",
    heading: (name) => `Добро пожаловать, ${name}!`,
    intro: "Спасибо, что присоединились к Axon — инструменту, который превращает ваши данные в готовую презентацию.",
    body: "Загрузите файл с данными — и получите холст с инсайт-карточками, из которых соберёте слайды. Весь путь от файла до показа проходит очень быстро.",
    button: "Открыть Axon",
  },
  en: {
    preview: "Welcome to Axon",
    heading: (name) => `Welcome, ${name}!`,
    intro: "Thanks for joining Axon — the tool that turns your data into a ready-to-present deck.",
    body: "Drop a data file and get a canvas of insight cards to build slides from. The path from file to presentation is fast.",
    button: "Open Axon",
  },
};

export function Welcome({ name = "", locale = "en" }: { name?: string; locale?: EmailLocale }) {
  const t = T[locale];
  const displayName = name.trim() || (locale === "ru" ? "друг" : "there");
  return (
    <Layout preview={t.preview} locale={locale}>
      <Heading style={headingStyle}>{t.heading(displayName)}</Heading>
      <Text style={{ fontSize: 14, lineHeight: "22px", color: COLORS.NAVY, margin: "0 0 16px" }}>{t.intro}</Text>
      <Text style={{ fontSize: 14, lineHeight: "22px", color: COLORS.NAVY, margin: "0 0 24px" }}>{t.body}</Text>
      <Button href="https://axon-app.ru" style={{ backgroundColor: COLORS.NAVY, color: COLORS.PAPER, fontSize: 14, fontWeight: 500, padding: "12px 24px", borderRadius: 4, textDecoration: "none", display: "inline-block" }}>
        {t.button}
      </Button>
    </Layout>
  );
}

export default Welcome;
Welcome.PreviewProps = { name: "Катя", locale: "ru" } as { name?: string; locale?: EmailLocale };
