"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, locales, type Locale } from "./request";

// Переключение языка: пишем выбор в cookie. Дальше клиент делает router.refresh(),
// и getRequestConfig перечитывает язык из этой cookie.
export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 год
    sameSite: "lax",
  });
}
