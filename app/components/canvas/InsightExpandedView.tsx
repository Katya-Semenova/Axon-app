"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartRenderer } from "../ChartRenderer";
import { DataTable } from "../DataTable";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { useWorkspaceStore } from "@/lib/store";
import type { Insight, ChartType } from "@/lib/types";
import { GOLD, BORDER, T2, T3, SURFACE, SURFACE_RAISE } from "../ui/tokens";

const SPLITTER_H = 8;
const PCT_MIN    = 20;
const PCT_MAX    = 80;

function InsightExpandedView({ insight, insightsById }: {
  insight: Insight;
  insightsById: Record<string, Insight>;
}) {
  const updateRows      = useWorkspaceStore(s => s.updateInsightRows);
  const updateChartType = useWorkspaceStore(s => s.updateInsightChartType);
  const setExpanded     = useWorkspaceStore(s => s.setExpandedInsight);
  const undo            = useWorkspaceStore(s => s.undo);
  const redo            = useWorkspaceStore(s => s.redo);
  const canUndo         = useWorkspaceStore(s => s.canUndo());
  const canRedo         = useWorkspaceStore(s => s.canRedo());

  const [chartPct, setChartPct]       = useState(50);
  const [splitterHover, setSplitterHover] = useState(false);
  const bodyRef  = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const rafId    = useRef<number | undefined>(undefined);

  const serial  = String(insight.serial).padStart(2, "0");
  const hasData = insight.kind === "data" && !!insight.data;

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor     = "row-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      if (!dragging.current || !bodyRef.current) return;
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (!bodyRef.current) return;
        const { top, height } = bodyRef.current.getBoundingClientRect();
        const raw = ((ev.clientY - top) / height) * 100;
        setChartPct(Math.min(PCT_MAX, Math.max(PCT_MIN, raw)));
      });
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
      if (rafId.current !== undefined) {
        cancelAnimationFrame(rafId.current);
        rafId.current = undefined;
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
  }, []);

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
        className="flex items-center justify-between gap-3 border-b px-6 py-[13px] shrink-0 flex-wrap"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpanded(null)}
            className="flex items-center gap-[5px] font-mono text-[11.5px] shrink-0 transition-colors duration-200"
            style={{ color: T2 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0A0A0A")}
            onMouseLeave={e => (e.currentTarget.style.color = T2)}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back to Canvas
          </button>
          <span className="text-[11px] select-none" style={{ color: BORDER }}>|</span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
          <span className="text-[13.5px] font-medium truncate" style={{ color: "#0A0A0A" }}>{insight.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasData && (
            <ChartTypeDropdown
              value={insight.data!.chartType}
              onChange={(type: ChartType) => updateChartType(insight.id, type)}
            />
          )}
          <IconBtn onClick={undo} disabled={!canUndo} title="Undo">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
            </svg>
          </IconBtn>
          <IconBtn onClick={redo} disabled={!canRedo} title="Redo">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
            </svg>
          </IconBtn>
          {hasData && (
            <IconBtn onClick={() => setChartPct(50)} title="Reset layout (50/50)">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 5h10M2 9h10" />
              </svg>
            </IconBtn>
          )}
          <IconBtn onClick={() => setExpanded(null)} title="Collapse">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 1v3H1M7 10v-3h3M1 1l3 3M10 10l-3-3" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* Body */}
      {hasData ? (
        <div ref={bodyRef} className="flex flex-col flex-1 min-h-0">
          {/* Chart pane */}
          <div
            style={{
              flex: `0 0 ${chartPct}%`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: SURFACE_RAISE,
              padding: "12px 32px",
            }}
          >
            <div style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 820, margin: "0 auto" }}>
              <ChartRenderer
                rows={insight.data!.rows}
                columns={insight.data!.columns}
                chartType={insight.data!.chartType}
                expanded
              />
            </div>
          </div>

          {/* Draggable splitter */}
          <div
            onPointerDown={startDrag}
            onMouseEnter={() => setSplitterHover(true)}
            onMouseLeave={() => setSplitterHover(false)}
            style={{
              height: SPLITTER_H,
              flexShrink: 0,
              cursor: "row-resize",
              background: splitterHover ? "rgba(184,149,72,0.08)" : BORDER,
              borderTop:    `1px solid ${splitterHover ? "rgba(184,149,72,0.3)" : BORDER}`,
              borderBottom: `1px solid ${splitterHover ? "rgba(184,149,72,0.3)" : BORDER}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 150ms ease, border-color 150ms ease",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                background: splitterHover ? GOLD : T3,
                transition: "background 150ms ease",
              }}
            />
          </div>

          {/* Table pane */}
          <div className="flex flex-col min-h-0" style={{ flex: "1 1 0", background: SURFACE }}>
            <div className="px-6 pt-2 pb-2 shrink-0 border-b" style={{ borderColor: BORDER }}>
              <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: 10, color: T3 }}>
                Data — edit to correct aggregation errors
              </span>
            </div>
            <div className="flex-1 overflow-y-auto thin-scroll px-4 pb-3 pt-1">
              <DataTable
                columns={insight.data!.columns}
                rows={insight.data!.rows}
                onRowsChange={(rows) => updateRows(insight.id, rows)}
                insightsById={insightsById}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Non-data insight — text, sql, or code */
        <div className="flex-1 overflow-y-auto thin-scroll px-8 py-6">
          {insight.kind === "text" && (
            <p style={{ fontSize: 14, color: "#1B2840", lineHeight: 1.65, maxWidth: 720 }}>{insight.text}</p>
          )}
          {insight.kind === "sql" && (
            <pre style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, color: T2, lineHeight: 1.6,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{insight.sql}</pre>
          )}
          {insight.kind === "code" && insight.code && (
            <pre style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, color: T2, lineHeight: 1.6,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{insight.code.source}</pre>
          )}
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
