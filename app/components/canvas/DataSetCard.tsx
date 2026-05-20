"use client";

import { useDraggable } from "@dnd-kit/core";
import { ChartRenderer } from "../ChartRenderer";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import type { DataSet, ChartType } from "@/lib/types";
import { GOLD, NAVY, BORDER, T3, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

const mono = "'JetBrains Mono', monospace";

export interface DataSetCardProps {
  dataSet: DataSet;
  isDraggingNode?: boolean;
  isConnecting: boolean;
  onExpand: () => void;
  onChartTypeChange: (type: ChartType) => void;
  onInputPortUp: (e: React.MouseEvent) => void;
  onDelete?: () => void;
}

/* ── DataSetCard ────────────────────────────────────────────────────────
   Two visual states:
   · EMPTY  (rows.length === 0): dashed outline, "connect an insight" hint.
   · FORMED (rows.length  >  0): renders chart + visible "на слайд" drag handle. */
export function DataSetCard({
  dataSet, isDraggingNode, isConnecting,
  onExpand, onChartTypeChange, onInputPortUp, onDelete,
}: DataSetCardProps) {
  const isEmpty = dataSet.rows.length === 0;
  const padded  = String(dataSet.serial).padStart(2, "0");

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:       `dataset:${dataSet.id}`,
    data:     { type: "dataset", dataSetId: dataSet.id },
    disabled: isEmpty,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="group relative rounded-none transition-colors duration-200"
      data-is-card=""
      style={{
        padding: "12px 14px 0 14px",
        background: SURFACE_RAISE,
        cursor: isDraggingNode ? "grabbing" : "default",
        opacity: isDragging ? 0.45 : 1,
        transition: "opacity 150ms ease",
        border: isEmpty
          ? `1.5px dashed ${BORDER}`
          : `1px solid ${BORDER}`,
      }}
    >
      {/* Left input port */}
      <div
        data-port="input"
        title="Input — wire an Insight here"
        className="absolute top-1/2"
        style={{
          left: -5, width: 12, height: 12, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)",
          cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onMouseUp={(e) => { if (isConnecting) { e.stopPropagation(); onInputPortUp(e); } }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          const targeting = isConnecting;
          e.currentTarget.style.transform = `translateY(-50%) scale(${targeting ? 1.5 : 1.25})`;
          e.currentTarget.style.background = targeting ? GOLD : NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = targeting
            ? "0 0 0 3px rgba(184,149,72,0.24)"
            : "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Delete button — only for empty datasets */}
      {isEmpty && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Remove data set"
          style={{
            position: "absolute", top: 3, right: 3, width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: `1px solid ${BORDER}`,
            borderRadius: 0, cursor: "pointer", color: T3, padding: 0, zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="6" height="6" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M1 1l6 6M7 1L1 7" />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-[6px]">
          <span style={{ fontFamily: mono, fontSize: 10, color: T3, letterSpacing: "0.06em" }}>{padded} /</span>
          <span style={{
            fontFamily: mono, fontSize: 7.5, letterSpacing: "0.1em",
            color: NAVY, background: "rgba(27,40,64,0.06)",
            border: `1px solid ${BORDER}`, padding: "1px 5px", borderRadius: 2,
          }}>DATA SET</span>
        </div>
        {!isEmpty && (
          <ChartTypeDropdown value={dataSet.chartType} onChange={onChartTypeChange} />
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 500, color: "#1B2840", lineHeight: 1.35, marginBottom: 8 }}>
        {dataSet.title}
      </div>

      {/* Body — empty state or live chart */}
      {isEmpty ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: 100, gap: 6, marginBottom: 12,
          border: `1px dashed ${BORDER}`, borderRadius: 2,
          background: SURFACE_MUTED,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={T3} strokeWidth="1.4" strokeLinecap="round">
            <circle cx="9" cy="9" r="7" />
            <path d="M9 6v3l2 2" />
          </svg>
          <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, textAlign: "center", lineHeight: 1.5 }}>
            Wire an Insight to<br />generate chart data
          </span>
        </div>
      ) : (
        <div className="w-full mb-2">
          <ChartRenderer rows={dataSet.rows} columns={dataSet.columns} chartType={dataSet.chartType} />
        </div>
      )}

      {/* Footer row — rows count + expand */}
      {!isEmpty && (
        <div className="flex items-center justify-between" style={{ paddingBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>
            {dataSet.rows.length} rows
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            title="Expand"
            style={{
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              color: T3, border: `1px solid ${BORDER}`, borderRadius: 2, background: "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty state footer */}
      {isEmpty && (
        <div className="flex items-center justify-between" style={{ paddingBottom: 10 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>no data</span>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            title="Expand"
            style={{
              width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
              color: T3, border: `1px solid ${BORDER}`, borderRadius: 2, background: "transparent",
              cursor: "pointer", flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
          >
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
            </svg>
          </button>
        </div>
      )}

      {/* ── "на слайд" drag handle — formed datasets only.
            Round-4 fix 2: ti-hand-finger icon at 18px (≈2× previous size) so
            the affordance reads clearly as draggable. Click-to-send is still
            wired by dnd-kit's listeners on this whole strip. */}
      {!isEmpty && (
        <div
          data-grip=""
          {...listeners}
          title="Перетащите карточку на слайд"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
            padding: "10px 14px",
            marginLeft: -14, marginRight: -14,
            borderTop: `1.5px solid ${BORDER}`,
            cursor: isDragging ? "grabbing" : "grab",
            color: T3,
            touchAction: "none",
            userSelect: "none",
            transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(184,149,72,0.07)";
            e.currentTarget.style.color = GOLD;
            e.currentTarget.style.borderColor = "rgba(184,149,72,0.35)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = T3;
            e.currentTarget.style.borderColor = BORDER;
          }}
        >
          {/* ti-hand-finger — 18 px, stroke matches surrounding text */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5" />
            <path d="M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5" />
            <path d="M14 5.5a1.5 1.5 0 0 1 3 0v6.5" />
            <path d="M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7l-.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />
          </svg>
          <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.07em", fontWeight: 500 }}>на слайд</span>
        </div>
      )}
    </div>
  );
}

/* ── "+ NEW DATA SET" — high-contrast anchor button ─────────────────────── */
export function DataSetPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-is-card=""
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        width: "100%", padding: "15px 20px",
        background: "#1B2840",
        border: "none", borderRadius: 0, cursor: "pointer",
        boxShadow: "0 4px 18px rgba(27,40,64,0.32)",
        transition: "transform 200ms ease, box-shadow 200ms ease, background 200ms ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#243252";
        e.currentTarget.style.transform = "scale(1.028)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(27,40,64,0.50)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#1B2840";
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 18px rgba(27,40,64,0.32)";
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
        stroke="rgba(245,242,234,0.88)" strokeWidth="1.7" strokeLinecap="round">
        <path d="M6.5 1v11M1 6.5h11" />
      </svg>
      <span style={{
        fontFamily: mono, fontSize: 10.5, letterSpacing: "0.13em",
        color: "#F5F2EA", fontWeight: 500,
      }}>
        NEW DATA SET
      </span>
    </button>
  );
}
