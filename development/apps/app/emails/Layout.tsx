import * as React from "react";
import {
  Body, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";

/**
 * Общая «оболочка» писем аккаунта Axon (Урок 4, Шаг 6).
 * Письма верстаются inline-стилями (требование почтовых клиентов) — это
 * сознательное исключение из правила «без хардкода хексов»: токенов Tailwind
 * в почте нет. Бренд-цвета и заголовок-сериф взяты из docs/DESIGN.md
 * (заголовок = как в модальном окне: font-serif 24px, navy).
 *
 * Тёмная тема: принудительно светлая схема (color-scheme: light + мета-теги),
 * чтобы почтовые клиенты НЕ инвертировали навы-текст/кнопки в невидимые на
 * тёмном фоне. Наш «бумажный» editorial-вид сохраняется везде.
 */
export type EmailLocale = "ru" | "en";

const NAVY = "#1B2840";
const GOLD = "#B89548";      // gold-500
const GOLD_300 = "#C9A961";  // акцент ссылок — как в Storybook
const PAPER = "#F5F2EA";
const MUTED = "#8A8B87";

// Сериф-стек: латиница Instrument Serif / кириллица Old Standard TT, фолбэк Georgia.
const SERIF = '"Instrument Serif", "Old Standard TT", Georgia, "Times New Roman", serif';
// Моно-стек логотипа (как в приложении — JetBrains Mono); фолбэк для почты.
const MONO = '"JetBrains Mono", "Courier New", Courier, monospace';

/** Стиль заголовка письма — как у заголовка модалки, увеличен на 20% (24→29px). */
export const headingStyle: React.CSSProperties = {
  fontFamily: SERIF,
  fontSize: 29,
  lineHeight: 1.375,
  fontWeight: 400,
  color: NAVY,
  margin: "0 0 16px",
};

const FOOTER: Record<EmailLocale, string> = {
  ru: "Axon — превращает данные в презентацию. Это автоматическое письмо, отвечать на него не нужно.",
  en: "Axon — turns your data into a presentation. This is an automated message, no need to reply.",
};

export function Layout({
  preview, locale, children,
}: { preview: string; locale: EmailLocale; children: React.ReactNode }) {
  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: PAPER, colorScheme: "light", margin: 0, padding: "32px 0", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#FBF9F3", borderRadius: 4, padding: "40px 40px 32px" }}>
          <Section>
            <Text style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: "0.14em", color: NAVY, margin: "0 0 28px", textTransform: "uppercase" }}>
              AXON
            </Text>
          </Section>
          {children}
          <Hr style={{ borderColor: "#D9D3C2", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: 11.5, lineHeight: "16px", color: MUTED, margin: 0 }}>
            {FOOTER[locale]}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const COLORS = { NAVY, GOLD, GOLD_300, PAPER, MUTED };
