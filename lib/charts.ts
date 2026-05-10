export interface Point { x: number; y: number; }

export function roundTo(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

export function makePoints(
  data: number[],
  x0: number, x1: number,
  y0: number, y1: number,
): Point[] {
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const range = mx - mn || 1;
  return data.map((v, i) => ({
    x: x0 + (i / (data.length - 1)) * (x1 - x0),
    y: y1 - ((v - mn) / range) * (y1 - y0),
  }));
}

/** Smooth cubic-bezier path through points (horizontal tangents). */
export function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return "";
  const r = roundTo;
  let d = `M ${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const dx = (c.x - p.x) * 0.42;
    d += ` C ${r(p.x + dx)} ${r(p.y)} ${r(c.x - dx)} ${r(c.y)} ${r(c.x)} ${r(c.y)}`;
  }
  return d;
}
