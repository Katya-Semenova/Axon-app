"use client";

import { useDraggable } from "@dnd-kit/core";
import { ChartRenderer } from "../ChartRenderer";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import type { DataSet, ChartType } from "@/lib/types";
import { GOLD, NAVY, BORDER, T3, SURFACE_RAISE } from "../ui/tokens";

/**
 * DataSet card — 2nd-level entity. Title + aggregate chart + chart-type
 * dropdown + drag handle. Has an INPUT port on the left (receives wires from
 * Insight outputs). The whole card is also draggable via @dnd-kit; dropping
 * it on a slide slot in PresentationStructure binds the DataSet to that slide.
 */
export interface DataSetCardProps {
  dataSet: DataSet;
  isDraggingNode?: boolean;
  isConnecting: boolean;
  onExpand: () => void;
  onChartTypeChange: (type: ChartType) => void;
  onInputPortUp: (e: React.MouseEvent) => void;
}

export function DataSetCard({
  dataSet, isDraggingNode, isConnecting,
  onExpand, onChartTypeChange, onInputPortUp,
}: DataSetCardProps) {
  /* @dnd-kit: this card is the source of a drag-to-slide operation. The
     draggable id encodes the dataset id so the slide drop slot knows what
     was dropped without a separate state hop. */
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `dataset:${dataSet.id}`,
    data: { type: "dataset", dataSetId: dataSet.id },
  });

  const padded = String(dataSet.serial).padStart(2, "0");

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="group relative rounded-none p-[14px] transition-colors duration-200"
      data-is-card=""
      style={{
        background: SURFACE_RAISE,
        cursor: isDraggingNode ? "grabbing" : "grab",
        opacity: isDraggingNode || isDragging ? 0.45 : 1,
        transition: "opacity 150ms ease, box-shadow 150ms ease",
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Left input port — receives wires from Insight outputs */}
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
          e.currentTarget.style.transform = `translateY(-50%) scale(${targeting ? 1.5 : 1.22})`;
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

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-[6px]">
          {/* Drag handle (dnd-kit listeners) — restricted to this grip so the
              card can still be node-dragged on the canvas by its body. */}
          <div
            {...listeners}
            title="Drag to a slide in Presentation Structure"
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              cursor: "grab",
              color: T3,
              lineHeight: 0,
              padding: "2px 1px",
              flexShrink: 0,
              touchAction: "none",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = NAVY; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T3; }}
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
              <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
              <circle cx="2" cy="6"  r="1.2" /><circle cx="6" cy="6"  r="1.2" />
              <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
            </svg>
          </div>
          <span className="font-mono text-[11px] text-t3 tracking-[0.08em]">{padded} /</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.1em",
            color: NAVY,
            background: "rgba(27,40,64,0.06)",
            border: `1px solid ${BORDER}`,
            padding: "1px 5px",
            borderRadius: 2,
          }}>DATA SET</span>
        </div>
        <ChartTypeDropdown value={dataSet.chartType} onChange={onChartTypeChange} />
      </div>

      {/* Title */}
      <div className="text-[13px] font-medium text-t1 leading-[1.4] mb-2">{dataSet.title}</div>

      {/* Chart */}
      <div className="w-full mb-2 flex items-center justify-center overflow-hidden">
        <ChartRenderer rows={dataSet.rows} columns={dataSet.columns} chartType={dataSet.chartType} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-t3">
          {dataSet.rows.length} rows
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-[26px] h-[26px] shrink-0 rounded-sm border flex items-center justify-center transition-all duration-200"
          title="Expand"
          style={{ color: T3, borderColor: BORDER }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── Placeholder slot — "+ NEW DATA SET" ─────────────────────────────────
   Empty dashed card shown after the last DataSet in the right column. Click
   to add a fresh DataSet via the store. */
export function DataSetPlaceholder({ onClick }: { onClick: () => void }) {
  return (
    <div
      data-is-card=""
      onClick={onClick}
      className="border-[1.5px] border-dashed rounded-none flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{
        borderColor: BORDER,
        minHeight: 140,
        background: "transparent",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = "rgba(184,149,72,0.04)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "transparent"; }}
    >
      <div className="flex flex-col items-center gap-2" style={{ color: T3 }}>
        <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5">
          <path d="M9 3v12M3 9h12" />
        </svg>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5,
          letterSpacing: "0.08em",
        }}>+ NEW DATA SET</span>
      </div>
    </div>
  );
}
