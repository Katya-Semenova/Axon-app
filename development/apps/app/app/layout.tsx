import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif, Old_Standard_TT } from "next/font/google";
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${oldStandard.variable} antialiased`}
    >
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
