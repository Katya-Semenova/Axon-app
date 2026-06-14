"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChartFill } from "../ChartFill";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { DataTable } from "../DataTable";
import { useWorkspaceStore } from "@/lib/store";
import type { DataSet, Insight, ChartType, ColorAccent, DataSetSettings } from "@/lib/types";
import { DEFAULT_DATASET_SETTINGS } from "@/lib/types";
import { BORDER, NAVY, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";
import { BackButton } from "../ui/BackButton";

function DataSetExpandedView({ dataSet, insights }: {
  dataSet: DataSet;
  insights: Insight[];
}) {
  const setExpDataSet   = useWorkspaceStore(s => s.setExpandedDataSet);
  const updateChartType = useWorkspaceStore(s => s.updateDataSetChartType);
  const updateRows      = useWorkspaceStore(s => s.updateDataSetRows);
  const updateSettings  = useWorkspaceStore(s => s.updateDataSetSettings);

  /* Settings carried on the dataset; defaults apply when not yet set. */
  const settings: DataSetSettings = dataSet.settings ?? DEFAULT_DATASET_SETTINGS;

  const insightsByIdMap = Object.fromEntries(insights.map(ins => [ins.id, ins]));

  const serial = String(dataSet.serial).padStart(2, "0");

  /* 10b: apply filter setting to rows before rendering the chart */
  const displayRows = (() => {
    const rows = dataSet.rows;
    const f = settings.filter;
    if (f === "All data" || rows.length === 0) return rows;
    const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
    if (f === "Top 10") return sorted.slice(0, 10);
    if (f === "Bottom 10") return sorted.slice(-10).reverse();
    if (f === "Outliers") {
      const vals = rows.map(r => r.values[0] ?? 0);
      const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
      const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
      const out  = rows.filter(r => Math.abs((r.values[0] ?? 0) - mean) > 1.5 * std);
      return out.length > 0 ? out : rows;
    }
    return rows;
  })();

  /* ── Resizable split ── */
  const [chartH, setChartH] = useState(260);
  const dragState = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const delta = e.clientY - dragState.current.startY;
      setChartH(Math.max(140, Math.min(560, dragState.current.startH + delta)));
    };
    const onMouseUp = () => { dragState.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

  function handleSplitterDown(e: React.MouseEvent) {
    e.preventDefault();
    dragState.current = { startY: e.clientY, startH: chartH };
  }

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
          <BackButton onClick={() => setExpDataSet(null)}>Back to Canvas</BackButton>
          <span className="text-[11px] select-none" style={{ color: BORDER }}>|</span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            letterSpacing: "0.1em", color: "#1B2840",
            background: "rgba(27,40,64,0.06)", border: `1px solid ${BORDER}`,
            padding: "1px 5px", borderRadius: 2,
          }}>DATA SET</span>
          <span className="text-[13.5px] font-medium truncate" style={{ color: "#0A0A0A" }}>{dataSet.title}</span>
        </div>

        <ChartTypeDropdown
          value={dataSet.chartType}
          onChange={(type: ChartType) => updateChartType(dataSet.id, type)}
        />
      </div>

      {/* Body — resizable split */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* ── Chart panel (resizable) ── */}
        <div style={{
          height: chartH, flexShrink: 0, overflow: "hidden",
          padding: "16px 40px 12px",
          background: SURFACE_RAISE,
          display: "flex", flexDirection: "column",
        }}>
          <span className="font-mono uppercase tracking-[0.1em] mb-2 block" style={{ fontSize: 10, color: T3 }}>
            Aggregate Chart
          </span>
          <div style={{ flex: 1, minHeight: 0, maxWidth: 780, width: "100%", margin: "0 auto" }}>
            <ChartFill
              rows={displayRows}
              columns={dataSet.columns}
              chartType={dataSet.chartType}
              expanded
            />
          </div>
        </div>

        {/* ── Splitter handle ── */}
        <div
          onMouseDown={handleSplitterDown}
          title="Drag to resize"
          style={{
            height: 10, flexShrink: 0,
            cursor: "row-resize",
            background: SURFACE_RAISE,
            borderTop:    `1px solid ${BORDER}`,
            borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            userSelect: "none",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(184,149,72,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = SURFACE_RAISE; }}
        >
          <svg width="24" height="6" viewBox="0 0 24 6" fill="none">
            {[0, 8, 16].map(x => (
              <circle key={x} cx={x + 4} cy="3" r="1.5" fill={T3} fillOpacity="0.5" />
            ))}
          </svg>
        </div>

        {/* ── Bottom row: DATA table (left, ~75%) + CHART SETTINGS (right, ~25%) ── */}
        <div style={{ flex: 1, minHeight: 120, display: "flex", overflow: "hidden" }}>

          {/* Left: DATA — editable table with drag handles */}
          <div
            style={{
              flex: 3, minWidth: 0,
              borderRight: `1px solid ${BORDER}`,
              overflowY: "auto",
              padding: "16px 32px 28px",
            }}
            className="thin-scroll"
          >
            <span className="font-mono uppercase tracking-[0.1em] mb-4 block" style={{ fontSize: 10, color: T3 }}>
              Data ({dataSet.rows.length} rows)
            </span>

            {dataSet.rows.length === 0 ? (
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, color: T3,
                border: `1px dashed ${BORDER}`,
                borderRadius: 2, padding: "24px", textAlign: "center",
              }}>
                No data yet — wire an Insight to this card's input port on the canvas.
              </div>
            ) : (
              <DataTable
                columns={dataSet.columns}
                rows={dataSet.rows}
                onRowsChange={(rows) => updateRows(dataSet.id, rows)}
                insightsById={insights.length > 0 ? insightsByIdMap : undefined}
              />
            )}
          </div>

          {/* Right: CHART SETTINGS — 5 controls bound to THIS data set */}
          <div
            style={{
              flex: 1, minWidth: 240, maxWidth: 320,
              padding: "16px 20px 28px",
              overflowY: "auto",
              background: SURFACE,
              display: "flex", flexDirection: "column", gap: 14,
            }}
            className="thin-scroll"
          >
            <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: 10, color: T3 }}>
              Chart Settings
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SettingField label="Status">
                <PanelDropdown<string>
                  value={settings.status}
                  options={["All", "Paid", "Pending", "Failed"]}
                  onChange={v => updateSettings(dataSet.id, { status: v })}
                />
              </SettingField>
              <SettingField label="Aggregation">
                <PanelDropdown<DataSetSettings["aggregation"]>
                  value={settings.aggregation}
                  options={["Daily", "Weekly", "Monthly", "Quarterly"]}
                  onChange={v => updateSettings(dataSet.id, { aggregation: v })}
                />
              </SettingField>
              <SettingField label="Color by">
                <PanelDropdown<string>
                  value={settings.colorBy}
                  options={["Segment", "Status", "Channel", "Region", "None"]}
                  onChange={v => updateSettings(dataSet.id, { colorBy: v })}
                />
              </SettingField>
              <SettingField label="Filter">
                <PanelDropdown<string>
                  value={settings.filter}
                  options={["All data", "Top 10", "Bottom 10", "Outliers"]}
                  onChange={v => updateSettings(dataSet.id, { filter: v })}
                />
              </SettingField>
            </div>

            {/* Accent — full-width row with colour swatch */}
            <SettingField label="Accent">
              <AccentDropdown
                value={settings.accent}
                onChange={v => updateSettings(dataSet.id, { accent: v })}
              />
            </SettingField>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Settings primitives ─────────────────────────────────────────────────── */

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase",
        color: T3, marginBottom: 5,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/* 10a: custom portal dropdown matching ChartTypeDropdown design system */
function PanelDropdown<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect]  = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: NAVY,
          padding: "6px 8px", background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`, borderRadius: 2, cursor: "pointer", gap: 6,
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <path d="M1 2.5l3 3 3-3" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          {rect && (
            <div style={{
              position: "fixed", top: rect.bottom + 4, left: rect.left,
              zIndex: 9999, minWidth: rect.width,
              border: `1px solid ${BORDER}`, borderRadius: 2, padding: "4px 0",
              maxHeight: 240, overflowY: "auto",
              background: SURFACE_RAISE, boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
            }} className="thin-scroll">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
                  style={{
                    width: "100%", display: "block", textAlign: "left",
                    padding: "6px 12px",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    color: opt === value ? NAVY : T2,
                    fontWeight: opt === value ? 500 : 400,
                    background: opt === value ? SURFACE_MUTED : "transparent",
                    border: "none", cursor: "pointer",
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = SURFACE_MUTED; }}
                  onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = "transparent"; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}

const ACCENT_SWATCH: Record<ColorAccent, string> = {
  Navy:     "#1B2840",
  Gold:     "#B89548",
  Slate:    "#4A5878",
  Graphite: "#2A3654",
};

function AccentDropdown({ value, onChange }: { value: ColorAccent; onChange: (v: ColorAccent) => void }) {
  const options: ColorAccent[] = ["Navy", "Gold", "Slate", "Graphite"];
  const [open, setOpen] = useState(false);
  const [rect, setRect]  = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: NAVY,
          padding: "6px 8px", background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`, borderRadius: 2, cursor: "pointer",
        }}
      >
        <span style={{ width: 10, height: 10, flexShrink: 0, background: ACCENT_SWATCH[value] }} />
        <span style={{ flex: 1, textAlign: "left" }}>{value}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <path d="M1 2.5l3 3 3-3" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          {rect && (
            <div style={{
              position: "fixed", top: rect.bottom + 4, left: rect.left,
              zIndex: 9999, minWidth: rect.width,
              border: `1px solid ${BORDER}`, borderRadius: 2, padding: "4px 0",
              background: SURFACE_RAISE, boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
            }}>
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={(e) => { e.stopPropagation(); onChange(opt); setOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 12px",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                    color: opt === value ? NAVY : T2,
                    fontWeight: opt === value ? 500 : 400,
                    background: opt === value ? SURFACE_MUTED : "transparent",
                    border: "none", cursor: "pointer",
                  }}
                  onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = SURFACE_MUTED; }}
                  onMouseLeave={e => { if (opt !== value) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ width: 10, height: 10, flexShrink: 0, background: ACCENT_SWATCH[opt] }} />
                  {opt}
                </button>
              ))}
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}

export function DataSetExpandedViewOverlay() {
  const expandedId   = useWorkspaceStore(s => s.expandedDataSetId);
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const connections  = useWorkspaceStore(s => s.connections);
  const insightsById = useWorkspaceStore(s => s.insightsById);

  const dataSet = expandedId ? dataSetsById[expandedId] ?? null : null;
  const insights: Insight[] = expandedId
    ? connections
        .filter(c => c.toDataSetId === expandedId)
        .map(c => insightsById[c.fromInsightId])
        .filter((ins): ins is Insight => ins != null)
    : [];

  return (
    <AnimatePresence>
      {dataSet && (
        <DataSetExpandedView
          key={dataSet.id}
          dataSet={dataSet}
          insights={insights}
        />
      )}
    </AnimatePresence>
  );
}
