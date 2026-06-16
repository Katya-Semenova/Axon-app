import * as React from "react";
import {
  Body, Container, Head, Hr, Html, Preview, Section, Text,
} from "@react-email/components";

/**
 * Общая «оболочка» писем аккаунта Axon (Урок 4, Шаг 6).
 * Письма верстаются inline-стилями (требование почтовых клиентов) — это
 * сознательное исключение из правила «без хардкода хексов»: токенов Tailwind
 * в почте нет. Бренд-цвета взяты из docs/DESIGN.md.
 */
export type EmailLocale = "ru" | "en";

const NAVY = "#1B2840";
const GOLD = "#B89548";
const PAPER = "#F5F2EA";
const MUTED = "#8A8B87";

const FOOTER: Record<EmailLocale, string> = {
  ru: "Axon — превращает данные в презентацию. Это автоматическое письмо, отвечать на него не нужно.",
  en: "Axon — turns your data into a presentation. This is an automated message, no need to reply.",
};

export function Layout({
  preview, locale, children,
}: { preview: string; locale: EmailLocale; children: React.ReactNode }) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: PAPER, margin: 0, padding: "32px 0", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", backgroundColor: "#FBF9F3", borderRadius: 4, padding: "40px 40px 32px" }}>
          <Section>
            <Text style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.14em", color: NAVY, margin: "0 0 28px", textTransform: "uppercase" }}>
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

export const COLORS = { NAVY, GOLD, PAPER, MUTED };
