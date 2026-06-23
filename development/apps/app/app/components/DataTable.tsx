"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Reorder, useDragControls } from "framer-motion";
import type { DataRow, Insight } from "@/lib/types";

const BORDER  = "#E8E4DC";
const T3      = "#A8A8A2";
const T2      = "#5C6478";
const NAVY    = "#1B2840";
const GOLD    = "#B89548";
const MONO    = "'JetBrains Mono', monospace";

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
  row, columns, onChange, onDuplicate, onDelete, insightsById, draggable,
}: {
  row: DataRow;
  columns: string[];
  onChange: (updated: DataRow) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  insightsById?: Record<string, Insight>;
  /** When false (a sort/filter view is active) the grip is inert — reordering a
      sorted/filtered view is meaningless. Cell editing stays enabled. */
  draggable: boolean;
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
        {/* Drag grip — inert while a sort/filter view is active */}
        <div
          onPointerDown={draggable ? (e => controls.start(e)) : undefined}
          className="shrink-0 flex items-center justify-center select-none transition-colors"
          style={{
            width: COL_GRIP,
            color: draggable ? (hovered ? T2 : T3) : "rgba(168,168,162,0.35)",
            cursor: draggable ? "grab" : "not-allowed",
            flexShrink: 0, alignSelf: "stretch", display: "flex",
          }}
          title={draggable ? t("dragReorder") : t("dragDisabledHint")}
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
                        fontFamily: MONO, fontSize: 10.5, lineHeight: 1.5,
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

/* ── Column menu primitive ───────────────────────────────────────────────── */
function MenuBtn({ active, danger, onClick, children }: {
  active?: boolean; danger?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left", padding: "6px 12px",
        fontFamily: MONO, fontSize: 11,
        color: danger ? "#C0392B" : active ? NAVY : T2,
        fontWeight: active ? 500 : 400,
        background: active ? "rgba(27,40,64,0.06)" : "transparent",
        border: "none", cursor: "pointer",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(27,40,64,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

export function DataTable({ columns, rows, onRowsChange, insightsById }: DataTableProps) {
  const t = useTranslations("Table");

  /* ── Excel-style per-column menu: sort + filter ──
     View-only — never mutates the stored row order/content. Editing writes by id;
     while a view is active, drag-reorder is disabled (a sorted/filtered list
     can't be manually reordered). */
  const [sortKey, setSortKey] = useState<string | null>(null);  // "label" | "v0" | …
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [labelContains, setLabelContains] = useState("");
  const [valueRanges, setValueRanges] = useState<{ min: string; max: string }[]>(
    () => columns.map(() => ({ min: "", max: "" }))
  );
  const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null);

  const num = (s: string) => { const v = parseFloat(s.replace(",", ".")); return isNaN(v) ? null : v; };
  const valueFilterOn = (i: number) => {
    const r = valueRanges[i];
    return !!r && (num(r.min) !== null || num(r.max) !== null);
  };
  const labelFilterOn = labelContains.trim() !== "";
  const filtersActive = labelFilterOn || valueRanges.some((_, i) => valueFilterOn(i));
  const viewActive    = sortKey !== null || filtersActive;

  function applySort(key: string, dir: "asc" | "desc") { setSortKey(key); setSortDir(dir); setMenu(null); }
  function clearColumn(key: string) {
    if (sortKey === key) setSortKey(null);
    if (key === "label") setLabelContains("");
    else { const i = Number(key.slice(1)); setValueRanges(p => p.map((r, j) => (j === i ? { min: "", max: "" } : r))); }
    setMenu(null);
  }
  function resetView() {
    setSortKey(null); setSortDir("asc"); setLabelContains("");
    setValueRanges(columns.map(() => ({ min: "", max: "" }))); setMenu(null);
  }

  /* Apply filters, then sort — pure view derived from rows. */
  let viewRows = rows;
  if (labelFilterOn) {
    const q = labelContains.trim().toLowerCase();
    viewRows = viewRows.filter(r => r.label.toLowerCase().includes(q));
  }
  valueRanges.forEach((r, i) => {
    const mn = num(r.min), mx = num(r.max);
    if (mn !== null) viewRows = viewRows.filter(row => (row.values[i] ?? 0) >= mn);
    if (mx !== null) viewRows = viewRows.filter(row => (row.values[i] ?? 0) <= mx);
  });
  if (sortKey) {
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...viewRows];
    if (sortKey === "label") sorted.sort((a, b) => dir * a.label.localeCompare(b.label));
    else { const i = Number(sortKey.slice(1)); sorted.sort((a, b) => dir * ((a.values[i] ?? 0) - (b.values[i] ?? 0))); }
    viewRows = sorted;
  }

  function updateRow(id: string, updated: DataRow) {
    onRowsChange(rows.map(r => (r.id === id ? updated : r)));
  }
  function duplicateRow(id: string) {
    const idx = rows.findIndex(r => r.id === id);
    if (idx === -1) return;
    const clone = { ...rows[idx], id: `row-${Date.now().toString(36)}` };
    onRowsChange([...rows.slice(0, idx + 1), clone, ...rows.slice(idx + 1)]);
  }
  function deleteRow(id: string) { onRowsChange(rows.filter(r => r.id !== id)); }

  const headerCell = "text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2]";
  const headerBtn  = "bg-transparent border-none p-0 cursor-pointer inline-flex items-center hover:text-[#5C6478]";
  const filterInputCls =
    "text-[11px] font-mono text-[#1B2840] bg-white outline-none " +
    "border border-[#E8E4DC] rounded-sm px-[5px] py-[2px] " +
    "focus:border-[rgba(184,149,72,0.5)] placeholder:text-[#A8A8A2] transition-colors";

  function colActive(key: string) {
    if (key === "label") return sortKey === "label" || labelFilterOn;
    const i = Number(key.slice(1));
    return sortKey === key || valueFilterOn(i);
  }
  function openMenu(e: React.MouseEvent, key: string) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu(prev => (prev?.key === key ? null : { key, x: rect.left, y: rect.bottom + 5 }));
  }
  function ColIndicator({ k }: { k: string }) {
    const sorted = sortKey === k;
    return (
      <span style={{ marginLeft: 4, fontSize: 8, color: colActive(k) ? GOLD : T3 }}>
        {sorted ? (sortDir === "asc" ? "▲" : "▼") : "▾"}
      </span>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Sticky header: optional reset-all + column headers (each opens a sort/filter menu) */}
      <div className="sticky top-0 z-10" style={{ background: "#faf9f5" }}>
        {viewActive && (
          <div className="flex justify-end" style={{ paddingBottom: 4 }}>
            <button
              type="button"
              onClick={resetView}
              className="text-[10px] font-mono uppercase tracking-[0.08em]"
              style={{ color: GOLD, background: "transparent", border: "none", cursor: "pointer", padding: "2px 0" }}
            >
              {t("reset")}
            </button>
          </div>
        )}

        <div className="flex items-center border-b border-[#E8E4DC]" style={{ paddingTop: 4, paddingBottom: 6, gap: 0 }}>
          <div style={{ width: COL_GRIP, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
            <button type="button" onClick={(e) => openMenu(e, "label")} title={t("columnMenu")} className={`${headerCell} ${headerBtn}`}>
              {t("label")}<ColIndicator k="label" />
            </button>
          </div>
          {columns.map((col, i) => (
            <div key={col} style={{ width: COL_VALUE, flexShrink: 0, textAlign: "right" }}>
              <button type="button" onClick={(e) => openMenu(e, `v${i}`)} title={t("columnMenu")} className={`${headerCell} ${headerBtn} justify-end w-full`}>
                {col}<ColIndicator k={`v${i}`} />
              </button>
            </div>
          ))}
          {insightsById && (
            <div className={headerCell} style={{ flex: 1, minWidth: 60, paddingLeft: 8 }}>{t("dataSet")}</div>
          )}
          <div style={{ width: COL_ACTIONS, flexShrink: 0 }} />
        </div>
      </div>

      {/* Column sort/filter menu — portal */}
      {menu && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onMouseDown={() => setMenu(null)} />
          <div style={{
            position: "fixed", top: menu.y, left: menu.x, zIndex: 9999, minWidth: 176,
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 4,
            boxShadow: "0 6px 18px rgba(27,40,64,0.14)", padding: "4px 0",
          }}>
            <MenuBtn active={sortKey === menu.key && sortDir === "asc"} onClick={() => applySort(menu.key, "asc")}>{t("sortAsc")}</MenuBtn>
            <MenuBtn active={sortKey === menu.key && sortDir === "desc"} onClick={() => applySort(menu.key, "desc")}>{t("sortDesc")}</MenuBtn>
            <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
            {menu.key === "label" ? (
              <div style={{ padding: "4px 10px" }}>
                <input
                  autoFocus
                  value={labelContains}
                  onChange={e => setLabelContains(e.target.value)}
                  placeholder={t("filterPlaceholder")}
                  className={`${filterInputCls} w-full`}
                />
              </div>
            ) : (() => {
              const i = Number(menu.key.slice(1));
              const r = valueRanges[i] ?? { min: "", max: "" };
              return (
                <div style={{ padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T2 }}>{t("gte")}</span>
                  <input value={r.min} onChange={e => setValueRanges(p => p.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))} className={filterInputCls} style={{ width: 50 }} inputMode="decimal" />
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T2 }}>{t("lte")}</span>
                  <input value={r.max} onChange={e => setValueRanges(p => p.map((x, j) => (j === i ? { ...x, max: e.target.value } : x)))} className={filterInputCls} style={{ width: 50 }} inputMode="decimal" />
                </div>
              );
            })()}
            <div style={{ height: 1, background: BORDER, margin: "4px 0" }} />
            <MenuBtn onClick={() => clearColumn(menu.key)}>{t("clearColumn")}</MenuBtn>
          </div>
        </>,
        document.body
      )}

      {/* Rows. onReorder is guarded — only the natural (unsorted/unfiltered) view
          can be reordered; viewRows === rows in that case. */}
      <Reorder.Group
        axis="y"
        values={viewRows}
        onReorder={(newOrder) => { if (!viewActive) onRowsChange(newOrder); }}
        style={{ padding: 0, margin: 0 }}
      >
        {viewRows.map(row => (
          <DraggableRow
            key={row.id}
            row={row}
            columns={columns}
            insightsById={insightsById}
            draggable={!viewActive}
            onChange={updated => updateRow(row.id, updated)}
            onDuplicate={() => duplicateRow(row.id)}
            onDelete={() => deleteRow(row.id)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
