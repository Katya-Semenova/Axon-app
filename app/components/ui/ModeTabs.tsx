"use client";

import { useWorkspaceStore } from "@/lib/store";
import { NAVY, BORDER, T2 } from "./tokens";

/**
 * Three-tab segmented control — CANVAS / SLIDES / PRESENT.
 *
 * Sizing and corner radius match the "+ New data set" button exactly
 * (padding: 15px 20px, borderRadius: 0) per Art Director review item 1.4.
 * Position is controlled by the parent (page.tsx) — centered over canvas.
 *
 *   CANVAS  → mode "data"          — node graph
 *   SLIDES  → mode "presentation"  — slide editor + data set tray
 *   PRESENT → mode "build"         — export gateway (PresentExport)
 */
export function ModeTabs({ variant = "floating" }: { variant?: "floating" | "bar" }) {
  const mode    = useWorkspaceStore(s => s.mode);
  const setMode = useWorkspaceStore(s => s.setMode);

  const isBar = variant === "bar";

  return (
    <div
      role="tablist"
      aria-label="Workspace mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: isBar ? "none" : `1px solid ${BORDER}`,
        borderRadius: 0,
        padding: isBar ? 0 : 2,
        background: isBar ? "transparent" : "rgba(245,242,234,0.92)",
        backdropFilter: isBar ? undefined : "blur(8px)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        letterSpacing: "0.07em",
        userSelect: "none",
        boxShadow: isBar ? "none" : "0 4px 18px rgba(27,40,64,0.18)",
      }}
    >
      <Tab label="Canvas"  active={mode === "data"}         onClick={() => mode !== "data"         && setMode("data")}         compact={isBar} />
      <Tab label="Slides"  active={mode === "presentation"} onClick={() => mode !== "presentation" && setMode("presentation")} compact={isBar} />
      <Tab label="Present" active={mode === "build"}        onClick={() => mode !== "build"        && setMode("build")}        compact={isBar} />
    </div>
  );
}

function Tab({ label, active, onClick, compact }: { label: string; active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: compact ? "22px 20px" : "15px 20px",
        borderRadius: 0,
        border: "none",
        cursor: active ? "default" : "pointer",
        background: active ? NAVY : "transparent",
        color:      active ? "#F5F2EA" : T2,
        fontWeight: active ? 500 : 400,
        textTransform: "uppercase",
        transition: "background 150ms ease, color 150ms ease",
      }}
    >
      {label}
    </button>
  );
}
