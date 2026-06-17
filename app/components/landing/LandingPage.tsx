"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MyProjects } from "./MyProjects";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { AuthNav } from "../AuthNav";
import { authClient } from "@/lib/auth-client";
import { createProject, createProjectFromData } from "@/app/actions/board";
import { useWorkspaceStore } from "@/lib/store";
import type { ParseErrorCode } from "@/lib/file-parsing";

/**
 * Landing — entry point before a workspace is opened: nav, hero, dropzone,
 * projects grid. Шаг 7: вошедший видит реальные «Мои проекты» (свои доски);
 * гость — статичную витрину-тизер и работу в памяти (без сохранения).
 *
 * onNavigate(boardId): boardId — id открываемой доски, либо null для гостя
 * (холст живёт в памяти, в базу не пишем).
 */
export function LandingPage({ onNavigate }: { onNavigate: (boardId: string | null) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<ParseErrorCode | "generic" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("Landing");
  const { data: session } = authClient.useSession();

  /* Открыть воркспейс без разбора данных (beta-форматы и вход без файла):
     вошедший — новый проект; гость — гостевой холст в памяти (boardId = null). */
  const handleStart = async () => {
    if (!session) { onNavigate(null); return; }
    try {
      const id = await createProject();
      onNavigate(id);
    } catch (err) {
      console.error("[LandingPage] не удалось создать проект:", err);
    }
  };

  /* Реальный разбор CSV/Excel (Шаг 10): файл → таблица → инсайты/графики → холст.
     Тяжёлые модули (парсер + движок) грузим динамически — вне бандла лендинга. */
  const handleFile = async (file?: File) => {
    setErrorCode(null);
    if (!file) return;

    const fp = await import("@/lib/file-parsing");
    if (!fp.isFullParseSupported(file)) {
      // PDF / картинки / SQL — beta-путь вне рамок этой фичи: открываем как раньше.
      handleStart();
      return;
    }

    setBusy(true);
    try {
      const table = await fp.parseFile(file);
      // Вошедший → реальный ИИ (с fallback на правила); гость → правила (данные не уходят).
      const { extractBoardData } = await import("@/lib/insight-engine/extract");
      const { board } = await extractBoardData(table, { useAI: !!session });

      if (!session) {
        useWorkspaceStore.getState().hydrate(board);
        onNavigate(null);
      } else {
        const id = await createProjectFromData(board, table.sourceName);
        onNavigate(id);
      }
    } catch (err) {
      setBusy(false);
      if (err instanceof fp.FileParseError) setErrorCode(err.code);
      else { console.error("[LandingPage] разбор файла упал:", err); setErrorCode("generic"); }
    }
  };

  /* Сообщение об ошибке разбора — статичные ключи (типобезопасно для next-intl). */
  const errorText = (() => {
    switch (errorCode) {
      case "too-big":     return t("dropzone.error.tooBig");
      case "empty":       return t("dropzone.error.empty");
      case "unsupported": return t("dropzone.error.unsupported");
      case "corrupt":     return t("dropzone.error.corrupt");
      case "no-columns":  return t("dropzone.error.noColumns");
      case "generic":     return t("dropzone.error.generic");
      default:            return null;
    }
  })();

  return (
    <div className="min-h-screen bg-bg animate-fade-in">
      <nav className="sticky top-0 z-20 bg-bg border-b border-border flex items-center justify-between px-12 py-5 max-sm:px-4 max-sm:py-[14px]">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em]">AXON</span>
        <div className="flex items-center gap-9">
          <ul className="flex list-none gap-8 max-sm:hidden">
            {/* Projects / Docs — destinations not built yet. Rendered as inert,
                muted labels (not links) so the nav reads as intentional rather
                than broken. Swap back to <a href> once the pages exist. */}
            <li><span aria-disabled="true" className="text-[13.5px] text-t3 cursor-default select-none">{t("nav.projects")}</span></li>
            <li><a href="/storybook" className="text-[13.5px] text-t2 hover:text-t1 transition-colors duration-200">{t("nav.storybook")}</a></li>
            <li><span aria-disabled="true" className="text-[13.5px] text-t3 cursor-default select-none">{t("nav.docs")}</span></li>
          </ul>
          <LanguageSwitcher />
          <AuthNav />
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto">
        <div className="text-center max-w-[640px] mx-auto px-12 pt-[88px] pb-[56px] max-md:px-6 max-md:pt-16 max-md:pb-10 max-sm:px-4 max-sm:pt-12 max-sm:pb-9">
          <h1 className="font-serif text-[clamp(40px,5.8vw,68px)] leading-[1.07] tracking-[-0.015em] text-t1 mb-5">
            {t("hero.titleLine1")}<br /><em>{t("hero.titleLine2")}</em>
          </h1>
          <p className="text-[16px] text-t2 leading-relaxed max-w-[380px] mx-auto">
            {t("hero.subtitle")}
          </p>
        </div>

        <div
          className={`mx-12 mb-[80px] border-[1.5px] border-dashed rounded-none py-[56px] px-12 text-center transition-colors duration-200 relative max-md:mx-6 max-md:mb-16 max-sm:mx-4 max-sm:mb-12 max-sm:py-9 max-sm:px-6
            ${busy ? "cursor-wait opacity-70" : "cursor-pointer"}
            ${errorCode
              ? "border-error bg-error/5"
              : dragOver
                ? "border-gold-500 bg-gold-500/5"
                : "border-border hover:border-gold-500 hover:bg-gold-500/[0.04]"}`}
          onClick={() => { if (!busy) inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); if (!busy) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!busy) handleFile(e.dataTransfer.files?.[0]); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.sql,.txt,.json,.svg"
            className="hidden"
            onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          <svg className="w-10 h-10 mx-auto mb-4 text-t3" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 26V14M20 14l-5 5M20 14l5 5" />
            <path d="M8 28c-3.31 0-6-2.69-6-6 0-3.03 2.25-5.53 5.19-5.94C8.05 13.06 11.18 11 15 11c3.5 0 6.58 1.75 8.43 4.43C25.5 15.17 27.67 15 30 15c4.42 0 8 3.58 8 8 0 2.76-2.24 5-5 5H8z" />
          </svg>
          <p className="text-[15px] font-medium text-t1 mb-1.5">
            {busy ? t("dropzone.parsing") : t("dropzone.cta")}
          </p>
          {errorText
            ? <p className="text-[12px] text-error font-medium">{errorText}</p>
            : <p className="font-mono text-[11.5px] text-t3">{t("dropzone.formats")}</p>}
        </div>

        {session ? (
          /* Вошедший — реальные проекты пользователя (Шаг 7). */
          <MyProjects onOpen={(id) => onNavigate(id)} />
        ) : (
          /* Гость — без фейковых проектов; тихое приглашение войти (Шаг 7b). */
          <div className="px-12 pb-[96px] max-md:px-6 max-md:pb-[72px] max-sm:px-4 max-sm:pb-[60px]">
            <p className="text-center font-mono text-[11.5px] text-t3">
              <a href="/login" className="text-t2 hover:text-t1 underline underline-offset-4 transition-colors duration-200">
                {t("guestHint")}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
