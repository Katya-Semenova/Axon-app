"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CHART_TYPES } from "@/lib/mockData";
import type { ChartType } from "@/lib/types";
import { NAVY, T2, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

export function ChartTypeDropdown({
  value, onChange, mounted = true,
}: {
  value: ChartType;
  onChange: (type: ChartType) => void;
  mounted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      setTriggerRect(btnRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1 text-[11px] text-t2 border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
        style={{ background: SURFACE_RAISE, fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1.5 3l2.5 2.5L6.5 3" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <>
          {/* Backdrop — closes the menu; sits below the list */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          {/* List — portaled to body so canvas overflow:hidden can't clip it */}
          {triggerRect && (
            <div
              style={{
                position: "fixed",
                top: triggerRect.bottom + 4,
                right: window.innerWidth - triggerRect.right,
                zIndex: 9999,
                border: `1px solid ${BORDER}`,
                borderRadius: 2,
                padding: "4px 0",
                minWidth: 152,
                background: SURFACE_RAISE,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
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
                    display: "block",
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
        </>,
        document.body
      )}
    </div>
  );
}

/* Re-export so callers can use a single import path. */
export { BORDER };
