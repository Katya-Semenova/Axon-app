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

/* Returns SVG children — embed with <g transform="translate(x,y)"><MiniChart .../></g> */
export function MiniChart({ rows, chartType, color, W = 104, H = 34 }: MiniChartProps) {
  switch (chartType) {
    case "Spline Area":  return <MiniSpline rows={rows} color={color} W={W} H={H} />;
    case "Lollipop":     return <MiniLollipop rows={rows} color={color} W={W} H={H} />;
    case "Clean Columns":return <MiniColumns rows={rows} color={color} W={W} H={H} />;
    case "Waterfall":    return <MiniWaterfall rows={rows} color={color} W={W} H={H} />;
    case "Stacked Bar":  return <MiniStacked rows={rows} color={color} W={W} H={H} />;
    case "Donut":        return <MiniDonut rows={rows} color={color} W={W} H={H} />;
    case "Scatter Plot": return <MiniScatter rows={rows} color={color} W={W} H={H} />;
    case "Treemap":      return <MiniTreemap rows={rows} color={color} W={W} H={H} />;
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
