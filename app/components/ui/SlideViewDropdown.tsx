"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { SlideArchetype, ChartType } from "@/lib/types";
import { NAVY, T2, T3, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

const mono = "'JetBrains Mono', monospace";

/* ── Flat "how to show this slide" picker (Slides rework Шаг 4b) ──────────────
   ONE flat list, no category words ("Вид/График"), no nesting. Each row =
   meaning (large, dark) + technical term (small, muted). The archetype is
   derived from the chosen row — never shown to the user as a level.

   Chart rows (archetype="Chart" + chartType) come first, ordered by visual
   appeal (Donut/Lollipop high; Spline Area + Stacked Bar last). Below a
   divider: the non-chart archetypes. Order is the product-locked priority
   from docs/screens/slides.md. */

type ChartOption    = { meaningKey: string; term: string;  chartType: ChartType };
type ArchetypeOption = { meaningKey: string; archetype: SlideArchetype };

const CHART_OPTIONS: ChartOption[] = [
  { meaningKey: "vShareOfWhole", term: "Treemap",     chartType: "Treemap" },
  { meaningKey: "vShareOfWhole", term: "Donut",       chartType: "Donut" },
  { meaningKey: "vComparison",   term: "Lollipop",    chartType: "Lollipop" },
  { meaningKey: "vRelationship", term: "Scatter",     chartType: "Scatter" },
  { meaningKey: "vProfile",      term: "Radar",       chartType: "Radar" },
  { meaningKey: "vDensity",      term: "Heatmap",     chartType: "Heatmap" },
  { meaningKey: "vGeography",    term: "Map",         chartType: "Map" },
  { meaningKey: "vCount",        term: "Dot Matrix",  chartType: "Dot Matrix" },
  { meaningKey: "vTrend",        term: "Spline Area", chartType: "Spline Area" },
  { meaningKey: "vComposition",  term: "Stacked Bar", chartType: "Stacked Bar" },
];

const ARCHETYPE_OPTIONS: ArchetypeOption[] = [
  { meaningKey: "vBigNumber",        archetype: "Big Number" },
  { meaningKey: "vNumberComparison", archetype: "Comparison" },
  { meaningKey: "vQuote",            archetype: "Quote" },
];

export function SlideViewDropdown({
  archetype,
  chartType,
  onChangeArchetype,
  onChangeChartType,
}: {
  archetype: SlideArchetype;
  chartType: ChartType;
  onChangeArchetype: (a: SlideArchetype) => void;
  onChangeChartType: (t: ChartType) => void;
}) {
  const t = useTranslations("SlideEditor");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const isChart = archetype === "Chart";
  /* Current selection — chart row matched by chartType, else archetype row. */
  const activeChart = isChart ? CHART_OPTIONS.find(o => o.chartType === chartType) : undefined;
  const activeArch  = !isChart ? ARCHETYPE_OPTIONS.find(o => o.archetype === archetype) : undefined;
  const triggerMeaning = activeChart ? t(activeChart.meaningKey) : activeArch ? t(activeArch.meaningKey) : "—";
  const triggerTerm    = activeChart?.term ?? null;

  function handleToggle() {
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  function pickChart(o: ChartOption) {
    onChangeArchetype("Chart");
    onChangeChartType(o.chartType);
    setOpen(false);
  }
  function pickArchetype(o: ArchetypeOption) {
    onChangeArchetype(o.archetype);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 4,
          background: SURFACE_RAISE, border: `1px solid ${open ? NAVY : BORDER}`,
          borderRadius: 4, padding: "5px 7px 5px 9px",
          cursor: "pointer", outline: "none", userSelect: "none",
          transition: "border-color 150ms",
        }}
      >
        <span style={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "baseline", gap: 5, overflow: "hidden" }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: T2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {triggerMeaning}
          </span>
          {triggerTerm && (
            <span style={{ fontFamily: mono, fontSize: 8.5, color: T3, flexShrink: 0 }}>{triggerTerm}</span>
          )}
        </span>
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}>
          <path d="M1 2.5l2.5 2.5L6 2.5" />
        </svg>
      </button>

      {open && rect && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <ul role="listbox" style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            minWidth: Math.max(rect.width, 180),
            zIndex: 9999, margin: 0, padding: "4px 0", listStyle: "none",
            background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
            borderRadius: 2, boxShadow: "0 4px 12px rgba(27,40,64,0.10)",
            maxHeight: "70vh", overflowY: "auto",
          }}>
            {CHART_OPTIONS.map(o => (
              <Row
                key={`c-${o.term}`}
                meaning={t(o.meaningKey)}
                term={o.term}
                active={isChart && chartType === o.chartType}
                onClick={() => pickChart(o)}
              />
            ))}

            <li aria-hidden style={{ margin: "4px 0", borderTop: `1px solid ${BORDER}` }} />

            {ARCHETYPE_OPTIONS.map(o => (
              <Row
                key={`a-${o.archetype}`}
                meaning={t(o.meaningKey)}
                term={null}
                active={!isChart && archetype === o.archetype}
                onClick={() => pickArchetype(o)}
              />
            ))}
          </ul>
        </>,
        document.body,
      )}
    </div>
  );
}

/* ── Single menu row: meaning (large, dark) + technical term (small, muted) ── */
function Row({ meaning, term, active, onClick }: {
  meaning: string;
  term: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li role="option" aria-selected={active} style={{ margin: 0, padding: 0 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          display: "flex", alignItems: "baseline", gap: 7, width: "100%",
          textAlign: "left", padding: "6px 12px 6px 10px",
          background: active ? SURFACE_MUTED : "transparent",
          border: "none", cursor: "pointer", outline: "none", userSelect: "none",
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = SURFACE_MUTED; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round"
          style={{ flexShrink: 0, opacity: active ? 1 : 0 }}>
          <path d="M1 4l2 2 4-4" />
        </svg>
        <span style={{ flex: 1, minWidth: 0, fontFamily: mono, fontSize: 11, color: active ? NAVY : T2, fontWeight: active ? 500 : 400 }}>
          {meaning}
        </span>
        {term && (
          <span style={{ fontFamily: mono, fontSize: 8.5, color: T3, flexShrink: 0 }}>{term}</span>
        )}
      </button>
    </li>
  );
}
