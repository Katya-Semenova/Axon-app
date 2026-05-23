"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PresentMode } from "./PresentMode";
import { MiniChart } from "../MiniChart";
import { SlideArchetypeRenderer, inferArchetype, deriveSlideSummary } from "../presentation/SlideArchetypeRenderer";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide, BuildAudience, BuildTone, DataSet, BuildMessage, SlideArchetype } from "@/lib/types";
import { NON_CHART_ARCHETYPES } from "@/lib/types";
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

function getAudienceMessage(audience: BuildAudience, n: number, newOrder: string[], oldOrder: string[], customText: string): string {
  const reordered = newOrder.some((id, i) => id !== oldOrder[i]);
  switch (audience) {
    case "CEO":
      return `Switched to CEO view — slide order unchanged, already leading with the strongest signal. Narrative framing updated for brevity. ${n} slide${n !== 1 ? "s" : ""} total.`;
    case "Board":
      return reordered
        ? `Switched to Board view — moved slide 2 to position 1 as the KPI anchor. Remaining slides follow in supporting order. Structured for governance-level review.`
        : `Switched to Board view — KPI summary is already in position 1. Structured for governance-level review.`;
    case "Team":
      return reordered
        ? `Switched to Team view — reversed slide order to open with context and close on the headline. Full data visible throughout.`
        : `Switched to Team view — only one slide, nothing to reverse. Full detail visible.`;
    case "Investor":
      return `Switched to Investor view — slide order unchanged, growth vectors already lead. TAM framing and risk disclosure noted. ${n} slide${n !== 1 ? "s" : ""} total.`;
    case "Custom":
      return customText.trim()
        ? `Understood — reframing for "${customText.trim()}". Slide order unchanged. Tell me what to emphasise and I'll adjust.`
        : `Custom audience selected — describe your audience above and I'll adjust the framing. No reorder applied.`;
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
      return `Open slide ${serial} by citing the headline figure precisely — include the time period and the comparison baseline. Reference "${base}" as your evidence anchor. Allow a two-second pause after the key metric before advancing. Close by explicitly linking this finding to the recommendation on the following slide.`;
    case "Casual":
      return `Kick off with "Here's what happened with ${base}" and keep it tight. Point directly at the biggest number and say "this is the one that matters." Don't over-explain — let the visual carry the weight. Check the room before moving on, and ask if anyone wants to dig in.`;
    default:
      return `Lead with the main takeaway from "${base}." Name the trend clearly — diagnostic, root cause, or recovery path — then bridge to the slide before and after. Target 45–60 seconds. If the audience seems engaged, offer to expand before advancing.`;
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
  const updateSlide          = useWorkspaceStore(s => s.updateSlide);
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

  /* ── Canvas pan + zoom ── */
  const [panOffset,   setPanOffset]   = useState({ x: 0, y: 0 });
  const [zoom,        setZoom]        = useState(1);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning,   setIsPanning]   = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const panState         = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  /* Refs let the wheel handler always read the latest values without stale closures */
  const zoomRef        = useRef(1);
  const panRef         = useRef({ x: 0, y: 0 });
  const fitToScreenRef = useRef<() => void>(() => {});

  /* Spacebar → grab cursor; guards against firing inside chat/text inputs */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const active   = document.activeElement;
      const inInput  =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active as HTMLElement | null)?.isContentEditable;

      if (e.code === "Space") {
        if (inInput) return;
        e.preventDefault();
        setIsSpaceDown(true);
        return;
      }
      if (e.code === "Digit0" || e.code === "Numpad0") {
        if (inInput) return;
        e.preventDefault();
        fitToScreenRef.current();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      setIsSpaceDown(false);
      setIsPanning(false);
      panState.current = null;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, []);

  /* Sync refs every render so wheel handler never has stale values */
  zoomRef.current = zoom;
  panRef.current  = panOffset;

  /* Wheel → zoom (Cmd/Ctrl + scroll or trackpad pinch) */
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect    = el!.getBoundingClientRect();
      const cx      = e.clientX - rect.left;
      const cy      = e.clientY - rect.top;
      const prevZ   = zoomRef.current;
      const prevPan = panRef.current;
      const newZ    = Math.max(0.25, Math.min(2.0, prevZ * Math.pow(0.999, e.deltaY)));
      const ratio   = newZ / prevZ;
      const newPan  = { x: cx - ratio * (cx - prevPan.x), y: cy - ratio * (cy - prevPan.y) };
      zoomRef.current = newZ;
      panRef.current  = newPan;
      setZoom(newZ);
      setPanOffset(newPan);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* Global mouse-move / mouse-up drive the pan while active */
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!panState.current) return;
      setPanOffset({
        x: panState.current.startPanX + e.clientX - panState.current.startX,
        y: panState.current.startPanY + e.clientY - panState.current.startY,
      });
    }
    function onMouseUp() {
      if (!panState.current) return;
      panState.current = null;
      setIsPanning(false);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };
  }, []);

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

  /* ── Stream first message + archetype suggestions on mount ── */
  const streamedRef = useRef(false);
  useEffect(() => {
    if (streamedRef.current || buildMessages.length > 0) return;
    streamedRef.current = true;
    streamAxon(buildFirstMessage(localSlides, dataSetsById, buildAudience), addBuildMessage, updateBuildMessage, 400);

    /* Suggest alternative archetypes — read-only, never mutates slide state */
    setTimeout(() => {
      const suggestions: string[] = [];
      for (const slide of localSlides) {
        const ds = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
        if (!ds || !ds.rows.length) continue;
        const suggested = inferArchetype(ds.rows, ds.columns);
        const current   = slide.archetype ?? "Chart";
        if (suggested !== current) {
          const reason: Record<SlideArchetype, string> = {
            "Big Number":  "has a single metric",
            "Comparison":  "has exactly two comparable values",
            "Sentiment":   "has a binary positive/negative split",
            "Map":         "has geographic labels",
            "Word List":   "has a long ranked list",
            "Chart":       "has multi-series data",
            "Quote":       "has no data",
          };
          suggestions.push(`Slide ${slide.serial} ${reason[suggested] ?? "matches a pattern"} — ${suggested} might suit it. Use the Layout dropdown to switch.`);
        }
      }
      if (suggestions.length > 0) {
        streamAxon(suggestions.join(" "), addBuildMessage, updateBuildMessage, 1200);
      }
    }, 600);
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
    const oldOrder = [...localSlideOrder];
    const newOrder = rearrangeForAudience(localSlideOrder, a);
    setLocalSlideOrder(newOrder);
    if (newOrder[0] && newOrder[0] !== activeSlideId) setActiveSlide(newOrder[0]);
    setBuildAudience(a);
    streamAxon(getAudienceMessage(a, newOrder.length, newOrder, oldOrder, customText), addBuildMessage, updateBuildMessage);
  }

  function handleToneChange(t: BuildTone) {
    setBuildTone(t);
    if (buildNarration) {
      streamAxon(getToneMessage(t), addBuildMessage, updateBuildMessage);
    }
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

    /* archetype commands — "switch slide N to Big Number" etc. */
    const archMatch = lower.match(/(?:switch|change|set|use)\s+(?:slide\s+(\d+)\s+to\s+|to\s+)?(.+?)(?:\s+(?:layout|archetype|view))?$/);
    const ARCH_MAP: Record<string, SlideArchetype> = {
      "big number": "Big Number", "bignumber": "Big Number",
      "comparison": "Comparison", "compare": "Comparison",
      "sentiment": "Sentiment", "ratio": "Sentiment",
      "map": "Map", "geographic": "Map",
      "word list": "Word List", "wordlist": "Word List", "list": "Word List",
      "treemap": "Chart", "tree map": "Chart",
      "quote": "Quote", "insight": "Quote",
      "chart": "Chart",
    };
    if (archMatch) {
      const slideN   = archMatch[1] ? parseInt(archMatch[1]) : null;
      const archKey  = (archMatch[2] ?? "").trim().toLowerCase();
      const arch     = ARCH_MAP[archKey];
      if (arch) {
        const targets = slideN
          ? localSlides.filter(s => s.serial === slideN)
          : activeSlide ? [activeSlide] : [];
        if (targets.length) {
          setTimeout(() => {
            targets.forEach(s => updateSlide(s.id, { archetype: arch }));
            const label = targets.length === 1 ? `Slide ${targets[0].serial}` : `${targets.length} slides`;
            streamAxon(`Switched ${label} to ${arch}.`, addBuildMessage, updateBuildMessage);
          }, 400);
          return;
        }
      }
    }

    /* fallback */
    setTimeout(() => streamAxon(
      "Got it — I'd update the deck based on that. Full editing coming soon.",
      addBuildMessage, updateBuildMessage,
    ), 500);
  }

  /* Keep processRef current so the useEffect always calls the latest version */
  processRef.current = processUserMessage;

  function handleFitToScreen() {
    setIsResetting(true);
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    zoomRef.current = 1;
    panRef.current  = { x: 0, y: 0 };
    setTimeout(() => setIsResetting(false), 350);
  }
  fitToScreenRef.current = handleFitToScreen;

  function handleCanvasMouseDown(e: React.MouseEvent) {
    const isMiddleButton = e.button === 1;
    const isSpaceDrag    = isSpaceDown && e.button === 0;
    if (!isMiddleButton && !isSpaceDrag) return;
    e.preventDefault();
    setIsPanning(true);
    panState.current = { startX: e.clientX, startY: e.clientY, startPanX: panOffset.x, startPanY: panOffset.y };
  }

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
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button
              onClick={() => setMode("presentation")}
              style={{
                fontFamily: mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase",
                color: T3, background: "none", border: "none", cursor: "pointer",
                padding: 0, textDecoration: "none", transition: "text-decoration 100ms",
              }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; e.currentTarget.style.color = T2; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; e.currentTarget.style.color = T3; }}
            >
              Presentation
            </button>
            <span style={{ fontFamily: mono, fontSize: 10, color: T3, opacity: 0.45, userSelect: "none" }}>›</span>
            <span style={{
              fontFamily: mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY,
            }}>
              Build
            </span>
            {activeSlide && (
              <>
                <span style={{ fontFamily: mono, fontSize: 10, color: T3, opacity: 0.45, userSelect: "none" }}>›</span>
                <span style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
                  {serial} / {(activeDs?.title ?? "—").slice(0, 36)}
                </span>
              </>
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

            {/* Slide preview — viewport (clips panned content) */}
            <div
              ref={canvasViewportRef}
              style={{
                flex: 1, minHeight: 0, overflow: "hidden",
                position: "relative",
                cursor: isPanning ? "grabbing" : isSpaceDown ? "grab" : "default",
                userSelect: isPanning ? "none" : "auto",
              }}
              onMouseDown={handleCanvasMouseDown}
            >
              {/* Pan container — dotted grid rides the transform */}
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px 40px 16px",
                backgroundImage: "radial-gradient(circle, rgba(60,50,30,0.12) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                transition: isPanning ? "none" : isResetting ? "transform 300ms ease-out" : "transform 150ms ease-out",
                willChange: "transform",
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
                    <div style={{ flex: 1, minHeight: 0, padding: "16px 28px 12px" }}>
                      <SlideArchetypeRenderer
                        rows={activeDs.rows}
                        columns={activeDs.columns}
                        chartType={activeDs.chartType}
                        archetype={activeSlide.archetype ?? "Chart"}
                        accentColor={ACCENT[activeSlide.colorAccent] ?? NAVY}
                        title={activeDs.title}
                        narrative={activeSlide.narrative}
                        visualStyle={activeSlide.visualStyle}
                      />
                    </div>
                    {activeDs.rows.length > 0 && (
                      <div style={{
                        flexShrink: 0, padding: "6px 28px 10px",
                        borderTop: `1px solid rgba(27,40,64,0.08)`,
                        background: slideBg,
                      }}>
                        <span style={{
                          fontFamily: headFont, fontSize: 11, color: T3,
                          fontStyle: "italic", lineHeight: 1.4,
                        }}>
                          {deriveSlideSummary(activeDs.rows, activeDs.columns)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <span style={{ fontFamily: mono, fontSize: 11, color: T3 }}>
                  {localSlides.length === 0 ? "No slides — go back to Presentation Mode and add data sets." : "Select a slide below."}
                </span>
              )}
              </div>{/* end pan container */}

              {/* Zoom indicator + fit-to-screen button — absolute overlays, not transformed */}
              <div style={{
                position: "absolute", bottom: 16, right: 16,
                display: "flex", alignItems: "center", gap: 6,
                zIndex: 10,
              }}>
                <div style={{
                  fontFamily: mono, fontSize: 12, color: T2,
                  background: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(27,40,64,0.12)",
                  padding: "4px 9px",
                  userSelect: "none",
                  lineHeight: 1,
                }}>
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={handleFitToScreen}
                  title="Fit to screen"
                  style={{
                    width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(27,40,64,0.12)",
                    borderRadius: 0, cursor: "pointer",
                    color: T2, padding: 0,
                    transition: "background 150ms, border-color 150ms, color 150ms",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                    e.currentTarget.style.borderColor = NAVY;
                    e.currentTarget.style.color = NAVY;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                    e.currentTarget.style.borderColor = "rgba(27,40,64,0.12)";
                    e.currentTarget.style.color = T2;
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 5V1h4" />
                    <path d="M9 1h4v4" />
                    <path d="M13 9v4h-4" />
                    <path d="M5 13H1V9" />
                  </svg>
                </button>
              </div>

            </div>{/* end viewport */}

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
                          <MiniChart rows={ds.rows} chartType={ds.chartType} color={accentColor} W={78} H={36} />
                        </g>
                      )}
                      {ds && ds.rows.length > 0 && (
                        <text x="4" y="68" fontSize="3.8" fill={T3} fontFamily="Inter, sans-serif" fontStyle="italic">
                          {deriveSlideSummary(ds.rows, ds.columns).slice(0, 36)}
                        </text>
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
