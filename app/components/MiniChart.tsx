"use client";

import { makePoints, smoothPath, roundTo } from "@/lib/charts";
import type { DataRow, ChartType } from "@/lib/mockData";

const r = roundTo;

interface MiniChartProps {
  rows: DataRow[];
  chartType: ChartType;
  color: string;
  W?: number;
  H?: number;
}

/* Returns SVG children — embed with <g transform="translate(x,y)"><MiniChart .../></g>
   Round-4: 8 active types — Treemap, Lollipop, Dot Matrix, Scatter, Stacked
   Bar, Heatmap, Radar, Donut. Legacy mappings retained for back-compat. */
export function MiniChart({ rows, chartType, color, W = 104, H = 34 }: MiniChartProps) {
  switch (chartType) {
    /* Active 8 */
    case "Treemap":      return <MiniTreemap rows={rows} color={color} W={W} H={H} />;
    case "Lollipop":     return <MiniLollipop rows={rows} color={color} W={W} H={H} />;
    case "Dot Matrix":   return <MiniDotMatrix rows={rows} color={color} W={W} H={H} />;
    case "Scatter":
    case "Scatter Plot": return <MiniScatter rows={rows} color={color} W={W} H={H} />;
    case "Stacked Bar":  return <MiniStacked rows={rows} color={color} W={W} H={H} />;
    case "Heatmap":      return <MiniHeatmap rows={rows} color={color} W={W} H={H} />;
    case "Radar":        return <MiniRadar rows={rows} color={color} W={W} H={H} />;
    case "Donut":        return <MiniDonut rows={rows} color={color} W={W} H={H} />;
    case "Map":          return <MiniMap rows={rows} color={color} W={W} H={H} />;
    /* Legacy (resolved but never offered in dropdown) */
    case "Spline Area":
    case "Line":
    case "Area":         return <MiniSpline rows={rows} color={color} W={W} H={H} />;
    case "Bar":
    case "Clean Columns":return <MiniColumns rows={rows} color={color} W={W} H={H} />;
    case "Waterfall":    return <MiniWaterfall rows={rows} color={color} W={W} H={H} />;
    default:             return <MiniColumns rows={rows} color={color} W={W} H={H} />;
  }
}

/* ── Spline Area ── */
function MiniSpline({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 10).map(r => r.values[0] ?? 0);
  if (data.length < 2) return null;
  const pts  = makePoints(data, 0, W, 2, H - 1);
  const pd   = smoothPath(pts);
  const last = pts[pts.length - 1];
  const areaD = `${pd} L ${r(last.x)} ${H} L 0 ${H} Z`;
  return (
    <>
      <path d={areaD} fill={color} fillOpacity="0.12" />
      <path d={pd} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx={r(last.x)} cy={r(last.y)} r="2" fill={color} />
    </>
  );
}

/* ── Lollipop ── */
function MiniLollipop({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 10).map(r => r.values[0] ?? 0);
  const mn = Math.min(...data, 0), mx = Math.max(...data) || 1;
  const range = mx - mn;
  const n = data.length;
  const xv = (i: number) => r(((i + 0.5) / n) * W);
  const yv = (v: number) => r(H - 1 - ((v - mn) / range) * (H - 3));
  return (
    <>
      {data.map((v, i) => (
        <g key={i}>
          <line x1={xv(i)} y1={H - 1} x2={xv(i)} y2={yv(v)}
            stroke={color} strokeWidth="1" strokeOpacity="0.55" />
          <circle cx={xv(i)} cy={yv(v)} r="1.8" fill={color} fillOpacity="0.85" />
        </g>
      ))}
    </>
  );
}

/* ── Clean Columns ── */
function MiniColumns({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 12).map(r => r.values[0] ?? 0);
  const mx = Math.max(...data) || 1;
  const n = data.length;
  const step = W / n;
  const barW = Math.max(2, step * 0.65);
  return (
    <>
      {data.map((v, i) => {
        const bh = r((v / mx) * (H - 2));
        return (
          <rect key={i}
            x={r(step * i + step / 2 - barW / 2)}
            y={r(H - 2 - bh)}
            width={r(barW)} height={r(bh)}
            fill={color}
            fillOpacity={v === Math.max(...data) ? 0.9 : 0.35 + (v / mx) * 0.45}
          />
        );
      })}
    </>
  );
}

/* ── Waterfall ── */
function MiniWaterfall({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 8);
  const n = data.length;
  let running = 0;
  const bars = data.map((row, i) => {
    const val = row.values[0] ?? 0;
    const isEnd = i === 0 || i === n - 1;
    if (isEnd) { running = val; return { start: 0, end: val, pos: true }; }
    const s = running; running += val;
    return { start: Math.min(s, running), end: Math.max(s, running), pos: val >= 0 };
  });
  const allV = bars.flatMap(b => [b.start, b.end]);
  const mn = Math.min(...allV, 0), mx = Math.max(...allV) || 1;
  const range = mx - mn;
  const yv = (v: number) => r(H - 2 - ((v - mn) / range) * (H - 3));
  const step = W / n;
  const barW = Math.max(2, step * 0.6);
  return (
    <>
      {bars.map((b, i) => {
        const y1 = yv(b.end), y2 = yv(b.start);
        const bh = Math.max(2, Math.abs(y2 - y1));
        return (
          <rect key={i}
            x={r(step * i + step / 2 - barW / 2)}
            y={r(Math.min(y1, y2))}
            width={r(barW)} height={r(bh)}
            fill={color} fillOpacity={b.pos ? 0.75 : 0.45}
          />
        );
      })}
    </>
  );
}

/* ── Stacked Bar ── */
function MiniStacked({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 6);
  const maxTotal = Math.max(...data.map(r => r.values.reduce((s, v) => s + v, 0))) || 1;
  const rowH = Math.max(3, (H - 2) / data.length - 2);
  return (
    <>
      {data.map((row, i) => {
        const total = row.values.reduce((s, v) => s + v, 0);
        let xOff = 0;
        const y = r(i * (rowH + 2));
        return (
          <g key={i}>
            {row.values.map((v, j) => {
              const bw = r((v / maxTotal) * (W - 2));
              const el = (
                <rect key={j}
                  x={r(xOff)} y={y}
                  width={bw} height={r(rowH)}
                  fill={color} fillOpacity={j === 0 ? 0.85 : 0.45}
                />
              );
              xOff += bw + 1;
              return el;
            })}
          </g>
        );
      })}
    </>
  );
}

/* ── Donut ── */
function MiniDonut({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const cx = W / 2, cy = H / 2;
  const OR = Math.min(cx, cy) - 1, IR = OR * 0.52;
  const total = rows.reduce((s, row) => s + (row.values[0] ?? 0), 0) || 1;
  const opacs = [1, 0.55, 0.8, 0.35, 0.65];

  let angle = -90;
  const slices = rows.map((row, i) => {
    const pct = (row.values[0] ?? 0) / total;
    const start = angle + 0.5;
    const end   = angle + pct * 360 - 0.5;
    angle += pct * 360;
    return { start, end, op: opacs[i % opacs.length] };
  });

  function toRad(deg: number) { return (deg * Math.PI) / 180; }
  function pt(deg: number, rad: number) {
    return { x: r(cx + rad * Math.cos(toRad(deg))), y: r(cy + rad * Math.sin(toRad(deg))) };
  }
  function arc(s: { start: number; end: number }) {
    if (s.end - s.start >= 358) {
      return `M ${cx} ${cy - OR} A ${OR} ${OR} 0 1 1 ${cx - 0.01} ${cy - OR} Z`;
    }
    const large = s.end - s.start > 180 ? 1 : 0;
    const o1 = pt(s.start, OR), o2 = pt(s.end, OR);
    const i1 = pt(s.end, IR),   i2 = pt(s.start, IR);
    return `M ${o1.x} ${o1.y} A ${OR} ${OR} 0 ${large} 1 ${o2.x} ${o2.y} L ${i1.x} ${i1.y} A ${IR} ${IR} 0 ${large} 0 ${i2.x} ${i2.y} Z`;
  }

  return (
    <>
      {slices.map((s, i) => (
        <path key={i} d={arc(s)} fill={color} fillOpacity={s.op} />
      ))}
    </>
  );
}

/* ── Scatter Plot ── */
function MiniScatter({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const xs = rows.map(r => r.values[0] ?? 0);
  const ys = rows.map(r => r.values[1] ?? r.values[0] ?? 0);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) || 1;
  const yMin = Math.min(...ys), yMax = Math.max(...ys) || 1;
  const xv = (v: number) => r(2 + ((v - xMin) / (xMax - xMin || 1)) * (W - 4));
  const yv = (v: number) => r(H - 2 - ((v - yMin) / (yMax - yMin || 1)) * (H - 4));
  return (
    <>
      {rows.map((row, i) => (
        <circle key={i}
          cx={xv(row.values[0] ?? 0)}
          cy={yv(row.values[1] ?? row.values[0] ?? 0)}
          r="2"
          fill={color}
          fillOpacity={0.45 + (i / rows.length) * 0.4}
        />
      ))}
    </>
  );
}

/* ── Treemap ── */
function MiniTreemap({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
  const total  = sorted.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const leftN  = Math.ceil(sorted.length / 2);
  const leftRows  = sorted.slice(0, leftN);
  const rightRows = sorted.slice(leftN);
  const leftTotal  = leftRows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const rightTotal = rightRows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 0.001;
  const leftW  = Math.max(20, Math.round((W - 2) * (leftTotal / total)));
  const rightW = W - leftW - 2;
  const opacs  = [1, 0.65, 0.45, 0.8, 0.35, 0.6];
  const cells: { x: number; y: number; w: number; h: number; op: number }[] = [];
  let ly = 0;
  leftRows.forEach((row, i) => {
    const h = Math.max(4, Math.round((row.values[0] ?? 0) / leftTotal * H));
    cells.push({ x: 0, y: ly, w: leftW, h, op: opacs[i % opacs.length] });
    ly += h + 1;
  });
  let ry = 0;
  rightRows.forEach((row, i) => {
    const h = Math.max(4, Math.round((row.values[0] ?? 0) / rightTotal * H));
    cells.push({ x: leftW + 2, y: ry, w: rightW, h, op: opacs[(leftN + i) % opacs.length] });
    ry += h + 1;
  });
  return (
    <>
      {cells.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={Math.max(2, c.h - 1)}
          fill={color} fillOpacity={c.op} />
      ))}
    </>
  );
}

/* ── Mini Map — proportional dot-grid per region ── */
function MiniMap({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const sorted = [...rows].sort((a, b) => (b.values[0] ?? 0) - (a.values[0] ?? 0));
  const total  = sorted.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const dotR   = 2.0;
  const step   = dotR * 2 + 1.5;
  const cols   = Math.floor(W / step);
  const gRows  = Math.floor(H / step);
  const totalDots = cols * gRows;

  const regionOf: number[] = [];
  let allocated = 0;
  sorted.forEach((row, ri) => {
    const count = ri < sorted.length - 1
      ? Math.max(1, Math.round((row.values[0] ?? 0) / total * totalDots))
      : totalDots - allocated;
    for (let d = 0; d < count && allocated + d < totalDots; d++) regionOf.push(ri);
    allocated += count;
  });

  const opacs = [1, 0.55, 0.72, 0.38, 0.62, 0.45];
  return (
    <>
      {regionOf.slice(0, totalDots).map((ri, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx  = col * step + dotR;
        const cy  = row * step + dotR;
        return <circle key={i} cx={r(cx)} cy={r(cy)} r={dotR} fill={color} fillOpacity={opacs[ri % opacs.length]} />;
      })}
    </>
  );
}

/* ── Mini Heatmap — rows × columns colour grid (1-2 px gutters) ── */
function MiniHeatmap({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const data = rows.slice(0, 5);
  if (data.length === 0) return null;
  const cols = Math.max(1, Math.max(...data.map(d => d.values.length)));
  let mx = 0;
  for (const row of data) for (const v of row.values) mx = Math.max(mx, v);
  mx = mx || 1;
  const cellW = (W - 1) / cols;
  const cellH = (H - 1) / data.length;
  return (
    <>
      {data.map((row, ri) =>
        Array.from({ length: cols }, (_, ci) => {
          const v = row.values[ci] ?? 0;
          const intensity = v / mx;
          return (
            <rect
              key={`${ri}-${ci}`}
              x={r(ci * cellW + 0.5)} y={r(ri * cellH + 0.5)}
              width={r(cellW - 1)} height={r(cellH - 1)}
              fill={color} fillOpacity={0.18 + intensity * 0.75}
            />
          );
        })
      )}
    </>
  );
}

/* ── Mini Radar — axes from center, filled polygon ── */
function MiniRadar({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const n = rows.length;
  if (n < 3) return null;
  const cx = W / 2, cy = H / 2;
  const radius = Math.min(W, H) / 2 - 1.5;
  const values = rows.map(r => r.values[0] ?? 0);
  const mx = Math.max(...values) || 1;
  function pt(i: number, t: number) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(a) * radius * t, y: cy + Math.sin(a) * radius * t };
  }
  const polygon = values
    .map((v, i) => { const p = pt(i, v / mx); return `${r(p.x)},${r(p.y)}`; })
    .join(" ");
  return (
    <>
      <polygon
        points={Array.from({ length: n }, (_, i) => {
          const p = pt(i, 1);
          return `${r(p.x)},${r(p.y)}`;
        }).join(" ")}
        fill="none" stroke={color} strokeOpacity="0.18" strokeWidth="0.6"
      />
      <polygon points={polygon} fill={color} fillOpacity="0.32"
        stroke={color} strokeWidth="0.9" strokeLinejoin="round" />
    </>
  );
}

/* ── Mini Dot Matrix — 10×10 waffle ── */
function MiniDotMatrix({ rows, color, W, H }: { rows: DataRow[]; color: string; W: number; H: number }) {
  const COLS = 10, GRID_ROWS = 10;
  const total = rows.reduce((s, r) => s + (r.values[0] ?? 0), 0) || 1;
  const shares = rows.map(r => ((r.values[0] ?? 0) / total) * 100);
  const counts = shares.map(s => Math.floor(s));
  let remainder = 100 - counts.reduce((s, c) => s + c, 0);
  const fracs = shares.map((s, i) => ({ frac: s - Math.floor(s), idx: i }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder && fracs.length; i++) counts[fracs[i % fracs.length].idx]++;

  /* Single colour passed in — tier the row tones via opacity ramp so the
     mini stays readable even when called with a flat NAVY default. */
  const ramp = [1, 0.65, 0.42, 0.85, 0.32, 0.55];
  const dotOp: (number | null)[] = [];
  rows.forEach((_, ri) => {
    for (let i = 0; i < counts[ri]; i++) dotOp.push(ramp[ri % ramp.length]);
  });
  while (dotOp.length < 100) dotOp.push(null);

  const dotW = Math.min(W / COLS, H / GRID_ROWS);
  const gridW = dotW * COLS;
  const gridH = dotW * GRID_ROWS;
  const sx = (W - gridW) / 2;
  const sy = (H - gridH) / 2;
  const dotR = dotW * 0.30;

  return (
    <>
      {Array.from({ length: 100 }, (_, i) => {
        const col = i % COLS, row = Math.floor(i / COLS);
        const cx = sx + col * dotW + dotW / 2;
        const cy = sy + row * dotW + dotW / 2;
        const op = dotOp[i];
        return (
          <circle key={i} cx={r(cx)} cy={r(cy)} r={r(dotR)}
            fill={op == null ? "#D9D3C2" : color}
            fillOpacity={op == null ? 0.5 : op} />
        );
      })}
    </>
  );
}
