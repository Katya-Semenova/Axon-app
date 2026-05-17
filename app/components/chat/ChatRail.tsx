"use client";

import { useRef } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { BORDER, NAVY, T3, SURFACE_MUTED } from "../ui/tokens";

function ChatTextarea({ placeholder }: { placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function expand() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }
  return (
    <textarea
      ref={ref}
      onInput={expand}
      rows={2}
      placeholder={placeholder}
      className="flex-1 border border-border rounded-sm px-3 py-2 text-[13.5px] font-sans text-t1 resize-none outline-none transition-colors duration-200 placeholder:text-t3 min-h-[76px] max-h-[160px] leading-relaxed"
      style={{ background: SURFACE_MUTED }}
    />
  );
}

/* ── ChatRail — collapsible left rail ────────────────────────────────────
   When chatCollapsed === true, collapses to a 40px strip showing only the
   expand chevron. The onBack prop is forwarded to the header's Back button.   */
export function ChatRail({ onBack }: { onBack: () => void }) {
  const chatCollapsed  = useWorkspaceStore(s => s.chatCollapsed);
  const toggleChat     = useWorkspaceStore(s => s.toggleChat);

  /* ── Collapsed state: narrow strip with only the expand chevron ── */
  if (chatCollapsed) {
    return (
      <aside
        className="hidden lg:flex shrink-0 border-r border-border bg-card flex-col h-screen overflow-hidden items-center pt-5"
        style={{ width: 40 }}
      >
        <button
          onClick={toggleChat}
          title="Expand chat"
          className="flex items-center justify-center rounded-sm transition-colors duration-200"
          style={{ width: 28, height: 28, color: T3, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-card flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border shrink-0">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
        <div className="flex items-center gap-2">
          {/* Collapse chevron */}
          <button
            onClick={toggleChat}
            title="Collapse chat"
            className="flex items-center justify-center rounded-sm transition-colors duration-200"
            style={{ width: 24, height: 24, color: T3, border: `1px solid ${BORDER}` }}
            onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
            onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
          </button>
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200 group"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              className="group-hover:-translate-x-0.5 transition-transform duration-200">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back
          </button>
        </div>
      </div>

      {/* File chips */}
      <div className="px-5 pb-3 pt-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-4">AI Agent Chat</div>
        <div className="flex flex-wrap gap-[6px] mb-2">
          {["stripe_prod.sql", "analytics_dw.sql", "events_log.db"].map((f) => (
            <span key={f} className="flex items-center gap-[5px] font-mono text-[10.5px] text-t2 rounded-sm px-[10px] py-1"
              style={{ background: SURFACE_MUTED }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M7.5 1H3a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V4.5L7.5 1zM7 1v3.5H10" />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 thin-scroll">
        <div className="text-[13.5px] text-t2 leading-[1.55]">
          <strong className="text-t1 font-medium">Axon</strong>
          {" "}— I&apos;ve parsed 3 files containing 47 tables and 218K rows. Strong signals in revenue, retention, and conversion. Where should I focus?
        </div>
        {/* User message bubble — rounded-card (4px) per design spec */}
        <div
          className="self-end px-[16px] py-[10px] text-[13.5px] leading-[1.5] max-w-[88%]"
          style={{ background: NAVY, color: "#F5F2EA", borderRadius: 4 }}
        >
          Focus on revenue, conversion, and churn. Show me what&apos;s broken and what&apos;s working.
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

      {/* Input */}
      <div className="px-5 py-4 border-t border-border flex gap-[10px] items-end shrink-0">
        <ChatTextarea placeholder="Ask anything about your data…" />
        <button
          className="w-[34px] h-[34px] rounded-pill flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
          style={{ background: NAVY, color: "#F5F2EA" }}
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 1v12M1 7l6-6 6 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

