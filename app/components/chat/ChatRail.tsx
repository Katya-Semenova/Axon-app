"use client";

import { useRef, useState } from "react";
import { useWorkspaceStore } from "@/lib/store";
import { useTranslations } from "next-intl";
import { BORDER, NAVY, T2, T3, RADIUS_BUBBLE } from "../ui/tokens";
import { Textarea } from "../ui/Textarea";
import { Chip } from "../ui/Chip";
import { useToast } from "../ui/Toast";
import type { ParseErrorCode } from "@/lib/file-parsing";

/* ChatTextarea убран: поле ввода data-режима обезврежено до подключения ИИ (Шаг 11). */

/* ── ChatRail — collapsible left rail ────────────────────────────────────
   When chatCollapsed === true, collapses to a 40px strip showing only the
   expand chevron. The onBack prop is forwarded to the header's Back button.   */
export function ChatRail({ onBack }: { onBack: () => void }) {
  const chatCollapsed     = useWorkspaceStore(s => s.chatCollapsed);
  const toggleChat        = useWorkspaceStore(s => s.toggleChat);
  const mode              = useWorkspaceStore(s => s.mode);
  const buildMessages     = useWorkspaceStore(s => s.buildMessages);
  const addBuildMessage   = useWorkspaceStore(s => s.addBuildMessage);

  const [draftText, setDraftText] = useState("");
  const isBuild = mode === "build";
  const t = useTranslations("Chat");
  const tErr = useTranslations("Landing.dropzone.error");

  /* ── Добавление файла на холст (Шаг 11) ─ */
  const sourceFiles    = useWorkspaceStore(s => s.sourceFiles);
  const mergeBoardData = useWorkspaceStore(s => s.mergeBoardData);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);

  /* Сообщение по коду ошибки разбора — переиспользуем словарь dropzone (Шаг 10). */
  function parseErrorText(code: ParseErrorCode): string {
    switch (code) {
      case "too-big":     return tErr("tooBig");
      case "empty":       return tErr("empty");
      case "unsupported": return tErr("unsupported");
      case "corrupt":     return tErr("corrupt");
      case "no-columns":  return tErr("noColumns");
      default:            return tErr("generic");
    }
  }

  /* «+ Добавить файл»: парсим (Шаг 10) и ДОБАВЛЯЕМ к текущей доске; ошибки — тостом.
     Тяжёлые модули (парсер + движок) грузим динамически. */
  async function handleAddFile(file?: File) {
    if (!file) return;
    const fp = await import("@/lib/file-parsing");
    if (!fp.isFullParseSupported(file)) {
      toast(tErr("unsupported"), { variant: "error" });
      return;
    }
    setAdding(true);
    try {
      const table = await fp.parseFile(file);
      const { buildBoardData } = await import("@/lib/insight-engine");
      mergeBoardData(buildBoardData(table));
      toast(t("added", { name: table.sourceName }), { variant: "success" });
    } catch (err) {
      const msg = err instanceof fp.FileParseError ? parseErrorText(err.code) : tErr("generic");
      toast(msg, { variant: "error" });
    } finally {
      setAdding(false);
    }
  }

  /* ── Collapsed state: narrow strip with only the expand chevron ── */
  if (chatCollapsed) {
    return (
      <aside
        className="hidden lg:flex shrink-0 border-r border-border bg-card flex-col h-screen overflow-hidden items-center pt-5"
        style={{ width: 40 }}
      >
        <button
          onClick={toggleChat}
          title={t("expandChat")}
          className="flex items-center justify-center rounded-sm transition-colors duration-200"
          style={{ width: 28, height: 28, color: T3, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M5 2l5 5-5 5" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-card flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 border-b border-border shrink-0 h-[64px]">
        <button
          onClick={onBack}
          title={t("returnHome")}
          className="font-mono text-[13px] font-medium tracking-[0.14em] hover:underline transition-all duration-150"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        >
          AXON
        </button>
        {/* Collapse chevron */}
        <button
          onClick={toggleChat}
          title={t("collapseChat")}
          className="flex items-center justify-center rounded-sm transition-colors duration-200"
          style={{ width: 24, height: 24, color: T3, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.color = "#0A0A0A"; e.currentTarget.style.borderColor = NAVY; }}
          onMouseLeave={e => { e.currentTarget.style.color = T3; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
        </button>
      </div>

      {/* Files — non-build modes: реальные загруженные файлы + «+ Добавить файл» (Шаг 11) */}
      {!isBuild && (
        <div className="px-5 pb-3 pt-4">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3 mb-3">{t("files")}</div>
          {sourceFiles.length > 0 ? (
            <div className="flex flex-wrap gap-[6px] mb-3">
              {sourceFiles.map((f, i) => (
                <Chip key={`${f}-${i}`} icon={
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M7.5 1H3a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V4.5L7.5 1zM7 1v3.5H10" />
                  </svg>
                }>{f}</Chip>
              ))}
            </div>
          ) : (
            <div className="text-[11.5px] text-t3 mb-3">{t("noFiles")}</div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.sql,.txt,.json,.svg"
            className="hidden"
            onChange={(e) => { handleAddFile(e.target.files?.[0]); e.target.value = ""; }}
          />
          <button
            onClick={() => { if (!adding) fileInputRef.current?.click(); }}
            disabled={adding}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-t2 border border-border rounded-sm px-2.5 py-1.5 hover:border-gold-500 hover:text-gold-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M6 2v8M2 6h8" />
            </svg>
            {adding ? t("adding") : t("addFile")}
          </button>
        </div>
      )}

      {isBuild && (
        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3">{t("buildChat")}</div>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 thin-scroll py-3">
        {isBuild ? (
          /* ── Build mode messages ── */
          buildMessages.length === 0 ? (
            <div className="flex gap-[3px] items-center text-[13px] text-t3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full bg-t3 animate-pulse-dot"
                  style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          ) : (
            buildMessages.map(msg => (
              <div key={msg.id}>
                {msg.role === "axon" ? (
                  <div className="text-[12px] leading-[1.6]" style={{ color: T2 }}>
                    <strong className="text-[#0A0A0A] font-medium">Axon</strong>
                    {" "}— {msg.content}
                    {msg.streaming && (
                      <span className="inline-flex gap-[2px] items-center ml-1 translate-y-[1px]">
                        {[0, 1, 2].map(i => (
                          <span key={i} className="w-[4px] h-[4px] rounded-full bg-t3 animate-pulse-dot inline-block"
                            style={{ animationDelay: `${i * 0.18}s` }} />
                        ))}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="self-end px-[14px] py-[9px] text-[12px] leading-[1.5] max-w-[88%] ml-auto"
                    style={{ background: NAVY, color: "#F5F2EA", borderRadius: RADIUS_BUBBLE }}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          /* ── Default (data/presentation): честная заглушка до живого ИИ (Шаг 11) ── */
          <div className="text-[12px] text-t3 leading-[1.6] italic">
            {t("aiSoon")}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border flex gap-[10px] items-end shrink-0">
        {isBuild ? (
          <>
            <Textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && draftText.trim()) {
                  e.preventDefault();
                  const text = draftText.trim();
                  setDraftText("");
                  addBuildMessage({ id: `user-${Date.now()}`, role: "user", content: text });
                }
              }}
              rows={2}
              placeholder={t("placeholderRefine")}
              className="flex-1 min-h-[54px] max-h-[120px]"
            />
            <button
              onClick={() => {
                if (!draftText.trim()) return;
                const text = draftText.trim();
                setDraftText("");
                addBuildMessage({ id: `user-${Date.now()}`, role: "user", content: text });
              }}
              className="w-[34px] h-[34px] rounded-pill flex items-center justify-center shrink-0 hover:opacity-85 transition-opacity duration-200"
              style={{ background: NAVY, color: "#F5F2EA" }}
              aria-label={t("send")}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1v12M1 7l6-6 6 6" />
              </svg>
            </button>
          </>
        ) : (
          <div className="flex-1 min-h-[54px] flex items-center text-[12px] text-t3 italic px-1 select-none">
            {t("aiSoonPlaceholder")}
          </div>
        )}
      </div>
    </aside>
  );
}

