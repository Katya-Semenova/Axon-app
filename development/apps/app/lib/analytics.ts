// Тонкая обёртка над Яндекс.Метрикой в сервисе (Урок 6, Задание 3.1).
// Зеркало apps/landing/lib/analytics.ts: тот же счётчик (один домен в проде),
// чтобы воронка «клик на лендинге → регистрация в сервисе» считалась целиком.
// Скрипт грузится только после согласия (см. app/_components/Analytics.tsx).

export const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_ID;

// Согласие хранится тем же ключом, что и баннер лендинга — в проде один origin
// (axon-app.ru + axon-app.ru/ai-studio), localStorage общий.
export const CONSENT_KEY = 'axon_cookie_consent';

export const GOALS = {
  ctaClick: 'cta_click',
  signupStart: 'signup_start', // начало регистрации (отправка формы)
  signupComplete: 'signup_complete', // регистрация прошла успешно
} as const;

type Goal = (typeof GOALS)[keyof typeof GOALS];

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

// Безопасно вызывать всегда: без согласия/счётчика — no-op.
export function trackEvent(goal: Goal): void {
  const id = YM_COUNTER_ID ? Number(YM_COUNTER_ID) : undefined;
  if (!id || typeof window === 'undefined' || typeof window.ym !== 'function') {
    return;
  }
  window.ym(id, 'reachGoal', goal);
}
