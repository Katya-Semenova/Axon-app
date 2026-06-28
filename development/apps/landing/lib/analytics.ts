// Тонкая обёртка над Яндекс.Метрикой. Сам скрипт счётчика грузится в layout.tsx
// ТОЛЬКО после согласия пользователя (cookie-баннер) — Урок 6, Задание 3.1.
// ID счётчика — в env (NEXT_PUBLIC_YM_ID), не хардкодим.

export const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_ID;

// Ключ согласия на cookie в localStorage. Один источник правды для баннера
// (CookieConsent) и контрола отзыва (CookieSettings) — чтобы ключ не разъехался.
export const CONSENT_KEY = "axon_cookie_consent";

// Ключевые цели лендинга (reachGoal Метрики). Имена держим в одном месте,
// чтобы не разъезжались между местом вызова и настройкой целей в Метрике.
export const GOALS = {
  ctaClick: "cta_click", // клик по «Try Axon free»
  signupStart: "signup_start", // начало регистрации
  signupComplete: "signup_complete", // регистрация завершена
} as const;

type Goal = (typeof GOALS)[keyof typeof GOALS];

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

// Отправить событие в Метрику. Безопасно вызывать всегда: если счётчик ещё не
// загружен (нет согласия) или ID не задан — просто ничего не делает (no-op).
export function trackEvent(goal: Goal): void {
  const id = YM_COUNTER_ID ? Number(YM_COUNTER_ID) : undefined;
  if (!id || typeof window === "undefined" || typeof window.ym !== "function") {
    return;
  }
  window.ym(id, "reachGoal", goal);
}
