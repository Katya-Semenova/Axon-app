"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide, VisualStyle } from "@/lib/types";
import { MiniChart } from "../MiniChart";
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

/* ── InsertionLine ────────────────────────────────────────────────────────
   2 px navy vertical bar rendered between thumbnails during slide reorder.  */
function InsertionLine() {
  return (
    <div style={{
      width: 2, alignSelf: "stretch", flexShrink: 0,
      background: NAVY, borderRadius: 1,
    }} />
  );
}

/* ── SlideSlot ────────────────────────────────────────────────────────────
   Shows either a fully populated thumbnail (has a linked DataSet) or an
   "empty" dashed-border state (no dataSetIds yet) with a drop-here hint.  */
function SlideSlot({ slide, isActive, onClick, onDelete, isDraggingSlide }: {
  slide: Slide;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  isDraggingSlide: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const ds           = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
  const isEmpty      = !ds || ds.rows.length === 0;

  const {
    setNodeRef, attributes, listeners,
    transform, transition, isDragging, isOver,
  } = useSortable({
    id:   slide.id,
    data: { type: "slide", slideId: slide.id },
  });

  const serial   = String(slide.serial).padStart(2, "0");
  const headline = ds ? (ds.title.length > 28 ? ds.title.slice(0, 28) + "…" : ds.title) : "Empty slide";
  const bg       = STYLE_BG[slide.visualStyle];
  const headFont = STYLE_HEADLINE_FONT[slide.visualStyle];

  const wireDots = slide.visualStyle === "Wireframe"
    ? Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 13 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={6 + col * 8} cy={32 + row * 7} r="0.6" fill={T3} fillOpacity="0.45" />
        ))
      ).flat()
    : null;

  /* Gold drop highlight only for dataset drags — not during slide reorder */
  const showDropHighlight = isOver && !isDraggingSlide;
  const borderColor = showDropHighlight ? GOLD : isActive ? NAVY : hovered ? GOLD : BORDER;
  const borderWidth = showDropHighlight ? "2px" : isActive ? "1.5px" : "1px";
  const borderStyle = isEmpty && !showDropHighlight ? "dashed" : "solid";

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative", aspectRatio: "116 / 76",
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        onClick={onClick}
        className="overflow-hidden"
        style={{
          width: "100%", height: "100%", borderRadius: 0,
          border: `${borderWidth} ${borderStyle} ${borderColor}`,
          background: showDropHighlight ? "rgba(184,149,72,0.13)" : bg,
          boxShadow: showDropHighlight ? `inset 0 0 0 1px rgba(184,149,72,0.25)` : "none",
          transition: "border-color 120ms ease, background 120ms ease, box-shadow 120ms ease",
        }}
      >
        <svg viewBox="0 0 116 76" fill="none" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="116" height="76" fill={bg} />
          {wireDots}
          <text x="6" y="11" fontSize="5" fontWeight="500" fill={T3} fontFamily={mono} letterSpacing="0.08em">{serial} /</text>
          {isEmpty ? (
            <>
              <text x="58" y="36" textAnchor="middle" fontSize="6" fill={T3} fontFamily={mono} fillOpacity="0.7">
                {showDropHighlight ? "Drop here" : "Drop a Data Set"}
              </text>
              <text x="58" y="45" textAnchor="middle" fontSize="5.5" fill={T3} fontFamily={mono} fillOpacity="0.5">to populate</text>
            </>
          ) : (
            <>
              <text x="6" y={slide.visualStyle === "Magazine" ? 23 : 21}
                fontSize={slide.visualStyle === "Magazine" ? 7.5 : 6.5}
                fontWeight={slide.visualStyle === "Magazine" ? "600" : "500"}
                fill="#0A0A0A" fontFamily={headFont}>{headline}</text>
              {ds && ds.rows.length > 0 && (
                <g transform="translate(6, 30)">
                  <MiniChart rows={ds.rows} chartType={ds.chartType} color={NAVY} W={104} H={34} />
                </g>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Delete — stopPropagation on pointerDown prevents drag from activating */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onPointerDown={(e) => e.stopPropagation()}
        title="Remove slide"
        style={{
          position: "absolute", top: 3, right: 3, width: 15, height: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
          borderRadius: 0, cursor: "pointer", color: T3, padding: 0,
          opacity: hovered || isEmpty ? 1 : 0, transition: "opacity 150ms ease",
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

/* ── "+ NEW DATA SET" slot ────────────────────────────────────────────────
   Same visual language as NewSlideSlot. Creates a dataset and auto-pairs
   it with a new slide — the slide appears in the tray immediately.         */
function NewDataSetSlot({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const accent = hovered ? GOLD : T3;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        aspectRatio: "116 / 76",
        border: `1.5px dashed ${accent}`,
        background: hovered ? "rgba(184,149,72,0.06)" : "transparent",
        borderRadius: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "border-color 150ms ease, background 150ms ease",
        cursor: "pointer",
      }}
    >
      <div className="flex flex-col items-center gap-1" style={{ color: accent, transition: "color 150ms" }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 2v8M2 6h8" />
        </svg>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em" }}>+ NEW DATA SET</span>
      </div>
    </div>
  );
}

/* ── PresentationStructure ────────────────────────────────────────────────
   Bottom strip in Data Mode: paginated slide thumbnails.                  */
export function PresentationStructure({ insertAt, isDraggingSlide }: {
  insertAt: number | null;
  isDraggingSlide: boolean;
}) {
  const mode          = useWorkspaceStore(s => s.mode);
  const slideOrder    = useWorkspaceStore(s => s.slideOrder);
  const slidesById    = useWorkspaceStore(s => s.slidesById);
  const slides        = slideOrder.map(id => slidesById[id]).filter(Boolean) as Slide[];
  const activeSlideId = useWorkspaceStore(s => s.activeSlideId);
  const setActive     = useWorkspaceStore(s => s.setActiveSlide);
  const removeSlide   = useWorkspaceStore(s => s.removeSlide);
  const addDataSet    = useWorkspaceStore(s => s.addDataSet);

  const [page, setPage] = useState(0);
  const prevLenRef      = useRef(slides.length);

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

  return (
    <section
      className="shrink-0 flex border-t"
      style={{
        height: 164,
        borderColor: BORDER,
        background: "#EDE9E0",
      }}
    >
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 shrink-0 px-5 pt-2 pb-1">
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>
            {mode === "presentation" ? "Slides tray" : "Data set tray"}
          </span>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3, opacity: 0.55, userSelect: "none" }}>·</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>
            {slides.length}
          </span>
        </div>

        {/* Thumbnails row — fixed-width items prevent aspect-ratio overflow */}
        <SortableContext
          items={pageSlides.map(s => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div style={{
            flex: 1, display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 20, paddingRight: 20,
            paddingTop: 4, paddingBottom: 6,
            overflow: "hidden",
          }}>
            {/* Translate global insertAt to a page-local index */}
            {(() => {
              const pageInsertAt = insertAt !== null
                ? insertAt - safePage * SLIDES_PER_PAGE : null;

              const items: ReactNode[] = pageSlides.flatMap((slide, i) => {
                const nodes: ReactNode[] = [];
                if (pageInsertAt !== null && i === pageInsertAt) {
                  nodes.push(<InsertionLine key="__ins__" />);
                }
                nodes.push(
                  <div key={slide.id} style={{ width: 116, flexShrink: 0 }}>
                    <SlideSlot
                      slide={slide}
                      isActive={activeSlideId === slide.id}
                      onClick={() => setActive(slide.id)}
                      onDelete={() => handleRemove(slide.id)}
                      isDraggingSlide={isDraggingSlide}
                    />
                  </div>
                );
                return nodes;
              });

              /* Trailing insertion line — drop target is after the last slide */
              if (pageInsertAt !== null && pageInsertAt >= pageSlides.length) {
                items.push(<InsertionLine key="__ins_trail__" />);
              }

              return items;
            })()}

            {/* + New data set — always the last item on the final page */}
            {safePage === totalPages - 1 && pageSlides.length < SLIDES_PER_PAGE && (
              <div style={{ width: 116, flexShrink: 0 }}>
                <NewDataSetSlot onClick={addDataSet} />
              </div>
            )}
          </div>
        </SortableContext>

        {/* Pagination */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "3px 0 5px", flexShrink: 0 }}>
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
