"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reorder, useDragControls } from "framer-motion";
import type { DataRow, Insight } from "@/lib/types";

const BORDER  = "#E8E4DC";
const T3      = "#A8A8A2";
const T2      = "#5C6478";
const NAVY    = "#1B2840";
const GOLD    = "#B89548";

/* ── column geometry ─────────────────────────────────────────────────────── */
const COL_GRIP    = 22;  /* px, fixed */
const COL_VALUE   = 88;  /* px, fixed, right-aligned */
const COL_ACTIONS = 28;  /* px, fixed */
/* LABEL and SOURCE use flex:1 — see row layout below */

interface DataTableProps {
  columns: string[];
  rows: DataRow[];
  onRowsChange: (rows: DataRow[]) => void;
  /** When provided, render a final "DATA SET" column showing `INSIGHT N`. */
  insightsById?: Record<string, Insight>;
}

function GripIcon() {
  return (
    <svg width="9" height="12" viewBox="0 0 10 14" fill="currentColor">
      <circle cx="3" cy="3"  r="1.5" />
      <circle cx="7" cy="3"  r="1.5" />
      <circle cx="3" cy="7"  r="1.5" />
      <circle cx="7" cy="7"  r="1.5" />
      <circle cx="3" cy="11" r="1.5" />
      <circle cx="7" cy="11" r="1.5" />
    </svg>
  );
}

/* Three-dot icon */
function DotsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <circle cx="6.5" cy="2.5" r="1.3" />
      <circle cx="6.5" cy="6.5" r="1.3" />
      <circle cx="6.5" cy="10.5" r="1.3" />
    </svg>
  );
}

function DraggableRow({
  row, columns, onChange, onDuplicate, onDelete, insightsById,
}: {
  row: DataRow;
  columns: string[];
  onChange: (updated: DataRow) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  insightsById?: Record<string, Insight>;
}) {
  const controls   = useDragControls();
  const [hovered, setHovered]   = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("Table");

  function updateLabel(label: string) { onChange({ ...row, label }); }
  function updateValue(i: number, raw: string) {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return;
    const values = [...row.values];
    values[i] = parsed;
    onChange({ ...row, values });
  }

  const sourceInsight = row.sourceInsightId && insightsById
    ? insightsById[row.sourceInsightId] ?? null
    : null;

  const inputCls =
    "text-[12px] font-mono text-[#1B2840] bg-transparent outline-none " +
    "border border-transparent focus:border-[rgba(184,149,72,0.5)] " +
    "rounded-sm px-[6px] py-[2px] transition-colors duration-200 w-full";

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: "none", position: "relative" }}
      whileDrag={{ scale: 1.01, zIndex: 10, position: "relative" }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => { setHovered(false); setMenuOpen(false); }}
    >
      <div
        className="flex items-center border-b border-[#E8E4DC]"
        style={{
          background: hovered ? "rgba(27,40,64,0.025)" : "#fff",
          transition: "background 120ms ease",
          paddingTop: 2, paddingBottom: 2,
          gap: 0,
        }}
      >
        {/* Drag grip */}
        <div
          onPointerDown={e => controls.start(e)}
          className="cursor-grab active:cursor-grabbing shrink-0 flex items-center justify-center select-none transition-colors"
          style={{
            width: COL_GRIP, color: hovered ? T2 : T3,
            flexShrink: 0, alignSelf: "stretch", display: "flex",
          }}
          title={t("dragReorder")}
        >
          <GripIcon />
        </div>

        {/* Label — flex:1 */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
          <input
            type="text"
            value={row.label}
            onChange={e => updateLabel(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Value columns — fixed width, right-aligned */}
        {row.values.map((v, i) => (
          <div key={i} style={{ width: COL_VALUE, flexShrink: 0 }}>
            <input
              type="number"
              value={v}
              onChange={e => updateValue(i, e.target.value)}
              className={`${inputCls} text-right`}
            />
          </div>
        ))}

        {/* Source insight — flex:1 */}
        {insightsById && (
          <div
            className="text-[11px] font-mono truncate"
            style={{ flex: 1, minWidth: 60, color: sourceInsight ? NAVY : T3, paddingLeft: 8 }}
            title={sourceInsight?.title ?? t("noSourceInsight")}
          >
            {sourceInsight ? t("insightN", { n: sourceInsight.serial }) : "—"}
          </div>
        )}

        {/* Row actions — 3-dot menu */}
        <div
          style={{
            width: COL_ACTIONS, flexShrink: 0, position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
              background: menuOpen ? "rgba(27,40,64,0.08)" : "transparent",
              border: "none", borderRadius: 3, cursor: "pointer",
              color: hovered || menuOpen ? T2 : "transparent",
              transition: "color 120ms, background 120ms",
            }}
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <>
              <div
                aria-hidden
                style={{ position: "fixed", inset: 0, zIndex: 199 }}
                onClick={() => setMenuOpen(false)}
              />
              <ul style={{
                position: "absolute", right: 0, top: "100%", zIndex: 200,
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: 4, boxShadow: "0 2px 8px rgba(27,40,64,0.08)",
                padding: "4px 0", margin: 0, listStyle: "none", minWidth: 132,
              }}>
                {[
                  { label: t("duplicateRow"), action: () => { onDuplicate(); setMenuOpen(false); } },
                  { label: t("deleteRow"),    action: () => { onDelete();    setMenuOpen(false); }, danger: true },
                ].map(item => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={item.action}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "5px 12px",
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, lineHeight: 1.5,
                        color: item.danger ? "#C0392B" : T2,
                        background: "transparent", border: "none", cursor: "pointer",
                        outline: "none", userSelect: "none",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "rgba(192,57,43,0.06)" : "rgba(27,40,64,0.05)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Reorder.Item>
  );
}

export function DataTable({ columns, rows, onRowsChange, insightsById }: DataTableProps) {
  const t = useTranslations("Table");
  function updateRow(id: string, updated: DataRow) {
    onRowsChange(rows.map(r => (r.id === id ? updated : r)));
  }

  function duplicateRow(id: string) {
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return;
    const clone = { ...rows[idx], id: `row-${Date.now().toString(36)}` };
    const next = [...rows.slice(0, idx + 1), clone, ...rows.slice(idx + 1)];
    onRowsChange(next);
  }

  function deleteRow(id: string) {
    onRowsChange(rows.filter(r => r.id !== id));
  }

  const headerCell = "text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2]";

  return (
    /* Use 100% width, no horizontal scroll — columns distribute via flex */
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        className="flex items-center border-b border-[#E8E4DC] sticky top-0 z-10"
        style={{ background: "#faf9f5", paddingTop: 4, paddingBottom: 6, gap: 0 }}
      >
        <div style={{ width: COL_GRIP, flexShrink: 0 }} />
        <div className={headerCell} style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>{t("label")}</div>
        {columns.map(col => (
          <div key={col} className={`${headerCell} text-right`} style={{ width: COL_VALUE, flexShrink: 0 }}>
            {col}
          </div>
        ))}
        {insightsById && (
          <div className={headerCell} style={{ flex: 1, minWidth: 60, paddingLeft: 8 }}>{t("dataSet")}</div>
        )}
        <div style={{ width: COL_ACTIONS, flexShrink: 0 }} />
      </div>

      {/* Rows */}
      <Reorder.Group
        axis="y"
        values={rows}
        onReorder={onRowsChange}
        style={{ padding: 0, margin: 0 }}
      >
        {rows.map(row => (
          <DraggableRow
            key={row.id}
            row={row}
            columns={columns}
            insightsById={insightsById}
            onChange={updated => updateRow(row.id, updated)}
            onDuplicate={() => duplicateRow(row.id)}
            onDelete={() => deleteRow(row.id)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
