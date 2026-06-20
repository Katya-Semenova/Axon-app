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
const PHASE_HOLD = [0.8, 0.75, 0.85, 0.9]; // raw · insight · connect · slide — near-uniform so the loop runs at one continuous speed
const PHASES = 4;

/* ── Easing — one Apple-ish vocabulary across the whole showcase ── */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];   // expo-out — elegant settle
const EASE_INOUT: [number, number, number, number] = [0.4, 0, 0.2, 1];  // soft crossfade
const EASE_INTAKE: [number, number, number, number] = [0.6, 0, 0.9, 0.15]; // vortex "suck-in" — accelerates inward

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

function RawLayer({ phase }: { phase: number }) {
  const active = phase === 0;
  return (
    <motion.div
      initial={false}
      /* On exit the whole field spins inward + collapses to a point — the
         vortex (raw data → AI working → converges to the seed of the insights). */
      animate={active ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.05, rotate: 150 }}
      transition={{ duration: active ? CROSSFADE : 0.45, ease: active ? EASE_OUT : EASE_INTAKE }}
      style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%" }}
    >
      {RAW_LAYOUT.map((d, k) => (
        <motion.span
          key={k}
          style={{ position: "absolute", left: d.x, top: d.y, fontFamily: MONO, fontSize: d.s, color: COLORS[d.c], whiteSpace: "nowrap", willChange: "transform, opacity" }}
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
    <div style={{ width, background: SURFACE_RAISE, border: `1px solid ${BORDER}`, fontFamily: "Inter, sans-serif", boxShadow: "0 4px 14px rgba(27,40,64,0.12)" }}>
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
  a:  { left: 62,  top: 85,  w: 150 }, // insight A (text)
  b:  { left: 62,  top: 205, w: 150 }, // insight B (data)
  ds: { left: 229, top: 133, w: 138 }, // dataset (between, to the right) — constellation centered in the card
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
      const portCenter = (host: HTMLElement | null, sel: string) => {
        const p = host?.querySelector(sel) as HTMLElement | null;
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { x: r.left + r.width / 2 - wb.left, y: r.top + r.height / 2 - wb.top };
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
  const enter = (p: { left: number; top: number }) => {
    const o = bornAt(p);
    return {
      initial: false as const,
      animate: visible
        ? { opacity: 1, scale: CARD_SCALE, x: 0, y: 0, filter: "blur(0px)" }
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
              fill="none" stroke={GOLD} strokeWidth={1.6} strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 2px rgba(200,168,107,0.45))" }}
              initial={false}
              animate={connect ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
              transition={{ pathLength: { duration: 0.5, ease: EASE_OUT, delay: connect ? 0.14 + i * 0.1 : 0 }, opacity: { duration: 0.16, delay: connect ? 0.14 + i * 0.1 : 0 } }}
            />
          ))}
        </svg>

        {/* insight A — text */}
        <motion.div
          {...enter(POS.a)}
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
          {...enter(POS.b)}
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
          {...enter(POS.ds)}
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
            width: SLIDE_W, height: SLIDE_H, background: SURFACE_RAISE, border: `1px solid ${BORDER}`,
            boxShadow: "0 12px 38px rgba(27,40,64,0.16)", padding: "12px 16px", overflow: "hidden",
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
export function PrototypeShowcase({ inView }: { inView: boolean }) {
  const [phase, setPhase] = useState(0);

  /* Chained timeline so each beat can hold for a different length. The parent
     starts/pauses this by toggling `inView` (at 30% of the section). */
  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => setPhase((p) => (p + 1) % PHASES), (PHASE_HOLD[phase] + CROSSFADE) * 1000);
    return () => clearTimeout(id);
  }, [inView, phase]);

  return (
    <div style={{ position: "absolute", inset: 0, background: CANVAS_BG, overflow: "hidden" }}>
      <RawLayer phase={phase} />
      <FlowLayer phase={phase} />
      <SlideLayer phase={phase} />
    </div>
  );
}
