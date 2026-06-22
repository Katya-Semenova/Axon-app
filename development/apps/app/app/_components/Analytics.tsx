'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { YM_COUNTER_ID, CONSENT_KEY } from '@/lib/analytics';

// Consent-gated Яндекс.Метрика в сервисе (Урок 6, Задание 3.1).
// Баннера здесь НЕТ: согласие даётся на лендинге (общий localStorage в проде).
// Если согласия нет — счётчик не грузится, регистрация не трекается (приватно).
export function Analytics() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setAccepted(localStorage.getItem(CONSENT_KEY) === 'accepted');
  }, []);

  if (!accepted || !YM_COUNTER_ID) return null;

  return (
    <Script id="ym-metrika" strategy="afterInteractive">
      {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${Number(YM_COUNTER_ID)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}
    </Script>
  );
}
