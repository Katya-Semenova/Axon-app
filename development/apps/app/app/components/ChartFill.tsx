"use client";

import { useRef, useEffect, useState } from "react";
import { ChartRenderer } from "./ChartRenderer";
import type { DataRow, ChartType } from "@/lib/mockData";

interface ChartFillProps {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  expanded?: boolean;
}

/**
 * Wraps ChartRenderer in a ResizeObserver so the chart always fills its
 * container exactly — no whitespace bands from fixed viewBox aspect ratios.
 * Use in place of ChartRenderer wherever the chart lives in a resizable area.
 */
export function ChartFill({ rows, columns, chartType, expanded }: ChartFillProps) {
  const ref  = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(el.clientHeight);
      if (w > 0 && h > 0) setSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {size && (
        <ChartRenderer
          rows={rows}
          columns={columns}
          chartType={chartType}
          expanded={expanded}
          containerWidth={size.w}
          containerHeight={size.h}
        />
      )}
    </div>
  );
}
