"use client";

import { useState, useRef } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { ChartRenderer } from "../ChartRenderer";
import { DataTable } from "../DataTable";
import { MiniChart } from "../MiniChart";
import type { Slide, VisualStyle, ColorAccent } from "@/lib/types";
import { BORDER, NAVY, GOLD, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

/* ── Palette constants not in tokens ────────────────────────────────────── */
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

/* ── SlideEditor — Presentation Mode full-screen ─────────────────────── */
export function SlideEditor() {
  const slideOrder       = useWorkspaceStore(s => s.slideOrder);
  const slidesById       = useWorkspaceStore(s => s.slidesById);
  const slides           = slideOrder.map(id => slidesById[id]).filter(Boolean) as Slide[];
  const dataSetsById     = useWorkspaceStore(s => s.dataSetsById);
  const insightsById     = useWorkspaceStore(s => s.insightsById);
  const activeSlideId    = useWorkspaceStore(s => s.activeSlideId);
  const setActiveSlide   = useWorkspaceStore(s => s.setActiveSlide);
  const updateSlide      = useWorkspaceStore(s => s.updateSlide);
  const removeSlide      = useWorkspaceStore(s => s.removeSlide);

  const [page, setPage] = useState(0);

  const activeSlide = activeSlideId ? slides.find(s => s.id === activeSlideId) ?? slides[0] ?? null : slides[0] ?? null;
  const activeDs    = activeSlide?.dataSetIds[0] ? dataSetsById[activeSlide.dataSetIds[0]] : null;

  const totalPages  = Math.max(1, Math.ceil(slides.length / SLIDES_PER_PAGE));
  const safePage    = Math.min(page, totalPages - 1);
  const pageSlides  = slides.slice(safePage * SLIDES_PER_PAGE, (safePage + 1) * SLIDES_PER_PAGE);

  const serial = activeSlide ? String(activeSlide.serial).padStart(2, "0") : "01";

  function handleRemove(id: string) {
    removeSlide(id);
    const remaining = slides.filter(s => s.id !== id);
    setActiveSlide(remaining[0]?.id ?? null);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Top: large slide preview ── */}
      <div
        className="shrink-0 flex flex-col border-b"
        style={{ height: "42%", minHeight: 220, background: activeSlide ? STYLE_BG[activeSlide.visualStyle] : SURFACE_RAISE, borderColor: BORDER }}
      >
        {activeSlide && activeDs ? (
          <div className="flex flex-col flex-1 min-h-0 px-10 py-6">
            {/* Slide header */}
            <div className="flex items-center gap-3 mb-3 shrink-0">
              <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>{serial} /</span>
              <span className="text-[15px] font-medium truncate" style={{ color: "#0A0A0A", fontFamily: STYLE_HEADLINE_FONT[activeSlide.visualStyle] }}>
                {activeDs.title}
              </span>
            </div>
            {/* Chart */}
            <div className="flex-1 min-h-0">
              <ChartRenderer
                rows={activeDs.rows}
                columns={activeDs.columns}
                chartType={activeDs.chartType}
                expanded
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>
              {slides.length === 0 ? "No slides yet — drag a Data Set into the presentation strip." : "Select a slide below."}
            </span>
          </div>
        )}
      </div>

      {/* ── Middle: data table (⅔) + chart settings (⅓) ── */}
      <div className="shrink-0 flex border-b overflow-hidden" style={{ height: "33%", minHeight: 180, borderColor: BORDER }}>

        {/* Data table */}
        <div className="flex flex-col min-h-0 overflow-hidden border-r" style={{ flex: "2 1 0", borderColor: BORDER }}>
          <div className="px-5 pt-2 pb-1 shrink-0 border-b flex items-center gap-3" style={{ borderColor: BORDER, background: SURFACE }}>
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>
              Data
            </span>
            {activeDs && (
              <span style={{ fontFamily: mono, fontSize: 9, color: T3 }}>
                {activeDs.title.length > 30 ? activeDs.title.slice(0, 30) + "…" : activeDs.title}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll px-4 pb-2 pt-1">
            {activeDs ? (
              <DataTable
                columns={activeDs.columns}
                rows={activeDs.rows}
                onRowsChange={() => {
                  /* DataSet rows aren't directly editable here; they're aggregated.
                     To edit data, open the source Insight's expanded view. */
                }}
                insightsById={insightsById}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>No data set selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart settings */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 220, background: SURFACE }}>
          <div className="px-4 pt-2 pb-1 shrink-0 border-b" style={{ borderColor: BORDER }}>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>Chart Settings</span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll px-4 py-3">
            {activeSlide ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                <PanelSelect
                  label="Status"
                  value={activeSlide.status}
                  options={["All", "Paid", "Pending", "Failed"]}
                  onChange={v => updateSlide(activeSlide.id, { status: v })}
                />
                <PanelSelect
                  label="Aggregation"
                  value={activeSlide.aggregation}
                  options={["Monthly", "Weekly", "Daily"]}
                  onChange={v => updateSlide(activeSlide.id, { aggregation: v as Slide["aggregation"] })}
                />
                <PanelSelect
                  label="Color By"
                  value={activeSlide.colorBy}
                  options={["Segment", "Category", "Region", "None"]}
                  onChange={v => updateSlide(activeSlide.id, { colorBy: v })}
                />
                <PanelSelect
                  label="Filter"
                  value={activeSlide.filter}
                  options={["All data", "Top 10", "Bottom 10", "Outliers"]}
                  onChange={v => updateSlide(activeSlide.id, { filter: v })}
                />
                <PanelSelect
                  label="Accent"
                  value={activeSlide.colorAccent}
                  options={["Navy", "Gold", "Slate", "Graphite"]}
                  onChange={v => updateSlide(activeSlide.id, { colorAccent: v as ColorAccent })}
                />
              </div>
            ) : (
              <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>Select a slide</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: thumbnail strip (left) + viz style (right) ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden" style={{ background: "#EDE9E0" }}>

        {/* Slide strip */}
        <div className="flex flex-col flex-1 min-w-0 border-r overflow-hidden" style={{ borderColor: BORDER }}>
          {/* Strip header */}
          <div className="flex items-center gap-2 shrink-0 px-5 pt-2 pb-1">
            <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>Presentation</span>
            <span style={{ fontFamily: mono, fontSize: 9, color: T3, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "1px 7px" }}>
              {slides.length}
            </span>
          </div>

          {/* Thumbnails */}
          <div style={{
            flex: 1, display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            alignContent: "center",
            gap: 8, paddingLeft: 20, paddingRight: 20, paddingTop: 4, overflow: "hidden",
          }}>
            {pageSlides.map(slide => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                isActive={activeSlide?.id === slide.id}
                onClick={() => setActiveSlide(slide.id)}
                onDelete={() => handleRemove(slide.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "4px 0 6px", flexShrink: 0 }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{ fontFamily: mono, fontSize: 9.5, color: T3, background: "none", border: "none", cursor: safePage === 0 ? "default" : "pointer", opacity: safePage === 0 ? 0.35 : 1, padding: "2px 6px" }}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{
                  fontFamily: mono, fontSize: 9.5, width: 20, height: 20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 2, border: "none", cursor: "pointer",
                  background: i === safePage ? NAVY : "transparent",
                  color: i === safePage ? "#F5F2EA" : T3,
                  transition: "background 150ms, color 150ms",
                }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              style={{ fontFamily: mono, fontSize: 9.5, color: T3, background: "none", border: "none", cursor: safePage >= totalPages - 1 ? "default" : "pointer", opacity: safePage >= totalPages - 1 ? 0.35 : 1, padding: "2px 6px" }}>
              Next →
            </button>
          </div>
        </div>

        {/* Viz style + Build */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 220, background: SURFACE }}>
          <div className="px-4 pt-2 pb-1 shrink-0 border-b" style={{ borderColor: BORDER }}>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.09em", textTransform: "uppercase", color: T3 }}>Visualization Style</span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll px-4 py-3 flex flex-col gap-4">
            {activeSlide ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 6, rowGap: 8 }}>
                  {(["Modern", "Magazine", "Wireframe"] as VisualStyle[]).map(s => (
                    <StyleTile key={s} style={s} active={activeSlide.visualStyle === s}
                      onClick={() => updateSlide(activeSlide.id, { visualStyle: s })} />
                  ))}
                  <ToggleSwitch label="Labels" checked={activeSlide.showLabels}  onChange={v => updateSlide(activeSlide.id, { showLabels: v })} />
                  <ToggleSwitch label="Grid"   checked={activeSlide.showGrid}    onChange={v => updateSlide(activeSlide.id, { showGrid: v })} />
                  <ToggleSwitch label="Stack"  checked={activeSlide.stackedBars} onChange={v => updateSlide(activeSlide.id, { stackedBars: v })} />
                </div>
                <button
                  className="w-full font-medium transition-opacity duration-150 hover:opacity-85"
                  style={{
                    fontFamily: mono, fontSize: 11, color: "#F5F2EA",
                    background: NAVY, border: "none",
                    padding: "8px 0", borderRadius: 999,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}>
                  Build Presentation
                </button>
              </>
            ) : (
              <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>Select a slide</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

