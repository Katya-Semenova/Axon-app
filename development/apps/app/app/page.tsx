"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent, type DragOverEvent, type Modifier,
} from "@dnd-kit/core";

import { useWorkspaceStore } from "@/lib/store";
import { LandingPage } from "@/app/components/landing/LandingPage";
import { ChatRail } from "@/app/components/chat/ChatRail";
import { Canvas } from "@/app/components/canvas/Canvas";
import { InsightExpandedViewOverlay } from "@/app/components/canvas/InsightExpandedView";
import { DataSetExpandedViewOverlay } from "@/app/components/canvas/DataSetExpandedView";
import { SlideEditor, VisualizationStyleRail } from "@/app/components/presentation/SlideEditor";
import { PresentationStructure } from "@/app/components/presentation/PresentationStructure";
import { PresentExport } from "@/app/components/build/PresentExport";
import { ModeTabs } from "@/app/components/ui/ModeTabs";
import { OnboardingModal } from "@/app/components/ui/OnboardingModal";
import { DesktopOnlyNotice } from "@/app/components/ui/DesktopOnlyNotice";
import { BoardSync } from "@/app/components/BoardSync";
import { GuestSaveButton } from "@/app/components/GuestSaveButton";
import { GuestLoginButton } from "@/app/components/GuestLoginButton";
import { ToastProvider } from "@/app/components/ui/Toast";

/* ── Modifier: pin the DragOverlay top-left to the live cursor. ── */
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
   ────────────────────────────────────────────────────
   Three modes, all rendered inside the same shell
   (AI Chat Rail left, ModeTabs floating top-right):

     CANVAS  → store mode "data"          — node graph
     SLIDES  → store mode "presentation"  — slide editor
     PRESENT → store mode "build"         — export gateway

   Data set tray (PresentationStructure)
   shows in CANVAS + SLIDES, hidden in PRESENT.
══════════════════════════════════════════════════════ */
function Page2({ onBack, boardId, onBoardSaved }: { onBack: () => void; boardId: string | null; onBoardSaved: (id: string) => void }) {
  const mode               = useWorkspaceStore(s => s.mode);
  const addSlideWithDs     = useWorkspaceStore(s => s.addSlideWithDataSet);
  const bindDataSetToSlide = useWorkspaceStore(s => s.bindDataSetToSlide);
  const dataSetsById       = useWorkspaceStore(s => s.dataSetsById);
  const slideOrder         = useWorkspaceStore(s => s.slideOrder);
  const slidesById         = useWorkspaceStore(s => s.slidesById);
  const reorderSlide       = useWorkspaceStore(s => s.reorderSlide);
  const expandedDataSetId  = useWorkspaceStore(s => s.expandedDataSetId);
  const expandedInsightId  = useWorkspaceStore(s => s.expandedInsightId);
  /* Drill-in is a context within a mode — its own back-button is the only
     nav control. Hide the top-right CANVAS/SLIDES/PRESENT pill while it's open. */
  const drillInOpen        = !!(expandedDataSetId || expandedInsightId);

  const [activeDragDataSetId, setActiveDragDataSetId] = useState<string | null>(null);
  /* Slide reorder drag state */
  const [activeDragSlideId, setActiveDragSlideId] = useState<string | null>(null);
  const [dragOverSlideId,   setDragOverSlideId]   = useState<string | null>(null);

  /* 8 px drag activation prevents accidental drag on input/splitter clicks. */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { type?: string; dataSetId?: string; slideId?: string } | undefined;
    if (data?.type === "dataset") setActiveDragDataSetId(data.dataSetId ?? null);
    if (data?.type === "slide")   setActiveDragSlideId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as { type?: string } | undefined;
    if (activeData?.type === "slide") setDragOverSlideId(String(over.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeData = active.data.current as { type?: string; dataSetId?: string } | undefined;

    /* ── Slide reorder ── */
    if (activeData?.type === "slide") {
      if (over && over.id !== active.id) {
        const fromIdx = slideOrder.indexOf(String(active.id));
        const toIdx   = slideOrder.indexOf(String(over.id));
        if (fromIdx !== -1 && toIdx !== -1) reorderSlide(fromIdx, toIdx);
      }
      setActiveDragSlideId(null);
      setDragOverSlideId(null);
      return;
    }

    /* ── Dataset → slide binding ── */
    setActiveDragDataSetId(null);
    if (!over) return;

    if (activeData?.type === "dataset" && activeData.dataSetId) {
      const dataSetId = activeData.dataSetId;
      const overId    = String(over.id);
      /* Sortable slide IDs are plain slide IDs now (no "slide-slot:" prefix) */
      if (overId === "slide-slot:new") {
        addSlideWithDs(dataSetId);
      } else if (slidesById[overId]) {
        bindDataSetToSlide(overId, dataSetId);
      }
    }
  }

  const activeDs = activeDragDataSetId ? dataSetsById[activeDragDataSetId] : null;
  const t = useTranslations("SlideTray");
  const insertAt = (activeDragSlideId && dragOverSlideId)
    ? slideOrder.indexOf(dragOverSlideId) : null;

  const activeSlideGhost      = activeDragSlideId ? slidesById[activeDragSlideId] : null;
  const activeSlideGhostDsId  = activeSlideGhost?.dataSetIds[0] ?? null;
  const activeSlideGhostTitle = activeSlideGhostDsId
    ? (dataSetsById[activeSlideGhostDsId]?.title ?? t("emptySlide")) : t("emptySlide");

  /* Правый слот тулбара каждого режима: «Войти» (для разлогиненного — снимает тупик
     входа с холста; вариант А → onBack ведёт к «Мои проекты») + «Сохранить» (для гостя,
     сохраняет текущий холст; прячется, когда доска привязана). Каждая кнопка сама решает,
     показываться ли (по сессии / boardId). */
  const saveButton = (
    <>
      <GuestLoginButton onLoggedIn={onBack} />
      <GuestSaveButton boardId={boardId} onSaved={onBoardSaved} />
    </>
  );

  /* Surface mounted per mode */
  const Surface = mode === "data"
    ? <Canvas saveButton={saveButton} />
    : mode === "presentation"
    ? <SlideEditor saveButton={saveButton} />
    : <PresentExport boardId={boardId} onBoardSaved={onBoardSaved} saveButton={saveButton} />;

  /* Data set tray — CANVAS + SLIDES only. Hidden in PRESENT (export gateway). */
  const showDataSetTray = mode === "data" || mode === "presentation";

  return (
    <DndContext sensors={sensors} modifiers={[snapToPointer]} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex h-screen max-h-screen overflow-hidden bg-bg animate-fade-in">

        {/* ── Left: AI Chat Rail — always visible across all three modes ── */}
        <ChatRail onBack={onBack} />

        {/* ── Узкий экран (<lg): воркспейс рассчитан на десктоп — показываем
            аккуратную заглушку вместо «сжатого» десктопа (как Figma/Miro). ── */}
        <DesktopOnlyNotice onBack={onBack} />

        {/* ── Right column — main surface ──
            In SLIDES mode the Visualization Style rail is a full-height right
            column: the surface + tray stack in the left sub-column (so the tray
            is narrower), and the rail spans the whole height beside them. */}
        <div className="flex-1 min-w-0 min-h-0 relative flex flex-row overflow-hidden">

          {/* Mode switcher — rendered ONCE here, absolutely centered over the FULL
              right column (surface + any rail) so it sits in the same spot in every
              mode and never jumps. Lives in the 64px toolbar band; pointer-events
              pass through everywhere except the tabs themselves. Hidden in drill-in. */}
          {!drillInOpen && (
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 64,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none", zIndex: 5,
              }}
            >
              <div style={{ pointerEvents: "auto" }}>
                <ModeTabs variant="bar" />
              </div>
            </div>
          )}

          {/* Left sub-column — surface + bottom tray */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {Surface}

            {/* Bottom data set tray — CANVAS + SLIDES only */}
            {showDataSetTray && <PresentationStructure insertAt={insertAt} isDraggingSlide={!!activeDragSlideId} />}
          </div>

          {/* Full-height Visualization Style rail — SLIDES mode only */}
          {mode === "presentation" && slideOrder.length > 0 && <VisualizationStyleRail />}

          {/* Expanded overlays — fire on demand inside any mode */}
          <InsightExpandedViewOverlay />
          <DataSetExpandedViewOverlay />
          <OnboardingModal />
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
        ) : activeSlideGhost ? (
          <div style={{
            width: 116, height: 76,
            background: "#1B2840", borderRadius: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            opacity: 0.88, boxShadow: "0 8px 24px rgba(27,40,64,0.4)",
            pointerEvents: "none", userSelect: "none",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
              color: "rgba(245,242,234,0.45)", letterSpacing: "0.08em", marginBottom: 5,
            }}>
              {String(activeSlideGhost.serial).padStart(2, "0")}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: "#F5F2EA", textAlign: "center",
              padding: "0 10px", lineHeight: 1.45,
            }}>
              {activeSlideGhostTitle.length > 22
                ? activeSlideGhostTitle.slice(0, 22) + "…"
                : activeSlideGhostTitle}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════ */
export default function Home() {
  const [view, setView] = useState<"landing" | "workspace">("landing");
  /* Доска, открытая в воркспейсе (Шаг 7). null — гостевой холст в памяти. */
  const [boardId, setBoardId] = useState<string | null>(null);

  const openWorkspace = (id: string | null) => {
    setBoardId(id);
    setView("workspace");
  };

  return (
    <ToastProvider>
      <BoardSync boardId={boardId} />
      {view === "landing"
        ? <LandingPage onNavigate={openWorkspace} />
        : (
          <Page2 onBack={() => setView("landing")} boardId={boardId} onBoardSaved={setBoardId} />
        )}
    </ToastProvider>
  );
}
