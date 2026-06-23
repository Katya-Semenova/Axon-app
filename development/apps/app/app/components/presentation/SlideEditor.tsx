"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { SlideViewDropdown } from "../ui/SlideViewDropdown";
import { SlideArchetypeRenderer, deriveSlideSummary } from "./SlideArchetypeRenderer";
import type { Slide, ColorAccent, BuildAudience, BuildTone, NarrationMode, SlideArchetype } from "@/lib/types";
import { PRESENTATION_THEMES, WEB_THEME_IDS } from "@/lib/types";
import type { PresentationThemeId } from "@/lib/types";
import { BORDER, NAVY, GOLD, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";
import { openOnboarding } from "../ui/OnboardingModal";
import { useTranslations } from "next-intl";

/* ── Speaker narrative — 2–4 sentence first-person prose derived from
   the slide's title + data summary. Replaces the per-tone variants in
   BuildMode that lived behind the old PRESENT overlay. The user can
   override by clicking the block and editing inline. */
function deriveSpeakerNarrative(title: string, summary: string): string {
  return `Here's the story on ${title.toLowerCase().replace(/[.!?]+$/, "")}. ` +
    `${summary} ` +
    `That's the headline — happy to go deeper on the drivers or what we should do next.`;
}

/* ── Palette constants ───────────────────────────────────────────────────── */
const ACCENT_COLOR: Record<ColorAccent, string> = {
  Navy:     "#1B2840",
  Gold:     "#B89548",
  Slate:    "#4A5878",
  Graphite: "#2A3654",
};
const SLIDES_PER_PAGE = 4;
const mono = "'JetBrains Mono', monospace";

/* ── Audience × Tone narrative lookup — drives SummaryBlock headline ──────
   15 hardcoded variants (5 audiences × 3 tones). Falls back to
   deriveSlideSummary() when the combination has no entry.              */
const NARRATIVES: Record<BuildAudience, Record<BuildTone, string>> = {
  CEO: {
    Formal:  "Revenue contracted 18% in Q3, driven by mid-market churn — Jul marks the inflection point.",
    Neutral: "Q3 showed an 18% revenue dip; July led the decline — mid-market churn is the primary story.",
    Casual:  "Revenue dropped about a fifth in Q3 — mid-market fell off fast after July peaked.",
  },
  Board: {
    Formal:  "Q3 revenue performance was 18% below plan; mid-market attrition is the primary risk vector.",
    Neutral: "The board should note Q3's 18% revenue shortfall — mid-market churn explains most of the gap.",
    Casual:  "Q3 was rough — revenue down 18%, mostly mid-market. Worth a focused discussion.",
  },
  Investor: {
    Formal:  "Q3 revenue declined 18% year-over-year; mid-market churn represents a recoverable headwind.",
    Neutral: "Q3 shows an 18% revenue decline — the mid-market segment is the key driver to watch.",
    Casual:  "Revenue was down 18% in Q3. Mid-market is struggling, but the thesis holds long-term.",
  },
  Team: {
    Formal:  "Team performance in Q3 resulted in an 18% revenue shortfall; root cause is mid-market retention.",
    Neutral: "Q3 revenue was 18% lower than target — let's align on what drove mid-market churn.",
    Casual:  "We missed Q3 by 18%. Mid-market churn hit hard — let's dig into why and what to change.",
  },
  Custom: {
    Formal:  "The data indicates an 18% revenue contraction in Q3 attributable to mid-market segment attrition.",
    Neutral: "Q3 revenue declined 18%; mid-market churn is the explanatory variable across the dataset.",
    Casual:  "Revenue down 18% in Q3 — mid-market churn is telling a clear story in the data.",
  },
};

/* ── Smart pagination ────────────────────────────────────────────────────── */
function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const show = new Set<number>([0, 1, total - 2, total - 1]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 0 && i < total) show.add(i);
  }
  const sorted = Array.from(show).sort((a, b) => a - b);
  const result: (number | "...")[] = [];
  sorted.forEach((p, idx) => {
    if (idx > 0 && p > sorted[idx - 1] + 1) result.push("...");
    result.push(p);
  });
  return result;
}

/* (PanelSelect removed in Шаг 4d — its only consumer DeliverySettingsStrip is gone.) */

/* ── ToggleSwitch ──────────────────────────────────────────────────────── */
function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="flex items-center gap-[5px]"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
      <div style={{ position: "relative", width: 26, height: 14, flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: checked ? NAVY : BORDER, transition: "background 150ms ease" }} />
        <div style={{ position: "absolute", top: 2, left: checked ? 12 : 2, width: 10, height: 10, borderRadius: "50%", background: "#fff", transition: "left 150ms ease" }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 9.5, color: checked ? T2 : T3, transition: "color 150ms ease", userSelect: "none" }}>{label}</span>
    </button>
  );
}

/* (StyleTile + SlideThumbnail removed in Шаг 6b — dead code referencing the
   per-slide visualStyle field; styling is deck-wide via the theme now.) */


/* ── SlideEditor — Presentation Mode full-screen ─────────────────────────
   Layout (top → bottom):
     1. Sticky toolbar — ModeToggle only (chart type moved into card)
     2. Slide card — bordered container: header (2-line title + chart dropdown)
                     + resizable body (chart panel / splitter / data+settings)
     3. Bottom strip — thumbnail rail (excl. active) + Viz Style + Build CTA   */
export function SlideEditor({ saveButton }: { saveButton?: React.ReactNode }) {
  /* setMode and clearBuildMessages were only used by the removed
     "Build Presentation" CTA — no longer subscribed here. */
  const t                 = useTranslations("SlideEditor");
  const slideOrder        = useWorkspaceStore(s => s.slideOrder);
  const slidesById        = useWorkspaceStore(s => s.slidesById);
  const slides            = slideOrder.map(id => slidesById[id]).filter(Boolean) as Slide[];
  const dataSetsById      = useWorkspaceStore(s => s.dataSetsById);
  const insightsById      = useWorkspaceStore(s => s.insightsById);
  const connections       = useWorkspaceStore(s => s.connections);
  const activeSlideId     = useWorkspaceStore(s => s.activeSlideId);
  const setActiveSlide    = useWorkspaceStore(s => s.setActiveSlide);
  const updateSlide       = useWorkspaceStore(s => s.updateSlide);
  const removeSlide       = useWorkspaceStore(s => s.removeSlide);
  const updateDsRows      = useWorkspaceStore(s => s.updateDataSetRows);
  const audience          = useWorkspaceStore(s => s.buildAudience);
  const tone              = useWorkspaceStore(s => s.buildTone);
  const narrMode          = useWorkspaceStore(s => s.buildNarrationMode);
  const presentationThemeId = useWorkspaceStore(s => s.presentationThemeId);

  const [page, setPage] = useState(0);

  /* ── Resizable chart / data-panel split ── */
  const [chartH, setChartH] = useState(280);
  const dragState = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const delta = e.clientY - dragState.current.startY;
      setChartH(Math.max(120, Math.min(520, dragState.current.startH + delta)));
    };
    const onMouseUp = () => { dragState.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  function handleSplitterDown(e: React.MouseEvent) {
    e.preventDefault();
    dragState.current = { startY: e.clientY, startH: chartH };
  }

  /* ── Derived ── */
  const activeSlide = activeSlideId ? slides.find(s => s.id === activeSlideId) ?? slides[0] ?? null : slides[0] ?? null;
  const activeDs    = activeSlide?.dataSetIds[0] ? dataSetsById[activeSlide.dataSetIds[0]] : null;
  const serial      = activeSlide ? String(activeSlide.serial).padStart(2, "0") : "01";

  /* Insights connected to the active DataSet — for DataTable DATA SET column */
  const slideInsightsById: Record<string, import("@/lib/types").Insight> = {};
  if (activeDs) {
    connections
      .filter(c => c.toDataSetId === activeDs.id)
      .forEach(c => {
        const ins = insightsById[c.fromInsightId];
        if (ins) slideInsightsById[c.fromInsightId] = ins;
      });
  }

  /* ── Pagination ── */
  const totalPages   = Math.max(1, Math.ceil(slides.length / SLIDES_PER_PAGE));
  const safePage     = Math.min(page, totalPages - 1);
  const pageSlides   = slides.slice(safePage * SLIDES_PER_PAGE, (safePage + 1) * SLIDES_PER_PAGE);
  /* With ≤3 total slides show all (including active); with ≥4 exclude the active */
  const thumbnailSlides = slides.length <= 3
    ? pageSlides
    : pageSlides.filter(s => s.id !== activeSlideId);

  function handleRemove(id: string) {
    removeSlide(id);
    const remaining = slides.filter(s => s.id !== id);
    setActiveSlide(remaining[0]?.id ?? null);
  }

  /* Deck-wide theme — its --slide-* vars are applied at the main-row root
     below, so the slide card reads them via var(). Falls back to editorial. */
  const theme = PRESENTATION_THEMES.find(t => t.id === presentationThemeId) ?? PRESENTATION_THEMES[0];
  const themeVars = theme.vars as React.CSSProperties;
  /* Slide card background now comes from the active theme (deck-wide), not the
     per-slide visualStyle. */
  const slideBg = "var(--slide-bg)";

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div
        className="grid grid-cols-[1fr_auto_1fr] items-center shrink-0 border-b px-6 h-[64px]"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: T3, flexShrink: 0 }}>
            {t("slides")}
          </span>
          {activeSlide && (
            <>
              <span style={{ color: T3, fontSize: 10, flexShrink: 0, opacity: 0.55, userSelect: "none" }}>·</span>
              <span className="truncate" style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
                {serial} / {activeDs?.title
                  ? (activeDs.title.length > 34 ? activeDs.title.slice(0, 34) + "…" : activeDs.title)
                  : "—"}
              </span>
            </>
          )}
        </div>
        {/* center cell reserved — mode switcher is rendered at page level */}
        <div />
        <div className="flex items-center justify-end gap-2">
          {saveButton}
          <button
            onClick={openOnboarding}
            title={t("howItWorks")}
            className="flex items-center gap-1.5 h-[28px] px-3 border border-border text-t2 hover:border-[#B89548] hover:text-[#B89548] transition-colors"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: "0.04em", borderRadius: 0 }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="6" />
              <path d="M7 10v-.5" />
              <path d="M7 4.5c0-.83.67-1.5 1.5-1.5S10 3.67 10 4.5c0 1-1.5 1.5-1.5 2.5" />
            </svg>
            {t("howItWorks")}
          </button>
        </div>
      </div>

      {/* ── Main row — slide card (centre) + Visualization Style rail (right) ──
          The active theme's --slide-* custom properties are applied here so the
          whole slide subtree reads them via var(). */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ background: SURFACE_RAISE, display: "flex", flexDirection: "row", ...themeVars }}
      >

        {/* ── Centre — pure presentation-ready slide card ───────────────────
            Four blocks stacked: Title · Summary · Chart · Speaker Narrative.
            No data table, no chart settings — those live on the data-set
            drill-in page within CANVAS mode. */}
        <div
          style={{
            flex: 1, minWidth: 0, minHeight: 0,
            padding: "20px 32px",
            display: "flex", flexDirection: "column", alignItems: "center",
            overflow: "hidden",
          }}
        >
          {activeSlide && activeDs ? (
            <div
              style={{
                width: "100%", maxWidth: 940,
                flex: 1, minHeight: 0,
                display: "flex", flexDirection: "column",
                border: "1px solid var(--slide-border)",
                borderRadius: "var(--slide-radius)",
                background: slideBg,
                overflow: "hidden",
              }}
            >
              {/* ── Block 1: Title — text only; view control moved to right rail (Шаг 4b) ── */}
              <div style={{
                padding: "18px 32px 14px",
                borderBottom: "1px solid var(--slide-border)",
                flexShrink: 0,
                display: "flex", alignItems: "flex-start", gap: 16,
                background: slideBg,
              }}>
                <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: "var(--slide-font-mono)", fontSize: 11, color: T3, flexShrink: 0 }}>{serial} /</span>
                  <span style={{
                    fontFamily: "var(--slide-font-display)",
                    fontSize: 32, fontWeight: 500, color: "var(--slide-title)",
                    lineHeight: 1.05, letterSpacing: "-0.3px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {activeDs.title}
                  </span>
                </div>
              </div>

              {/* ── Block 2: Summary — hidden on Quote slides (quote is the message) ── */}
              {activeSlide.archetype !== "Quote" && (
                <SummaryBlock
                  slide={activeSlide}
                  summaryText={activeSlide.summary ?? NARRATIVES[audience]?.[tone] ?? deriveSlideSummary(activeDs.rows, activeDs.columns)}
                  onChange={(s) => updateSlide(activeSlide.id, { summary: s })}
                />
              )}

              {/* ── Block 3: Chart — just the visualization ── */}
              <div style={{
                flex: 1, minHeight: 0,
                padding: "14px 32px 10px",
                background: slideBg,
                display: "flex", flexDirection: "column",
                overflow: "hidden",
              }}>
                <div style={{ flex: 1, minHeight: 0, maxWidth: 860, width: "100%", margin: "0 auto" }}>
                  <SlideArchetypeRenderer
                    rows={activeDs.rows}
                    columns={activeDs.columns}
                    chartType={activeDs.chartType}
                    archetype={activeSlide.archetype ?? "Chart"}
                    accentColor={ACCENT_COLOR[activeSlide.colorAccent]}
                    title={activeDs.title}
                    narrative={activeSlide.narrative}
                  />
                </div>
              </div>

              {/* ── Block 4: Speaker narrative — hidden when narration is "None" ── */}
              {narrMode !== "None" && (
                <NarrativeBlock
                  slide={activeSlide}
                  narrMode={narrMode}
                  narrativeText={activeSlide.narrative ?? deriveSpeakerNarrative(activeDs.title, deriveSlideSummary(activeDs.rows, activeDs.columns))}
                  onChange={(t) => updateSlide(activeSlide.id, { narrative: t })}
                />
              )}
              {/* Block 5 (Delivery settings) removed — speaker-notes toggle moved
                 to the right rail «ВСЯ ПРЕЗЕНТАЦИЯ» (Slides rework Шаг 4d). */}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>
                {slides.length === 0
                  ? "No slides yet — switch to Data Mode and drag a Data Set into the strip below."
                  : "Select a slide below."}
              </span>
            </div>
          )}
        </div>

        {/* Right rail (Visualization Style) is now hoisted to page.tsx as a
            full-height column spanning the slide area + tray — see T5. */}
      </div>

      {/* The duplicate bottom strip (thumbnail rail + viz-style panel) was
          removed per the final spec: there must be only ONE data set tray, and
          it's the page-level <PresentationStructure /> rendered by page.tsx.
          The Modern/Magazine/Wireframe style tiles + Labels/Grid/Stack
          toggles now live in the data set tray's panel (PresentationStructure)
          where they were already duplicated. */}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Slide sub-components — Summary, Narrative, Viz-Style rail
══════════════════════════════════════════════════════════════════════════ */

/* ── Block 2: Summary — prominent, gold left border, "SUMMARY · AUTO" ── */
function SummaryBlock({
  slide, summaryText, onChange,
}: {
  slide: Slide;
  summaryText: string;
  onChange: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(summaryText);

  useEffect(() => { setDraft(summaryText); }, [summaryText, slide.id]);

  const t = useTranslations("SlideEditor");

  function commit() {
    setEditing(false);
    if (draft.trim() && draft !== summaryText) onChange(draft.trim());
  }

  /* Round-4 fix 8: summary is the slide's HEADLINE — sized between the
     title and the speaker narrative. 19 px body, weight 500, dark navy,
     4 px gold left border, generous padding, beige bg unchanged. The
     'SUMMARY · AUTO' caption stays small + muted so it never competes. */
  return (
    <div style={{
      flexShrink: 0,
      margin: "14px 28px 4px",
      background: "var(--slide-muted)",
      borderLeft: "4px solid var(--slide-accent)",
      padding: "18px 22px",
    }}>
      <div style={{
        fontFamily: "var(--slide-font-mono)", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
        color: T3, marginBottom: 8,
      }}>
        {t("summaryAuto")}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit(); if (e.key === "Escape") { setDraft(summaryText); setEditing(false); } }}
          rows={2}
          style={{
            width: "100%",
            fontFamily: "var(--slide-font-body)",
            fontSize: 19, fontWeight: 500, lineHeight: 1.4,
            color: "var(--slide-title)",
            background: "transparent",
            border: "none", outline: "none", resize: "vertical",
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          title={t("clickToEdit")}
          style={{
            fontFamily: "var(--slide-font-body)",
            fontSize: 19, fontWeight: 500, lineHeight: 1.4,
            color: "var(--slide-title)",
            cursor: "text",
          }}
        >
          {summaryText}
        </div>
      )}
    </div>
  );
}

/* Block 5 (DeliverySettingsStrip) removed in Шаг 4d — the speaker-notes toggle
   now lives in the right rail «ВСЯ ПРЕЗЕНТАЦИЯ» (see WebModeToggle/rail). */

/* ── Block 4: Speaker notes ──────────────────────────────────────────────
   narrMode gates whether the block renders at all:
   "Speaker notes included" → editable prose, label "SPEAKER NARRATIVE"
   "None"                   → block is not rendered (parent gates with &&)  */

function NarrativeBlock({
  slide, narrMode, narrativeText, onChange,
}: {
  slide: Slide;
  narrMode: NarrationMode;
  narrativeText: string;
  onChange: (text: string) => void;
}) {
  const [draft,             setDraft]             = useState(narrativeText);
  const [focused,           setFocused]           = useState(false);
  const t = useTranslations("SlideEditor");
  const [narrativeExpanded, setNarrativeExpanded] = useState(() =>
    Boolean(slide.narrative?.trim())
  );

  useEffect(() => { setDraft(narrativeText); }, [narrativeText, slide.id]);
  useEffect(() => {
    setNarrativeExpanded(Boolean(slide.narrative?.trim()));
  }, [slide.id]);

  function commit() {
    if (draft.trim() !== narrativeText) onChange(draft.trim());
  }

  const label = t("narrativeSpeaker");

  return (
    <div style={{
      flexShrink: 0,
      borderTop: `1px solid ${BORDER}`,
      background: "rgba(27,40,64,0.02)",
    }}>
      {/* Clickable label row — full width, chevron on right */}
      <div
        onClick={() => setNarrativeExpanded(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 32px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span style={{
          fontFamily: mono, fontSize: 9, letterSpacing: "0.12em",
          textTransform: "uppercase", color: T3,
        }}>
          {label}
        </span>
        <svg
          width="12" height="12" viewBox="0 0 12 12"
          fill="none" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round"
          style={{
            flexShrink: 0,
            transform: narrativeExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        >
          <path d="M2 4.5l4 4 4-4" />
        </svg>
      </div>

      {/* Animated textarea wrapper */}
      <div style={{
        overflow: "hidden",
        maxHeight: narrativeExpanded ? 200 : 0,
        opacity: narrativeExpanded ? 1 : 0,
        transition: "max-height 250ms ease-out, opacity 200ms ease-out",
      }}>
        <div style={{ padding: "0 32px 14px" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); commit(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.target as HTMLTextAreaElement).blur();
              if (e.key === "Escape") { setDraft(narrativeText); (e.target as HTMLTextAreaElement).blur(); }
            }}
            rows={3}
            placeholder={t("addSpeakerNotes")}
            style={{
              width: "100%",
              fontFamily: "Inter, sans-serif",
              fontSize: 12, lineHeight: 1.55, color: T2,
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${focused ? NAVY : BORDER}`,
              outline: "none",
              resize: "none",
              padding: "2px 0 6px",
              transition: "border-color 150ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Right rail: two scoped sections (Slides rework Шаг 4b) ───────────────────
   «ЭТОТ СЛАЙД» (per-slide) — flat «how to show this slide» picker.
   «ВСЯ ПРЕЗЕНТАЦИЯ» (deck-wide) — theme gallery.
   Self-sufficient: rendered as a full-height right column by page.tsx (SLIDES
   mode); reads slide + theme state straight from the store. */
export function VisualizationStyleRail() {
  const t            = useTranslations("SlideEditor");
  const themeId      = useWorkspaceStore(s => s.presentationThemeId);
  const setTheme     = useWorkspaceStore(s => s.setPresentationTheme);
  const slideOrder   = useWorkspaceStore(s => s.slideOrder);
  const slidesById   = useWorkspaceStore(s => s.slidesById);
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const activeSlideId   = useWorkspaceStore(s => s.activeSlideId);
  const updateSlide     = useWorkspaceStore(s => s.updateSlide);
  const updateDsChartType = useWorkspaceStore(s => s.updateDataSetChartType);
  const narrMode     = useWorkspaceStore(s => s.buildNarrationMode);
  const setNarrMode  = useWorkspaceStore(s => s.setBuildNarrationMode);

  const activeSlide = (activeSlideId ? slidesById[activeSlideId] : null)
    ?? (slideOrder[0] ? slidesById[slideOrder[0]] : null);
  const activeDs = activeSlide?.dataSetIds[0] ? dataSetsById[activeSlide.dataSetIds[0]] : null;

  return (
    <aside
      style={{
        width: 174, flexShrink: 0,
        borderLeft: `1px solid ${BORDER}`,
        background: SURFACE,
        padding: "18px 14px 18px",
        display: "flex", flexDirection: "column", gap: 12,
        overflowY: "auto",
      }}
      className="thin-scroll"
    >
      {/* ══ Section 1: ЭТОТ СЛАЙД (per-slide) ══ */}
      <RailSectionHeader>{t("sectionThisSlide")}</RailSectionHeader>
      {activeSlide && activeDs && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <RailFieldLabel>{t("viewLabel")}</RailFieldLabel>
          <SlideViewDropdown
            archetype={activeSlide.archetype ?? "Chart"}
            chartType={activeDs.chartType}
            onChangeArchetype={(a) => updateSlide(activeSlide.id, { archetype: a })}
            onChangeChartType={(ty) => updateDsChartType(activeDs.id, ty)}
          />
        </div>
      )}

      <div style={{ borderTop: `1px solid ${BORDER}`, margin: "2px 0" }} />

      {/* ══ Section 2: ВСЯ ПРЕЗЕНТАЦИЯ (deck-wide) ══ */}
      <RailSectionHeader>{t("sectionDeck")}</RailSectionHeader>
      <RailFieldLabel>{t("presentationTheme")}</RailFieldLabel>

      {PRESENTATION_THEMES.filter(th => !th.hidden).map((th) => {
        const isWebTile = th.id === "web";
        /* The Web-dashboard tile owns both its dark + light ids. */
        const active = th.id === themeId || (isWebTile && WEB_THEME_IDS.includes(themeId));
        const activeTheme = PRESENTATION_THEMES.find(x => x.id === themeId);
        /* When the web tile is active, preview + blurb reflect the live sub-mode. */
        const previewVars = (isWebTile && active && activeTheme ? activeTheme.vars : th.vars) as React.CSSProperties;
        const blurb = isWebTile && active && activeTheme ? activeTheme.blurb : th.blurb;
        return (
          <div key={th.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={() => { if (!active) setTheme(th.id); }}
              style={{
                width: "100%",
                display: "flex", flexDirection: "column", gap: 6,
                padding: 10,
                background: active ? SURFACE_RAISE : "transparent",
                border: `${active ? "1.5px" : "1px"} solid ${active ? NAVY : BORDER}`,
                borderRadius: 4,
                cursor: active ? "default" : "pointer",
                color: T2,
                textAlign: "left",
                transition: "border-color 150ms, background 150ms",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = NAVY; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = BORDER; }}
            >
              {/* Mini preview — rendered in the theme's OWN tokens so the font,
                  accent and corner radius read at a glance. */}
              <div style={{
                ...previewVars,
                background: "var(--slide-bg)",
                border: "1px solid var(--slide-border)",
                borderRadius: "var(--slide-radius)",
                padding: "7px 9px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontFamily: "var(--slide-font-display)", color: "var(--slide-title)", fontSize: 15, lineHeight: 1 }}>Aa</span>
                <span style={{ flex: 1 }} />
                <span style={{ width: 16, height: 6, borderRadius: 3, background: "var(--slide-accent)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{
                  fontFamily: mono, fontSize: 10.5, color: NAVY, fontWeight: active ? 500 : 400,
                }}>
                  {th.label}
                </span>
                <span style={{
                  fontFamily: mono, fontSize: 8.5, letterSpacing: "0.04em", color: T3, lineHeight: 1.4,
                }}>
                  {blurb}
                </span>
              </div>
            </button>

            {/* ☀/🌙 light-dark toggle — only inside the active Web-dashboard tile (Шаг 4c) */}
            {isWebTile && active && <WebModeToggle themeId={themeId} setTheme={setTheme} />}
          </div>
        );
      })}

      {/* ── «+ по образцу» — AI-vision theme, отдельной сессией после Урока 6 (Шаг 4e) ── */}
      <button
        type="button"
        disabled
        title={t("comingSoon")}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          padding: "8px 6px",
          background: "transparent",
          border: `1px dashed ${BORDER}`, borderRadius: 4,
          fontFamily: mono, fontSize: 9.5, letterSpacing: "0.03em",
          color: T3, cursor: "not-allowed", opacity: 0.75,
        }}
      >
        {t("themeByExample")}
        <span style={{ color: GOLD, fontSize: 9 }}>★</span>
        <span style={{ fontSize: 7.5, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.8 }}>
          {t("comingSoon")}
        </span>
      </button>

      {/* ── Speaker-notes toggle — deck-wide (moved from slide card, Шаг 4d) ── */}
      <div style={{ borderTop: `1px solid ${BORDER}`, margin: "2px 0" }} />
      <RailFieldLabel>{t("speakerNotesLabel")}</RailFieldLabel>
      <ToggleSwitch
        label={narrMode !== "None" ? t("notesShown") : t("notesHidden")}
        checked={narrMode !== "None"}
        onChange={(v) => setNarrMode(v ? "Speaker notes included" : "None")}
      />

      <div style={{
        marginTop: "auto", paddingTop: 8,
        fontFamily: mono, fontSize: 8.5, color: T3, lineHeight: 1.5,
      }}>
        {t("themeHint")}
      </div>
    </aside>
  );
}

/* ── Rail typography helpers ─────────────────────────────────────────────────
   Section header = scope label (darker); field label = control caption (muted). */
function RailSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
      color: T2, fontWeight: 500,
    }}>
      {children}
    </div>
  );
}
function RailFieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: mono, fontSize: 7.5, letterSpacing: "0.08em", textTransform: "uppercase",
      color: T3,
    }}>
      {children}
    </div>
  );
}

/* ── Web-dashboard ☀/🌙 light–dark toggle (Шаг 4c) ───────────────────────────
   Two-segment control that flips presentationThemeId between the dark "web"
   and light "web-light" variants of the same Web-dashboard preset. */
function WebModeToggle({ themeId, setTheme }: {
  themeId: PresentationThemeId;
  setTheme: (id: PresentationThemeId) => void;
}) {
  const t      = useTranslations("SlideEditor");
  const isDark = themeId !== "web-light";

  const segments: { id: PresentationThemeId; label: string; icon: React.ReactNode; on: boolean }[] = [
    {
      id: "web-light", label: t("themeLight"), on: !isDark,
      icon: (
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="8" cy="8" r="3.2" />
          <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M13 3l-1.1 1.1M4.1 11.9L3 13" />
        </svg>
      ),
    },
    {
      id: "web", label: t("themeDark"), on: isDark,
      icon: (
        <svg width="9" height="9" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 1.5A6.5 6.5 0 1 0 14.5 10 5 5 0 0 1 6 1.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      display: "flex", border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden",
    }}>
      {segments.map((seg, i) => (
        <button
          key={seg.id}
          onClick={() => { if (!seg.on) setTheme(seg.id); }}
          title={seg.label}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "5px 4px",
            background: seg.on ? NAVY : "transparent",
            color: seg.on ? "#F5F2EA" : T3,
            border: "none", borderLeft: i === 1 ? `1px solid ${BORDER}` : "none",
            cursor: seg.on ? "default" : "pointer",
            fontFamily: mono, fontSize: 8.5, letterSpacing: "0.04em",
            transition: "background 150ms, color 150ms",
          }}
        >
          {seg.icon}
          {seg.label}
        </button>
      ))}
    </div>
  );
}

/* (EnginePreview removed — render engines dropped in Slides rework Шаг 2) */
