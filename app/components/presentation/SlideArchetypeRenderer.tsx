"use client";

import { useRef, useEffect, useState } from "react";
import { ChartFill } from "../ChartFill";
import type { DataRow, ChartType } from "@/lib/mockData";
import type { SlideArchetype } from "@/lib/types";
import { NAVY, GOLD, T2, T3, BORDER } from "../ui/tokens";

const mono = "'JetBrains Mono', monospace";
const CREAM = "#F5F2EA";
const SURFACE_LIGHT = "#FBF9F3";

/* ── Palette for filled archetypes ── */
const PALETTE = ["#1B2840", "#B89548", "#4A5878", "#2A3654", "#8892AA", "#5C6478", "#D4C9A8", "#A89060"];

/* ── Number formatter ── */
function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n * 10) / 10);
}

/* ── Recursive binary-split treemap layout ── */
function computeTreemap(
  items: { value: number; label: string; idx: number }[],
  x: number, y: number, w: number, h: number,
): Array<{ x: number; y: number; w: number; h: number; label: string; value: number; idx: number }> {
  if (!items.length) return [];
  if (items.length === 1) return [{ x, y, w, h, ...items[0] }];
  const total = items.reduce((s, i) => s + i.value, 0);
  let cum = 0, splitIdx = 1;
  for (let i = 0; i < items.length - 1; i++) {
    cum += items[i].value;
    splitIdx = i + 1;
    if (cum / total >= 0.5) break;
  }
  const ratio = items.slice(0, splitIdx).reduce((s, i) => s + i.value, 0) / total;
  if (w >= h) {
    const w1 = w * ratio;
    return [
      ...computeTreemap(items.slice(0, splitIdx), x, y, w1, h),
      ...computeTreemap(items.slice(splitIdx), x + w1, y, w - w1, h),
    ];
  } else {
    const h1 = h * ratio;
    return [
      ...computeTreemap(items.slice(0, splitIdx), x, y, w, h1),
      ...computeTreemap(items.slice(splitIdx), x, y + h1, w, h - h1),
    ];
  }
}

/* ── Shared props ── */
interface ArchProps {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  archetype: SlideArchetype;
  accentColor: string;
  title: string;
  narrative?: string;
  W: number;
  H: number;
}

/* ══════════════════════════════════════════════════════════════════
   1. Chart — delegates to ChartFill (all chart types).
══════════════════════════════════════════════════════════════════ */
function ArchChart({ rows, columns, chartType, W, H }: ArchProps) {
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <ChartFill rows={rows} columns={columns} chartType={chartType} expanded />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   2. Big Number — single metric, filled background
══════════════════════════════════════════════════════════════════ */
function ArchBigNumber({ rows, columns, accentColor, W, H }: ArchProps) {
  const val   = rows[0]?.values[0] ?? 0;
  const label = rows[0]?.label ?? columns[0] ?? "";
  const numSz = Math.min(H * 0.56, W * 0.26, 200);
  const pad   = 28;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <rect width={W} height={H} fill={accentColor} />
      {/* top-left label */}
      <text x={pad} y={pad + 14}
        fontSize={10} fontFamily={mono} letterSpacing="0.1em"
        fill={CREAM} fillOpacity={0.4}>
        {label.toUpperCase()}
      </text>
      {/* large number — bottom right */}
      <text
        x={W - pad} y={H - pad}
        textAnchor="end" dominantBaseline="auto"
        fontSize={numSz} fontFamily="Inter, sans-serif" fontWeight="700"
        fill={CREAM}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {fmt(val)}
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   3. Comparison — two large numbers side by side
══════════════════════════════════════════════════════════════════ */
function ArchComparison({ rows, W, H }: ArchProps) {
  const left  = rows[0];
  const right = rows[1];
  const lv    = left?.values[0]  ?? 0;
  const rv    = right?.values[0] ?? 0;
  const numSz = Math.min(H * 0.44, W * 0.2, 130);
  const mid   = W / 2;
  const delta = lv !== 0 ? Math.round((rv - lv) / Math.abs(lv) * 100) : null;
  const positive = delta !== null && delta >= 0;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* vertical divider */}
      <line x1={mid} y1={H * 0.08} x2={mid} y2={H * 0.92} stroke={BORDER} strokeWidth={1} />

      {/* left column */}
      <text x={mid * 0.5} y={H * 0.30} textAnchor="middle"
        fontSize={11} fontFamily={mono} letterSpacing="0.08em" fill={T3}>
        {(left?.label ?? "—").toUpperCase()}
      </text>
      <text x={mid * 0.5} y={H * 0.74} textAnchor="middle"
        fontSize={numSz} fontFamily="Inter, sans-serif" fontWeight="700" fill="#0A0A0A"
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {fmt(lv)}
      </text>

      {/* right column */}
      <text x={mid + mid * 0.5} y={H * 0.30} textAnchor="middle"
        fontSize={11} fontFamily={mono} letterSpacing="0.08em" fill={T3}>
        {(right?.label ?? "—").toUpperCase()}
      </text>
      <text x={mid + mid * 0.5} y={H * 0.74} textAnchor="middle"
        fontSize={numSz} fontFamily="Inter, sans-serif" fontWeight="700" fill="#0A0A0A"
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {fmt(rv)}
      </text>

      {/* delta badge in gutter */}
      {delta !== null && (
        <g>
          <rect x={mid - 28} y={H * 0.47} width={56} height={20} rx={2}
            fill={SURFACE_LIGHT} stroke={BORDER} strokeWidth={1} />
          <text x={mid} y={H * 0.47 + 13.5} textAnchor="middle"
            fontSize={10} fontFamily={mono} fontWeight="500"
            fill={positive ? "#2A7A4A" : "#C04A3A"}>
            {positive ? `+${delta}%` : `${delta}%`}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   5. Map — dot-grid proportional to value per region
══════════════════════════════════════════════════════════════════ */
function ArchMap({ rows, accentColor, W, H }: ArchProps) {
  if (!rows.length) return <svg width={W} height={H} style={{ display: "block" }} />;

  const sorted   = [...rows].sort((a, b) => b.values[0] - a.values[0]);
  const total    = sorted.reduce((s, r) => s + r.values[0], 0);
  const dotR     = 3.5;
  const dotGap   = 3;
  const step     = dotR * 2 + dotGap;
  const legendH  = 38;
  const padX     = 20;
  const padY     = 14;
  const cols     = Math.floor((W - padX * 2) / step);
  const dotRows  = Math.floor((H - legendH - padY * 2) / step);
  const totalDots = cols * dotRows;

  /* allocate dots per region */
  const regionOf: number[] = [];
  let allocated = 0;
  sorted.forEach((row, ri) => {
    const count = ri < sorted.length - 1
      ? Math.max(1, Math.round(row.values[0] / total * totalDots))
      : totalDots - allocated;
    for (let d = 0; d < count && allocated + d < totalDots; d++) regionOf.push(ri);
    allocated += count;
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* dot grid */}
      {regionOf.slice(0, totalDots).map((ri, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx  = padX + col * step + dotR;
        const cy  = padY + row * step + dotR;
        const color = ri === 0 ? accentColor : PALETTE[ri % PALETTE.length];
        return <circle key={i} cx={cx} cy={cy} r={dotR} fill={color} fillOpacity={0.8} />;
      })}

      {/* legend */}
      {sorted.slice(0, 6).map((row, ri) => {
        const color  = ri === 0 ? accentColor : PALETTE[ri % PALETTE.length];
        const maxCols = Math.min(sorted.length, 6);
        const lx     = padX + ri * Math.floor((W - padX * 2) / maxCols);
        const ly     = H - legendH + 8;
        const pct    = total > 0 ? Math.round(row.values[0] / total * 100) : 0;
        const maxChars = Math.floor((W - padX * 2) / maxCols / 5.5);
        return (
          <g key={ri}>
            <circle cx={lx + dotR} cy={ly + dotR} r={dotR} fill={color} />
            <text x={lx + dotR * 2 + 4} y={ly + dotR * 2}
              fontSize={9} fontFamily={mono} fill={T2}>
              {row.label.slice(0, maxChars)} {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   7. Treemap archetype — rectangles sized by value
══════════════════════════════════════════════════════════════════ */
function ArchTreemap({ rows, W, H }: ArchProps) {
  if (!rows.length) return <svg width={W} height={H} style={{ display: "block" }} />;

  const sorted = [...rows].sort((a, b) => b.values[0] - a.values[0]);
  const total  = sorted.reduce((s, r) => s + r.values[0], 0);
  const items  = sorted.map((r, i) => ({ value: r.values[0], label: r.label, idx: i }));
  const rects  = computeTreemap(items, 0, 0, W, H);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {rects.map((r, i) => {
        const color    = PALETTE[r.idx % PALETTE.length];
        const pct      = total > 0 ? Math.round(r.value / total * 100) : 0;
        const textFits = r.w > 44 && r.h > 30;
        const lblSz    = Math.min(Math.max(r.w * 0.065, 8), 13);
        const valSz    = Math.min(Math.max(r.h * 0.18, 10), 20);
        const maxLblChars = Math.max(3, Math.floor(r.w / (lblSz * 0.65)));
        return (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h}
              fill={color} stroke="#EDE9E0" strokeWidth={1.5} />
            {textFits && (
              <>
                <text x={r.x + 8} y={r.y + lblSz + 6}
                  fontSize={lblSz} fontFamily={mono} letterSpacing="0.04em"
                  fill={CREAM} fillOpacity={0.7}>
                  {r.label.slice(0, maxLblChars)}
                </text>
                <text x={r.x + 8} y={r.y + r.h - 10}
                  fontSize={valSz} fontFamily="Inter, sans-serif" fontWeight="700"
                  fill={CREAM} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {pct}%
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   8. Quote / Insight — pure typography
══════════════════════════════════════════════════════════════════ */
function ArchQuote({ narrative, title, W, H }: ArchProps) {
  const text = narrative?.trim() || title?.trim() || "—";
  /* Scale font with container width: 22px min, 36px max (capped so it doesn't
     overwhelm very wide canvases).  At W≈860 → 36px, at W≈300 → 22px. */
  const quoteFontSz = Math.min(28, Math.max(22, W / 24));

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Decorative opening quote mark — sits behind the text block */}
      <text x={28} y={H * 0.46}
        fontSize={100} fontFamily="Georgia, serif"
        fill={BORDER} fontWeight="700" fillOpacity="0.55">
        &ldquo;
      </text>
      {/* Quote body — Playfair Display italic, navy */}
      <foreignObject x={44} y={H * 0.18} width={W - 72} height={H * 0.66}>
        <div
          // @ts-ignore — xmlns needed for SVG foreignObject in React
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            fontFamily: "'Playfair Display', 'Instrument Serif', Georgia, serif",
            fontSize: quoteFontSz,
            fontStyle: "italic",
            color: NAVY,
            lineHeight: 1.5,
            overflow: "hidden",
          }}>
          {text}
        </div>
      </foreignObject>
      {/* Attribution line */}
      <text x={44} y={H - 18}
        fontSize={10} fontFamily={mono} letterSpacing="0.08em" fill={T3}>
        — {title || "Axon"}
      </text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Public export — auto-measures container, picks renderer
══════════════════════════════════════════════════════════════════ */

const RENDERERS: Record<SlideArchetype, React.ComponentType<ArchProps>> = {
  "Chart":      ArchChart,
  "Big Number": ArchBigNumber,
  "Comparison": ArchComparison,
  "Quote":      ArchQuote,
};

/* ArchMap and ArchTreemap are internal utilities only — they render via
   ChartFill/ChartRenderer when their types appear as ChartType, not SlideArchetype. */

/* ArchTreemap is kept as an internal utility — used when chart type is
   "Treemap" via ArchChart → ChartFill, not as a top-level slide archetype. */

interface SlideArchetypeRendererProps {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  archetype: SlideArchetype;
  accentColor: string;
  title: string;
  narrative?: string;
}

export function SlideArchetypeRenderer(props: SlideArchetypeRendererProps) {
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

  const Renderer = RENDERERS[props.archetype] ?? ArchChart;

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {size && (
        <Renderer {...props} W={size.w} H={size.h} />
      )}
    </div>
  );
}

/* ── Slide summary — factual, data-derived, tone-independent ─────────────── */
export function deriveSlideSummary(rows: DataRow[], columns: string[]): string {
  if (!rows.length) return "";
  const values = rows.map(r => r.values[0] ?? 0);
  const total  = values.reduce((s, v) => s + v, 0);
  const max    = Math.max(...values);
  const maxRow = rows[values.indexOf(max)];
  const min    = Math.min(...values);
  const minRow = rows[values.indexOf(min)];

  if (rows.length === 1) {
    return `${maxRow.label}: ${fmt(max)}.`;
  }

  if (rows.length === 2) {
    const diff = Math.abs(values[0] - values[1]);
    const pct  = values[1] > 0 ? Math.round((values[0] / values[1] - 1) * 100) : 0;
    return `${rows[0].label} (${fmt(values[0])}) leads ${rows[1].label} (${fmt(values[1])}) by ${fmt(diff)} — a ${Math.abs(pct)}% gap.`;
  }

  /* Multi-column: mention the peak row and period */
  if ((columns?.length ?? 1) > 1) {
    const allVals = rows.flatMap(r => r.values);
    const mv  = Math.max(...allVals);
    const mri = rows.findIndex(r => r.values.includes(mv));
    const mci = rows[mri]?.values.indexOf(mv);
    return `${rows[mri]?.label ?? "Top segment"} peaks at ${fmt(mv)} in ${columns[mci] ?? "period"} — cross-period spread is ${Math.round(((max - min) / (max || 1)) * 100)}%.`;
  }

  /* Single-value rows — concentration analysis */
  const sorted  = [...values].sort((a, b) => b - a);
  const topN    = Math.min(3, Math.ceil(rows.length / 2));
  const topSum  = sorted.slice(0, topN).reduce((s, v) => s + v, 0);
  const topPct  = total > 0 ? Math.round((topSum / total) * 100) : 0;
  const botRow  = minRow;

  if (rows.length >= 8) {
    return `${maxRow.label} leads at ${fmt(max)}; top ${topN} categories account for ${topPct}% of total — ${topPct > 70 ? "high concentration" : "moderate spread"}.`;
  }
  return `${maxRow.label} (${fmt(max)}) to ${botRow.label} (${fmt(min)}) — top ${topN} hold ${topPct}% of the total.`;
}

/* ── Archetype inference from data shape ─────────────────────────────────── */
export function inferArchetype(rows: DataRow[], columns: string[]): SlideArchetype {
  if (!rows.length) return "Quote";
  if (rows.length === 1) return "Big Number";

  if (rows.length === 2) return "Comparison";

  /* Geographic terms → Chart (Map is now a ChartType, rendered via ChartFill) */
  const geoTerms = /north|south|east|west|\bus\b|\buk\b|\beu\b|asia|europe|america|africa|region|country|market/;
  if (rows.some(r => geoTerms.test(r.label.toLowerCase()))) return "Chart";

  /* Multiple series columns (time series / multi-series) → Chart */
  if (columns.length >= 3) return "Chart";

  /* ≤ 6 rows with one clearly dominant value → Chart (Treemap type) */
  if (rows.length <= 6) {
    const values = rows.map(r => r.values[0]).sort((a, b) => b - a);
    if (values[0] > values[1] * 1.8) return "Chart";
  }

  return "Chart";
}
