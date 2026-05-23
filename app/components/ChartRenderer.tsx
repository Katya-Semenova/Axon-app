"use client";

import { makePoints, smoothPath, roundTo } from "@/lib/charts";
import type { DataRow, ChartType } from "@/lib/mockData";

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

const SERIES = [NAVY, NAVY_500, GOLD, NAVY_300, GOLD_300, NAVY_100];

const SERIF_FAMILY = "'Instrument Serif', 'GT Sectra', 'Fraunces', Georgia, serif";
const MONO_FAMILY  = "'JetBrains Mono', monospace";
const SANS_FAMILY  = "Inter, sans-serif";

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
          stroke={NAVY} strokeWidth="0.5" strokeOpacity="0.05" />
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
  const xv = (i: number) => pl + (i / Math.max(data.length - 1, 1)) * plotW;
  const yv = (v: number) => pt + plotH - ((v - mn) / range) * plotH;

  const baseline = pt + plotH;
  const lastIdx  = data.length - 1;
  const step     = expanded ? labelStep(data.length, plotW, labels) : Math.max(1, Math.floor(data.length / 4));

  const dotR        = expanded ? 5 : 4;
  const currentDotR = expanded ? 8 : 6;
  const heroSize    = expanded ? 20 : 14;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
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

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
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
function DonutChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 240;
  const H = containerHeight ?? 144;

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
  const n         = rows.length;
  const rowH      = Math.min(28, Math.max(16, (H - 16) / Math.max(n, 1)));
  const fSize     = Math.max(11, Math.min(14, rowH - 3));
  const markerS   = Math.max(8, fSize - 2);
  const startY    = Math.max(8, (H - n * rowH) / 2);
  const valW      = fSize * 2.8;
  const maxChars  = Math.max(5, Math.floor((legendAvailW - markerS - 8 - valW) / (fSize * 0.54)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {slices.map((s, i) => (
        <path key={i} d={arc(s)} fill={s.color} />
      ))}
      <text x={CX} y={CY + 5} textAnchor="middle"
        fontSize={Math.max(16, OR * 0.5)} fontFamily={SERIF_FAMILY} fill={NAVY}>
        {rows.length}
      </text>
      <text x={CX} y={CY + Math.max(16, OR * 0.5) + 10} textAnchor="middle" fontSize="7.5"
        fontFamily={MONO_FAMILY} fill={T3} letterSpacing="0.08em">CHANNELS</text>
      {rows.map((row, i) => {
        const label = row.label.length > maxChars ? row.label.slice(0, maxChars - 1) + "…" : row.label;
        const y = startY + i * rowH;
        return (
          <g key={i} transform={`translate(${legendX}, ${y})`}>
            <rect x="0" y={rowH * 0.1} width={markerS} height={markerS * 0.65} rx="1" fill={SERIES[i % SERIES.length]} />
            <text x={markerS + 5} y={rowH * 0.72} fontSize={fSize} fill={T2} fontFamily={SANS_FAMILY}>
              {label}
            </text>
            <text x={legendAvailW} y={rowH * 0.72} textAnchor="end" fontSize={fSize}
              fill={NAVY} fontFamily={MONO_FAMILY} fontWeight="500">
              {row.values[0]}%
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
function StackedBarChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const pl = 90, pr = 36, pt = 26, rowH = 22, gap = 14;
  const W = containerWidth ?? 280;
  const H = containerHeight ?? (pt + rows.length * (rowH + gap) - gap + 10);
  const plotW = W - pl - pr;

  const maxTotal = Math.max(...rows.map(row => row.values.reduce((s, v) => s + v, 0)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {columns.map((col, i) => (
        <g key={i} transform={`translate(${pl + i * 72}, 12)`}>
          <rect x="0" y="-7" width="10" height="6" rx="1" fill={SERIES[i % SERIES.length]} />
          <text x="14" y="0" fontSize="11" fill={T2} fontFamily={SANS_FAMILY}>{col}</text>
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
            stroke={NAVY} strokeWidth="0.6" strokeDasharray="3 2" strokeOpacity="0.25" />
        );
      })}
      {bars.map((b, i) => {
        const x  = xv(i);
        const y1 = yv(b.end), y2 = yv(b.start);
        const bh = Math.max(2, Math.abs(y2 - y1));
        const isPos = b.delta >= 0;
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
function ScatterPlotChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 280;
  const H = containerHeight ?? (expanded ? 220 : 160);
  const pl = 28, pr = 12, pt = 12, pb = 24;
  const plotW = W - pl - pr, plotH = H - pt - pb;

  const xs = rows.map(row => row.values[0] ?? 0);
  const ys = rows.map(row => row.values[1] ?? 0);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) || 1;
  const yMin = Math.min(...ys), yMax = Math.max(...ys) || 1;

  const xv = (v: number) => r(pl + ((v - xMin) / (xMax - xMin || 1)) * plotW);
  const yv = (v: number) => r(pt + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
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
function TreemapChart({ rows, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth ?? 342;
  const H = containerHeight ?? 162;
  const total  = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
  const leftN  = Math.ceil(sorted.length / 2);
  const leftRows  = sorted.slice(0, leftN);
  const rightRows = sorted.slice(leftN);
  const leftTotal  = leftRows.reduce((s, row)  => s + (row.values[0] ?? 0), 0) || 1;
  const rightTotal = rightRows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 0.001;

  const leftW  = Math.max(60, Math.round(W * (leftTotal / total))) - 1;
  const rightW = W - leftW - 2;

  const fills = [NAVY, NAVY_700, GOLD, NAVY_500, GOLD_300, NAVY_300, NAVY_100];
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
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {cells.map((c, i) => (
        <g key={i}>
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

/* ── Heatmap ──────────────────────────────────────────────
   Horizontal intensity bars — one per data row.

   Layout:
     Left  axis  : row labels (right-aligned)
     Bar area    : background track + intensity-filled bar
     Right label : numeric value after bar end
     Top header  : column[0] name centered over bar area

   Color scale (low → high intensity):
     NAVY_100 → NAVY_300 → NAVY_500 → NAVY (quartiles)
     Max-value row gets GOLD accent instead.                */
function HeatmapChart({ rows, columns, expanded, containerWidth, containerHeight }: ChartProps) {
  const W = containerWidth  ?? (expanded ? 600 : 360);
  const H = containerHeight ?? (expanded ? 320 : 200);

  const n      = rows.length;
  const pl     = 78;   // left margin: row labels
  const pr     = 52;   // right margin: value labels
  const pt     = 28;   // top: column header
  const pb     = 8;
  const plotW  = W - pl - pr;
  const plotH  = H - pt - pb;
  const rowH   = n > 0 ? plotH / n : plotH;
  const barH   = Math.min(rowH * 0.55, 22);
  const barGap = (rowH - barH) / 2;

  const values  = rows.map(row => row.values[0] ?? 0);
  const mx      = Math.max(...values, 1);
  const maxIdx  = values.indexOf(Math.max(...values));
  const maxLbl  = Math.max(5, Math.floor((pl - 10) / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" {...svgAttrs(containerWidth, containerHeight, expanded)}>
      {/* Column header */}
      {columns[0] && (
        <text x={r(pl + plotW / 2)} y={pt - 8}
          textAnchor="middle" fontSize="8.5" letterSpacing="0.06em"
          fill={T3} fontFamily={MONO_FAMILY}>
          {columns[0].toUpperCase()}
        </text>
      )}

      {rows.map((row, ri) => {
        const v         = values[ri];
        const intensity = mx > 0 ? v / mx : 0;
        const barW      = r(plotW * intensity);
        const y         = r(pt + ri * rowH + barGap);
        const bh        = r(barH);
        const isMax     = ri === maxIdx;

        const fill = isMax         ? GOLD
                   : intensity > 0.65 ? NAVY
                   : intensity > 0.35 ? NAVY_500
                   : NAVY_300;

        const lbl = row.label.length > maxLbl
          ? row.label.slice(0, maxLbl - 1) + "…"
          : row.label;

        return (
          <g key={ri}>
            {/* Row label — right-aligned, centred on bar */}
            <text x={pl - 7} y={r(y + barH / 2 + 3.5)}
              textAnchor="end" fontSize="9.5" fill={T2} fontFamily={SANS_FAMILY}>
              {lbl}
            </text>
            {/* Background track */}
            <rect x={pl} y={y} width={plotW} height={bh}
              fill={NAVY} fillOpacity="0.05" />
            {/* Intensity bar */}
            {barW > 0 && (
              <rect x={pl} y={y} width={barW} height={bh}
                fill={fill} fillOpacity={isMax ? 0.9 : 0.78} />
            )}
            {/* Value label — right of bar */}
            <text x={r(pl + barW + 5)} y={r(y + barH / 2 + 3.5)}
              fontSize="9.5" fontFamily={MONO_FAMILY}
              fill={isMax ? GOLD : NAVY_500}
              fontWeight={isMax ? "500" : "400"}>
              {v}
            </text>
          </g>
        );
      })}
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
          fill={T3} fontFamily={MONO_FAMILY}>
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
          fill="none" stroke={BORDER} strokeWidth="1" opacity={0.5} />
      ))}
      {/* Axis spokes */}
      {Array.from({ length: n }, (_, i) => {
        const p = pointAt(i, 1);
        return (
          <line key={i} x1={cx} y1={cy} x2={r(p.x)} y2={r(p.y)}
            stroke={BORDER} strokeWidth="1" opacity={0.45} />
        );
      })}
      {/* Filled data polygon */}
      <polygon points={polygon} fill={NAVY} fillOpacity="0.22"
        stroke={NAVY} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Vertex dots — first one accented gold */}
      {values.map((v, i) => {
        const p = pointAt(i, v / mx);
        return <circle key={i} cx={r(p.x)} cy={r(p.y)} r={i === 0 ? 4 : 3}
          fill={i === 0 ? GOLD : NAVY} />;
      })}
      {/* Outer axis labels */}
      {rows.map((row, i) => {
        const a = axisAngle(i);
        const lx = cx + Math.cos(a) * (radius + 16);
        const ly = cy + Math.sin(a) * (radius + 16);
        const anchor = Math.abs(Math.cos(a)) < 0.35 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text key={i} x={r(lx)} y={r(ly + 3)} textAnchor={anchor}
            fontSize="10" fill={T2} fontFamily={SANS_FAMILY}>
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
  let remainder = 100 - counts.reduce((s, c) => s + c, 0);
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
            fill={fill ?? BORDER}
            fillOpacity={fill ? 1 : 0.4} />
        );
      })}
      {/* Legend right of the grid */}
      {rows.map((row, ri) => {
        const ly = startY + 6 + ri * 18;
        if (ly > startY + gridH) return null;   // hide overflow rows on tiny canvases
        return (
          <g key={ri} transform={`translate(${r(startX + gridW + 16)}, ${r(ly)})`}>
            <circle cx="3" cy="0" r="3.5" fill={SERIES[ri % SERIES.length]} />
            <text x="11" y="3" fontSize="10" fill={T2} fontFamily={SANS_FAMILY}>{row.label}</text>
            <text x="11" y="14" fontSize="9" fill={T3} fontFamily={MONO_FAMILY}>{counts[ri]}%</text>
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
        const lx       = padX + ri * Math.floor((W - padX * 2) / maxCols);
        const ly       = H - legendH + 8;
        const pct      = total > 0 ? Math.round((row.values[0] ?? 0) / total * 100) : 0;
        const maxChars = Math.floor((W - padX * 2) / maxCols / 5.5);
        return (
          <g key={ri}>
            <circle cx={r(lx + dotR)} cy={r(ly + dotR)} r={dotR} fill={SERIES[ri % SERIES.length]} />
            <text x={r(lx + dotR * 2 + 4)} y={r(ly + dotR * 2)}
              fontSize="9" fontFamily={MONO_FAMILY} fill={T2}>
              {row.label.slice(0, maxChars)} {pct}%
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
