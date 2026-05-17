"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useWorkspaceStore, selectSlides } from "@/lib/store";
import { MiniChart } from "../MiniChart";
import type { Slide, VisualStyle } from "@/lib/types";
import { BORDER, NAVY, GOLD, T3, SURFACE_RAISE } from "../ui/tokens";

const SLIDES_PER_PAGE = 4;
const mono = "'JetBrains Mono', monospace";

const STYLE_BG: Record<VisualStyle, string> = {
  Modern:    "#FBF9F3",
  Magazine:  "#FBF9F3",
  Wireframe: "#F5F2EA",
};
const STYLE_HEADLINE_FONT: Record<VisualStyle, string> = {
  Modern:    "Inter, sans-serif",
  Magazine:  "'Instrument Serif', Georgia, serif",
  Wireframe: "'JetBrains Mono', monospace",
};

/* ── Droppable slide slot ─────────────────────────────────────────────── */
function SlideSlot({ slide, isActive, onClick, onDelete }: {
  slide: Slide;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const ds           = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;

  const { setNodeRef, isOver } = useDroppable({
    id: `slide-slot:${slide.id}`,
    data: { type: "slide-slot", slideId: slide.id },
  });

  const serial   = String(slide.serial).padStart(2, "0");
  const headline = (ds?.title ?? "Untitled").slice(0, 28) + ((ds?.title ?? "").length > 28 ? "…" : "");
  const bg       = STYLE_BG[slide.visualStyle];
  const headFont = STYLE_HEADLINE_FONT[slide.visualStyle];

  const wireDots = slide.visualStyle === "Wireframe"
    ? Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 13 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 8} cy={32 + row * 7} r="0.6" fill={T3} fillOpacity="0.45" />
        ))
      ).flat()
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{ position: "relative", aspectRatio: "116 / 76" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={onClick}
        className="cursor-pointer overflow-hidden"
        style={{
          width: "100%", height: "100%", borderRadius: 0,
          border: `${isActive ? "1.5px" : "1px"} solid ${isOver ? GOLD : isActive ? NAVY : hovered ? GOLD : BORDER}`,
          background: isOver ? "rgba(184,149,72,0.06)" : bg,
          transition: "border-color 150ms ease, background 150ms ease",
        }}
      >
        <svg viewBox="0 0 116 76" fill="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="116" height="76" fill={bg} />
          {wireDots}
          <text x="6" y="11" fontSize="5" fontWeight="500" fill={T3} fontFamily={mono} letterSpacing="0.08em">{serial} /</text>
          <text x="6" y={slide.visualStyle === "Magazine" ? 23 : 21}
            fontSize={slide.visualStyle === "Magazine" ? 7.5 : 6.5}
            fontWeight={slide.visualStyle === "Magazine" ? "600" : "500"}
            fill="#0A0A0A" fontFamily={headFont}>{headline}</text>
          {ds && (
            <g transform="translate(6, 30)">
              <MiniChart rows={ds.rows} chartType={ds.chartType} color={NAVY} W={104} H={34} />
            </g>
          )}
        </svg>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Remove slide"
        style={{
          position: "absolute", top: 3, right: 3, width: 15, height: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
          borderRadius: 0, cursor: "pointer", color: T3, padding: 0,
          opacity: hovered ? 1 : 0, transition: "opacity 150ms ease",
          zIndex: 2,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
        onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
      >
        <svg width="6" height="6" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M1 1l6 6M7 1L1 7" />
        </svg>
      </button>
    </div>
  );
}

/* ── "+ SLIDE" droppable placeholder ─────────────────────────────────── */
function NewSlideSlot() {
  const { setNodeRef, isOver } = useDroppable({
    id: "slide-slot:new",
    data: { type: "slide-slot", slideId: null },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        aspectRatio: "116 / 76",
        border: `1.5px dashed ${isOver ? GOLD : BORDER}`,
        background: isOver ? "rgba(184,149,72,0.06)" : "transparent",
        borderRadius: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 150ms ease, background 150ms ease",
        cursor: "default",
      }}
    >
      <div className="flex flex-col items-center gap-1" style={{ color: isOver ? GOLD : T3 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 2v8M2 6h8" />
        </svg>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em" }}>+ SLIDE</span>
      </div>
    </div>
  );
}

/* ── PresentationStructure ─────────────────────────────────────────────
   Bottom strip in Data Mode: paginated slide thumbnails with droppable
   slots (DataSet cards can be dropped here via dnd-kit). No settings
   panel — that lives in SlideEditor (Presentation Mode only).           */
export function PresentationStructure() {
  const slides       = useWorkspaceStore(selectSlides);
  const activeSlideId = useWorkspaceStore(s => s.activeSlideId);
  const setActive    = useWorkspaceStore(s => s.setActiveSlide);
  const removeSlide  = useWorkspaceStore(s => s.removeSlide);

  const [page, setPage]         = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter             = useRef(0);
  const prevLenRef              = useRef(slides.length);

  const totalPages = Math.max(1, Math.ceil(slides.length / SLIDES_PER_PAGE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageSlides = slides.slice(safePage * SLIDES_PER_PAGE, (safePage + 1) * SLIDES_PER_PAGE);

  useEffect(() => {
    if (slides.length > prevLenRef.current) {
      setPage(Math.floor((slides.length - 1) / SLIDES_PER_PAGE));
    }
    prevLenRef.current = slides.length;
  }, [slides.length]);

  function handleRemove(id: string) {
    removeSlide(id);
    if (activeSlideId === id) {
      const remaining = slides.filter(s => s.id !== id);
      setActive(remaining[0]?.id ?? null);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  }
  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  return (
    <section
      className="shrink-0 flex border-t"
      style={{
        height: 136,
        borderColor: isDragOver ? GOLD : BORDER,
        background: "#EDE9E0",
        transition: "border-color 150ms ease",
      }}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; setIsDragOver(false); }}
    >
      {/* Strip header */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 px-5 pt-2 pb-1">
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>Presentation</span>
          <span style={{ fontFamily: mono, fontSize: 9, color: T3, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "1px 7px" }}>
            {slides.length}
          </span>
        </div>

        {/* Thumbnails */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            alignContent: "center",
            gap: 8,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 4,
            paddingBottom: 0,
            overflow: "hidden",
          }}
        >
          {pageSlides.map(slide => (
            <SlideSlot
              key={slide.id}
              slide={slide}
              isActive={activeSlideId === slide.id}
              onClick={() => setActive(slide.id)}
              onDelete={() => handleRemove(slide.id)}
            />
          ))}
          {/* Show "+ SLIDE" slot if last page and fewer than 4 thumbnails */}
          {safePage === totalPages - 1 && pageSlides.length < SLIDES_PER_PAGE && (
            <NewSlideSlot />
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "4px 0 6px", flexShrink: 0 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))}
            style={{ fontFamily: mono, fontSize: 9.5, color: T3, background: "none", border: "none", cursor: safePage === 0 ? "default" : "pointer", opacity: safePage === 0 ? 0.35 : 1, padding: "2px 6px" }}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              style={{
                fontFamily: mono, fontSize: 9.5, width: 20, height: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 2, border: "none", cursor: "pointer",
                background: i === safePage ? NAVY : "transparent",
                color: i === safePage ? "#F5F2EA" : T3,
                transition: "background 150ms, color 150ms",
              }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            style={{ fontFamily: mono, fontSize: 9.5, color: T3, background: "none", border: "none", cursor: safePage >= totalPages - 1 ? "default" : "pointer", opacity: safePage >= totalPages - 1 ? 0.35 : 1, padding: "2px 6px" }}>
            Next →
          </button>
        </div>
      </div>
    </section>
  );
}

