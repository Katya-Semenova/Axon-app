"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PresentMode } from "./PresentMode";
import { ChartFill } from "../ChartFill";
import { MiniChart } from "../MiniChart";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide, BuildAudience, BuildTone, DataSet, BuildMessage } from "@/lib/types";
import { BORDER, NAVY, T2, T3, SURFACE, SURFACE_RAISE, SURFACE_MUTED } from "../ui/tokens";

const mono = "'JetBrains Mono', monospace";

const STYLE_FONT: Record<string, string> = {
  Modern:    "Inter, sans-serif",
  Magazine:  "'Instrument Serif', Georgia, serif",
  Wireframe: "'JetBrains Mono', monospace",
};
const ACCENT: Record<string, string> = {
  Navy: "#1B2840", Gold: "#B89548", Slate: "#4A5878", Graphite: "#2A3654",
};
const AUDIENCE_OPTIONS: BuildAudience[] = ["CEO", "Board", "Team", "Investor", "Custom"];
const TONE_OPTIONS: BuildTone[] = ["Formal", "Neutral", "Casual"];

/* ─────────────────────────────────────────────────────────────
   Module-level helpers (no React state, safe to call anywhere)
───────────────────────────────────────────────────────────── */

function streamAxon(
  text: string,
  add: (m: BuildMessage) => void,
  update: (id: string, u: Partial<BuildMessage>) => void,
  delay = 280,
) {
  const id = `axon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  add({ id, role: "axon", content: "", streaming: true });
  let i = 0;
  function step() {
    if (i >= text.length) { update(id, { content: text, streaming: false }); return; }
    i = Math.min(i + 4, text.length);
    update(id, { content: text.slice(0, i) });
    setTimeout(step, 15);
  }
  setTimeout(step, delay);
}

function rearrangeForAudience(ids: string[], audience: BuildAudience): string[] {
  const arr = [...ids];
  if (audience === "Board" && arr.length >= 2) {
    [arr[0], arr[1]] = [arr[1], arr[0]];   // swap first two slides
  } else if (audience === "Team") {
    arr.reverse();                           // reverse for team view
  }
  return arr;                                // CEO, Investor, Custom: keep order
}

function getAudienceMessage(audience: BuildAudience, n: number, customText: string): string {
  switch (audience) {
    case "CEO":
      return `Switched to CEO view — ${n} slides ordered by impact. Leading with the top-line number, supporting detail behind. Brevity first.`;
    case "Board":
      return `Switched to Board view — moved the KPI summary to slide 1, expanded the segment breakdown. Structured for governance-level review.`;
    case "Team":
      return `Switched to Team view — reversed to lead with context, close on the headline. Full data visible throughout.`;
    case "Investor":
      return `Switched to Investor view — growth vectors first, risks at the close. TAM framing applied throughout.`;
    case "Custom":
      return customText.trim()
        ? `Understood — reframing for "${customText.trim()}". Narrative emphasis adjusted. Tell me what else to change.`
        : `Custom audience selected. Describe your audience in the field above and I'll adjust the framing.`;
  }
}

function getToneMessage(tone: BuildTone): string {
  switch (tone) {
    case "Formal":  return "Re-tuned to Formal — language is more precise, numbers cited explicitly. Good for compliance or governance audiences.";
    case "Neutral": return "Back to Neutral — balanced language, key numbers highlighted. Works across audiences.";
    case "Casual":  return "Switched to Casual — conversational, plain language. Best for internal team reviews.";
  }
}

function getSpeakerNote(title: string, serial: number, tone: BuildTone, narrative?: string): string {
  const base = narrative || title;
  switch (tone) {
    case "Formal":
      return `Slide ${serial} presents ${base}. The data demonstrates a statistically significant trend warranting close attention. Cross-reference against prior-quarter targets before drawing final conclusions.`;
    case "Casual":
      return `So here's the story on ${base}. The numbers are pretty clear — pause on the big figure and let it land before moving on.`;
    default:
      return `This slide covers ${base}. Call out the main trend and connect it to the overall narrative — diagnostic, root cause, or recovery path depending on where we are in the deck.`;
  }
}

function buildFirstMessage(slides: Slide[], dataSetsById: Record<string, DataSet>, audience: BuildAudience): string {
  const n = slides.length;
  if (n === 0) return "No slides yet. Go back to Presentation Mode and add some data sets, then return here to deliver.";
  const firstDs = slides[0]?.dataSetIds[0] ? dataSetsById[slides[0].dataSetIds[0]] : null;
  const lastDs  = n > 1 && slides[n - 1]?.dataSetIds[0] ? dataSetsById[slides[n - 1].dataSetIds[0]] : null;

  let msg = `Structured ${n} slide${n > 1 ? "s" : ""} into a narrative arc.`;
  if (firstDs) msg += ` Opens with "${firstDs.title}"`;
  if (lastDs && lastDs.id !== firstDs?.id) msg += `, closes on "${lastDs.title}".`;
  else msg += ".";

  const audienceHint: Record<BuildAudience, string> = {
    CEO:      " CEO framing — leading indicators up front, supporting detail on request.",
    Board:    " Board framing — headline number first, story and risks behind it.",
    Team:     " Team framing — context first, close on the headline.",
    Investor: " Investor framing — TAM and growth vectors first, risks disclosed.",
    Custom:   " Custom audience framing applied.",
  };
  msg += audienceHint[audience];
  msg += " Adjust audience, tone, or narration in the panel — or tell me what to change.";
  return msg;
}

/* ─────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────── */

export function BuildMode() {
  const setMode              = useWorkspaceStore(s => s.setMode);
  const slideOrder           = useWorkspaceStore(s => s.slideOrder);
  const slidesById           = useWorkspaceStore(s => s.slidesById);
  const dataSetsById         = useWorkspaceStore(s => s.dataSetsById);
  const activeSlideId        = useWorkspaceStore(s => s.activeSlideId);
  const setActiveSlide       = useWorkspaceStore(s => s.setActiveSlide);
  const removeSlide          = useWorkspaceStore(s => s.removeSlide);
  const buildAudience        = useWorkspaceStore(s => s.buildAudience);
  const buildTone            = useWorkspaceStore(s => s.buildTone);
  const buildNarration       = useWorkspaceStore(s => s.buildNarration);
  const setBuildAudience     = useWorkspaceStore(s => s.setBuildAudience);
  const setBuildTone         = useWorkspaceStore(s => s.setBuildTone);
  const toggleBuildNarration = useWorkspaceStore(s => s.toggleBuildNarration);
  const buildMessages        = useWorkspaceStore(s => s.buildMessages);
  const addBuildMessage      = useWorkspaceStore(s => s.addBuildMessage);
  const updateBuildMessage   = useWorkspaceStore(s => s.updateBuildMessage);

  /* ── Local slide order — rearranged per audience without touching store ── */
  const [localSlideOrder, setLocalSlideOrder] = useState(() => [...slideOrder]);

  /* Sync when slides are added/removed from the store */
  useEffect(() => {
    setLocalSlideOrder(prev => {
      const curr = new Set(slideOrder);
      const filtered = prev.filter(id => curr.has(id));
      const added    = slideOrder.filter(id => !prev.includes(id));
      if (filtered.length === prev.length && added.length === 0) return prev;
      return [...filtered, ...added];
    });
  }, [slideOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const localSlides = localSlideOrder.map(id => slidesById[id]).filter(Boolean) as Slide[];

  /* ── Present mode ── */
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentIdx,  setPresentIdx]  = useState(0);
  const [showNotes,   setShowNotes]   = useState(false);

  /* ── Delivery rail ── */
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen,  setShareOpen]  = useState(false);
  const [shareTab,   setShareTab]   = useState<"view" | "embed">("view");
  const [linkReady,  setLinkReady]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [exportFmt,  setExportFmt]  = useState<"PDF" | "PPTX" | "PNG" | "Video">("PDF");

  /* ── Custom audience text ── */
  const [customText, setCustomText] = useState("");

  /* ── Narration first-time guard ── */
  const narrationInitRef = useRef(false);

  /* ── Stream first message on mount ── */
  const streamedRef = useRef(false);
  useEffect(() => {
    if (streamedRef.current || buildMessages.length > 0) return;
    streamedRef.current = true;
    streamAxon(buildFirstMessage(localSlides, dataSetsById, buildAudience), addBuildMessage, updateBuildMessage, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keep ref to processUserMessage always fresh (avoids stale closure) ── */
  const processRef = useRef<(text: string) => void>(() => {});

  /* ── Watch for new user messages and process them ── */
  const userMsgCountRef = useRef(() => buildMessages.filter(m => m.role === "user").length);
  const userCount = useRef(userMsgCountRef.current());

  useEffect(() => {
    const userMsgs = buildMessages.filter(m => m.role === "user");
    if (userMsgs.length <= userCount.current) return;
    userCount.current = userMsgs.length;
    const latest = userMsgs[userMsgs.length - 1];
    if (latest) processRef.current(latest.content);
  }, [buildMessages]);

  /* ─── Handlers ─── */

  function handleAudienceChange(a: BuildAudience) {
    const newOrder = rearrangeForAudience(localSlideOrder, a);
    setLocalSlideOrder(newOrder);
    if (newOrder[0] && newOrder[0] !== activeSlideId) setActiveSlide(newOrder[0]);
    setBuildAudience(a);
    streamAxon(getAudienceMessage(a, newOrder.length, customText), addBuildMessage, updateBuildMessage);
  }

  function handleToneChange(t: BuildTone) {
    setBuildTone(t);
    streamAxon(getToneMessage(t), addBuildMessage, updateBuildMessage);
  }

  function handleNarrationToggle() {
    const wasOff = !buildNarration;
    toggleBuildNarration();
    if (wasOff && !narrationInitRef.current) {
      narrationInitRef.current = true;
      setTimeout(() => streamAxon(
        "I've drafted speaker notes for all your slides. You can edit any of them — just tell me what to change.",
        addBuildMessage, updateBuildMessage,
      ), 200);
    }
  }

  function processUserMessage(text: string) {
    const lower = text.toLowerCase().trim();

    /* remove slide N */
    const removeMatch = lower.match(/remove\s+slide\s+(\d+)/);
    if (removeMatch) {
      const n = parseInt(removeMatch[1]);
      const target = localSlides.find(s => s.serial === n);
      if (target) {
        removeSlide(target.id);
        setLocalSlideOrder(prev => prev.filter(id => id !== target.id));
        setTimeout(() => streamAxon(
          `Removed slide ${n}. Deck is now ${localSlides.length - 1} slide${localSlides.length - 1 !== 1 ? "s" : ""}.`,
          addBuildMessage, updateBuildMessage,
        ), 400);
      } else {
        setTimeout(() => streamAxon(`Couldn't find slide ${n} in the deck.`, addBuildMessage, updateBuildMessage), 400);
      }
      return;
    }

    /* tone commands */
    if (lower.includes("casual"))  { setTimeout(() => handleToneChange("Casual"), 400);  return; }
    if (lower.includes("formal"))  { setTimeout(() => handleToneChange("Formal"), 400);  return; }
    if (lower.includes("neutral")) { setTimeout(() => handleToneChange("Neutral"), 400); return; }

    /* audience commands */
    if (lower.includes("board"))                            { setTimeout(() => handleAudienceChange("Board"),    400); return; }
    if (lower.includes("ceo") || lower.includes("execut")) { setTimeout(() => handleAudienceChange("CEO"),      400); return; }
    if (lower.includes("team"))                             { setTimeout(() => handleAudienceChange("Team"),     400); return; }
    if (lower.includes("investor"))                         { setTimeout(() => handleAudienceChange("Investor"), 400); return; }

    /* fallback */
    setTimeout(() => streamAxon(
      "Got it — I'd update the deck based on that. Full editing coming soon.",
      addBuildMessage, updateBuildMessage,
    ), 500);
  }

  /* Keep processRef current so the useEffect always calls the latest version */
  processRef.current = processUserMessage;

  function playNote(text: string) {
    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }
    catch { /* not available */ }
  }

  /* ── Derived ── */
  const activeSlide = (activeSlideId ? slidesById[activeSlideId] : localSlides[0]) ?? localSlides[0] ?? null;
  const activeDs    = activeSlide?.dataSetIds[0] ? dataSetsById[activeSlide.dataSetIds[0]] : null;
  const serial      = activeSlide ? String(activeSlide.serial).padStart(2, "0") : "01";
  const headFont    = activeSlide ? (STYLE_FONT[activeSlide.visualStyle] ?? "Inter, sans-serif") : "Inter, sans-serif";
  const slideBg     = activeSlide?.visualStyle === "Wireframe" ? "#F5F2EA" : "#FDFCF9";
  const speakerNote = activeSlide && activeDs
    ? getSpeakerNote(activeDs.title, activeSlide.serial, buildTone, activeSlide.narrative)
    : "";

  function handlePresent() {
    const idx = localSlides.findIndex(s => s.id === activeSlide?.id);
    setPresentIdx(Math.max(0, idx));
    setPresentOpen(true);
  }

  const mockLink  = "https://axon.app/s/axon-k8q2r";
  const mockEmbed = `<iframe src="${mockLink}/embed" width="800" height="500" frameborder="0" allowfullscreen></iframe>`;

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  /* ── Render ── */
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
      >
        {/* ── Toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 24px", borderBottom: `1px solid ${BORDER}`,
          background: SURFACE, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setMode("presentation")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                fontFamily: mono, fontSize: 11, color: T2,
                background: "none", border: "none", cursor: "pointer", transition: "color 150ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; }}
              onMouseLeave={e => { e.currentTarget.style.color = T2; }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
              Presentation
            </button>
            <span style={{ color: BORDER, fontSize: 10 }}>|</span>
            <span style={{
              fontFamily: mono, fontSize: 7.5, letterSpacing: "0.1em", textTransform: "uppercase",
              background: "rgba(27,40,64,0.06)", border: `1px solid ${BORDER}`,
              padding: "1px 5px", borderRadius: 2, color: NAVY,
            }}>BUILD</span>
            {activeSlide && (
              <span style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
                {serial} / {(activeDs?.title ?? "—").slice(0, 40)}
              </span>
            )}
          </div>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>
            {localSlides.length} slide{localSlides.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Body: center + right rail ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>

          {/* ── Center ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: SURFACE_RAISE, overflow: "hidden" }}>

            {/* Slide preview */}
            <div style={{
              flex: 1, minHeight: 0, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px 40px 16px",
            }}>
              {activeSlide && activeDs ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSlide.id}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      width: "100%", maxWidth: 880, height: "100%",
                      border: `1px solid ${BORDER}`, background: slideBg,
                      display: "flex", flexDirection: "column", overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "16px 28px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: slideBg }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>{serial} /</span>
                        <span style={{ fontFamily: headFont, fontSize: 16, fontWeight: 500, color: "#0A0A0A" }}>
                          {activeDs.title}
                        </span>
                      </div>
                      {activeSlide.narrative && (
                        <div style={{ marginTop: 4 }}>
                          <span style={{ fontFamily: headFont, fontSize: 12.5, color: T2, fontStyle: activeSlide.visualStyle === "Magazine" ? "italic" : "normal" }}>
                            {activeSlide.narrative}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minHeight: 0, padding: "16px 28px 20px" }}>
                      <ChartFill rows={activeDs.rows} columns={activeDs.columns} chartType={activeDs.chartType} expanded />
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>
                  {localSlides.length === 0 ? "No slides — go back to Presentation Mode and add data sets." : "Select a slide below."}
                </span>
              )}
            </div>

            {/* Speaker notes panel */}
            <AnimatePresence>
              {buildNarration && activeSlide && speakerNote && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 118, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ flexShrink: 0, overflow: "hidden", borderTop: `1px solid ${BORDER}`, background: SURFACE }}
                >
                  <div style={{ padding: "10px 28px 12px", height: "100%", display: "flex", flexDirection: "column", gap: 7 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: "0.09em", textTransform: "uppercase", color: T3 }}>
                        Speaker Note — {buildTone}
                      </span>
                      <button
                        onClick={() => playNote(speakerNote)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          fontFamily: mono, fontSize: 9, color: T2,
                          background: "none", border: `1px solid ${BORDER}`,
                          padding: "3px 9px", cursor: "pointer", transition: "border-color 150ms",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.color = NAVY; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = T2; }}
                      >
                        <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
                          <path d="M1 1.5v7l7-3.5L1 1.5z" />
                        </svg>
                        Play
                      </button>
                    </div>
                    <div style={{
                      flex: 1, overflow: "auto",
                      fontFamily: "Inter, sans-serif", fontSize: 12.5, color: T2,
                      lineHeight: 1.6,
                    }} className="thin-scroll">
                      {speakerNote}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Thumbnail strip */}
            <div
              style={{
                height: 96, flexShrink: 0, borderTop: `1px solid ${BORDER}`,
                background: "#EDE9E0",
                display: "flex", alignItems: "center",
                gap: 8, paddingLeft: 20, paddingRight: 20,
                overflowX: "auto",
              }}
              className="thin-scroll"
            >
              {localSlides.map((slide, idx) => {
                const ds = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
                const isActive = slide.id === activeSlide?.id;
                const accentColor = ACCENT[slide.colorAccent] ?? "#1B2840";
                return (
                  <motion.div
                    key={slide.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setActiveSlide(slide.id)}
                    style={{
                      flexShrink: 0, width: 86, height: 70, cursor: "pointer",
                      border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? NAVY : BORDER}`,
                      background: slide.visualStyle === "Wireframe" ? "#F5F2EA" : "#FBF9F3",
                      overflow: "hidden", transition: "border-color 150ms",
                    }}
                  >
                    <svg viewBox="0 0 86 70" fill="none" style={{ width: "100%", height: "100%", display: "block" }}>
                      <rect width="86" height="70" fill={slide.visualStyle === "Wireframe" ? "#F5F2EA" : "#FBF9F3"} />
                      <text x="4" y="9" fontSize="4" fontWeight="500" fill={T3} fontFamily={mono} letterSpacing="0.06em">
                        {String(idx + 1).padStart(2, "0")} /
                      </text>
                      <text x="4" y="17" fontSize="5" fontWeight="500" fill="#0A0A0A" fontFamily="Inter, sans-serif">
                        {(ds?.title ?? "—").slice(0, 16)}
                      </text>
                      {ds && (
                        <g transform="translate(4, 21)">
                          <MiniChart rows={ds.rows} chartType={ds.chartType} color={accentColor} W={78} H={43} />
                        </g>
                      )}
                    </svg>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── Right delivery rail ── */}
          <div style={{
            width: 216, flexShrink: 0, borderLeft: `1px solid ${BORDER}`,
            background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 16px", display: "flex", flexDirection: "column", gap: 10 }} className="thin-scroll">

              {/* PRESENT */}
              <button
                onClick={handlePresent}
                disabled={localSlides.length === 0}
                style={{
                  width: "100%", padding: "10px 0",
                  fontFamily: mono, fontSize: 11.5, fontWeight: 500, letterSpacing: "0.05em",
                  color: "#F5F2EA",
                  background: localSlides.length === 0 ? "#8892AA" : NAVY,
                  border: "none", borderRadius: 0,
                  cursor: localSlides.length === 0 ? "default" : "pointer",
                  transition: "opacity 150ms",
                }}
                onMouseEnter={e => { if (localSlides.length > 0) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
              >
                PRESENT
              </button>

              {/* EXPORT */}
              <div>
                <button
                  onClick={() => { setExportOpen(v => !v); if (!exportOpen) setShareOpen(false); }}
                  style={{
                    width: "100%", padding: "8px 11px",
                    fontFamily: mono, fontSize: 10.5, color: T2,
                    background: SURFACE_RAISE, border: `1px solid ${exportOpen ? NAVY : BORDER}`,
                    borderRadius: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "border-color 150ms",
                  }}
                >
                  <span>EXPORT</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
                    style={{ transform: exportOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
                    <path d="M1 2.5l3 3 3-3" />
                  </svg>
                </button>
                <AnimatePresence>
                  {exportOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} style={{ overflow: "hidden" }}>
                      <div style={{ border: `1px solid ${BORDER}`, borderTop: "none", padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                        {(["PDF", "PPTX", "PNG", "Video"] as const).map(fmt => (
                          <button key={fmt} onClick={() => setExportFmt(fmt)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "5px 8px", fontFamily: mono, fontSize: 10,
                              color: exportFmt === fmt ? NAVY : T2,
                              background: exportFmt === fmt ? SURFACE_MUTED : "transparent",
                              border: `1px solid ${exportFmt === fmt ? NAVY : BORDER}`,
                              borderRadius: 0, cursor: "pointer", transition: "all 120ms",
                            }}
                            onMouseEnter={e => { if (exportFmt !== fmt) e.currentTarget.style.background = SURFACE_MUTED; }}
                            onMouseLeave={e => { if (exportFmt !== fmt) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span>{fmt}</span>
                            {exportFmt === fmt && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round">
                                <path d="M1 4l2.5 2.5L7 1.5" />
                              </svg>
                            )}
                          </button>
                        ))}
                        <button
                          style={{ marginTop: 4, padding: "7px 0", fontFamily: mono, fontSize: 10, color: "#F5F2EA", background: NAVY, border: "none", borderRadius: 0, cursor: "pointer", transition: "opacity 150ms" }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Download {exportFmt}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SHARE */}
              <div>
                <button
                  onClick={() => { setShareOpen(v => !v); if (!shareOpen) setExportOpen(false); }}
                  style={{
                    width: "100%", padding: "8px 11px",
                    fontFamily: mono, fontSize: 10.5, color: T2,
                    background: SURFACE_RAISE, border: `1px solid ${shareOpen ? NAVY : BORDER}`,
                    borderRadius: 0, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "border-color 150ms",
                  }}
                >
                  <span>SHARE</span>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke={T3} strokeWidth="1.3" strokeLinecap="round"
                    style={{ transform: shareOpen ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>
                    <path d="M1 2.5l3 3 3-3" />
                  </svg>
                </button>
                <AnimatePresence>
                  {shareOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} style={{ overflow: "hidden" }}>
                      <div style={{ border: `1px solid ${BORDER}`, borderTop: "none", padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                          {(["view", "embed"] as const).map(tab => (
                            <button key={tab} onClick={() => setShareTab(tab)}
                              style={{
                                flex: 1, padding: "5px 0",
                                fontFamily: mono, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em",
                                color: shareTab === tab ? "#F5F2EA" : T2,
                                background: shareTab === tab ? NAVY : "transparent",
                                border: "none", cursor: "pointer", transition: "all 120ms",
                              }}
                            >{tab}</button>
                          ))}
                        </div>
                        {!linkReady ? (
                          <button onClick={() => setLinkReady(true)}
                            style={{ padding: "7px 0", fontFamily: mono, fontSize: 9.5, color: NAVY, background: "transparent", border: `1px solid ${NAVY}`, borderRadius: 0, cursor: "pointer", transition: "opacity 150ms" }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = "0.7"; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                          >Generate link</button>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontFamily: mono, fontSize: 9, color: T3, background: SURFACE_MUTED, border: `1px solid ${BORDER}`, padding: "5px 7px", wordBreak: "break-all", lineHeight: 1.5 }}>
                              {shareTab === "view" ? mockLink : mockEmbed}
                            </div>
                            <button onClick={() => handleCopy(shareTab === "view" ? mockLink : mockEmbed)}
                              style={{ padding: "5px 0", fontFamily: mono, fontSize: 9.5, color: copied ? "#2A7A4A" : T2, background: "transparent", border: `1px solid ${copied ? "#2A7A4A" : BORDER}`, borderRadius: 0, cursor: "pointer", transition: "all 200ms" }}>
                              {copied ? "Copied!" : "Copy"}
                            </button>
                            <span style={{ fontFamily: mono, fontSize: 8, color: T3 }}>Expires in 7 days</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${BORDER}`, margin: "2px 0" }} />

              {/* Quick Settings */}
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.09em", textTransform: "uppercase", color: T3 }}>
                  Quick Settings
                </span>

                {/* Audience */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: 5 }}>
                    Audience
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                    {AUDIENCE_OPTIONS.map(a => (
                      <button
                        key={a}
                        onClick={() => handleAudienceChange(a)}
                        style={{
                          gridColumn: a === "Custom" ? "1 / -1" : "auto",
                          padding: "4px 0",
                          fontFamily: mono, fontSize: 9,
                          color: buildAudience === a ? "#F5F2EA" : T2,
                          background: buildAudience === a ? NAVY : "transparent",
                          border: `1px solid ${buildAudience === a ? NAVY : BORDER}`,
                          borderRadius: 0, cursor: "pointer", transition: "all 120ms",
                        }}
                        onMouseEnter={e => { if (buildAudience !== a) e.currentTarget.style.background = SURFACE_MUTED; }}
                        onMouseLeave={e => { if (buildAudience !== a) e.currentTarget.style.background = "transparent"; }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  {/* Custom text input */}
                  <AnimatePresence>
                    {buildAudience === "Custom" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        style={{ overflow: "hidden" }}
                      >
                        <textarea
                          value={customText}
                          onChange={e => setCustomText(e.target.value)}
                          onBlur={() => { if (customText.trim()) handleAudienceChange("Custom"); }}
                          rows={2}
                          placeholder="Describe your audience…"
                          style={{
                            width: "100%", marginTop: 6,
                            fontFamily: mono, fontSize: 9.5, color: T2,
                            background: SURFACE_MUTED, border: `1px solid ${BORDER}`,
                            padding: "5px 8px", resize: "none",
                            outline: "none", lineHeight: 1.5,
                            boxSizing: "border-box",
                            transition: "border-color 150ms",
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = NAVY; }}
                          onBlurCapture={e => { e.currentTarget.style.borderColor = BORDER; }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Tone */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: "0.07em", textTransform: "uppercase", color: T3, marginBottom: 5 }}>
                    Tone
                  </div>
                  <div style={{ display: "flex", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                    {TONE_OPTIONS.map((t, i) => (
                      <button
                        key={t}
                        onClick={() => handleToneChange(t)}
                        style={{
                          flex: 1, padding: "4px 0",
                          fontFamily: mono, fontSize: 8.5, letterSpacing: "0.04em",
                          color: buildTone === t ? "#F5F2EA" : T2,
                          background: buildTone === t ? NAVY : "transparent",
                          border: "none",
                          borderRight: i < TONE_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                          cursor: "pointer", transition: "all 120ms",
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narration */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: mono, fontSize: 9.5, color: T2 }}>Narration</span>
                  <button
                    onClick={handleNarrationToggle}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    aria-label="Toggle narration"
                  >
                    <div style={{ position: "relative", width: 28, height: 15 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: buildNarration ? NAVY : BORDER, transition: "background 150ms" }} />
                      <div style={{ position: "absolute", top: 2.5, left: buildNarration ? 13 : 2.5, width: 10, height: 10, borderRadius: "50%", background: "#fff", transition: "left 150ms" }} />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* PresentMode overlay */}
      <AnimatePresence>
        {presentOpen && (
          <PresentMode
            slides={localSlides}
            currentIdx={presentIdx}
            onChangeIdx={setPresentIdx}
            onExit={() => setPresentOpen(false)}
            showNotes={showNotes}
            onToggleNotes={() => setShowNotes(v => !v)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
