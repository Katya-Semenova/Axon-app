"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SlideArchetypeRenderer, deriveSlideSummary } from "@/app/components/presentation/SlideArchetypeRenderer";
import { PRESENTATION_THEMES } from "@/lib/types";
import type { PublicDeck, ColorAccent } from "@/lib/types";

/* Акцентные цвета — те же, что в редакторе (SlideEditor.ACCENT_COLOR). */
const ACCENT: Record<ColorAccent, string> = {
  Navy: "#1B2840", Gold: "#B89548", Slate: "#4A5878", Graphite: "#2A3654",
};

/**
 * Read-only показ публичной деки (Шаг 12). Листание ←/→ (кнопки, точки, клавиши),
 * логотип, счётчик. Слайд рендерим тем же SlideArchetypeRenderer, что и редактор —
 * показ 1-в-1. deck=null или пустая дека → «Презентация недоступна».
 */
export function PublicDeckView({ deck }: { deck: PublicDeck | null }) {
  const t = useTranslations("Public");
  const [i, setI] = useState(0);

  const total = deck?.slides.length ?? 0;
  const go = useCallback(
    (d: number) => setI((c) => Math.max(0, Math.min(total - 1, c + d))),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!deck || total === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-t1">AXON</span>
        <p className="text-[16px] font-medium text-t1">{t("unavailable")}</p>
        <p className="text-[13px] text-t3 max-w-[360px] leading-relaxed">{t("unavailableHint")}</p>
        <Link href="/" className="text-[13px] text-t2 underline underline-offset-4 hover:text-t1 transition-colors">
          {t("backHome")}
        </Link>
      </main>
    );
  }

  const slide = deck.slides[i];
  const ds = slide.dataSetIds[0] ? deck.dataSetsById[slide.dataSetIds[0]] : null;
  const theme = PRESENTATION_THEMES.find((th) => th.id === deck.presentationThemeId) ?? PRESENTATION_THEMES[0];
  /* Заголовок-summary как в редакторе: явный summary слайда или вывод из данных. */
  const summary = slide.summary?.trim() || (ds ? deriveSlideSummary(ds.rows, ds.columns) : "");

  return (
    <main className="h-screen flex flex-col bg-bg" style={theme.vars as React.CSSProperties}>
      {/* Верхняя полоса: логотип + счётчик */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <Link href="/" className="font-mono text-[13px] font-medium tracking-[0.14em] text-t1 hover:opacity-70 transition-opacity">
          AXON
        </Link>
        <span className="font-mono text-[11px] text-t3">{i + 1} / {total}</span>
      </div>

      {/* Слайд — заполняет доступную высоту; SlideArchetypeRenderer меряет родителя */}
      <div className="flex-1 min-h-0 flex items-center justify-center px-6">
        <div
          className="w-full overflow-hidden flex flex-col"
          style={{
            maxWidth: 960, height: "100%", maxHeight: 620,
            background: "var(--slide-bg)",
            border: "1px solid var(--slide-border)",
            borderRadius: "var(--slide-radius)",
            /* Soft theme floats the card; other themes leave this unset → none. */
            boxShadow: "var(--slide-shadow, none)",
          }}
        >
          {/* Block 1: заголовок слайда */}
          {ds?.title && (
            <div style={{ padding: "22px 32px 0", flexShrink: 0 }}>
              <h2 style={{
                margin: 0, fontFamily: "var(--slide-font-display)", color: "var(--slide-title)",
                fontSize: 24, lineHeight: 1.15,
                fontWeight: "var(--slide-title-weight, 500)" as React.CSSProperties["fontWeight"],
              }}>
                {ds.title}
              </h2>
            </div>
          )}
          {/* Block 2: summary-врез — тот же приём, что в редакторе (SlideEditor SummaryBlock):
              приглушённый фон + 4px акцентная вертикаль + заголовочный шрифт. */}
          {summary && (
            <div style={{
              flexShrink: 0,
              margin: "18px 28px 6px",
              background: "var(--slide-muted)",
              borderLeft: "4px solid var(--slide-accent)",
              padding: "14px 20px",
            }}>
              <div style={{
                fontFamily: "var(--slide-font-display)", fontSize: 15.5,
                fontWeight: "var(--slide-body-weight, 500)" as React.CSSProperties["fontWeight"],
                lineHeight: 1.4, color: "var(--slide-title)",
              }}>
                {summary}
              </div>
            </div>
          )}
          {/* Block 3: график */}
          <div style={{ flex: 1, minHeight: 0, padding: "18px 24px 16px" }}>
            <SlideArchetypeRenderer
              rows={ds?.rows ?? []}
              columns={ds?.columns ?? []}
              chartType={ds?.chartType ?? "Lollipop"}
              archetype={slide.archetype ?? "Chart"}
              accentColor={ACCENT[slide.colorAccent] ?? ACCENT.Navy}
              title={ds?.title ?? ""}
              narrative={slide.narrative}
            />
          </div>
        </div>
      </div>

      {/* Навигация: стрелки + точки-прогресс */}
      <div className="flex items-center justify-center gap-5 py-6 shrink-0">
        <button
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label={t("prev")}
          className="w-9 h-9 flex items-center justify-center border border-border rounded-sm text-t2 hover:border-gold-500 hover:text-gold-500 disabled:opacity-30 disabled:hover:border-border disabled:hover:text-t2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 7l5 5" /></svg>
        </button>
        <div className="flex items-center gap-2">
          {deck.slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`${idx + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${idx === i ? "bg-t1" : "bg-border hover:bg-t3"}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          disabled={i === total - 1}
          aria-label={t("next")}
          className="w-9 h-9 flex items-center justify-center border border-border rounded-sm text-t2 hover:border-gold-500 hover:text-gold-500 disabled:opacity-30 disabled:hover:border-border disabled:hover:text-t2 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2l5 5-5 5" /></svg>
        </button>
      </div>
    </main>
  );
}
