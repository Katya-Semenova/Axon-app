"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartFill } from "../ChartFill";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { DataTable } from "../DataTable";
import { useWorkspaceStore } from "@/lib/store";
import type { DataSet, Insight, ChartType, ColorAccent, DataSetSettings } from "@/lib/types";
import { DEFAULT_DATASET_SETTINGS } from "@/lib/types";
import { BORDER, NAVY, T2, T3, SURFACE, SURFACE_RAISE } from "../ui/tokens";

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
        className="flex items-center justify-between gap-3 border-b px-6 py-[13px] shrink-0 flex-wrap"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setExpDataSet(null)}
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
              rows={dataSet.rows}
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
                <PanelSelect<string>
                  value={settings.status}
                  options={["All", "Paid", "Pending", "Failed"]}
                  onChange={v => updateSettings(dataSet.id, { status: v })}
                />
              </SettingField>
              <SettingField label="Aggregation">
                <PanelSelect<DataSetSettings["aggregation"]>
                  value={settings.aggregation}
                  options={["Daily", "Weekly", "Monthly", "Quarterly"]}
                  onChange={v => updateSettings(dataSet.id, { aggregation: v })}
                />
              </SettingField>
              <SettingField label="Color by">
                <PanelSelect<string>
                  value={settings.colorBy}
                  options={["Segment", "Status", "Channel", "Region", "None"]}
                  onChange={v => updateSettings(dataSet.id, { colorBy: v })}
                />
              </SettingField>
              <SettingField label="Filter">
                <PanelSelect<string>
                  value={settings.filter}
                  options={["All data", "Top 10", "Bottom 10", "Outliers"]}
                  onChange={v => updateSettings(dataSet.id, { filter: v })}
                />
              </SettingField>
            </div>

            {/* Accent — full-width row with colour swatch */}
            <SettingField label="Accent">
              <AccentSelect
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

function PanelSelect<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{
          width: "100%",
          appearance: "none", WebkitAppearance: "none",
          background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, color: NAVY,
          padding: "6px 22px 6px 9px",
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M1 2.5l3 3 3-3" />
      </svg>
    </div>
  );
}

const ACCENT_SWATCH: Record<ColorAccent, string> = {
  Navy:     "#1B2840",
  Gold:     "#B89548",
  Slate:    "#4A5878",
  Graphite: "#2A3654",
};

function AccentSelect({ value, onChange }: { value: ColorAccent; onChange: (v: ColorAccent) => void }) {
  const options: ColorAccent[] = ["Navy", "Gold", "Slate", "Graphite"];
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
        width: 10, height: 10, background: ACCENT_SWATCH[value],
        pointerEvents: "none",
      }} />
      <select
        value={value}
        onChange={e => onChange(e.target.value as ColorAccent)}
        style={{
          width: "100%",
          appearance: "none", WebkitAppearance: "none",
          background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, color: NAVY,
          padding: "7px 22px 7px 26px",
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M1 2.5l3 3 3-3" />
      </svg>
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
