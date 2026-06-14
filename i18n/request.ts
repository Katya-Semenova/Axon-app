import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Языки приложения. Добавить язык на рост = новый код сюда + файл messages/<код>.json.
export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];

// Fallback, если язык браузера не ru/en (напр. fr) — международный английский.
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "locale";

// Разбираем заголовок Accept-Language ("ru-RU,ru;q=0.9,en;q=0.8") и берём
// первый поддерживаемый язык по убыванию q-веса.
function detectFromAcceptLanguage(accept: string | null): Locale {
  if (!accept) return defaultLocale;
  const ranked = accept
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? parseFloat(qPart.slice(2)) : 1;
      return { lang: tag.toLowerCase().split("-")[0], q: Number.isNaN(q) ? 1 : q };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) {
    if (locales.includes(lang as Locale)) return lang as Locale;
  }
  return defaultLocale;
}

// Приоритет: 1) явный выбор пользователя (cookie) → 2) язык браузера → 3) fallback.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (locales.includes(cookieValue as Locale)) {
    locale = cookieValue as Locale;
  } else {
    const requestHeaders = await headers();
    locale = detectFromAcceptLanguage(requestHeaders.get("accept-language"));
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
