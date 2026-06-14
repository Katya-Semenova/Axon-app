"use client";

import * as React from "react";
import { BackButton } from "./BackButton";
import { useTranslations } from "next-intl";

/**
 * DesktopOnlyNotice — экран-заглушка для воркспейса на узких экранах (<lg / 1024px).
 *
 * Воркспейс Axon (холст + drag-and-drop + AI-чат) рассчитан на десктоп —
 * как Figma/Miro. Вместо «сжатого» десктопного интерфейса на телефоне/планшете
 * показываем честное объяснение и кнопку возврата к проектам.
 *
 * Поведение: `fixed inset-0 lg:hidden` — перекрывает воркспейс ТОЛЬКО ниже lg
 * и исчезает на широком экране. Десктопная поверхность под ним не размонтируется
 * (чисто аддитивно, ничего не ломаем). На токенах, без хардкод-хексов.
 */
export interface DesktopOnlyNoticeProps {
  /** Возврат на главную / к списку проектов. */
  onBack?: () => void;
}

export function DesktopOnlyNotice({ onBack }: DesktopOnlyNoticeProps) {
  const t = useTranslations("Desktop");
  return (
    <div className="fixed inset-0 z-40 lg:hidden flex flex-col bg-bg">
      {/* Шапка — wordmark */}
      <div className="flex items-center px-5 h-[52px] border-b border-border shrink-0">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-t1">AXON</span>
      </div>

      {/* Центр — сообщение */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-5">
        {/* Иконка «монитор» — контур на токенах */}
        <svg
          width="44" height="44" viewBox="0 0 44 44" fill="none"
          stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
          className="text-t3"
          aria-hidden="true"
        >
          <rect x="6" y="8" width="32" height="22" rx="2" />
          <path d="M16 36h12M22 30v6" />
        </svg>

        <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-t3">
          {t("workspace")}
        </div>

        <h1 className="font-display text-[27px] leading-tight text-t1 max-w-[18ch]">
          {t("title")}
        </h1>

        <p className="text-[13.5px] leading-relaxed text-t2 max-w-[34ch]">
          {t("body")}
        </p>

        {onBack && (
          <div className="pt-1">
            <BackButton onClick={onBack}>{t("backToProjects")}</BackButton>
          </div>
        )}
      </div>
    </div>
  );
}
