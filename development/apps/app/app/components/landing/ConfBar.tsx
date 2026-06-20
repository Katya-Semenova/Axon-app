"use client";

import { NAVY, BORDER } from "../ui/tokens";

/**
 * Confidence bar — N filled rectangles out of `total`, plus a percentage.
 * Used in the footer of both InsightCard and DataSetCard.
 */
export function ConfBar({ filled, total = 5, pct }: { filled: number; total?: number; pct: number }) {
  return (
    <div className="flex items-center gap-[7px]">
      <span className="text-[10.5px] text-t3">Confidence</span>
      <div className="flex gap-[2px]">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="w-3 h-[3px] rounded-[1px]"
            style={{ background: i < filled ? NAVY : BORDER }} />
        ))}
      </div>
      <span className="font-mono text-[10.5px] text-t2">{pct}%</span>
    </div>
  );
}
