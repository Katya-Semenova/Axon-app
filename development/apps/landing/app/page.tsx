'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { TOKENS, COLORS } from './_axon/rawData';
import { PrototypeShowcase } from './_axon/PrototypeShowcase';
import { trackEvent, GOALS } from '../lib/analytics';

// ── "Easy-peasy" / Why-Axon section animation timing (seconds) — tweak freely ──
const CARD_SLIDE = 0.7;     // bento card slide-in duration
const CARD_STAGGER = 0.13;  // delay between cards
const COUNT_DUR = 0.8;      // 0→6 / 0→12 count-up duration (~20% faster)
const STRIKE_DUR = 0.55;    // strikethrough draw duration
const STEP_INTERVAL = 1.08; // step highlight cycle interval (~20% slower)
const ARROW_DRIFT = 1.6;    // arrow back-and-forth period
const PULSE_PERIOD = 1.8;   // "12 min" pulse period
const CARD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]; // calm slide ease

// Choreography: cards assemble first → numbers count → bullets start once numbers settle.
const COUNT_DELAY = 3 * CARD_STAGGER + CARD_SLIDE / 2; // count starts when the last card is mid-path
const NUMBERS_DONE = COUNT_DELAY + COUNT_DUR;          // count finished (strike + pulse fire here)
const STEPS_DELAY = COUNT_DELAY;                       // bullets cycle starts together with the count

// Slide-in offsets — each card enters through an adjacent empty grid cell (~224px step).
const CARD_OFFSETS = [
  { x: 226, y: 0 },   // Control — from the right
  { x: 0, y: 224 },   // Craft — from below
  { x: 0, y: -224 },  // Clarity — from above
  { x: 226, y: 0 },   // Confidence — from the right
];

// FAQ — видимая секция + источник для FAQPage JSON-LD (GEO). Один массив,
// чтобы текст на странице и в разметке не разъезжались.
const FAQS: { q: string; a: string }[] = [
  {
    q: 'What does Axon do?',
    a: "Axon turns raw spreadsheets — CSV or Excel — into clear charts, insights and presentation-ready slides. Drop your data and the AI proposes the charts and a narrative; you shape the story.",
  },
  {
    q: 'Do I need design or charting skills?',
    a: 'No. Axon picks the right chart types and handles layout and styling for you. You focus on what the data means, not on slide design.',
  },
  {
    q: 'Is my data private?',
    a: "Yes. Your files stay tied to your account. To plan charts, Axon sends the AI only a small schema and a short sample — never your full dataset.",
  },
  {
    q: 'Is Axon free to start?',
    a: 'Yes. You can start with no credit card, and your first deck is on us.',
  },
  {
    q: 'Does Axon work on mobile?',
    a: 'Axon is made for focused desktop work — analyzing data and composing decks on a large screen. A phone shows a short notice instead of the workspace.',
  },
];

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const chaosLayerRef = useRef<HTMLDivElement>(null);
  const heroCardsRef = useRef<HTMLDivElement>(null);
  const heroBottomRef = useRef<HTMLDivElement>(null);

  // ── "Easy-peasy" section animation ──
  const problemRef = useRef<HTMLElement>(null);
  const problemEntered = useInView(problemRef, { amount: 0.3 }); // replays every time the section re-enters view
  const reduced = useReducedMotion() ?? false;
  const showFinal = reduced || problemEntered;
  const [activeStep, setActiveStep] = useState(0);
  const [stepsStarted, setStepsStarted] = useState(false);
  const [counts, setCounts] = useState<{ a: number; b: number }>(() => (reduced ? { a: 6, b: 12 } : { a: 0, b: 0 }));

  // ── Live Prototype: run the showcase loop once 30% of its section is in view ──
  const protoSectionRef = useRef<HTMLElement>(null);
  const protoInView = useInView(protoSectionRef, { amount: 0.3 });

  // ── Hero chaos animation ──
  useEffect(() => {
    const hero = heroRef.current;
    const chaosLayer = chaosLayerRef.current;
    const heroCards = heroCardsRef.current;
    const heroBottom = heroBottomRef.current;
    if (!hero || !chaosLayer || !heroCards || !heroBottom) return;

    // Capture as non-null consts so closures retain the narrowed type
    const root = hero;
    const layer = chaosLayer;
    const cards = heroCards;
    const bottom = heroBottom;

    let heroState = 'before';

    const SCREENSHOT_SVGS = [
      `<svg xmlns='http://www.w3.org/2000/svg' width='110' height='72' viewBox='0 0 110 72'><rect width='110' height='72' rx='6' fill='white' stroke='rgba(26,39,66,0.12)' stroke-width='1'/><rect x='4' y='4' width='102' height='10' rx='2' fill='rgba(26,39,66,0.08)'/><rect x='4' y='18' width='34' height='7' rx='1' fill='rgba(200,168,107,0.3)'/><rect x='42' y='18' width='28' height='7' rx='1' fill='rgba(26,39,66,0.07)'/><rect x='74' y='18' width='32' height='7' rx='1' fill='rgba(26,39,66,0.07)'/><rect x='4' y='29' width='34' height='7' rx='1' fill='rgba(26,39,66,0.06)'/><rect x='42' y='29' width='28' height='7' rx='1' fill='rgba(200,168,107,0.18)'/><rect x='74' y='29' width='32' height='7' rx='1' fill='rgba(26,39,66,0.06)'/><rect x='4' y='40' width='34' height='7' rx='1' fill='rgba(26,39,66,0.05)'/><rect x='42' y='40' width='28' height='7' rx='1' fill='rgba(26,39,66,0.05)'/><rect x='74' y='40' width='32' height='7' rx='1' fill='rgba(200,168,107,0.22)'/><rect x='4' y='51' width='34' height='7' rx='1' fill='rgba(26,39,66,0.04)'/><rect x='42' y='51' width='28' height='7' rx='1' fill='rgba(26,39,66,0.04)'/><rect x='74' y='51' width='32' height='7' rx='1' fill='rgba(26,39,66,0.04)'/><rect x='4' y='62' width='60' height='4' rx='1' fill='rgba(139,149,168,0.2)'/></svg>`,
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='80' viewBox='0 0 120 80'><rect width='120' height='80' rx='6' fill='white' stroke='rgba(26,39,66,0.12)' stroke-width='1'/><rect x='4' y='4' width='54' height='34' rx='3' fill='rgba(26,39,66,0.85)'/><rect x='62' y='4' width='54' height='15' rx='3' fill='rgba(200,168,107,0.35)'/><rect x='62' y='23' width='54' height='15' rx='3' fill='rgba(26,39,66,0.1)'/><rect x='4' y='42' width='112' height='3' rx='1' fill='rgba(26,39,66,0.08)'/><rect x='4' y='50' width='26' height='24' rx='3' fill='rgba(200,168,107,0.22)'/><rect x='34' y='50' width='26' height='24' rx='3' fill='rgba(26,39,66,0.07)'/><rect x='64' y='50' width='52' height='24' rx='3' fill='rgba(26,39,66,0.05)'/></svg>`,
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='68' viewBox='0 0 100 68'><rect width='100' height='68' rx='6' fill='white' stroke='rgba(26,39,66,0.12)' stroke-width='1'/><rect x='4' y='4' width='55' height='6' rx='2' fill='rgba(26,39,66,0.12)'/><rect x='4' y='14' width='30' height='4' rx='1' fill='rgba(139,149,168,0.3)'/><rect x='8' y='52' width='10' height='10' rx='1' fill='rgba(26,39,66,0.7)'/><rect x='22' y='38' width='10' height='24' rx='1' fill='rgba(200,168,107,0.8)'/><rect x='36' y='44' width='10' height='18' rx='1' fill='rgba(26,39,66,0.5)'/><rect x='50' y='30' width='10' height='32' rx='1' fill='rgba(200,168,107,0.6)'/><rect x='64' y='42' width='10' height='20' rx='1' fill='rgba(26,39,66,0.4)'/><rect x='78' y='34' width='10' height='28' rx='1' fill='rgba(200,168,107,0.5)'/><line x1='8' y1='62' x2='92' y2='62' stroke='rgba(26,39,66,0.15)' stroke-width='1'/></svg>`,
    ];

    const COLS = 8, ROWS = 6, EXCL = 248;

    interface ChaosItem {
      el: HTMLElement;
      x: number; y: number; rot: number;
      baseOp: number;
      driftR: number; driftT: number; driftOff: number;
      breatheT: number; breatheOff: number;
      breatheLo: number; breatheHi: number;
      driftAng: number;
      driftAnim: Animation | null;
      breatheAnim: Animation | null;
    }

    function buildChaos(): ChaosItem[] {
      const vw = window.innerWidth, vh = window.innerHeight;
      const cx = vw / 2, cy = vh / 2;
      const cw = vw / COLS, ch = vh / ROWS;
      const data: ChaosItem[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = (c + 0.2 + Math.random() * 0.6) * cw;
          const y = (r + 0.2 + Math.random() * 0.6) * ch;
          if (Math.hypot(x - cx, y - cy) < EXCL) continue;
          const isScreenshot = Math.random() < 0.15;
          const baseOp = isScreenshot ? 0.18 + Math.random() * 0.12 : 0.38 + Math.random() * 0.30;
          const driftR = 16 + Math.random() * 22;
          const driftT = 22000 + Math.random() * 18000;
          const driftOff = Math.random() * driftT;
          const breatheT = 8000 + Math.random() * 4000;
          const breatheOff = Math.random() * breatheT;
          const rot = (Math.random() - 0.5) * (isScreenshot ? 6 : 10);
          const el = document.createElement(isScreenshot ? 'div' : 'span');
          if (isScreenshot) {
            el.innerHTML = SCREENSHOT_SVGS[Math.floor(Math.random() * SCREENSHOT_SVGS.length)];
            el.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:rotate(${rot}deg);opacity:0;will-change:transform,opacity;pointer-events:none;filter:drop-shadow(0 2px 8px rgba(26,39,66,0.08))`;
          } else {
            el.textContent = TOKENS[Math.floor(Math.random() * TOKENS.length)];
            el.style.cssText = `position:absolute;left:${x}px;top:${y}px;font-family:'JetBrains Mono',monospace;font-size:${10 + Math.random() * 5}px;color:${COLORS[Math.floor(Math.random() * COLORS.length)]};transform:rotate(${rot}deg);opacity:0;will-change:transform,opacity;white-space:nowrap;pointer-events:none`;
          }
          layer.appendChild(el);
          data.push({
            el, x, y, rot, baseOp, driftR, driftT, driftOff, breatheT, breatheOff,
            breatheLo: Math.max(0.25, baseOp - 0.1),
            breatheHi: Math.min(0.85, baseOp + 0.12),
            driftAng: Math.random() * Math.PI * 2,
            driftAnim: null, breatheAnim: null,
          });
        }
      }
      return data;
    }

    const chaosData = buildChaos();

    function startDrift(d: ChaosItem) {
      const steps = 8;
      const kfs: Keyframe[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = d.driftAng + (i / steps) * Math.PI * 2;
        kfs.push({ transform: `translate(${Math.cos(a) * d.driftR}px,${Math.sin(a) * d.driftR}px) rotate(${d.rot}deg)` });
      }
      d.driftAnim = d.el.animate(kfs, { duration: d.driftT, delay: -d.driftOff, iterations: Infinity, easing: 'linear' });
    }

    function startBreathe(d: ChaosItem) {
      d.breatheAnim = d.el.animate(
        [{ opacity: d.breatheLo }, { opacity: d.breatheHi }, { opacity: d.breatheLo }],
        { duration: d.breatheT, delay: -d.breatheOff, iterations: Infinity, easing: 'ease-in-out' }
      );
    }

    function startAllDrift() {
      chaosData.forEach(d => { if (!d.driftAnim) startDrift(d); if (!d.breatheAnim) startBreathe(d); });
    }

    function runEntrance() {
      heroState = 'entering';
      const l1 = root.querySelectorAll<HTMLElement>('#headlineLine1 .hw');
      const l2 = root.querySelectorAll<HTMLElement>('#headlineLine2 .hw');
      l1.forEach((w, i) => w.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, delay: i * 190, fill: 'forwards', easing: 'ease-out' }));
      l2.forEach((w, i) => w.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 360, delay: 750 + i * 190, fill: 'forwards', easing: 'ease-out' }));

      const vw = window.innerWidth, vh = window.innerHeight;
      chaosData.forEach((d, i) => {
        d.el.style.left = (vw / 2) + 'px';
        d.el.style.top = (vh / 2) + 'px';
        const anim = d.el.animate([
          { opacity: 0, transform: `translate(-50%,-50%) rotate(${d.rot}deg) scale(0.4)` },
          { opacity: d.baseOp, transform: `translate(${d.x - vw / 2}px,${d.y - vh / 2}px) rotate(${d.rot}deg) scale(1)` },
        ], { duration: 900, delay: i * 14, fill: 'forwards', easing: 'cubic-bezier(0.25,0.46,0.45,0.94)' });
        anim.onfinish = () => {
          d.el.style.left = d.x + 'px';
          d.el.style.top = d.y + 'px';
          d.el.style.opacity = String(d.baseOp);
        };
      });

      setTimeout(() => {
        const a = cards.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 700, fill: 'forwards', easing: 'ease-out' });
        a.onfinish = () => { cards.style.opacity = '1'; cards.style.transform = 'none'; };
      }, 600);

      setTimeout(() => {
        const a = bottom.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards', easing: 'ease-out' });
        a.onfinish = () => { bottom.style.opacity = '1'; };
      }, 1000);

      setTimeout(() => { heroState = 'drifting'; startAllDrift(); }, 1800);
    }

    const obs = new IntersectionObserver(entries => {
      const v = entries[0].isIntersecting;
      if (v && heroState === 'before') runEntrance();
      else if (v && heroState === 'drifting') chaosData.forEach(d => { d.driftAnim?.play(); d.breatheAnim?.play(); });
      else if (!v && heroState === 'drifting') chaosData.forEach(d => { d.driftAnim?.pause(); d.breatheAnim?.pause(); });
    }, { threshold: 0.15 });

    obs.observe(root);

    return () => {
      obs.disconnect();
      chaosData.forEach(d => {
        d.driftAnim?.cancel();
        d.breatheAnim?.cancel();
        d.el.remove();
      });
    };
  }, []);

  // ── Shift scroll mechanism ──
  useEffect(() => {
    const shiftSection = document.getElementById('shift');
    const shiftTrack = document.getElementById('shiftTrack');
    if (!shiftTrack) return;

    const screens = document.querySelectorAll<HTMLElement>('.mock-screen');
    const panels = document.querySelectorAll<HTMLElement>('.act-panel');
    const dots = document.querySelectorAll<HTMLElement>('.act-dot');
    const ACT_COUNT = 5;
    let activeAct = -1;

    function activateAct(idx: number) {
      if (idx === activeAct) return;
      activeAct = idx;
      screens.forEach((s, i) => { s.classList.toggle('active', i === idx); s.style.opacity = i === idx ? '1' : '0'; });
      panels.forEach((p, i) => { p.style.opacity = i === idx ? '1' : '0'; p.style.pointerEvents = i === idx ? 'auto' : 'none'; });
      dots.forEach((d, i) => { d.style.background = i === idx ? '#C8A86B' : 'rgba(26,39,66,0.2)'; d.style.transform = i === idx ? 'scale(1.4)' : 'scale(1)'; });
    }
    activateAct(0);

    function onScroll() {
      if (!shiftTrack) return;
      const rect = shiftTrack.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = shiftTrack.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolled / scrollable));
      const idx = Math.min(ACT_COUNT - 1, Math.floor(progress * ACT_COUNT));
      activateAct(idx);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // ── Modes intersection observer ──
  useEffect(() => {
    const grid = document.getElementById('modesGrid');
    if (!grid) return;
    const cols = grid.querySelectorAll<HTMLElement>('.mode-col');
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        cols.forEach(c => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; });
      }
    }, { threshold: 0.2 });
    obs.observe(grid);
    return () => obs.disconnect();
  }, []);

  // ── "Easy-peasy": after the cards settle, count 0→6 / 0→12 ──
  useEffect(() => {
    // На мобилке (≤640px) показываем сразу финальные 6/12 без анимации: на узком экране
    // счётчик внизу длинной секции и при скролле вверх «обнулялся» в 0. Статика — надёжнее.
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    if (reduced || isMobile) { setCounts({ a: 6, b: 12 }); return; }
    if (!problemEntered) { setCounts({ a: 0, b: 0 }); return; } // reset so it re-counts on re-entry
    let raf = 0;
    const start = setTimeout(() => {
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / (COUNT_DUR * 1000));
        const e = 1 - Math.pow(1 - p, 1.35); // gentle, near-even pacing (no front-loaded jump)
        setCounts({ a: Math.round(e * 6), b: Math.round(e * 12) });
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, COUNT_DELAY * 1000);
    return () => { clearTimeout(start); cancelAnimationFrame(raf); };
  }, [problemEntered, reduced]);

  // ── "Easy-peasy": once the numbers settle, cycle the gold highlight across steps 1–4 ──
  useEffect(() => {
    if (reduced || !problemEntered) { setStepsStarted(false); return; } // reset so it re-cycles on re-entry
    let id = 0;
    const start = setTimeout(() => {
      setStepsStarted(true);
      setActiveStep(0);
      id = window.setInterval(() => setActiveStep(s => (s + 1) % 4), STEP_INTERVAL * 1000);
    }, STEPS_DELAY * 1000);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [problemEntered, reduced]);

  return (
    <>
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 px-6">
        <div className="max-w-[1152px] mx-auto h-16 flex items-center justify-between">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-primary">AXON</span>
          <div className="flex items-center gap-6">
            <a href="https://axon-app.ru/ai-studio" target="_blank" onClick={() => trackEvent(GOALS.ctaClick)} className="text-sm font-body text-soft hover:text-primary transition-colors">Try Axon</a>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ═══ HERO ═══ */}
      <section id="hero" ref={heroRef} style={{ order: 1,height: '100vh', position: 'relative', overflow: 'hidden', background: '#F4F0E8' }}>
        <div id="chaosLayer" ref={chaosLayerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />
        <div id="heroContent" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, zIndex: 2, padding: '0 24px' }}>
          <div id="heroHeadline" style={{ textAlign: 'center', lineHeight: 1.05, marginBottom: 32 }}>
            <div id="headlineLine1" style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(38px,5.2vw,82px)', fontWeight: 400, color: '#1A2742', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.22em', marginBottom: '0.06em' }}>
              {['From', 'data', 'to', 'story.'].map(w => <span key={w} className="hw" style={{ opacity: 0 }}>{w}</span>)}
            </div>
            <div id="headlineLine2" style={{ fontFamily: "'Instrument Serif',serif", fontSize: 'clamp(38px,5.2vw,82px)', fontWeight: 400, fontStyle: 'italic', color: '#C8A86B', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.22em' }}>
              {['Without', 'translation.'].map(w => <span key={w} className="hw" style={{ opacity: 0 }}>{w}</span>)}
            </div>
          </div>

          <div id="heroCards" ref={heroCardsRef} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', opacity: 0, transform: 'translateY(20px)', marginBottom: 28 }}>
            {/* Revenue mix card */}
            <div style={{ width: 192, height: 112, background: '#fff', border: '1px solid rgba(26,39,66,0.12)', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 12px rgba(26,39,66,.05)' }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: '#8B95A8', letterSpacing: '.07em', textTransform: 'uppercase' }}>Revenue mix</div>
              <div style={{ flex: 1, display: 'grid', gap: 3, gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                <div style={{ background: '#1A2742', borderRadius: 3, gridRow: 'span 2', opacity: .82 }} />
                <div style={{ background: '#C8A86B', borderRadius: 3, opacity: .72 }} />
                <div style={{ background: '#8B95A8', borderRadius: 3, opacity: .42 }} />
              </div>
            </div>
            {/* Churn by segment */}
            <div style={{ width: 192, height: 112, background: '#fff', border: '1px solid rgba(26,39,66,0.12)', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 12px rgba(26,39,66,.05)' }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: '#8B95A8', letterSpacing: '.07em', textTransform: 'uppercase' }}>Churn by segment</div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', paddingBottom: 2 }}>
                {[{ h: 26, op: .3, opDot: .42 }, { h: 48, col: '#C8A86B', opDot: 1 }, { h: 34, op: .3, opDot: .42 }, { h: 18, op: .2, opDot: .32 }].map((seg, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: seg.h, background: seg.col ?? `rgba(26,39,66,${seg.op})`, borderRadius: 1 }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: seg.col ?? `rgba(26,39,66,${seg.opDot})`, marginTop: -1 }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Activity heatmap */}
            <div style={{ width: 192, height: 112, background: '#fff', border: '1px solid rgba(26,39,66,0.12)', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 2px 12px rgba(26,39,66,.05)' }}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: '#8B95A8', letterSpacing: '.07em', textTransform: 'uppercase' }}>Activity heatmap</div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 3 }}>
                {[['#C8A86B',.22],['#C8A86B',.68],['#1A2742',.18],['#C8A86B',.88],['#1A2742',.13],['#C8A86B',.48],['#C8A86B',.78],['#1A2742',.1],['#C8A86B',.38],['#1A2742',.22],['#C8A86B',.58],['#C8A86B',.32]].map(([col, op], i) => (
                  <div key={i} style={{ borderRadius: 2, background: col as string, opacity: op as number }} />
                ))}
              </div>
            </div>
          </div>

          <div id="heroBottom" ref={heroBottomRef} style={{ textAlign: 'center', opacity: 0, maxWidth: 500 }}>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#8B95A8', lineHeight: 1.7, margin: '0 0 22px' }}>
              Drop your data. Get your story.<br />Axon&apos;s AI finds the signal — you own the narrative.
            </p>
            <div className="hero-cta-row" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <a href="https://axon-app.ru/ai-studio" target="_blank" rel="noopener" onClick={() => trackEvent(GOALS.ctaClick)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1A2742', color: '#F4F0E8', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, padding: '12px 24px', borderRadius: 4, textDecoration: 'none' }}>Try Axon free →</a>
              <a href="#problem" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(26,39,66,.2)', color: '#1A2742', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, padding: '12px 24px', borderRadius: 4, textDecoration: 'none' }}>See how it works ↓</a>
            </div>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: 'rgba(139,149,168,.6)' }}>No credit card. First deck on us.</p>
            {/* Мягкое предупреждение: сервис десктоп-онли (на мобиле воркспейс перекрыт DesktopOnlyNotice). */}
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: 'rgba(139,149,168,.6)', marginTop: 6, letterSpacing: '.02em' }}>Made for focused desktop work.</p>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM / WHY AXON ═══ */}
      <section ref={problemRef} id="problem" style={{ order: 5,background: '#F4F0E8', borderTop: '1px solid rgba(26,39,66,0.1)', padding: '113px 24px 112px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 56, maxWidth: 672 }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C8A86B', display: 'block', marginBottom: 16 }}>
              Why Axon
            </span>
            <h2 className="big-serif-h2" style={{ margin: 0 }}>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>You stay</span>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#C8A86B' }}>the author.</span>
            </h2>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: '22px', color: 'rgba(26,39,66,0.8)', margin: '4px 0 0', maxWidth: 512 }}>
              The insight is there. The bottleneck is the translation layer between raw numbers and a room that acts on them.
            </p>
          </div>

          {/* ── Two boxes ── (адаптив: .why-grid стекается в столбик < 1180px, см. globals.css) */}
          <div className="why-grid">

            {/* LEFT BOX — staggered bento cards */}
            {/* background matches section cream so the box feels unified */}
            <div className="why-box why-box-left" style={{ borderRadius: 4, overflow: 'hidden', background: '#F4F0E8', height: 775, position: 'relative', flexShrink: 0 }}>

              {/* ── Decorative background: 4-col × 5-row masked grid (z-index 0) ──
                  Col 1 (x=-164) and col 4 (x=514) extend outside the 566px box and
                  are clipped by overflow:hidden, creating the "infinite grid" edge peek.
                  ~52px of each outer column is visible at the left/right edges. */}
              <div className="why-deco" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {[-166, 58, 282, 506, 730].flatMap(top =>
                  [-164, 62, 288, 514].map(left => (
                    <div
                      key={`${top}-${left}`}
                      style={{
                        position: 'absolute', left, top, width: 216, height: 216,
                        borderRadius: 4,
                        background: 'rgba(180,198,220,0.22)',
                        border: '1px solid rgba(180,198,220,0.14)',
                      }}
                    />
                  ))
                )}
              </div>

              {/* ── Cards (z-index 1) ── */}

              {/* Control — navy, top-left */}
              <motion.div initial={false} animate={showFinal ? { x: 0, y: 0, opacity: 1 } : { x: CARD_OFFSETS[0].x, y: CARD_OFFSETS[0].y, opacity: 0 }} transition={reduced ? { duration: 0 } : { duration: CARD_SLIDE, delay: 0 * CARD_STAGGER, ease: CARD_EASE }} className="why-card" style={{ position: 'absolute', zIndex: 1, left: 62, top: 58, width: 216, height: 216 }}>
                <motion.div initial={false} animate={{ x: 0, y: 0 }} whileHover={reduced ? undefined : { y: -3 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ width: '100%', height: '100%', borderRadius: 4, background: 'rgba(26,39,66,0.85)', border: '1px solid rgba(26,39,66,0.1)', padding: 17, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(244,240,232,0.88)' }}>Control</span>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontWeight: 400, lineHeight: '32px', color: 'rgba(244,240,232,0.88)', margin: '0 0 6px' }}>You stay<br />the director</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, lineHeight: '16px', color: 'rgba(244,240,232,0.88)', margin: 0 }}>Define the purpose — Axon structures around your intent. The final call is always yours.</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Craft — gold, middle-left */}
              <motion.div initial={false} animate={showFinal ? { x: 0, y: 0, opacity: 1 } : { x: CARD_OFFSETS[1].x, y: CARD_OFFSETS[1].y, opacity: 0 }} transition={reduced ? { duration: 0 } : { duration: CARD_SLIDE, delay: 1 * CARD_STAGGER, ease: CARD_EASE }} className="why-card" style={{ position: 'absolute', zIndex: 1, left: 62, top: 282, width: 216, height: 216 }}>
                <motion.div initial={false} animate={{ x: 0, y: 0 }} whileHover={reduced ? undefined : { y: -3 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ width: '100%', height: '100%', borderRadius: 4, background: 'rgba(200,168,107,0.8)', border: '1px solid rgba(26,39,66,0.1)', padding: 17, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#1A2742' }}>Craft</span>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontWeight: 400, lineHeight: '34px', color: '#1A2742', margin: '0 0 6px' }}>You&apos;re crafting</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, lineHeight: '16px', color: '#1A2742', margin: 0 }}>Axon proposes visual concepts — you choose the hierarchy, the metaphor, the mood.</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Clarity — navy, middle-right */}
              <motion.div initial={false} animate={showFinal ? { x: 0, y: 0, opacity: 1 } : { x: CARD_OFFSETS[2].x, y: CARD_OFFSETS[2].y, opacity: 0 }} transition={reduced ? { duration: 0 } : { duration: CARD_SLIDE, delay: 2 * CARD_STAGGER, ease: CARD_EASE }} className="why-card" style={{ position: 'absolute', zIndex: 1, left: 288, top: 282, width: 216, height: 216 }}>
                <motion.div initial={false} animate={{ x: 0, y: 0 }} whileHover={reduced ? undefined : { y: -3 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ width: '100%', height: '100%', borderRadius: 4, background: 'rgba(26,39,66,0.85)', border: '1px solid rgba(26,39,66,0.1)', padding: 17, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(244,240,232,0.88)' }}>Clarity</span>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontWeight: 400, lineHeight: '32px', color: 'rgba(244,240,232,0.88)', margin: '0 0 6px' }}>The exhausting<br />part is invisible</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, lineHeight: '16px', color: 'rgba(244,240,232,0.88)', margin: 0 }}>AI agent parses, cleans, and ranks. You think about decisions, not formatting.</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Confidence — gold, bottom-right */}
              <motion.div initial={false} animate={showFinal ? { x: 0, y: 0, opacity: 1 } : { x: CARD_OFFSETS[3].x, y: CARD_OFFSETS[3].y, opacity: 0 }} transition={reduced ? { duration: 0 } : { duration: CARD_SLIDE, delay: 3 * CARD_STAGGER, ease: CARD_EASE }} className="why-card" style={{ position: 'absolute', zIndex: 1, left: 288, top: 506, width: 216, height: 216 }}>
                <motion.div initial={false} animate={{ x: 0, y: 0 }} whileHover={reduced ? undefined : { y: -3 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ width: '100%', height: '100%', borderRadius: 4, background: 'rgba(200,168,107,0.8)', border: '1px solid rgba(26,39,66,0.1)', padding: 17, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#1A2742' }}>Confidence</span>
                  <div>
                    <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 32, fontWeight: 400, lineHeight: '32px', color: '#1A2742', margin: '0 0 6px' }}>Send it without<br />checking twice</h3>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, lineHeight: '16px', color: '#1A2742', margin: 0 }}>The deck builds itself in real time — charts, headers, data blocks assembling as you work.</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* RIGHT BOX — numbered steps + stats */}
            <div className="why-box" style={{ borderRadius: 4, overflow: 'hidden', background: 'rgba(200,168,107,0.15)', height: 775, position: 'relative', flexShrink: 0 }}>
              {/* Easy-peasy heading */}
              <div className="why-ep-head" style={{ position: 'absolute', left: 85, top: 216, transform: 'translateY(-50%)', fontFamily: "'Instrument Serif',serif", fontSize: 42, lineHeight: '46px', color: '#1A2742', whiteSpace: 'nowrap' }}>Easy-peasy</div>
              <div className="why-ep-body" style={{ position: 'absolute', left: 85, right: 60, top: 257 }}>

                {/* Numbered steps */}
                {[
                  'Parses every row, column, and relationship',
                  'Ranks insights by financial, time, and strategic value',
                  'Selects chart types that serve the story, not the default',
                  "Assembles a deck you're proud to put your name on",
                ].map((txt, i) => {
                  const on = !reduced && stepsStarted && i === activeStep;
                  return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, paddingBottom: 6, opacity: on ? 1 : 0.6, transition: 'opacity .4s ease', ...(i < 3 ? { borderRight: '1px solid rgba(244,240,232,0.08)' } : {}) }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: on ? 'rgba(200,168,107,0.55)' : 'rgba(200,168,107,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .4s ease' }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: '#C8A86B', lineHeight: 1 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, lineHeight: '16px', color: on ? 'rgba(26,39,66,0.92)' : 'rgba(26,39,66,0.6)', margin: 0, transition: 'color .4s ease' }}>{txt}</p>
                  </div>
                  );
                })}

                {/* Stats block */}
                <div style={{ marginTop: 24, position: 'relative' }}>
                  <div className="why-stats" style={{ background: '#1A2742', borderRadius: 4, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, border: '1px solid rgba(244,240,232,0.08)' }}>
                    {/* 6 hrs — crossed out */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="why-bignum" style={{ position: 'relative', display: 'inline-block', textAlign: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 72, lineHeight: '60px', color: '#8B95A8' }}>
                        {/* invisible "6" reserves a fixed width so per-digit width changes never reflow the row */}
                        <span aria-hidden="true" style={{ visibility: 'hidden' }}>6</span>
                        <span style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>{counts.a}</span>
                        {/* reused strike line — same angle/position; only the draw-in (scaleX) is new */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(126deg)' }}>
                          <motion.div initial={false} animate={{ scaleX: showFinal ? 1 : 0 }} transition={reduced ? { duration: 0 } : { duration: STRIKE_DUR, delay: showFinal ? NUMBERS_DONE : 0, ease: 'easeInOut' }} style={{ width: 68, height: 2, background: 'rgba(139,149,168,0.75)', borderRadius: 1, transformOrigin: 'left center' }} />
                        </div>
                      </span>
                      <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 30.2, lineHeight: '30.24px', color: '#8B95A8' }}>hrs</span>
                    </div>
                    {/* with Axon + arrow */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: '#F4F0E8', lineHeight: '20px' }}>with Axon</span>
                      <motion.span animate={reduced ? { x: 0 } : { x: [0, 5, 0] }} transition={reduced ? { duration: 0 } : { duration: ARROW_DRIFT, repeat: Infinity, ease: 'easeInOut' }} style={{ display: 'inline-block', fontFamily: "'Inter',sans-serif", fontSize: 32, color: '#C8A86B', lineHeight: '48px' }}>→</motion.span>
                    </div>
                    {/* 12 min */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      {/* invisible "12" reserves a fixed width so counting never reflows the row;
                          the live number sits absolutely on top and pulses smoothly */}
                      <span className="why-bignum" style={{ position: 'relative', display: 'inline-block', textAlign: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 72, lineHeight: '72px', color: '#F4F0E8' }}>
                        <span aria-hidden="true" style={{ visibility: 'hidden' }}>12</span>
                        <motion.span
                          animate={showFinal && !reduced ? { scale: 1.05 } : { scale: 1 }}
                          transition={showFinal && !reduced ? { duration: PULSE_PERIOD / 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: NUMBERS_DONE } : { duration: 0 }}
                          style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'inline-block', transformOrigin: 'center bottom', willChange: 'transform' }}
                        >{counts.b}</motion.span>
                      </span>
                      <span style={{ fontFamily: "'Instrument Serif',serif", fontSize: 30.2, lineHeight: '30.24px', color: '#F4F0E8' }}>min</span>
                    </div>
                  </div>
                  {/* Labels below stats block */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#1A2742' }}>of reformatting</span>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#1A2742' }}>from raw data</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ THE SHIFT ═══ */}
      <section id="shift" className="border-t divider" style={{ order: 3 }}>
        <div id="shiftTrack" style={{ height: '500vh', position: 'relative' }}>
          <div id="shiftSticky" style={{ position: 'sticky', top: 0, height: '100vh' }} className="px-6">
            <div className="max-w-[1152px] mx-auto h-full flex flex-col justify-center gap-12">

              {/* Heading — pinned with the demo so it stays beside the picture */}
              <div id="shiftHeader">
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C8A86B', display: 'block', marginBottom: 16 }}>The Shift</span>
                <h2 className="big-serif-h2" style={{ margin: 0 }}>
                  <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>Three files in.</span>
                  <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#C8A86B' }}>A board-ready deck out.</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-10 w-full items-center">

                {/* LEFT: browser mockup */}
                <div className="shift-mock-cell">
                  <div style={{ overflow: 'hidden', borderRadius: 4, border: '1px solid rgba(26,39,66,0.12)', background: 'rgba(255,255,255,0.4)', boxShadow: '0 2px 20px rgba(26,39,66,0.06)', height: 340 }}>
                    {/* Browser chrome */}
                    <div style={{ background: 'rgba(26,39,66,0.05)', borderBottom: '1px solid rgba(26,39,66,0.08)', padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
                      {[.18, .13, .08].map((op, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: `rgba(26,39,66,${op})` }} />)}
                      <span className="font-body text-[11px] text-soft/50 ml-2">axon.ai/canvas</span>
                    </div>

                    <div style={{ position: 'relative', height: 'calc(340px - 37px)' }}>

                      {/* Screen 0: Drop data */}
                      <div className="mock-screen active" data-screen="0" style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: 1 }}>
                        <div style={{ width: '100%', border: '2px dashed rgba(26,39,66,0.18)', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28, background: 'rgba(26,39,66,0.02)' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 4, background: 'rgba(200,168,107,0.18)', border: '1px solid rgba(200,168,107,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8A86B" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                          </div>
                          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#8B95A8', textAlign: 'center' }}>Drop files here or <span className="text-accent underline">browse</span></p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ height: 28, padding: '0 12px', borderRadius: 4, background: 'rgba(26,39,66,0.07)', border: '1px solid rgba(26,39,66,0.1)', fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#8B95A8', display: 'flex', alignItems: 'center', gap: 6 }}>📄 data.csv</div>
                          <div style={{ height: 28, padding: '0 12px', borderRadius: 4, background: 'rgba(26,39,66,0.07)', border: '1px solid rgba(26,39,66,0.1)', fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#8B95A8', display: 'flex', alignItems: 'center', gap: 6 }}>📊 metrics.sql</div>
                        </div>
                      </div>

                      {/* Screen 1: AI thinks */}
                      <div className="mock-screen" data-screen="1" style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, opacity: 0 }}>
                        {[{ text: 'Parsing 3 files, 47 tables, 218K rows...' }, { text: null }].map((msg, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A2742', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F4F0E8" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4" /></svg>
                            </div>
                            <div style={{ flex: 1, background: '#E8EAED', border: '1px solid rgba(26,39,66,0.1)', borderRadius: '12px 12px 12px 2px', padding: 14 }}>
                              {i === 0
                                ? <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#1A2742', lineHeight: 1.5 }}>Parsing 3 files, 47 tables, 218K rows...</p>
                                : <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#1A2742' }}>Detected <span className="text-accent font-medium">6 insights</span> worth surfacing.</p>
                              }
                            </div>
                          </div>
                        ))}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 40 }}>
                          {[0, 0.2, 0.4].map((delay, i) => (
                            <span key={i} className="thinking-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(139,149,168,0.5)', display: 'inline-block', animationDelay: `${delay}s` }} />
                          ))}
                        </div>
                      </div>

                      {/* Screen 2: Insights connect */}
                      <div className="mock-screen" data-screen="2" style={{ position: 'absolute', inset: 0, padding: 20, opacity: 0 }}>
                        <div style={{ height: '100%', display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
                            {[
                              { label: 'Rev ↑12%', gold: true },
                              { label: 'Churn ↓', gold: false },
                              { label: 'CAC stable', gold: false },
                              { label: 'EU leads', gold: true, light: true },
                              { label: 'Q3 peak', gold: false },
                              { label: 'NPS 72', gold: true },
                            ].map((chip, i) => (
                              <div key={i} className="insight-chip" style={{ borderRadius: 4, background: chip.gold ? (chip.light ? 'rgba(200,168,107,0.1)' : 'rgba(200,168,107,0.15)') : 'rgba(26,39,66,0.06)', border: chip.gold ? (chip.light ? '1px solid rgba(200,168,107,0.2)' : '1px solid rgba(200,168,107,0.25)') : '1px solid rgba(26,39,66,0.1)', padding: '6px 8px', fontFamily: "'Inter',sans-serif", fontSize: 11, color: chip.gold ? 'rgba(26,39,66,0.7)' : '#8B95A8' }}>{chip.label}</div>
                            ))}
                          </div>
                          <svg style={{ width: 40, flexShrink: 0, alignSelf: 'stretch' }} viewBox="0 0 40 260" preserveAspectRatio="none">
                            {[['M0 25 Q20 25 40 80','#C8A86B',0.5],['M0 65 Q20 65 40 80','#8B95A8',0.4],['M0 105 Q20 105 40 130','#8B95A8',0.4],['M0 145 Q20 145 40 130','#C8A86B',0.5],['M0 185 Q20 185 40 180','#8B95A8',0.4],['M0 225 Q20 225 40 180','#8B95A8',0.3]].map(([d, stroke, op], i) => (
                              <path key={i} className="connector-draw" d={d as string} stroke={stroke as string} strokeWidth="1" fill="none" opacity={op as number} />
                            ))}
                          </svg>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 76 }}>
                            {[['Growth', false], ['Revenue', true], ['Retention', false]].map(([label, gold], i) => (
                              <div key={i} className="dataset-node" style={{ borderRadius: 4, background: gold ? 'rgba(200,168,107,0.1)' : 'rgba(26,39,66,0.07)', border: gold ? '1px solid rgba(200,168,107,0.2)' : '1px solid rgba(26,39,66,0.1)', padding: 8, textAlign: 'center', fontFamily: "'Inter',sans-serif", fontSize: 11, color: gold ? '#C8A86B' : '#8B95A8' }}>{label}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Screen 3: Visualize */}
                      <div className="mock-screen" data-screen="3" style={{ position: 'absolute', inset: 0, padding: 14, opacity: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
                          <div style={{ borderRadius: 4, border: '1px solid rgba(26,39,66,0.1)', background: 'rgba(255,255,255,0.5)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: 'rgba(139,149,168,0.7)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Revenue mix</p>
                            <div style={{ flex: 1, display: 'grid', gap: 3, gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr' }}>
                              <div style={{ background: '#1A2742', borderRadius: 3, gridRow: 'span 2', opacity: .78 }} />
                              <div style={{ background: '#C8A86B', borderRadius: 3, opacity: .65 }} />
                              <div style={{ background: '#8B95A8', borderRadius: 3, opacity: .38 }} />
                            </div>
                          </div>
                          <div style={{ borderRadius: 4, border: '1px solid rgba(26,39,66,0.1)', background: 'rgba(255,255,255,0.5)', padding: 8, display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: 'rgba(139,149,168,0.7)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Churn</p>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                              {[[.45,'rgba(26,39,66,0.45)',.6,'rgba(26,39,66,0.6)'],[.7,'#C8A86B',1,'#C8A86B'],[.82,'rgba(26,39,66,0.45)',1,'rgba(26,39,66,0.6)'],[.28,'rgba(139,149,168,0.5)',1,'rgba(139,149,168,0.6)']].map(([w, col, , dotCol], i) => (
                                <div key={i} style={{ position: 'relative', height: 1, background: 'rgba(26,39,66,0.12)' }}>
                                  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 1, background: col as string, width: `${(w as number) * 100}%` }} />
                                  <div style={{ position: 'absolute', left: `${(w as number) * 100}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%', background: dotCol as string }} />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ gridColumn: 'span 2', borderRadius: 4, border: '1px solid rgba(26,39,66,0.1)', background: 'rgba(255,255,255,0.5)', padding: 8 }}>
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, color: 'rgba(139,149,168,0.7)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>Activity heatmap</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 2 }}>
                              {[['#C8A86B',.22],['#C8A86B',.58],['#C8A86B',.82],['#C8A86B',.35],['#1A2742',.18],['#C8A86B',.68],['#1A2742',.1],['#C8A86B',.9],['#1A2742',.22],['#C8A86B',.42],['#1A2742',.14],['#C8A86B',.72],['#C8A86B',.52],['#1A2742',.18],['#C8A86B',.48],['#1A2742',.28]].map(([col, op], i) => (
                                <div key={i} style={{ height: 14, borderRadius: 2, background: col as string, opacity: op as number }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Screen 4: Ship */}
                      <div className="mock-screen" data-screen="4" style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, opacity: 0 }}>
                        <div style={{ position: 'relative', width: 180, height: 108 }}>
                          <div style={{ position: 'absolute', left: 24, right: 24, top: 20, borderRadius: 4, background: 'rgba(139,149,168,0.18)', border: '1px solid rgba(26,39,66,0.08)', height: 70 }} />
                          <div style={{ position: 'absolute', left: 12, right: 12, top: 10, borderRadius: 4, background: 'rgba(26,39,66,0.14)', border: '1px solid rgba(26,39,66,0.1)', height: 70 }} />
                          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, borderRadius: 4, background: '#1A2742', border: '1px solid rgba(26,39,66,0.2)', height: 70, display: 'flex', alignItems: 'flex-end', padding: '8px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%' }}>
                              {[[.6,14],[.7,26],[.55,18],[.4,10],[.65,22]].map(([op, h], i) => (
                                <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: '#C8A86B', opacity: op as number, height: h as number }} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div className="export-tag" style={{ borderRadius: 20, background: 'rgba(200,168,107,0.15)', border: '1px solid rgba(200,168,107,0.28)', padding: '6px 14px', fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: '#C8A86B' }}>PPTX</div>
                          <div className="export-tag" style={{ borderRadius: 20, background: 'rgba(26,39,66,0.07)', border: '1px solid rgba(26,39,66,0.12)', padding: '6px 14px', fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#8B95A8' }}>PDF</div>
                          <div className="export-tag" style={{ borderRadius: 20, background: 'rgba(26,39,66,0.07)', border: '1px solid rgba(26,39,66,0.12)', padding: '6px 14px', fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#8B95A8', display: 'flex', alignItems: 'center', gap: 4 }}>Link ↗</div>
                        </div>
                      </div>

                    </div>
                  </div>
                  {/* Dots */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="act-dot" data-dot={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#C8A86B' : 'rgba(26,39,66,0.2)', transform: i === 0 ? 'scale(1.4)' : 'scale(1)', transition: 'all .3s' }} />
                    ))}
                  </div>
                </div>

                {/* RIGHT: act text panels */}
                <div className="shift-panels" style={{ position: 'relative', height: 220 }}>
                  {[
                    { num: '01', title: 'Drop your data.', desc: 'Any CSV, SQL dump, or analytics export. Axon parses it.' },
                    { num: '02', title: 'The AI agent thinks.', desc: 'It reads tables, finds patterns, surfaces what matters.' },
                    { num: '03', title: 'Insights connect.', desc: 'The agent groups findings into datasets, ready to visualize.' },
                    { num: '04', title: 'Stories visualize themselves.', desc: 'Treemaps, heatmaps, lollipops — every chart chosen for clarity.' },
                    { num: '05', title: 'Ship the deck.', desc: 'Export as PPTX, PDF, live link. Present in minutes, not days.' },
                  ].map((act, i) => (
                    <div key={i} className="act-panel" data-panel={i} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: 24, borderLeft: '2px solid #C8A86B', opacity: i === 0 ? 1 : 0, transition: 'opacity .3s', pointerEvents: i === 0 ? 'auto' : 'none' }}>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C8A86B', marginBottom: 8 }}>{act.num}</p>
                      <h3 className="font-display" style={{ fontSize: 42, lineHeight: '46px', color: '#1A2742', marginBottom: 10 }}>{act.title}</h3>
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#8B95A8', lineHeight: 1.6 }}>{act.desc}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THREE MODES ═══ */}
      <section id="modes" className="py-[194px] px-6 border-t divider" style={{ order: 2,background: 'rgba(180,198,220,0.2)' }}>
        <div className="max-w-[1152px] mx-auto">
          <div className="mb-16 text-center modes-head">
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C8A86B', display: 'block', marginBottom: 16 }}>The Workflow</span>
            <h2 className="big-serif-h2" style={{ margin: 0 }}>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>Three chapters.</span>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#C8A86B' }}>One workspace.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/10" id="modesGrid">

            {/* Canvas */}
            <div className="mode-col px-8 py-6 md:py-0 md:first:pl-0 flex flex-col gap-6" style={{ opacity: 0, transform: 'translateY(1rem)', transition: 'opacity .5s ease, transform .5s ease' }}>
              <div className="rounded-[4px] border border-primary/10 bg-white/40 overflow-hidden canvas-preview" style={{ height: 180 }}>
                <div className="h-full p-5 flex flex-col justify-between">
                  <div className="flex gap-2 items-start flex-wrap">
                    <div className="node-chip rounded-[4px] bg-accent/20 border border-accent/30 px-3 py-1.5 text-xs font-body text-primary/70">Revenue ↑</div>
                    <div className="node-chip rounded-[4px] bg-primary/8 px-3 py-1.5 text-xs font-body text-soft">Churn ↓</div>
                    <div className="node-chip rounded-[4px] bg-highlight border border-primary/10 px-3 py-1.5 text-xs font-body text-soft">CAC stable</div>
                  </div>
                  <svg className="w-full" height="48" viewBox="0 0 260 48" preserveAspectRatio="none">
                    <path className="connector-path" d="M30 8 Q130 48 230 8" stroke="#C8A86B" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.6" />
                    <path className="connector-path2" d="M60 8 Q130 30 200 8" stroke="#8B95A8" strokeWidth="1" fill="none" strokeDasharray="3 4" opacity="0.4" />
                  </svg>
                  <div className="rounded-[4px] bg-primary/5 border border-primary/8 p-2.5">
                    <div className="flex gap-1.5 mb-1.5"><div className="h-1.5 rounded bg-accent/50 flex-1" /><div className="h-1.5 rounded bg-primary/15 w-1/3" /></div>
                    <div className="flex gap-1.5"><div className="h-1.5 rounded bg-primary/10 w-1/4" /><div className="h-1.5 rounded bg-accent/30 flex-1" /></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-soft/60 mb-3">Chapter I</p>
                <h3 className="font-display text-[42px] leading-[46px] text-primary mb-1">Canvas.<br /><span className="text-soft font-normal">The thinking.</span></h3>
                <p className="font-body text-sm text-soft leading-relaxed mt-3">Explore. Connect. Discover what your data is hiding.</p>
              </div>
            </div>

            {/* Slides */}
            <div className="mode-col px-8 py-6 md:py-0 flex flex-col gap-6" style={{ opacity: 0, transform: 'translateY(1rem)', transition: 'opacity .5s ease .12s, transform .5s ease .12s' }}>
              <div className="rounded-[4px] border border-primary/10 bg-white/40 overflow-hidden" style={{ height: 180 }}>
                <div className="h-full p-4 flex flex-col gap-2 slides-preview">
                  <div className="rounded-[4px] bg-primary border border-primary/20 p-3 flex-1 flex flex-col justify-between">
                    <div className="flex gap-1 mb-2"><div className="h-1.5 rounded bg-bg/30 w-2/3" /></div>
                    <div className="flex items-end gap-1 h-10">
                      {[[40],[70],[55],[90],[65]].map(([h], i) => (
                        <div key={i} className="slide-bar flex-1 rounded-t bg-accent/70" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <div className="flex gap-1 mt-2"><div className="h-1 rounded bg-bg/20 flex-1" /><div className="h-1 rounded bg-bg/20 w-1/2" /></div>
                  </div>
                  <div className="flex items-center gap-1.5 px-1"><div className="w-1.5 h-3 bg-accent/80 rounded-sm cursor-blink" /><div className="h-1 rounded bg-primary/15 flex-1" /></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-soft/60 mb-3">Chapter II</p>
                <h3 className="font-display text-[42px] leading-[46px] text-primary mb-1">Slides.<br /><span className="text-soft font-normal">The writing.</span></h3>
                <p className="font-body text-sm text-soft leading-relaxed mt-3">Edit. Refine. Add your voice to the AI&apos;s draft.</p>
              </div>
            </div>

            {/* Present */}
            <div className="mode-col px-8 py-6 md:py-0 md:last:pr-0 flex flex-col gap-6" style={{ opacity: 0, transform: 'translateY(1rem)', transition: 'opacity .5s ease .24s, transform .5s ease .24s' }}>
              <div className="rounded-[4px] border border-primary/10 bg-white/40 overflow-hidden" style={{ height: 180 }}>
                <div className="h-full p-4 flex flex-col items-center justify-center gap-3 present-preview">
                  <div className="relative w-full" style={{ height: 90 }}>
                    <div className="present-slide absolute inset-x-8 top-6 rounded-[4px] bg-soft/20 border border-primary/8" style={{ height: 56 }} />
                    <div className="present-slide absolute inset-x-5 top-3 rounded-[4px] bg-primary/15 border border-primary/10" style={{ height: 56 }} />
                    <div className="present-slide absolute inset-x-2 top-0 rounded-[4px] bg-primary border border-primary/20 flex items-center justify-center" style={{ height: 56 }}>
                      <div className="flex items-end gap-1 px-4">
                        {[[20],[32],[26],[18]].map(([h], i) => <div key={i} className="flex-1 rounded-t bg-accent/60" style={{ height: h }} />)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="export-tag rounded-full bg-accent/15 border border-accent/25 px-3 py-1 text-xs font-body text-accent font-medium">PPTX</div>
                    <div className="export-tag rounded-full bg-primary/8 border border-primary/12 px-3 py-1 text-xs font-body text-soft">PDF</div>
                    <div className="export-tag rounded-full bg-primary/8 border border-primary/12 px-3 py-1 text-xs font-body text-soft">Link ↗</div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-body font-semibold uppercase tracking-widest text-soft/60 mb-3">Chapter III</p>
                <h3 className="font-display text-[42px] leading-[46px] text-primary mb-1">Present.<br /><span className="text-soft font-normal">The delivery.</span></h3>
                <p className="font-body text-sm text-soft leading-relaxed mt-3">Export. Share. Ship the story before the meeting starts.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ PROTOTYPE TEASER ═══ */}
      <section ref={protoSectionRef} id="prototype" style={{ order: 4,background: '#1A2742', borderTop: '1px solid rgba(26,39,66,0.1)', padding: '112px 24px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>

          {/* Editorial headline — Inter × Instrument Serif at one size, dense
              flow, with the three flow stages woven in as small live fragments
              (raw numbers → insight/dataset → slide), each ≈ the type height. */}
          <div className="proto-head">
            <span className="proto-word">From</span>
            <span className="proto-serif">messy</span>
            <span className="proto-word">data</span>

            <div className="proto-frag proto-frag--box" style={{ width: 'calc(179px * var(--k))', height: 'calc(108px * var(--k))' }}>
              <div className="proto-frag-inner" style={{ width: 400, height: 364, left: 0, top: 0, transform: 'scale(calc(0.45 * var(--k)))' }}>
                <PrototypeShowcase inView={protoInView} variant="raw" transparentBg />
              </div>
            </div>

            <span className="proto-word">into</span>
            <span className="proto-serif">sharp</span>
            <span className="proto-word">insight</span>

            <div className="proto-frag" style={{ width: 'calc(179px * var(--k))', height: 'calc(108px * var(--k))' }}>
              <div className="proto-frag-inner" style={{ width: 344, height: 208, left: 0, top: 0, transform: 'scale(calc(0.52 * var(--k)))' }}>
                <PrototypeShowcase inView={protoInView} variant="insight" transparentBg />
              </div>
            </div>

            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(14px * var(--k))' }}>
              <span className="proto-word">and</span>
              <span className="proto-serif">clean</span>
              <span className="proto-word">dataset</span>
            </span>

            <div className="proto-frag" style={{ width: 'calc(179px * var(--k))', height: 'calc(108px * var(--k))' }}>
              <div className="proto-frag-inner" style={{ width: 344, height: 208, left: 0, top: 0, transform: 'scale(calc(0.52 * var(--k)))' }}>
                <PrototypeShowcase inView={protoInView} variant="dataset" transparentBg />
              </div>
            </div>

            <span className="proto-word">that becomes</span>
            <span className="proto-serif">finished</span>
            <span className="proto-word">slide</span>

            <div className="proto-frag" style={{ width: 'calc(179px * var(--k))', height: 'calc(108px * var(--k))' }}>
              <div className="proto-frag-inner" style={{ width: 344, height: 208, left: 0, top: 0, transform: 'scale(calc(0.52 * var(--k)))' }}>
                <PrototypeShowcase inView={protoInView} variant="slide" transparentBg />
              </div>
            </div>

            <span className="proto-word">in under</span>
            <span className="proto-word proto-12">12</span>
            <span className="proto-serif" style={{ lineHeight: 1 }}>minutes</span>
            <span className="proto-minutes">
              <a
                href="https://axon-app.ru/ai-studio"
                target="_blank"
                rel="noopener"
                onClick={() => trackEvent(GOALS.ctaClick)}
                className="proto-cta"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#C8A86B', color: '#1A2742', border: '1px solid #C8A86B', borderRadius: 4, padding: '16px 50px', fontFamily: 'var(--font-inter-sans), sans-serif', fontSize: 14, lineHeight: 1.4, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxSizing: 'border-box' }}
              >
                Open prototype
              </a>
            </span>
          </div>

        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" style={{ display: 'none',background: '#F4F0E8', borderTop: '1px solid rgba(26,39,66,0.1)', padding: '113px 24px 112px' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', columnGap: 20, rowGap: 20 }}>

          {/* ── Heading: full width ── */}
          <div style={{ gridColumn: '1 / -1', paddingTop: 5.5, paddingBottom: 40 }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C8A86B', display: 'block', marginBottom: 16 }}>Built for analysts</span>
            <h2 className="big-serif-h2" style={{ margin: 0 }}>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>Everything the neural</span>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#C8A86B' }}>connection needs.</span>
            </h2>
          </div>

          {/* ── One-click export — terracotta, left col row 2 ── */}
          <div className="lift-card" style={{ gridColumn: 1, gridRow: 2, background: '#C8A86B', borderRadius: 4, padding: '28px 26px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6, minHeight: 250, boxSizing: 'border-box', boxShadow: '0 2px 16px rgba(26,39,66,0.08)' }}>
            {/* metric + icon on one row; icon is top-aligned to the digit (not centered) */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <span className="feat-x3" style={{ display: 'inline-flex', alignItems: 'baseline', color: '#1A2742', lineHeight: 1, position: 'relative', top: -12 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 300, fontSize: 132 }}>X</span>
                <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontWeight: 400, fontSize: 150 }}>3</span>
              </span>
              {/* icon — height matched to the digit "3" */}
              <div style={{ width: 68, height: 68, borderRadius: 4, background: 'rgba(26,39,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A2742" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h20" />
                  <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
                  <path d="m7 21 5-5 5 5" />
                </svg>
              </div>
            </div>
            <span style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 42, lineHeight: '46px', color: '#1A2742' }}>Faster to present</span>
          </div>

          {/* ── Live presentations — navy hero, right col rows 2–3 ── */}
          <div className="lift-card" style={{ gridColumn: 2, gridRow: '2 / 4', background: '#1A2742', borderRadius: 4, padding: 32, display: 'flex', flexDirection: 'column', gap: 24, boxSizing: 'border-box', boxShadow: '0 4px 24px rgba(26,39,66,0.15)' }}>
            {/* Photo — fills the card; the img is absolutely placed so it never dictates height.
                Top stays put, bottom reveals more, and the text below sits at the card's bottom edge. */}
            <div style={{ position: 'relative', flex: '1 1 0', minHeight: 150, borderRadius: 4, overflow: 'hidden' }}>
              <img src="/built-for-analysts.jpeg" alt="Analyst presenting live with Axon" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%', display: 'block' }} />
              {/* subtle scrim so the credit stays legible over the photo's bright corner */}
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 38, background: 'linear-gradient(to top, rgba(0,0,0,0.38), rgba(0,0,0,0))', pointerEvents: 'none' }} />
              <a href="https://www.cosmos.so/" target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', bottom: 7, right: 10, zIndex: 1, fontFamily: "'Inter',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}>Photo via Cosmos</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 42, fontWeight: 400, lineHeight: '46px', color: '#F4F0E8', margin: 0 }}>Live presentations</h3>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6, color: 'rgba(244,240,232,0.6)', margin: 0 }}>Present straight from Axon. No downloads, no version confusion. Your deck, live and in sync.</p>
              <a className="feat-cta" href="https://axon-app.ru/ai-studio" target="_blank" rel="noopener" onClick={() => trackEvent(GOALS.ctaClick)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#C8A86B', color: '#1A2742', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, padding: '12px 24px', borderRadius: 4, textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', boxShadow: '0 2px 12px rgba(200,168,107,0.4)' }}>
                Try Axon free →
              </a>
            </div>
          </div>

          {/* ── Signal detection — cream, left col row 3 ── */}
          <div className="lift-card" style={{ gridColumn: 1, gridRow: 3, background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(26,39,66,0.08)', borderRadius: 4, padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, minHeight: 250, boxSizing: 'border-box', boxShadow: '0 2px 12px rgba(26,39,66,0.06)' }}>
            <div style={{ width: 68, height: 68, borderRadius: 4, background: 'rgba(26,39,66,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A2742" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Instrument Serif',serif", fontSize: 42, fontWeight: 400, lineHeight: '46px', color: '#1A2742', margin: '0 0 10px' }}>Signal detection</h3>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6, color: '#8B95A8', margin: 0 }}>The agent identifies trends, outliers, and correlations before you even ask.</p>
            </div>
          </div>

        </div>
      </section>

{/* ═══ FAQ ═══ */}
      <section id="faq" style={{ order: 6,background: '#F4F0E8', borderTop: '1px solid rgba(26,39,66,0.1)', padding: '96px 24px' }}>
        <div className="faq-grid" style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="faq-head">
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C8A86B', display: 'block', marginBottom: 16 }}>
              FAQ
            </span>
            <h2 className="big-serif-h2" style={{ margin: 0 }}>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>Questions,</span>
              <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#C8A86B' }}>answered.</span>
            </h2>
          </div>
          <div>
            {FAQS.map(({ q, a }) => (
              <details key={q} style={{ borderTop: '1px solid rgba(26,39,66,0.12)', padding: '20px 0' }}>
                <summary style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 600, color: '#1A2742', cursor: 'pointer', listStyle: 'none' }}>
                  {q}
                </summary>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, lineHeight: 1.65, color: '#8B95A8', margin: '12px 0 0' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
        {/* FAQPage JSON-LD — строится из того же FAQS, что и видимая секция выше (правила Google:
            разметка только при видимом контенте). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQS.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            }),
          }}
        />
      </section>

{/* ═══ CTA ═══ */}
      <section id="cta" className="py-28 px-6 border-t divider" style={{ order: 7,background: '#B4C6DC' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="big-serif-h2" style={{ margin: '0 0 20px' }}>
            <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, lineHeight: '60px', color: '#1A2742' }}>Your data has a story.</span>
            <span style={{ display: 'block', fontFamily: "'Instrument Serif',serif", fontSize: 72, fontWeight: 400, fontStyle: 'italic', lineHeight: '86px', color: '#F4F0E8' }}>Time to tell it.</span>
          </h2>
          <p className="font-body text-[#1B2840] mb-10 leading-relaxed">Join thousands of analysts who&apos;ve stopped translating and started presenting.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
            <a href="https://axon-app.ru/ai-studio" target="_blank" onClick={() => trackEvent(GOALS.ctaClick)} className="inline-flex items-center justify-center gap-2 bg-primary text-bg font-body font-medium text-sm px-8 py-4 rounded-[4px] hover:bg-primary/90 transition-all">Try Axon free →</a>
            <a href="mailto:hello@axon-app.ru?subject=Axon%20demo" className="inline-flex items-center justify-center gap-2 bg-[#F4F0E8] text-primary font-body font-medium text-sm px-8 py-4 rounded-[4px] hover:bg-[#EDE9E0] transition-all">Book a demo</a>
          </div>
          <p className="text-xs font-body text-[#F4F0E8]">No credit card. First deck on us.</p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t divider py-10 px-6" style={{ order: 8,background: '#1A2742' }}>
        <div className="max-w-[1152px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-bg">AXON</span>
          <p className="text-xs font-body text-bg/40 text-center hidden sm:block">The Neural Network for Your Data Narrative.</p>
          <div className="flex gap-6">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Cookies', href: '/cookies' },
              { label: 'Contact', href: 'mailto:hello@axon-app.ru' },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="text-xs font-body text-bg/60 hover:text-accent transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
