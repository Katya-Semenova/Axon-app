"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/lib/store";
import type { BuildAudience, BuildTone } from "@/lib/types";
import { BORDER, NAVY, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

/* ══════════════════════════════════════════════════════════════════════════
   PRESENT — the export gateway.
   ────────────────────────────────────────────────────────────────────────
   This is NOT a slideshow. It lives inside the normal app shell (light
   theme, AI chat rail on the left, top-right mode tabs intact). The user
   picks an output format, configures delivery settings, and clicks BUILD
   to receive a file or shareable link.
══════════════════════════════════════════════════════════════════════════ */

const mono = "'JetBrains Mono', monospace";
const serif = "'Instrument Serif', Georgia, serif";

type OutputFormat = "PPTX" | "PDF" | "View Link" | "Interactive";

const OUTPUT_FORMATS: { id: OutputFormat; title: string; tagline: string; icon: React.ReactNode }[] = [
  {
    id: "PPTX",
    title: "PPTX",
    tagline: "Editable deck",
    /* Tabler file-type-ppt */
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-3" />
        <path d="M5 14h2a2 2 0 1 1 0 4h-2v-4z" />
        <path d="M5 18v3" />
      </svg>
    ),
  },
  {
    id: "PDF",
    title: "PDF",
    tagline: "Print-ready",
    /* Tabler file-type-pdf */
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4" />
        <path d="M5 18h1.5a1.5 1.5 0 0 0 0 -3h-1.5v6" />
        <path d="M17 18h2" />
        <path d="M20 15h-3v6" />
        <path d="M11 15v6h1a2 2 0 0 0 2 -2v-2a2 2 0 0 0 -2 -2h-1z" />
      </svg>
    ),
  },
  {
    id: "View Link",
    title: "View link",
    tagline: "Static dashboard",
    /* Tabler link */
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 15l6 -6" />
        <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
        <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
      </svg>
    ),
  },
  {
    id: "Interactive",
    title: "Interactive",
    tagline: "Live dashboard",
    /* Tabler cursor-text */
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 12h4" />
        <path d="M9 4a3 3 0 0 1 3 3v10a3 3 0 0 1 -3 3" />
        <path d="M15 4a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3" />
      </svg>
    ),
  },
];

const AUDIENCE_OPTIONS: BuildAudience[] = ["Board", "Investor", "Team", "CEO"];
const TONE_OPTIONS: BuildTone[]         = ["Formal", "Neutral", "Casual"];
const NARRATION_OPTIONS = ["Speaker notes included", "Voiceover script", "None"] as const;
type NarrationMode = typeof NARRATION_OPTIONS[number];

/* ── Component ─────────────────────────────────────────────────────────── */

export function PresentExport() {
  const slideOrder    = useWorkspaceStore(s => s.slideOrder);
  const slidesById    = useWorkspaceStore(s => s.slidesById);
  const buildAudience = useWorkspaceStore(s => s.buildAudience);
  const buildTone     = useWorkspaceStore(s => s.buildTone);
  const setAudience   = useWorkspaceStore(s => s.setBuildAudience);
  const setTone       = useWorkspaceStore(s => s.setBuildTone);

  const [format, setFormat]         = useState<OutputFormat>("PPTX");
  const [narration, setNarration]   = useState<NarrationMode>("Speaker notes included");
  const [built, setBuilt]           = useState<null | { kind: "file"; filename: string; size: string } | { kind: "link"; url: string }>(null);
  const [copied, setCopied]         = useState(false);

  const slideCount = slideOrder.length;
  /* Rough estimate — ~1.5 MB per slide + narration overhead */
  const sizeMB     = Math.max(1, Math.round(slideCount * 1.5 + (narration === "Voiceover script" ? 2 : 0)));
  const narrLine   = narration === "None" ? "no narration" : narration === "Voiceover script" ? "voiceover included" : "narration included";

  function handleBuild() {
    if (slideCount === 0) return;
    if (format === "PPTX" || format === "PDF") {
      const ext = format.toLowerCase();
      setBuilt({ kind: "file", filename: `axon-deck-${Date.now().toString(36)}.${ext}`, size: `${sizeMB} MB` });
    } else {
      setBuilt({ kind: "link", url: `https://axon.app/s/${Date.now().toString(36)}` });
    }
  }

  function resetBuild() {
    setBuilt(null);
  }

  /* When the user changes any input, invalidate the result so they re-build */
  function changeFormat(f: OutputFormat) {
    setFormat(f);
    if (built) setBuilt(null);
  }

  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">

      {/* ── Page header ── */}
      <div
        className="flex items-center justify-between border-b px-7 py-[14px] shrink-0"
        style={{ background: SURFACE, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>
            Present
          </span>
          <span style={{ color: BORDER, fontSize: 10 }}>|</span>
          <span style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
            {slideCount === 0 ? "no slides yet" : `${slideCount} slide${slideCount !== 1 ? "s" : ""} ready to export`}
          </span>
        </div>
        {/* Right gutter clears space for ModeTabs (rendered by page.tsx) */}
        <div style={{ width: 280 }} aria-hidden />
      </div>

      {/* ── Body ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto thin-scroll"
        style={{ background: SURFACE_RAISE }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 32px 64px", display: "flex", flexDirection: "column", gap: 36 }}>

          {/* Hero serif title */}
          <div>
            <span style={{
              fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T3,
            }}>
              Output format
            </span>
            <h1 style={{
              fontFamily: serif, fontSize: 28, lineHeight: 1.15, color: NAVY,
              margin: "6px 0 4px", fontWeight: 400,
            }}>
              How should this deck travel?
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: T2, margin: 0 }}>
              Pick one. Everything below adapts to the format you choose.
            </p>
          </div>

          {/* ── 1. Output format picker (4 cards) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {OUTPUT_FORMATS.map(f => {
              const active = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => changeFormat(f.id)}
                  style={{
                    position: "relative",
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 10,
                    padding: "20px 18px 18px",
                    background: active ? "#FBF9F3" : "transparent",
                    border: `${active ? "2px" : "1px"} solid ${active ? NAVY : BORDER}`,
                    borderRadius: 0,
                    cursor: "pointer",
                    color: active ? NAVY : T2,
                    transition: "border-color 150ms, background 150ms, color 150ms",
                    textAlign: "left",
                    /* Compensate for the 2px active border so cards don't shift */
                    margin: active ? 0 : 1,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = NAVY; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ color: active ? NAVY : T2 }}>{f.icon}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: NAVY, lineHeight: 1.2 }}>
                      {f.title}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: T3, lineHeight: 1.3 }}>
                      {f.tagline}
                    </span>
                  </div>
                  {/* Checkmark badge */}
                  {active && (
                    <div style={{
                      position: "absolute", top: 10, right: 10,
                      width: 18, height: 18,
                      background: NAVY, color: "#F5F2EA",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5l2.5 2.5L8.5 2.5" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 2. Delivery settings strip ── */}
          <div style={{ border: `1px solid ${BORDER}`, background: SURFACE, padding: "18px 22px 20px" }}>
            <span style={{
              fontFamily: mono, fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: T3,
              display: "block", marginBottom: 14,
            }}>
              Delivery settings
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              <SettingsField label="Audience">
                <Select<BuildAudience>
                  value={buildAudience === "Custom" ? "Board" : buildAudience}
                  options={AUDIENCE_OPTIONS}
                  format={a => a === "CEO" ? "CEO / Exec" : a}
                  onChange={a => { setAudience(a); if (built) setBuilt(null); }}
                />
              </SettingsField>
              <SettingsField label="Tone">
                <Select<BuildTone>
                  value={buildTone}
                  options={TONE_OPTIONS}
                  format={t => t === "Formal" ? "Direct, factual" : t === "Neutral" ? "Narrative" : "Casual"}
                  onChange={t => { setTone(t); if (built) setBuilt(null); }}
                />
              </SettingsField>
              <SettingsField label="Narration">
                <Select<NarrationMode>
                  value={narration}
                  options={[...NARRATION_OPTIONS]}
                  onChange={n => { setNarration(n); if (built) setBuilt(null); }}
                />
              </SettingsField>
            </div>
          </div>

          {/* ── 3. Build bar OR 4. Result card ── */}
          <AnimatePresence mode="wait">
            {!built ? (
              <motion.div
                key="build-bar"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 22px",
                  border: `1px solid ${BORDER}`,
                  background: SURFACE,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: mono, fontSize: 11.5, color: NAVY, fontWeight: 500 }}>
                    {slideCount === 0 ? "Add slides before building" : `${slideCount} slide${slideCount !== 1 ? "s" : ""} · ~${sizeMB} MB · ${narrLine}`}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, letterSpacing: "0.05em" }}>
                    {format === "PPTX" || format === "PDF" ? "File output" : "Shareable link"} · {format}
                  </span>
                </div>
                <button
                  onClick={handleBuild}
                  disabled={slideCount === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "11px 26px",
                    fontFamily: mono, fontSize: 12.5, fontWeight: 500, letterSpacing: "0.06em",
                    color: slideCount === 0 ? "rgba(245,242,234,0.55)" : "#C9A961",
                    background: slideCount === 0 ? "rgba(27,40,64,0.4)" : NAVY,
                    border: "none", borderRadius: 0,
                    cursor: slideCount === 0 ? "default" : "pointer",
                    textTransform: "uppercase",
                    transition: "opacity 150ms, background 150ms",
                  }}
                  onMouseEnter={e => { if (slideCount > 0) e.currentTarget.style.opacity = "0.9"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {/* Tabler hammer icon */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11.414 10l-7.383 7.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l7.407 -7.385" />
                    <path d="M18.121 15.293l2.586 -2.586a1 1 0 0 0 0 -1.414l-7.586 -7.586a1 1 0 0 0 -1.414 0l-2.586 2.586a1 1 0 0 0 0 1.414l7.586 7.586a1 1 0 0 0 1.414 0z" />
                  </svg>
                  Build
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="result-card"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                style={{
                  padding: "20px 22px",
                  border: `2px solid ${NAVY}`,
                  background: "#FBF9F3",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: NAVY, fontWeight: 500 }}>
                      Ready · {format}
                    </span>
                    {built.kind === "file" ? (
                      <>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: NAVY, wordBreak: "break-all" }}>
                          {built.filename}
                        </span>
                        <span style={{ fontFamily: mono, fontSize: 11, color: T2 }}>
                          {built.size}
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: mono, fontSize: 12, color: NAVY, wordBreak: "break-all" }}>
                          {built.url}
                        </span>
                        <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>Expires in 7 days</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                    {built.kind === "file" ? (
                      <ResultButton primary onClick={() => {/* mock download */}}>
                        Download
                      </ResultButton>
                    ) : (
                      <>
                        <ResultButton
                          primary
                          onClick={() => {
                            navigator.clipboard.writeText(built.url).catch(() => {});
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1600);
                          }}
                        >
                          {copied ? "Copied" : "Copy link"}
                        </ResultButton>
                        <ResultButton onClick={() => window.open(built.url, "_blank")}>
                          Open
                        </ResultButton>
                      </>
                    )}
                    <button
                      onClick={resetBuild}
                      style={{
                        fontFamily: mono, fontSize: 10, color: T3,
                        background: "none", border: "none", padding: 0,
                        cursor: "pointer", textDecoration: "underline",
                      }}
                    >
                      build again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}

/* ── Tiny primitives ─────────────────────────────────────────────────────── */

function SettingsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span style={{
        fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T3,
        display: "block", marginBottom: 6,
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function Select<T extends string>({
  value, options, onChange, format,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{
          width: "100%",
          appearance: "none", WebkitAppearance: "none",
          background: SURFACE_RAISE,
          border: `1px solid ${BORDER}`,
          borderRadius: 4,
          fontFamily: mono, fontSize: 11, color: NAVY,
          padding: "7px 24px 7px 10px",
          outline: "none", cursor: "pointer",
        }}
      >
        {options.map(o => (
          <option key={o} value={o}>{format ? format(o) : o}</option>
        ))}
      </select>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.4" strokeLinecap="round"
        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <path d="M1.5 3l2.5 2.5L6.5 3" />
      </svg>
    </div>
  );
}

function ResultButton({
  children, onClick, primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 18px",
        fontFamily: mono, fontSize: 11, fontWeight: 500, letterSpacing: "0.05em",
        color:      primary ? "#C9A961" : NAVY,
        background: primary ? NAVY : "transparent",
        border:     primary ? "none" : `1px solid ${NAVY}`,
        borderRadius: 0, cursor: "pointer",
        textTransform: "uppercase",
        transition: "opacity 150ms",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}
