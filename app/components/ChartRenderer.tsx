"use client";

import { makePoints, smoothPath, roundTo } from "@/lib/charts";
import type { DataRow, ChartType } from "@/lib/mockData";

const r = roundTo;

/* ── Editorial Density palette — fixed categorical order ── */
const NAVY     = "#1B2840";   /* navy-900 */
const NAVY_700 = "#2A3654";
const NAVY_500 = "#4A5878";
const NAVY_300 = "#8892AA";
const NAVY_100 = "#B8C2D0";
const GOLD     = "#B89548";   /* gold-500 — the ONE accent */
const GOLD_300 = "#C9A961";
const BORDER   = "#D9D3C2";
const T2       = "#5C6478";
const T3       = "#8A8B87";

/* Categorical palette for multi-series charts.
   FIXED ORDER. Do not shuffle. Do not add colors. */
const SERIES = [NAVY, NAVY_500, GOLD, NAVY_300, GOLD_300, NAVY_100];

/* Editorial in-chart fonts */
const SERIF_FAMILY = "'Instrument Serif', 'GT Sectra', 'Fraunces', Georgia, serif";
const MONO_FAMILY  = "'JetBrains Mono', monospace";
const SANS_FAMILY  = "Inter, sans-serif";

interface ChartProps {
  rows: DataRow[];
  columns: string[];
  expanded?: boolean;
}

/* ── SVG sizing helper ──────────────────────────────────────
   Grid cards: w-full h-auto (scales by width, height is natural)
   Expanded:   fills its flex container with meet scaling
────────────────────────────────────────────────────────── */
function svgAttrs(expanded: boolean | undefined) {
  if (expanded) {
    return {
      width:  "100%",
      height: "100%",
      preserveAspectRatio: "xMidYMid meet",
      style: { display: "block" as const },
    };
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
          stroke={NAVY} strokeWidth="0.5" strokeOpacity="0.05" />
      ))}
    </>
  );
}

/* ── Lollipop ─────────────────────────────────────────── */
function LollipopChart({ rows, expanded }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = 360, H = expanded ? 220 : 148;
  /* 15% denser internal padding vs reference */
  const pl = 17, pr = 22, pt = 26, pb = 22;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const xv = (i: number) => pl + (i / Math.max(data.length - 1, 1)) * plotW;
  const yv = (v: number) => pt + plotH - ((v - mn) / range) * plotH;

  const baseline = pt + plotH;
  const lastIdx  = data.length - 1;
  const step     = Math.max(1, Math.floor(data.length / (expanded ? data.length : 4)));

  /* Spec: stems navy-300 1.5px, dots navy-500 r=5, current dot gold-500 r=8,
     serif text-data-lg label above current. */
  const dotR        = expanded ? 5 : 4;
  const currentDotR = expanded ? 8 : 6;
  const heroSize    = expanded ? 20 : 14;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {data.map((v, i) => (
        <line key={i}
          x1={r(xv(i))} y1={r(yv(v) + dotR)} x2={r(xv(i))} y2={r(baseline)}
          stroke={NAVY_300} strokeWidth="1.5" />
      ))}
      {data.map((v, i) => (
        <circle key={i} cx={r(xv(i))} cy={r(yv(v))}
          r={i === lastIdx ? currentDotR : dotR}
          fill={i === lastIdx ? GOLD : NAVY_500} />
      ))}
      {/* Serif hero label above current — "the 930 treatment" */}
      {data.length > 0 && (
        <text x={r(xv(lastIdx))} y={r(yv(data[lastIdx]) - currentDotR - 6)}
          textAnchor="middle" fontSize={heroSize}
          fontFamily={SERIF_FAMILY} fill={GOLD}>
          {data[lastIdx]}
        </text>
      )}
      {labels.map((l, i) => i % step === 0 && (
        <text key={i} x={r(xv(i))} y={H - 6} textAnchor="middle" fontSize="10"
          fill={T3} fontFamily={MONO_FAMILY} fontWeight="500">{l}</text>
      ))}
    </svg>
  );
}

/* ── Spline Area ──────────────────────────────────────── */
function SplineAreaChart({ rows, expanded }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = 360, H = expanded ? 200 : 140;
  const pl = 8, pr = 8, pt = 16, pb = 20;
  const plotH = H - pt - pb;

  const pts   = makePoints(data, pl, W - pr, pt, H - pb);
  const pd    = smoothPath(pts);
  const last  = pts[pts.length - 1];
  const areaD = pts.length > 1
    ? `${pd} L ${r(last.x)} ${H - pb} L ${pl} ${H - pb} Z`
    : "";
  const step = Math.max(1, Math.floor(data.length / (expanded ? data.length : 4)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      <defs>
        <linearGradient id="spline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={NAVY} stopOpacity="0.14" />
          <stop offset="100%" stopColor={NAVY} stopOpacity="0" />
        </linearGradient>
      </defs>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {areaD && <path d={areaD} fill={NAVY_100} fillOpacity="0.4" />}
      {pd    && <path d={pd} stroke={NAVY} strokeWidth="2" strokeLinecap="round" />}
      {last && (
        <>
          <circle cx={r(last.x)} cy={r(last.y)} r={expanded ? 5 : 4} fill={GOLD} />
          {data.length > 0 && (
            <text x={r(last.x)} y={r(last.y - (expanded ? 12 : 9))}
              textAnchor="middle" fontSize={expanded ? 18 : 13}
              fontFamily={SERIF_FAMILY} fill={GOLD}>
              {data[data.length - 1]}
            </text>
          )}
        </>
      )}
      {labels.map((l, i) => i % step === 0 && (
        <text key={i} x={r(pts[i]?.x ?? 0)} y={H - 4} textAnchor="middle" fontSize="10"
          fill={T3} fontFamily={MONO_FAMILY} fontWeight="500">{l}</text>
      ))}
    </svg>
  );
}

/* ── Donut ────────────────────────────────────────────── */
function DonutChart({ rows, expanded }: ChartProps) {
  /* Stroke 40% of radius: OR=60, IR=36 → ring=24 = 40% */
  const CX = 72, CY = 72, OR = 60, IR = 36;
  const total  = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;

  let angle = -90;
  const slices = rows.map((row, i) => {
    const pct   = (row.values[0] ?? 0) / total;
    const start = angle + 1;
    const end   = angle + pct * 360 - 1;
    angle += pct * 360;
    /* Fixed categorical palette — never shuffled */
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

  const legendX = 148;
  return (
    <svg viewBox="0 0 240 144" fill="none" {...svgAttrs(expanded)}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s)} fill={s.color} />
      ))}
      {/* Hero serif center number — text-hero */}
      <text x={CX} y={CY + 4} textAnchor="middle" fontSize={expanded ? 36 : 30}
        fontFamily={SERIF_FAMILY} fill={NAVY}>
        {rows.length}
      </text>
      <text x={CX} y={CY + 19} textAnchor="middle" fontSize="8"
        fontFamily={MONO_FAMILY} fill={T3}
        letterSpacing="0.1em">CHANNELS</text>
      {rows.map((row, i) => (
        <g key={i} transform={`translate(${legendX}, ${14 + i * 30})`}>
          {/* Sharp categorical swatch — no rounded corners */}
          <rect x="0" y="0" width="10" height="3"
            fill={SERIES[i % SERIES.length]} />
          <text x="14" y="4" fontSize="9.5" fill={T2} fontFamily={SANS_FAMILY}>{row.label}</text>
          <text x="14" y="17" fontSize="13"
            fill={SERIES[i % SERIES.length]}
            fontFamily={SERIF_FAMILY}>{row.values[0]}%</text>
        </g>
      ))}
    </svg>
  );
}

/* ── Clean Columns ────────────────────────────────────── */
function CleanColumnsChart({ rows, expanded }: ChartProps) {
  const data   = rows.map(row => row.values[0] ?? 0);
  const labels = rows.map(row => row.label);
  const W = 300, H = expanded ? 200 : 140;
  const pl = 12, pr = 8, pt = 12, pb = 20;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const mx   = Math.max(...data) || 1;
  const n    = data.length;
  const step = plotW / n;
  const barW = Math.max(4, step * 0.65);
  const xv   = (i: number) => pl + step * i + step / 2;
  const yv   = (v: number) => pt + plotH - (v / mx) * plotH;
  const bStep = Math.max(1, Math.floor(n / (expanded ? n : 4)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {data.map((v, i) => {
        const x = xv(i), y = yv(v), bh = pt + plotH - y;
        const isMax = v === Math.max(...data);
        return (
          <g key={i}>
            {/* Square tops per spec — no rx */}
            <rect x={r(x - barW / 2)} y={r(y)} width={r(barW)} height={r(bh)}
              fill={isMax ? GOLD : NAVY_500} />
            {i % bStep === 0 && (
              <text x={r(x)} y={H - 4} textAnchor="middle" fontSize="10"
                fill={T3} fontFamily={MONO_FAMILY} fontWeight="500">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Stacked Horizontal Bar ───────────────────────────── */
function StackedBarChart({ rows, columns, expanded }: ChartProps) {
  const pl = 90, pr = 36, pt = 20, rowH = 22, gap = 14;
  const W = 280;
  const H = pt + rows.length * (rowH + gap) - gap + 10;
  const plotW = W - pl - pr;

  const maxTotal = Math.max(...rows.map(row => row.values.reduce((s, v) => s + v, 0)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      {/* Series legend — fixed categorical palette */}
      {columns.map((col, i) => (
        <g key={i} transform={`translate(${pl + i * 64}, 8)`}>
          <rect x="0" y="-3" width="8" height="3" fill={SERIES[i % SERIES.length]} />
          <text x="12" y="0" fontSize="8.5" fill={T2} fontFamily={SANS_FAMILY}>{col}</text>
        </g>
      ))}
      {rows.map((row, i) => {
        const y = pt + i * (rowH + gap);
        const total = row.values.reduce((s, v) => s + v, 0);
        let xOff = pl;
        return (
          <g key={i}>
            <text x={r(pl - 5)} y={r(y + rowH / 2 + 4)} textAnchor="end" fontSize="9.5"
              fill={T2} fontFamily={SANS_FAMILY}>{row.label}</text>
            {row.values.map((v, j) => {
              const bw = r((v / maxTotal) * plotW);
              /* Square edges per spec — no rx */
              const rect = (
                <rect key={j} x={r(xOff)} y={r(y)} width={bw} height={rowH}
                  fill={SERIES[j % SERIES.length]} />
              );
              xOff += bw + 1;
              return rect;
            })}
            <text x={r(xOff + 4)} y={r(y + rowH / 2 + 4)} fontSize="11"
              fill={NAVY} fontFamily={MONO_FAMILY} fontWeight="500">{total}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Waterfall ────────────────────────────────────────── */
function WaterfallChart({ rows, expanded }: ChartProps) {
  const W = 320, H = expanded ? 200 : 152;
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
  const bStep = Math.max(1, Math.floor(n / (expanded ? n : 4)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      {bars.map((b, i) => {
        if (i === 0) return null;
        const prev = bars[i - 1];
        const connY = r(yv(prev.end));
        return (
          <line key={i}
            x1={r(xv(i - 1) + barW)} y1={connY}
            x2={r(xv(i))} y2={connY}
            stroke={NAVY} strokeWidth="0.6" strokeDasharray="3 2" strokeOpacity="0.25" />
        );
      })}
      {bars.map((b, i) => {
        const x  = xv(i);
        const y1 = yv(b.end), y2 = yv(b.start);
        const bh = Math.max(2, Math.abs(y2 - y1));
        const isPos = b.delta >= 0;
        /* Endpoints navy-900, gains navy-500, losses gold-500 — square edges */
        const color = b.isTot ? NAVY : isPos ? NAVY_500 : GOLD;
        return (
          <g key={i}>
            <rect x={r(x)} y={r(Math.min(y1, y2))} width={r(barW)} height={r(bh)}
              fill={color} />
            {!b.isTot && Math.abs(y2 - y1) > 12 && (
              <text x={r(x + barW / 2)} y={r(Math.min(y1, y2) - 4)} textAnchor="middle" fontSize="9"
                fontFamily={MONO_FAMILY} fill={color} fontWeight="500">
                {b.delta > 0 ? `+${b.delta}` : b.delta}
              </text>
            )}
            {i % bStep === 0 && (
              <text x={r(x + barW / 2)} y={H - 6} textAnchor="middle" fontSize="9"
                fill={T3} fontFamily={MONO_FAMILY} fontWeight="500">
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
function ScatterPlotChart({ rows, columns, expanded }: ChartProps) {
  const W = 280, H = expanded ? 220 : 160;
  const pl = 28, pr = 12, pt = 12, pb = 24;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const xs = rows.map(row => row.values[0] ?? 0);
  const ys = rows.map(row => row.values[1] ?? 0);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) || 1;
  const yMin = Math.min(...ys), yMax = Math.max(...ys) || 1;

  const xv = (v: number) => r(pl + ((v - xMin) / (xMax - xMin || 1)) * plotW);
  const yv = (v: number) => r(pt + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      <GridLines pl={pl} pr={W - pr} pt={pt} plotH={plotH} />
      <line x1={pl} y1={pt} x2={pl} y2={pt + plotH}
        stroke={NAVY} strokeWidth="0.75" strokeOpacity="0.12" />
      <line x1={pl} y1={pt + plotH} x2={W - pr} y2={pt + plotH}
        stroke={NAVY} strokeWidth="0.75" strokeOpacity="0.12" />
      <text x={W / 2} y={H - 4} textAnchor="middle" fontSize="8.5"
        fill={T3} fontFamily="'JetBrains Mono',monospace">{columns[0] ?? "X"}</text>
      <text x="10" y={H / 2} textAnchor="middle" fontSize="8.5"
        fill={T3} fontFamily="'JetBrains Mono',monospace"
        transform={`rotate(-90, 10, ${H / 2})`}>{columns[1] ?? "Y"}</text>
      {rows.map((row, i) => {
        const cx = xv(row.values[0] ?? 0);
        const cy = yv(row.values[1] ?? 0);
        /* Highlight first point gold (current/focus); rest navy ramp */
        const fill = i === 0 ? GOLD : (i % 2 === 0 ? NAVY : NAVY_500);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={i === 0 ? 7 : 5.5} fill={fill} />
            {expanded && (
              <text x={cx + 10} y={cy + 4} fontSize="9.5" fill={T2} fontFamily={SANS_FAMILY}>
                {row.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Treemap ──────────────────────────────────────────── */
function TreemapChart({ rows, expanded }: ChartProps) {
  const W = 342, H = 162;
  const total  = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
  const leftN  = Math.ceil(sorted.length / 2);
  const leftRows  = sorted.slice(0, leftN);
  const rightRows = sorted.slice(leftN);
  const leftTotal  = leftRows.reduce((s, row)  => s + (row.values[0] ?? 0), 0) || 1;
  const rightTotal = rightRows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 0.001;

  const leftW  = Math.max(60, Math.round(W * (leftTotal / total))) - 1;
  const rightW = W - leftW - 2;

  /* Spec: largest navy-900 (white text), second navy-700, third gold-500
     (text-primary navy on gold), then navy ramp continues. */
  const fills = [NAVY, NAVY_700, GOLD, NAVY_500, GOLD_300, NAVY_300, NAVY_100];
  /* Per-cell text contrast: dark fills → on-dark text, gold-300/navy-100 → navy text */
  const textOnDark = ["#F5F2EA", "#F5F2EA", NAVY, "#F5F2EA", NAVY, NAVY, NAVY];

  const cells: { x: number; y: number; w: number; h: number; fill: string; label: string; val: number; tx: string }[] = [];

  let ly = 0;
  leftRows.forEach((row, i) => {
    const h = Math.max(18, Math.round((row.values[0] ?? 0) / leftTotal * H));
    cells.push({ x: 0, y: ly, w: leftW, h, fill: fills[i], tx: textOnDark[i], label: row.label, val: row.values[0] ?? 0 });
    ly += h + 2;
  });
  let ry = 0;
  rightRows.forEach((row, i) => {
    const idx = leftN + i;
    const h = Math.max(18, Math.round((row.values[0] ?? 0) / rightTotal * H));
    cells.push({ x: leftW + 2, y: ry, w: rightW, h, fill: fills[idx], tx: textOnDark[idx], label: row.label, val: row.values[0] ?? 0 });
    ry += h + 2;
  });

  function fmtVal(v: number) {
    return v >= 1 ? `$${v.toFixed(1)}M` : `$${(v * 1000).toFixed(0)}K`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(expanded)}>
      {cells.map((c, i) => (
        <g key={i}>
          {/* Sharp slab cells — no rx */}
          <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={c.fill} />
          {c.h >= 22 && (
            <text x={c.x + 10} y={c.y + (c.h < 40 ? 15 : 20)}
              fontSize={c.w < 80 ? 10 : 12} fontWeight="500"
              fill={c.tx} fontFamily={SANS_FAMILY}>{c.label}</text>
          )}
          {c.h >= 34 && (
            <text x={c.x + 10} y={c.y + (c.h < 48 ? 30 : 38)}
              fontSize={c.w < 80 ? 13 : 16}
              fill={c.tx} fillOpacity="0.78" fontFamily={SERIF_FAMILY}>{fmtVal(c.val)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ── Main dispatcher ──────────────────────────────────── */
export function ChartRenderer({
  rows, columns, chartType, expanded,
}: {
  rows: DataRow[];
  columns: string[];
  chartType: ChartType;
  expanded?: boolean;
}) {
  const props = { rows, columns, expanded };
  switch (chartType) {
    case "Lollipop":      return <LollipopChart {...props} />;
    case "Spline Area":   return <SplineAreaChart {...props} />;
    case "Donut":         return <DonutChart {...props} />;
    case "Clean Columns": return <CleanColumnsChart {...props} />;
    case "Stacked Bar":   return <StackedBarChart {...props} />;
    case "Waterfall":     return <WaterfallChart {...props} />;
    case "Scatter Plot":  return <ScatterPlotChart {...props} />;
    case "Treemap":       return <TreemapChart {...props} />;
    default:              return <SplineAreaChart {...props} />;
  }
}
