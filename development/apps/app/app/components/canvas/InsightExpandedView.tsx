"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DataTable } from "../DataTable";
import { useWorkspaceStore } from "@/lib/store";
import type { Insight } from "@/lib/types";
import { GOLD, BORDER, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED, NAVY } from "../ui/tokens";
import { BackButton } from "../ui/BackButton";
import { useTranslations } from "next-intl";

const mono = "'JetBrains Mono', monospace";

function InsightExpandedView({ insight, insightsById }: {
  insight: Insight;
  insightsById: Record<string, Insight>;
}) {
  const updateRows  = useWorkspaceStore(s => s.updateInsightRows);
  const setExpanded = useWorkspaceStore(s => s.setExpandedInsight);
  const undo        = useWorkspaceStore(s => s.undo);
  const redo        = useWorkspaceStore(s => s.redo);
  const canUndo     = useWorkspaceStore(s => s.canUndo());
  const canRedo     = useWorkspaceStore(s => s.canRedo());

  const serial  = String(insight.serial).padStart(2, "0");
  const hasData = insight.kind === "data" && !!insight.data;
  const t       = useTranslations("Drill");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: SURFACE_RAISE }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 border-b px-6 h-[64px] shrink-0 flex-wrap"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BackButton onClick={() => setExpanded(null)}>{t("backToCanvas")}</BackButton>
          <span className="text-[11px] select-none" style={{ color: BORDER }}>|</span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
          <span className="text-[13.5px] font-medium truncate" style={{ color: "#0A0A0A" }}>{insight.title}</span>
          {hasData && (
            <span
              className="font-mono text-[10px] shrink-0 px-2 py-[2px]"
              style={{ background: SURFACE_MUTED, border: `1px solid ${BORDER}`, color: T3 }}
            >
              {t("insight.headerCount", { rows: insight.data!.rows.length, cols: insight.data!.columns.length })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <IconBtn onClick={undo} disabled={!canUndo} title={t("undo")}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
            </svg>
          </IconBtn>
          <IconBtn onClick={redo} disabled={!canRedo} title={t("redo")}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
            </svg>
          </IconBtn>
          <IconBtn onClick={() => setExpanded(null)} title={t("collapse")}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 1v3H1M7 10v-3h3M1 1l3 3M10 10l-3-3" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Body */}
      {hasData ? (
        <div className="flex flex-col flex-1 min-h-0">

          {/* Source file strip */}
          <div
            className="flex items-center gap-3 shrink-0 px-6 py-[10px] border-b"
            style={{ borderColor: BORDER, background: SURFACE }}
          >
            {/* File icon */}
            <div style={{
              width: 32, height: 38, flexShrink: 0,
              border: `1px solid ${BORDER}`,
              background: SURFACE_RAISE,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "flex-end",
              position: "relative", borderRadius: 2,
              overflow: "hidden",
            }}>
              {/* Folded corner */}
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 9, height: 9,
                background: SURFACE_MUTED,
                borderLeft: `1px solid ${BORDER}`,
                borderBottom: `1px solid ${BORDER}`,
              }} />
              {/* CSV label */}
              <span style={{ fontFamily: mono, fontSize: 7, color: NAVY, letterSpacing: "0.04em", paddingBottom: 4, fontWeight: 600 }}>
                CSV
              </span>
            </div>

            <div className="flex flex-col gap-[2px] min-w-0">
              <span style={{ fontFamily: mono, fontSize: 11, color: "#1B2840", fontWeight: 500 }}>
                {insight.title.toLowerCase().replace(/\s+/g, "_")}.csv
              </span>
              <div className="flex items-center gap-3">
                <span style={{ fontFamily: mono, fontSize: 9.5, color: T3 }}>
                  {t("insight.fileRows", { rows: insight.data!.rows.length })}
                </span>
                <span style={{ color: BORDER, fontSize: 9 }}>·</span>
                <span style={{ fontFamily: mono, fontSize: 9.5, color: T3 }}>
                  {t("insight.fileColumns", { cols: insight.data!.columns.length + 1 })}
                </span>
                <span style={{ color: BORDER, fontSize: 9 }}>·</span>
                <span style={{ fontFamily: mono, fontSize: 9.5, color: T3 }}>
                  {t("insight.confidence", { pct: insight.confPct })}
                </span>
              </div>
            </div>

            <div className="flex-1" />

            {/* Column chips */}
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <span style={{ fontFamily: mono, fontSize: 8.5, color: T3, marginRight: 4 }}>{t("insight.colsLabel")}</span>
              {["label", ...insight.data!.columns].map(col => (
                <span
                  key={col}
                  style={{
                    fontFamily: mono, fontSize: 8.5, color: T2,
                    background: SURFACE_MUTED, border: `1px solid ${BORDER}`,
                    borderRadius: 2, padding: "1px 6px",
                  }}
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Raw data CSV preview header row */}
          <div
            className="flex items-center gap-0 shrink-0 border-b overflow-hidden"
            style={{ borderColor: BORDER, background: "#F0EDE4" }}
          >
            {/* Row # gutter */}
            <div style={{
              width: 36, flexShrink: 0,
              padding: "5px 0",
              borderRight: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: mono, fontSize: 9, color: T3 }}>#</span>
            </div>
            {["label", ...insight.data!.columns].map((col, ci) => (
              <div
                key={col}
                style={{
                  flex: 1, minWidth: 80,
                  padding: "5px 10px",
                  borderRight: ci < insight.data!.columns.length ? `1px solid ${BORDER}` : "none",
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 9, color: NAVY, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {col}
                </span>
              </div>
            ))}
          </div>

          {/* Editable data table */}
          <div className="flex-1 overflow-y-auto thin-scroll px-4 pb-4 pt-1" style={{ background: SURFACE_RAISE }}>
            <DataTable
              columns={insight.data!.columns}
              rows={insight.data!.rows}
              onRowsChange={(rows) => updateRows(insight.id, rows)}
              insightsById={insightsById}
            />
          </div>
        </div>
      ) : (
        /* Non-data insight — text, sql, or code */
        <div className="flex flex-col flex-1 min-h-0">
          {/* Source type badge */}
          <div
            className="flex items-center gap-3 shrink-0 px-6 py-[10px] border-b"
            style={{ borderColor: BORDER, background: SURFACE }}
          >
            <div style={{
              width: 32, height: 38, flexShrink: 0,
              border: `1px solid ${BORDER}`,
              background: SURFACE_RAISE,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "flex-end",
              position: "relative", borderRadius: 2, overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: 9, height: 9,
                background: SURFACE_MUTED,
                borderLeft: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
              }} />
              <span style={{ fontFamily: mono, fontSize: 6.5, color: NAVY, letterSpacing: "0.03em", paddingBottom: 4, fontWeight: 600 }}>
                {insight.kind.toUpperCase()}
              </span>
            </div>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: "#1B2840", fontWeight: 500 }}>
                {insight.title.toLowerCase().replace(/\s+/g, "_")}.{insight.kind === "sql" ? "sql" : insight.kind === "code" ? (insight.code?.language ?? "txt") : "md"}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto thin-scroll px-8 py-6">
            {insight.kind === "text" && (
              <p style={{ fontSize: 14, color: "#1B2840", lineHeight: 1.65, maxWidth: 720 }}>{insight.text}</p>
            )}
            {insight.kind === "sql" && (
              <pre style={{ fontFamily: mono, fontSize: 12, color: T2, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {insight.sql}
              </pre>
            )}
            {insight.kind === "code" && insight.code && (
              <pre style={{ fontFamily: mono, fontSize: 12, color: T2, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {insight.code.source}
              </pre>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function InsightExpandedViewOverlay() {
  const expandedId   = useWorkspaceStore(s => s.expandedInsightId);
  const insightsById = useWorkspaceStore(s => s.insightsById);
  const insight      = expandedId ? insightsById[expandedId] ?? null : null;

  return (
    <AnimatePresence>
      {insight && (
        <InsightExpandedView
          key={insight.id}
          insight={insight}
          insightsById={insightsById}
        />
      )}
    </AnimatePresence>
  );
}

function IconBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center rounded-sm border transition-all duration-200"
      style={{ width: 30, height: 30, color: T2, borderColor: BORDER, opacity: disabled ? 0.3 : 1, background: "transparent" }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = GOLD;
          e.currentTarget.style.color       = GOLD;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.color       = T2;
      }}
    >
      {children}
    </button>
  );
}
