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
import "highcharts/modules/heatmap";
import "highcharts/highcharts-more";      // база для dumbbell/lollipop (и radar позже)
import "highcharts/modules/dumbbell";     // lollipop построен поверх dumbbell
import "highcharts/modules/lollipop";
import type { DataRow, ChartType } from "@/lib/mockData";

/* Типы, которые уже умеет этот движок. Диспетчер в ChartRenderer.tsx сверяется
   с этим списком — новый тип добавляется здесь + кейсом в switch ниже. */
export const HIGHCHARTS_TYPES: ChartType[] = [
  "Bar", "Clean Columns", "Stacked Bar",
  "Heatmap", "Lollipop", "Scatter", "Scatter Plot",
];

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
  fontDisplay: string;  // крупные цифры в графике (цифра-герой, итог доната)
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
    fontDisplay: read("--slide-font-display", "'Instrument Serif', 'GT Sectra', 'Fraunces', Georgia, serif"),
    chartRadius: parseFloat(read("--slide-chart-radius", "2")) || 0,
  };
}

/* Вычисляет ЛЮБОЙ CSS-цвет (var-цепочки, color-mix) в готовый rgb: браузер
   резолвит его на временном невидимом элементе внутри контейнера графика.
   Нужен там, где токен темы — не простой хекс (heat-шкала на color-mix). */
function resolveCssColor(el: HTMLElement, value: string): string {
  const probe = document.createElement("span");
  probe.style.display = "none";
  probe.style.color = value;
  el.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved || value;
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

/* ── Heat-шкала — те же токены и логика, что heatFill/heatInk в ChartRenderer.
   Highcharts не резолвит var()/color-mix → отдаём через resolveCssColor. */
const HEAT_FROM = "var(--slide-heat-from, #E9E4D5)";
const HEAT_TO   = "var(--slide-heat-to, #1B2840)";
const HEAT_MID  = `var(--slide-heat-mid, color-mix(in srgb, ${HEAT_TO} 50%, ${HEAT_FROM}))`;

function fmtHeatV(v: number): string {
  return Math.abs(v) < 10
    ? (Number.isInteger(v) ? String(v) : v.toFixed(2))
    : Math.round(v).toString();
}

/* Цвет цифры в клетке — копия порогов heatInk (флип на тёмной половине шкалы). */
function heatInkVar(t: number): string {
  if (t >= 0.62) return `var(--slide-heat-ink-high, ${HEAT_FROM})`;
  if (t >= 0.35) return `var(--slide-heat-ink-mid, ${t < 0.5 ? HEAT_TO : HEAT_FROM})`;
  return HEAT_TO;
}

function heatmapOptions(
  el: HTMLElement, t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  const allVals = rows.flatMap((row) => row.values);
  const minVal = allVals.length ? Math.min(...allVals) : 0;
  const maxVal = allVals.length ? Math.max(...allVals) : 1;
  const span = maxVal - minVal || 1;

  const data = rows.flatMap((row, ri) =>
    columns.map((_, ci) => {
      const v = row.values[ci] ?? 0;
      const tv = (v - minVal) / span;
      return {
        x: ci, y: ri, value: v,
        dataLabels: { style: { color: resolveCssColor(el, heatInkVar(tv)) } },
      };
    }),
  );

  return {
    ...base,
    chart: { ...base.chart, type: "heatmap" },
    colorAxis: {
      min: minVal,
      max: maxVal,
      stops: [
        [0,   resolveCssColor(el, HEAT_FROM)],
        [0.5, resolveCssColor(el, HEAT_MID)],
        [1,   resolveCssColor(el, HEAT_TO)],
      ],
      labels: { style: { color: t.inkFaint, fontSize: "9px", fontFamily: t.fontMono } },
    },
    /* Градиентная плашка сверху справа — как у родного рендера */
    legend: {
      enabled: true,
      align: "right", verticalAlign: "top", layout: "horizontal",
      symbolWidth: 68, symbolHeight: 6, margin: 6, padding: 0,
    },
    xAxis: {
      ...base.xAxis,
      categories: columns,
      lineWidth: 0, tickWidth: 0,
      labels: { style: { color: t.inkMuted, fontSize: "11px" } },
    },
    yAxis: {
      ...base.yAxis,
      categories: rows.map((row) => row.label),
      reversed: true,           // строка 0 сверху, как в родном рендере
      gridLineWidth: 0,
      title: { text: undefined },
      labels: { style: { color: t.inkMuted, fontSize: "11px" } },
    },
    tooltip: {
      ...base.tooltip,
      formatter: function () {
        const p = this as Highcharts.Point & { value?: number };
        return `${columns[p.x ?? 0]} · ${rows[p.y ?? 0]?.label}: <b>${fmtHeatV(p.value ?? 0)}</b>`;
      },
    },
    series: [{
      type: "heatmap",
      name: columns[0] ?? "Value",
      data,
      borderWidth: 1,
      borderColor: "transparent",   // 1px зазор между клетками, как cw-1 у родного
      dataLabels: {
        enabled: true,
        formatter: function () {
          const p = this as Highcharts.Point & { value?: number };
          return fmtHeatV(p.value ?? 0);
        },
        style: { fontFamily: t.fontMono, fontSize: "11px", fontWeight: "normal", textOutline: "none" },
      },
    }],
  };
}

/* ── Lollipop — как у родного: ножки series-4, точки series-2, последняя
   точка крупнее + accent, рядом «цифра-герой» display-шрифтом. */
function lollipopOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[], expanded?: boolean,
): Highcharts.Options {
  const lastIdx = rows.length - 1;
  const data = rows.map((row, i) => {
    const v = row.values[0] ?? 0;
    if (i !== lastIdx) return { y: v };
    return {
      y: v,
      marker: { radius: expanded ? 8 : 6, fillColor: t.accent },
      dataLabels: {
        enabled: true,
        format: "{y}",
        style: {
          color: t.accent,
          fontFamily: t.fontDisplay,
          fontSize: expanded ? "36px" : "14px",
          fontWeight: "normal",
          textOutline: "none",
        },
      },
    };
  });

  return {
    ...base,
    chart: { ...base.chart, type: "lollipop" },
    xAxis: {
      ...base.xAxis,
      categories: rows.map((row) => row.label),
      lineWidth: 0, tickWidth: 0,
      labels: { style: { color: t.inkFaint, fontSize: "10px", fontFamily: t.fontMono } },
    },
    series: [{
      type: "lollipop",
      name: columns[1] ?? columns[0] ?? "Value",
      data,
      connectorColor: t.series[3],
      connectorWidth: 1.5,
      marker: { radius: expanded ? 5 : 4, fillColor: t.series[1] },
      dataLabels: { enabled: false },
    } as Highcharts.SeriesOptionsType],
  };
}

/* ── Scatter — как у родного: если второй величины нет (одно число на строку),
   Y = значение, X = порядок строк; первая точка accent и крупнее, остальные
   чередуют series-1/series-2; в expanded — подписи точек с прореживанием. */
function scatterOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[], expanded?: boolean,
): Highcharts.Options {
  const metric1 = rows.map((row) => row.values[1] ?? 0);
  const yVaries = Math.max(...metric1) !== Math.min(...metric1);
  const xLabel = yVaries ? (columns[0] ?? "X") : "";
  const yLabel = yVaries ? (columns[1] ?? "Y") : (columns[0] ?? "Y");
  const lblStep = Math.max(1, Math.ceil(rows.length / (expanded ? 8 : 4)));

  const data = rows.map((row, i) => ({
    x: yVaries ? (row.values[0] ?? 0) : i,
    y: yVaries ? (row.values[1] ?? 0) : (row.values[0] ?? 0),
    name: row.label,
    marker: {
      radius: i === 0 ? 7 : 5.5,
      fillColor: i === 0 ? t.accent : (i % 2 === 0 ? t.series[0] : t.series[1]),
    },
    dataLabels: { enabled: !!expanded && i % lblStep === 0 },
  }));

  const axisTitleStyle = { color: t.inkFaint, fontSize: "8.5px", fontFamily: t.fontMono };
  return {
    ...base,
    chart: { ...base.chart, type: "scatter" },
    xAxis: {
      ...base.xAxis,
      title: { text: xLabel || undefined, style: axisTitleStyle },
      labels: { enabled: yVaries, style: { color: t.inkFaint, fontSize: "9px", fontFamily: t.fontMono } },
    },
    yAxis: {
      ...base.yAxis,
      title: { text: yLabel || undefined, style: axisTitleStyle },
    },
    tooltip: {
      ...base.tooltip,
      pointFormat: "{point.name}: <b>{point.y}</b>",
    },
    series: [{
      type: "scatter",
      name: yLabel || "Value",
      data,
      dataLabels: {
        style: { color: t.inkMuted, fontSize: "9.5px", fontFamily: t.fontBody, fontWeight: "normal", textOutline: "none" },
        format: "{point.name}",
      },
    }],
  };
}

function columnOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  const categories = rows.map((row) => row.label);
  const data = rows.map((row) => row.values[0] ?? 0);
  const seriesName = columns[1] ?? columns[0] ?? "Value";
  return {
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
}

interface Props {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  expanded?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

export function HighchartsRenderer({ rows, columns, chartType, expanded, containerWidth, containerHeight }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!elRef.current) return;

    const el = elRef.current;
    const t = readSlideTokens(el);
    const height = containerHeight ?? (expanded ? 220 : 148);
    const base = baseOptions(t, height, containerWidth);

    let options: Highcharts.Options;
    switch (chartType) {
      case "Heatmap":
        options = heatmapOptions(el, t, base, rows, columns);
        break;
      case "Lollipop":
        options = lollipopOptions(t, base, rows, columns, expanded);
        break;
      case "Scatter":
      case "Scatter Plot":
        options = scatterOptions(t, base, rows, columns, expanded);
        break;
      default:
        options = columnOptions(t, base, rows, columns);
    }

    chartRef.current = Highcharts.chart(el, options);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [rows, columns, chartType, expanded, containerWidth, containerHeight]);

  return (
    <div
      ref={elRef}
      style={{ width: containerWidth ?? "100%", height: containerHeight ?? (expanded ? 220 : 148) }}
    />
  );
}
