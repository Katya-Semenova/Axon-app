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
   меняется. Смена темы деки меняет CSS-переменные БЕЗ смены пропсов — поэтому
   ChartRenderer передаёт themeKey (presentationThemeId из store): его смена
   перезапускает effect, и токены читаются заново (баг №1 из backlog 🎯). */

import { useEffect, useRef } from "react";
import Highcharts from "highcharts";
import "highcharts/modules/heatmap";
import "highcharts/highcharts-more";      // база для dumbbell/lollipop (и radar позже)
import "highcharts/modules/dumbbell";     // lollipop построен поверх dumbbell
import "highcharts/modules/lollipop";
import "highcharts/modules/treemap";      // волна 2
import "highcharts/modules/item-series";  // волна 2: Dot Matrix (тип item)
import "highcharts/modules/accessibility"; // клавиатура/скринридеры для Interactive-дашборда
import type { DataRow, ChartType } from "@/lib/mockData";

/* Список покрытых типов — HIGHCHARTS_TYPES в lib/renderEngine.ts (этот файл
   грузится только на клиенте через next/dynamic, список нужен и серверу). */

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

/* ── Radar — polar-режим (highcharts-more): кольца-полигоны как у родного,
   заливка series-1 с прозрачностью 0.22, первая вершина accent. */
function radarOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  if (rows.length < 3) {
    return {
      ...base,
      subtitle: {
        text: "Radar needs ≥ 3 categories",
        align: "center", verticalAlign: "middle",
        style: { color: t.inkFaint, fontSize: "11px", fontFamily: t.fontMono },
      },
      series: [],
    };
  }

  const values = rows.map((row) => row.values[0] ?? 0);
  const mx = Math.max(...values) || 1;
  const data = values.map((v, i) => ({
    y: v,
    marker: {
      radius: i === 0 ? 4 : 3,
      fillColor: i === 0 ? t.accent : t.series[0],
    },
  }));

  return {
    ...base,
    chart: { ...base.chart, polar: true },
    xAxis: {
      categories: rows.map((row) => row.label),
      tickmarkPlacement: "on",
      lineWidth: 0,
      gridLineColor: t.axis,   // спицы
      labels: { style: { color: t.inkMuted, fontSize: "10px", fontFamily: t.fontBody } },
    },
    yAxis: {
      gridLineInterpolation: "polygon",   // кольца тем же многоугольником
      gridLineColor: t.axis,
      lineWidth: 0,
      min: 0,
      max: mx,
      tickAmount: 5,                      // кольца на 25/50/75/100 %
      labels: { enabled: false },
      title: { text: undefined },
    },
    series: [{
      type: "area",
      name: columns[1] ?? columns[0] ?? "Value",
      data,
      color: t.series[0],
      fillColor: Highcharts.color(t.series[0]).setOpacity(0.22).get() as string,
      lineWidth: 1.5,
    }],
  };
}

/* ── Donut — pie + innerSize 58%; легенда = ДОЛЯ сектора (value/total, «%»
   правдив — см. follow-up 9c), центр = компактный итог (1.3M/4.2K) + TOTAL.
   Центр рисуем в событии render по фактическому центру пончика (при легенде
   справа он смещён влево от центра всего графика). */
const compactNum = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${Math.round(v)}`;
};

function donutOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  /* Guard совместимости — как у родного: одна колонка, без отрицательных */
  const donutCompatible =
    columns.length <= 1 && rows.every((row) => (row.values[0] ?? 0) >= 0);
  if (!donutCompatible) {
    return {
      ...base,
      subtitle: {
        text: "Chart type unsupported<br/>for this data shape",
        align: "center", verticalAlign: "middle",
        style: { color: t.inkFaint, fontSize: "10px", fontFamily: t.fontMono },
      },
      series: [],
    };
  }

  const total = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const data = rows.map((row, i) => ({
    name: row.label,
    y: row.values[0] ?? 0,
    color: t.series[i % t.series.length],
  }));

  return {
    ...base,
    chart: {
      ...base.chart,
      events: {
        render() {
          type WithCenter = Highcharts.Chart & {
            __center?: Highcharts.SVGElement[];
          };
          const chart = this as WithCenter;
          chart.__center?.forEach((elmt) => elmt.destroy());
          const series = chart.series[0];
          if (!series?.points.length) return;
          const [cx, cy, size] = (series as unknown as { center: number[] }).center;
          const x = chart.plotLeft + cx;
          const y = chart.plotTop + cy;
          const numSize = Math.max(13, (size / 2) * 0.38);
          const gap = Math.max(5, numSize * 0.3);
          const num = chart.renderer
            .text(compactNum(total), x, y - gap / 2)
            .attr({ align: "center" })
            .css({ color: t.ink, fontSize: `${numSize}px`, fontFamily: t.fontDisplay })
            .add();
          const cap = chart.renderer
            .text("TOTAL", x, y + gap + 7.5)
            .attr({ align: "center" })
            .css({ color: t.inkFaint, fontSize: "7.5px", fontFamily: t.fontMono, letterSpacing: "0.08em" })
            .add();
          chart.__center = [num, cap];
        },
      },
    },
    legend: {
      enabled: true,
      align: "right", verticalAlign: "middle", layout: "vertical",
      symbolRadius: 0,
      itemStyle: { color: t.inkMuted, fontSize: "11px", fontFamily: t.fontBody, fontWeight: "normal" },
      itemHoverStyle: { color: t.ink },
      labelFormatter: function () {
        const p = this as Highcharts.Point;
        return `${p.name} · ${Math.round(((p.y ?? 0) / total) * 100)}%`;
      },
    },
    tooltip: {
      ...base.tooltip,
      pointFormatter: function () {
        return `<b>${this.y}</b> (${Math.round(((this.y ?? 0) / total) * 100)}%)`;
      },
    },
    series: [{
      type: "pie",
      name: columns[0] ?? "Value",
      data,
      innerSize: "58%",
      borderWidth: 2,
      borderColor: "transparent",   // зазоры между секторами, как ±1° у родного
      dataLabels: { enabled: false },
      showInLegend: true,
    }],
  };
}

/* ── Spline Area / Line / Area — все три имени рисуются areaspline, как у
   родного SplineAreaChart: линия series-1, заливка series-1 op.18, маркер
   только на последней точке (accent) + «цифра-герой» display-шрифтом. */
function splineAreaOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[], expanded?: boolean,
): Highcharts.Options {
  const lastIdx = rows.length - 1;
  const data = rows.map((row, i) => {
    const v = row.values[0] ?? 0;
    if (i !== lastIdx) return { y: v };
    return {
      y: v,
      marker: { enabled: true, radius: expanded ? 5 : 4, fillColor: t.accent },
      dataLabels: {
        enabled: true,
        format: "{y}",
        style: {
          color: t.accent,
          fontFamily: t.fontDisplay,
          fontSize: expanded ? "36px" : "13px",
          fontWeight: "normal",
          textOutline: "none",
        },
      },
    };
  });

  return {
    ...base,
    chart: { ...base.chart, type: "areaspline" },
    xAxis: {
      ...base.xAxis,
      categories: rows.map((row) => row.label),
      lineWidth: 0, tickWidth: 0,
      labels: { style: { color: t.inkFaint, fontSize: "10px", fontFamily: t.fontMono } },
    },
    series: [{
      type: "areaspline",
      name: columns[1] ?? columns[0] ?? "Value",
      data,
      color: t.series[0],
      fillColor: Highcharts.color(t.series[0]).setOpacity(0.18).get() as string,
      lineWidth: 2,
      marker: { enabled: false },
      dataLabels: { enabled: false },
    }],
  };
}

/* ── Treemap (волна 2) — как у родного: раскладка squarified (та же семья,
   что d3 treemapSquarify), сортировка по убыванию (дефолт Highcharts),
   заливки series-1…7 по кругу; чернила подписи — единый --slide-tm-ink на
   темах, Editorial-fallback — свой цвет под каждую заливку (крем на тёмных
   плитках, navy на светлых). Подпись/число прячутся на мелких плитках —
   пороги 26/24 и 44/40 px, как у родного рендера. */
const TM_TEXT_ON_DARK = ["#F5F2EA", "#F5F2EA", NAVY, NAVY, NAVY, NAVY, "#F5F2EA"];

const fmtTmVal = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}K` : (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* Подписи treemap идут через useHTML (двухстрочный блок) — метки из данных
   пользователя экранируем. */
const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function treemapOptions(
  el: HTMLElement, t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  /* series-7 нужен только treemap — читаем локально (в SlideTokens 6 цветов,
     расширять нельзя: сдвинется цикл цветов у доната/матрицы). */
  const series7 = getComputedStyle(el).getPropertyValue("--slide-series-7").trim() || NAVY_700;
  const fills = [...t.series, series7];

  const data = rows.map((row, i) => ({
    name: row.label,
    value: row.values[0] ?? 0,
    color: fills[i % fills.length],
    custom: {
      ink: resolveCssColor(el, `var(--slide-tm-ink, ${TM_TEXT_ON_DARK[i % TM_TEXT_ON_DARK.length]})`),
    },
  }));

  return {
    ...base,
    tooltip: {
      ...base.tooltip,
      pointFormatter: function () {
        const p = this as Highcharts.Point & { value?: number };
        return `${escHtml(p.name ?? "")}: <b>${fmtTmVal(p.value ?? 0)}</b>`;
      },
    },
    series: [{
      type: "treemap",
      layoutAlgorithm: "squarified",
      name: columns[0] ?? "Value",
      data,
      borderWidth: 1,
      borderColor: "transparent",   // 1px зазор между плитками, как padding(1) у родного
      borderRadius: t.chartRadius,
      dataLabels: {
        enabled: true,
        useHTML: true,
        align: "left",
        verticalAlign: "top",
        style: { textOutline: "none" },
        formatter: function () {
          const p = this as Highcharts.Point & {
            value?: number;
            shapeArgs?: { width?: number; height?: number };
          };
          const lw = p.shapeArgs?.width ?? 0;
          const lh = p.shapeArgs?.height ?? 0;
          if (lh < 26 || lw < 24) return "";
          const ink = (p.options.custom as { ink?: string } | undefined)?.ink ?? "";
          /* Текст не должен вылезать за плитку (баг №3 🎯): жёсткая ширина
             по плитке + обрезка с «…» — как slice(…)+«…» у родного. */
          const clip = `max-width:${Math.max(0, lw - 8)}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
          const val = lh >= 44 && lw >= 40
            ? `<div style="font-family:${t.fontDisplay};font-size:${Math.min(19, lw * 0.26)}px;opacity:.78;${clip}">${fmtTmVal(p.value ?? 0)}</div>`
            : "";
          return `<div style="color:${ink};text-align:left;line-height:1.25;padding:2px 0 0 2px;">`
            + `<div style="font-family:${t.fontBody};font-weight:500;font-size:${Math.min(16, lw * 0.3)}px;${clip}">${escHtml(p.name ?? "")}</div>`
            + val + `</div>`;
        },
      },
    } as Highcharts.SeriesOptionsType],
  };
}

/* ── Dot Matrix (волна 2) — тип item, прямоугольная сетка 10×10 = 100 точек.
   Доли считаем как родной DotMatrixChart: floor от процента, остаток до 100
   раздаётся строкам с наибольшей дробной частью — сумма точек всегда 100.
   Цвета series-1…6 по кругу, легенда справа «метка · N%». */
function dotMatrixOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[],
): Highcharts.Options {
  if (!rows.length) {
    return {
      ...base,
      subtitle: {
        text: "No data",
        align: "center", verticalAlign: "middle",
        style: { color: t.inkFaint, fontSize: "11px", fontFamily: t.fontMono },
      },
      series: [],
    };
  }

  const total = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const shares = rows.map((row) => ((row.values[0] ?? 0) / total) * 100);
  const counts = shares.map((s) => Math.floor(s));
  const remainder = 100 - counts.reduce((s, c) => s + c, 0);
  const fracs = shares.map((s, i) => ({ frac: s - Math.floor(s), idx: i }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder && fracs.length; i++) {
    counts[fracs[i % fracs.length].idx]++;
  }

  const data = rows.map((row, ri) => ({
    name: row.label,
    y: counts[ri],
    color: t.series[ri % t.series.length],
  }));

  return {
    ...base,
    legend: {
      enabled: true,
      align: "right", verticalAlign: "middle", layout: "vertical",
      itemStyle: { color: t.inkMuted, fontSize: "11px", fontFamily: t.fontBody, fontWeight: "normal" },
      itemHoverStyle: { color: t.ink },
      labelFormatter: function () {
        const p = this as Highcharts.Point;
        return `${p.name} · ${p.y ?? 0}%`;
      },
    },
    tooltip: {
      ...base.tooltip,
      pointFormatter: function () {
        return `<b>${this.y ?? 0}%</b>`;
      },
    },
    series: [{
      type: "item",
      name: "Share",
      data,
      layout: "horizontal",
      rows: 10,                    // 10×10 — сетка родного рендера
      itemPadding: 0.25,
      /* Плоские точки, как у родного: у item обводка задаётся на серии (как у pie). */
      borderWidth: 0,
      marker: { symbol: "circle", lineWidth: 0 },
      dataLabels: { enabled: false },
      showInLegend: true,
    } as Highcharts.SeriesOptionsType],
  };
}

/* ── Bar / Clean Columns — как родной CleanColumnsChart: вертикальные колонки
   series-2, колонка-максимум подсвечена accent; подписи категорий mono с
   прореживанием (компакт — каждая ~4-я, как у родного). Родной диспетчер
   рисует "Bar" и "Clean Columns" одним рендером — повторяем. */
function cleanColumnsOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[], expanded?: boolean,
): Highcharts.Options {
  const values = rows.map((row) => row.values[0] ?? 0);
  const mx = Math.max(...values);
  const data = values.map((v) => ({
    y: v,
    color: v === mx ? t.accent : t.series[1],
  }));

  return {
    ...base,
    chart: { ...base.chart, type: "column" },
    xAxis: {
      ...base.xAxis,
      categories: rows.map((row) => row.label),
      lineWidth: 0, tickWidth: 0,
      labels: {
        step: expanded ? undefined : Math.max(1, Math.floor(rows.length / 4)),
        style: { color: t.inkFaint, fontSize: "10px", fontFamily: t.fontMono },
      },
    },
    plotOptions: {
      column: { borderRadius: t.chartRadius, borderWidth: 0 },
    },
    series: [{
      type: "column",
      name: columns[1] ?? columns[0] ?? "Value",
      data,
    }],
  };
}

/* ── Stacked Bar — как родной StackedBarChart: ГОРИЗОНТАЛЬНЫЙ стек, серия на
   каждую колонку данных (цвета series-1…6 по порядку колонок), легенда колонок
   сверху, метка строки слева, итог строки числом в конце стека (stackLabels).
   reversedStacks:false — первая колонка у основания, как рисует родной. */
function stackedBarOptions(
  t: SlideTokens, base: Highcharts.Options,
  rows: DataRow[], columns: string[],
): Highcharts.Options {
  const series = columns.map((col, j) => ({
    type: "bar" as const,
    name: col,
    color: t.series[j % t.series.length],
    data: rows.map((row) => row.values[j] ?? 0),
  }));

  return {
    ...base,
    chart: { ...base.chart, type: "bar" },
    legend: {
      enabled: columns.length > 1,
      align: "left", verticalAlign: "top", layout: "horizontal",
      symbolRadius: 1, symbolHeight: 8, margin: 8, padding: 0,
      itemStyle: { color: t.inkMuted, fontSize: "11px", fontFamily: t.fontBody, fontWeight: "normal" },
      itemHoverStyle: { color: t.ink },
    },
    xAxis: {
      ...base.xAxis,
      categories: rows.map((row) => row.label),
      lineWidth: 0, tickWidth: 0,
      labels: { style: { color: t.inkMuted, fontSize: "9.5px", fontFamily: t.fontBody } },
    },
    yAxis: {
      ...base.yAxis,
      reversedStacks: false,
      gridLineWidth: 0,
      labels: { enabled: false },
      stackLabels: {
        enabled: true,
        style: { color: t.ink, fontSize: "11px", fontFamily: t.fontMono, fontWeight: "500", textOutline: "none" },
      },
    },
    plotOptions: {
      bar: {
        stacking: "normal",
        borderRadius: t.chartRadius,
        borderWidth: 1,
        borderColor: "transparent",   // 1px зазор между сегментами, как у родного
        dataLabels: { enabled: false },
      },
    },
    tooltip: {
      ...base.tooltip,
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    series,
  };
}

interface Props {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  expanded?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  /** Ключ темы деки: значение не используется, но его смена перезапускает
      effect — токены --slide-* перечитываются после переключения темы. */
  themeKey?: string;
}

export function HighchartsRenderer({ rows, columns, chartType, expanded, containerWidth, containerHeight, themeKey }: Props) {
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
      case "Radar":
        options = radarOptions(t, base, rows, columns);
        break;
      case "Donut":
        options = donutOptions(t, base, rows, columns);
        break;
      case "Spline Area":
      case "Line":
      case "Area":
        options = splineAreaOptions(t, base, rows, columns, expanded);
        break;
      case "Treemap":
        options = treemapOptions(el, t, base, rows, columns);
        break;
      case "Dot Matrix":
        options = dotMatrixOptions(t, base, rows);
        break;
      case "Stacked Bar":
        options = stackedBarOptions(t, base, rows, columns);
        break;
      /* "Bar" и "Clean Columns" — один рендер, как у родного диспетчера */
      default:
        options = cleanColumnsOptions(t, base, rows, columns, expanded);
    }

    chartRef.current = Highcharts.chart(el, options);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [rows, columns, chartType, expanded, containerWidth, containerHeight, themeKey]);

  return (
    <div
      ref={elRef}
      style={{ width: containerWidth ?? "100%", height: containerHeight ?? (expanded ? 220 : 148) }}
    />
  );
}
