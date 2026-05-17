"use client";

import { useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useWorkspaceStore } from "@/lib/store";
import { LandingPage } from "@/app/components/landing/LandingPage";
import { ChatRail } from "@/app/components/chat/ChatRail";
import { Canvas } from "@/app/components/canvas/Canvas";
import { InsightExpandedViewOverlay } from "@/app/components/canvas/InsightExpandedView";
import { DataSetExpandedViewOverlay } from "@/app/components/canvas/DataSetExpandedView";
import { SlideEditor } from "@/app/components/presentation/SlideEditor";
import { PresentationStructure } from "@/app/components/presentation/PresentationStructure";

/* ══════════════════════════════════════════════════════
   PAGE 2 — WORKSPACE
══════════════════════════════════════════════════════ */
function Page2({ onBack }: { onBack: () => void }) {
  const mode            = useWorkspaceStore(s => s.mode);
  const addSlideWithDs  = useWorkspaceStore(s => s.addSlideWithDataSet);
  const bindDataSetToSlide = useWorkspaceStore(s => s.bindDataSetToSlide);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
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

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-bg animate-fade-in">
        <ChatRail onBack={onBack} />

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

        {/* ── Right column — canvas / editor + strip ── */}
        <div className="flex-1 min-w-0 relative flex flex-col h-screen overflow-hidden">
          {mode === "data"
            ? <Canvas />
            : <SlideEditor />
          }
          {mode === "data" && <PresentationStructure />}

          {/* Expanded-view overlays — absolute, cover right column */}
          <InsightExpandedViewOverlay />
          <DataSetExpandedViewOverlay />
        </div>
      </div>
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
