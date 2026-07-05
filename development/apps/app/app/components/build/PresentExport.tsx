"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MiniChart } from "../MiniChart";
import { useWorkspaceStore, currentBoardData } from "@/lib/store";
import type { Slide, DataSet } from "@/lib/types";
import { PRESENTATION_THEMES } from "@/lib/types";
import { BORDER, GOLD, NAVY, NAVY_700, T2, T3, SURFACE, SURFACE_RAISE } from "../ui/tokens";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { BASE_PATH } from "@/lib/base-path";
import { AuthModal } from "../AuthModal";
import { useToast } from "../ui/Toast";
import { createShareLink, revokeShareLink, getActiveShareToken } from "@/app/actions/share";
import { createProjectFromData } from "@/app/actions/board";

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
    title: "Web-dashboard",
    tagline: "Interactive",
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

/* id → безопасный ключ перевода (id остаётся значением логики format). */
const FORMAT_KEY: Record<OutputFormat, string> = {
  "PPTX": "pptx", "PDF": "pdf", "View Link": "viewLink", "Interactive": "interactive",
};

/* Delivery settings (Audience / Tone / Narration) moved to SLIDES mode
   in round-4 — see DeliverySettingsStrip in SlideEditor.tsx. */

/* ── Component ─────────────────────────────────────────────────────────── */

export function PresentExport({ boardId, onBoardSaved, saveButton }: {
  boardId: string | null;
  onBoardSaved: (id: string) => void;
  saveButton?: React.ReactNode;
}) {
  const t            = useTranslations("Export");
  const slideOrder   = useWorkspaceStore(s => s.slideOrder);
  const slidesById   = useWorkspaceStore(s => s.slidesById);
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const reorderSlide = useWorkspaceStore(s => s.reorderSlide);

  const { data: session } = authClient.useSession();
  const { toast } = useToast();

  const [format, setFormat]     = useState<OutputFormat>("View Link");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const slideCount = slideOrder.length;
  const isLink = format === "View Link";

  /* Если доску уже расшаривали — подтянуть активную ссылку. */
  useEffect(() => {
    let cancel = false;
    if (isLink && boardId) {
      getActiveShareToken(boardId)
        .then((tok) => { if (!cancel && tok) setShareUrl(`${window.location.origin}${BASE_PATH}/p/${tok}`); })
        .catch(() => {});
    }
    return () => { cancel = true; };
  }, [isLink, boardId]);

  function changeFormat(f: OutputFormat) {
    setFormat(f);
    setCopied(false);
  }

  /* Создать ссылку: при необходимости сохранить доску (гость уже вошёл) → ShareLink. */
  async function doShare() {
    setSharing(true);
    try {
      let bId = boardId;
      if (!bId) {
        bId = await createProjectFromData(currentBoardData());
        if (bId) onBoardSaved(bId);
      }
      const token = bId ? await createShareLink(bId) : null;
      if (!token) throw new Error("share failed");
      setShareUrl(`${window.location.origin}${BASE_PATH}/p/${token}`);
    } catch {
      toast(t("shareError"), { variant: "error" });
    } finally {
      setSharing(false);
    }
  }

  /* Клик «Поделиться»: гость → вход (AuthModal), затем создаём ссылку. */
  function handleShare() {
    if (slideCount === 0) return;
    if (!session) { setAuthOpen(true); return; }
    void doShare();
  }

  async function handleRevoke() {
    if (boardId) await revokeShareLink(boardId).catch(() => {});
    setShareUrl(null);
    toast(t("revoked"));
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
            {t("present")}
          </span>
          <span style={{ color: BORDER, fontSize: 10 }}>|</span>
          <span style={{ fontFamily: mono, fontSize: 10.5, color: T3 }}>
            {slideCount === 0 ? t("noSlidesYet") : t("slidesReady", { count: slideCount })}
          </span>
        </div>
        {/* center cell reserved — mode switcher is rendered at page level */}
        <div />
        <div className="flex items-center justify-end">{saveButton}</div>
      </div>

      {/* ── Body ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto thin-scroll"
        style={{ background: SURFACE_RAISE }}
      >
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "44px 32px 64px", display: "flex", flexDirection: "column", gap: 48 }}>

          {/* ── Group 1: title + subtitle + format picker — one semantic unit ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Hero serif title */}
          <div>
            <span style={{
              fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T3,
            }}>
              {t("outputFormat")}
            </span>
            <h1 style={{
              fontFamily: serif, fontSize: 28, lineHeight: 1.15, color: NAVY,
              margin: "6px 0 4px", fontWeight: 400,
            }}>
              {t("heroTitle")}
            </h1>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13.5, color: T2, margin: 0 }}>
              {t("heroSubtitle")}
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
                      {t(`format.${FORMAT_KEY[f.id]}.title`)}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: T3, lineHeight: 1.3 }}>
                      {t(`format.${FORMAT_KEY[f.id]}.tagline`)}
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
          </div>{/* ── end Group 1 ── */}

          {/* ── Group 2: Deck order — final reorder before BUILD ── */}
          <DeckReorderTray
            slideOrder={slideOrder}
            slidesById={slidesById}
            dataSetsById={dataSetsById}
            onReorder={(from, to) => reorderSlide(from, to)}
          />

          {/* ── 3. Поделиться (View Link) / результат · PPTX·PDF·Interactive — «скоро» ── */}
          {isLink ? (
            <AnimatePresence mode="wait">
              {!shareUrl ? (
                <motion.div
                  key="share-bar"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16, padding: "16px 22px", border: `1px solid ${BORDER}`, background: SURFACE,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontFamily: mono, fontSize: 11.5, color: NAVY, fontWeight: 500 }}>
                      {slideCount === 0 ? t("addSlidesFirst") : t("slidesReady", { count: slideCount })}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, letterSpacing: "0.05em" }}>
                      {t("shareableLink")} · {t("noLoginToView")}
                    </span>
                  </div>
                  <button
                    onClick={handleShare}
                    disabled={slideCount === 0 || sharing}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "11px 28px",
                      fontFamily: mono, fontSize: 13, fontWeight: 500, letterSpacing: "0.06em",
                      color: "#FFFFFF",
                      background: slideCount === 0 || sharing ? "rgba(27,35,50,0.45)" : "#1B2332",
                      border: "none", borderRadius: 0,
                      cursor: slideCount === 0 || sharing ? "default" : "pointer",
                      textTransform: "uppercase", transition: "background 150ms ease",
                    }}
                    onMouseEnter={e => { if (slideCount > 0 && !sharing) e.currentTarget.style.background = "#27334A"; }}
                    onMouseLeave={e => { if (slideCount > 0 && !sharing) e.currentTarget.style.background = "#1B2332"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 15l6 -6" />
                      <path d="M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464" />
                      <path d="M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463" />
                    </svg>
                    {sharing ? t("sharing") : t("shareBtn")}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="share-result"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  style={{ padding: "20px 22px", border: `2px solid ${NAVY}`, background: "#FBF9F3" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0, flex: 1 }}>
                      <span style={{ fontFamily: mono, fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: NAVY, fontWeight: 500 }}>
                        {t("readyFormat", { format })}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 12, color: NAVY, wordBreak: "break-all" }}>
                        {shareUrl}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 10, color: T3 }}>{t("linkLifetime")}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      <ResultButton
                        primary
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl!).catch(() => {});
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1600);
                        }}
                      >
                        {copied ? t("copied") : t("copyLink")}
                      </ResultButton>
                      <ResultButton onClick={() => window.open(shareUrl!, "_blank")}>
                        {t("open")}
                      </ResultButton>
                      <button
                        onClick={handleRevoke}
                        style={{
                          fontFamily: mono, fontSize: 10, color: T3,
                          background: "none", border: "none", padding: 0,
                          cursor: "pointer", textDecoration: "underline",
                        }}
                      >
                        {t("revoke")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 22px", border: `1px dashed ${BORDER}`, background: SURFACE,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: mono, fontSize: 11.5, color: NAVY, fontWeight: 500 }}>{t("comingSoonTitle", { format })}</span>
                <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, letterSpacing: "0.05em" }}>{t("comingSoonHint")}</span>
              </div>
            </div>
          )}

        </div>
      </div>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={() => { setAuthOpen(false); void doShare(); }}
      />
    </section>
  );
}

/* ── Deck order tray — drag-to-reorder before BUILD ─────────────────────────
   Native HTML5 drag-and-drop. Uses insertion-line semantics: a 2px gold
   vertical bar appears between tiles to show where the dragged item will land,
   matching the PresentationStructure slide-tray pattern.               */

function DeckReorderTray({
  slideOrder, slidesById, dataSetsById, onReorder,
}: {
  slideOrder: string[];
  slidesById: Record<string, Slide>;
  dataSetsById: Record<string, DataSet>;
  onReorder: (from: number, to: number) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);

  /* Active deck theme — applied as --slide-* on the strip so the tiles reflect
     the same Editorial/Soft look chosen in SLIDES mode. */
  const presentationThemeId = useWorkspaceStore(s => s.presentationThemeId);
  const theme = PRESENTATION_THEMES.find(pt => pt.id === presentationThemeId) ?? PRESENTATION_THEMES[0];
  const themeVars = theme.vars as React.CSSProperties;
  const t = useTranslations("Export");

  const tiles = slideOrder
    .map(id => slidesById[id])
    .filter((s): s is Slide => !!s);

  function handleDrop() {
    if (dragFrom !== null && insertAt !== null) {
      /* insertAt is the gap index (0 = before first tile, n = after last).
         Convert to array-splice target after the dragged item is removed. */
      const to = dragFrom < insertAt ? insertAt - 1 : insertAt;
      if (to !== dragFrom) onReorder(dragFrom, to);
    }
    setDragFrom(null);
    setInsertAt(null);
  }

  function handleDragEnd() {
    setDragFrom(null);
    setInsertAt(null);
  }

  if (tiles.length === 0) {
    return (
      <div style={{
        border: `1px dashed ${BORDER}`, background: SURFACE,
        padding: "22px 18px", textAlign: "center",
        fontFamily: mono, fontSize: 10.5, color: T3, letterSpacing: "0.05em",
      }}>
        {t("noSlidesReorder")}
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 12, gap: 12, flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: mono, fontSize: 9.5, letterSpacing: "0.11em", textTransform: "uppercase", color: T3,
        }}>
          {t("deckOrder")}
        </span>
        <span style={{ fontFamily: mono, fontSize: 9.5, color: T3, opacity: 0.75 }}>
          {t("dragReorder")}
        </span>
      </div>

      {/* Horizontal-scroll strip — tiles keep a fixed width and the row scrolls
          when they exceed the container, instead of shrinking to fit (matches
          the SLIDES slide-tray pattern). */}
      <div
        className="slide-scroll"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleDrop(); }}
        style={{
          ...themeVars,
          display: "flex",
          gap: 12,
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: 6,
        }}
      >
        {tiles.map((slide, idx) => {
          const ds = slide.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
          return (
            <DeckTile
              key={slide.id}
              idx={idx}
              slide={slide}
              ds={ds}
              isDragging={dragFrom === idx}
              onDragStart={() => setDragFrom(idx)}
              onDragOver={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setInsertAt(e.clientX < rect.left + rect.width / 2 ? idx : idx + 1);
              }}
              onDragEnd={handleDragEnd}
              insertBefore={insertAt === idx && dragFrom !== null}
              insertAfter={idx === tiles.length - 1 && insertAt === tiles.length && dragFrom !== null}
            />
          );
        })}
      </div>
    </div>
  );
}

function DeckTile({
  idx, slide, ds, isDragging,
  onDragStart, onDragOver, onDragEnd,
  insertBefore, insertAfter,
}: {
  idx: number;
  slide: Slide;
  ds: DataSet | null;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  insertBefore: boolean;
  insertAfter: boolean;
}) {
  const t = useTranslations("Export");
  const W = 168;
  const serial = String(slide.serial).padStart(2, "0");
  const title  = ds?.title ?? "—";

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(e); }}
      onDragEnd={onDragEnd}
      style={{
        /* Width is sized for 4 tiles across the strip: with ≤4 slides they grow
           to fill the row (no gap on the right); with >4 they stay at this width
           and the strip scrolls horizontally. (36px = 3 gaps of 12px.) */
        flexGrow: 1,
        flexShrink: 0,
        flexBasis: "calc((100% - 36px) / 4)",
        minWidth: "calc((100% - 36px) / 4)",
        background: "var(--slide-bg)",
        border: "1px solid var(--slide-border)",
        borderRadius: "var(--slide-radius)",
        padding: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        transition: "opacity 120ms, box-shadow 80ms",
        userSelect: "none",
        boxShadow: insertBefore
          ? `inset 2px 0 0 ${GOLD}`
          : insertAfter
          ? `inset -2px 0 0 ${GOLD}`
          : "none",
      }}
    >
      {/* Header — serial + drag-grip hint */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 10px 4px",
        borderBottom: "1px solid var(--slide-border)",
      }}>
        <span style={{ fontFamily: "var(--slide-font-mono)", fontSize: 9, letterSpacing: "0.1em", color: T3 }}>
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
        fontFamily: "var(--slide-font-body)", fontSize: 11.5, fontWeight: 500, color: "var(--slide-title)",
        lineHeight: 1.25,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {title}
      </div>

      {/* Chart preview */}
      <div style={{ padding: "0 10px 10px" }}>
        <svg viewBox={`0 0 ${W - 20} 60`} fill="none" style={{ width: "100%", height: 60, display: "block" }}>
          {slide.archetype === "Quote" ? (
            <foreignObject x={0} y={0} width={W - 20} height={60}>
              <div style={{
                padding: "5px 8px",
                fontFamily: serif,
                fontSize: 9.5,
                fontStyle: "italic",
                color: NAVY,
                lineHeight: 1.4,
                overflow: "hidden",
                height: 60,
                boxSizing: "border-box",
              }}>
                {slide.narrative?.trim()
                  ? `“${slide.narrative.slice(0, 80)}${slide.narrative.length > 80 ? "…”" : "”"}`
                  : ""}
              </div>
            </foreignObject>
          ) : ds && ds.rows.length > 0 ? (
            <MiniChart rows={ds.rows} chartType={ds.chartType} color={NAVY_700} W={W - 20} H={60} />
          ) : (
            <text x={(W - 20) / 2} y="32" textAnchor="middle"
              fontSize="9" fill={T3} fontFamily={mono} fillOpacity="0.7">
              {t("noData")}
            </text>
          )}
        </svg>
      </div>

      {/* Position pill */}
      <div style={{
        padding: "0 10px 8px",
        fontFamily: mono, fontSize: 8.5, letterSpacing: "0.1em", color: T3, textTransform: "uppercase",
      }}>
        {t("position", { n: idx + 1 })}
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
