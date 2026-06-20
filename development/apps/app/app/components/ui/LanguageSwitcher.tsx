"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/request";
import { NAVY, BORDER, T2 } from "./tokens";

/**
 * Переключатель языка RU / EN — сегментированный тоггл в стиле кита
 * (мирорит ModeToggle: активная половина — navy с тёмным текстом, неактивная —
 * прозрачная). Пишет выбор в cookie через серверное действие и обновляет страницу.
 */
const OPTIONS: { value: Locale; label: string }[] = [
  { value: "ru", label: "RU" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        padding: 2,
        background: "transparent",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        letterSpacing: "0.06em",
        userSelect: "none",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => change(opt.value)}
            style={{
              padding: "4px 10px",
              borderRadius: 4,
              border: "none",
              cursor: active ? "default" : "pointer",
              background: active ? NAVY : "transparent",
              color: active ? "#F5F2EA" : T2,
              fontWeight: active ? 500 : 400,
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
