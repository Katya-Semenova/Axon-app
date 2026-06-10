"use client";

import { useState } from "react";
import { ProjectCard, PROJECTS } from "./ProjectCard";

/**
 * Landing — entry point before a workspace is opened. Mostly static
 * content: nav, hero, dropzone, recent projects grid. Clicking the
 * dropzone or any project navigates into the workspace; we don't yet
 * differentiate which one (single-workspace prototype).
 */
export function LandingPage({ onNavigate }: { onNavigate: () => void }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="min-h-screen bg-bg animate-fade-in">
      <nav className="sticky top-0 z-20 bg-bg border-b border-border flex items-center justify-between px-12 py-5 max-sm:px-4 max-sm:py-[14px]">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
        <div className="flex items-center gap-9">
          <ul className="flex list-none gap-8 max-sm:hidden">
            {/* Projects / Docs — destinations not built yet. Rendered as inert,
                muted labels (not links) so the nav reads as intentional rather
                than broken. Swap back to <a href> once the pages exist. */}
            <li><span aria-disabled="true" className="text-[13.5px] text-t3 cursor-default select-none">Projects</span></li>
            <li><a href="/storybook" className="text-[13.5px] text-t2 hover:text-t1 transition-colors duration-200">Storybook</a></li>
            <li><span aria-disabled="true" className="text-[13.5px] text-t3 cursor-default select-none">Docs</span></li>
          </ul>
          <div className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center font-mono text-[11px] font-medium text-t2 cursor-pointer select-none">KS</div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto">
        <div className="text-center max-w-[640px] mx-auto px-12 pt-[88px] pb-[56px] max-md:px-6 max-md:pt-16 max-md:pb-10 max-sm:px-4 max-sm:pt-12 max-sm:pb-9">
          <h1 className="font-serif text-[clamp(40px,5.8vw,68px)] leading-[1.07] tracking-[-0.015em] text-t1 mb-5">
            Your data,<br /><em>in plain English.</em>
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed max-w-[380px] mx-auto">
            Drop any data file and get a canvas of editorial insight cards — ready to curate and present.
          </p>
        </div>

        <div
          className={`mx-12 mb-[80px] border-[1.5px] border-dashed rounded-none py-[56px] px-12 text-center cursor-pointer transition-colors duration-200 relative max-md:mx-6 max-md:mb-16 max-sm:mx-4 max-sm:mb-12 max-sm:py-9 max-sm:px-6
            ${dragOver ? "border-[#B89548] bg-[rgba(184,149,72,0.05)]" : "border-[#D9D3C2] hover:border-[#B89548] hover:bg-[rgba(184,149,72,0.04)]"}`}
          onClick={onNavigate}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); onNavigate(); }}
        >
          <svg className="w-10 h-10 mx-auto mb-4 text-t3" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 26V14M20 14l-5 5M20 14l5 5" />
            <path d="M8 28c-3.31 0-6-2.69-6-6 0-3.03 2.25-5.53 5.19-5.94C8.05 13.06 11.18 11 15 11c3.5 0 6.58 1.75 8.43 4.43C25.5 15.17 27.67 15 30 15c4.42 0 8 3.58 8 8 0 2.76-2.24 5-5 5H8z" />
          </svg>
          <p className="text-[15px] font-medium text-t1 mb-1.5">Drop a file or click to upload</p>
          <p className="font-mono text-[11.5px] text-t3">Supports .sql · .csv · .xlsx · .txt · .png · .jpg — up to 50 MB</p>
        </div>

        <div className="px-12 pb-[96px] max-md:px-6 max-md:pb-[72px] max-sm:px-4 max-sm:pb-[60px]">
          <div className="flex items-center justify-between mb-7">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-t3">Recent Projects</span>
            <a href="#" className="font-mono text-[11.5px] text-t2 hover:text-t1 transition-colors duration-200">View all</a>
          </div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            {PROJECTS.map((p, i) => (
              <ProjectCard key={i} project={p} onClick={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
