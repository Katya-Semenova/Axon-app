import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Instrument_Serif,
  Old_Standard_TT,
  Roboto_Condensed,
  Nunito,
  Mulish,
  Manrope,
  IBM_Plex_Sans,
} from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Analytics } from "./_components/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

// Латиница (EN) — изящный Instrument Serif (без кириллицы).
// adjustFontFallback:false — КРИТИЧНО: иначе next/font добавляет скрытый
// fallback на Times New Roman БЕЗ unicode-range, и он перехватывает кириллицу
// (рисует русский Times-италиком), не давая упасть на Old Standard TT ниже в стеке.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
  adjustFontFallback: false,
});

// Кириллица (RU) — Old Standard TT. В серif-стеке стоит ПОСЛЕ Instrument,
// поэтому русские буквы (которых нет у Instrument) подхватываются им per-glyph.
const oldStandard = Old_Standard_TT({
  variable: "--font-old-standard",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

// --- Шрифтовые пары тем презентации (одна пара на тему, все НЕ Inter) ---
// Подключаются как variable-шрифты (полный диапазон весов), с кириллицей.
// Раскидываются по темам через --slide-font-display/-body в PRESENTATION_THEMES.

// Swiss — конденсный гротеск, контраст веса 900↔300 («постер»).
const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Soft — display: круглый дружелюбный Nunito.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Soft — body: гуманистический Mulish.
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Web/Raycast — display: Manrope.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Web/Raycast — body: модерн-дашборд IBM Plex Sans.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Axon — Data Insights",
  description: "AI agent that turns SQL files into human-friendly data insights.",
  // Весь сервис — приватный (за логином) + публичные деки /p/[token] по приватной
  // ссылке. Ничего из сервиса не должно попадать в поиск. Лендинг (apps/landing)
  // индексируется отдельно. Дубль к robots.txt Disallow (Урок 6, Шаг 3).
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${oldStandard.variable} ${robotoCondensed.variable} ${nunito.variable} ${mulish.variable} ${manrope.variable} ${ibmPlexSans.variable} antialiased`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
