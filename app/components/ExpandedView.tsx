"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartRenderer } from "./ChartRenderer";
import { DataTable } from "./DataTable";
import { CHART_TYPES } from "@/lib/mockData";
import type { CardState, DataRow, ChartType } from "@/lib/mockData";

const ACCENT = "#3B4BDB";
const BORDER = "#E8E4DC";
const T2     = "#6B6B66";
const T3     = "#A8A8A2";
const BG     = "#FAFAF7";

const SPLITTER_H = 8;
const PCT_MIN    = 20;
const PCT_MAX    = 80;

interface ExpandedViewProps {
  card: CardState;
  onClose: () => void;
  onRowsChange: (rows: DataRow[]) => void;
  onChartTypeChange: (type: ChartType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ExpandedView({
  card, onClose, onRowsChange, onChartTypeChange, onUndo, onRedo, canUndo, canRedo,
}: ExpandedViewProps) {
  const [typeDropdown, setTypeDropdown] = useState(false);
  const [chartPct, setChartPct]         = useState(50);
  const [splitterHover, setSplitterHover] = useState(false);

  const bodyRef   = useRef<HTMLDivElement>(null);
  const dragging  = useRef(false);
  const rafId     = useRef<number | undefined>(undefined);

  const serial = String(card.serial).padStart(2, "0");

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor    = "row-resize";
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
      document.body.style.cursor    = "";
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
      className="flex-1 min-h-0 flex flex-col"
      style={{ background: BG }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between gap-3 border-b px-6 py-[13px] shrink-0 flex-wrap"
        style={{ borderColor: BORDER, background: "#fff" }}
      >
        {/* Left: back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-[5px] font-mono text-[11.5px] shrink-0 transition-colors duration-200"
            style={{ color: T2 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#0A0A0A")}
            onMouseLeave={e => (e.currentTarget.style.color = T2)}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back to Grid
          </button>
          <span className="text-[11px] select-none" style={{ color: BORDER }}>|</span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
          <span className="text-[13.5px] font-medium truncate" style={{ color: "#0A0A0A" }}>{card.headline}</span>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chart type picker */}
          <div className="relative">
            {typeDropdown && (
              <div className="fixed inset-0 z-[1]" onClick={() => setTypeDropdown(false)} />
            )}
            <button
              onClick={() => setTypeDropdown(!typeDropdown)}
              className="relative z-[2] flex items-center gap-1.5 rounded-lg border px-3 py-[5px] transition-colors duration-200"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T2, borderColor: BORDER, background: BG }}
            >
              {card.chartType}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1.5 3l2.5 2.5L6.5 3" />
              </svg>
            </button>
            <AnimatePresence>
              {typeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 z-[3] rounded-xl border py-1 bg-white"
                  style={{ borderColor: BORDER, minWidth: 152 }}
                >
                  {CHART_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => { onChartTypeChange(type); setTypeDropdown(false); }}
                      className="w-full text-left px-3 py-[7px] transition-colors duration-200"
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11.5,
                        color: type === card.chartType ? "#0A0A0A" : T2,
                        fontWeight: type === card.chartType ? 500 : 400,
                        background: "transparent",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = BG)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
            </svg>
          </IconBtn>
          <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
            </svg>
          </IconBtn>

          {/* Reset layout — resets chart/table split to 50/50 */}
          <IconBtn onClick={() => setChartPct(50)} title="Reset layout (50/50)">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 5h10M2 9h10" />
            </svg>
          </IconBtn>

          {/* Collapse icon — inward arrows */}
          <IconBtn onClick={onClose} title="Collapse to grid">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 1v3H1M7 10v-3h3M1 1l3 3M10 10l-3-3" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Body: chart + splitter + table ── */}
      <div ref={bodyRef} className="flex flex-col flex-1 min-h-0">

        {/* Chart pane — flex column so SVG height="100%" resolves */}
        <div
          style={{
            flex: `0 0 ${chartPct}%`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: BG,
            padding: "12px 32px",
          }}
        >
          <div style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 820, margin: "0 auto" }}>
            <ChartRenderer
              rows={card.rows}
              columns={card.columns}
              chartType={card.chartType}
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
            background: splitterHover ? "rgba(59,75,219,0.08)" : BORDER,
            borderTop:    `1px solid ${splitterHover ? "rgba(59,75,219,0.3)" : BORDER}`,
            borderBottom: `1px solid ${splitterHover ? "rgba(59,75,219,0.3)" : BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 150ms ease, border-color 150ms ease",
            userSelect: "none",
          }}
        >
          {/* Grip pill */}
          <div
            style={{
              width: 32,
              height: 3,
              borderRadius: 2,
              background: splitterHover ? ACCENT : T3,
              transition: "background 150ms ease",
            }}
          />
        </div>

        {/* Table pane */}
        <div className="flex flex-col min-h-0" style={{ flex: "1 1 0", background: "#fff" }}>
          <div className="px-6 pt-2 pb-2 shrink-0 border-b" style={{ borderColor: BORDER }}>
            <span
              className="font-mono uppercase tracking-[0.1em]"
              style={{ fontSize: 10, color: T3 }}
            >
              Data — edit to correct aggregation errors
            </span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scroll px-4 pb-3 pt-1">
            <DataTable
              columns={card.columns}
              rows={card.rows}
              onRowsChange={onRowsChange}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  children, onClick, disabled, title,
}: {
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
      className="flex items-center justify-center rounded-lg border transition-all duration-200"
      style={{ width: 30, height: 30, color: "#6B6B66", borderColor: BORDER, opacity: disabled ? 0.3 : 1, background: "transparent" }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.borderColor = ACCENT;
          e.currentTarget.style.color = ACCENT;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = BORDER;
        e.currentTarget.style.color = "#6B6B66";
      }}
    >
      {children}
    </button>
  );
}
