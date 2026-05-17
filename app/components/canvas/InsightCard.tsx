"use client";

import type { Insight } from "@/lib/types";
import { GOLD, NAVY, BORDER, T2, T3, SURFACE_RAISE } from "../ui/tokens";

/**
 * Insight card — 3rd-level entity. Title + a compact preview of the
 * payload. Never shows a chart: that's the contract for this level.
 *
 * Ports:
 *   - Right side: output port. An insight feeds one or more DataSets.
 *     Drag from here onto a DataSet's input port to wire them.
 *   - Left side: none — insights have no upstream entity in the hierarchy.
 */
export interface InsightCardProps {
  insight: Insight;
  isDraggingNode?: boolean;
  isConnecting: boolean;
  onExpand: () => void;
  onOutputPortDown: (e: React.MouseEvent) => void;
}

export function InsightCard({
  insight, isDraggingNode, isConnecting, onExpand, onOutputPortDown,
}: InsightCardProps) {
  const padded = String(insight.serial).padStart(2, "0");

  return (
    <div
      className="group relative rounded-none p-[12px] transition-colors duration-200"
      data-is-card=""
      style={{
        background: SURFACE_RAISE,
        cursor: isDraggingNode ? "grabbing" : "grab",
        opacity: isDraggingNode ? 0.45 : 1,
        transition: "opacity 150ms ease, box-shadow 150ms ease",
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Right output port — only port for insights */}
      <div
        data-port="output"
        title="Output — drag onto a Data Set"
        className="absolute top-1/2"
        style={{
          right: -5, width: 10, height: 10, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)",
          cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onOutputPortDown(e); }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.22)";
          e.currentTarget.style.background = NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-[6px]">
          <span className="font-mono text-[11px] text-t3 tracking-[0.08em]">{padded} /</span>
          <KindBadge kind={insight.kind} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-[20px] h-[20px] shrink-0 rounded-sm flex items-center justify-center transition-all duration-200"
          title="Expand"
          style={{ color: T3, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="text-[12px] font-medium text-t1 leading-[1.35] mb-2">
        {insight.title}
      </div>

      {/* Preview — kind-specific, never a chart */}
      <InsightPreview insight={insight} />

      {/* Footer — small confidence indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: BORDER }}>
        <span className="font-mono text-[9.5px] text-t3">Conf {insight.confPct}%</span>
        {isConnecting && (
          <span className="font-mono text-[9.5px]" style={{ color: GOLD }}>connecting…</span>
        )}
      </div>
    </div>
  );
}

/* ── Kind badge — small text label, no icon ─────────────────────────────── */
function KindBadge({ kind }: { kind: Insight["kind"] }) {
  const label = kind.toUpperCase();
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 8,
      letterSpacing: "0.1em",
      color: T2,
      background: "rgba(27,40,64,0.06)",
      border: `1px solid ${BORDER}`,
      padding: "1px 5px",
      borderRadius: 2,
    }}>{label}</span>
  );
}

/* ── Preview — compact, payload-specific ───────────────────────────────── */
function InsightPreview({ insight }: { insight: Insight }) {
  if (insight.kind === "data" && insight.data) {
    const { rows, columns } = insight.data;
    return (
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: T2,
        background: "rgba(27,40,64,0.04)",
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        padding: "6px 8px",
        lineHeight: 1.5,
      }}>
        <div style={{ color: T3, marginBottom: 2 }}>tabular</div>
        {rows.length} rows × {columns.length + 1} cols
      </div>
    );
  }

  if (insight.kind === "text" && insight.text) {
    const preview = insight.text.length > 110 ? insight.text.slice(0, 110).trimEnd() + "…" : insight.text;
    return (
      <div style={{
        fontSize: 11,
        color: T2,
        lineHeight: 1.45,
        background: "rgba(27,40,64,0.04)",
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        padding: "6px 8px",
      }}>{preview}</div>
    );
  }

  if (insight.kind === "sql" && insight.sql) {
    return (
      <pre style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: T2,
        background: "rgba(27,40,64,0.04)",
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        padding: "6px 8px",
        margin: 0,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        maxHeight: 64,
        overflow: "hidden",
      }}>{insight.sql}</pre>
    );
  }

  if (insight.kind === "code" && insight.code) {
    const head = insight.code.source.split("\n").slice(0, 3).join("\n");
    return (
      <pre style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: T2,
        background: "rgba(27,40,64,0.04)",
        border: `1px solid ${BORDER}`,
        borderRadius: 2,
        padding: "6px 8px",
        margin: 0,
        whiteSpace: "pre",
        overflow: "hidden",
        maxHeight: 60,
      }}>{head}{insight.code.source.split("\n").length > 3 ? "\n…" : ""}</pre>
    );
  }

  return null;
}
