"use client";

import { useWorkspaceStore } from "@/lib/store";
import { NAVY, BORDER, T2 } from "./tokens";

/**
 * Three-tab segmented control — CANVAS / SLIDES / PRESENT.
 *
 * - CANVAS  → store mode "data"          (node graph)
 * - SLIDES  → store mode "presentation"  (slide editor with splitter)
 * - PRESENT → opens fullscreen overlay   (does not change store mode)
 *
 * The Present tab is purely visual on click — it fires onPresent() to let
 * the parent open a PresentMode overlay. The store remains in whichever
 * mode it was in (typically "presentation"), so leaving Present returns
 * the user to SLIDES naturally.
 */
export function ModeTabs({
  presentActive,
  onPresent,
}: {
  presentActive: boolean;
  onPresent: () => void;
}) {
  const mode    = useWorkspaceStore(s => s.mode);
  const setMode = useWorkspaceStore(s => s.setMode);

  type Tab = "canvas" | "slides" | "present";
  const current: Tab = presentActive
    ? "present"
    : mode === "presentation"
    ? "slides"
    : "canvas";

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
      <Tab
        label="Canvas"
        active={current === "canvas"}
        onClick={() => { if (current !== "canvas") setMode("data"); }}
      />
      <Tab
        label="Slides"
        active={current === "slides"}
        onClick={() => { if (current !== "slides") setMode("presentation"); }}
      />
      <Tab
        label="Present"
        active={current === "present"}
        onClick={() => { if (current !== "present") onPresent(); }}
      />
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
