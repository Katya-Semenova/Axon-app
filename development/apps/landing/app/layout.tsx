import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "./_components/CookieConsent";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://axon-app.ru"),
  title: "Axon — Turn raw data into presentation-ready stories",
  description:
    "Axon turns raw spreadsheets into clear charts, insights and presentation-ready slides in minutes — an AI workspace where you tell the story, not the tool.",
  openGraph: {
    // Социальный «крючок» — короче и эмоциональнее, чем SEO-title в шапке.
    title: "From data to story, in minutes",
    siteName: "Axon",
    url: "https://axon-app.ru",
    type: "website",
    locale: "en_US",
    // og:image берётся из app/opengraph-image.png (file-convention) — здесь не дублируем.
  },
  twitter: {
    card: "summary_large_image",
    title: "From data to story, in minutes",
  },
};

// GEO / schema.org — помогает поиску и AI-ассистентам понять, что такое Axon.
// Organization (кто) + SoftwareApplication (что за продукт). FAQPage — отдельно, в page.tsx
// (рядом с видимой секцией FAQ, иначе разметка без контента нарушает правила Google).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Axon",
    url: "https://axon-app.ru",
    logo: "https://axon-app.ru/apple-icon.png",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Axon",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://axon-app.ru/ai-studio",
    description:
      "AI workspace that turns raw spreadsheets into clear charts, insights and presentation-ready slides in minutes.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-inter antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
