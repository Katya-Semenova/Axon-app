"use client";

/**
 * Workspace store — single source of truth for the canvas, presentation
 * structure, modes, undo/redo history, and chat visibility.
 *
 * Shape:
 *   - Normalized entities (`*ById` maps + parallel order arrays) so that
 *     reads stay O(1) and renders only re-fire when the slice they read
 *     actually changes.
 *   - History is kept as an array of `WorkspaceSnapshot` plus an index, the
 *     same pattern the original `page.tsx` used; we just lift it into the
 *     store so any component can call `undo()` / `redo()`.
 *   - View-only state (mode, chatCollapsed, expanded ids, drag state, node
 *     positions, canvas transform) lives alongside the entity state but is
 *     deliberately excluded from history — undo should never resurrect a
 *     closed drawer.
 */

import { create } from "zustand";
import {
  INITIAL_INSIGHTS, INITIAL_DATASETS, INITIAL_SLIDES, INITIAL_CONNECTIONS,
} from "./mockData";
import type {
  Insight, DataSet, Slide, Connection, Mode,
  NodePositionMap, WorkspaceSnapshot,
  ChartType, DataRow,
} from "./types";

/* ── Canvas layout constants used to seed initial node positions ───────── */
const CARD_W      = 240;
const HERO_W      = 360;
const CARD_H_EST  = 254;
const COL_GAP     = 14;
const ROW_GAP     = 24;
const INS_COL_X   = 28;
const DS_COL_X    = INS_COL_X + CARD_W + COL_GAP * 6;  /* DataSets sit in a separate column */

function seedNodePositions(): NodePositionMap {
  const p: NodePositionMap = {};
  INITIAL_INSIGHTS.forEach((ins, i) => {
    p[ins.id] = { x: INS_COL_X, y: 28 + i * (CARD_H_EST * 0.55 + ROW_GAP) };
  });
  INITIAL_DATASETS.forEach((ds, i) => {
    p[ds.id] = { x: DS_COL_X, y: 28 + i * (CARD_H_EST + ROW_GAP) };
  });
  return p;
}

/* ── Snapshot helpers ──────────────────────────────────────────────────── */

function snapshotFrom(state: WorkspaceStateShape): WorkspaceSnapshot {
  return {
    insightsById: state.insightsById,
    dataSetsById: state.dataSetsById,
    slidesById:   state.slidesById,
    insightOrder: state.insightOrder,
    dataSetOrder: state.dataSetOrder,
    slideOrder:   state.slideOrder,
    connections:  state.connections,
  };
}

function applySnapshot(state: WorkspaceStateShape, snap: WorkspaceSnapshot): Partial<WorkspaceStateShape> {
  return {
    insightsById: snap.insightsById,
    dataSetsById: snap.dataSetsById,
    slidesById:   snap.slidesById,
    insightOrder: snap.insightOrder,
    dataSetOrder: snap.dataSetOrder,
    slideOrder:   snap.slideOrder,
    connections:  snap.connections,
  };
  // history/historyIdx left unchanged — the caller managed those.
}

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const it of items) out[it.id] = it;
  return out;
}

/* ── Initial snapshot from mock data ───────────────────────────────────── */

const INITIAL_SNAPSHOT: WorkspaceSnapshot = {
  insightsById: indexById(INITIAL_INSIGHTS),
  dataSetsById: indexById(INITIAL_DATASETS),
  slidesById:   indexById(INITIAL_SLIDES),
  insightOrder: INITIAL_INSIGHTS.map(i => i.id),
  dataSetOrder: INITIAL_DATASETS.map(d => d.id),
  slideOrder:   INITIAL_SLIDES.map(s => s.id),
  connections:  INITIAL_CONNECTIONS,
};

/* ── Shape ─────────────────────────────────────────────────────────────── */

interface WorkspaceStateShape extends WorkspaceSnapshot {
  /* ── history ─ */
  history: WorkspaceSnapshot[];
  historyIdx: number;

  /* ── view state (NOT in history) ─ */
  mode: Mode;
  chatCollapsed: boolean;
  expandedInsightId: string | null;
  expandedDataSetId: string | null;
  activeSlideId: string | null;
  nodePositions: NodePositionMap;

  /* ── canvas transform ─ */
  canvasTransform: { x: number; y: number; zoom: number };
}

interface WorkspaceActions {
  /* ── history ─ */
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /* ── mode & chat ─ */
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
  toggleChat: () => void;
  setChatCollapsed: (collapsed: boolean) => void;

  /* ── insight ops ─ */
  updateInsightRows: (id: string, rows: DataRow[]) => void;
  updateInsightChartType: (id: string, type: ChartType) => void;
  setExpandedInsight: (id: string | null) => void;

  /* ── dataset ops ─ */
  addDataSet: () => string;
  updateDataSetChartType: (id: string, type: ChartType) => void;
  setExpandedDataSet: (id: string | null) => void;

  /* ── connection ops ─ */
  addConnection: (fromInsightId: string, toDataSetId: string) => void;
  removeConnection: (id: string) => void;

  /* ── slide ops ─ */
  addSlideWithDataSet: (dataSetId: string, atIndex?: number) => void;
  removeSlide: (id: string) => void;
  bindDataSetToSlide: (slideId: string, dataSetId: string) => void;
  updateSlide: (id: string, update: Partial<Slide>) => void;
  setActiveSlide: (id: string | null) => void;

  /* ── node positions ─ */
  setNodePosition: (id: string, x: number, y: number) => void;

  /* ── canvas ─ */
  setCanvasTransform: (t: { x: number; y: number; zoom: number }) => void;
}

export type WorkspaceStore = WorkspaceStateShape & WorkspaceActions;

/* ── Helper: mutate-then-commit pattern with history bookkeeping ───────── */

type Mutator = (s: WorkspaceStateShape) => Partial<WorkspaceStateShape>;

/* ── Store ─────────────────────────────────────────────────────────────── */

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => {
  /**
   * Run a state mutation that should be undoable: truncate any redo tail,
   * append a new snapshot to history, advance the cursor.
   */
  function commit(mutate: Mutator) {
    set((state) => {
      const patch = mutate(state);
      const next = { ...state, ...patch };
      const newSnap = snapshotFrom(next);
      const trimmed = state.history.slice(0, state.historyIdx + 1);
      return {
        ...patch,
        history: [...trimmed, newSnap],
        historyIdx: trimmed.length,
      };
    });
  }

  return {
    /* ── initial state ─ */
    ...INITIAL_SNAPSHOT,
    history: [INITIAL_SNAPSHOT],
    historyIdx: 0,

    mode: "data",
    chatCollapsed: false,
    expandedInsightId: null,
    expandedDataSetId: null,
    activeSlideId: INITIAL_SLIDES[0]?.id ?? null,
    nodePositions: seedNodePositions(),
    canvasTransform: { x: 0, y: 0, zoom: 1 },

    /* ── history ─ */
    undo: () => {
      const { history, historyIdx } = get();
      if (historyIdx <= 0) return;
      const target = history[historyIdx - 1];
      set((s) => ({ ...applySnapshot(s, target), historyIdx: historyIdx - 1 }));
    },
    redo: () => {
      const { history, historyIdx } = get();
      if (historyIdx >= history.length - 1) return;
      const target = history[historyIdx + 1];
      set((s) => ({ ...applySnapshot(s, target), historyIdx: historyIdx + 1 }));
    },
    canUndo: () => get().historyIdx > 0,
    canRedo: () => get().historyIdx < get().history.length - 1,

    /* ── mode & chat ─ */
    setMode: (mode) => set({ mode }),
    toggleMode: () => set((s) => ({ mode: s.mode === "data" ? "presentation" : "data" })),
    toggleChat: () => set((s) => ({ chatCollapsed: !s.chatCollapsed })),
    setChatCollapsed: (chatCollapsed) => set({ chatCollapsed }),

    /* ── insight ops ─ */
    updateInsightRows: (id, rows) => commit((s) => {
      const ins = s.insightsById[id];
      if (!ins || !ins.data) return {};
      return {
        insightsById: {
          ...s.insightsById,
          [id]: { ...ins, data: { ...ins.data, rows } },
        },
      };
    }),
    updateInsightChartType: (id, type) => commit((s) => {
      const ins = s.insightsById[id];
      if (!ins || !ins.data) return {};
      return {
        insightsById: {
          ...s.insightsById,
          [id]: { ...ins, data: { ...ins.data, chartType: type } },
        },
      };
    }),
    setExpandedInsight: (expandedInsightId) => set({ expandedInsightId }),

    /* ── dataset ops ─ */
    addDataSet: () => {
      const id = `ds-${Date.now().toString(36)}`;
      commit((s) => {
        const serial = s.dataSetOrder.length + 1;
        const ds: DataSet = {
          id, serial,
          title: `New Data Set ${serial}`,
          chartType: "Lollipop",
          columns: ["Value"],
          rows: [],
          wide: true,
        };
        return {
          dataSetsById: { ...s.dataSetsById, [id]: ds },
          dataSetOrder: [...s.dataSetOrder, id],
        };
      });
      // Seed a sensible canvas position for the new dataset.
      set((s) => {
        const idx = s.dataSetOrder.length - 1;
        return {
          nodePositions: {
            ...s.nodePositions,
            [id]: { x: DS_COL_X, y: 28 + idx * (CARD_H_EST + ROW_GAP) },
          },
        };
      });
      return id;
    },
    updateDataSetChartType: (id, type) => commit((s) => {
      const ds = s.dataSetsById[id];
      if (!ds) return {};
      return { dataSetsById: { ...s.dataSetsById, [id]: { ...ds, chartType: type } } };
    }),
    setExpandedDataSet: (expandedDataSetId) => set({ expandedDataSetId }),

    /* ── connection ops ─ */
    addConnection: (fromInsightId, toDataSetId) => commit((s) => {
      const exists = s.connections.some(c =>
        c.fromInsightId === fromInsightId && c.toDataSetId === toDataSetId
      );
      if (exists) return {};
      const id = `c-${fromInsightId}->${toDataSetId}`;
      return {
        connections: [...s.connections, { id, fromInsightId, toDataSetId }],
      };
    }),
    removeConnection: (id) => commit((s) => ({
      connections: s.connections.filter(c => c.id !== id),
    })),

    /* ── slide ops ─ */
    addSlideWithDataSet: (dataSetId, atIndex) => commit((s) => {
      // No duplicate slide for the same dataset.
      const existing = s.slideOrder
        .map(id => s.slidesById[id])
        .find(sl => sl.dataSetIds.includes(dataSetId));
      if (existing) return {};

      const id = `slide-${Date.now().toString(36)}`;
      const serial = s.slideOrder.length + 1;
      const newSlide: Slide = {
        id, serial,
        dataSetIds: [dataSetId],
        status: "Paid",
        aggregation: "Monthly",
        colorBy: "Segment",
        filter: "All data",
        colorAccent: "Navy",
        visualStyle: "Modern",
        showLabels: true,
        showGrid: true,
        stackedBars: false,
      };
      const order = [...s.slideOrder];
      if (atIndex == null || atIndex >= order.length) order.push(id);
      else order.splice(atIndex, 0, id);
      return {
        slidesById: { ...s.slidesById, [id]: newSlide },
        slideOrder: order,
      };
    }),
    removeSlide: (id) => commit((s) => {
      if (!s.slidesById[id]) return {};
      const { [id]: _gone, ...rest } = s.slidesById;
      void _gone;
      return {
        slidesById: rest,
        slideOrder: s.slideOrder.filter(x => x !== id),
      };
    }),
    bindDataSetToSlide: (slideId, dataSetId) => commit((s) => {
      const slide = s.slidesById[slideId];
      if (!slide) return {};
      if (slide.dataSetIds.includes(dataSetId)) return {};
      return {
        slidesById: {
          ...s.slidesById,
          [slideId]: { ...slide, dataSetIds: [...slide.dataSetIds, dataSetId] },
        },
      };
    }),
    updateSlide: (id, update) => commit((s) => {
      const slide = s.slidesById[id];
      if (!slide) return {};
      return {
        slidesById: { ...s.slidesById, [id]: { ...slide, ...update } },
      };
    }),
    setActiveSlide: (activeSlideId) => set({ activeSlideId }),

    /* ── node positions (NOT in history — pan/drag is too noisy) ─ */
    setNodePosition: (id, x, y) => set((s) => ({
      nodePositions: { ...s.nodePositions, [id]: { x, y } },
    })),

    /* ── canvas ─ */
    setCanvasTransform: (canvasTransform) => set({ canvasTransform }),
  };
});

/* ── Selectors (stable references via shallow comparison at call site) ─── */

export const selectInsights = (s: WorkspaceStore): Insight[] =>
  s.insightOrder.map(id => s.insightsById[id]).filter(Boolean);

export const selectDataSets = (s: WorkspaceStore): DataSet[] =>
  s.dataSetOrder.map(id => s.dataSetsById[id]).filter(Boolean);

export const selectSlides = (s: WorkspaceStore): Slide[] =>
  s.slideOrder.map(id => s.slidesById[id]).filter(Boolean);

export const selectInsightsForDataSet = (dataSetId: string) =>
  (s: WorkspaceStore): Insight[] => {
    const insightIds = s.connections
      .filter(c => c.toDataSetId === dataSetId)
      .map(c => c.fromInsightId);
    return insightIds.map(id => s.insightsById[id]).filter(Boolean);
  };
