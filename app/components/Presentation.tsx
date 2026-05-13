"use client";

import { useState, useRef, useEffect } from "react";
import type { CardState, ChartType } from "@/lib/mockData";
import { MiniChart } from "./MiniChart";

/* ── Types ─────────────────────────────────────────────── */
export type VisualStyle = "Wireframe" | "Magazine" | "Modern";
export type ColorAccent = "Navy" | "Gold" | "Slate" | "Graphite";

export interface SlideState {
  cardId: string;
  visualStyle: VisualStyle;
  chartType: ChartType;
  colorAccent: ColorAccent;
  showLabels: boolean;
  showGrid: boolean;
  stackedBars: boolean;
  aggregation: "Monthly" | "Weekly" | "Daily";
  colorBy: string;
  status: string;
}

/* ── Constants — Editorial Density palette only ─────────── */
const ACCENT_COLOR: Record<ColorAccent, string> = {
  Navy:     "#1B2840",  /* navy-900 */
  Gold:     "#B89548",  /* gold-500 — replaces Indigo */
  Slate:    "#4A5878",  /* navy-500 (warm slate) */
  Graphite: "#2A3654",  /* navy-700 */
};
const STYLE_BG: Record<VisualStyle, string> = {
  Modern:    "#FBF9F3",  /* surface-raised — no pure white */
  Magazine:  "#FBF9F3",
  Wireframe: "#F5F2EA",  /* surface */
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

/* The system's ONE accent — replaces all prior #3B4BDB NAVY. */
const GOLD          = "#B89548";  /* gold-500 — active/focus/current */
const BORDER        = "#D9D3C2";  /* border-subtle */
const SURFACE       = "#F5F2EA";
const SURFACE_RAISE = "#FBF9F3";
const SURFACE_MUTED = "#E5E0D2";
const T2            = "#5C6478";  /* text-secondary */
const T3            = "#8A8B87";  /* text-tertiary */
const NAVY          = "#1B2840";  /* navy-900 — primary structural */

/* ── SlideThumbnail ─────────────────────────────────────── */
function SlideThumbnail({
  slide, card, isActive, onClick, onDelete,
}: {
  slide: SlideState;
  card: CardState;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const serial      = String(card.serial).padStart(2, "0");
  const headline    = card.headline.length > 28
    ? card.headline.slice(0, 28) + "…" : card.headline;
  const accentColor = ACCENT_COLOR[slide.colorAccent];
  const bg          = STYLE_BG[slide.visualStyle];
  const headFont    = STYLE_HEADLINE_FONT[slide.visualStyle];

  const wireDots = slide.visualStyle === "Wireframe"
    ? Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 13 }, (_, col) => (
          <circle key={`${row}-${col}`}
            cx={6 + col * 8} cy={32 + row * 7}
            r="0.6" fill={T3} fillOpacity="0.45" />
        ))
      ).flat()
    : null;

  return (
    <div
      style={{ position: "relative", aspectRatio: "116 / 76" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail body */}
      <div
        onClick={onClick}
        className="cursor-pointer overflow-hidden"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? NAVY : hovered ? GOLD : "#D9D3C2"}`,
          background: bg,
          transition: "border-color 150ms ease, border-width 150ms ease",
        }}
      >
        <svg viewBox="0 0 116 76" fill="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="116" height="76" fill={bg} />
          {wireDots}
          <text x="6" y="11" fontSize="5" fontWeight="500" fill={T3}
            fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">
            {serial} /
          </text>
          <text x="6" y={slide.visualStyle === "Magazine" ? 23 : 21}
            fontSize={slide.visualStyle === "Magazine" ? 7.5 : 6.5}
            fontWeight={slide.visualStyle === "Magazine" ? "600" : "500"}
            fill="#0A0A0A" fontFamily={headFont}>
            {headline}
          </text>
          <g transform="translate(6, 30)">
            <MiniChart
              rows={card.rows}
              chartType={slide.chartType}
              color={accentColor}
              W={104} H={34}
            />
          </g>
        </svg>
      </div>

      {/* Delete button — fades in on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Remove slide"
        style={{
          position: "absolute",
          top: 3,
          right: 3,
          width: 15,
          height: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`,
          borderRadius: 0,
          cursor: "pointer",
          color: T3,
          padding: 0,
          opacity: hovered ? 1 : 0,
          transition: "opacity 150ms ease, color 150ms ease, border-color 150ms ease",
          zIndex: 2,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "#0A0A0A";
          e.currentTarget.style.borderColor = NAVY;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = T3;
          e.currentTarget.style.borderColor = BORDER;
        }}
      >
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1 1l6 6M7 1L1 7" />
        </svg>
      </button>
    </div>
  );
}

/* ── StyleTile ──────────────────────────────────────────── */
function StyleTile({
  style, active, onClick,
}: {
  style: VisualStyle;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-sm border overflow-hidden transition-all duration-150"
      style={{
        height: 64,
        borderColor: active ? NAVY : BORDER,
        background: active ? "rgba(27,40,64,0.05)" : "transparent",
      }}
    >
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
            <path d="M5 19 Q18 15 30 21 Q42 27 51 18 V27 H5Z"
              fill={active ? NAVY : T3} fillOpacity={active ? 0.2 : 0.1} />
            <circle cx="46" cy="10" r="5" fill={active ? GOLD : T3} fillOpacity={active ? 0.7 : 0.2} />
          </>
        )}
        {style === "Wireframe" && (
          <>
            {[10, 20, 30, 40].flatMap(x =>
              [8, 16, 24].map(y => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9"
                  fill={T3} fillOpacity={active ? 0.65 : 0.35} />
              ))
            )}
            <rect x="5"  y="14" width="8" height="12" rx="1" fill="none"
              stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="15" y="9"  width="8" height="17" rx="1" fill="none"
              stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="25" y="17" width="8" height="9"  rx="1" fill="none"
              stroke={active ? NAVY : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
          </>
        )}
        {/* Style name — small secondary */}
        <text x="28" y="36" textAnchor="middle" fontSize="4.5"
          fontFamily="'JetBrains Mono', monospace"
          fill={active ? NAVY : T3}
          fillOpacity={active ? 0.5 : 0.35}>
          {style}
        </text>
        {/* Library name — prominent */}
        <text x="28" y="49" textAnchor="middle" fontSize="6.5"
          fontWeight="500"
          fontFamily="'JetBrains Mono', monospace"
          fill={active ? NAVY : T3}
          fillOpacity={active ? 1 : 0.65}>
          {LIBRARY_NAME[style]}
        </text>
      </svg>
    </button>
  );
}

/* ── PanelSelect ─────────────────────────────────────────────────────────
 * Fully custom dropdown built from div / button / ul / li — zero native
 * <select> or OS chrome anywhere.  The menu uses position:fixed so it
 * escapes every overflow:hidden ancestor; it opens UPWARD because the
 * strip lives at the bottom of the viewport.
 *
 * Z-index ladder (root stacking context):
 *   backdrop  99  (fixed, blocks pointer events below the open field)
 *   wrapper  101  (relative + z-index creates a stacking context so the
 *                  trigger renders above the backdrop without extra tricks)
 *   menu     102  (fixed, above both)
 * ─────────────────────────────────────────────────────────────────────── */
function PanelSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen]         = useState(false);
  const triggerRef              = useRef<HTMLButtonElement>(null);
  const [rect, setRect]         = useState<DOMRect | null>(null);

  function handleToggle() {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  function handleSelect(opt: string) {
    onChange(opt);
    setOpen(false);
  }

  return (
    /* wrapper creates stacking context at z=101 when open */
    <div style={{ position: "relative", zIndex: open ? 101 : "auto" }}>

      {/* Tiny field label */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 7.5,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: T3,
        marginBottom: 3,
        whiteSpace: "nowrap" as const,
      }}>
        {label}
      </div>

      {/* Full-viewport backdrop — closes menu, sits below wrapper (z 99 < 101) */}
      {open && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 99,
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: SURFACE_RAISE,
          border: `1px solid ${open ? NAVY : BORDER}`,
          borderRadius: 4,
          padding: "3px 6px 3px 8px",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          lineHeight: 1.5,
          color: T2,
          cursor: "pointer",
          outline: "none",
          userSelect: "none" as const,
          transition: "border-color 150ms",
        }}
      >
        <span style={{
          flex: 1,
          textAlign: "left" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }}>
          {value}
        </span>
        <svg
          width="7" height="7" viewBox="0 0 7 7" fill="none"
          stroke={T3} strokeWidth="1.3" strokeLinecap="round"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 150ms",
          }}
        >
          <path d="M1 2.5l2.5 2.5L6 2.5" />
        </svg>
      </button>

      {/* Menu — position:fixed escapes overflow:hidden parents; opens upward */}
      {open && rect && (
        <ul
          role="listbox"
          style={{
            /* bottom of menu = top of trigger − 4 px gap */
            position: "fixed",
            bottom: window.innerHeight - rect.top + 4,
            left: rect.left,
            minWidth: Math.max(rect.width, 108),
            zIndex: 102,
            margin: 0,
            padding: "4px 0",
            listStyle: "none",
            background: SURFACE_RAISE,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            boxShadow: "0 2px 10px rgba(27,40,64,0.07)",
          }}
        >
          {options.map(opt => (
            <li key={opt} role="option" aria-selected={opt === value}
              style={{ margin: 0, padding: 0 }}>
              <button
                type="button"
                onClick={() => handleSelect(opt)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left" as const,
                  padding: "5px 10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  lineHeight: 1.5,
                  color: opt === value ? NAVY : T2,
                  fontWeight: opt === value ? 500 : 400,
                  background: opt === value ? SURFACE_MUTED : "transparent",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                  outline: "none",
                  transition: "background 80ms",
                  userSelect: "none" as const,
                }}
                onMouseEnter={e => {
                  if (opt !== value) e.currentTarget.style.background = SURFACE_MUTED;
                }}
                onMouseLeave={e => {
                  if (opt !== value) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── ToggleSwitch ───────────────────────────────────────── */
function ToggleSwitch({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-[5px]"
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <div style={{ position: "relative", width: 26, height: 14, flexShrink: 0 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999,
          background: checked ? NAVY : BORDER,
          transition: "background 150ms ease",
        }} />
        <div style={{
          position: "absolute",
          top: 2,
          left: checked ? 12 : 2,
          width: 10, height: 10, borderRadius: "50%",
          background: "#fff",
          transition: "left 150ms ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9.5,
        color: checked ? T2 : T3,
        transition: "color 150ms ease",
        userSelect: "none",
      }}>
        {label}
      </span>
    </button>
  );
}

/* ── SettingsPanel ──────────────────────────────────────── */
/*
 * Two-column flex-row layout so content never overflows vertically.
 * Left column: header + dropdowns + actions (width: 284px).
 * Right column: visualization style tiles + toggles (width: 216px).
 * The outer wrapper has no fixed width, so it sizes to content (≈ 501px)
 * and naturally claims that space from the slide strip on its left.
 */
function SettingsPanel({
  slide, card, onUpdate,
}: {
  slide: SlideState;
  card: CardState;
  onUpdate: (update: Partial<SlideState>) => void;
}) {
  const serial = String(card.serial).padStart(2, "0");
  const mono = "'JetBrains Mono', monospace";

  return (
    <div style={{ display: "flex", height: "100%" }}>

      {/* ── Left: header + dropdowns + actions ── */}
      <div style={{
        width: 284,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "12px 14px",
        gap: 7,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: T3 }}>
            Chart Settings
          </span>
          <span style={{ fontFamily: mono, fontSize: 8.5, color: T3 }}>
            {serial} /{" "}
            <span style={{ color: "#0A0A0A" }}>
              {card.headline.length > 22 ? card.headline.slice(0, 22) + "…" : card.headline}
            </span>
          </span>
        </div>

        {/* Inputs — 3-col auto-fit within the 256px content area */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(72px, 1fr))",
          gap: 8,
          flexShrink: 0,
        }}>
          <PanelSelect
            label="Status"
            value={slide.status}
            options={["All", "Paid", "Pending", "Failed"]}
            onChange={v => onUpdate({ status: v })}
          />
          <PanelSelect
            label="Aggregation"
            value={slide.aggregation}
            options={["Monthly", "Weekly", "Daily"]}
            onChange={v => onUpdate({ aggregation: v as SlideState["aggregation"] })}
          />
          <PanelSelect
            label="Color By"
            value={slide.colorBy}
            options={["Segment", "Category", "Region", "None"]}
            onChange={v => onUpdate({ colorBy: v })}
          />
          <PanelSelect
            label="Filter"
            value="All data"
            options={["All data", "Top 10", "Bottom 10", "Outliers"]}
            onChange={() => {}}
          />
          <PanelSelect
            label="Accent"
            value={slide.colorAccent}
            options={["Navy", "Gold", "Slate", "Graphite"]}
            onChange={v => onUpdate({ colorAccent: v as ColorAccent })}
          />
        </div>

        {/* Spacer — pushes actions to bottom */}
        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
          <button
            className="flex items-center gap-[5px] border transition-colors duration-150"
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: T2,
              borderColor: BORDER,
              background: "transparent",
              padding: "7px 14px",
              borderRadius: 999,
              whiteSpace: "nowrap" as const,
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = NAVY)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 1v8M1 5h8" />
            </svg>
            Add Chart
          </button>
          <button
            className="flex-1 font-medium transition-opacity duration-150 hover:opacity-85"
            style={{
              fontFamily: mono,
              fontSize: 11,
              color: "#F5F2EA",
              background: NAVY,
              border: "none",
              padding: "7px 0",
              borderRadius: 999,
              whiteSpace: "nowrap" as const,
              cursor: "pointer",
            }}
          >
            Build Presentation
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, flexShrink: 0, alignSelf: "stretch", background: BORDER }} />

      {/* ── Right: visualization style ── */}
      <div style={{
        width: 216,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        padding: "12px 14px",
        gap: 8,
      }}>

        {/* Sub-header */}
        <div style={{
          fontFamily: mono,
          fontSize: 7.5,
          letterSpacing: "0.09em",
          textTransform: "uppercase" as const,
          color: T3,
          flexShrink: 0,
        }}>
          Visualization Style
        </div>

        {/* Style tiles — row 1 */}
        {/* Toggles  — row 2, each aligned under its tile */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          columnGap: 6,
          rowGap: 8,
        }}>
          {(["Modern", "Magazine", "Wireframe"] as VisualStyle[]).map(s => (
            <StyleTile
              key={s} style={s}
              active={slide.visualStyle === s}
              onClick={() => onUpdate({ visualStyle: s })}
            />
          ))}
          <ToggleSwitch label="Labels" checked={slide.showLabels}  onChange={v => onUpdate({ showLabels: v })} />
          <ToggleSwitch label="Grid"   checked={slide.showGrid}    onChange={v => onUpdate({ showGrid: v })} />
          <ToggleSwitch label="Stack"  checked={slide.stackedBars} onChange={v => onUpdate({ stackedBars: v })} />
        </div>
      </div>

    </div>
  );
}

/* ── EmptyPanel ─────────────────────────────────────────── */
function EmptyPanel() {
  return (
    <div className="flex flex-col items-center justify-center h-full" style={{ padding: "0 20px" }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: T3,
        textAlign: "center" as const,
        lineHeight: 1.5,
      }}>
        Select a slide to edit its settings
      </span>
    </div>
  );
}

const SLIDES_PER_PAGE = 4;

/* ── PresentationStrip ──────────────────────────────────── */
interface PresentationStripProps {
  slides: SlideState[];
  cards: CardState[];
  onUpdateSlide: (cardId: string, update: Partial<SlideState>) => void;
  onAddSlide: () => void;
  onCardDrop: (cardId: string) => void;
  onRemoveSlide: (cardId: string) => void;
  isDraggingCard: boolean;
}

export function PresentationStrip({
  slides, cards, onUpdateSlide, onAddSlide, onCardDrop, onRemoveSlide, isDraggingCard,
}: PresentationStripProps) {
  const [activeId, setActiveId]     = useState<string | null>(slides[0]?.cardId ?? null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [page, setPage]             = useState(0);
  const dragCounter                 = useRef(0);
  const prevLenRef                  = useRef(slides.length);

  const totalPages = Math.max(1, Math.ceil(slides.length / SLIDES_PER_PAGE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageSlides = slides.slice(safePage * SLIDES_PER_PAGE, (safePage + 1) * SLIDES_PER_PAGE);

  useEffect(() => {
    if (slides.length > prevLenRef.current) {
      setPage(Math.floor((slides.length - 1) / SLIDES_PER_PAGE));
    }
    prevLenRef.current = slides.length;
  }, [slides.length]);

  function handleRemove(cardId: string) {
    onRemoveSlide(cardId);
    if (activeId === cardId) {
      const remaining = slides.filter(s => s.cardId !== cardId);
      setActiveId(remaining[0]?.cardId ?? null);
    }
  }

  const activeSlide = slides.find(s => s.cardId === activeId) ?? null;
  const activeCard  = activeSlide ? cards.find(c => c.id === activeSlide.cardId) ?? null : null;

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    onCardDrop(e.dataTransfer.getData("text/plain"));
  }

  return (
    <section
      className="shrink-0 flex border-t"
      style={{
        height: 214,
        borderColor: isDragOver ? GOLD : isDraggingCard ? "rgba(184,149,72,0.45)" : BORDER,
        background: "#EDE9E0",
        transition: "border-color 150ms ease",
      }}
    >
      {/* ── Left: slide strip ── */}
      <div
        className="flex flex-col border-r"
        style={{
          flex: "1 1 0",
          minWidth: 0,
          borderColor: isDragOver ? GOLD : BORDER,
          position: "relative",
          transition: "border-color 150ms ease",
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >

        {/* Strip header */}
        <div
          className="flex items-center gap-2 shrink-0"
          style={{ padding: "10px 20px 6px" }}
        >
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: T3,
          }}>
            Presentation
          </span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: T3,
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            padding: "1px 7px",
          }}>
            {slides.length}
          </span>
        </div>

        {/* Thumbnails — paginated grid, 4 per page */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            alignContent: "center",
            gap: 8,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 8,
            paddingBottom: 0,
            overflow: "hidden",
          }}
        >
          {pageSlides.map(slide => {
            const card = cards.find(c => c.id === slide.cardId);
            if (!card) return null;
            return (
              <SlideThumbnail
                key={slide.cardId}
                slide={slide}
                card={card}
                isActive={activeId === slide.cardId}
                onClick={() => setActiveId(slide.cardId)}
                onDelete={() => handleRemove(slide.cardId)}
              />
            );
          })}
        </div>

        {/* Pagination bar — always visible */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            paddingBottom: 8,
            paddingTop: 4,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              color: T3,
              background: "none",
              border: "none",
              cursor: safePage === 0 ? "default" : "pointer",
              opacity: safePage === 0 ? 0.35 : 1,
              pointerEvents: safePage === 0 ? "none" : "auto",
              padding: "2px 6px",
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9.5,
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                border: "none",
                cursor: "pointer",
                background: i === safePage ? NAVY : "transparent",
                color: i === safePage ? "#F5F2EA" : T3,
                transition: "background 150ms, color 150ms",
              }}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9.5,
              color: T3,
              background: "none",
              border: "none",
              cursor: safePage >= totalPages - 1 ? "default" : "pointer",
              opacity: safePage >= totalPages - 1 ? 0.35 : 1,
              pointerEvents: safePage >= totalPages - 1 ? "none" : "auto",
              padding: "2px 6px",
            }}
          >
            Next →
          </button>
        </div>

        {/* Drop overlay — shown when a canvas card is dragged over the strip */}
        {isDragOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "rgba(184,149,72,0.06)",
              border: `2px dashed ${GOLD}`,
              pointerEvents: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 2v10M4 7l5-5 5 5" />
              <path d="M2 14h14" />
            </svg>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: GOLD, fontWeight: 500 }}>
              Drop card here
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T2 }}>
              Add insights to build your presentation
            </span>
          </div>
        )}
      </div>

      {/* ── Right: settings panel ──
           flex-shrink:0 + no explicit width → panel sizes to its content (~501px),
           claiming that horizontal space from the slide strip on the left.        ── */}
      <div
        className="overflow-hidden"
        style={{ flexShrink: 0, background: SURFACE }}
      >
        {activeSlide && activeCard
          ? (
            <SettingsPanel
              slide={activeSlide}
              card={activeCard}
              onUpdate={update => onUpdateSlide(activeSlide.cardId, update)}
            />
          )
          : <EmptyPanel />
        }
      </div>
    </section>
  );
}
