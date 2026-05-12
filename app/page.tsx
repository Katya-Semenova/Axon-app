"use client";

import { useState, useRef } from "react";
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

/* ── Colors ─────────────────────────────────────────── */
const NAVY   = "#1F2A44";
const GOLD   = "#B8924A";
const BORDER = "#E8E4DC";
const T2     = "#6B6B66";
const T3     = "#A8A8A2";

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
          <div key={i} className="w-6 h-[3px] rounded-[1px]"
            style={{ background: i < filled ? NAVY : BORDER }} />
        ))}
      </div>
      <span className="font-mono text-[10.5px] text-t2">{pct}%</span>
    </div>
  );
}

const STATUS_MAP: Record<ProjectStatus, { dotCls: string; label: string }> = {
  ready:      { dotCls: "bg-[#3A7D44]", label: "ready"      },
  generating: { dotCls: "bg-[#8B6914]", label: "generating" },
  draft:      { dotCls: "bg-t3",        label: "draft"       },
};

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const s = STATUS_MAP[project.status];
  const sparkColor = project.status === "generating" ? "#8B6914" : NAVY;
  return (
    <div onClick={onClick}
      className="bg-card border border-border rounded-[14px] p-6 cursor-pointer transition-all duration-200 hover:border-[rgba(31,42,68,0.15)]">
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
  onAdd: () => void;
  onExpand: () => void;
  onChartTypeChange: (type: ChartType) => void;
}

function InsightCard({ card, onAdd, onExpand, onChartTypeChange }: InsightCardProps) {
  const [ddOpen, setDdOpen] = useState(false);
  const padded = String(card.serial).padStart(2, "0");

  return (
    <div
      className={`${card.wide ? "sm:col-span-2" : ""} group relative bg-card border border-border rounded-[14px] p-8 transition-colors duration-200 hover:border-[rgba(31,42,68,0.15)] cursor-pointer`}
      onClick={() => onExpand()}
    >
      {/* Dropdown backdrop */}
      {ddOpen && (
        <div className="fixed inset-0 z-[5]" onClick={() => setDdOpen(false)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[11px] text-t3 tracking-[0.08em]">{padded} /</span>
        <div className="relative z-[6]">
          <button
            onClick={(e) => { e.stopPropagation(); setDdOpen(!ddOpen); }}
            className="flex items-center gap-1 text-[11px] text-t2 border border-border rounded-md px-[8px] py-[3px] bg-bg hover:border-[rgba(31,42,68,0.2)] transition-colors duration-200"
          >
            {card.chartType}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1.5 3l2.5 2.5L6.5 3" />
            </svg>
          </button>
          {ddOpen && (
            <div className="absolute right-0 top-full mt-1 z-[7] bg-card border border-border rounded-xl shadow-lg py-1 min-w-[152px]">
              {CHART_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={(e) => { e.stopPropagation(); onChartTypeChange(type); setDdOpen(false); }}
                  className="w-full text-left px-3 py-[6px] text-[11px] hover:bg-bg transition-colors"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    color: type === card.chartType ? "#0A0A0A" : T2,
                    fontWeight: type === card.chartType ? 500 : 400,
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
      <div className="text-[13.5px] font-medium text-t1 leading-[1.4] mb-4">{card.headline}</div>

      {/* Chart — driven by live data */}
      <div className="w-full mb-4 flex items-center justify-center overflow-hidden">
        <ChartRenderer rows={card.rows} columns={card.columns} chartType={card.chartType} />
      </div>

      {/* Hover overlay — z-[1] keeps it below the expand button */}
      <div className="absolute inset-0 z-[1] rounded-[14px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-white/[0.92] to-transparent flex items-end justify-center pb-5 pointer-events-none group-hover:pointer-events-auto">
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
          className="text-[12px] font-medium font-mono text-primary border border-primary/30 rounded-lg px-4 py-[6px] bg-card hover:bg-[rgba(31,42,68,0.05)] transition-colors duration-200"
        >
          + Add to presentation
        </button>
      </div>

      {/* Footer — z-[2] keeps expand icon above the hover overlay */}
      <div className="relative z-[2] flex items-center justify-between">
        <ConfBar filled={card.confFilled} pct={card.confPct} />
        <button
          onClick={(e) => { e.stopPropagation(); onExpand(); }}
          className="w-[26px] h-[26px] rounded-md border flex items-center justify-center transition-all duration-200"
          title="Expand"
          style={{ color: "#A8A8A2", borderColor: "#E8E4DC" }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#3B4BDB";
            e.currentTarget.style.borderColor = "rgba(59,75,219,0.35)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#A8A8A2";
            e.currentTarget.style.borderColor = "#E8E4DC";
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
    <div className="bg-card border border-border rounded-[14px] p-8">
      <div className="flex items-start justify-between mb-[14px]">
        <div className="shimmer w-8 h-[10px] rounded" />
        <div className="shimmer w-16 h-[22px] rounded-md" />
      </div>
      <div className="shimmer w-3/4 h-[13px] rounded mb-2" />
      <div className="shimmer w-1/2 h-[13px] rounded mb-5" />
      <div className="shimmer w-full h-[108px] rounded-lg" />
      <div className="flex items-center justify-between mt-4">
        <div className="shimmer w-28 h-[10px] rounded" />
        <div className="shimmer w-[26px] h-[26px] rounded-md" />
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
    <div className="border-[1.5px] border-dashed border-border rounded-[14px] flex items-center justify-center min-h-[240px] cursor-pointer hover:border-t3 hover:bg-black/[0.01] transition-all duration-200">
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
      className="flex-1 border border-border rounded-lg px-3 py-2 text-[13.5px] font-sans text-t1 bg-bg resize-none outline-none focus:border-primary/40 transition-colors duration-200 placeholder:text-t3 min-h-[38px] max-h-[120px] leading-relaxed" />
  );
}

function ChatRail() {
  return (
    <>
      <div className="px-5 pb-3">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-4">AI Agent Chat</div>
        <div className="flex flex-wrap gap-[6px] mb-5">
          {["stripe_prod.sql", "analytics_dw.sql", "events_log.db"].map((f) => (
            <span key={f} className="flex items-center gap-[5px] font-mono text-[10.5px] text-t2 border border-border rounded-full px-[10px] py-1 bg-bg">
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
        <div className="self-end text-white rounded-[10px_10px_3px_10px] px-[14px] py-[10px] text-[13.5px] leading-[1.5]"
          style={{ background: NAVY }}>
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
        <button className="w-[34px] h-[34px] rounded-lg text-white flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
          style={{ background: NAVY }} aria-label="Send">
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
          className={`mx-12 mb-[80px] border-[1.5px] border-dashed rounded-[14px] py-[52px] px-12 text-center cursor-pointer transition-all duration-200 relative max-md:mx-6 max-md:mb-16 max-sm:mx-4 max-sm:mb-12 max-sm:py-9 max-sm:px-6
            ${dragOver ? "border-primary/40 bg-[rgba(31,42,68,0.05)]" : "border-muted hover:border-primary/30 hover:bg-[rgba(31,42,68,0.04)]"}`}
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

  function updateSlide(cardId: string, update: Partial<SlideState>) {
    setSlides(prev => prev.map(s => s.cardId === cardId ? { ...s, ...update } : s));
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
              className="flex items-center gap-[6px] font-mono text-[11.5px] text-t1 border border-border rounded-lg px-[14px] py-[7px] bg-card">
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
            <div className="flex-1 overflow-y-auto px-7 pt-7 thin-scroll max-sm:px-4 max-sm:pt-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-[10px]">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3">Canvas</span>
                  <span className="font-mono text-[10.5px] text-t3 border border-border rounded-full px-[10px] py-0.5">
                    {cards.length} insights
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Undo / Redo in canvas header */}
                  <button onClick={undo} disabled={!canUndo} title="Undo"
                    className="w-[30px] h-[30px] rounded-lg border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[rgba(31,42,68,0.2)] transition-all">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
                    </svg>
                  </button>
                  <button onClick={redo} disabled={!canRedo} title="Redo"
                    className="w-[30px] h-[30px] rounded-lg border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[rgba(31,42,68,0.2)] transition-all">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
                    </svg>
                  </button>
                  <button className="flex items-center gap-[5px] font-mono text-[11px] text-t2 border border-border rounded-lg px-[10px] py-[5px] bg-card hover:border-[rgba(31,42,68,0.2)] transition-colors duration-200">
                    Filter
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1.5 3h7M3 6h4M4.5 9h1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Dense grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [grid-auto-flow:dense] gap-[14px] pb-7">
                {cards.map((card) => (
                  <InsightCard
                    key={card.id}
                    card={card}
                    onAdd={() => addSlide(card.id)}
                    onExpand={() => setExpandedId(card.id)}
                    onChartTypeChange={(type) => changeCardType(card.id, type)}
                  />
                ))}
                <SkeletonCard />
                <PlaceholderCard />
                <PlaceholderCard />
              </div>
            </div>
          )}
        </section>

        {/* Presentation strip */}
        <PresentationStrip
          slides={slides}
          cards={cards}
          onUpdateSlide={updateSlide}
          onAddSlide={() => {/* open a picker or add last card */}}
        />
      </div>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-200 lg:hidden ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setDrawer(false)} />
      <div className={`fixed bottom-0 left-0 right-0 h-[70vh] bg-card rounded-t-2xl border-t border-border z-50 flex flex-col overflow-hidden transition-transform duration-300 lg:hidden ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="w-8 h-1 bg-border rounded-full mx-auto mt-3 mb-4 shrink-0" />
        <div className="px-5 pb-3 shrink-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-3">AI Agent Chat</div>
          <div className="flex flex-wrap gap-[6px]">
            {["stripe_prod.sql", "analytics_dw.sql"].map((f) => (
              <span key={f} className="font-mono text-[10px] text-t2 border border-border rounded-full px-[10px] py-1 bg-bg">{f}</span>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 thin-scroll">
          <div className="text-[13.5px] text-t2 leading-[1.55]">
            <strong className="text-t1 font-medium">Axon</strong>{" "}— I've parsed 3 files with 47 tables. Strong signals in revenue, retention, and conversion.
          </div>
          <div className="self-end text-white rounded-[10px_10px_3px_10px] px-[14px] py-[10px] text-[13.5px] leading-[1.5]"
            style={{ background: NAVY }}>
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
          <button className="w-[34px] h-[34px] rounded-lg text-white flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
            style={{ background: NAVY }}>
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
