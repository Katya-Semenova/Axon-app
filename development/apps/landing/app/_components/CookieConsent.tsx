'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { YM_COUNTER_ID, CONSENT_KEY } from '../../lib/analytics';

// Cookie-баннер + consent-gated Яндекс.Метрика (Урок 6, Задание 3.1).
// Метрика грузится ТОЛЬКО после явного «Accept». Решение хранится в localStorage,
// чтобы не спрашивать повторно. Без согласия счётчик не подключается вовсе.
// Язык баннера — по языку браузера (RU/EN), без i18n-фреймворка лендинга: согласие
// показываем русскоязычному по-русски (compliance 2026-06-28). Юр-страницы уже RU.

type Consent = 'accepted' | 'declined';
type Lang = 'ru' | 'en';

const COPY: Record<Lang, {
  aria: string; lead: string; cookiePolicy: string; and: string; privacyPolicy: string; decline: string; accept: string;
}> = {
  ru: {
    aria: 'Согласие на cookie',
    lead: 'Мы используем cookie для обезличенной аналитики, чтобы улучшать Axon. См. ',
    cookiePolicy: 'Политику cookie',
    and: ' и ',
    privacyPolicy: 'Политику конфиденциальности',
    decline: 'Отклонить',
    accept: 'Принять',
  },
  en: {
    aria: 'Cookie consent',
    lead: 'We use cookies for anonymous analytics to improve Axon. See our ',
    cookiePolicy: 'Cookie Policy',
    and: ' and ',
    privacyPolicy: 'Privacy Policy',
    decline: 'Decline',
    accept: 'Accept',
  },
};

export function CookieConsent() {
  // undefined — ещё не прочитали localStorage (SSR/первый кадр); null — решения нет (показать баннер).
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    setConsent(stored === 'accepted' || stored === 'declined' ? stored : null);
    setLang(navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en');
  }, []);

  function decide(value: Consent) {
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
  }

  return (
    <>
      {/* Счётчик — только после согласия и при заданном ID. */}
      {consent === 'accepted' && YM_COUNTER_ID && (
        <Script id="ym-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${Number(YM_COUNTER_ID)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}
        </Script>
      )}

      {/* Баннер — только когда решения ещё нет. */}
      {consent === null && (
        <div
          role="dialog"
          aria-label={COPY[lang].aria}
          className="fixed bottom-0 inset-x-0 z-50 bg-primary text-bg px-6 py-4"
          style={{ boxShadow: '0 -2px 16px rgba(26,39,66,0.18)' }}
        >
          <div className="max-w-[1152px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <p className="font-body text-[13px] leading-relaxed text-bg/85 flex-1">
              {COPY[lang].lead}
              <a href="/cookies" className="text-accent underline underline-offset-2">{COPY[lang].cookiePolicy}</a>
              {COPY[lang].and}
              <a href="/privacy" className="text-accent underline underline-offset-2">{COPY[lang].privacyPolicy}</a>.
            </p>
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => decide('declined')}
                className="font-body text-[13px] font-medium px-5 py-2 rounded-[4px] border border-bg/30 text-bg hover:border-bg/60 transition-colors"
              >
                {COPY[lang].decline}
              </button>
              <button
                type="button"
                onClick={() => decide('accepted')}
                className="font-body text-[13px] font-medium px-5 py-2 rounded-[4px] bg-accent text-primary hover:opacity-90 transition-opacity"
              >
                {COPY[lang].accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
