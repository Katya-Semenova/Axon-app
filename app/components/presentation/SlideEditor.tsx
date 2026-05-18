"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { ChartFill } from "../ChartFill";
import { MiniChart } from "../MiniChart";
import { ModeToggle } from "../ui/ModeToggle";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { DataTable } from "../DataTable";
import type { Slide, VisualStyle, ColorAccent } from "@/lib/types";
import { BORDER, NAVY, GOLD, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

/* ── Palette constants ───────────────────────────────────────────────────── */
const ACCENT_COLOR: Record<ColorAccent, string> = {
  Navy:     "#1B2840",
  Gold:     "#B89548",
  Slate:    "#4A5878",
  Graphite: "#2A3654",
};
const STYLE_BG: Record<VisualStyle, string> = {
  Modern:    "#FBF9F3",
  Magazine:  "#FBF9F3",
  Wireframe: "#F5F2EA",
};
const STYLE_HEADLINE_FONT: Record<VisualStyle, string> = {
  Modern:    "Inter, sans-serif",
  Magazine:  "'Instrument Serif', Georgia, serif",
  Wireframe: "'JetBrains Mono', monospace",
};
const LIBRARY_NAME: Record<VisualStyle, string> = {
  Modern:    "SciChart",
  Magazine:  "Highcharts",
  Wireframe: "D3.js",
};

const SLIDES_PER_PAGE = 4;
const mono = "'JetBrains Mono', monospace";

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

/* ── PanelSelect ─────────────────────────────────────────────────────────── */
function PanelSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  function handleToggle() {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  return (
    <div style={{ position: "relative", zIndex: open ? 101 : "auto" }}>
      <div style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T3, marginBottom: 3, whiteSpace: "nowrap" }}>
        {label}
      </div>
      {open && (
        <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 4,
          background: SURFACE_RAISE, border: `1px solid ${open ? NAVY : BORDER}`,
          borderRadius: 4, padding: "3px 6px 3px 8px",
          fontFamily: mono, fontSize: 10, lineHeight: 1.5, color: T2,
          cursor: "pointer", outline: "none", userSelect: "none", transition: "border-color 150ms",
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}>
          <path d="M1 2.5l2.5 2.5L6 2.5" />
        </svg>
      </button>
      {open && rect && (
        <ul role="listbox" style={{
          position: "fixed",
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          minWidth: Math.max(rect.width, 108),
          zIndex: 102, margin: 0, padding: "4px 0", listStyle: "none",
          background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
          borderRadius: 4, boxShadow: "0 2px 10px rgba(27,40,64,0.07)",
        }}>
          {options.map(opt => (
            <li key={opt} role="option" aria-selected={opt === value} style={{ margin: 0, padding: 0 }}>
              <button
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "5px 10px", fontFamily: mono, fontSize: 10, lineHeight: 1.5,
                  color: opt === value ? NAVY : T2, fontWeight: opt === value ? 500 : 400,
                  background: opt === value ? SURFACE_MUTED : "transparent",
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  outline: "none", userSelect: "none",
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = SURFACE_MUTED; }}
                onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = "transparent"; }}
              >{opt}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

/* ── StyleTile ─────────────────────────────────────────────────────────── */
function StyleTile({ style, active, onClick }: { style: VisualStyle; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 rounded-sm border overflow-hidden transition-all duration-150"
      style={{ height: 64, borderColor: active ? NAVY : BORDER, background: active ? "rgba(27,40,64,0.05)" : "transparent" }}>
      <svg viewBox="0 0 56 56" fill="none" style={{ width: "100%", height: "100%" }}>
        {style === "Modern" && (
          <>
            <rect x="5"  y="16" width="8" height="10" rx="1.5" fill={NAVY} fillOpacity={active ? 0.85 : 0.25} />
            <rect x="15" y="10" width="8" height="16" rx="1.5" fill={NAVY} fillOpacity={active ? 0.55 : 0.15} />
            <rect x="25" y="6"  width="8" height="20" rx="1.5" fill={NAVY} fillOpacity={active ? 0.75 : 0.2} />
            <rect x="35" y="12" width="8" height="14" rx="1.5" fill={NAVY} fillOpacity={active ? 0.45 : 0.12} />
          </>
        )}
        {style === "Magazine" && (
          <>
            <rect x="5"  y="5"  width="32" height="4" rx="1"   fill={active ? NAVY : T3} fillOpacity={active ? 0.85 : 0.35} />
            <rect x="5"  y="12" width="20" height="2.5" rx="1" fill={active ? NAVY : T3} fillOpacity={active ? 0.3  : 0.18} />
            <path d="M5 19 Q18 15 30 21 Q42 27 51 18 V27 H5Z" fill={active ? NAVY : T3} fillOpacity={active ? 0.2 : 0.1} />
            <circle cx="46" cy="10" r="5" fill={active ? GOLD : T3} fillOpacity={active ? 0.7 : 0.2} />
          </>
        )}
        {style === "Wireframe" && (
          <>
            {[10, 20, 30, 40].flatMap(x =>
              [8, 16, 24].map(y => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill={T3} fillOpacity={active ? 0.65 : 0.35} />
              ))
            )}
            <rect x="5"  y="14" width="8" height="12" rx="1" fill="none" stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="15" y="9"  width="8" height="17" rx="1" fill="none" stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="25" y="17" width="8" height="9"  rx="1" fill="none" stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
          </>
        )}
        <text x="28" y="36" textAnchor="middle" fontSize="4.5" fontFamily={mono} fill={active ? NAVY : T3} fillOpacity={active ? 0.5 : 0.35}>{style}</text>
        <text x="28" y="49" textAnchor="middle" fontSize="6.5" fontWeight="500" fontFamily={mono} fill={active ? NAVY : T3} fillOpacity={active ? 1 : 0.65}>{LIBRARY_NAME[style]}</text>
      </svg>
    </button>
  );
}

/* ── SlideThumbnail ────────────────────────────────────────────────────── */
function SlideThumbnail({ slide, isActive, onClick, onDelete }: {
  slide: Slide;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dataSetsById  = useWorkspaceStore(s => s.dataSetsById);
  const ds            = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;

  const serial      = String(slide.serial).padStart(2, "0");
  const headline    = (ds?.title ?? "Untitled").slice(0, 28) + ((ds?.title ?? "").length > 28 ? "…" : "");
  const accentColor = ACCENT_COLOR[slide.colorAccent];
  const bg          = STYLE_BG[slide.visualStyle];
  const headFont    = STYLE_HEADLINE_FONT[slide.visualStyle];

  const wireDots = slide.visualStyle === "Wireframe"
    ? Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 13 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 8} cy={32 + row * 7} r="0.6" fill={T3} fillOpacity="0.45" />
        ))
      ).flat()
    : null;

  return (
    <div style={{ position: "relative", aspectRatio: "116 / 76" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div onClick={onClick} className="cursor-pointer overflow-hidden"
        style={{
          width: "100%", height: "100%", borderRadius: 0,
          border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? NAVY : hovered ? GOLD : BORDER}`,
          background: bg, transition: "border-color 150ms ease, border-width 150ms ease",
        }}>
        <svg viewBox="0 0 116 76" fill="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="116" height="76" fill={bg} />
          {wireDots}
          <text x="6" y="11" fontSize="5" fontWeight="500" fill={T3} fontFamily={mono} letterSpacing="0.08em">{serial} /</text>
          <text x="6" y={slide.visualStyle === "Magazine" ? 23 : 21}
            fontSize={slide.visualStyle === "Magazine" ? 7.5 : 6.5}
            fontWeight={slide.visualStyle === "Magazine" ? "600" : "500"}
            fill="#0A0A0A" fontFamily={headFont}>{headline}</text>
          {ds && (
            <g transform="translate(6, 30)">
              <MiniChart rows={ds.rows} chartType={ds.chartType} color={accentColor} W={104} H={34} />
            </g>
          )}
        </svg>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Remove slide"
        style={{
          position: "absolute", top: 3, right: 3, width: 15, height: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: SURFACE_RAISE, border: `1px solid ${BORDER}`, borderRadius: 0,
          cursor: "pointer", color: T3, padding: 0,
          opacity: hovered ? 1 : 0, transition: "opacity 150ms ease, color 150ms ease",
          zIndex: 2,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
        onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
      >
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1 1l6 6M7 1L1 7" />
        </svg>
      </button>
    </div>
  );
}

/* ── SlideEditor — Presentation Mode full-screen ─────────────────────────
   Layout (top → bottom):
     1. Sticky toolbar — ModeToggle only (chart type moved into card)
     2. Slide card — bordered container: header (2-line title + chart dropdown)
                     + resizable body (chart panel / splitter / data+settings)
     3. Bottom strip — thumbnail rail (excl. active) + Viz Style + Build CTA   */
export function SlideEditor() {
  const setMode           = useWorkspaceStore(s => s.setMode);
  const clearBuildMessages = useWorkspaceStore(s => s.clearBuildMessages);
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
  const updateDsChartType = useWorkspaceStore(s => s.updateDataSetChartType);
  const updateDsRows      = useWorkspaceStore(s => s.updateDataSetRows);

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
  /* Exclude the active slide from the preview strip (spec §8) */
  const thumbnailSlides = pageSlides.filter(s => s.id !== activeSlideId);

  function handleRemove(id: string) {
    removeSlide(id);
    const remaining = slides.filter(s => s.id !== id);
    setActiveSlide(remaining[0]?.id ?? null);
  }

  const slideBg = activeSlide ? STYLE_BG[activeSlide.visualStyle] : SURFACE_RAISE;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div
        className="flex items-center justify-between shrink-0 border-b px-6 py-[9px]"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: T3, flexShrink: 0 }}>
            Presentation
          </span>
          {activeSlide && (
            <>
              <span style={{ color: BORDER, fontSize: 10, flexShrink: 0 }}>|</span>
              <span className="truncate" style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
                {serial} / {activeDs?.title
                  ? (activeDs.title.length > 34 ? activeDs.title.slice(0, 34) + "…" : activeDs.title)
                  : "—"}
              </span>
            </>
          )}
        </div>
        <ModeToggle />
      </div>

      {/* ── Slide card — centred, fills remaining space above strip ── */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{ background: SURFACE_RAISE, padding: "20px 32px", display: "flex", justifyContent: "center" }}
      >
        {activeSlide && activeDs ? (
          <div style={{
            width: "100%", maxWidth: 940,
            height: "100%",          /* explicit height so card doesn't push strip */
            display: "flex", flexDirection: "column",
            border: `1px solid ${BORDER}`,
            background: slideBg,
            overflow: "hidden",      /* clip card content within the card */
          }}>

            {/* ── Card header: 2-line title + chart-type dropdown ── */}
            <div style={{
              padding: "14px 24px 12px",
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
              background: slideBg,
            }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                {/* Line 1: serial / title */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: T3, flexShrink: 0 }}>{serial} /</span>
                  <span style={{
                    fontFamily: STYLE_HEADLINE_FONT[activeSlide.visualStyle],
                    fontSize: 15, fontWeight: 500, color: "#0A0A0A",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {activeDs.title}
                  </span>
                </div>
                {/* Line 2: narrative subtitle */}
                <div style={{ marginTop: 4 }}>
                  <span style={{
                    fontFamily: STYLE_HEADLINE_FONT[activeSlide.visualStyle],
                    fontSize: 12, fontWeight: 400,
                    color: T2,
                    fontStyle: activeSlide.visualStyle === "Magazine" ? "italic" : "normal",
                  }}>
                    {activeSlide.narrative || "Revenue contracted 18% in Q3 — mid-market churn led"}
                  </span>
                </div>
              </div>
              {/* Chart type dropdown — per-slide, in the card */}
              <div style={{ flexShrink: 0 }}>
                <ChartTypeDropdown
                  value={activeDs.chartType}
                  onChange={(type) => updateDsChartType(activeDs.id, type)}
                />
              </div>
            </div>

            {/* ── Card body: resizable chart / splitter / data+settings ── */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>

              {/* Chart panel — flexBasis drives the drag-resize; flexShrink:1 lets
                  it compress on small screens rather than pushing the strip off */}
              <div style={{
                flexBasis: chartH, flexShrink: 1, flexGrow: 0, minHeight: 100, overflow: "hidden",
                padding: "12px 32px 8px",
                background: slideBg,
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ flex: 1, minHeight: 0, maxWidth: 820, width: "100%", margin: "0 auto" }}>
                  <ChartFill
                    rows={activeDs.rows}
                    columns={activeDs.columns}
                    chartType={activeDs.chartType}
                    expanded
                  />
                </div>
              </div>

              {/* Splitter handle */}
              <div
                onMouseDown={handleSplitterDown}
                title="Drag to resize"
                style={{
                  height: 10, flexShrink: 0,
                  cursor: "row-resize",
                  background: slideBg,
                  borderTop:    `1px solid ${BORDER}`,
                  borderBottom: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  userSelect: "none",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,149,72,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = slideBg; }}
              >
                <svg width="24" height="6" viewBox="0 0 24 6" fill="none">
                  {[0, 8, 16].map(x => (
                    <circle key={x} cx={x + 4} cy="3" r="1.5" fill={T3} fillOpacity="0.5" />
                  ))}
                </svg>
              </div>

              {/* Data + Chart Settings panel */}
              <div style={{ flex: 1, minHeight: 80, overflow: "hidden", display: "flex" }}>

                {/* Left column — DataTable */}
                <div style={{
                  flex: 1, minWidth: 0,
                  borderRight: `1px solid ${BORDER}`,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "7px 16px 6px",
                    borderBottom: `1px solid ${BORDER}`,
                    flexShrink: 0,
                    background: "rgba(27,40,64,0.03)",
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T3 }}>
                      DATA — EDIT TO CORRECT AGGREGATION ERRORS
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }} className="thin-scroll">
                    {activeDs.rows.length === 0 ? (
                      <div style={{
                        fontFamily: mono, fontSize: 11, color: T3,
                        padding: "20px 16px", textAlign: "center",
                      }}>
                        No data — wire an Insight to this Data Set on the canvas.
                      </div>
                    ) : (
                      <DataTable
                        columns={activeDs.columns}
                        rows={activeDs.rows}
                        onRowsChange={(rows) => updateDsRows(activeDs.id, rows)}
                        insightsById={Object.keys(slideInsightsById).length > 0 ? slideInsightsById : undefined}
                      />
                    )}
                  </div>
                </div>

                {/* Right column — Chart Settings */}
                <div style={{
                  width: 248, flexShrink: 0,
                  display: "flex", flexDirection: "column",
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "7px 16px 6px",
                    borderBottom: `1px solid ${BORDER}`,
                    flexShrink: 0,
                    background: "rgba(27,40,64,0.03)",
                  }}>
                    <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: T3 }}>
                      CHART SETTINGS
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }} className="thin-scroll">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <PanelSelect label="Status"      value={activeSlide.status}
                        options={["Paid", "Organic", "Direct", "Email"]}
                        onChange={v => updateSlide(activeSlide.id, { status: v })} />
                      <PanelSelect label="Aggregation" value={activeSlide.aggregation}
                        options={["Monthly", "Weekly", "Daily"]}
                        onChange={v => updateSlide(activeSlide.id, { aggregation: v as Slide["aggregation"] })} />
                      <PanelSelect label="Color By"    value={activeSlide.colorBy}
                        options={["Segment", "Region", "Product", "Channel"]}
                        onChange={v => updateSlide(activeSlide.id, { colorBy: v })} />
                      <PanelSelect label="Filter"      value={activeSlide.filter}
                        options={["All data", "Paid only", "Organic only", "Last 30d"]}
                        onChange={v => updateSlide(activeSlide.id, { filter: v })} />
                    </div>
                    <PanelSelect label="Accent" value={activeSlide.colorAccent}
                      options={["Navy", "Gold", "Slate", "Graphite"]}
                      onChange={v => updateSlide(activeSlide.id, { colorAccent: v as ColorAccent })} />
                  </div>
                </div>
              </div>
            </div>
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

      {/* ── Bottom strip: thumbnail rail (left) + viz style panel (right) ── */}
      <div
        className="shrink-0 flex border-t overflow-hidden"
        style={{ height: 200, minHeight: 180, background: "#EDE9E0", borderColor: BORDER }}
      >
        {/* Slide thumbnails — active slide excluded from preview */}
        <div className="flex flex-col flex-1 min-w-0 border-r overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2 shrink-0 px-5 pt-2 pb-1">
            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: T3 }}>Slides</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: T3, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "1px 7px" }}>
              {slides.length}
            </span>
          </div>

          <div style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            alignContent: "center",
            gap: 8,
            paddingLeft: 20, paddingRight: 20,
            paddingTop: 4, paddingBottom: 6,
            overflow: "hidden",
          }}>
            {thumbnailSlides.map(slide => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                isActive={false}
                onClick={() => setActiveSlide(slide.id)}
                onDelete={() => handleRemove(slide.id)}
              />
            ))}
          </div>

          {/* Smart paginator — centred, "1  2  ..  12" style */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, padding: "4px 0 6px", flexShrink: 0 }}>
            {buildPages(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} style={{ fontFamily: mono, fontSize: 9.5, color: T3, padding: "0 2px", lineHeight: "20px" }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)}
                  style={{
                    fontFamily: mono, fontSize: 9.5, width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 2, border: "none", cursor: "pointer",
                    background: p === safePage ? NAVY : "transparent",
                    color: p === safePage ? "#F5F2EA" : T3,
                    transition: "background 150ms, color 150ms",
                  }}>
                  {(p as number) + 1}
                </button>
              )
            )}
          </div>
        </div>

        {/* Viz style — StyleTiles + Toggles only; Accent/Aggregation live in Chart Settings */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 220, background: SURFACE }}>
          <div className="px-4 pt-2 pb-1 shrink-0 border-b" style={{ borderColor: BORDER }}>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: T3 }}>Visualization Style</span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll px-4 py-3">
            {activeSlide ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 6, rowGap: 8 }}>
                {(["Modern", "Magazine", "Wireframe"] as VisualStyle[]).map(s => (
                  <StyleTile key={s} style={s} active={activeSlide.visualStyle === s}
                    onClick={() => updateSlide(activeSlide.id, { visualStyle: s })} />
                ))}
                <ToggleSwitch label="Labels" checked={activeSlide.showLabels}  onChange={v => updateSlide(activeSlide.id, { showLabels: v })} />
                <ToggleSwitch label="Grid"   checked={activeSlide.showGrid}    onChange={v => updateSlide(activeSlide.id, { showGrid: v })} />
                <ToggleSwitch label="Stack"  checked={activeSlide.stackedBars} onChange={v => updateSlide(activeSlide.id, { stackedBars: v })} />
              </div>
            ) : (
              <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>Select a slide</span>
            )}
          </div>
          {/* Build Presentation CTA — pinned to bottom of panel */}
          {activeSlide && (
            <div className="px-4 pb-4 pt-2 shrink-0">
              <button
                onClick={() => { clearBuildMessages(); setMode("build"); }}
                className="w-full font-medium transition-opacity duration-150 hover:opacity-85"
                style={{
                  fontFamily: mono, fontSize: 11, color: "#F5F2EA",
                  background: NAVY, border: "none",
                  padding: "8px 0", borderRadius: 0,
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                Build Presentation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
