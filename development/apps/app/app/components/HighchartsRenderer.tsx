"use client";

/* ── Highcharts renderer (SPIKE) ──────────────────────────────────────────────
   Альтернативный движок рендеринга — рисует тот же bar-график, что и родной
   CleanColumnsChart, но средствами Highcharts. Включается фича-флагом
   RENDER_ENGINE === 'highcharts' (см. lib/renderEngine.ts).

   Подключаем Highcharts напрямую (без React-обёртки): у проекта React 19, и
   обёртка highcharts-react-official часто конфликтует по версиям. Прямой вызов
   Highcharts.chart() в useEffect надёжнее и не тянет лишних зависимостей. */

import { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import type { DataRow } from "@/lib/mockData";

/* Фирменные цвета AXON — чтобы Highcharts-график вписывался в стиль продукта. */
const NAVY = "#1B2840";
const GOLD = "#B89548";
const BORDER = "#D9D3C2";
const GRID = "#ECE8DC";
const INK_MUTED = "#5C6478";
const INK_FAINT = "#8A8B87";

interface Props {
  rows: DataRow[];
  columns: string[];
  expanded?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

export function HighchartsRenderer({ rows, columns, expanded, containerWidth, containerHeight }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const categories = rows.map((row) => row.label);
    const data = rows.map((row) => row.values[0] ?? 0);
    const seriesName = columns[1] ?? columns[0] ?? "Value";
    const height = containerHeight ?? (expanded ? 220 : 148);

    const options: Highcharts.Options = {
      chart: {
        type: "column",
        backgroundColor: "transparent",
        height,
        width: containerWidth,
        spacing: [8, 8, 8, 8],
        style: { fontFamily: "Inter, sans-serif" },
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories,
        lineColor: BORDER,
        tickColor: BORDER,
        labels: { style: { color: INK_MUTED, fontSize: "10px" } },
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: GRID,
        labels: { style: { color: INK_FAINT, fontSize: "10px" } },
      },
      tooltip: { valueDecimals: 0 },
      plotOptions: {
        column: {
          borderRadius: 2,
          color: NAVY,
          states: { hover: { color: GOLD } },
        },
      },
      series: [{ type: "column", name: seriesName, data }],
    };

    chartRef.current = Highcharts.chart(elRef.current, options);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [rows, columns, expanded, containerWidth, containerHeight]);

  return (
    <div
      ref={elRef}
      style={{ width: containerWidth ?? "100%", height: containerHeight ?? (expanded ? 220 : 148) }}
    />
  );
}
