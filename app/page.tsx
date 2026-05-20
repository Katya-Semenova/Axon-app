"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, type Modifier,
} from "@dnd-kit/core";

import { useWorkspaceStore } from "@/lib/store";
import { LandingPage } from "@/app/components/landing/LandingPage";
import { ChatRail } from "@/app/components/chat/ChatRail";
import { Canvas } from "@/app/components/canvas/Canvas";
import { InsightExpandedViewOverlay } from "@/app/components/canvas/InsightExpandedView";
import { DataSetExpandedViewOverlay } from "@/app/components/canvas/DataSetExpandedView";
import { SlideEditor } from "@/app/components/presentation/SlideEditor";
import { PresentationStructure } from "@/app/components/presentation/PresentationStructure";
import { PresentMode } from "@/app/components/build/PresentMode";
import { ModeTabs } from "@/app/components/ui/ModeTabs";

/* ── Modifier: pin the DragOverlay top-left to the live cursor position. */
const snapToPointer: Modifier = ({ activatorEvent, draggingNodeRect, transform }) => {
  if (draggingNodeRect && activatorEvent) {
    const { clientX, clientY } = activatorEvent as PointerEvent;
    return {
      ...transform,
      x: transform.x + clientX - draggingNodeRect.left,
      y: transform.y + clientY - draggingNodeRect.top,
    };
  }
  return transform;
};

/* ══════════════════════════════════════════════════════
   PAGE 2 — WORKSPACE
   Three-mode workflow: CANVAS · SLIDES · PRESENT
   ────────────────────────────────────────────────────
   CANVAS  → store mode "data"          — node graph
   SLIDES  → store mode "presentation"  — slide editor + splitter + thumb rail
   PRESENT → presentOpen overlay        — fullscreen playback, no chrome
══════════════════════════════════════════════════════ */
function Page2({ onBack }: { onBack: () => void }) {
  const mode               = useWorkspaceStore(s => s.mode);
  const slideOrder         = useWorkspaceStore(s => s.slideOrder);
  const slidesById         = useWorkspaceStore(s => s.slidesById);
  const addSlideWithDs     = useWorkspaceStore(s => s.addSlideWithDataSet);
  const bindDataSetToSlide = useWorkspaceStore(s => s.bindDataSetToSlide);
  const dataSetsById       = useWorkspaceStore(s => s.dataSetsById);

  const [activeDragDataSetId, setActiveDragDataSetId] = useState<string | null>(null);

  /* ── Present mode (fullscreen overlay) lives at page level so it can
        suppress every surrounding rail/panel. ── */
  const [presentOpen, setPresentOpen] = useState(false);
  const [presentIdx,  setPresentIdx]  = useState(0);
  const [showNotes,   setShowNotes]   = useState(false);

  function openPresent() {
    /* PRESENT tab is disabled if there are no slides; this is also guarded
       inside ModeTabs by the parent passing the boolean. */
    if (slideOrder.length === 0) return;
    setPresentIdx(0);
    setPresentOpen(true);
  }

  const presentSlides = slideOrder.map(id => slidesById[id]).filter(Boolean);

  /* 8 px drag activation prevents accidental drag on input/splitter clicks. */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type?: string; dataSetId?: string } | undefined;
    if (data?.type === "dataset") setActiveDragDataSetId(data.dataSetId ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragDataSetId(null);
    if (!over) return;

    const activeData = active.data.current as { type?: string; dataSetId?: string } | undefined;
    const overId     = String(over.id);

    if (activeData?.type === "dataset" && activeData.dataSetId) {
      const dataSetId = activeData.dataSetId;
      if (overId === "slide-slot:new") {
        addSlideWithDs(dataSetId);
      } else if (overId.startsWith("slide-slot:")) {
        const slideId = overId.replace("slide-slot:", "");
        bindDataSetToSlide(slideId, dataSetId);
      }
    }
  }

  const activeDs = activeDragDataSetId ? dataSetsById[activeDragDataSetId] : null;

  /* Rail visibility — driven purely by the three modes. */
  const showChat  = !presentOpen;                          // hide in PRESENT only
  const showRail  = mode === "presentation" && !presentOpen; // SLIDES only
  const showTabs  = !presentOpen;                          // hidden during fullscreen playback

  return (
    <DndContext sensors={sensors} modifiers={[snapToPointer]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen max-h-screen overflow-hidden bg-bg animate-fade-in">

        {/* ── Left: AI Chat Rail (hidden in PRESENT) ── */}
        {showChat && <ChatRail onBack={onBack} />}

        {/* ── Mobile top bar ── */}
        <div className="lg:hidden flex items-center justify-between px-4 py-[14px] border-b border-border bg-card shrink-0 fixed top-0 left-0 right-0 z-30">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
          <button
            onClick={onBack}
            className="flex items-center gap-[5px] font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back
          </button>
        </div>

        {/* ── Right column — main surface ── */}
        <div className="flex-1 min-w-0 min-h-0 relative flex flex-col overflow-hidden">

          {/* Floating top-right nav tabs */}
          {showTabs && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                zIndex: 25,
              }}
            >
              <ModeTabs presentActive={presentOpen} onPresent={openPresent} />
            </div>
          )}

          {/* Main surface — CANVAS or SLIDES editor */}
          {mode === "data"
            ? <Canvas />
            : <SlideEditor />
          }

          {/* Bottom presentation strip — SLIDES only */}
          {showRail && <PresentationStructure />}

          {/* Expanded overlays */}
          <InsightExpandedViewOverlay />
          <DataSetExpandedViewOverlay />
        </div>
      </div>

      {/* Drag ghost */}
      <DragOverlay dropAnimation={null}>
        {activeDs ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "#1B2840", color: "#F5F2EA",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            padding: "6px 14px 6px 10px",
            borderRadius: 3, whiteSpace: "nowrap",
            opacity: 0.93, boxShadow: "0 6px 18px rgba(27,40,64,0.35)",
            pointerEvents: "none", userSelect: "none",
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="#F5F2EA" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, flexShrink: 0 }}>
              <path d="M1.5 6V4.5a.8.8 0 0 1 1.6 0V5.5" />
              <path d="M3.1 6.5V2.5a.85.85 0 0 1 1.7 0V6" />
              <path d="M4.8 6V2a.85.85 0 0 1 1.7 0v4" />
              <path d="M6.5 6.5V3a.85.85 0 0 1 1.7 0v3.5" />
              <path d="M1.5 6C1.3 9.8 2.5 11.5 5 11.5S8.5 9.8 8.2 6.5" />
            </svg>
            {activeDs.title.length > 36 ? activeDs.title.slice(0, 36) + "…" : activeDs.title}
          </div>
        ) : null}
      </DragOverlay>

      {/* ── PRESENT mode — fullscreen overlay, suppresses every rail ── */}
      <AnimatePresence>
        {presentOpen && presentSlides.length > 0 && (
          <PresentMode
            slides={presentSlides}
            currentIdx={presentIdx}
            onChangeIdx={setPresentIdx}
            onExit={() => setPresentOpen(false)}
            showNotes={showNotes}
            onToggleNotes={() => setShowNotes(v => !v)}
          />
        )}
      </AnimatePresence>
    </DndContext>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function Home() {
  const [view, setView] = useState<"landing" | "workspace">("landing");
  return view === "landing"
    ? <LandingPage onNavigate={() => setView("workspace")} />
    : <Page2 onBack={() => setView("landing")} />;
}
