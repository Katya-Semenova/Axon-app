"use client";

import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { makePoints, smoothPath, roundTo } from "@/lib/charts";
import type { DataRow, ChartType } from "@/lib/mockData";
import dynamic from "next/dynamic";
import { RENDER_ENGINE, HIGHCHARTS_TYPES } from "@/lib/renderEngine";
import { useWorkspaceStore } from "@/lib/store";

/* Highcharts — только клиент (ssr:false): его модули (heatmap и др.) при
   импорте трогают объекты браузера и падают на серверном рендере. */
const HighchartsRenderer = dynamic(
  () => import("./HighchartsRenderer").then((m) => m.HighchartsRenderer),
  { ssr: false },
);

const r = roundTo;

/* ── Editorial Density palette — fixed categorical order ── */
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

/* Categorical series palette. Themeable via --slide-series-* (applied at the
   slide/deck root in SLIDES mode); the hardcoded Editorial colours are the
   fallback, so on canvas / drill-in (no theme vars) the look is unchanged. */
const SERIES = [
  `var(--slide-series-1, ${NAVY_700})`,  // заливка данных = navy-700 (текст/цифры = navy-900, см. INK)
  `var(--slide-series-2, ${NAVY_500})`,
  `var(--slide-series-3, ${GOLD})`,
  `var(--slide-series-4, ${NAVY_300})`,
  `var(--slide-series-5, ${GOLD_300})`,
  `var(--slide-series-6, ${NAVY_100})`,
];

/* Themeable ink / structure tokens. Fallbacks equal the Editorial constants
   1:1 (Editorial's --slide-title/-text/-accent/-border ARE NAVY/T2/GOLD/BORDER),
   so canvas / drill-in / light themes are pixel-identical; on dark slide themes
   they resolve to the theme's readable colours so numbers, lines and axes that
   used hardcoded NAVY/T2/BORDER no longer vanish against the dark bg. */
const INK       = `var(--slide-title,  ${NAVY})`;   // headline numbers / inline figures
const INK_MUTED = `var(--slide-text,   ${T2})`;     // labels / axis names
const INK_FAINT = `var(--slide-text,   ${T3})`;     // tick labels
const ACCENT    = `var(--slide-accent, ${GOLD})`;   // gold highlight
const AXIS      = `var(--slide-axis, var(--slide-border, ${BORDER}))`; // gridlines / rings / spokes / connectors — dedicated token, more visible than the structural border on dark themes

/* Bar / treemap-tile corner rounding — themeable per deck theme (Editorial/Swiss
   sharp = 0, Soft round, Web ≈8). Applied as the CSS geometry property rx/ry:
   only the CSS property resolves var(); the SVG presentation attribute would not.
   The browser clamps to half the shorter side, so thin bars round gracefully.
   Fallback 0px → canvas / drill-in (no theme vars) stay sharp, unchanged. */
const CHART_RADIUS = {
  rx: "var(--slide-chart-radius, 0px)",
  ry: "var(--slide-chart-radius, 0px)",
};

const SERIF_FAMILY = "'Instrument Serif', 'GT Sectra', 'Fraunces', Georgia, serif";
const MONO_FAMILY  = "'JetBrains Mono', monospace";
const SANS_FAMILY  = "Inter, sans-serif";

/* Display font for big in-chart figures (donut total, spline endpoint value).
   Follows the deck theme's display face; fallback = Editorial serif, so canvas /
   drill-in (no theme vars) stay identical. Numbers no longer render serif under
   sans themes (Swiss/Soft/Web). var() fallback may itself contain commas. */
const FONT_DISPLAY = `var(--slide-font-display, ${SERIF_FAMILY})`;

interface ChartProps {
  rows: DataRow[];
  columns: string[];
  expanded?: boolean;
  /** When provided by ChartFill's ResizeObserver, charts use these exact pixel dims. */
  containerWidth?: number;
  containerHeight?: number;
}

/* Computes minimum label step to avoid X-axis overlap.
   Uses ~6.5px/char for JetBrains Mono at 10px + 8px inter-label gap. */
function labelStep(n: number, plotW: number, labels: string[]): number {
  const maxLen  = Math.max(...labels.map(l => l.length), 1);
  const approxW = maxLen * 6.5 + 8;
  const fits    = Math.max(1, Math.floor(plotW / approxW));
  return Math.max(1, Math.ceil(n / fits));
}

/* SVG sizing: explicit pixel dims from ResizeObserver > expanded % fill > card h-auto */
function svgAttrs(containerWidth?: number, containerHeight?: number, expanded?: boolean) {
  if (containerWidth && containerHeight) {
    return { width: containerWidth, height: containerHeight, style: { display: "block" as const } };
  }
  if (expanded) {
    return { width: "100%", height: "100%", preserveAspectRatio: "xMidYMid meet", style: { display: "block" as const } };
  }
  return { className: "w-full h-auto" };
}

function GridLines({ pl, pr, pt, plotH }: { pl: number; pr: number; pt: number; plotH: number }) {
  return (
    <>
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line key={i}
          x1={pl} y1={r(pt + plotH * (1 - f))}
          x2={pr} y2={r(pt + plotH * (1 - f))}
          stroke={AXIS} strokeWidth="0.5" strokeOpacity="0.05" />
      ))}
    </>
  );
}

/* ── Lollipop ─────────────────────────────────────────── */
function LollipopChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = containerWidth ?? 360;
  const H = containerHeight ?? (expanded ? 220 : 148);
  const pl = 17, pr = 22, pt = 26, pb = 22;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  /* Минимальная ножка: самое маленькое значение НЕ ложится на ось — и ножка,
     и точка остаются видимыми (2026-07-04: золотая точка минимума сидела на
     строке подписей). Шкала сжимается на MIN_STEM сверху вниз. */
  const MIN_STEM = expanded ? 14 : 12;
  const xv = (i: number) => pl + (i / Math.max(data.length - 1, 1)) * plotW;
  const yv = (v: number) => pt + (plotH - MIN_STEM) * (1 - (v - mn) / range);

  const baseline = pt + plotH;
  const lastIdx  = data.length - 1;
  const step     = expanded ? labelStep(data.length, plotW, labels) : Math.max(1, Math.floor(data.length / 4));

  /* Подписи оси X: если последняя подпись показывается (прижата к правому краю,
     anchor="end"), прячем те, что налезают на неё (ширина символа ≈6px @ fs10). */
  const lastShown     = lastIdx % step === 0;
  const lastLabelLeft = xv(lastIdx) - (labels[lastIdx]?.length ?? 0) * 6;
  const labelVisible  = (i: number) =>
    i % step === 0 &&
    (!lastShown || i === lastIdx || i === 0 ||
      xv(i) + (labels[i].length * 6) / 2 <= lastLabelLeft - 6);

  const dotR        = expanded ? 5 : 4;
  const currentDotR = expanded ? 8 : 6;
  /* «Цифра-герой» — единый паттерн со Spline Area (крупно, левее маркера,
     при пике у верхней кромки — под маркером). */
  const heroSize    = expanded ? 36 : 14;
  const heroX       = xv(lastIdx) - currentDotR - 8;
  const heroAbove   = yv(data[lastIdx] ?? 0) - currentDotR - 8;
  const heroY       = heroAbove - heroSize * 0.72 >= pt
    ? heroAbove
    : yv(data[lastIdx] ?? 0) + currentDotR + heroSize * 0.72 + 6;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {data.map((v, i) => (
        <line key={i}
          x1={r(xv(i))} y1={r(yv(v) + dotR)} x2={r(xv(i))} y2={r(baseline)}
          stroke={SERIES[3]} strokeWidth="1.5" />
      ))}
      {data.map((v, i) => (
        <circle key={i} cx={r(xv(i))} cy={r(yv(v))}
          r={i === lastIdx ? currentDotR : dotR}
          fill={i === lastIdx ? ACCENT : SERIES[1]} />
      ))}
      {data.length > 0 && (
        <text x={r(heroX)} y={r(heroY)}
          textAnchor="end" fontSize={heroSize}
          fontFamily={FONT_DISPLAY} fill={ACCENT}>
          {data[lastIdx]}
        </text>
      )}
      {labels.map((l, i) => labelVisible(i) && (
        <text key={i} x={r(xv(i))} y={H - 6}
          textAnchor={i === 0 ? "start" : i === lastIdx ? "end" : "middle"}
          fontSize="10" fill={INK_FAINT} fontFamily={MONO_FAMILY} fontWeight="500">{l}</text>
      ))}
    </svg>
  );
}

/* ── Spline Area ──────────────────────────────────────── */
function SplineAreaChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = containerWidth ?? 360;
  const H = containerHeight ?? (expanded ? 200 : 140);
  const pl = 8, pr = 8, pt = 16, pb = 20;
  const plotW = W - pl - pr;
  const plotH = H - pt - pb;

  const pts   = makePoints(data, pl, W - pr, pt, H - pb);
  const pd    = smoothPath(pts);
  const last  = pts[pts.length - 1];
  const areaD = pts.length > 1
    ? `${pd} L ${r(last.x)} ${H - pb} L ${pl} ${H - pb} Z`
    : "";
  const step = expanded ? labelStep(data.length, plotW, labels) : Math.max(1, Math.floor(data.length / 4));

  /* «Цифра-герой» у последней точки: крупно (слайд ×2, просьба 2026-07-04), правый
     край текста ЛЕВЕЕ маркера (не наезжает на точку и не режется кромкой viewBox);
     если пик у верхней кромки и сверху не помещается — подпись уходит ПОД маркер. */
  const dotR      = expanded ? 5 : 4;
  const heroSize  = expanded ? 36 : 13;
  const heroX     = last ? last.x - dotR - 8 : 0;
  const heroAbove = last ? last.y - dotR - 8 : 0;
  const heroY     = last && heroAbove - heroSize * 0.72 >= pt
    ? heroAbove
    : (last ? last.y + dotR + heroSize * 0.72 + 6 : 0);

  /* Подписи оси X — та же защита от налезания на последнюю, что в Lollipop. */
  const lastI         = data.length - 1;
  const lastShown     = lastI >= 0 && lastI % step === 0;
  const lastLabelLeft = (pts[lastI]?.x ?? 0) - (labels[lastI]?.length ?? 0) * 6;
  const labelVisible  = (i: number) =>
    i % step === 0 &&
    (!lastShown || i === lastI || i === 0 ||
      (pts[i]?.x ?? 0) + (labels[i].length * 6) / 2 <= lastLabelLeft - 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <defs>
        <linearGradient id="spline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={NAVY} stopOpacity="0.14" />
          <stop offset="100%" stopColor={NAVY} stopOpacity="0" />
        </linearGradient>
      </defs>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {areaD && <path d={areaD} fill={SERIES[0]} fillOpacity="0.18" />}
      {pd    && <path d={pd} stroke={SERIES[0]} strokeWidth="2" strokeLinecap="round" />}
      {last && (
        <>
          <circle cx={r(last.x)} cy={r(last.y)} r={dotR} fill={ACCENT} />
          {data.length > 0 && (
            <text x={r(heroX)} y={r(heroY)}
              textAnchor="end" fontSize={heroSize}
              fontFamily={FONT_DISPLAY} fill={ACCENT}>
              {data[data.length - 1]}
            </text>
          )}
        </>
      )}
      {labels.map((l, i) => labelVisible(i) && (
        <text key={i} x={r(pts[i]?.x ?? 0)} y={H - 4}
          textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          fontSize="10" fill={INK_FAINT} fontFamily={MONO_FAMILY} fontWeight="500">{l}</text>
      ))}
    </svg>
  );
}

/* ── Donut ────────────────────────────────────────────── */
function DonutChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 240;
  const H = containerHeight ?? 144;

  /* Compatibility guard: Donut requires single-dimension, non-negative data.
     Multi-column matrices or data with negative values produce invalid arcs. */
  const donutCompatible =
    columns.length <= 1 &&
    rows.every(r => (r.values[0] ?? 0) >= 0);

  if (!donutCompatible) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" className="w-full h-auto" style={{ display: "block" }}>
        <rect width={W} height={H} fill={AXIS} fillOpacity="0.18" />
        <text x={W / 2} y={H / 2 - 7} textAnchor="middle"
          fontSize="10" fill={INK_FAINT} fontFamily={MONO_FAMILY} letterSpacing="0.03em">
          Chart type unsupported
        </text>
        <text x={W / 2} y={H / 2 + 8} textAnchor="middle"
          fontSize="9" fill={INK_FAINT} fontFamily={MONO_FAMILY} fillOpacity="0.65">
          for this data shape
        </text>
      </svg>
    );
  }

  /* Split: donut gets 62%, legend gets 38% */
  const legendColW   = Math.round(W * 0.38);
  const donutColW    = W - legendColW;
  const vMargin      = 10;
  const maxR         = Math.min(donutColW * 0.40, (H - vMargin * 2) / 2);
  const OR           = Math.max(30, maxR);
  const IR           = OR * 0.58;
  const CX           = donutColW / 2;
  const CY           = H / 2;
  const legendX      = donutColW + 8;
  const legendAvailW = legendColW - 10;

  const total = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;

  let angle = -90;
  const slices = rows.map((row, i) => {
    const pct   = (row.values[0] ?? 0) / total;
    const start = angle + 1;
    const end   = angle + pct * 360 - 1;
    angle += pct * 360;
    return { row, start, end, color: SERIES[i % SERIES.length] };
  });

  function toRad(deg: number) { return (deg * Math.PI) / 180; }
  function pt(deg: number, rad: number) {
    return { x: r(CX + rad * Math.cos(toRad(deg))), y: r(CY + rad * Math.sin(toRad(deg))) };
  }
  function arc(s: typeof slices[0]) {
    if (s.end - s.start >= 358) {
      return `M ${CX} ${CY - OR} A ${OR} ${OR} 0 1 1 ${CX - 0.01} ${CY - OR} Z`;
    }
    const large = s.end - s.start > 180 ? 1 : 0;
    const o1 = pt(s.start, OR), o2 = pt(s.end, OR);
    const i1 = pt(s.end, IR),   i2 = pt(s.start, IR);
    return `M ${o1.x} ${o1.y} A ${OR} ${OR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${IR} ${IR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
  }

  /* Legend sizing — proper text-sized rows */
  const n      = rows.length;
  const rowH   = Math.min(28, Math.max(16, (H - 16) / Math.max(n, 1)));
  /* Компактная карточка: легенда мельче (иначе текст «гигантский» рядом с маркером);
     в drill-in (expanded) допускаем крупнее. Маркер — квадрат ~0.85 от шрифта. */
  const fSize   = Math.max(9, Math.min(expanded ? 14 : 11, rowH - 3));
  const markerS = Math.max(8, Math.round(fSize * 0.85));
  const startY  = Math.max(8, (H - n * rowH) / 2);

  /* Value text width: measure the widest value string (monospace, 0.63 ratio).
     This replaces the flat fSize*2.8 guess that mis-fires on short/long values. */
  const LABEL_X  = markerS + 6;         // x where label text starts within the legend group
  const MIN_GAP  = 8;                   // guaranteed px between label end and value start
  // Пончик = часть-от-целого: в легенде показываем ДОЛЮ сектора (value/total),
  // тогда «%» правдив (раньше «%» лепился к сырому значению → 918000%).
  const sharePct = (v: number) => Math.round((v / total) * 100);
  const maxValStr = rows.reduce((mx, row) => {
    const s = `${sharePct(row.values[0] ?? 0)}%`;
    return s.length > mx.length ? s : mx;
  }, "");
  const valTextW = maxValStr.length * fSize * 0.63;  // monospace width estimate

  /* Pixel budget for label text on a single line */
  const maxLabelPx   = Math.max(0, legendAvailW - LABEL_X - MIN_GAP - valTextW);
  const maxChars     = Math.max(3, Math.floor(maxLabelPx / (fSize * 0.60)));  // sans-serif ratio

  /* Two-line mode: switch when the single-line budget is too tight to show ≥5 chars
     AND rowH gives enough height to stack label + value.                          */
  const twoLine      = maxChars < 5 && rowH >= 22;
  const maxCharsFull = Math.floor((legendAvailW - LABEL_X) / (fSize * 0.60));

  /* 9a: center (number + CHANNELS) pair vertically within the donut hole.
     Ratio 0.38 (was 0.5) keeps the number at ~38% of hole diameter, giving
     ≥25px breathing room from the inner ring at compact card scale. */
  const numSize = Math.max(13, OR * 0.38);
  const CHAN_SIZE = 7.5;
  /* Зазор до подписи растёт вместе с числом: у display-серифов тем деки цифры
     свисают ниже базовой линии (~0.2em) — константные 5px они перекрывали. */
  const chanGap = Math.max(5, numSize * 0.3);
  const pairH  = numSize * 0.75 + chanGap + CHAN_SIZE;
  const numY   = CY - pairH / 2 + numSize * 0.75;
  const chanY  = numY + chanGap + CHAN_SIZE;

  // Центр пончика = «целое»: компактный итог (1.3M / 4.2K) вместо числа секторов.
  const compactNum = (v: number) => {
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return `${Math.round(v)}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s)} fill={s.color} />
      ))}
      <text x={CX} y={numY} textAnchor="middle"
        fontSize={numSize} fontFamily={FONT_DISPLAY} fill={INK}>
        {compactNum(total)}
      </text>
      <text x={CX} y={chanY} textAnchor="middle" fontSize={CHAN_SIZE}
        fontFamily={MONO_FAMILY} fill={INK_MUTED} letterSpacing="0.08em">TOTAL</text>
      {rows.map((row, i) => {
        const y = startY + i * rowH;
        if (twoLine) {
          /* Stack: label line 1, value line 2 — no horizontal collision possible */
          const lbl = row.label.length > maxCharsFull
            ? row.label.slice(0, maxCharsFull - 1) + "…" : row.label;
          return (
            <g key={i} transform={`translate(${legendX}, ${y})`}>
              <rect x="0" y={rowH * 0.58 - markerS * 0.5} width={markerS} height={markerS} rx="1.5" fill={SERIES[i % SERIES.length]} />
              <text x={LABEL_X} y={rowH * 0.46} fontSize={fSize - 1} fill={INK_MUTED} fontFamily={SANS_FAMILY}>
                {lbl}
              </text>
              <text x={LABEL_X} y={rowH * 0.88} fontSize={fSize - 1}
                fill={INK} fontFamily={MONO_FAMILY} fontWeight="500">
                {sharePct(row.values[0] ?? 0)}%
              </text>
            </g>
          );
        }
        /* Чистые колонки: метка слева, доля — по ПРАВОМУ краю легенды (фикс-колонка,
           не «прыгает» за меткой); маркер и текст центрированы по середине строки. */
        const label  = row.label.length > maxChars ? row.label.slice(0, maxChars - 1) + "…" : row.label;
        const textY  = rowH * 0.5 + fSize * 0.34;
        return (
          <g key={i} transform={`translate(${legendX}, ${y})`}>
            <rect x="0" y={rowH * 0.5 - markerS * 0.5} width={markerS} height={markerS} rx="1.5" fill={SERIES[i % SERIES.length]} />
            <text x={LABEL_X} y={textY} fontSize={fSize} fill={INK_MUTED} fontFamily={SANS_FAMILY}>
              {label}
            </text>
            <text x={legendAvailW} y={textY} textAnchor="end" fontSize={fSize}
              fill={INK} fontFamily={MONO_FAMILY} fontWeight="500">
              {sharePct(row.values[0] ?? 0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Clean Columns ────────────────────────────────────── */
function CleanColumnsChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = containerWidth ?? 300;
  const H = containerHeight ?? (expanded ? 200 : 140);
  const pl = 12, pr = 8, pt = 12, pb = 20;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const mx   = Math.max(...data) || 1;
  const n    = data.length;
  const step = plotW / n;
  const barW = Math.max(4, step * 0.65);
  const xv   = (i: number) => pl + step * i + step / 2;
  const yv   = (v: number) => pt + plotH - (v / mx) * plotH;
  const bStep = expanded ? labelStep(n, plotW, labels) : Math.max(1, Math.floor(n / 4));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {data.map((v, i) => {
        const x = xv(i), y = yv(v), bh = pt + plotH - y;
        const isMax = v === Math.max(...data);
        return (
          <g key={i}>
            <rect x={r(x - barW / 2)} y={r(y)} width={r(barW)} height={r(bh)}
              fill={isMax ? ACCENT : SERIES[1]} style={CHART_RADIUS} />
            {i % bStep === 0 && (
              <text x={r(x)} y={H - 4}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize="10" fill={INK_FAINT} fontFamily={MONO_FAMILY} fontWeight="500">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Stacked Horizontal Bar ───────────────────────────── */
function StackedBarChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const pl = 90, pr = 56, pt = 26;  // pr шире — число-итог в конце строки не режется
  const W = containerWidth ?? 280;
  const DEFAULT_SLOT = 36;          // высота строки 22 + зазор 14 — поведение по умолчанию
  const bottomPad = 10;
  const H = containerHeight ?? (pt + rows.length * DEFAULT_SLOT + bottomPad);
  const plotW = W - pl - pr;
  // Строка подстраивается под высоту ящика — все строки влезают, ничего не режется снизу.
  const slot = Math.max(8, (H - pt - bottomPad) / Math.max(1, rows.length));
  const gap  = Math.min(14, slot * 0.32);
  const rowH = Math.max(4, slot - gap);

  const maxTotal = Math.max(...rows.map(row => row.values.reduce((s, v) => s + v, 0)));

  /* Легенда серий: шаг записи считается от доступной ширины (был жёсткий 72px —
     русские названия колонок въезжали в следующий квадратик), метки режутся с «…». */
  const LEG_MARKER = 14;                                   // квадратик 10 + зазор 4
  const legAvail   = W - pl - 8;
  const legEntryW  = Math.max(46, legAvail / Math.max(1, columns.length));
  const legMaxCh   = Math.max(3, Math.floor((legEntryW - LEG_MARKER - 8) / (11 * 0.6)));
  const legLabel   = (c: string) => (c.length > legMaxCh ? c.slice(0, legMaxCh - 1) + "…" : c);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {columns.map((col, i) => (
        <g key={i} transform={`translate(${pl + i * legEntryW}, 12)`}>
          <rect x="0" y="-7" width="10" height="6" rx="1" fill={SERIES[i % SERIES.length]} />
          <text x="14" y="0" fontSize="11" fill={INK_MUTED} fontFamily={SANS_FAMILY}>{legLabel(col)}</text>
        </g>
      ))}
      {rows.map((row, i) => {
        const y = pt + i * slot;
        const total = row.values.reduce((s, v) => s + v, 0);
        let xOff = pl;
        return (
          <g key={i}>
            <text x={r(pl - 5)} y={r(y + rowH / 2 + 4)} textAnchor="end" fontSize="9.5"
              fill={INK_MUTED} fontFamily={SANS_FAMILY}>{row.label}</text>
            {row.values.map((v, j) => {
              const bw = r((v / maxTotal) * plotW);
              const rect = (
                <rect key={j} x={r(xOff)} y={r(y)} width={bw} height={rowH}
                  fill={SERIES[j % SERIES.length]} style={CHART_RADIUS} />
              );
              xOff += bw + 1;
              return rect;
            })}
            <text x={r(xOff + 4)} y={r(y + rowH / 2 + 4)} fontSize="11"
              fill={INK} fontFamily={MONO_FAMILY} fontWeight="500">{total}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Waterfall ────────────────────────────────────────── */
function WaterfallChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 320;
  const H = containerHeight ?? (expanded ? 200 : 152);
  const pl = 20, pr = 12, pt = 16, pb = 24;
  const plotW = W - pl - pr, plotH = H - pt - pb;
  const n = rows.length;

  const isEndpoint = (i: number) => i === 0 || i === n - 1;

  let running = 0;
  const bars = rows.map((row, i) => {
    const val = row.values[0] ?? 0;
    if (isEndpoint(i)) {
      const prev = running; running = val;
      return { start: 0, end: val, delta: val - prev, isTot: true };
    }
    const s = running; running += val;
    return { start: Math.min(s, running), end: Math.max(s, running), delta: val, isTot: false };
  });

  const allVals = bars.flatMap(b => [b.start, b.end]);
  const mn = Math.min(...allVals, 0), mx = Math.max(...allVals) || 1;
  const range = mx - mn;

  const yv   = (v: number) => pt + plotH - ((v - mn) / range) * plotH;
  const step = plotW / n;
  const barW = step * 0.65;
  const xv   = (i: number) => pl + step * i + step / 2 - barW / 2;
  const wfLabels = rows.map(row => row.label.slice(0, 6));
  const bStep    = expanded ? labelStep(n, plotW, wfLabels) : Math.max(1, Math.floor(n / 4));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {bars.map((b, i) => {
        if (i === 0) return null;
        const prev = bars[i - 1];
        const connY = r(yv(prev.end));
        return (
          <line key={i}
            x1={r(xv(i - 1) + barW)} y1={connY}
            x2={r(xv(i))} y2={connY}
            stroke={INK_MUTED} strokeWidth="0.6" strokeDasharray="3 2" strokeOpacity="0.25" />
        );
      })}
      {bars.map((b, i) => {
        const x  = xv(i);
        const y1 = yv(b.end), y2 = yv(b.start);
        const bh = Math.max(2, Math.abs(y2 - y1));
        const isPos = b.delta >= 0;
        const color = b.isTot ? SERIES[0] : isPos ? SERIES[1] : ACCENT;
        return (
          <g key={i}>
            <rect x={r(x)} y={r(Math.min(y1, y2))} width={r(barW)} height={r(bh)}
              fill={color} style={CHART_RADIUS} />
            {!b.isTot && Math.abs(y2 - y1) > 12 && (
              <text x={r(x + barW / 2)} y={r(Math.max(pt + 8, Math.min(y1, y2) - 4))} textAnchor="middle" fontSize="9"
                fontFamily={MONO_FAMILY} fill={color} fontWeight="500">
                {b.delta > 0 ? `+${b.delta}` : b.delta}
              </text>
            )}
            {i % bStep === 0 && (
              <text x={r(x + barW / 2)} y={H - 6}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                fontSize="9" fill={INK_FAINT} fontFamily={MONO_FAMILY} fontWeight="500">
                {rows[i].label.slice(0, 6)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Scatter Plot ─────────────────────────────────────── */
function ScatterPlotChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 280;
  const H = containerHeight ?? (expanded ? 220 : 160);
  const pl = 28, pr = 12, pt = 12, pb = 24;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const n = rows.length;
  const metric0 = rows.map(row => row.values[0] ?? 0);
  const metric1 = rows.map(row => row.values[1] ?? 0);
  // Есть ли НАСТОЯЩАЯ вторая величина? Если нет (одно число на строку), точки без
  // фолбэка схлопнулись бы в самый низ. Тогда: Y = единственное число, X = порядок строк.
  const yVaries = Math.max(...metric1) !== Math.min(...metric1);
  const xs = yVaries ? metric0 : metric0.map((_, i) => i);
  const ys = yVaries ? metric1 : metric0;
  const xLabel = yVaries ? (columns[0] ?? "X") : "";
  const yLabel = yVaries ? (columns[1] ?? "Y") : (columns[0] ?? "Y");
  const lblStep = Math.max(1, Math.ceil(n / (expanded ? 8 : 4)));  // прореживание подписей

  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const xv = (v: number) => r(pl + ((v - xMin) / (xMax - xMin || 1)) * plotW);
  const yv = (v: number) => r(pt + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      <line x1={pl} y1={pt} x2={pl} y2={pt + plotH}
        stroke={AXIS} strokeWidth="1" strokeOpacity="0.35" />
      <line x1={pl} y1={pt + plotH} x2={W - pr} y2={pt + plotH}
        stroke={AXIS} strokeWidth="1" strokeOpacity="0.35" />
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="8.5"
        fill={INK_FAINT} fontFamily="'JetBrains Mono',monospace">{xLabel}</text>
      <text x="10" y={H / 2} textAnchor="middle" fontSize="8.5"
        fill={INK_FAINT} fontFamily="'JetBrains Mono',monospace"
        transform={`rotate(-90, 10, ${H / 2})`}>{yLabel}</text>
      {rows.map((row, i) => {
        const cx = xv(xs[i]);
        const cy = yv(ys[i]);
        const fill = i === 0 ? ACCENT : (i % 2 === 0 ? SERIES[0] : SERIES[1]);
        const nearRight = cx > W - 64;  // у правого края подпись растёт влево, иначе обрежется
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={i === 0 ? 7 : 5.5} fill={fill} />
            {expanded && i % lblStep === 0 && (
              <text x={nearRight ? cx - 9 : cx + 9} y={cy + 4}
                textAnchor={nearRight ? "end" : "start"}
                fontSize="9.5" fill={INK_MUTED} fontFamily={SANS_FAMILY}>
                {row.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Treemap ──────────────────────────────────────────────
   Squarified layout via d3-hierarchy treemapSquarify.
   Each leaf maps to one rect; d3 fills [0,0,W,H] exactly.
   padding(1) creates 1 px gutters — no SVG stroke needed.  */
type TmDatum = { label?: string; value?: number; children?: TmDatum[] };

function TreemapChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? 342;
  const H = containerHeight ?? 162;

  /* Themeable via --slide-series-* / --slide-tm-ink; Editorial colours are the
     fallback (unchanged on canvas / non-themed contexts). On dark themes the
     fill becomes bright and the single --slide-tm-ink keeps labels readable. */
  const fills = [
    `var(--slide-series-1, ${NAVY_700})`,  // navy-900 ушёл из заливок (остаётся только для текста)
    `var(--slide-series-2, ${NAVY_500})`,
    `var(--slide-series-3, ${GOLD})`,
    `var(--slide-series-4, ${NAVY_300})`,
    `var(--slide-series-5, ${GOLD_300})`,
    `var(--slide-series-6, ${NAVY_100})`,
    `var(--slide-series-7, ${NAVY_700})`,  // повтор на самой мелкой плитке — остальные оттенки различимы
  ];
  // Цвет подписи под каждую заливку: тёмные плитки → кремовый текст, светлые → navy.
  const textOnDark = ["#F5F2EA", "#F5F2EA", NAVY, NAVY, NAVY, NAVY, "#F5F2EA"];

  function fmtVal(v: number) {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  }

  if (rows.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="11" fill={INK_FAINT} fontFamily={MONO_FAMILY}>
          No data
        </text>
      </svg>
    );
  }

  const data: TmDatum = {
    children: rows.map(row => ({ label: row.label, value: row.values[0] ?? 0 })),
  };

  const leaves = treemap<TmDatum>()
    .tile(treemapSquarify)
    .size([W, H])
    .padding(1)
    (hierarchy<TmDatum>(data).sum(d => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0)))
    .leaves();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {leaves.map((leaf, i) => {
        const x0  = leaf.x0;
        const y0  = leaf.y0;
        const lw  = leaf.x1 - leaf.x0;
        const lh  = leaf.y1 - leaf.y0;
        const fill = fills[i % fills.length];
        const ink  = `var(--slide-tm-ink, ${textOnDark[i % textOnDark.length]})`;
        const lbl  = leaf.data.label ?? "";
        const val  = leaf.data.value ?? 0;

        return (
          <g key={i}>
            <rect x={r(x0)} y={r(y0)} width={r(lw)} height={r(lh)} fill={fill} style={CHART_RADIUS} />
            {lh >= 26 && lw >= 24 && (
              <text
                x={r(x0 + 7)} y={r(y0 + 19)}
                fontSize={Math.min(16, lw * 0.30)}
                fontWeight="500" fill={ink} fontFamily={SANS_FAMILY}>
                {lbl}
              </text>
            )}
            {lh >= 44 && lw >= 40 && (
              <text
                x={r(x0 + 7)} y={r(y0 + 38)}
                fontSize={Math.min(19, lw * 0.26)}
                fill={ink} fillOpacity="0.78" fontFamily={FONT_DISPLAY}>
                {fmtVal(val)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Heatmap colours — themeable per deck theme (вариант Б+, 2026-07-04) ──
   Шкала low→high из токенов темы: `--slide-heat-from` / `-mid` (опц.) / `-to`.
   Смешивание — CSS color-mix() ПО ЗНАЧЕНИЮ клетки (резолвит var() без
   getComputedStyle): нижняя половина from→mid, верхняя mid→to. Фолбэк mid =
   ровно середина from→to, поэтому темы с двумя токенами рисуются КАК РАНЬШЕ.
   Фолбэк всей шкалы (холст/drill-in вне тем) = крем→navy; Editorial задаёт
   фирменную трёхстоповую GOLD→крем→NAVY (см. PRESENTATION_THEMES).
   Цвет цифры в клетке: по умолчанию противоположный конец шкалы (флип на
   50%); тема может переопределить нейтральную (35–62%) и тёмную (>62%) зоны
   токенами `--slide-heat-ink-mid`/`-high` (Editorial: серый/крем — как в
   старой шкале). Значения возвращаются как CSS-строки → применять через
   style={{ fill }}: только CSS-свойство (не SVG-атрибут) резолвит var().   */
const HEAT_FROM = "var(--slide-heat-from, #E9E4D5)";  // low end (обычно светлый)
const HEAT_TO   = "var(--slide-heat-to, #1B2840)";    // high end (обычно тёмный/насыщенный)
const HEAT_MID  = `var(--slide-heat-mid, color-mix(in srgb, ${HEAT_TO} 50%, ${HEAT_FROM}))`;

function heatFill(t: number): string {
  const tc = Math.min(1, Math.max(0, t));
  return tc < 0.5
    ? `color-mix(in srgb, ${HEAT_MID} ${Math.round(tc * 200)}%, ${HEAT_FROM})`
    : `color-mix(in srgb, ${HEAT_TO} ${Math.round((tc - 0.5) * 200)}%, ${HEAT_MID})`;
}
function heatInk(t: number): string {
  if (t >= 0.62) return `var(--slide-heat-ink-high, ${HEAT_FROM})`;
  if (t >= 0.35) return `var(--slide-heat-ink-mid, ${t < 0.5 ? HEAT_TO : HEAT_FROM})`;
  return HEAT_TO;  // светлая зона — тёмный конец шкалы
}

/* ── Heatmap ──────────────────────────────────────────────
   True matrix. X-axis: columns[], Y-axis: rows[].
   Cell (ci, ri) filled on diverging scale [minVal, maxVal].
   Legend: horizontal gradient swatch top-right.           */
function HeatmapChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? (expanded ? 600 : 360);
  const H = containerHeight ?? (expanded ? 320 : 200);

  const nRows = rows.length;
  const nCols = columns.length || Math.max(...rows.map(row => row.values.length), 1);

  /* Y-axis label width — scales to longest label, capped (шире под крупный шрифт) */
  const maxLabelLen = Math.max(...rows.map(row => row.label.length), 3);
  const pl = Math.max(36, Math.min(84, Math.round(maxLabelLen * 7 + 6)));
  const pb = 24;  // X-axis labels (крупнее)
  const pt = 20;  // top (legend + breathing room)
  const pr = 8;

  const gridW = W - pl - pr;
  const gridH = H - pt - pb;
  const cellW = nCols > 0 ? gridW / nCols : gridW;
  const cellH = nRows > 0 ? gridH / nRows : gridH;

  /* Global range */
  const allVals = rows.flatMap(row => row.values);
  const minVal  = allVals.length ? Math.min(...allVals) : 0;
  const maxVal  = allVals.length ? Math.max(...allVals) : 1;
  const span    = maxVal - minVal || 1;

  function tOf(v: number) { return (v - minVal) / span; }
  function fmtV(v: number) {
    return Math.abs(v) < 10
      ? (Number.isInteger(v) ? String(v) : v.toFixed(2))
      : Math.round(v).toString();
  }

  /* Legend dimensions */
  const lgW = Math.min(68, gridW * 0.28);
  const lgH = 6;
  const lgX = r(W - pr - lgW);
  const lgY = 5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      <defs>
        <linearGradient id="hm-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   style={{ stopColor: HEAT_FROM }} />
          <stop offset="50%"  style={{ stopColor: HEAT_MID }} />
          <stop offset="100%" style={{ stopColor: HEAT_TO }} />
        </linearGradient>
      </defs>

      {/* ── Legend ── */}
      <rect x={lgX} y={lgY} width={lgW} height={lgH} fill="url(#hm-grad)" />
      <text x={lgX} y={lgY + lgH + 9}
        fontSize="9" fontFamily={MONO_FAMILY} fill={INK_FAINT} textAnchor="start">
        {fmtV(minVal)}
      </text>
      <text x={lgX + lgW} y={lgY + lgH + 9}
        fontSize="9" fontFamily={MONO_FAMILY} fill={INK_FAINT} textAnchor="end">
        {fmtV(maxVal)}
      </text>

      {/* ── Y-axis labels ── */}
      {rows.map((row, ri) => (
        <text key={`yl-${ri}`}
          x={pl - 6} y={r(pt + ri * cellH + cellH / 2 + 4.5)}
          textAnchor="end"
          fontSize={Math.min(14, cellH * 0.5)}
          fontFamily={SANS_FAMILY} fill={INK_MUTED}>
          {row.label}
        </text>
      ))}

      {/* ── X-axis labels ── */}
      {columns.map((col, ci) => (
        <text key={`xl-${ci}`}
          x={r(pl + ci * cellW + cellW / 2)} y={H - 6}
          textAnchor="middle"
          fontSize={Math.min(13, cellW * 0.34)}
          fontFamily={SANS_FAMILY} fill={INK_MUTED}>
          {col}
        </text>
      ))}

      {/* ── Cells ── */}
      {rows.map((row, ri) =>
        columns.map((_, ci) => {
          const v  = row.values[ci] ?? 0;
          const tv = tOf(v);
          const cx = r(pl + ci * cellW);
          const cy = r(pt + ri * cellH);
          const cw = r(cellW - 1);
          const ch = r(cellH - 1);
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={cx} y={cy} width={cw} height={ch} style={{ fill: heatFill(tv) }} />
              {cw > 26 && ch > 14 && (
                <text
                  x={r(cx + cw / 2)} y={r(cy + ch / 2 + 4.5)}
                  textAnchor="middle"
                  fontSize={Math.min(13, cw * 0.26, ch * 0.5)}
                  fontFamily={MONO_FAMILY} style={{ fill: heatInk(tv) }}>
                  {fmtV(v)}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ── Radar ────────────────────────────────────────────────
   One axis per row, magnitude = values[0]. Concentric ring
   guides at 25/50/75/100 %. Filled polygon on top. */
function RadarChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? (expanded ? 480 : 320);
  const H = containerHeight ?? (expanded ? 320 : 200);
  const n = rows.length;

  if (n < 3) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="11"
          fill={INK_FAINT} fontFamily={MONO_FAMILY}>
          Radar needs ≥ 3 categories
        </text>
      </svg>
    );
  }

  const cx = W / 2;
  const cy = H / 2 + 4;
  const radius = Math.min(W * 0.42, H * 0.40);
  const values = rows.map(row => row.values[0] ?? 0);
  const mx = Math.max(...values) || 1;

  function axisAngle(i: number) { return (i / n) * 2 * Math.PI - Math.PI / 2; }
  function pointAt(i: number, t: number) {
    const a = axisAngle(i);
    return { x: cx + Math.cos(a) * radius * t, y: cy + Math.sin(a) * radius * t };
  }

  const polygon = values
    .map((v, i) => { const p = pointAt(i, v / mx); return `${r(p.x)},${r(p.y)}`; })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {/* Concentric ring guides — polygons in same shape */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <polygon key={t}
          points={Array.from({ length: n }, (_, i) => {
            const p = pointAt(i, t);
            return `${r(p.x)},${r(p.y)}`;
          }).join(" ")}
          fill="none" stroke={AXIS} strokeWidth="1" opacity={0.5} />
      ))}
      {/* Axis spokes */}
      {Array.from({ length: n }, (_, i) => {
        const p = pointAt(i, 1);
        return (
          <line key={i} x1={cx} y1={cy} x2={r(p.x)} y2={r(p.y)}
            stroke={AXIS} strokeWidth="1" opacity={0.45} />
        );
      })}
      {/* Filled data polygon */}
      <polygon points={polygon} fill={SERIES[0]} fillOpacity="0.22"
        stroke={SERIES[0]} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Vertex dots — first one accented gold */}
      {values.map((v, i) => {
        const p = pointAt(i, v / mx);
        return <circle key={i} cx={r(p.x)} cy={r(p.y)} r={i === 0 ? 4 : 3}
          fill={i === 0 ? ACCENT : SERIES[0]} />;
      })}
      {/* Outer axis labels */}
      {rows.map((row, i) => {
        const a = axisAngle(i);
        const lx = cx + Math.cos(a) * (radius + 16);
        const ly = cy + Math.sin(a) * (radius + 16);
        const anchor = Math.abs(Math.cos(a)) < 0.35 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text key={i} x={r(lx)} y={r(ly + 3)} textAnchor={anchor}
            fontSize="10" fill={INK_MUTED} fontFamily={SANS_FAMILY}>
            {row.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Dot Matrix (waffle) ──────────────────────────────────
   100-dot grid where each row of data colours a proportional
   share. Rounding distributes any remainder to the rows with
   the largest fractional part so the grid always sums to 100. */
function DotMatrixChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? (expanded ? 480 : 340);
  const H = containerHeight ?? (expanded ? 320 : 200);
  const COLS = 10, GRID_ROWS = 10;

  const total = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const shares = rows.map(row => ((row.values[0] ?? 0) / total) * 100);
  const counts = shares.map(s => Math.floor(s));
  const remainder = 100 - counts.reduce((s, c) => s + c, 0);
  const fracs = shares.map((s, i) => ({ frac: s - Math.floor(s), idx: i }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder && fracs.length; i++) {
    counts[fracs[i % fracs.length].idx]++;
  }

  /* Reserve right gutter for legend (≈110px), then size dot grid to fit. */
  const LEGEND_W = 120;
  const padX = 16, padY = 16;
  const availW = W - padX * 2 - LEGEND_W;
  const availH = H - padY * 2;
  const dotW   = Math.min(availW / COLS, availH / GRID_ROWS);
  const gridW  = dotW * COLS;
  const gridH  = dotW * GRID_ROWS;
  const startX = padX + (availW - gridW) / 2;
  const startY = padY + (availH - gridH) / 2;
  const dotR   = dotW * 0.32;

  /* Flat 100-element colour map, ordered by row index. */
  const dotFill: (string | null)[] = [];
  rows.forEach((_, ri) => {
    const c = SERIES[ri % SERIES.length];
    for (let i = 0; i < counts[ri]; i++) dotFill.push(c);
  });
  while (dotFill.length < 100) dotFill.push(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {Array.from({ length: 100 }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const cx = startX + col * dotW + dotW / 2;
        const cy = startY + row * dotW + dotW / 2;
        const fill = dotFill[i];
        return (
          <circle key={i} cx={r(cx)} cy={r(cy)} r={r(dotR)}
            fill={fill ?? AXIS}
            fillOpacity={fill ? 1 : 0.4} />
        );
      })}
      {/* Legend right of the grid */}
      {rows.map((row, ri) => {
        // Шаг 24px под двухстрочный блок (метка + %), иначе % налезает на метку следующей записи.
        const ly = startY + 6 + ri * 24;
        if (ly > startY + gridH) return null;   // hide overflow rows on tiny canvases
        /* Бюджет метки: от начала текста до правого края — без обрезки длинные
           русские метки уезжали за пределы графика. */
        const legX     = startX + gridW + 16;
        const legMaxCh = Math.max(3, Math.floor((W - legX - 11 - 6) / (10 * 0.6)));
        const legLbl   = row.label.length > legMaxCh
          ? row.label.slice(0, legMaxCh - 1) + "…" : row.label;
        return (
          <g key={ri} transform={`translate(${r(legX)}, ${r(ly)})`}>
            <circle cx="3" cy="0" r="3.5" fill={SERIES[ri % SERIES.length]} />
            <text x="11" y="3" fontSize="10" fill={INK_MUTED} fontFamily={SANS_FAMILY}>{legLbl}</text>
            <text x="11" y="15" fontSize="9" fill={INK_FAINT} fontFamily={MONO_FAMILY}>{counts[ri]}%</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Map — proportional dot-grid, one region per row ─────
   Dots are allocated to rows by value share. A legend row
   beneath shows label + percentage for up to 6 regions.
   (Moved from SlideArchetype "Map" → ChartType "Map".) */
function MapChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? (expanded ? 600 : 360);
  const H = containerHeight ?? (expanded ? 320 : 200);

  if (!rows.length) return <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)} />;

  const sorted    = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
  const total     = sorted.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const dotR      = 3.5;
  const dotGap    = 3;
  const step      = dotR * 2 + dotGap;
  const legendH   = 38;
  const padX      = 20;
  const padY      = 14;
  const cols      = Math.floor((W - padX * 2) / step);
  const gridRows  = Math.floor((H - legendH - padY * 2) / step);
  const totalDots = cols * gridRows;

  const regionOf: number[] = [];
  let allocated = 0;
  sorted.forEach((row, ri) => {
    const count = ri < sorted.length - 1
      ? Math.max(1, Math.round((row.values[0] ?? 0) / total * totalDots))
      : totalDots - allocated;
    for (let d = 0; d < count && allocated + d < totalDots; d++) regionOf.push(ri);
    allocated += count;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {/* Dot grid */}
      {regionOf.slice(0, totalDots).map((ri, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx  = padX + col * step + dotR;
        const cy  = padY + row * step + dotR;
        return <circle key={i} cx={r(cx)} cy={r(cy)} r={dotR} fill={SERIES[ri % SERIES.length]} fillOpacity={0.8} />;
      })}
      {/* Legend row */}
      {sorted.slice(0, 6).map((row, ri) => {
        const maxCols  = Math.min(sorted.length, 6);
        const colW     = Math.floor((W - padX * 2) / maxCols);
        const lx       = padX + ri * colW;
        const ly       = H - legendH + 8;
        const pct      = total > 0 ? Math.round((row.values[0] ?? 0) / total * 100) : 0;
        // Бюджет колонки МИНУС маркер (11px) и зазор; −5 символов под « NN%» —
        // иначе текст упирался в маркер соседней записи.
        const maxChars = Math.max(3, Math.floor((colW - 16) / 5.5) - 5);
        const lbl      = row.label.length > maxChars
          ? row.label.slice(0, maxChars - 1) + "…" : row.label;
        return (
          <g key={ri}>
            <circle cx={r(lx + dotR)} cy={r(ly + dotR)} r={dotR} fill={SERIES[ri % SERIES.length]} />
            <text x={r(lx + dotR * 2 + 4)} y={r(ly + dotR * 2)}
              fontSize="9" fontFamily={MONO_FAMILY} fill={INK_MUTED}>
              {lbl} {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Main dispatcher ──────────────────────────────────── */
export function ChartRenderer({
  rows, columns, chartType, expanded, containerWidth, containerHeight,
}: {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  expanded?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}) {
  const props = { rows, columns, expanded, containerWidth, containerHeight };

  /* Ключ темы деки для Highcharts-ветки: смена темы меняет CSS-переменные
     БЕЗ смены пропсов, и Highcharts (читающий токены в effect) не узнаёт о ней.
     Подписка на store дёргает перерисовку; на публичной странице /p/[id]
     store не меняется (значение по умолчанию) — лишних перерисовок нет.
     Родным SVG-графикам ключ не нужен: у них var() резолвит браузер сам. */
  const themeKey = useWorkspaceStore((s) => s.presentationThemeId);

  /* За фича-флагом покрытые типы рисует движок Highcharts (режим Interactive).
     Список покрытого — HIGHCHARTS_TYPES в HighchartsRenderer.tsx. По умолчанию
     RENDER_ENGINE === 'native' — блок не активен, старый путь работает как раньше. */
  if (RENDER_ENGINE === "highcharts" && HIGHCHARTS_TYPES.includes(chartType)) {
    return <HighchartsRenderer {...props} chartType={chartType} themeKey={themeKey} />;
  }

  switch (chartType) {
    /* Active 8 (round-4) */
    case "Treemap":       return <TreemapChart {...props} />;
    case "Lollipop":      return <LollipopChart {...props} />;
    case "Dot Matrix":    return <DotMatrixChart {...props} />;
    case "Scatter":
    case "Scatter Plot":  return <ScatterPlotChart {...props} />;
    case "Stacked Bar":   return <StackedBarChart {...props} />;
    case "Heatmap":       return <HeatmapChart {...props} />;
    case "Radar":         return <RadarChart {...props} />;
    case "Donut":         return <DonutChart {...props} />;
    case "Map":           return <MapChart {...props} />;
    /* Legacy — resolve but never offered in dropdown */
    case "Bar":
    case "Clean Columns": return <CleanColumnsChart {...props} />;
    case "Spline Area":
    case "Line":
    case "Area":          return <SplineAreaChart {...props} />;
    case "Waterfall":     return <WaterfallChart {...props} />;
    default:              return <SplineAreaChart {...props} />;
  }
}
