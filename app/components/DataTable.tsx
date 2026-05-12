"use client";

import { Reorder, useDragControls } from "framer-motion";
import type { DataRow } from "@/lib/mockData";

const BORDER = "#E8E4DC";
const T2     = "#6B6B66";
const T3     = "#A8A8A2";

/* ── column geometry — fixed widths, no flex-1 stretching ── */
const COL_GRIP  = 22;   // drag handle
const COL_LABEL = 100;  // label cell
const COL_VALUE = 96;   // each value cell
const ROW_GAP   = 8;    // gap between cells

interface DataTableProps {
  columns: string[];
  rows: DataRow[];
  onRowsChange: (rows: DataRow[]) => void;
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

function DraggableRow({
  row, columns, onChange,
}: {
  row: DataRow;
  columns: string[];
  onChange: (updated: DataRow) => void;
}) {
  const controls = useDragControls();

  function updateLabel(label: string) {
    onChange({ ...row, label });
  }

  function updateValue(i: number, raw: string) {
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return;
    const values = [...row.values];
    values[i] = parsed;
    onChange({ ...row, values });
  }

  const cellCls =
    "text-[12px] font-mono text-[#1B2840] bg-transparent outline-none " +
    "border border-transparent focus:border-[rgba(184,149,72,0.5)] " +
    "rounded-sm px-[6px] py-[2px] transition-colors duration-200";

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="flex items-center border-b border-[#E8E4DC] py-[2px]"
      style={{ background: "#fff", gap: ROW_GAP }}
      whileDrag={{ scale: 1.01, zIndex: 10, position: "relative" }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={e => controls.start(e)}
        className="cursor-grab active:cursor-grabbing shrink-0 text-[#A8A8A2] hover:text-[#6B6B66] transition-colors select-none flex items-center justify-center"
        style={{ width: COL_GRIP }}
        title="Drag to reorder"
      >
        <GripIcon />
      </div>

      {/* Label */}
      <input
        type="text"
        value={row.label}
        onChange={e => updateLabel(e.target.value)}
        className={cellCls}
        style={{ width: COL_LABEL, flexShrink: 0 }}
      />

      {/* Values — fixed width, no stretching */}
      {row.values.map((v, i) => (
        <input
          key={i}
          type="number"
          value={v}
          onChange={e => updateValue(i, e.target.value)}
          className={`${cellCls} text-right`}
          style={{ width: COL_VALUE, flexShrink: 0 }}
        />
      ))}
    </Reorder.Item>
  );
}

export function DataTable({ columns, rows, onRowsChange }: DataTableProps) {
  function updateRow(id: string, updated: DataRow) {
    onRowsChange(rows.map(r => (r.id === id ? updated : r)));
  }

  return (
    /* overflow-x-auto keeps it safe on narrow screens;
       on wide screens the compact fixed-width table sits flush left */
    <div className="overflow-x-auto">
      {/* Column header */}
      <div
        className="flex items-center border-b border-[#E8E4DC] pb-[6px] pt-[4px]"
        style={{ gap: ROW_GAP }}
      >
        <div style={{ width: COL_GRIP, flexShrink: 0 }} />
        <div
          className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2]"
          style={{ width: COL_LABEL, flexShrink: 0 }}
        >
          Label
        </div>
        {columns.map(col => (
          <div
            key={col}
            className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2] text-right"
            style={{ width: COL_VALUE, flexShrink: 0 }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Rows */}
      <Reorder.Group axis="y" values={rows} onReorder={onRowsChange}>
        {rows.map(row => (
          <DraggableRow
            key={row.id}
            row={row}
            columns={columns}
            onChange={updated => updateRow(row.id, updated)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
