"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { InsightCard } from "./InsightCard";
import { TOKENS, COLORS } from "./rawData";
import { SHOWCASE_INSIGHTS, SHOWCASE_DATASET, SHOWCASE_SLIDE } from "./showcaseData";
import { NAVY, GOLD, BORDER, T2, T3, NAVY_300, CANVAS_BG, SURFACE, SURFACE_RAISE } from "./tokens";

/* ── Canvas — matches the card in page.tsx (#prototype) ── */
const W = 400, H = 364;
const CENTER = { x: W / 2, y: H / 2 };

/* ── Timing (seconds) — holds kept deliberate (not slower); only the
   transitions were softened. Per-phase holds: raw is shortest (it resolves
   into the vortex), the "insight emerges → connects" beat is brief. ── */
const CROSSFADE = 0.32; // short, snappy transitions between states
const PHASE_HOLD = [1.1, 0.85, 0.55, 0.9]; // raw · insight · connect · slide — raw beats slowed a touch so the numbers/vortex read calmer

/* Each tile loops only the beats of its own stage, so the three teaser tiles
   read as "raw → insight/dataset → slide" side by side instead of one square
   cycling through everything. `full` keeps the original all-in-one loop. */
type ShowcaseVariant = "full" | "raw" | "insight" | "slide";
const SEQUENCES: Record<ShowcaseVariant, number[]> = {
  full: [0, 1, 2, 3],
  raw: [0, 1], // numbers float, then gather into the vortex, and back
  insight: [2], // insight + dataset stay linked on screen (nodes always drawn)
  slide: [3], // the finished slide stays on screen
};

/* ── Easing — one Apple-ish vocabulary across the whole showcase ── */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];   // expo-out — elegant settle
const EASE_INOUT: [number, number, number, number] = [0.4, 0, 0.2, 1];  // soft crossfade
const EASE_INTAKE: [number, number, number, number] = [0.6, 0, 0.9, 0.15]; // vortex "suck-in" — accelerates inward

/* Light recolour of the raw tokens for when the field sits on the dark navy
   section (the default COLORS are navy-on-cream and vanish on navy). */
const COLORS_DARK = ['rgba(244,240,232,0.92)','rgba(244,240,232,0.62)','rgba(170,180,198,0.9)','rgba(170,180,198,0.6)','rgba(200,168,107,0.98)','rgba(200,168,107,0.78)'];

const MONO = "'JetBrains Mono', monospace";
const noop = () => {};
const round = (n: number) => Math.round(n * 100) / 100;

/* Window-scaled variant of the product's makeBezier — proportional control
   points (no hard floor) so short node edges stay smooth, never loop. */
function flowEdge(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(8, (x2 - x1) * 0.42);
  return `M ${round(x1)} ${round(y1)} C ${round(x1 + dx)} ${round(y1)} ${round(x2 - dx)} ${round(y2)} ${round(x2)} ${round(y2)}`;
}

/* ── Gentle ambient float — the "elements keep breathing" beat, like the
   hero. Subtle x/y drift on an inner wrapper so entrance transforms stay
   on the parent. ── */
function Floating({
  amp = 5, dur = 6, delay = 0, children, style,
}: {
  amp?: number; dur?: number; delay?: number; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      /* Smooth elliptical drift: x and y oscillate on different periods with
         reverse+easeInOut, so it only eases at the turning points and glides
         through the middle — no stop-start at intermediate keyframes. */
      animate={{ x: [-amp, amp], y: [amp, -amp] }}
      transition={{
        x: { duration: dur, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay },
        y: { duration: dur * 1.35, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay },
      }}
      style={{ willChange: "transform", backfaceVisibility: "hidden", ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════ Phase 0 — Raw data (token field → vortex) ════════════════
   Positions mirror the Figma "raw data" scatter for the 400×364 card. */
const RAW_LAYOUT = [
  { i: 2,  x: 50,  y: 60,  s: 19, c: 4, r: 7, d: 6.2 }, // $1,040M
  { i: 0,  x: 227, y: 53,  s: 17, c: 0, r: 6, d: 6.8 }, // 218,439
  { i: 8,  x: 56,  y: 125, s: 16, c: 1, r: 6, d: 5.6 }, // SELECT *
  { i: 4,  x: 277, y: 94,  s: 19, c: 5, r: 7, d: 7.0 }, // -12%
  { i: 12, x: 143, y: 110, s: 14, c: 1, r: 5, d: 5.2 }, // null,4.2,89
  { i: 16, x: 47,  y: 190, s: 16, c: 0, r: 6, d: 6.4 }, // churn_rate
  { i: 6,  x: 249, y: 166, s: 20, c: 4, r: 6, d: 6.0 }, // 71%
  { i: 10, x: 115, y: 186, s: 14, c: 1, r: 5, d: 5.4 }, // WHERE date >
  { i: 13, x: 233, y: 223, s: 16, c: 0, r: 6, d: 6.6 }, // 2024-Q3
  { i: 3,  x: 68,  y: 256, s: 19, c: 5, r: 7, d: 5.9 }, // 0.78
  { i: 15, x: 162, y: 262, s: 16, c: 1, r: 5, d: 5.5 }, // revenue
  { i: 9,  x: 252, y: 287, s: 14, c: 0, r: 6, d: 6.3 }, // GROUP BY
  { i: 5,  x: 314, y: 197, s: 20, c: 4, r: 6, d: 5.8 }, // Q3
  { i: 17, x: 56,  y: 311, s: 17, c: 5, r: 6, d: 6.1 }, // mrr
];

function RawLayer({ phase, onDark = false }: { phase: number; onDark?: boolean }) {
  const active = phase === 0;
  const palette = onDark ? COLORS_DARK : COLORS;
  return (
    <motion.div
      initial={false}
      /* On exit the whole field spins inward + collapses to a point — the
         vortex (raw data → AI working → converges to the seed of the insights). */
      animate={active ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.05, rotate: 150 }}
      transition={{ duration: active ? CROSSFADE : 0.6, ease: active ? EASE_OUT : EASE_INTAKE }}
      style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}
    >
      {RAW_LAYOUT.map((d, k) => (
        <motion.span
          key={k}
          style={{ position: "absolute", left: d.x, top: d.y, fontFamily: MONO, fontSize: d.s, color: palette[d.c], whiteSpace: "nowrap", willChange: "transform, opacity" }}
          initial={false}
          /* Dampened "breathing": gentle drift only, no scale pulsing. */
          animate={active
            ? { opacity: 1, scale: 1, x: [0, d.r, 0, -d.r, 0], y: [-d.r, 0, d.r, 0, -d.r] }
            : { opacity: 0 }}
          transition={active
            ? {
                opacity: { duration: 0.5, ease: "easeOut" },
                scale: { duration: 0.5, ease: EASE_OUT },
                x: { duration: d.d, repeat: Infinity, ease: "easeInOut" },
                y: { duration: d.d, repeat: Infinity, ease: "easeInOut" },
              }
            : { opacity: { duration: 0.38 } } /* linger so tokens stay visible into the swirl */}
        >
          {TOKENS[d.i]}
        </motion.span>
      ))}
    </motion.div>
  );
}

/* ════════════════ Light dataset replica (product palette) ════════════════ */
function DatasetReplica({ width = 138 }: { width?: number }) {
  const rows = SHOWCASE_DATASET.rows.slice(0, 4);
  return (
    <div style={{ width, background: SURFACE_RAISE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", fontFamily: "Inter, sans-serif", boxShadow: "0 10px 26px rgba(27,40,64,0.10)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 7px", borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
        <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: "0.1em", color: T3, textTransform: "uppercase" }}>Data set</span>
        <span style={{ fontSize: 8.5, fontWeight: 500, color: NAVY, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{SHOWCASE_DATASET.title}</span>
      </div>
      <div style={{ padding: "6px 7px", display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr", gap: 4, paddingBottom: 3, borderBottom: `1px solid ${BORDER}` }}>
          {SHOWCASE_DATASET.columns.map((h, i) => (
            <span key={h} style={{ fontFamily: MONO, fontSize: 7, color: T3, textTransform: "uppercase", textAlign: i === 0 ? "left" : "right" }}>{h}</span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.metric} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 0.8fr", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 8, color: NAVY }}>{row.metric}</span>
            <span style={{ fontFamily: MONO, fontSize: 7.5, color: T2, textAlign: "right" }}>{row.q2}</span>
            <span style={{ fontFamily: MONO, fontSize: 7.5, color: NAVY, textAlign: "right" }}>{row.q3}</span>
            <span style={{ fontFamily: MONO, fontSize: 7.5, fontWeight: 600, color: row.pos ? GOLD : T3, textAlign: "right" }}>{row.delta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════ Phases 1–2 — Insights bloom from the vortex point, then link ════════════════
   Each node starts at the vortex convergence point (canvas center), then springs
   out to its resting spot — so the story reads continuously: data → vortex →
   point → insights. Edges are MEASURED from the real port circles every frame
   while connected, so they stay attached as the constellation floats. */
const CARD_SCALE = 0.78;
const POS = {
  a:  { left: 24,  top: 64,  w: 150 }, // insight A (text) — small, left column
  b:  { left: 24,  top: 196, w: 150 }, // insight B (data) — small, left column
  ds: { left: 166, top: 92,  w: 138 }, // dataset — large, right; positioned so it fits the frame when scaled up
};
/* Offset that places each node's origin at the vortex point on entry. */
const bornAt = (p: { left: number; top: number }) => ({ x: CENTER.x - p.left, y: CENTER.y - p.top });

function FlowLayer({ phase }: { phase: number }) {
  const visible = phase === 1 || phase === 2;
  const connect = phase === 2;
  const wrapRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);
  const dsRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ d: string }[]>([]);

  /* Measure the rendered port circles → exact bezier endpoints. While connected
     we re-measure each frame so edges follow the gentle float. */
  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wb = wrap.getBoundingClientRect();
      /* The whole showcase may be CSS-scaled down (small inline tiles), so
         getBoundingClientRect returns physical px while the SVG draws in the
         unscaled 400×364 logical space. Divide by the live scale so edges land
         on the real ports at any tile size. */
      const sc = wrap.offsetWidth ? wb.width / wrap.offsetWidth : 1;
      const portCenter = (host: HTMLElement | null, sel: string) => {
        const p = host?.querySelector(sel) as HTMLElement | null;
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { x: (r.left + r.width / 2 - wb.left) / sc, y: (r.top + r.height / 2 - wb.top) / sc };
      };
      const aOut = portCenter(aRef.current, '[data-port="output"]');
      const bOut = portCenter(bRef.current, '[data-port="output"]');
      const dIn = portCenter(dsRef.current, '[data-port="input"]');
      if (aOut && bOut && dIn) {
        setEdges([{ d: flowEdge(aOut.x, aOut.y, dIn.x, dIn.y) }, { d: flowEdge(bOut.x, bOut.y, dIn.x, dIn.y) }]);
      }
    };
    measure();
    let raf = 0;
    if (connect) {
      const loop = () => { measure(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", measure);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", measure); };
  }, [phase, connect]);

  /* Shared entrance: bloom from the vortex point (center) out to rest. */
  const enter = (p: { left: number; top: number }, scale: number = CARD_SCALE) => {
    const o = bornAt(p);
    return {
      initial: false as const,
      animate: visible
        ? { opacity: 1, scale, x: 0, y: 0, filter: "blur(0px)" }
        : { opacity: 0, scale: 0.18, x: o.x, y: o.y, filter: "blur(10px)" },
    };
  };

  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: CROSSFADE, ease: EASE_INOUT, delay: visible ? 0.24 : 0 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
        {/* node edges */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}>
          {edges.map((e, i) => (
            <motion.path
              key={i}
              d={e.d}
              fill="none" stroke={GOLD} strokeWidth={3.4} strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 2px rgba(200,168,107,0.45))" }}
              initial={false}
              animate={connect ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
              transition={{ pathLength: { duration: 0.5, ease: EASE_OUT, delay: connect ? 0.14 + i * 0.1 : 0 }, opacity: { duration: 0.16, delay: connect ? 0.14 + i * 0.1 : 0 } }}
            />
          ))}
        </svg>

        {/* insight A — text */}
        <motion.div
          {...enter(POS.a, 0.62)}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: visible && phase === 1 ? 0.2 : 0 }}
          style={{ position: "absolute", left: POS.a.left, top: POS.a.top, width: POS.a.w, transformOrigin: "top left" }}
        >
          <Floating amp={10} dur={4.6}>
            <div ref={aRef} style={{ boxShadow: "0 4px 14px rgba(27,40,64,0.12)" }}>
              <InsightCard insight={SHOWCASE_INSIGHTS[0]} isConnecting={connect} onExpand={noop} onOutputPortDown={noop} />
            </div>
          </Floating>
        </motion.div>

        {/* insight B — data */}
        <motion.div
          {...enter(POS.b, 0.62)}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: visible && phase === 1 ? 0.3 : 0 }}
          style={{ position: "absolute", left: POS.b.left, top: POS.b.top, width: POS.b.w, transformOrigin: "top left" }}
        >
          <Floating amp={10} dur={5.2}>
            <div ref={bRef} style={{ boxShadow: "0 4px 14px rgba(27,40,64,0.12)" }}>
              <InsightCard insight={SHOWCASE_INSIGHTS[2]} isConnecting={connect} onExpand={noop} onOutputPortDown={noop} />
            </div>
          </Floating>
        </motion.div>

        {/* dataset — blooms last, holds the input port for the edges */}
        <motion.div
          {...enter(POS.ds, 1.4)}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: visible && phase === 1 ? 0.4 : 0 }}
          style={{ position: "absolute", left: POS.ds.left, top: POS.ds.top, width: POS.ds.w, transformOrigin: "top left" }}
        >
          <Floating amp={9} dur={4.9}>
            <div ref={dsRef} style={{ position: "relative" }}>
              <div data-port="input" style={{ position: "absolute", left: -6, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, borderRadius: "50%", background: NAVY_300, border: `2px solid ${SURFACE_RAISE}`, zIndex: 2 }} />
              <DatasetReplica />
            </div>
          </Floating>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ════════════════ Phase 3 — Slide (16:9, like a real slide) ════════════════ */
const SLIDE_W = 288, SLIDE_H = 162; // 16:9

function SlideLayer({ phase }: { phase: number }) {
  const active = phase === 3;
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: CROSSFADE, ease: EASE_INOUT }}
      style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Floating amp={9} dur={5.2} style={{ display: "flex" }}>
        <motion.div
          initial={false}
          animate={active ? { scale: 1, y: 0, filter: "blur(0px)" } : { scale: 0.92, y: 8, filter: "blur(10px)" }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          style={{
            width: SLIDE_W, height: SLIDE_H, background: SURFACE_RAISE, border: `1px solid ${BORDER}`, borderRadius: 3,
            boxShadow: "0 16px 40px rgba(27,40,64,0.13)", padding: "12px 16px", overflow: "hidden",
            display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.16em", color: GOLD, marginBottom: 5 }}>{SHOWCASE_SLIDE.kicker}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: NAVY, lineHeight: 1.15, letterSpacing: "-0.01em", marginBottom: 7 }}>{SHOWCASE_SLIDE.title}</span>
          <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 13, overflow: "hidden" }}>
            {/* bullets — small type so the chart keeps its room */}
            <div style={{ flex: 1.05, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center", overflow: "hidden" }}>
              {SHOWCASE_SLIDE.bullets.map((b, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  transition={{ duration: 0.26, ease: EASE_OUT, delay: active ? 0.2 + i * 0.06 : 0 }}
                  style={{ display: "flex", gap: 6, alignItems: "flex-start" }}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, marginTop: 3.5, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: T2, lineHeight: 1.25 }}>{b}</span>
                </motion.div>
              ))}
            </div>
            {/* animated bar chart — the signature beat */}
            <div style={{ flex: 0.82, display: "flex", alignItems: "flex-end", gap: 4, paddingBottom: 1 }}>
              {SHOWCASE_SLIDE.bars.map((h, i) => (
                <motion.div
                  key={i}
                  initial={false}
                  animate={active ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ duration: 0.38, ease: EASE_OUT, delay: active ? 0.28 + i * 0.05 : 0 }}
                  style={{ flex: 1, height: `${h * 100}%`, background: i === 4 ? GOLD : NAVY, opacity: i === 4 ? 0.95 : 0.45 + i * 0.08, transformOrigin: "bottom" }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </Floating>
    </motion.div>
  );
}

/* ════════════════ Orchestrator ════════════════ */
export function PrototypeShowcase({ inView, variant = "full", transparentBg = false }: { inView: boolean; variant?: ShowcaseVariant; transparentBg?: boolean }) {
  const seq = SEQUENCES[variant];
  const [idx, setIdx] = useState(0);
  const phase = seq[idx];

  /* Always replay this tile's story from its first beat when the section scrolls
     into view — so the viewer never lands mid-cycle. */
  useEffect(() => {
    if (inView) setIdx(0);
  }, [inView]);

  /* Chained timeline so each beat can hold for a different length. The parent
     starts/pauses this by toggling `inView` (at 30% of the section). */
  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => setIdx((i) => (i + 1) % seq.length), (PHASE_HOLD[phase] + CROSSFADE) * 1000);
    return () => clearTimeout(id);
  }, [inView, idx, phase, seq.length]);

  const showRaw = variant === "full" || variant === "raw";
  const showFlow = variant === "full" || variant === "insight";
  const showSlide = variant === "full" || variant === "slide";

  return (
    <div style={transparentBg
      ? { position: "absolute", inset: 0, background: "transparent", overflow: "hidden", transform: "scale(1.1)", transformOrigin: "center" }
      : { position: "absolute", inset: 0, backgroundColor: CANVAS_BG, backgroundImage: "radial-gradient(circle, rgba(27,40,64,0.12) 1px, transparent 1.4px)", backgroundSize: "26px 26px", overflow: "hidden", transform: "scale(1.1)", transformOrigin: "center" }}>
      {showRaw && <RawLayer phase={phase} onDark={transparentBg} />}
      {showFlow && <FlowLayer phase={phase} />}
      {showSlide && <SlideLayer phase={phase} />}
    </div>
  );
}
