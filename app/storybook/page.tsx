"use client";

import { useState } from "react";
import {
  NAVY, GOLD, BORDER, T2, T3,
  SURFACE, SURFACE_MUTED, CANVAS_BG,
} from "@/app/components/ui/tokens";
import { ModeTabs } from "@/app/components/ui/ModeTabs";
import { ModeToggle } from "@/app/components/ui/ModeToggle";
import { ChartTypeDropdown } from "@/app/components/ui/ChartTypeDropdown";
import type { ChartType } from "@/lib/types";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "TOKENS",
    items: [
      { id: "colors-surfaces" as const, label: "Surfaces" },
      { id: "colors-navy" as const, label: "Navy Ramp" },
      { id: "colors-gold" as const, label: "Gold Ramp" },
      { id: "colors-text" as const, label: "Text & Pill" },
      { id: "typography" as const, label: "Typography" },
      { id: "radii" as const, label: "Radii" },
      { id: "animations" as const, label: "Animations" },
    ],
  },
  {
    label: "COMPONENTS",
    items: [
      { id: "modetabs" as const, label: "ModeTabs" },
      { id: "modetoggle" as const, label: "ModeToggle" },
      { id: "chart-dropdown" as const, label: "ChartTypeDropdown" },
    ],
  },
] as const;

type SectionId =
  | "colors-surfaces" | "colors-navy" | "colors-gold" | "colors-text"
  | "typography" | "radii" | "animations"
  | "modetabs" | "modetoggle" | "chart-dropdown";

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Swatch({ name, token, hex }: { name: string; token: string; hex: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 80 }}>
      <div style={{
        width: 80,
        height: 64,
        borderRadius: 4,
        background: hex,
        border: "1px solid rgba(27,40,64,0.12)",
      }} />
      <div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: NAVY, fontWeight: 500, wordBreak: "break-all", lineHeight: 1.4 }}>
          {token}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: T2, marginTop: 1 }}>{hex}</div>
        <div style={{ fontSize: 10.5, color: T3, marginTop: 3, lineHeight: 1.3 }}>{name}</div>
      </div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", marginTop: 14 }}>
      <pre style={{
        background: NAVY,
        color: "#F5F2EA",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11.5,
        lineHeight: 1.75,
        padding: "18px 20px",
        borderRadius: 4,
        overflowX: "auto",
        margin: 0,
        whiteSpace: "pre-wrap",
      }}>
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "3px 10px",
          background: "rgba(245,242,234,0.10)",
          border: "1px solid rgba(245,242,234,0.18)",
          borderRadius: 3,
          color: "rgba(245,242,234,0.70)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          cursor: "pointer",
        }}
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500, color: NAVY, margin: "0 0 6px" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 12.5, color: T2, margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: T3, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.09em" }}>
      {children}
    </div>
  );
}

function PreviewBox({ children, label, dark }: { children: React.ReactNode; label?: string; dark?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <Label>{label}</Label>}
      <div style={{
        background: dark ? NAVY : SURFACE,
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : BORDER}`,
        borderRadius: 4,
        padding: "32px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        flexWrap: "wrap",
        minHeight: 96,
      }}>
        {children}
      </div>
    </div>
  );
}

function SwatchGrid({ swatches }: { swatches: { name: string; token: string; hex: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
      {swatches.map(s => <Swatch key={s.token} {...s} />)}
    </div>
  );
}

function PropsTable({ rows }: { rows: { name: string; type: string; desc: string }[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <Label>Props</Label>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T2, lineHeight: 2.1 }}>
        {rows.map(r => (
          <div key={r.name}>
            <span style={{ color: NAVY }}>{r.name}</span>
            <span style={{ color: T3 }}>{": "}{r.type}</span>
            <span style={{ color: T2 }}>{" — "}{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DecisionList({ items }: { items: string[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <Label>Design decisions</Label>
      <ul style={{ margin: 0, padding: "0 0 0 16px", color: T2, fontSize: 12.5, lineHeight: 1.9 }}>
        {items.map((item, i) => <li key={i} dangerouslySetInnerHTML={{ __html: item }} />)}
      </ul>
    </div>
  );
}

// ─── Token sections ───────────────────────────────────────────────────────────

function ColorsSurfacesSection() {
  return (
    <>
      <SectionHeader
        title="Colors — Surfaces"
        subtitle="Warm paper-tone surfaces. Canvas is the app background; cards, dropdowns, and nested elements sit in stacked elevations above it."
      />
      <SwatchGrid swatches={[
        { name: "Canvas",         token: "--color-canvas",         hex: "#EDE9E0" },
        { name: "Surface",        token: "--color-surface",        hex: "#F5F2EA" },
        { name: "Surface Raised", token: "--color-surface-raised", hex: "#FBF9F3" },
        { name: "Surface Muted",  token: "--color-surface-muted",  hex: "#E5E0D2" },
        { name: "Border Subtle",  token: "--color-border-subtle",  hex: "#D9D3C2" },
        { name: "Border Strong",  token: "--color-border-strong",  hex: "#B8AE96" },
        { name: "Slate Mid",      token: "--color-slate-mid",      hex: "#A9AFBD" },
        { name: "Slate Inner",    token: "--color-slate-inner",    hex: "#D1D5DC" },
        { name: "Insight Card",   token: "--color-insight-card",   hex: "#F3F4F6" },
      ]} />
    </>
  );
}

function ColorsNavySection() {
  return (
    <>
      <SectionHeader
        title="Colors — Navy Ramp"
        subtitle="Structural primary color. Navy 900 is text-primary and the primary fill for active UI. Lighter values for borders, secondary text, and disabled states."
      />
      <SwatchGrid swatches={[
        { name: "Navy 900", token: "--color-navy-900", hex: "#1B2840" },
        { name: "Navy 700", token: "--color-navy-700", hex: "#2A3654" },
        { name: "Navy 500", token: "--color-navy-500", hex: "#4A5878" },
        { name: "Navy 300", token: "--color-navy-300", hex: "#8892AA" },
        { name: "Navy 100", token: "--color-navy-100", hex: "#B8C2D0" },
      ]} />
    </>
  );
}

function ColorsGoldSection() {
  return (
    <>
      <SectionHeader
        title="Colors — Gold Ramp"
        subtitle="The only accent color in the system. Gold 500 is the standard accent for focus rings, active indicators, and data highlights. Never introduce another accent."
      />
      <SwatchGrid swatches={[
        { name: "Gold 700", token: "--color-gold-700", hex: "#A8853E" },
        { name: "Gold 500", token: "--color-gold-500", hex: "#B89548" },
        { name: "Gold 300", token: "--color-gold-300", hex: "#C9A961" },
        { name: "Gold 100", token: "--color-gold-100", hex: "#D4C9A8" },
      ]} />
    </>
  );
}

function ColorsTextSection() {
  return (
    <>
      <SectionHeader
        title="Colors — Text & Pill"
        subtitle="Semantic text hierarchy (T1 → T2 → T3) plus pill tokens for CTAs and message bubbles. Text on Dark is used over navy-900 backgrounds."
      />
      <SwatchGrid swatches={[
        { name: "Text Primary",   token: "--color-text-primary",   hex: "#1B2840" },
        { name: "Text Secondary", token: "--color-text-secondary", hex: "#5C6478" },
        { name: "Text Tertiary",  token: "--color-text-tertiary",  hex: "#8A8B87" },
        { name: "Text on Dark",   token: "--color-text-on-dark",   hex: "#F5F2EA" },
        { name: "Pill BG",        token: "--color-pill-bg",        hex: "#1B2840" },
        { name: "Pill Text",      token: "--color-pill-text",       hex: "#F5F2EA" },
      ]} />
      <div style={{ marginTop: 28 }}>
        <Label>Text hierarchy sample</Label>
        <div style={{
          background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4,
          padding: "20px 24px", display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#1B2840" }}>Text Primary — #1B2840 — headings, labels, values</div>
          <div style={{ fontSize: 13, color: "#5C6478" }}>Text Secondary — #5C6478 — supporting body copy</div>
          <div style={{ fontSize: 11.5, color: "#8A8B87" }}>Text Tertiary — #8A8B87 — metadata, timestamps, hints</div>
        </div>
      </div>
    </>
  );
}

function TypographySection() {
  const fontBlock = (
    label: string,
    fontStyle: React.CSSProperties,
    samples: { text: string; size: number; weight?: number; extra?: React.CSSProperties }[]
  ) => (
    <div>
      <Label>{label}</Label>
      <div style={{
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4,
        padding: "22px 24px", display: "flex", flexDirection: "column", gap: 10,
      }}>
        {samples.map((s, i) => (
          <div key={i} style={{ ...fontStyle, fontSize: s.size, fontWeight: s.weight ?? 400, color: NAVY, ...s.extra }}>
            {s.text}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <SectionHeader
        title="Typography"
        subtitle="Three font families. Inter for body copy, JetBrains Mono for all UI controls and data labels, Instrument Serif for editorial slide headings."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {fontBlock("--font-sans · Inter · body copy", { fontFamily: "var(--font-inter), -apple-system, sans-serif" }, [
          { text: "Axon — Data Insights", size: 28 },
          { text: "Body text 15px — supporting copy and descriptions", size: 15, extra: { color: T2 } },
          { text: "Small body 12.5px — secondary information", size: 12.5, extra: { color: T2 } },
          { text: "Micro 11px — metadata, timestamps, captions", size: 11, extra: { color: T3 } },
        ])}
        {fontBlock("--font-mono · JetBrains Mono · UI controls", { fontFamily: "'JetBrains Mono', monospace" }, [
          { text: "CANVAS · SLIDES · PRESENT", size: 13.5, weight: 500, extra: { textTransform: "uppercase" as const, letterSpacing: "0.07em" } },
          { text: "11px / 500 — chart type labels, dropdown options", size: 11, weight: 500 },
          { text: "10.5px / 0.07em — mode tab labels", size: 10.5, extra: { color: T2, letterSpacing: "0.07em", textTransform: "uppercase" as const } },
          { text: "10px — token names, micro metadata", size: 10, extra: { color: T3 } },
        ])}
        {fontBlock("--font-serif · Instrument Serif · editorial headings", { fontFamily: "var(--font-instrument), 'Instrument Serif', Georgia, serif" }, [
          { text: "Data tells a story", size: 36, extra: { lineHeight: 1.1 } },
          { text: "Pull-quote, italic — editorial accent", size: 22, extra: { fontStyle: "italic" as const, color: T2 } },
          { text: "Slide headline, regular weight", size: 18, extra: { color: NAVY } },
        ])}
      </div>
    </>
  );
}

function RadiiSection() {
  const radii = [
    { token: "--radius-none",   value: 0,   label: "none / 0px",    usage: "Mode tabs, toolbar buttons" },
    { token: "--radius-sm",     value: 4,   label: "sm / 4px",      usage: "Cards, dropdowns, inputs" },
    { token: "--radius-bubble", value: 20,  label: "bubble / 20px", usage: "Chat bubbles only" },
    { token: "--radius-pill",   value: 999, label: "pill / 999px",  usage: "CTAs, toggle controls" },
  ];

  return (
    <>
      <SectionHeader
        title="Radii"
        subtitle="Four radius tokens for four contexts. Never use freeform border-radius values — always reference a token."
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginBottom: 48 }}>
        {radii.map(r => (
          <div key={r.token} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 88, height: 60, borderRadius: r.value,
              background: SURFACE_MUTED, border: `2px solid ${NAVY}`,
            }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: NAVY, fontWeight: 500 }}>{r.label}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: T2, marginTop: 2 }}>{r.token}</div>
              <div style={{ fontSize: 10.5, color: T3, marginTop: 4, maxWidth: 100, lineHeight: 1.4 }}>{r.usage}</div>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Spacing Scale" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48].map(px => (
          <div key={px} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 32, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T3 }}>
              {px}px
            </div>
            <div style={{ width: px, height: 8, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </>
  );
}

function AnimationsSection() {
  return (
    <>
      <SectionHeader
        title="Animations"
        subtitle="Three system animations — shimmer for skeleton loading, pulse-dot for typing indicators, fade-in for panel and menu reveals."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        <div>
          <Label>Shimmer · 1.6s infinite linear</Label>
          <PreviewBox>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              <div className="shimmer" style={{ height: 14, borderRadius: 4, width: "70%" }} />
              <div className="shimmer" style={{ height: 14, borderRadius: 4, width: "55%" }} />
              <div className="shimmer" style={{ height: 14, borderRadius: 4, width: "62%" }} />
            </div>
          </PreviewBox>
          <CodeBlock code={`<div className="shimmer" style={{ height: 14, borderRadius: 4, width: "70%" }} />`} />
        </div>

        <div>
          <Label>Pulse-dot · 1.2s infinite ease-in-out</Label>
          <PreviewBox>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {[undefined, "dot-2", "dot-3"].map((cls, i) => (
                <div
                  key={i}
                  className={cls}
                  style={{
                    width: 7, height: 7, borderRadius: 999, background: NAVY,
                    animation: "pulse-dot 1.2s infinite ease-in-out",
                  }}
                />
              ))}
            </div>
          </PreviewBox>
          <CodeBlock code={`{/* stagger via .dot-2 and .dot-3 delay classes */}
<div style={{ animation: "pulse-dot 1.2s infinite ease-in-out" }} />
<div className="dot-2" style={{ animation: "pulse-dot 1.2s infinite ease-in-out" }} />
<div className="dot-3" style={{ animation: "pulse-dot 1.2s infinite ease-in-out" }} />`} />
        </div>

        <div>
          <Label>Fade-in · 200ms ease · panels, menus</Label>
          <PreviewBox>
            <div className="animate-fade-in" style={{
              padding: "10px 20px", background: NAVY, color: "#F5F2EA",
              borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            }}>
              Panel appeared
            </div>
          </PreviewBox>
          <CodeBlock code={`<div className="animate-fade-in">\n  {/* panel or dropdown content */}\n</div>`} />
        </div>
      </div>
    </>
  );
}

// ─── Component sections ───────────────────────────────────────────────────────

function ModeTabsSection() {
  return (
    <>
      <SectionHeader
        title="ModeTabs"
        subtitle='Three-tab segmented control — Canvas / Slides / Present. Reads and writes global workspace mode. Two variants: "bar" (toolbar-integrated) and "floating" (overlaid on canvas).'
      />
      <PreviewBox label='variant="bar" · toolbar-integrated, no border, large padding'>
        <ModeTabs variant="bar" />
      </PreviewBox>
      <PreviewBox label='variant="floating" · bordered, blurred background, shadow'>
        <ModeTabs variant="floating" />
      </PreviewBox>
      <CodeBlock code={`import { ModeTabs } from "@/app/components/ui/ModeTabs";

// Toolbar — no border, no bg, larger padding (22px 20px)
<ModeTabs variant="bar" />

// Canvas overlay — bordered, blurred bg, drop shadow
<ModeTabs variant="floating" />`} />
      <DecisionList items={[
        '<code style="font-family:\'JetBrains Mono\',monospace">border-radius: 0</code> (square) — intentional, matches editorial grid aesthetic',
        "JetBrains Mono 10.5px, uppercase, 0.07em letter-spacing on all tabs",
        "Active tab: navy-900 fill with surface text; inactive: transparent with T2",
        "Sizing matches &ldquo;+ New data set&rdquo; button (15px&nbsp;20px padding) per Art Director review",
      ]} />
    </>
  );
}

function ModeToggleSection() {
  return (
    <>
      <SectionHeader
        title="ModeToggle"
        subtitle="Segmented pill toggle — Data Mode / Presentation. One control, two halves. Active half is filled navy; inactive is transparent with secondary text."
      />
      <PreviewBox>
        <ModeToggle />
      </PreviewBox>
      <CodeBlock code={`import { ModeToggle } from "@/app/components/ui/ModeToggle";

<ModeToggle />`} />
      <DecisionList items={[
        '<code style="font-family:\'JetBrains Mono\',monospace">border-radius: 999px</code> — deliberately different from ModeTabs (conversational vs. structural)',
        "Pill-shaped container with 2px inner padding, 6px 16px per button",
        "No border on individual buttons; outer container has border-border",
        "Shares the same store as ModeTabs — switching one switches both",
      ]} />
    </>
  );
}

function ChartDropdownSection() {
  const [value, setValue] = useState<ChartType>("Treemap");
  return (
    <>
      <SectionHeader
        title="ChartTypeDropdown"
        subtitle="Portaled dropdown for chart-type selection. Flat list of 10 active chart types. Portals to document.body to escape canvas overflow:hidden clipping."
      />
      <PreviewBox label="Live preview — try it">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T2 }}>Chart type:</span>
          <ChartTypeDropdown value={value} onChange={setValue} />
        </div>
      </PreviewBox>
      <CodeBlock code={`import { ChartTypeDropdown } from "@/app/components/ui/ChartTypeDropdown";
import { useState } from "react";
import type { ChartType } from "@/lib/types";

const [chartType, setChartType] = useState<ChartType>("Treemap");

<ChartTypeDropdown
  value={chartType}
  onChange={setChartType}
/>`} />
      <PropsTable rows={[
        { name: "value",    type: "ChartType",              desc: "currently selected chart type" },
        { name: "onChange", type: "(type: ChartType) => void", desc: "called on selection" },
        { name: "mounted",  type: "boolean (default true)",  desc: "gates the portal; pass false during SSR edge cases" },
      ]} />
      <DecisionList items={[
        "Portaled to <code>document.body</code> — the canvas has <code>overflow:hidden</code> which would clip a non-portaled menu",
        "JetBrains Mono 11px, SURFACE_RAISE bg, navy active text — same pattern as all system dropdowns",
        "Hover state via inline onMouseEnter/onMouseLeave (not CSS class) to avoid conflicts with canvas pointer events",
      ]} />
    </>
  );
}

// ─── Section router ───────────────────────────────────────────────────────────

function Section({ id }: { id: SectionId }) {
  switch (id) {
    case "colors-surfaces":  return <ColorsSurfacesSection />;
    case "colors-navy":      return <ColorsNavySection />;
    case "colors-gold":      return <ColorsGoldSection />;
    case "colors-text":      return <ColorsTextSection />;
    case "typography":       return <TypographySection />;
    case "radii":            return <RadiiSection />;
    case "animations":       return <AnimationsSection />;
    case "modetabs":         return <ModeTabsSection />;
    case "modetoggle":       return <ModeToggleSection />;
    case "chart-dropdown":   return <ChartDropdownSection />;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorybookPage() {
  const [active, setActive] = useState<SectionId>("colors-surfaces");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: CANVAS_BG,
      fontFamily: "var(--font-inter), -apple-system, sans-serif",
    }}>
      {/* ── Sidebar ── */}
      <nav style={{
        width: 218,
        borderRight: `1px solid ${BORDER}`,
        background: SURFACE,
        overflowY: "auto",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
          <a
            href="/"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, fontWeight: 500, color: NAVY, textDecoration: "none", letterSpacing: "0.04em" }}
          >
            ← AXON
          </a>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: T3, marginTop: 4, letterSpacing: "0.06em" }}>
            /storybook
          </div>
        </div>

        {/* Nav */}
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ padding: "14px 0" }}>
            <div style={{
              padding: "0 20px 8px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: T3,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}>
              {group.label}
            </div>
            {group.items.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "7px 20px",
                  border: "none",
                  borderLeft: active === item.id ? `2px solid ${GOLD}` : "2px solid transparent",
                  background: active === item.id ? SURFACE_MUTED : "transparent",
                  color: active === item.id ? NAVY : T2,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: active === item.id ? 500 : 400,
                  cursor: "pointer",
                  transition: "background 120ms, color 120ms",
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Main ── */}
      <main
        style={{ flex: 1, overflowY: "auto", padding: "48px 56px" }}
        className="thin-scroll"
      >
        <div style={{ maxWidth: 760 }}>
          <Section id={active} />
        </div>
      </main>
    </div>
  );
}
