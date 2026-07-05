"use client";

/* ── Highcharts renderer ──────────────────────────────────────────────────────
   Альтернативный движок рендеринга для режима Interactive (скролл-дашборд).
   Включается фича-флагом RENDER_ENGINE === 'highcharts' (см. lib/renderEngine.ts).

   Подключаем Highcharts напрямую (без React-обёртки): у проекта React 19, и
   обёртка highcharts-react-official часто конфликтует по версиям. Прямой вызов
   Highcharts.chart() в useEffect надёжнее и не тянет лишних зависимостей.

   МОСТ ТЕМЫ. Родные SVG-графики берут цвета строкой `var(--slide-*, fallback)` —
   браузер сам подставляет цвет темы деки. Highcharts требует готовые значения
   в опциях, поэтому перед каждой отрисовкой читаем те же токены с контейнера
   через getComputedStyle (readSlideTokens). Fallback-значения — Editorial,
   1:1 с константами ChartRenderer.tsx: вне деки (канвас, drill-in) вид не
   меняется. Смена темы деки меняет CSS-переменные без смены пропсов — если
   понадобится живая перерисовка при переключении темы, обвязка Interactive
   передаст ключ; для дашборда, монтируемого заново, чтения на маунте хватает. */

import { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import type { DataRow } from "@/lib/mockData";

/* Editorial fallbacks — только внутри var()-fallback'ов ниже, не для прямого
   использования (единственный источник правды тем — токены --slide-*). */
const NAVY     = "#1B2840";
const NAVY_700 = "#2A3654";
const NAVY_500 = "#4A5878";
const NAVY_300 = "#8892AA";
const NAVY_100 = "#B8C2D0";
const GOLD     = "#B89548";
const GOLD_300 = "#C9A961";
const BORDER   = "#D9D3C2";
const T2       = "#5C6478";
const T3       = "#8A8B87";

export interface SlideTokens {
  ink: string;        // крупные цифры / заголовочные подписи
  inkMuted: string;   // подписи осей / имена категорий
  inkFaint: string;   // тики / второстепенные подписи
  accent: string;     // золотой акцент (hover, выделение)
  axis: string;       // сетка / оси / кольца
  series: string[];   // категориальная палитра, 6 цветов
  fontBody: string;
  fontMono: string;
  chartRadius: number; // скругление баров/плиток, px
}

/* Читает токены темы с элемента-контейнера. Порядок fallback'ов повторяет
   ChartRenderer.tsx: INK_FAINT — тот же --slide-text (с иным Editorial-фолбэком),
   AXIS — --slide-axis → --slide-border → BORDER. */
export function readSlideTokens(el: HTMLElement): SlideTokens {
  const cs = getComputedStyle(el);
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback;

  const text = cs.getPropertyValue("--slide-text").trim();
  return {
    ink:      read("--slide-title", NAVY),
    inkMuted: text || T2,
    inkFaint: text || T3,
    accent:   read("--slide-accent", GOLD),
    axis:     read("--slide-axis", read("--slide-border", BORDER)),
    series: [
      read("--slide-series-1", NAVY_700),
      read("--slide-series-2", NAVY_500),
      read("--slide-series-3", GOLD),
      read("--slide-series-4", NAVY_300),
      read("--slide-series-5", GOLD_300),
      read("--slide-series-6", NAVY_100),
    ],
    fontBody: read("--slide-font-body", "Inter, sans-serif"),
    fontMono: read("--slide-font-mono", "'JetBrains Mono', monospace"),
    chartRadius: parseFloat(read("--slide-chart-radius", "2")) || 0,
  };
}

/* Базовые опции, общие для всех типов: прозрачный фон, без титула/легенды/
   копирайта, шрифт темы. Конкретные рендеры дополняют своим. */
export function baseOptions(t: SlideTokens, height: number, width?: number): Highcharts.Options {
  return {
    chart: {
      backgroundColor: "transparent",
      height,
      width,
      spacing: [8, 8, 8, 8],
      style: { fontFamily: t.fontBody },
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      lineColor: t.axis,
      tickColor: t.axis,
      labels: { style: { color: t.inkMuted, fontSize: "10px" } },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: t.axis,
      labels: { style: { color: t.inkFaint, fontSize: "10px" } },
    },
    tooltip: { valueDecimals: 0, style: { fontFamily: t.fontMono, fontSize: "11px" } },
  };
}

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

    const t = readSlideTokens(elRef.current);
    const categories = rows.map((row) => row.label);
    const data = rows.map((row) => row.values[0] ?? 0);
    const seriesName = columns[1] ?? columns[0] ?? "Value";
    const height = containerHeight ?? (expanded ? 220 : 148);

    const base = baseOptions(t, height, containerWidth);
    const options: Highcharts.Options = {
      ...base,
      chart: { ...base.chart, type: "column" },
      xAxis: { ...base.xAxis, categories },
      plotOptions: {
        column: {
          borderRadius: t.chartRadius,
          color: t.series[0],
          states: { hover: { color: t.accent } },
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
