"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartFill } from "../ChartFill";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { DataTable } from "../DataTable";
import { useWorkspaceStore } from "@/lib/store";
import type { DataSet, Insight, ChartType } from "@/lib/types";
import { BORDER, T3, SURFACE, SURFACE_RAISE, CANVAS_HEAT_VARS } from "../ui/tokens";
import { BackButton } from "../ui/BackButton";
import { useTranslations } from "next-intl";

function DataSetExpandedView({ dataSet, insights }: {
  dataSet: DataSet;
  insights: Insight[];
}) {
  const setExpDataSet   = useWorkspaceStore(s => s.setExpandedDataSet);
  const updateChartType = useWorkspaceStore(s => s.updateDataSetChartType);
  const updateRows      = useWorkspaceStore(s => s.updateDataSetRows);

  const insightsByIdMap = Object.fromEntries(insights.map(ins => [ins.id, ins]));

  const serial = String(dataSet.serial).padStart(2, "0");
  const t = useTranslations("Drill");

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
      style={{ background: SURFACE_RAISE, ...CANVAS_HEAT_VARS }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 border-b px-6 h-[64px] shrink-0 flex-wrap"
        style={{ borderColor: BORDER, background: SURFACE }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <BackButton onClick={() => setExpDataSet(null)}>{t("backToCanvas")}</BackButton>
          <span className="text-[11px] select-none" style={{ color: BORDER }}>|</span>
          <span className="font-mono text-[11px] shrink-0" style={{ color: T3 }}>{serial} /</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            letterSpacing: "0.1em", color: "#1B2840",
            background: "rgba(27,40,64,0.06)", border: `1px solid ${BORDER}`,
            padding: "1px 5px", borderRadius: 2,
          }}>{t("dataset.badge")}</span>
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
            {t("dataset.aggregateChart")}
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
          title={t("dataset.dragResize")}
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

        {/* ── Bottom row: DATA table (full width) — Chart Settings panel removed
            (не работала: см. бэклог). Сортировка/фильтр живут в DataTable. ── */}
        <div
          style={{
            flex: 1, minHeight: 120,
            overflowY: "auto",
            padding: "16px 40px 28px",
          }}
          className="thin-scroll"
        >
          <span className="font-mono uppercase tracking-[0.1em] mb-4 block" style={{ fontSize: 10, color: T3 }}>
            {t("dataset.dataCount", { count: dataSet.rows.length })}
          </span>

          {dataSet.rows.length === 0 ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: T3,
              border: `1px dashed ${BORDER}`,
              borderRadius: 2, padding: "24px", textAlign: "center",
            }}>
              {t("dataset.noData")}
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
      </div>
    </motion.div>
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
