"use client";

import { ChartRenderer } from "../ChartRenderer";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import type { DataSet, ChartType } from "@/lib/types";
import { useTranslations } from "next-intl";
import { GOLD, NAVY, BORDER, T2, T3, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

const mono  = "'JetBrains Mono', monospace";
const serif = "'Instrument Serif', Georgia, serif";

export interface DataSetCardProps {
  dataSet: DataSet;
  isDraggingNode?: boolean;
  isConnecting: boolean;
  onExpand: () => void;
  onChartTypeChange: (type: ChartType) => void;
  onInputPortUp: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  /** First-sentence snippets from connected kind="text" insights, canvas-only. */
  textAnnotations?: string[];
}

/* ── DataSetCard ────────────────────────────────────────────────────────
   Two visual states:
   · EMPTY  (rows.length === 0): dashed outline, "connect an insight" hint.
   · FORMED (rows.length  >  0): renders chart + row count + expand button. */
export function DataSetCard({
  dataSet, isDraggingNode, isConnecting,
  onExpand, onChartTypeChange, onInputPortUp, onDelete,
  textAnnotations,
}: DataSetCardProps) {
  const hasRows    = dataSet.rows.length > 0;
  const hasText    = (textAnnotations?.length ?? 0) > 0;
  const isTextOnly = !hasRows && hasText;
  const isEmpty    = !hasRows && !hasText;
  const padded     = String(dataSet.serial).padStart(2, "0");
  const t          = useTranslations("Canvas");

  return (
    <div
      className="group relative rounded-none transition-colors duration-200"
      data-is-card=""
      style={{
        padding: "12px 14px 0 14px",
        background: SURFACE_RAISE,
        cursor: isDraggingNode ? "grabbing" : "default",
        opacity: isDraggingNode ? 0.45 : 1,
        transition: "opacity 150ms ease",
        border: isEmpty
          ? `1.5px dashed ${BORDER}`
          : `1px solid ${BORDER}`,
      }}
    >
      {/* Left input port */}
      <div
        data-port="input"
        title={t("dataset.inputPort")}
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
          title={t("dataset.remove")}
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
          }}>{t("dataset.badge")}</span>
        </div>
        {hasRows && (
          <ChartTypeDropdown value={dataSet.chartType} onChange={onChartTypeChange} />
        )}
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 500, color: "#1B2840", lineHeight: 1.35, marginBottom: 8 }}>
        {dataSet.title}
      </div>

      {/* Text-insight annotations — canvas-only, between title and chart */}
      {hasRows && hasText && (
        <div style={{
          borderLeft: `2px solid ${GOLD}`,
          paddingLeft: 8,
          marginBottom: 10,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          {(textAnnotations ?? []).map((text, i) => {
            const firstSentence = text.split(/\.\s+/)[0] ?? text;
            const snippet = firstSentence.length > 120
              ? firstSentence.slice(0, 120) + "…"
              : firstSentence;
            return (
              <p key={i} style={{
                fontFamily: serif,
                fontSize: 10,
                fontStyle: "italic",
                color: T2,
                lineHeight: 1.45,
                margin: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}>{snippet}</p>
            );
          })}
        </div>
      )}

      {/* Body — empty placeholder / text-only quote / live chart */}
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
            {t("dataset.emptyHint1")}<br />{t("dataset.emptyHint2")}
          </span>
        </div>
      ) : isTextOnly ? (
        <div style={{
          borderLeft: `2px solid ${GOLD}`,
          padding: "8px 10px 8px 8px",
          marginBottom: 10,
          background: "rgba(184,149,72,0.04)",
        }}>
          <p style={{
            fontFamily: serif,
            fontSize: 10,
            fontStyle: "italic",
            color: T2,
            lineHeight: 1.5,
            margin: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
          }}>{textAnnotations?.[0] ?? ""}</p>
        </div>
      ) : (
        <div className="w-full mb-2">
          <ChartRenderer rows={dataSet.rows} columns={dataSet.columns} chartType={dataSet.chartType} />
        </div>
      )}

      {/* Footer row — rows count + expand */}
      {hasRows && (
        <div className="flex items-center justify-between" style={{ paddingBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>
            {t("dataset.rows", { count: dataSet.rows.length })}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            title={t("dataset.expand")}
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

      {/* Text-only footer */}
      {isTextOnly && (
        <div className="flex items-center justify-between" style={{ paddingBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>{t("dataset.quote")}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            title={t("dataset.expand")}
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
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>{t("dataset.noData")}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
            title={t("dataset.expand")}
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

    </div>
  );
}

