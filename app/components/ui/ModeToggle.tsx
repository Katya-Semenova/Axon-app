"use client";

import { useWorkspaceStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { NAVY, BORDER, T2 } from "./tokens";

/**
 * Segmented pill toggle — visually one control, two halves. Mirrors Figma's
 * Design / Dev toggle: the active half is filled navy with light text, the
 * inactive half is transparent with secondary text. Click anywhere on the
 * inactive half to flip; clicking the already-active half is a no-op.
 *
 * Lives in the right side of the canvas toolbar; reads/writes `mode` in the
 * workspace store, so it's swap-in usable from any toolbar location.
 */
export function ModeToggle() {
  const mode    = useWorkspaceStore(s => s.mode);
  const setMode = useWorkspaceStore(s => s.setMode);
  const t       = useTranslations("ModeToggle");

  const isData = mode === "data";

  return (
    <div
      role="tablist"
      aria-label={t("ariaLabel")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        padding: 2,
        background: "transparent",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        letterSpacing: "0.06em",
        userSelect: "none",
      }}
    >
      <button
        role="tab"
        aria-selected={isData}
        onClick={() => setMode("data")}
        style={{
          padding: "6px 16px",
          borderRadius: 4,
          border: "none",
          cursor: isData ? "default" : "pointer",
          background: isData ? NAVY : "transparent",
          color:      isData ? "#F5F2EA" : T2,
          fontWeight: isData ? 500 : 400,
          transition: "background 150ms ease, color 150ms ease",
          textTransform: "uppercase",
        }}
      >
        {t("data")}
      </button>
      <button
        role="tab"
        aria-selected={!isData}
        onClick={() => setMode("presentation")}
        style={{
          padding: "6px 16px",
          borderRadius: 4,
          border: "none",
          cursor: !isData ? "default" : "pointer",
          background: !isData ? NAVY : "transparent",
          color:      !isData ? "#F5F2EA" : T2,
          fontWeight: !isData ? 500 : 400,
          transition: "background 150ms ease, color 150ms ease",
          textTransform: "uppercase",
        }}
      >
        {t("presentation")}
      </button>
    </div>
  );
}
