"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChartRenderer } from "../ChartRenderer";
import { ChartTypeDropdown } from "../ui/ChartTypeDropdown";
import { useWorkspaceStore } from "@/lib/store";
import type { DataSet, Insight, ChartType } from "@/lib/types";
import { GOLD, BORDER, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

function DataSetExpandedView({ dataSet, insights }: {
  dataSet: DataSet;
  insights: Insight[];
}) {
  const setExpDataSet   = useWorkspaceStore(s => s.setExpandedDataSet);
  const setExpInsight   = useWorkspaceStore(s => s.setExpandedInsight);
  const updateChartType = useWorkspaceStore(s => s.updateDataSetChartType);

  const serial = String(dataSet.serial).padStart(2, "0");

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

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto thin-scroll">

        {/* Aggregate chart */}
        <div
          style={{
            padding: "20px 40px",
            background: SURFACE_RAISE,
            borderBottom: `1px solid ${BORDER}`,
            minHeight: 260,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span className="font-mono uppercase tracking-[0.1em] mb-3 block" style={{ fontSize: 10, color: T3 }}>
            Aggregate Chart
          </span>
          <div style={{ flex: 1, minHeight: 200, maxWidth: 780, width: "100%", margin: "0 auto" }}>
            <ChartRenderer
              rows={dataSet.rows}
              columns={dataSet.columns}
              chartType={dataSet.chartType}
              expanded
            />
          </div>
        </div>

        {/* Incoming insights */}
        <div style={{ padding: "20px 40px" }}>
          <span className="font-mono uppercase tracking-[0.1em] mb-4 block" style={{ fontSize: 10, color: T3 }}>
            Source Insights ({insights.length})
          </span>

          {insights.length === 0 ? (
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, color: T3,
              border: `1px dashed ${BORDER}`,
              borderRadius: 2,
              padding: "24px",
              textAlign: "center",
            }}>
              No insights wired to this data set yet.
              <br />Wire an Insight output to this card's input port on the canvas.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {insights.map(ins => {
                const insSerial = String(ins.serial).padStart(2, "0");
                const preview =
                  ins.kind === "data"  && ins.data  ? `${ins.data.rows.length} rows × ${ins.data.columns.length + 1} cols`
                  : ins.kind === "text" && ins.text  ? ins.text.slice(0, 80) + (ins.text.length > 80 ? "…" : "")
                  : ins.kind === "sql"  && ins.sql   ? ins.sql.slice(0, 80) + (ins.sql.length > 80 ? "…" : "")
                  : ins.kind === "code" && ins.code  ? `${ins.code.language} snippet`
                  : "—";

                return (
                  <button
                    key={ins.id}
                    onClick={() => { setExpDataSet(null); setExpInsight(ins.id); }}
                    className="w-full text-left border transition-colors duration-150"
                    style={{
                      padding: "12px 16px",
                      borderRadius: 0,
                      borderColor: BORDER,
                      background: SURFACE_RAISE,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = GOLD;
                      e.currentTarget.style.background  = SURFACE_MUTED;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = BORDER;
                      e.currentTarget.style.background  = SURFACE_RAISE;
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px]" style={{ color: T3 }}>{insSerial} /</span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8, letterSpacing: "0.1em",
                        color: T2, background: "rgba(27,40,64,0.06)",
                        border: `1px solid ${BORDER}`, padding: "1px 5px", borderRadius: 2,
                      }}>{ins.kind.toUpperCase()}</span>
                      <span className="text-[12px] font-medium" style={{ color: "#0A0A0A" }}>{ins.title}</span>
                    </div>
                    <div className="font-mono text-[10px] truncate" style={{ color: T3, paddingLeft: 48 }}>
                      {preview}
                    </div>
                    <div className="flex items-center gap-1 mt-2" style={{ paddingLeft: 48 }}>
                      <span className="font-mono text-[9.5px]" style={{ color: T3 }}>Conf {ins.confPct}%</span>
                      <span className="font-mono text-[9.5px] ml-auto" style={{ color: GOLD }}>Open →</span>
                    </div>
                  </button>
                );
              })}
            </div>
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
