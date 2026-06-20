"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide } from "@/lib/types";
import { MiniChart } from "../MiniChart";
import { useTranslations } from "next-intl";
import { BORDER, NAVY, GOLD, T3, SURFACE_RAISE } from "../ui/tokens";

const mono = "'JetBrains Mono', monospace";

/* Slide thumbnails use a single neutral surface/font now — per-slide
   visualStyle removed in Шаг 6b (oformление is deck-wide via the theme). */
const THUMB_BG   = "#FBF9F3";
const THUMB_FONT = "Inter, sans-serif";

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
  const t = useTranslations("SlideTray");
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
  const headline = ds ? (ds.title.length > 28 ? ds.title.slice(0, 28) + "…" : ds.title) : t("emptySlide");
  const bg       = THUMB_BG;
  const headFont = THUMB_FONT;

  /* Gold drop highlight only for dataset drags — not during slide reorder */
  const showDropHighlight = isOver && !isDraggingSlide;
  const borderColor = showDropHighlight ? GOLD : isActive ? NAVY : hovered ? GOLD : BORDER;
  const borderWidth = showDropHighlight ? "2px" : isActive ? "1.5px" : "1px";
  const borderStyle = !ds && !showDropHighlight ? "dashed" : "solid";

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
          <text x="6" y="11" fontSize="5" fontWeight="500" fill={T3} fontFamily={mono} letterSpacing="0.08em">{serial} /</text>

          {/* Dataset title — always shown whenever a dataset is linked */}
          {ds && (
            <text
              x="6"
              y={21}
              fontSize={6.5}
              fontWeight="500"
              fill="#0A0A0A"
              fontFamily={headFont}
            >
              {headline}
            </text>
          )}

          {/* Content area: drop hint / no-data notice / MiniChart */}
          {!ds ? (
            /* No dataset linked yet */
            <>
              <text x="58" y="36" textAnchor="middle" fontSize="6" fill={T3} fontFamily={mono} fillOpacity="0.7">
                {showDropHighlight ? t("dropHere") : t("dropDataSet")}
              </text>
              <text x="58" y="45" textAnchor="middle" fontSize="5.5" fill={T3} fontFamily={mono} fillOpacity="0.5">{t("toPopulate")}</text>
            </>
          ) : ds.rows.length === 0 ? (
            /* Dataset linked but no chart rows — Quote slide shows narrative snippet */
            slide.archetype === "Quote" && slide.narrative?.trim() ? (
              <>
                <text x="7" y="34" fontSize="10" fontFamily="Georgia, serif" fill={T3} fillOpacity="0.35">&ldquo;</text>
                <foreignObject x={13} y={27} width={97} height={44}>
                  <div
                    // @ts-ignore — xmlns needed for SVG foreignObject in React
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: "4.5px",
                      fontStyle: "italic",
                      color: "#1B2840",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical",
                    } as React.CSSProperties}
                  >
                    {slide.narrative!.trim()}
                  </div>
                </foreignObject>
              </>
            ) : (
              <text x="58" y="50" textAnchor="middle" fontSize="5.5" fill={T3} fontFamily={mono} fillOpacity="0.5">{t("noChartData")}</text>
            )
          ) : (
            /* Fully populated */
            <g transform="translate(6, 30)">
              <MiniChart rows={ds.rows} chartType={ds.chartType} color={NAVY} W={104} H={34} />
            </g>
          )}
        </svg>
      </div>

      {/* Delete — stopPropagation on pointerDown prevents drag from activating */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        onPointerDown={(e) => e.stopPropagation()}
        title={t("removeSlide")}
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

/* (NewDataSetSlot removed in Шаг 5b — «+ Новый дата-сет» плодил пустой
   узел-тупик; данные теперь заводятся файлом на Холсте. См. screens/slides.md.) */

/* ── AddSlideSlot (Slides rework Шаг 5a) ──────────────────────────────────
   «+ Слайд» tile at the end of the slides tray. Click opens an upward popover
   listing Canvas data sets NOT yet on any slide; pick → new slide. New data
   is added via a file on Canvas, never an empty placeholder node.          */
function AddSlideSlot({ dataSets, onPick }: {
  dataSets: { id: string; title: string }[];
  onPick: (id: string) => void;
}) {
  const t = useTranslations("SlideTray");
  const [hovered, setHovered] = useState(false);
  const [open, setOpen]       = useState(false);
  const [rect, setRect]       = useState<DOMRect | null>(null);
  const tileRef               = useRef<HTMLDivElement>(null);
  const accent = (hovered || open) ? GOLD : T3;

  function toggle() {
    if (!open && tileRef.current) setRect(tileRef.current.getBoundingClientRect());
    setOpen(v => !v);
  }

  return (
    <>
      <div
        ref={tileRef}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          aspectRatio: "116 / 76",
          border: `1.5px dashed ${accent}`,
          background: (hovered || open) ? "rgba(184,149,72,0.06)" : "transparent",
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
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.08em" }}>{t("addSlide")}</span>
        </div>
      </div>

      {open && rect && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{
            /* Opens upward — the tray sits at the bottom of the screen. */
            position: "fixed",
            left: rect.left,
            bottom: window.innerHeight - rect.top + 6,
            minWidth: 200, maxWidth: "calc(100vw - 16px)",
            zIndex: 9999, padding: "4px 0",
            background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
            borderRadius: 2, boxShadow: "0 4px 12px rgba(27,40,64,0.12)",
            maxHeight: "50vh", overflowY: "auto",
          }}>
            <div style={{
              fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase",
              color: T3, padding: "5px 12px 6px",
            }}>
              {t("pickDataSet")}
            </div>
            {dataSets.length === 0 ? (
              <div style={{ fontFamily: mono, fontSize: 10, lineHeight: 1.5, color: T3, padding: "2px 12px 8px", maxWidth: 220 }}>
                {t("noFreeDataSets")}
              </div>
            ) : dataSets.map(ds => (
              <button
                key={ds.id}
                type="button"
                onClick={() => { onPick(ds.id); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "6px 12px", fontFamily: mono, fontSize: 11, lineHeight: 1.4,
                  color: NAVY, background: "transparent", border: "none",
                  cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(27,40,64,0.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                {ds.title}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

/* ── PresentationStructure ────────────────────────────────────────────────
   Bottom strip — horizontal-scrolling tray of slide thumbnails.
   All slides are always reachable; no pagination.                        */
export function PresentationStructure({ insertAt, isDraggingSlide }: {
  insertAt: number | null;
  isDraggingSlide: boolean;
}) {
  const mode          = useWorkspaceStore(s => s.mode);
  const t             = useTranslations("SlideTray");
  const slideOrder    = useWorkspaceStore(s => s.slideOrder);
  const slidesById    = useWorkspaceStore(s => s.slidesById);
  const dataSetsById  = useWorkspaceStore(s => s.dataSetsById);
  const allSlides     = slideOrder.map(id => slidesById[id]).filter(Boolean) as Slide[];
  /* In Slides mode show only slides that have a linked dataset — no empty placeholders.
     In Canvas mode show all slides so new (empty) slots are visible as drop targets. */
  const isSlideMode   = mode === "presentation";
  const slides        = isSlideMode
    ? allSlides.filter(s => !!s.dataSetIds[0] && !!dataSetsById[s.dataSetIds[0]])
    : allSlides;
  const activeSlideId = useWorkspaceStore(s => s.activeSlideId);
  const setActive     = useWorkspaceStore(s => s.setActiveSlide);
  const removeSlide   = useWorkspaceStore(s => s.removeSlide);
  const dataSetOrder  = useWorkspaceStore(s => s.dataSetOrder);
  const addSlideWithDataSet = useWorkspaceStore(s => s.addSlideWithDataSet);

  /* Data sets on Canvas not yet placed on any slide — source for «+ Слайд». */
  const usedDataSetIds = new Set(allSlides.flatMap(s => s.dataSetIds));
  const freeDataSets   = dataSetOrder
    .map(id => dataSetsById[id])
    .filter((ds): ds is NonNullable<typeof ds> => !!ds && !usedDataSetIds.has(ds.id))
    .map(ds => ({ id: ds.id, title: ds.title }));

  const scrollRef  = useRef<HTMLDivElement>(null);
  const prevLenRef = useRef(slides.length);

  /* Scroll the new item into view whenever a slide is added */
  useEffect(() => {
    if (slides.length > prevLenRef.current && scrollRef.current) {
      const newSlot = scrollRef.current.querySelector<HTMLElement>(`[data-slide-id="${slideOrder[slides.length - 1]}"]`);
      newSlot?.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
    }
    prevLenRef.current = slides.length;
  }, [slides.length, slideOrder]);

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
      style={{ height: 164, borderColor: BORDER, background: "#EDE9E0" }}
    >
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 shrink-0 px-5 pt-2 pb-1">
          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: T3 }}>
            {mode === "presentation" ? t("traySlides") : t("trayDataSets")}
          </span>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3, opacity: 0.55, userSelect: "none" }}>·</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>{slides.length}</span>
        </div>

        {/* Thumbnails row — horizontally scrollable, all slides always visible */}
        <SortableContext
          items={slides.map(s => s.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            ref={scrollRef}
            className="slide-scroll"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingLeft: 20, paddingRight: 20,
              paddingTop: 4, paddingBottom: 6,
              overflowX: "auto",
              overflowY: "hidden",
            }}
          >
            {(() => {
              const items: ReactNode[] = slides.flatMap((slide, i) => {
                const nodes: ReactNode[] = [];
                if (insertAt !== null && i === insertAt) {
                  nodes.push(<InsertionLine key="__ins__" />);
                }
                nodes.push(
                  <div key={slide.id} data-slide-id={slide.id} style={{ width: 116, flexShrink: 0 }}>
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

              /* Trailing insertion line — drop after last slide */
              if (insertAt !== null && insertAt >= slides.length) {
                items.push(<InsertionLine key="__ins_trail__" />);
              }

              return items;
            })()}

            {/* + Слайд — Slides mode: picker of free Canvas data sets (Шаг 5a).
               Canvas mode has no add-tile anymore — data is added via a file
               on Canvas, never an empty placeholder node (Шаг 5b). */}
            {isSlideMode && (
              <div style={{ width: 116, flexShrink: 0 }}>
                <AddSlideSlot dataSets={freeDataSets} onPick={addSlideWithDataSet} />
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
