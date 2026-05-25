"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniChart } from "../MiniChart";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide, DataSet } from "@/lib/types";
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

/* Delivery settings (Audience / Tone / Narration) moved to SLIDES mode
   in round-4 — see DeliverySettingsStrip in SlideEditor.tsx. */

/* ── Component ─────────────────────────────────────────────────────────── */

export function PresentExport({ modeSwitcher }: { modeSwitcher?: React.ReactNode }) {
  const slideOrder    = useWorkspaceStore(s => s.slideOrder);
  const slidesById    = useWorkspaceStore(s => s.slidesById);
  const dataSetsById  = useWorkspaceStore(s => s.dataSetsById);
  const narration     = useWorkspaceStore(s => s.buildNarrationMode);
  const reorderSlide  = useWorkspaceStore(s => s.reorderSlide);

  const [format, setFormat]         = useState<OutputFormat>("PPTX");
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
        className="grid grid-cols-[1fr_auto_1fr] items-center border-b px-7 h-[64px] shrink-0"
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
        <div className="flex justify-center">{modeSwitcher}</div>
        <div />
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

          {/* ── 2. Deck order — final reorder before BUILD (round-4 fix 6) ── */}
          <DeckReorderTray
            slideOrder={slideOrder}
            slidesById={slidesById}
            dataSetsById={dataSetsById}
            onReorder={(from, to) => { reorderSlide(from, to); if (built) setBuilt(null); }}
          />

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
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 28px",
                    fontFamily: mono, fontSize: 13, fontWeight: 500, letterSpacing: "0.06em",
                    /* Round-4 fix 7: white text + white icon on dark navy.
                       Disabled state lifts opacity rather than swapping colours. */
                    color: "#FFFFFF",
                    background: slideCount === 0 ? "rgba(27,35,50,0.45)" : "#1B2332",
                    border: "none", borderRadius: 0,
                    cursor: slideCount === 0 ? "default" : "pointer",
                    textTransform: "uppercase",
                    transition: "background 150ms ease",
                  }}
                  onMouseEnter={e => { if (slideCount > 0) e.currentTarget.style.background = "#27334A"; }}
                  onMouseLeave={e => { if (slideCount > 0) e.currentTarget.style.background = "#1B2332"; }}
                >
                  {/* ti-hammer — 17 px white, left of label */}
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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

/* ── Deck order tray — drag-to-reorder before BUILD (round-4 fix 6) ────────
   Native HTML5 drag-and-drop keeps the implementation simple and avoids
   nesting another @dnd-kit context inside the page-level one. Tiles are
   roughly 2× the height of the small slide-tray thumbnail, render the
   actual chart preview via MiniChart, and the strip scrolls horizontally
   when the deck overflows. */

function DeckReorderTray({
  slideOrder, slidesById, dataSetsById, onReorder,
}: {
  slideOrder: string[];
  slidesById: Record<string, Slide>;
  dataSetsById: Record<string, DataSet>;
  onReorder: (from: number, to: number) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [overIdx,  setOverIdx]  = useState<number | null>(null);

  const tiles = slideOrder
    .map(id => slidesById[id])
    .filter((s): s is Slide => !!s);

  if (tiles.length === 0) {
    return (
      <div style={{
        border: `1px dashed ${BORDER}`, background: SURFACE,
        padding: "22px 18px", textAlign: "center",
        fontFamily: mono, fontSize: 10.5, color: T3, letterSpacing: "0.05em",
      }}>
        No slides to reorder — switch to CANVAS and send a Data Set to the data set tray first.
      </div>
    );
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, background: SURFACE, padding: "16px 20px 18px" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 12, gap: 12, flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: mono, fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: T3,
        }}>
          Deck order
        </span>
        <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, opacity: 0.75 }}>
          drag to reorder
        </span>
      </div>

      <div
        className="slide-scroll"
        style={{
          display: "flex", gap: 12,
          overflowX: "auto", overflowY: "hidden",
          paddingBottom: 6,
        }}
      >
        {tiles.map((slide, idx) => {
          const ds = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
          const isDragging = dragFrom === idx;
          const isOver     = overIdx === idx && dragFrom !== null && dragFrom !== idx;
          return (
            <DeckTile
              key={slide.id}
              idx={idx}
              slide={slide}
              ds={ds}
              isDragging={isDragging}
              isOver={isOver}
              onDragStart={() => setDragFrom(idx)}
              onDragOver={() => setOverIdx(idx)}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== idx) onReorder(dragFrom, idx);
                setDragFrom(null);
                setOverIdx(null);
              }}
              onDragEnd={() => { setDragFrom(null); setOverIdx(null); }}
            />
          );
        })}
      </div>
    </div>
  );
}

function DeckTile({
  idx, slide, ds, isDragging, isOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: {
  idx: number;
  slide: Slide;
  ds: DataSet | null;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const W = 168, H = 130;
  const serial = String(slide.serial).padStart(2, "0");
  const title  = ds?.title ?? "—";

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(); }}
      onDrop={e => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      style={{
        flexShrink: 0,
        width: W,
        background: "#FBF9F3",
        border: `${isOver ? "2px solid #B89548" : "1px solid " + BORDER}`,
        padding: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        transition: "border-color 120ms, opacity 120ms",
        userSelect: "none",
        boxShadow: isOver ? "0 0 0 3px rgba(184,149,72,0.18)" : "none",
      }}
    >
      {/* Header — serial + drag-grip hint */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px 4px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", color: T3 }}>
          {serial} /
        </span>
        {/* ti-grip-vertical */}
        <svg width="10" height="14" viewBox="0 0 24 24" fill="none" stroke={T3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="5"  r="1" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5"  r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      {/* Title */}
      <div style={{
        padding: "8px 10px 6px",
        fontFamily: "Inter, sans-serif", fontSize: 11.5, fontWeight: 500, color: NAVY,
        lineHeight: 1.25,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {title}
      </div>

      {/* Chart preview */}
      <div style={{ padding: "0 10px 10px" }}>
        <svg viewBox={`0 0 ${W - 20} 60`} fill="none" style={{ width: "100%", height: 60, display: "block" }}>
          {ds && ds.rows.length > 0 ? (
            <MiniChart rows={ds.rows} chartType={ds.chartType} color={NAVY} W={W - 20} H={60} />
          ) : (
            <text x={(W - 20) / 2} y="32" textAnchor="middle"
              fontSize="9" fill={T3} fontFamily={mono} fillOpacity="0.7">
              — no data —
            </text>
          )}
        </svg>
      </div>

      {/* Position pill */}
      <div style={{
        padding: "0 10px 8px",
        fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em", color: T3, textTransform: "uppercase",
      }}>
        position {idx + 1}
      </div>
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
