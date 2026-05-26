"use client";

import { makePoints, smoothPath } from "@/lib/charts";
import { NAVY } from "../ui/tokens";

/**
 * Thumbnail sparkline used in landing-page project cards. Stateless and tiny;
 * the parent decides the color so a "generating" project can flash gold.
 */
export function MiniSparkline({ data, color = NAVY }: { data: number[]; color?: string }) {
  const W = 80, H = 28;
  const pts = makePoints(data, 0, W, 2, H - 2);
  const pd  = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" width={W} height={H}>
      <path d={pd} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  );
}
