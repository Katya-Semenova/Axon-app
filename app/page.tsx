"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { makePoints, smoothPath, roundTo } from "@/lib/charts";
import {
  INITIAL_CARDS, CHART_TYPES,
  defaultDataForType,
  type CardState, type DataRow, type ChartType,
} from "@/lib/mockData";
import { ChartRenderer } from "@/app/components/ChartRenderer";
import { ExpandedView } from "@/app/components/ExpandedView";
import { PresentationStrip } from "@/app/components/Presentation";
import type { SlideState } from "@/app/components/Presentation";

const r = roundTo;

/* ── Colors — Editorial Density palette ──────────────── */
const NAVY     = "#1B2840";  /* navy-900 — primary structural */
const GOLD     = "#B89548";  /* gold-500 — sole accent (current/active/focus) */
const BORDER   = "#D9D3C2";  /* border-subtle */
const T2       = "#5C6478";  /* text-secondary */
const T3       = "#8A8B87";  /* text-tertiary */
const SURFACE  = "#F5F2EA";  /* card / nav warm surface (NOT white) */
const SURFACE_RAISE = "#FBF9F3";
const SURFACE_MUTED = "#E5E0D2";
const NAVY_300 = "#8892AA";  /* muted navy — edge / connection lines */

const CARD_W     = 240;
const HERO_W     = 360;              /* Hero Insight — 1.5× standard card width */
const CARD_H_EST = 254;             /* estimated card height for initial layout */
const COL_GAP    = 14;
const HERO_ID    = INITIAL_CARDS[0].id;  /* first card is the primary Hero Insight */

const INITIAL_NODE_POSITIONS: Record<string, { x: number; y: number }> = (() => {
  const p: Record<string, { x: number; y: number }> = {};
  INITIAL_CARDS.forEach((card, i) => {
    p[card.id] = { x: 28 + (i % 4) * (CARD_W + COL_GAP), y: 28 + Math.floor(i / 4) * (CARD_H_EST + 24) };
  });
  const sk = INITIAL_CARDS.length;
  p["skeleton-0"]    = { x: 28 + (sk % 4)     * (CARD_W + COL_GAP), y: 28 + Math.floor(sk / 4)     * (CARD_H_EST + 24) };
  p["placeholder-0"] = { x: 28 + ((sk+1) % 4) * (CARD_W + COL_GAP), y: 28 + Math.floor((sk+1) / 4) * (CARD_H_EST + 24) };
  return p;
})();

/* ══════════════════════════════════════════════════════
   LANDING PAGE DATA
══════════════════════════════════════════════════════ */
type ProjectStatus = "ready" | "generating" | "draft";
interface Project {
  name: string; file: string; time: string;
  status: ProjectStatus; data: number[];
}

const PROJECTS: Project[] = [
  { name:"Q3 Revenue Review",          file:"stripe_prod.sql",   time:"2 hours ago",  status:"ready",      data:[820,870,920,890,780,810,760,820,870,900,940,910] },
  { name:"Churn Cohort Analysis",       file:"analytics_dw.sql",  time:"Yesterday",    status:"ready",      data:[340,360,310,290,270,250,280,310,330,290,260,240] },
  { name:"Pricing Experiment Readout",  file:"experiments.sql",   time:"3 days ago",   status:"draft",      data:[500,510,520,540,558,572,580,595,610,625,640,658] },
  { name:"User Activation Funnel",      file:"events_log.db",     time:"4 days ago",   status:"generating", data:[900,920,880,860,910,940,900,870,850,880,920,950] },
  { name:"Subscription Forecast 2026",  file:"subscriptions.sql", time:"1 week ago",   status:"ready",      data:[1200,1240,1280,1310,1290,1340,1380,1420,1400,1460,1510,1560] },
  { name:"Marketing Attribution Q4",    file:"marketing_q4.sql",  time:"2 weeks ago",  status:"draft",      data:[200,220,210,240,260,250,270,290,280,310,320,340] },
];

/* ══════════════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════════════ */

function MiniSparkline({ data, color = NAVY }: { data: number[]; color?: string }) {
  const W = 80, H = 28;
  const pts = makePoints(data, 0, W, 2, H - 2);
  const pd  = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} fill="none" width={W} height={H}>
      <path d={pd} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55" />
    </svg>
  );
}

function ConfBar({ filled, total = 5, pct }: { filled: number; total?: number; pct: number }) {
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

/* Status indicators — palette compliant, no red/green/yellow.
   Distinguishable via warm-palette tone-on-tone. */
const STATUS_MAP: Record<ProjectStatus, { dotCls: string; label: string }> = {
  ready:      { dotCls: "bg-[#1B2840]", label: "ready"      },  /* navy-900 — confirmed */
  generating: { dotCls: "bg-[#B89548]", label: "generating" },  /* gold-500 — in-flight */
  draft:      { dotCls: "bg-[#8A8B87]", label: "draft"      },  /* tertiary — quiet */
};

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const s = STATUS_MAP[project.status];
  const sparkColor = project.status === "generating" ? GOLD : NAVY;
  return (
    <div onClick={onClick}
      className="bg-card border border-border rounded-none p-7 cursor-pointer transition-colors duration-200 hover:border-[rgba(27,40,64,0.25)]">
      <div className="flex items-start justify-between mb-5">
        <div className="text-[15px] font-medium text-t1 leading-[1.4] max-w-[70%]">{project.name}</div>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-t2">
          <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${s.dotCls}`} />
          {s.label}
        </span>
      </div>
      <div className="mb-4">
        <MiniSparkline data={project.data} color={sparkColor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-t3">{project.file}</span>
        <span className="font-mono text-[10.5px] text-t3">{project.time}</span>
      </div>
    </div>
  );
}

/* ── Insight card ───────────────────────────────────── */
interface InsightCardProps {
  card: CardState;
  isDraggingNode?: boolean;
  isHero?: boolean;
  onExpand: () => void;
  onChartTypeChange: (type: ChartType) => void;
  onOutputPortDown: (e: React.MouseEvent) => void;
  onInputPortUp: (e: React.MouseEvent) => void;
  isConnecting: boolean;
  onPresentationDragStart?: () => void;
  onPresentationDragEnd?: () => void;
}

function InsightCard({ card, isDraggingNode, isHero, onExpand, onChartTypeChange,
  onOutputPortDown, onInputPortUp, isConnecting,
  onPresentationDragStart, onPresentationDragEnd }: InsightCardProps) {
  const [ddOpen, setDdOpen] = useState(false);
  const padded = String(card.serial).padStart(2, "0");

  return (
    <div
      className="group relative rounded-none p-[14px] transition-colors duration-200"
      data-is-card=""
      style={{
        background: SURFACE_RAISE,
        cursor: isDraggingNode ? "grabbing" : "grab",
        opacity: isDraggingNode ? 0.45 : 1,
        transition: "opacity 150ms ease, box-shadow 150ms ease",
        border: isHero ? "1.5px solid rgba(184,149,72,0.5)" : `1px solid ${BORDER}`,
        boxShadow: isHero
          ? "inset 0 2px 0 rgba(184,149,72,0.28), 0 0 0 3px rgba(184,149,72,0.07)"
          : "none",
      }}
    >
      {/* Dropdown backdrop — portaled to body so CSS transforms on ancestor don't trap it */}
      {ddOpen && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 5 }} onClick={() => setDdOpen(false)} />,
        document.body
      )}

      {/* Left input port — always visible, accepts dropped connections */}
      <div
        data-port="input"
        title="Input"
        className="absolute top-1/2"
        style={{ left: -5, width: 10, height: 10, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)", cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease" }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onMouseUp={(e) => { if (isConnecting) { e.stopPropagation(); onInputPortUp(e); } }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          const targeting = isConnecting;
          e.currentTarget.style.transform = `translateY(-50%) scale(${targeting ? 1.5 : 1.22})`;
          e.currentTarget.style.background = targeting ? GOLD : NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = targeting
            ? "0 0 0 3px rgba(184,149,72,0.24)"
            : "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Right output port — always visible, initiates connections */}
      <div
        data-port="output"
        title="Output"
        className="absolute top-1/2"
        style={{ right: -5, width: 10, height: 10, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)", cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease" }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onOutputPortDown(e); }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.22)";
          e.currentTarget.style.background = NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-[6px]">
          {/* Grip handle — HTML5 DnD only, isolated from canvas node drag */}
          <div
            data-drag-handle="true"
            draggable
            title="Drag to presentation"
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/plain", card.id);
              e.dataTransfer.effectAllowed = "copy";
              onPresentationDragStart?.();
            }}
            onDragEnd={(e) => { e.stopPropagation(); onPresentationDragEnd?.(); }}
            style={{ cursor: "grab", color: T3, lineHeight: 0, padding: "2px 1px", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = NAVY; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T3; }}
          >
            <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
              <circle cx="2" cy="2"  r="1.2" /><circle cx="6" cy="2"  r="1.2" />
              <circle cx="2" cy="6"  r="1.2" /><circle cx="6" cy="6"  r="1.2" />
              <circle cx="2" cy="10" r="1.2" /><circle cx="6" cy="10" r="1.2" />
            </svg>
          </div>
          <span className="font-mono text-[11px] text-t3 tracking-[0.08em]">{padded} /</span>
          {isHero && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              letterSpacing: "0.1em", color: GOLD,
              background: "rgba(184,149,72,0.1)", border: "1px solid rgba(184,149,72,0.25)",
              padding: "1px 5px", borderRadius: 2,
            }}>HERO</span>
          )}
        </div>
        <div className="relative z-[6]">
          <button
            onClick={(e) => { e.stopPropagation(); setDdOpen(!ddOpen); }}
            className="flex items-center gap-1 text-[11px] text-t2 border border-border rounded-sm px-[8px] py-[3px] hover:border-[rgba(27,40,64,0.3)] transition-colors duration-200"
            style={{ background: SURFACE_RAISE }}
          >
            {card.chartType}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1.5 3l2.5 2.5L6.5 3" />
            </svg>
          </button>
          {ddOpen && (
            <div className="absolute right-0 top-full mt-1 z-[7] border border-border rounded-sm py-1 min-w-[152px]" style={{ background: SURFACE_RAISE }}>
              {CHART_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={(e) => { e.stopPropagation(); onChartTypeChange(type); setDdOpen(false); }}
                  className="w-full text-left px-3 py-[6px] text-[11px] transition-colors"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    color: type === card.chartType ? NAVY : T2,
                    fontWeight: type === card.chartType ? 500 : 400,
                    background: type === card.chartType ? SURFACE_MUTED : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (type !== card.chartType) e.currentTarget.style.background = SURFACE_MUTED;
                  }}
                  onMouseLeave={(e) => {
                    if (type !== card.chartType) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="text-[12px] font-medium text-t1 leading-[1.4] mb-2">{card.headline}</div>

      {/* Chart — driven by live data */}
      <div className="w-full mb-2 flex items-center justify-center overflow-hidden">
        <ChartRenderer rows={card.rows} columns={card.columns} chartType={card.chartType} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <ConfBar filled={card.confFilled} pct={card.confPct} />
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-[26px] h-[26px] shrink-0 rounded-sm border flex items-center justify-center transition-all duration-200"
          title="Expand"
          style={{ color: T3, borderColor: BORDER }}
          onMouseEnter={e => {
            e.currentTarget.style.color = GOLD;
            e.currentTarget.style.borderColor = GOLD;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = T3;
            e.currentTarget.style.borderColor = BORDER;
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 1h3v3M1 7v3h3M10 1L6 5M1 10l4-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="group relative border border-border rounded-none p-[14px]" style={{ background: SURFACE_RAISE }}>
      {/* Left input port — always visible */}
      <div
        data-port="input"
        className="absolute top-1/2"
        style={{ left: -5, width: 10, height: 10, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)", cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease" }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.22)";
          e.currentTarget.style.background = NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {/* Right output port — always visible */}
      <div
        data-port="output"
        className="absolute top-1/2"
        style={{ right: -5, width: 10, height: 10, transform: "translateY(-50%)", zIndex: 10,
          borderRadius: "50%", background: BORDER, border: "1.5px solid rgba(27,40,64,0.18)", cursor: "crosshair",
          transition: "background 120ms ease, box-shadow 120ms ease, transform 120ms ease" }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-50%) scale(1.22)";
          e.currentTarget.style.background = NAVY;
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.boxShadow = "0 0 0 2.5px rgba(27,40,64,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.background = BORDER;
          e.currentTarget.style.borderColor = "rgba(27,40,64,0.18)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <div className="flex items-start justify-between mb-[10px]">
        <div className="shimmer w-8 h-[10px] rounded-sm" />
        <div className="shimmer w-16 h-[22px] rounded-sm" />
      </div>
      <div className="shimmer w-3/4 h-[12px] rounded-sm mb-2" />
      <div className="shimmer w-1/2 h-[12px] rounded-sm mb-3" />
      <div className="shimmer w-full h-[80px] rounded-sm" />
      <div className="flex items-center justify-between mt-4">
        <div className="shimmer w-28 h-[10px] rounded-sm" />
        <div className="shimmer w-[26px] h-[26px] rounded-sm" />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <div className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-[5px] h-[5px] rounded-full bg-t3 animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <span className="font-mono text-[11px] text-t3">Generating…</span>
      </div>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="border-[1.5px] border-dashed border-border rounded-none flex items-center justify-center min-h-[140px] cursor-pointer hover:border-[#B89548] transition-all duration-200" data-is-card="">
      <div className="flex flex-col items-center gap-2 text-t3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
          <path d="M9 3v12M3 9h12" />
        </svg>
        <span className="font-mono text-[10.5px]">Add insight</span>
      </div>
    </div>
  );
}

function ChatTextarea({ placeholder }: { placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const expand = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };
  return (
    <textarea ref={ref} onInput={expand} rows={1} placeholder={placeholder}
      className="flex-1 border border-border rounded-sm px-3 py-2 text-[13.5px] font-sans text-t1 resize-none outline-none transition-colors duration-200 placeholder:text-t3 min-h-[38px] max-h-[120px] leading-relaxed"
      style={{ background: SURFACE_MUTED }} />
  );
}

function ChatRail() {
  return (
    <>
      <div className="px-5 pb-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-4">AI Agent Chat</div>
        <div className="flex flex-wrap gap-[6px] mb-5">
          {["stripe_prod.sql", "analytics_dw.sql", "events_log.db"].map((f) => (
            <span key={f} className="flex items-center gap-[5px] font-mono text-[10.5px] text-t2 rounded-sm px-[10px] py-1" style={{ background: SURFACE_MUTED }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M7.5 1H3a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V4.5L7.5 1zM7 1v3.5H10" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 thin-scroll">
        <div className="text-[13.5px] text-t2 leading-[1.55]">
          <strong className="text-t1 font-medium">Axon</strong>
          {" "}— I've parsed 3 files containing 47 tables and 218K rows. Strong signals in revenue, retention, and conversion. Where should I focus?
        </div>
        <div className="self-end rounded-pill px-[16px] py-[10px] text-[13.5px] leading-[1.5] max-w-[88%]"
          style={{ background: NAVY, color: "#F5F2EA" }}>
          Focus on revenue, conversion, and churn. Show me what's broken and what's working.
        </div>
        <div className="text-[13.5px] text-t2 leading-[1.55]">
          <strong className="text-t1 font-medium">Axon</strong>
          {" "}— Revenue took an 18% hit in Q3, driven by mid-market churn. Conversion sits at 3.2% vs a 5% goal. Surfacing the highest-signal cards now.
        </div>
        <div className="flex items-center gap-2 text-[13px] text-t3">
          <div className="flex gap-[3px] items-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-[5px] h-[5px] rounded-full bg-t3 animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          Generating insights…
        </div>
      </div>
      <div className="px-5 py-4 border-t border-border flex gap-[10px] items-end shrink-0">
        <ChatTextarea placeholder="Ask anything about your data…" />
        <button className="w-[34px] h-[34px] rounded-pill flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
          style={{ background: NAVY, color: "#F5F2EA" }} aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v12M1 7l6-6 6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE 1 — LANDING
══════════════════════════════════════════════════════ */
function Page1({ onNavigate }: { onNavigate: () => void }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="min-h-screen bg-bg animate-fade-in">
      <nav className="sticky top-0 z-20 bg-bg border-b border-border flex items-center justify-between px-12 py-5 max-sm:px-4 max-sm:py-[14px]">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
        <div className="flex items-center gap-9">
          <ul className="flex list-none gap-8 max-sm:hidden">
            <li><a href="#" className="text-[13.5px] text-t2 hover:text-t1 transition-colors duration-200">Projects</a></li>
            <li><a href="#" className="text-[13.5px] text-t2 hover:text-t1 transition-colors duration-200">Docs</a></li>
          </ul>
          <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center font-mono text-[11px] font-medium text-t2 cursor-pointer select-none">KS</div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto">
        <div className="text-center max-w-[640px] mx-auto px-12 pt-[88px] pb-[56px] max-md:px-6 max-md:pt-16 max-md:pb-10 max-sm:px-4 max-sm:pt-12 max-sm:pb-9">
          <h1 className="font-serif text-[clamp(40px,5.8vw,68px)] leading-[1.07] tracking-[-0.015em] text-t1 mb-5">
            Your data,<br /><em>in plain English.</em>
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed max-w-[380px] mx-auto">
            Drop any data file and get a canvas of editorial insight cards — ready to curate and present.
          </p>
        </div>

        <div
          className={`mx-12 mb-[80px] border-[1.5px] border-dashed rounded-none py-[56px] px-12 text-center cursor-pointer transition-colors duration-200 relative max-md:mx-6 max-md:mb-16 max-sm:mx-4 max-sm:mb-12 max-sm:py-9 max-sm:px-6
            ${dragOver ? "border-[#B89548] bg-[rgba(184,149,72,0.05)]" : "border-[#D9D3C2] hover:border-[#B89548] hover:bg-[rgba(184,149,72,0.04)]"}`}
          onClick={onNavigate}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onNavigate(); }}
        >
          <svg className="w-10 h-10 mx-auto mb-4 text-t3" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 26V14M20 14l-5 5M20 14l5 5" />
            <path d="M8 28c-3.31 0-6-2.69-6-6 0-3.03 2.25-5.53 5.19-5.94C8.05 13.06 11.18 11 15 11c3.5 0 6.58 1.75 8.43 4.43C25.5 15.17 27.67 15 30 15c4.42 0 8 3.58 8 8 0 2.76-2.24 5-5 5H8z" />
          </svg>
          <p className="text-[15px] font-medium text-t1 mb-1.5">Drop a file or click to upload</p>
          <p className="font-mono text-[11.5px] text-t3">Supports .sql · .csv · .xlsx · .txt · .png · .jpg — up to 50 MB</p>
        </div>

        <div className="px-12 pb-[96px] max-md:px-6 max-md:pb-[72px] max-sm:px-4 max-sm:pb-[60px]">
          <div className="flex items-center justify-between mb-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-t3">Recent Projects</span>
            <a href="#" className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">View all</a>
          </div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            {PROJECTS.map((p, i) => (
              <ProjectCard key={i} project={p} onClick={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE 2 — WORKSPACE
══════════════════════════════════════════════════════ */
function Page2({ onBack }: { onBack: () => void }) {
  /* ── History-based undo/redo ── */
  const [history, setHistory] = useState<CardState[][]>([INITIAL_CARDS]);
  const [histIdx, setHistIdx] = useState(0);
  const cards = history[histIdx];

  const canUndo = histIdx > 0;
  const canRedo = histIdx < history.length - 1;

  function pushCards(next: CardState[]) {
    const newHist = history.slice(0, histIdx + 1).concat([next]);
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
  }

  function undo() { if (canUndo) setHistIdx((i) => i - 1); }
  function redo() { if (canRedo) setHistIdx((i) => i + 1); }

  /* ── Expanded card ── */
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedCard = expandedId ? cards.find((c) => c.id === expandedId) ?? null : null;

  /* ── Presentation slides ── */
  const SLIDE_DEFAULTS = {
    visualStyle: "Modern" as const,
    colorAccent: "Navy" as const,
    showLabels:  true,
    showGrid:    true,
    stackedBars: false,
    aggregation: "Monthly" as const,
    colorBy:     "Segment",
    status:      "Paid",
  };

  const [slides, setSlides] = useState<SlideState[]>(() =>
    ["lollipop", "stacked", "spline"].flatMap(cardId => {
      const card = INITIAL_CARDS.find(c => c.id === cardId);
      return card ? [{ ...SLIDE_DEFAULTS, cardId, chartType: card.chartType }] : [];
    })
  );
  const [drawerOpen, setDrawer] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);

  /* ── Canvas pan / zoom ── */
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning]             = useState(false);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  /* ── Connections ── */
  type ConnState = { fromId: string; startX: number; startY: number; mouseX: number; mouseY: number };
  const [connections, setConnections] = useState<Array<{ id: string; fromId: string; toId: string }>>([]);
  const [activeConn, setActiveConn]   = useState<ConnState | null>(null);
  const activeConnRef                 = useRef<ConnState | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const worldRef = useRef<HTMLDivElement>(null);

  /* ── Free-form node positions ── */
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => ({ ...INITIAL_NODE_POSITIONS }));
  const [draggingNode, setDraggingNode]   = useState<string | null>(null);
  const dragNodeRef = useRef<{ id: string; startMouseX: number; startMouseY: number; startNodeX: number; startNodeY: number } | null>(null);
  const cardHeightRef = useRef<Map<string, number>>(new Map());

  /* ── Handlers ── */
  function updateCardRows(id: string, rows: DataRow[]) {
    pushCards(cards.map((c) => (c.id === id ? { ...c, rows } : c)));
  }

  function changeCardType(id: string, type: ChartType) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    let { columns, rows } = card;

    if (type === "Scatter Plot" && rows[0]?.values.length < 2) {
      const d = defaultDataForType("Scatter Plot");
      columns = d.columns; rows = d.rows;
    } else if (type === "Stacked Bar" && rows[0]?.values.length < 2) {
      const d = defaultDataForType("Stacked Bar");
      columns = d.columns; rows = d.rows;
    } else if (type === "Waterfall" && card.chartType !== "Waterfall") {
      const d = defaultDataForType("Waterfall");
      columns = d.columns; rows = d.rows;
    } else if (type !== "Scatter Plot" && type !== "Stacked Bar" && rows[0]?.values.length > 1) {
      columns = [columns[0]];
      rows = rows.map((row) => ({ ...row, values: [row.values[0]] }));
    }

    pushCards(cards.map((c) =>
      c.id === id ? { ...c, chartType: type, columns, rows } : c
    ));
  }

  function addSlide(cardId: string) {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    setSlides(prev =>
      prev.some(s => s.cardId === cardId)
        ? prev
        : [...prev, {
            cardId, chartType: card.chartType,
            visualStyle: "Modern" as const, colorAccent: "Navy" as const,
            showLabels: true, showGrid: true, stackedBars: false,
            aggregation: "Monthly" as const, colorBy: "Segment", status: "Paid",
          }]
    );
  }

  function handleCardDrop(fromTransfer: string) {
    const cardId = draggingRef.current ?? fromTransfer ?? null;
    if (cardId) addSlide(cardId);
  }

  function removeSlide(cardId: string) {
    setSlides(prev => prev.filter(s => s.cardId !== cardId));
  }

  function updateSlide(cardId: string, update: Partial<SlideState>) {
    setSlides(prev => prev.map(s => s.cardId === cardId ? { ...s, ...update } : s));
  }

  /* ── Connection helpers ── */
  function getPortPosFromState(cardId: string, side: "left" | "right"): { x: number; y: number } | null {
    const pos = nodePositions[cardId];
    if (!pos) return null;
    const h = cardHeightRef.current.get(cardId) ?? CARD_H_EST;
    return {
      x: side === "left" ? pos.x : pos.x + CARD_W,
      y: pos.y + h / 2,
    };
  }

  function makeBezier(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
    return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)} ${r(x2 - dx)} ${r(y2)} ${r(x2)} ${r(y2)}`;
  }

  function handleOutputPortDown(cardId: string, e: React.MouseEvent) {
    const from = getPortPosFromState(cardId, "right");
    if (!from) return;
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const vRect = viewport.getBoundingClientRect();
    const { x: tx, y: ty, zoom } = canvasTransform;
    const conn: ConnState = {
      fromId: cardId,
      startX: from.x,
      startY: from.y,
      mouseX: (e.clientX - vRect.left - tx) / zoom,
      mouseY: (e.clientY - vRect.top - ty) / zoom,
    };
    activeConnRef.current = conn;
    setActiveConn(conn);
  }

  function handleInputPortUp(toId: string, e: React.MouseEvent) {
    const conn = activeConnRef.current;
    if (!conn || conn.fromId === toId) { activeConnRef.current = null; setActiveConn(null); return; }
    const connId = `${conn.fromId}->${toId}`;
    setConnections(prev => prev.some(c => c.id === connId) ? prev : [...prev, { id: connId, fromId: conn.fromId, toId }]);
    activeConnRef.current = null;
    setActiveConn(null);
  }

  /* ── Node drag ── */
  function handleNodeMouseDown(cardId: string, e: React.MouseEvent) {
    if ((e.target as Element).closest("[data-port], button, input, select, textarea, a")) return;
    e.stopPropagation();
    const pos = nodePositions[cardId];
    if (!pos) return;
    dragNodeRef.current = {
      id: cardId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: pos.x,
      startNodeY: pos.y,
    };
    setDraggingNode(cardId);
  }

  /* ── Canvas pan handlers ── */
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const isInteractive = (e.target as Element).closest("button, input, select, textarea, a, [data-is-card]");
    if (e.button === 0 && isInteractive) return;
    if (e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) e.preventDefault();
    panStateRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      originX: canvasTransform.x, originY: canvasTransform.y,
    };
    setIsPanning(true);
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (panStateRef.current.active) {
      setCanvasTransform(prev => ({
        ...prev,
        x: panStateRef.current.originX + (e.clientX - panStateRef.current.startX),
        y: panStateRef.current.originY + (e.clientY - panStateRef.current.startY),
      }));
    }
    if (dragNodeRef.current) {
      const { id, startMouseX, startMouseY, startNodeX, startNodeY } = dragNodeRef.current;
      const dx = (e.clientX - startMouseX) / canvasTransform.zoom;
      const dy = (e.clientY - startMouseY) / canvasTransform.zoom;
      setNodePositions(prev => ({ ...prev, [id]: { x: startNodeX + dx, y: startNodeY + dy } }));
    }
    if (activeConnRef.current) {
      const viewport = canvasViewportRef.current;
      if (!viewport) return;
      const vRect = viewport.getBoundingClientRect();
      const { x: tx, y: ty, zoom } = canvasTransform;
      const updated: ConnState = {
        ...activeConnRef.current,
        mouseX: (e.clientX - vRect.left - tx) / zoom,
        mouseY: (e.clientY - vRect.top - ty) / zoom,
      };
      activeConnRef.current = updated;
      setActiveConn(updated);
    }
  }

  function handleCanvasMouseUp() {
    panStateRef.current.active = false;
    setIsPanning(false);
    dragNodeRef.current = null;
    setDraggingNode(null);
    if (activeConnRef.current) { activeConnRef.current = null; setActiveConn(null); }
  }

  /* Non-passive wheel listener for zoom-to-cursor — re-attaches when expanded view mounts/unmounts */
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setCanvasTransform(prev => {
        const newZoom = Math.min(2.5, Math.max(0.2, prev.zoom * factor));
        const wx = (cx - prev.x) / prev.zoom;
        const wy = (cy - prev.y) / prev.zoom;
        return { zoom: newZoom, x: cx - wx * newZoom, y: cy - wy * newZoom };
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [expandedId]); /* re-run when viewport mounts / unmounts */

  /* Zoom-to-viewport-center helper for HUD buttons */
  function zoomBy(factor: number) {
    const el = canvasViewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    setCanvasTransform(prev => {
      const newZoom = Math.min(2.5, Math.max(0.2, prev.zoom * factor));
      const wx = (cx - prev.x) / prev.zoom;
      const wy = (cy - prev.y) / prev.zoom;
      return { zoom: newZoom, x: cx - wx * newZoom, y: cy - wy * newZoom };
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg animate-fade-in">

      {/* ── Left rail ── */}
      <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-card flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between px-5 py-5 border-b border-border shrink-0">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
          <button onClick={onBack}
            className="flex items-center gap-[5px] font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200 group">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              className="group-hover:-translate-x-0.5 transition-transform duration-200">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back
          </button>
        </div>
        <ChatRail />
      </aside>

      {/* ── Right column ── */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-[14px] border-b border-border bg-card shrink-0">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawer(true)}
              className="flex items-center gap-[6px] font-mono text-[11.5px] text-t1 border border-border rounded-pill px-[14px] py-[7px] bg-card">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 9a1 1 0 01-1 1H4l-2 2V3a1 1 0 011-1h8a1 1 0 011 1v6z" />
              </svg>
              Chat
            </button>
            <button onClick={onBack}
              className="flex items-center gap-[5px] font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Canvas */}
        <section className="flex-1 min-h-0 border-b border-border flex flex-col overflow-hidden">
          <AnimatePresence>
            {expandedCard && (
              <ExpandedView
                key={expandedCard.id}
                card={expandedCard}
                onClose={() => setExpandedId(null)}
                onRowsChange={(rows) => updateCardRows(expandedCard.id, rows)}
                onChartTypeChange={(type) => changeCardType(expandedCard.id, type)}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            )}
          </AnimatePresence>
          {!expandedCard && (
            <>
              {/* Canvas toolbar — always visible, not transformed */}
              <div
                className="flex items-center justify-between shrink-0 border-b border-border px-6 py-[9px]"
                style={{ background: SURFACE }}
              >
                <div className="flex items-center gap-[10px]">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3">Canvas</span>
                  <span className="font-mono text-[10.5px] text-t3 rounded-sm px-[8px] py-0.5" style={{ background: SURFACE_MUTED }}>
                    {cards.length} insights
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={undo} disabled={!canUndo} title="Undo"
                    className="w-[30px] h-[30px] rounded-sm border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[#B89548] hover:text-[#B89548] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
                    </svg>
                  </button>
                  <button onClick={redo} disabled={!canRedo} title="Redo"
                    className="w-[30px] h-[30px] rounded-sm border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[#B89548] hover:text-[#B89548] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-[5px] font-mono text-[11px] text-t2 border border-border rounded-sm px-[10px] py-[5px] bg-card hover:border-[#B89548] transition-colors duration-200">
                    Filter
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1.5 3h7M3 6h4M4.5 9h1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Infinite canvas viewport */}
              <div
                ref={canvasViewportRef}
                className="flex-1 relative overflow-hidden"
                style={{
                  cursor: activeConn ? "crosshair" : (isPanning || !!draggingNode) ? "grabbing" : "default",
                  userSelect: isPanning ? "none" : "auto",
                  background: "#EDE9E0",
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* World — CSS-transformed layer */}
                <div
                  ref={worldRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transformOrigin: "0 0",
                    transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.zoom})`,
                  }}
                >
                  {/* Absolute node canvas */}
                  <div style={{ position: "relative", width: 2400, height: 1600 }}>
                    {/* SVG edge layer — renders below cards, in world coordinates */}
                    <svg
                      style={{
                        position: "absolute", top: 0, left: 0,
                        width: "100%", height: "100%",
                        overflow: "visible", pointerEvents: "none", zIndex: 0,
                      }}
                    >
                      {/* Permanent connections */}
                      {connections.map(conn => {
                        const from = getPortPosFromState(conn.fromId, "right");
                        const to   = getPortPosFromState(conn.toId,   "left");
                        if (!from || !to) return null;
                        return (
                          <path
                            key={conn.id}
                            d={makeBezier(from.x, from.y, to.x, to.y)}
                            fill="none"
                            stroke={NAVY_300}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity="0.65"
                          />
                        );
                      })}
                      {/* Active (drawing) connection — gold dashed */}
                      {activeConn && (() => {
                        const from = getPortPosFromState(activeConn.fromId, "right");
                        if (!from) return null;
                        return (
                          <path
                            d={makeBezier(from.x, from.y, activeConn.mouseX, activeConn.mouseY)}
                            fill="none"
                            stroke={GOLD}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray="5 3"
                            opacity="0.8"
                          />
                        );
                      })()}
                    </svg>

                    {/* Per-card wrapper — absolutely positioned, draggable */}
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        ref={(el) => {
                          if (el) {
                            cardRefs.current.set(card.id, el);
                            cardHeightRef.current.set(card.id, el.offsetHeight);
                          } else {
                            cardRefs.current.delete(card.id);
                            cardHeightRef.current.delete(card.id);
                          }
                        }}
                        style={{
                          position: "absolute",
                          left: nodePositions[card.id]?.x ?? 0,
                          top: nodePositions[card.id]?.y ?? 0,
                          width: CARD_W,
                          zIndex: draggingNode === card.id ? 10 : 1,
                          userSelect: "none",
                        }}
                        onMouseDown={(e) => handleNodeMouseDown(card.id, e)}
                      >
                        <InsightCard
                          card={card}
                          isDraggingNode={draggingNode === card.id}
                          onExpand={() => setExpandedId(card.id)}
                          onChartTypeChange={(type) => changeCardType(card.id, type)}
                          onOutputPortDown={(e) => handleOutputPortDown(card.id, e)}
                          onInputPortUp={(e) => handleInputPortUp(card.id, e)}
                          isConnecting={!!activeConn && activeConn.fromId !== card.id}
                        />
                      </div>
                    ))}

                    {/* Skeleton — positioned after last card row */}
                    <div style={{
                      position: "absolute",
                      left: 28 + (cards.length % 4) * (CARD_W + COL_GAP),
                      top:  28 + Math.floor(cards.length / 4) * (CARD_H_EST + 24),
                      width: CARD_W,
                      zIndex: 1,
                    }}>
                      <SkeletonCard />
                    </div>

                    {/* Placeholder — one slot after skeleton */}
                    <div style={{
                      position: "absolute",
                      left: 28 + ((cards.length + 1) % 4) * (CARD_W + COL_GAP),
                      top:  28 + Math.floor((cards.length + 1) / 4) * (CARD_H_EST + 24),
                      width: CARD_W,
                      zIndex: 1,
                    }}>
                      <PlaceholderCard />
                    </div>
                  </div>
                </div>

                {/* Zoom HUD — fixed inside viewport, not transformed */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    display: "flex",
                    alignItems: "center",
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => zoomBy(1.2)}
                    title="Zoom in"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRight: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", color: T2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M5 1v8M1 5h8" />
                    </svg>
                  </button>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T2, padding: "0 8px", minWidth: 42, textAlign: "center" as const }}>
                    {Math.round(canvasTransform.zoom * 100)}%
                  </span>
                  <button
                    onClick={() => zoomBy(1 / 1.2)}
                    title="Zoom out"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", color: T2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M1 5h8" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCanvasTransform({ x: 0, y: 0, zoom: 1 })}
                    title="Reset view"
                    style={{ padding: "0 10px", height: 28, display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T2 }}
                    onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Presentation strip */}
        <PresentationStrip
          slides={slides}
          cards={cards}
          onUpdateSlide={updateSlide}
          onAddSlide={() => {/* open a picker or add last card */}}
          onCardDrop={handleCardDrop}
          onRemoveSlide={removeSlide}
          isDraggingCard={!!draggingCardId}
        />
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-200 lg:hidden ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawer(false)} />
      <div className={`fixed bottom-0 left-0 right-0 h-[70vh] bg-card rounded-none border-t border-border z-50 flex flex-col overflow-hidden transition-transform duration-300 lg:hidden ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="w-8 h-1 bg-border rounded-full mx-auto mt-3 mb-4 shrink-0" />
        <div className="px-5 pb-3 shrink-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-3">AI Agent Chat</div>
          <div className="flex flex-wrap gap-[6px]">
            {["stripe_prod.sql", "analytics_dw.sql"].map((f) => (
              <span key={f} className="font-mono text-[10px] text-t2 rounded-sm px-[10px] py-1" style={{ background: SURFACE_MUTED }}>{f}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 thin-scroll">
          <div className="text-[13.5px] text-t2 leading-[1.55]">
            <strong className="text-t1 font-medium">Axon</strong>{" "}— I've parsed 3 files with 47 tables. Strong signals in revenue, retention, and conversion.
          </div>
          <div className="self-end rounded-pill px-[16px] py-[10px] text-[13.5px] leading-[1.5] max-w-[88%]"
            style={{ background: NAVY, color: "#F5F2EA" }}>
            Focus on revenue, conversion, and churn.
          </div>
          <div className="flex items-center gap-2 text-[13px] text-t3">
            <div className="flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full bg-t3 animate-pulse-dot"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            Generating insights…
          </div>
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-[10px] items-end shrink-0">
          <ChatTextarea placeholder="Ask anything about your data…" />
          <button className="w-[34px] h-[34px] rounded-pill flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
            style={{ background: NAVY, color: "#F5F2EA" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v12M1 7l6-6 6 6" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function Home() {
  const [view, setView] = useState<"landing" | "workspace">("landing");
  return view === "landing"
    ? <Page1 onNavigate={() => setView("workspace")} />
    : <Page2 onBack={() => setView("landing")} />;
}
