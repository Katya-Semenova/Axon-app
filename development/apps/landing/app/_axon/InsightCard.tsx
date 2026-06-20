"use client";

import type { Insight } from "./types";
import { GOLD, NAVY, BORDER, T2, T3, INSIGHT_CARD_BG } from "./tokens";

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
  const mono = "'JetBrains Mono', monospace";

  /* Compact one-line preview — avoids tall border-boxes that push cards apart. */
  const previewText = (() => {
    if (insight.kind === "data" && insight.data)
      return `${insight.data.rows.length} rows × ${insight.data.columns.length + 1} cols`;
    if (insight.kind === "text" && insight.text)
      return insight.text.slice(0, 60) + (insight.text.length > 60 ? "…" : "");
    if (insight.kind === "sql" && insight.sql)
      return insight.sql.split("\n")[0].slice(0, 60);
    if (insight.kind === "code" && insight.code)
      return `${insight.code.language} · ${insight.code.source.split("\n").length} lines`;
    return "—";
  })();

  return (
    <div
      className="group relative rounded-none transition-colors duration-200"
      data-is-card=""
      style={{
        padding: "8px 10px",
        background: INSIGHT_CARD_BG,
        cursor: isDraggingNode ? "grabbing" : "grab",
        opacity: isDraggingNode ? 0.45 : 1,
        transition: "opacity 150ms ease",
        border: `1px solid ${BORDER}`,
      }}
    >
      {/* Right output port */}
      <div
        data-port="output"
        title="Drag to connect to a Data Set"
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
          e.currentTarget.style.transform = "translateY(-50%) scale(1.3)";
          e.currentTarget.style.background = NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-[5px]">
        <div className="flex items-center gap-[5px]">
          <span style={{ fontFamily: mono, fontSize: 10, color: T3, letterSpacing: "0.06em" }}>{padded} /</span>
          <span style={{
            fontFamily: mono, fontSize: 7.5, letterSpacing: "0.1em",
            color: T2, background: "rgba(27,40,64,0.06)",
            border: `1px solid ${BORDER}`, padding: "1px 4px", borderRadius: 2,
          }}>{insight.kind.toUpperCase()}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          title="Expand"
          style={{
            width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
            color: T3, border: `1px solid ${BORDER}`, borderRadius: 2, background: "transparent",
            cursor: "pointer", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="8" height="8" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
          </svg>
        </button>
      </div>

      {/* Title — single line, truncated */}
      <div style={{ fontSize: 11.5, fontWeight: 500, color: "#1B2840", lineHeight: 1.3, marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {insight.title}
      </div>

      {/* Preview — text insight gets a styled annotation block; others get compact mono */}
      {insight.kind === "text" && insight.text ? (
        <div style={{
          fontSize: 10.5, lineHeight: 1.5, color: T2, fontStyle: "italic",
          fontFamily: "Inter, sans-serif", marginBottom: 6,
          padding: "4px 6px", background: "rgba(27,40,64,0.035)",
          borderLeft: `2px solid ${GOLD}`,
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {insight.text}
        </div>
      ) : (
        <div style={{ fontFamily: mono, fontSize: 9.5, color: T3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }}>
          {previewText}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t" style={{ borderColor: BORDER, paddingTop: 4 }}>
        <span style={{ fontFamily: mono, fontSize: 9, color: T3 }}>Conf {insight.confPct}%</span>
        {isConnecting && (
          <span style={{ fontFamily: mono, fontSize: 9, color: GOLD }}>connecting…</span>
        )}
      </div>
    </div>
  );
}
