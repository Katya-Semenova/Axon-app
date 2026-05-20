"use client";

import { useEffect, useRef, useState } from "react";
import { roundTo } from "@/lib/charts";
import { useWorkspaceStore } from "@/lib/store";
import type { Insight, DataSet } from "@/lib/types";
import { InsightCard } from "./InsightCard";
import { DataSetCard, DataSetPlaceholder } from "./DataSetCard";
import {
  GOLD, NAVY_300, BORDER, T2, T3, SURFACE, SURFACE_MUTED,
  CARD_W, CARD_H_EST, COL_GAP,
} from "../ui/tokens";

const r = roundTo;

/* Fixed column positions in canvas world-space. Must match store.ts layout constants. */
const INS_COL_X      = 28;
const INS_COL_STRIDE = CARD_W + 12;    /* 2-column insight grid stride */
const DS_COL_X       = INS_COL_X + 2 * INS_COL_STRIDE + 48;  /* = 500 */
const DS_W           = 340;
void COL_GAP;

export function Canvas() {
  const insightOrder  = useWorkspaceStore(s => s.insightOrder);
  const insightsById  = useWorkspaceStore(s => s.insightsById);
  const dataSetOrder  = useWorkspaceStore(s => s.dataSetOrder);
  const dataSetsById  = useWorkspaceStore(s => s.dataSetsById);
  const connections   = useWorkspaceStore(s => s.connections);
  const nodePositions = useWorkspaceStore(s => s.nodePositions);

  const insights = insightOrder.map(id => insightsById[id]).filter(Boolean) as Insight[];
  const dataSets = dataSetOrder.map(id => dataSetsById[id]).filter(Boolean) as DataSet[];

  const setNodePos         = useWorkspaceStore(s => s.setNodePosition);
  const canvasTransform    = useWorkspaceStore(s => s.canvasTransform);
  const setCanvasTransform = useWorkspaceStore(s => s.setCanvasTransform);

  const setExpInsight   = useWorkspaceStore(s => s.setExpandedInsight);
  const setExpDataSet   = useWorkspaceStore(s => s.setExpandedDataSet);
  const updateDsType    = useWorkspaceStore(s => s.updateDataSetChartType);
  const addDataSet      = useWorkspaceStore(s => s.addDataSet);
  const removeDataSet   = useWorkspaceStore(s => s.removeDataSet);
  const addConnection   = useWorkspaceStore(s => s.addConnection);
  const removeConn      = useWorkspaceStore(s => s.removeConnection);

  const undo    = useWorkspaceStore(s => s.undo);
  const redo    = useWorkspaceStore(s => s.redo);
  const canUndo = useWorkspaceStore(s => s.canUndo());
  const canRedo = useWorkspaceStore(s => s.canRedo());

  const [isPanning,    setIsPanning]    = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  /* Edge that the mouse is hovering over — shows gold highlight + delete cursor. */
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);

  type ActiveConn = { fromId: string; startX: number; startY: number; mouseX: number; mouseY: number };
  const [activeConn, setActiveConn] = useState<ActiveConn | null>(null);

  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const panStateRef       = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const dragNodeRef       = useRef<{ id: string; startMouseX: number; startMouseY: number; startNodeX: number; startNodeY: number } | null>(null);
  const activeConnRef     = useRef<ActiveConn | null>(null);
  const cardHeightRef     = useRef<Map<string, number>>(new Map());

  /* ── Geometry helpers ────────────────────────────────────────────────── */
  function getPortPos(cardId: string, side: "left" | "right", width: number): { x: number; y: number } | null {
    const pos = nodePositions[cardId];
    if (!pos) return null;
    const h = cardHeightRef.current.get(cardId) ?? CARD_H_EST;
    return {
      x: side === "left" ? pos.x : pos.x + width,
      y: pos.y + h / 2,
    };
  }

  function makeBezier(x1: number, y1: number, x2: number, y2: number): string {
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
    return `M ${r(x1)} ${r(y1)} C ${r(x1 + dx)} ${r(y1)} ${r(x2 - dx)} ${r(y2)} ${r(x2)} ${r(y2)}`;
  }

  /* ── Port handlers ───────────────────────────────────────────────────── */
  function handleOutputPortDown(cardId: string, e: React.MouseEvent) {
    const from = getPortPos(cardId, "right", CARD_W);
    if (!from) return;
    const viewport = canvasViewportRef.current;
    if (!viewport) return;
    const vRect = viewport.getBoundingClientRect();
    const { x: tx, y: ty, zoom } = canvasTransform;
    const conn: ActiveConn = {
      fromId: cardId,
      startX: from.x, startY: from.y,
      mouseX: (e.clientX - vRect.left - tx) / zoom,
      mouseY: (e.clientY - vRect.top  - ty) / zoom,
    };
    activeConnRef.current = conn;
    setActiveConn(conn);
  }

  function handleDataSetInputPortUp(dataSetId: string) {
    const conn = activeConnRef.current;
    if (!conn) return;
    addConnection(conn.fromId, dataSetId);
    activeConnRef.current = null;
    setActiveConn(null);
  }

  /* ── Node drag ───────────────────────────────────────────────────────── */
  function handleNodeMouseDown(cardId: string, e: React.MouseEvent) {
    if ((e.target as Element).closest("[data-port], [data-grip], button, input, select, textarea, a")) return;
    e.stopPropagation();
    const pos = nodePositions[cardId];
    if (!pos) return;
    dragNodeRef.current = {
      id: cardId,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startNodeX: pos.x, startNodeY: pos.y,
    };
    setDraggingNode(cardId);
  }

  /* ── Canvas pan ──────────────────────────────────────────────────────── */
  function handleCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    const isInteractive = (e.target as Element).closest("button, input, select, textarea, a, [data-is-card]");
    if (e.button === 0 && isInteractive) return;
    if (e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) e.preventDefault();
    panStateRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      originX: canvasTransform.x, originY: canvasTransform.y,
    };
    setIsPanning(true);
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (panStateRef.current.active) {
      setCanvasTransform({
        ...canvasTransform,
        x: panStateRef.current.originX + (e.clientX - panStateRef.current.startX),
        y: panStateRef.current.originY + (e.clientY - panStateRef.current.startY),
      });
    }
    if (dragNodeRef.current) {
      const { id, startMouseX, startMouseY, startNodeX, startNodeY } = dragNodeRef.current;
      const dx = (e.clientX - startMouseX) / canvasTransform.zoom;
      const dy = (e.clientY - startMouseY) / canvasTransform.zoom;
      setNodePos(id, startNodeX + dx, startNodeY + dy);
    }
    if (activeConnRef.current) {
      const viewport = canvasViewportRef.current;
      if (!viewport) return;
      const vRect = viewport.getBoundingClientRect();
      const { x: tx, y: ty, zoom } = canvasTransform;
      const updated: ActiveConn = {
        ...activeConnRef.current,
        mouseX: (e.clientX - vRect.left - tx) / zoom,
        mouseY: (e.clientY - vRect.top  - ty) / zoom,
      };
      activeConnRef.current = updated;
      setActiveConn(updated);
    }
  }

  function handleCanvasMouseUp() {
    panStateRef.current.active = false;
    setIsPanning(false);
    dragNodeRef.current = null;
    setDraggingNode(null);
    if (activeConnRef.current) { activeConnRef.current = null; setActiveConn(null); }
  }

  /* ── Wheel zoom ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = canvasViewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const prev = useWorkspaceStore.getState().canvasTransform;
      const newZoom = Math.min(2.5, Math.max(0.2, prev.zoom * factor));
      const wx = (cx - prev.x) / prev.zoom;
      const wy = (cy - prev.y) / prev.zoom;
      useWorkspaceStore.getState().setCanvasTransform({
        zoom: newZoom, x: cx - wx * newZoom, y: cy - wy * newZoom,
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  function zoomBy(factor: number) {
    const el = canvasViewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const prev = canvasTransform;
    const newZoom = Math.min(2.5, Math.max(0.2, prev.zoom * factor));
    const wx = (cx - prev.x) / prev.zoom;
    const wy = (cy - prev.y) / prev.zoom;
    setCanvasTransform({ zoom: newZoom, x: cx - wx * newZoom, y: cy - wy * newZoom });
  }

  /* The placeholder always sits at the DS column, below however many datasets
     already exist. Position is intentionally NOT based on live nodePositions
     so it doesn't "follow" a dataset card that is being dragged. */

  return (
    <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between shrink-0 border-b border-border px-6 py-[9px]"
        style={{ background: SURFACE }}
      >
        <div className="flex items-center gap-[10px]">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-t3">Canvas</span>
          <span className="font-mono text-[10.5px] text-t3 rounded-sm px-[8px] py-0.5" style={{ background: SURFACE_MUTED }}>
            {insights.length} insights · {dataSets.length} data sets
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={!canUndo} title="Undo"
              className="w-[28px] h-[28px] rounded-sm border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[#B89548] hover:text-[#B89548] transition-colors">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5h6a4 4 0 010 8H4M2 5l3-3M2 5l3 3" />
              </svg>
            </button>
            <button onClick={redo} disabled={!canRedo} title="Redo"
              className="w-[28px] h-[28px] rounded-sm border border-border flex items-center justify-center text-t2 disabled:opacity-30 hover:border-[#B89548] hover:text-[#B89548] transition-colors">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5H6a4 4 0 000 8h4M12 5l-3-3M12 5l-3 3" />
              </svg>
            </button>
          </div>
          {/* Top-right tab nav lives at page level (ModeTabs) — reserved 280 px gutter. */}
          <div style={{ width: 280 }} aria-hidden />
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={canvasViewportRef}
        className="flex-1 relative overflow-hidden"
        style={{
          cursor: activeConn ? "crosshair" : (isPanning || !!draggingNode) ? "grabbing" : "default",
          userSelect: isPanning ? "none" : "auto",
          background: "#EDE9E0",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* World — CSS-transformed */}
        <div
          style={{
            position: "absolute", top: 0, left: 0,
            transformOrigin: "0 0",
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.zoom})`,
          }}
        >
          <div style={{ position: "relative", width: 2400, height: 1800 }}>

            {/* ── Edges ── */}
            <svg
              style={{
                position: "absolute", top: 0, left: 0,
                width: "100%", height: "100%",
                overflow: "visible", pointerEvents: "none", zIndex: 0,
              }}
            >
              {connections.map(conn => {
                const from = getPortPos(conn.fromInsightId, "right", CARD_W);
                const to   = getPortPos(conn.toDataSetId,   "left",  DS_W);
                if (!from || !to) return null;
                const hovered = hoveredConnId === conn.id;
                const bezier  = makeBezier(from.x, from.y, to.x, to.y);
                return (
                  <g key={conn.id}>
                    {/* Visible edge */}
                    <path
                      d={bezier}
                      fill="none"
                      stroke={hovered ? GOLD : NAVY_300}
                      strokeWidth={hovered ? 2 : 1.5}
                      strokeLinecap="round"
                      opacity={hovered ? 0.9 : 0.65}
                    />
                    {/* Wide invisible hit-area for hover + click-to-delete */}
                    <path
                      d={bezier}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="14"
                      pointerEvents="stroke"
                      style={{ cursor: "pointer", pointerEvents: "stroke" } as React.CSSProperties}
                      onMouseEnter={() => setHoveredConnId(conn.id)}
                      onMouseLeave={() => setHoveredConnId(null)}
                      onClick={(e) => { e.stopPropagation(); removeConn(conn.id); setHoveredConnId(null); }}
                    />
                    {/* Midpoint delete dot — appears on hover */}
                    {hovered && (() => {
                      const mx = (from.x + to.x) / 2;
                      const my = (from.y + to.y) / 2;
                      return (
                        <g style={{ pointerEvents: "none" }}>
                          <circle cx={mx} cy={my} r="7" fill={GOLD} opacity="0.9" />
                          <line x1={mx - 3} y1={my} x2={mx + 3} y2={my} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Active (drawing) connection */}
              {activeConn && (() => {
                const from = getPortPos(activeConn.fromId, "right", CARD_W);
                if (!from) return null;
                return (
                  <path
                    d={makeBezier(from.x, from.y, activeConn.mouseX, activeConn.mouseY)}
                    fill="none" stroke={GOLD} strokeWidth="1.5"
                    strokeLinecap="round" strokeDasharray="5 3" opacity="0.8"
                  />
                );
              })()}
            </svg>

            {/* ── Insight cards ── */}
            {insights.map(insight => (
              <div
                key={insight.id}
                ref={(el) => {
                  if (el) cardHeightRef.current.set(insight.id, el.offsetHeight);
                  else    cardHeightRef.current.delete(insight.id);
                }}
                style={{
                  position: "absolute",
                  left: nodePositions[insight.id]?.x ?? INS_COL_X,
                  top:  nodePositions[insight.id]?.y ?? 0,
                  width: CARD_W,
                  zIndex: draggingNode === insight.id ? 10 : 1,
                  userSelect: "none",
                }}
                onMouseDown={(e) => handleNodeMouseDown(insight.id, e)}
              >
                <InsightCard
                  insight={insight}
                  isDraggingNode={draggingNode === insight.id}
                  isConnecting={!!activeConn && activeConn.fromId !== insight.id}
                  onExpand={() => setExpInsight(insight.id)}
                  onOutputPortDown={(e) => handleOutputPortDown(insight.id, e)}
                />
              </div>
            ))}

            {/* ── DataSet cards ── */}
            {dataSets.map(ds => (
              <div
                key={ds.id}
                ref={(el) => {
                  if (el) cardHeightRef.current.set(ds.id, el.offsetHeight);
                  else    cardHeightRef.current.delete(ds.id);
                }}
                style={{
                  position: "absolute",
                  left: nodePositions[ds.id]?.x ?? DS_COL_X,
                  top:  nodePositions[ds.id]?.y ?? 28,
                  width: DS_W,
                  zIndex: draggingNode === ds.id ? 10 : 1,
                  userSelect: "none",
                }}
                onMouseDown={(e) => handleNodeMouseDown(ds.id, e)}
              >
                <DataSetCard
                  dataSet={ds}
                  isDraggingNode={draggingNode === ds.id}
                  isConnecting={!!activeConn}
                  onExpand={() => setExpDataSet(ds.id)}
                  onChartTypeChange={(type) => updateDsType(ds.id, type)}
                  onInputPortUp={() => handleDataSetInputPortUp(ds.id)}
                  onDelete={() => removeDataSet(ds.id)}
                />
              </div>
            ))}


          </div>
        </div>

        {/* "+ NEW DATA SET" — centred in the viewport. New sets fly out around
            this anchor on a grid offset (see store.addDataSet), so the button
            itself is never obscured. */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 248,
            zIndex: 5,
            pointerEvents: "auto",
          }}
        >
          <DataSetPlaceholder onClick={addDataSet} />
        </div>

        {/* Zoom HUD */}
        <div
          style={{
            position: "absolute", bottom: 16, right: 16,
            display: "flex", alignItems: "center",
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 4, overflow: "hidden",
          }}
        >
          <button onClick={() => zoomBy(1.2)} title="Zoom in"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRight: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", color: T2 }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M5 1v8M1 5h8" />
            </svg>
          </button>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T2, padding: "0 8px", minWidth: 42, textAlign: "center" }}>
            {Math.round(canvasTransform.zoom * 100)}%
          </span>
          <button onClick={() => zoomBy(1 / 1.2)} title="Zoom out"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, background: "transparent", cursor: "pointer", color: T2 }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M1 5h8" />
            </svg>
          </button>
          <button onClick={() => setCanvasTransform({ x: 20, y: 20, zoom: 0.85 })} title="Reset view"
            style={{ padding: "0 10px", height: 28, display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T2 }}
            onMouseEnter={e => { e.currentTarget.style.background = SURFACE_MUTED; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            Reset
          </button>
        </div>

        {/* Edge-delete hint — shows when hovering an edge */}
        {hoveredConnId && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5,
            color: T3, background: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 4, padding: "4px 10px", pointerEvents: "none",
          }}>
            Click edge to remove connection
          </div>
        )}
      </div>
    </section>
  );
}
