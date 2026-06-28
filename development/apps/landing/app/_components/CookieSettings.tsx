'use client';

import { CONSENT_KEY } from '../../lib/analytics';

// Контрол отзыва согласия на аналитические cookie (compliance, 2026-06-28).
// Сбрасывает решение в localStorage и перезагружает страницу: CookieConsent
// перечитает localStorage и снова покажет баннер, а уже загруженная Метрика
// выгрузится — отзыв согласия так же прост, как его выдача. Ключ — общий (CONSENT_KEY).
export function CookieSettings() {
  function reset() {
    localStorage.removeItem(CONSENT_KEY);
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={reset}
      className="mt-1 inline-flex items-center rounded-[4px] border border-navy/25 px-4 py-2 font-mono text-xs uppercase tracking-widest text-navy transition-colors hover:border-gold hover:text-gold"
    >
      Изменить мой выбор cookie
    </button>
  );
}
