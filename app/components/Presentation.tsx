"use client";

import { useState } from "react";
import type { CardState, ChartType } from "@/lib/mockData";
import { MiniChart } from "./MiniChart";

/* ── Types ─────────────────────────────────────────────── */
export type VisualStyle = "Wireframe" | "Magazine" | "Modern";
export type ColorAccent = "Navy" | "Indigo" | "Slate" | "Graphite";

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

/* ── Constants ──────────────────────────────────────────── */
const ACCENT_COLOR: Record<ColorAccent, string> = {
  Navy:     "#1F2A44",
  Indigo:   "#3B4BDB",
  Slate:    "#475569",
  Graphite: "#374151",
};
const STYLE_BG: Record<VisualStyle, string> = {
  Modern:    "#FFFFFF",
  Magazine:  "#FFFFFF",
  Wireframe: "#F7F7F4",
};
const STYLE_HEADLINE_FONT: Record<VisualStyle, string> = {
  Modern:    "Inter, sans-serif",
  Magazine:  "'Instrument Serif', Georgia, serif",
  Wireframe: "'JetBrains Mono', monospace",
};

const INDIGO  = "#3B4BDB";
const BORDER  = "#E8E4DC";
const T2      = "#6B6B66";
const T3      = "#A8A8A2";
const NAVY    = "#1F2A44";
const GOLD    = "#B8924A";

/* ── SlideThumbnail ─────────────────────────────────────── */
function SlideThumbnail({
  slide, card, isActive, onClick,
}: {
  slide: SlideState;
  card: CardState;
  isActive: boolean;
  onClick: () => void;
}) {
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
      onClick={onClick}
      className="shrink-0 cursor-pointer overflow-hidden"
      style={{
        width: 116, height: 76,
        borderRadius: 4,
        border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? INDIGO : "#ECECE6"}`,
        background: bg,
        transition: "border-color 150ms ease, border-width 150ms ease",
      }}
    >
      <svg viewBox="0 0 116 76" fill="none" style={{ width: "100%", height: "100%" }}>
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
      className="flex-1 rounded-md border overflow-hidden transition-all duration-150"
      style={{
        height: 34,
        borderColor: active ? INDIGO : BORDER,
        background: active ? "rgba(59,75,219,0.05)" : "transparent",
      }}
    >
      <svg viewBox="0 0 56 30" fill="none" style={{ width: "100%", height: "100%" }}>
        {style === "Modern" && (
          <>
            <rect x="5"  y="16" width="8" height="10" rx="1.5" fill={INDIGO} fillOpacity={active ? 0.85 : 0.25} />
            <rect x="15" y="10" width="8" height="16" rx="1.5" fill={INDIGO} fillOpacity={active ? 0.55 : 0.15} />
            <rect x="25" y="6"  width="8" height="20" rx="1.5" fill={INDIGO} fillOpacity={active ? 0.75 : 0.2} />
            <rect x="35" y="12" width="8" height="14" rx="1.5" fill={INDIGO} fillOpacity={active ? 0.45 : 0.12} />
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
              stroke={active ? INDIGO : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="15" y="9"  width="8" height="17" rx="1" fill="none"
              stroke={active ? INDIGO : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
            <rect x="25" y="17" width="8" height="9"  rx="1" fill="none"
              stroke={active ? INDIGO : T3} strokeWidth="0.85" strokeOpacity={active ? 0.8 : 0.45} />
          </>
        )}
        {/* Label */}
        <text x="28" y="30" textAnchor="middle" fontSize="5.5"
          fontFamily="'JetBrains Mono', monospace"
          fill={active ? INDIGO : T3}
          fillOpacity={active ? 1 : 0.7}>
          {style}
        </text>
      </svg>
    </button>
  );
}

/* ── PanelSelect ────────────────────────────────────────── */
function PanelSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 7.5,
        letterSpacing: "0.09em",
        textTransform: "uppercase" as const,
        color: T3,
        whiteSpace: "nowrap" as const,
        marginBottom: 3,
      }}>
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%",
            appearance: "none" as const,
            WebkitAppearance: "none" as const,
            background: "#fff",
            border: `1px solid ${BORDER}`,
            borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: T2,
            paddingLeft: 7,
            paddingRight: 20,
            paddingTop: 4,
            paddingBottom: 4,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"
          stroke={T3} strokeWidth="1.3" strokeLinecap="round"
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <path d="M1 2.5l2.5 2.5L6 2.5" />
        </svg>
      </div>
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
          position: "absolute", inset: 0, borderRadius: 7,
          background: checked ? INDIGO : BORDER,
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
function SettingsPanel({
  slide, card, onUpdate,
}: {
  slide: SlideState;
  card: CardState;
  onUpdate: (update: Partial<SlideState>) => void;
}) {
  const serial = String(card.serial).padStart(2, "0");

  return (
    <div className="flex flex-col h-full" style={{ padding: "11px 16px 12px" }}>

      {/* Header */}
      <div className="flex items-center justify-between shrink-0" style={{ marginBottom: 7 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: T3,
        }}>
          Chart Settings
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: T3 }}>
          {serial} /{" "}
          <span style={{ color: "#0A0A0A" }}>
            {card.headline.length > 26 ? card.headline.slice(0, 26) + "…" : card.headline}
          </span>
        </span>
      </div>

      {/* Inputs — auto-fit grid: 3 cols when wide, 2 when narrow, never crops */}
      <div
        className="shrink-0"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 7,
          marginBottom: 7,
        }}
      >
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
          options={["Navy", "Indigo", "Slate", "Graphite"]}
          onChange={v => onUpdate({ colorAccent: v as ColorAccent })}
        />
      </div>

      {/* Style tiles + Toggles — shared 3-column grid, visually aligned */}
      <div
        className="shrink-0"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          columnGap: 6,
          rowGap: 5,
          marginBottom: 7,
        }}
      >
        {/* Row 1: style tiles */}
        {(["Modern", "Magazine", "Wireframe"] as VisualStyle[]).map(s => (
          <StyleTile
            key={s} style={s}
            active={slide.visualStyle === s}
            onClick={() => onUpdate({ visualStyle: s })}
          />
        ))}
        {/* Row 2: toggles, aligned under each tile */}
        <ToggleSwitch label="Labels" checked={slide.showLabels}  onChange={v => onUpdate({ showLabels: v })} />
        <ToggleSwitch label="Grid"   checked={slide.showGrid}    onChange={v => onUpdate({ showGrid: v })} />
        <ToggleSwitch label="Stack"  checked={slide.stackedBars} onChange={v => onUpdate({ stackedBars: v })} />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div className="flex shrink-0" style={{ gap: 7 }}>
        <button
          className="flex items-center gap-[5px] rounded-lg border transition-colors duration-150"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: T2,
            borderColor: BORDER,
            background: "transparent",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(31,42,68,0.3)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 1v8M1 5h8" />
          </svg>
          Add Chart
        </button>
        <button
          className="flex-1 rounded-lg font-medium transition-opacity duration-150 hover:opacity-85"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#fff",
            background: INDIGO,
            border: "none",
            padding: "6px 0",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          Build Presentation
        </button>
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

/* ── PresentationStrip ──────────────────────────────────── */
interface PresentationStripProps {
  slides: SlideState[];
  cards: CardState[];
  onUpdateSlide: (cardId: string, update: Partial<SlideState>) => void;
  onAddSlide: () => void;
}

export function PresentationStrip({
  slides, cards, onUpdateSlide, onAddSlide,
}: PresentationStripProps) {
  const [activeId, setActiveId] = useState<string | null>(slides[0]?.cardId ?? null);

  const activeSlide = slides.find(s => s.cardId === activeId) ?? null;
  const activeCard  = activeSlide ? cards.find(c => c.id === activeSlide.cardId) ?? null : null;

  return (
    <section
      className="shrink-0 flex border-t"
      style={{ height: 220, borderColor: BORDER, background: "#fff" }}
    >
      {/* ── Left: slide strip ── */}
      <div className="flex flex-col border-r" style={{ flex: "1 1 0", minWidth: 0, borderColor: BORDER }}>

        {/* Strip header */}
        <div className="flex items-center justify-between px-5 shrink-0" style={{ paddingTop: 10, paddingBottom: 6 }}>
          <div className="flex items-center gap-2">
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              color: T3,
            }}>
              Presentation
            </span>
            <span
              className="font-mono border rounded-full"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: T3,
                borderColor: BORDER,
                padding: "1px 7px",
              }}
            >
              {slides.length}
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        <div
          className="flex items-center thin-scroll"
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            gap: 10,
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 10,
          }}
        >
          {slides.map(slide => {
            const card = cards.find(c => c.id === slide.cardId);
            if (!card) return null;
            return (
              <SlideThumbnail
                key={slide.cardId}
                slide={slide}
                card={card}
                isActive={activeId === slide.cardId}
                onClick={() => setActiveId(slide.cardId)}
              />
            );
          })}

          {/* Add slide */}
          <button
            onClick={onAddSlide}
            className="flex items-center justify-center shrink-0 transition-all duration-150"
            style={{
              width: 116, height: 76,
              borderRadius: 4,
              border: "1.5px dashed #ECECE6",
              background: "transparent",
              cursor: "pointer",
              color: T3,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T3)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#ECECE6")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 2v10M2 7h10" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Right: settings panel ── */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ flex: "0 0 400px", background: "#FAFAF7" }}
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
