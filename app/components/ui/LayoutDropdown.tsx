"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { SLIDE_ARCHETYPES } from "@/lib/types";
import type { SlideArchetype } from "@/lib/types";
import { NAVY, T2, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

const mono = "'JetBrains Mono', monospace";

export function LayoutDropdown({
  value,
  onChange,
  mounted = true,
}: {
  value: SlideArchetype;
  onChange: (a: SlideArchetype) => void;
  mounted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) setTriggerRect(btnRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1 text-[11px] text-t2 border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
        style={{ background: SURFACE_RAISE, fontFamily: mono }}
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ flexShrink: 0, opacity: 0.5 }}>
          <rect x="0.75" y="0.75" width="3" height="3" rx="0.5" />
          <rect x="5.25" y="0.75" width="3" height="3" rx="0.5" />
          <rect x="0.75" y="5.25" width="3" height="3" rx="0.5" />
          <rect x="5.25" y="5.25" width="3" height="3" rx="0.5" />
        </svg>
        {value}
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1.5 3l2.5 2.5L6.5 3" />
        </svg>
      </button>

      {open && mounted && createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
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
              {SLIDE_ARCHETYPES.map((arch) => (
                <button
                  key={arch}
                  onClick={(e) => { e.stopPropagation(); onChange(arch); setOpen(false); }}
                  className="w-full text-left px-3 py-[6px] text-[11px] transition-colors"
                  style={{
                    fontFamily: mono,
                    color: arch === value ? NAVY : T2,
                    fontWeight: arch === value ? 500 : 400,
                    background: arch === value ? SURFACE_MUTED : "transparent",
                    display: "block",
                  }}
                  onMouseEnter={(e) => {
                    if (arch !== value) e.currentTarget.style.background = SURFACE_MUTED;
                  }}
                  onMouseLeave={(e) => {
                    if (arch !== value) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {arch}
                </button>
              ))}
            </div>
          )}
        </>,
        document.body,
      )}
    </div>
  );
}
