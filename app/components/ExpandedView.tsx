"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartRenderer } from "./ChartRenderer";
import { DataTable } from "./DataTable";
import { CHART_TYPES } from "@/lib/mockData";
import type { CardState, DataRow, ChartType } from "@/lib/mockData";

const NAVY  = "#1F2A44";
const BORDER = "#E8E4DC";
const T2    = "#6B6B66";
const T3    = "#A8A8A2";
const BG    = "#F5F2EC";

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
  card,
  onClose,
  onRowsChange,
  onChartTypeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ExpandedViewProps) {
  const [showData, setShowData]       = useState(true);
  const [typeDropdown, setTypeDropdown] = useState(false);

  const serial = String(card.serial).padStart(2, "0");

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.32)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ type: "spring", damping: 28, stiffness: 340, mass: 0.75 }}
        className="fixed z-50 flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ inset: "20px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header bar ── */}
        <div
          className="flex items-center justify-between gap-3 border-b px-6 py-[14px] shrink-0 flex-wrap"
          style={{ borderColor: BORDER }}
        >
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
            <span className="text-[13.5px] font-medium truncate" style={{ color: "#0A0A0A" }}>
              {card.headline}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Chart type picker */}
            <div className="relative">
              {typeDropdown && (
                <div className="fixed inset-0 z-[1]" onClick={() => setTypeDropdown(false)} />
              )}
              <button
                onClick={() => setTypeDropdown(!typeDropdown)}
                className="relative z-[2] flex items-center gap-1.5 rounded-lg border px-3 py-[5px] transition-colors"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  color: T2,
                  borderColor: BORDER,
                  background: BG,
                }}
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
                    className="absolute right-0 top-full mt-1 z-[3] rounded-xl border py-1 shadow-lg bg-white"
                    style={{ borderColor: BORDER, minWidth: 152 }}
                  >
                    {CHART_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => { onChartTypeChange(type); setTypeDropdown(false); }}
                        className="w-full text-left px-3 py-[7px] transition-colors"
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11.5,
                          color: type === card.chartType ? "#0A0A0A" : T2,
                          fontWeight: type === card.chartType ? 500 : 400,
                          background: "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = BG)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Show / Hide Data */}
            <button
              onClick={() => setShowData(!showData)}
              className="rounded-lg border px-3 py-[5px] transition-colors"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: showData ? "#0A0A0A" : T2,
                borderColor: showData ? "rgba(31,42,68,0.3)" : BORDER,
                background: showData ? "rgba(31,42,68,0.06)" : BG,
              }}
            >
              {showData ? "Hide Data" : "Show Data"}
            </button>

            {/* Undo */}
            <IconBtn onClick={onUndo} disabled={!canUndo} title="Undo">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
              </svg>
            </IconBtn>

            {/* Redo */}
            <IconBtn onClick={onRedo} disabled={!canRedo} title="Redo">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
              </svg>
            </IconBtn>

            {/* Collapse */}
            <IconBtn onClick={onClose} title="Collapse">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 7H4V10M10 4H7V1M4 7L1 10M7 4L10 1" />
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="shrink-0 border-b px-8 py-6" style={{ borderColor: BORDER }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <ChartRenderer
              rows={card.rows}
              columns={card.columns}
              chartType={card.chartType}
              expanded
            />
          </div>
        </div>

        {/* ── Data Source Verification ── */}
        <AnimatePresence initial={false}>
          {showData && (
            <motion.div
              key="data-section"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col min-h-0 overflow-hidden flex-1"
            >
              <div className="px-6 pt-4 pb-2 shrink-0">
                <span
                  className="font-mono uppercase tracking-[0.1em]"
                  style={{ fontSize: 10, color: T3 }}
                >
                  Data Source Verification
                </span>
              </div>
              <div className="flex-1 overflow-y-auto thin-scroll px-6 pb-5">
                <DataTable
                  columns={card.columns}
                  rows={card.rows}
                  onRowsChange={onRowsChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
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
      className="flex items-center justify-center rounded-lg border transition-all"
      style={{
        width: 30,
        height: 30,
        color: "#6B6B66",
        borderColor: "#E8E4DC",
        opacity: disabled ? 0.3 : 1,
        background: "transparent",
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.borderColor = "rgba(31,42,68,0.2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8E4DC")}
    >
      {children}
    </button>
  );
}
