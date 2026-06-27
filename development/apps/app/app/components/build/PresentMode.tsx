"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChartFill } from "../ChartFill";
import { useWorkspaceStore } from "@/lib/store";
import type { Slide } from "@/lib/types";
import { useTranslations } from "next-intl";


const mono = "'JetBrains Mono', monospace";

export function PresentMode({
  slides,
  currentIdx,
  onChangeIdx,
  onExit,
  showNotes,
  onToggleNotes,
}: {
  slides: Slide[];
  currentIdx: number;
  onChangeIdx: (i: number) => void;
  onExit: () => void;
  showNotes: boolean;
  onToggleNotes: () => void;
}) {
  const dataSetsById = useWorkspaceStore(s => s.dataSetsById);
  const t = useTranslations("Present");

  const goNext = useCallback(() => {
    if (currentIdx < slides.length - 1) onChangeIdx(currentIdx + 1);
  }, [currentIdx, slides.length, onChangeIdx]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) onChangeIdx(currentIdx - 1);
  }, [currentIdx, onChangeIdx]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft")              { e.preventDefault(); goPrev(); }
      else if (e.key === "Escape")                 { e.preventDefault(); onExit(); }
      else if (e.key === "n" || e.key === "N")     { e.preventDefault(); onToggleNotes(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onExit, onToggleNotes]);

  const slide    = slides[currentIdx];
  const ds       = slide?.dataSetIds[0] ? dataSetsById[slide.dataSetIds[0]] : null;
  const serial   = slide ? String(slide.serial).padStart(2, "0") : "01";
  const headFont = "Inter, sans-serif";
  const progress = slides.length > 1 ? currentIdx / (slides.length - 1) : 1;

  if (!slide) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "#0A0A0A",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 2, background: "rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: "100%", background: "#B89548" }}
        />
      </div>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 24px", flexShrink: 0,
      }}>
        <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em" }}>
          AXON
        </span>
        <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
          {currentIdx + 1} / {slides.length}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={onToggleNotes}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: "0.07em",
              color: showNotes ? "#B89548" : "rgba(255,255,255,0.35)",
              background: "none", border: "none", cursor: "pointer", transition: "color 150ms",
            }}
          >
            {t("notes")}
          </button>
          <button
            onClick={onExit}
            style={{
              fontFamily: mono, fontSize: 10, letterSpacing: "0.07em",
              color: "rgba(255,255,255,0.35)",
              background: "none", border: "none", cursor: "pointer", transition: "color 150ms",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          >
            ESC
          </button>
        </div>
      </div>

      {/* Slide area */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px 72px 12px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Prev */}
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: "50%",
            background: currentIdx === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.09)",
            border: "none", cursor: currentIdx === 0 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: currentIdx === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
            transition: "background 150ms",
          }}
          onMouseEnter={e => { if (currentIdx > 0) e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }}
          onMouseLeave={e => { if (currentIdx > 0) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            style={{
              width: "100%", maxWidth: 960,
              height: "100%",
              background: "#FDFCF9",
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "18px 32px 14px",
              borderBottom: "1px solid #E8E4DC",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: "#A8A8A2" }}>{serial} /</span>
                <span style={{ fontFamily: headFont, fontSize: 20, fontWeight: 500, color: "#0A0A0A" }}>
                  {ds?.title ?? "—"}
                </span>
              </div>
              {(slide.narrative || ds?.title) && (
                <div style={{ marginTop: 5 }}>
                  <span style={{
                    fontFamily: headFont, fontSize: 13.5, color: "#5C6478",
                    fontStyle: "normal",
                  }}>
                    {slide.narrative || ""}
                  </span>
                </div>
              )}
            </div>

            {/* Chart */}
            <div style={{ flex: 1, minHeight: 0, padding: "20px 32px 28px" }}>
              {ds && ds.rows.length > 0 ? (
                <ChartFill rows={ds.rows} columns={ds.columns} chartType={ds.chartType} expanded />
              ) : (
                <div style={{
                  height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: mono, fontSize: 12, color: "#A8A8A2",
                }}>
                  {t("noData")}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next */}
        <button
          onClick={goNext}
          disabled={currentIdx === slides.length - 1}
          style={{
            position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
            width: 36, height: 36, borderRadius: "50%",
            background: currentIdx === slides.length - 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.09)",
            border: "none", cursor: currentIdx === slides.length - 1 ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: currentIdx === slides.length - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
            transition: "background 150ms",
          }}
          onMouseEnter={e => { if (currentIdx < slides.length - 1) e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }}
          onMouseLeave={e => { if (currentIdx < slides.length - 1) e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </div>

      {/* Speaker notes */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 112, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              flexShrink: 0, overflow: "hidden",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.025)",
            }}
          >
            <div style={{ padding: "14px 72px" }}>
              <div style={{ fontFamily: mono, fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 7, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                {t("speakerNotes")}
              </div>
              <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontFamily: "Inter, sans-serif" }}>
                {slide.narrative || t("noNotes")}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumbnail strip */}
      <div style={{
        height: 58, flexShrink: 0,
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center",
        gap: 6, padding: "0 20px",
        overflowX: "auto",
      }}>
        {slides.map((sl, i) => {
          const slDs     = sl.dataSetIds[0] ? dataSetsById[sl.dataSetIds[0]] : null;
          const isActive = i === currentIdx;
          return (
            <button
              key={sl.id}
              onClick={() => onChangeIdx(i)}
              style={{
                flexShrink: 0, width: 62, height: 38,
                border: `${isActive ? "1.5px" : "1px"} solid ${isActive ? "#B89548" : "rgba(255,255,255,0.14)"}`,
                background: isActive ? "rgba(184,149,72,0.07)" : "rgba(255,255,255,0.03)",
                borderRadius: 0, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                padding: "4px 5px", gap: 2,
                transition: "border-color 150ms",
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 5.5, color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                {String(sl.serial).padStart(2, "0")}
              </span>
              <span style={{
                fontFamily: mono, fontSize: 6.5,
                color: isActive ? "#F5F2EA" : "rgba(255,255,255,0.45)",
                lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%",
              }}>
                {(slDs?.title ?? "—").slice(0, 12)}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
