"use client";

import { Reorder, useDragControls } from "framer-motion";
import type { DataRow } from "@/lib/mockData";

const NAVY  = "#1F2A44";
const BORDER = "#E8E4DC";
const T2    = "#6B6B66";
const T3    = "#A8A8A2";

interface DataTableProps {
  columns: string[];
  rows: DataRow[];
  onRowsChange: (rows: DataRow[]) => void;
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
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
  row,
  columns,
  onChange,
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

  const cellCls = "text-[12px] font-mono text-[#0A0A0A] bg-transparent outline-none border border-transparent focus:border-[rgba(31,42,68,0.2)] rounded px-1 py-[3px] transition-colors w-full";

  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 border-b border-[#E8E4DC] py-[6px]"
      style={{ background: "#fff" }}
      whileDrag={{
        scale: 1.015,
        boxShadow: "0 6px 20px rgba(31,42,68,0.10)",
        zIndex: 10,
        position: "relative",
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab active:cursor-grabbing shrink-0 p-1 text-[#A8A8A2] hover:text-[#6B6B66] transition-colors select-none"
        title="Drag to reorder"
      >
        <GripIcon />
      </div>
      {/* Label cell */}
      <input
        type="text"
        value={row.label}
        onChange={(e) => updateLabel(e.target.value)}
        className={`${cellCls} w-[96px] shrink-0`}
      />
      {/* Value cells */}
      {row.values.map((v, i) => (
        <input
          key={i}
          type="number"
          value={v}
          onChange={(e) => updateValue(i, e.target.value)}
          className={`${cellCls} text-right`}
          style={{ flex: 1, minWidth: 56 }}
        />
      ))}
    </Reorder.Item>
  );
}

export function DataTable({ columns, rows, onRowsChange }: DataTableProps) {
  function updateRow(id: string, updated: DataRow) {
    onRowsChange(rows.map((r) => (r.id === id ? updated : r)));
  }

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-[10px] pb-[8px] border-b border-[#E8E4DC]">
        <div style={{ width: 26, flexShrink: 0 }} />
        <div style={{ width: 96, flexShrink: 0 }}
          className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2]">
          Label
        </div>
        {columns.map((col) => (
          <div key={col} style={{ flex: 1, minWidth: 56 }}
            className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#A8A8A2] text-right">
            {col}
          </div>
        ))}
      </div>
      {/* Rows */}
      <Reorder.Group axis="y" values={rows} onReorder={onRowsChange} className="px-[10px]">
        {rows.map((row) => (
          <DraggableRow
            key={row.id}
            row={row}
            columns={columns}
            onChange={(updated) => updateRow(row.id, updated)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}
