"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { CHART_TYPES } from "@/lib/mockData";
import { SLIDE_ARCHETYPES } from "@/lib/types";
import type { SlideArchetype } from "@/lib/types";
import type { ChartType } from "@/lib/types";
import { NAVY, T2, T3, BORDER, SURFACE_RAISE, SURFACE_MUTED } from "./tokens";

const mono = "'JetBrains Mono', monospace";

function getLabel(archetype: SlideArchetype, chartType: ChartType): string {
  return archetype === "Chart" ? `Chart › ${chartType}` : archetype;
}

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
  const [chartExpanded, setChartExpanded] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!open && btnRef.current) {
      setTriggerRect(btnRef.current.getBoundingClientRect());
      setChartExpanded(archetype === "Chart");
    }
    setOpen(v => !v);
  }

  function handleChartRowClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (archetype !== "Chart") onChangeArchetype("Chart");
    setChartExpanded(v => !v);
  }

  function handleChartType(t: ChartType) {
    onChangeArchetype("Chart");
    onChangeChartType(t);
    setOpen(false);
  }

  function handleArchetype(a: SlideArchetype) {
    onChangeArchetype(a);
    setOpen(false);
  }

  const nonChart = SLIDE_ARCHETYPES.filter(a => a !== "Chart");

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-[5px] text-[11px] border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
        style={{ background: SURFACE_RAISE, fontFamily: mono, color: T2 }}
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

              {/* Chart row — expandable */}
              <button
                onClick={handleChartRowClick}
                className="w-full text-left"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "6px 12px",
                  fontFamily: mono, fontSize: 11,
                  color: archetype === "Chart" ? NAVY : T2,
                  fontWeight: archetype === "Chart" ? 500 : 400,
                  background: archetype === "Chart" && !chartExpanded ? SURFACE_MUTED : "transparent",
                }}
                onMouseEnter={e => { if (!(archetype === "Chart" && !chartExpanded)) e.currentTarget.style.background = SURFACE_MUTED; }}
                onMouseLeave={e => { e.currentTarget.style.background = archetype === "Chart" && !chartExpanded ? SURFACE_MUTED : "transparent"; }}
              >
                <span>Chart</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.4" strokeLinecap="round"
                  style={{ transform: chartExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms", flexShrink: 0 }}>
                  <path d="M2.5 1.5l3 2.5-3 2.5" />
                </svg>
              </button>

              {/* Chart subtypes — inline expansion */}
              {chartExpanded && (
                <div style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, marginBottom: 2 }}>
                  {CHART_TYPES.map(type => {
                    const isActive = archetype === "Chart" && chartType === type;
                    return (
                      <button
                        key={type}
                        onClick={(e) => { e.stopPropagation(); handleChartType(type); }}
                        className="w-full text-left"
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "5px 12px 5px 22px",
                          fontFamily: mono, fontSize: 10.5,
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

              {/* Divider before non-chart archetypes */}
              <div style={{ borderTop: `1px solid ${BORDER}`, margin: "2px 0" }} />

              {/* Non-chart archetypes */}
              {nonChart.map(arch => {
                const isActive = archetype === arch;
                return (
                  <button
                    key={arch}
                    onClick={(e) => { e.stopPropagation(); handleArchetype(arch); }}
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
                    {arch}
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
