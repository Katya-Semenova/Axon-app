"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CHART_TYPES } from "@/lib/mockData";
import type { ChartType } from "@/lib/types";
import { NAVY, T2, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

/**
 * Compact chart-type selector used in card headers and in the slide
 * editor's slide header. Portals its backdrop to `document.body` so an
 * ancestor CSS transform (canvas pan/zoom) can't trap clicks behind it.
 */
export function ChartTypeDropdown({
  value, onChange, mounted = true,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
  /** Disable the portal during SSR / before client mount. */
  mounted?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-[6]">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 text-[11px] text-t2 border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
        style={{ background: SURFACE_RAISE, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1.5 3l2.5 2.5L6.5 3" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setOpen(false)} />,
        document.body
      )}

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-[7] border border-border rounded-sm py-1 min-w-[152px]"
          style={{ background: SURFACE_RAISE }}
        >
          {CHART_TYPES.map((type) => (
            <button
              key={type}
              onClick={(e) => { e.stopPropagation(); onChange(type); setOpen(false); }}
              className="w-full text-left px-3 py-[6px] text-[11px] transition-colors"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                color: type === value ? NAVY : T2,
                fontWeight: type === value ? 500 : 400,
                background: type === value ? SURFACE_MUTED : "transparent",
              }}
              onMouseEnter={(e) => {
                if (type !== value) e.currentTarget.style.background = SURFACE_MUTED;
              }}
              onMouseLeave={(e) => {
                if (type !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* Re-export so callers can use a single import path. */
export { BORDER };
