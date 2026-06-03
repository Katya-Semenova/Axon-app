"use client";

import { useState, useEffect, useCallback } from "react";
import { NAVY, GOLD, SURFACE_RAISE, BORDER, T2, NAVY_300 } from "./tokens";

const STORAGE_KEY = "axon_onboarding_done";
const OPEN_EVENT  = "axon:open-onboarding";

const STEPS = [
  {
    src: "/onboarding/onboarding-1.png",
    alt: "Step 1 — Drop your data",
    title: "Drop your data.",
    description: "Export as PPTX, PDF, live link. Present in minutes, not days.",
  },
  {
    src: "/onboarding/onboarding-2.png",
    alt: "Step 2 — The AI agent thinks",
    title: "The AI agent thinks.",
    description: "It reads tables, finds patterns, surfaces what matters.",
  },
  {
    src: "/onboarding/onboarding-3.png",
    alt: "Step 3 — Insights connect",
    title: "Insights connect.",
    description: "The agent groups findings into datasets, ready to visualize.",
  },
  {
    src: "/onboarding/onboarding-4.png",
    alt: "Step 4 — Stories visualize themselves",
    title: "Stories visualize themselves.",
    description: "Export as PPTX, PDF, live link. Present in minutes, not days.",
  },
  {
    src: "/onboarding/onboarding-5.png",
    alt: "Step 5 — Present and deliver",
    title: "Present and deliver.",
    description: "Export. Share. Ship the story before the meeting starts.",
  },
];

/* Call from anywhere to re-open the tour (e.g. NavBar "How it works" link). */
export function openOnboarding() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_EVENT));
  }
}

export function OnboardingModal() {
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState(0);

  /* Auto-show on first visit. */
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  /* Allow re-triggering from any component via openOnboarding(). */
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else dismiss();
  }, [step, dismiss]);

  if (!open) return null;

  const isLast = step === STEPS.length - 1;

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(27,40,64,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      {/* Modal shell — single unified background */}
      <div
        className="relative flex flex-col"
        style={{
          width: "clamp(320px, 90vw, 780px)",
          background: "#EDE9E0",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 24px 64px rgba(27,40,64,0.22)",
        }}
      >
        {/* Close ✕ */}
        <button
          onClick={dismiss}
          aria-label="Close tour"
          className="absolute top-4 right-4 z-10 flex items-center justify-center w-7 h-7 transition-opacity hover:opacity-70"
          style={{ color: NAVY_300 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        {/* Image + text — unified content block */}
        <div className="flex flex-col items-center px-7 pt-8 pb-8 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={step}
            src={STEPS[step].src}
            alt={STEPS[step].alt}
            style={{ display: "block", maxWidth: "100%", maxHeight: "280px", objectFit: "contain" }}
            draggable={false}
          />

          <div className="w-full text-center space-y-1">
            <h3 className="font-display text-[1.75rem] text-[#1A2742]">
              {STEPS[step].title}
            </h3>
            <p className="font-sans text-[13px] text-gray-500 leading-[1.55]">
              {STEPS[step].description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderTop: `1px solid ${BORDER}` }}
        >
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? GOLD : BORDER,
                  transition: "width 0.2s, background 0.2s",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!isLast && (
              <button
                onClick={dismiss}
                className="font-mono text-[11.5px] transition-opacity hover:opacity-70"
                style={{ color: T2, background: "none", border: "none", cursor: "pointer", padding: "6px 0" }}
              >
                Skip
              </button>
            )}
            <button
              onClick={next}
              className="font-mono text-[11.5px] font-medium flex items-center gap-1.5 transition-opacity hover:opacity-85"
              style={{
                background: NAVY,
                color: "#fff",
                border: "none",
                borderRadius: 0,
                padding: "8px 18px",
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              {isLast ? "Get started" : (
                <>
                  Next
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 5h6M5.5 2.5 8 5l-2.5 2.5" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
