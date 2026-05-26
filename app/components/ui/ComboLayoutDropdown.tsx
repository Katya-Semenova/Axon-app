"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ACTIVE_CHART_TYPES } from "@/lib/types";
import type { SlideArchetype } from "@/lib/types";
import type { ChartType } from "@/lib/types";
import { NAVY, T2, T3, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

const mono = "'JetBrains Mono', monospace";

function getLabel(archetype: SlideArchetype, chartType: ChartType): string {
  return archetype === "Chart" ? `Chart › ${chartType}` : archetype;
}

/* ── ComboLayoutDropdown ──────────────────────────────────────────────────
   Chart-type picker used in the Slides mode slide header. Shows the active
   chart type as "Chart › Lollipop". When a non-chart format is active via
   Delivery Settings the trigger is visually muted — clicking still lets the
   user return to chart mode by picking any type.

   Non-chart formats (Big Number, Comparison, etc.) have been moved to
   Delivery Settings → Slide format. This dropdown is chart-types only.  */
export function ComboLayoutDropdown({
  archetype,
  chartType,
  onChangeArchetype,
  onChangeChartType,
}: {
  archetype: SlideArchetype;
  chartType: ChartType;
  onChangeArchetype: (a: SlideArchetype) => void;
  onChangeChartType: (t: ChartType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const isChartMode = archetype === "Chart";

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      setTriggerRect(btnRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  }

  function handleChartType(t: ChartType) {
    onChangeArchetype("Chart");
    onChangeChartType(t);
    setOpen(false);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-[5px] text-[11px] border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
        style={{
          background: SURFACE_RAISE,
          fontFamily: mono,
          color: isChartMode ? T2 : T3,
          opacity: isChartMode ? 1 : 0.65,
        }}
      >
        {/* layout grid icon */}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
          style={{ flexShrink: 0, opacity: 0.45 }}>
          <rect x="0.75" y="0.75" width="3" height="3" rx="0.5" />
          <rect x="5.25" y="0.75" width="3" height="3" rx="0.5" />
          <rect x="0.75" y="5.25" width="3" height="3" rx="0.5" />
          <rect x="5.25" y="5.25" width="3" height="3" rx="0.5" />
        </svg>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {getLabel(archetype, chartType)}
        </span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          style={{ flexShrink: 0 }}>
          <path d="M1.5 3l2.5 2.5L6.5 3" />
        </svg>
      </button>

      {open && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          {triggerRect && (
            <div style={{
              position: "fixed",
              top: triggerRect.bottom + 4,
              right: window.innerWidth - triggerRect.right,
              zIndex: 9999,
              border: `1px solid ${BORDER}`,
              borderRadius: 2,
              padding: "4px 0",
              minWidth: 172,
              background: SURFACE_RAISE,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              maxHeight: "70vh",
              overflowY: "auto",
            }}>
              {ACTIVE_CHART_TYPES.map(type => {
                const isActive = isChartMode && chartType === type;
                return (
                  <button
                    key={type}
                    onClick={(e) => { e.stopPropagation(); handleChartType(type); }}
                    className="w-full text-left"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px",
                      fontFamily: mono, fontSize: 11,
                      color: isActive ? NAVY : T2,
                      fontWeight: isActive ? 500 : 400,
                      background: isActive ? SURFACE_MUTED : "transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = SURFACE_MUTED; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    {isActive && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round"
                        style={{ flexShrink: 0, marginLeft: -14 }}>
                        <path d="M1 4l2 2 4-4" />
                      </svg>
                    )}
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </>,
        document.body,
      )}
    </div>
  );
}
