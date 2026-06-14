import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Языки приложения. Добавить язык на рост = новый код сюда + файл messages/<код>.json.
export const locales = ["ru", "en"] as const;
export type Locale = (typeof locales)[number];

// Дефолт — русский (аудитория в основном из РФ; см. spec.md → Мультиязычность).
export const defaultLocale: Locale = "ru";
export const LOCALE_COOKIE = "locale";

// Без локали в URL: язык берём из cookie (см. ADR — простой вариант с заделом на рост).
export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieValue = store.get(LOCALE_COOKIE)?.value;
  const locale: Locale = locales.includes(cookieValue as Locale)
    ? (cookieValue as Locale)
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
