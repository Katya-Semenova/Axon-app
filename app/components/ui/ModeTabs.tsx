"use client";

import { useWorkspaceStore } from "@/lib/store";
import { NAVY, BORDER, T2 } from "./tokens";

/**
 * Three-tab segmented control — CANVAS / SLIDES / PRESENT.
 *
 * Each tab maps to a real store mode, so PRESENT is a normal in-shell
 * surface (light theme, chat rail visible) — not a fullscreen overlay.
 *
 *   CANVAS  → mode "data"          — node graph
 *   SLIDES  → mode "presentation"  — slide editor + slide tray
 *   PRESENT → mode "build"         — export gateway (PresentExport)
 */
export function ModeTabs() {
  const mode    = useWorkspaceStore(s => s.mode);
  const setMode = useWorkspaceStore(s => s.setMode);

  return (
    <div
      role="tablist"
      aria-label="Workspace mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${BORDER}`,
        borderRadius: 999,
        padding: 2,
        background: "rgba(245,242,234,0.85)",
        backdropFilter: "blur(8px)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        letterSpacing: "0.07em",
        userSelect: "none",
      }}
    >
      <Tab label="Canvas"  active={mode === "data"}         onClick={() => mode !== "data"         && setMode("data")} />
      <Tab label="Slides"  active={mode === "presentation"} onClick={() => mode !== "presentation" && setMode("presentation")} />
      <Tab label="Present" active={mode === "build"}        onClick={() => mode !== "build"        && setMode("build")} />
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: 999,
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
