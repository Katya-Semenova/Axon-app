"use client";

import { create } from "zustand";
import {
  INITIAL_INSIGHTS, INITIAL_DATASETS, INITIAL_SLIDES, INITIAL_CONNECTIONS,
} from "./mockData";
import type {
  Insight, DataSet, Slide, Connection, Mode,
  NodePositionMap, WorkspaceSnapshot,
  ChartType, DataRow, SlideArchetype,
  BuildAudience, BuildTone, BuildMessage,
  DataSetSettings, NarrationMode,
} from "./types";
import { DEFAULT_DATASET_SETTINGS } from "./types";

/* ── Canvas layout constants ───────────────────────────────────────────── */
const CARD_W      = 200;
const CARD_H_EST  = 130;
const DS_W        = 340;   /* DataSet card width — matches Canvas.tsx rendered card width */
const ROW_GAP     = 18;
const INS_COL_X   = 28;
/* 2-column insight grid: each col is CARD_W + 12px gap. DS column starts 48px to the right. */
const INS_COL_STRIDE = CARD_W + 12;
const DS_COL_X    = INS_COL_X + 2 * INS_COL_STRIDE + 48;   /* = 28 + 424 + 48 = 500 */

/* ── Helper: recompute a DataSet's rows/columns when its connections change ─
   Called by both addConnection and removeConnection.

   Rules:
   - No linked insights → rows: [], columns: ["Value"]
   - First insight ever linked → title, chartType, and columns inherit from it
   - Additional insights appended → rows merged, chartType/columns stay
   - Connection removed → rebuild from remaining connections; title/chartType kept  */
function computeDataSetUpdate(
  dataSetId: string,
  newConnections: Connection[],
  insightsById: Record<string, Insight>,
  existingDs: DataSet,
  wasEmpty: boolean,
): Partial<DataSet> {
  const linked = newConnections.filter(c => c.toDataSetId === dataSetId);

  if (linked.length === 0) {
    return { rows: [], columns: ["Value"] };
  }

  const firstIns = insightsById[linked[0].fromInsightId];
  const columns  = firstIns?.data?.columns ?? existingDs.columns;

  /* Only override title/chartType when dataset was freshly empty (first link). */
  const chartType = wasEmpty && firstIns?.data?.chartType
    ? firstIns.data.chartType
    : existingDs.chartType;
  const title = wasEmpty && firstIns
    ? firstIns.title
    : existingDs.title;

  const rows: DataRow[] = [];
  for (const conn of linked) {
    const ins = insightsById[conn.fromInsightId];
    if (!ins?.data) continue;
    const targetLen = columns.length;
    for (const row of ins.data.rows) {
      const values = row.values.slice(0, targetLen);
      while (values.length < targetLen) values.push(0);
      rows.push({ ...row, id: `${ins.id}-${row.id}`, values, sourceInsightId: ins.id });
    }
  }

  return { rows, columns, chartType, title };
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
}

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const it of items) out[it.id] = it;
  return out;
}

/* ── Initial snapshot ──────────────────────────────────────────────────── */

const INITIAL_SNAPSHOT: WorkspaceSnapshot = {
  insightsById: indexById(INITIAL_INSIGHTS),
  dataSetsById: indexById(INITIAL_DATASETS),
  slidesById:   indexById(INITIAL_SLIDES),
  insightOrder: INITIAL_INSIGHTS.map(i => i.id),
  dataSetOrder: INITIAL_DATASETS.map(d => d.id),
  slideOrder:   INITIAL_SLIDES.map(s => s.id),
  connections:  INITIAL_CONNECTIONS,
};

/* ── Seed node positions ───────────────────────────────────────────────── */

function seedNodePositions(): NodePositionMap {
  const p: NodePositionMap = {};
  /* Insights: 2-column grid so all 6 fit without vertical scrolling at 0.85 zoom. */
  INITIAL_INSIGHTS.forEach((ins, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    p[ins.id] = { x: INS_COL_X + col * INS_COL_STRIDE, y: 28 + row * (CARD_H_EST + ROW_GAP) };
  });
  /* Initial datasets — hard-coded Y positions to avoid overlap.
     CARD_H_EST (130) severely underestimates actual rendered height
     (~285px for Map/Heatmap, ~260px for Treemap), so we hard-code
     the three seed positions instead of computing them. */
  const SEED_DS_Y = [28, 325, 597];
  INITIAL_DATASETS.forEach((ds, i) => {
    p[ds.id] = { x: DS_COL_X, y: SEED_DS_Y[i] ?? 28 + i * 300 };
  });
  return p;
}

/* ── Shape ─────────────────────────────────────────────────────────────── */

interface WorkspaceStateShape extends WorkspaceSnapshot {
  history:    WorkspaceSnapshot[];
  historyIdx: number;

  mode:              Mode;
  chatCollapsed:     boolean;
  expandedInsightId: string | null;
  expandedDataSetId: string | null;
  activeSlideId:     string | null;
  nodePositions:     NodePositionMap;
  canvasTransform:   { x: number; y: number; zoom: number };

  /* ── Build mode ─ */
  buildAudience:      BuildAudience;
  buildTone:          BuildTone;
  buildNarration:     boolean;        /* legacy on/off — preserved for any old consumer */
  buildNarrationMode: NarrationMode;  /* round-4: tristate delivery picker */
  buildMessages:  BuildMessage[];
}

interface WorkspaceActions {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setMode:         (mode: Mode) => void;
  toggleMode:      () => void;
  toggleChat:      () => void;
  setChatCollapsed: (collapsed: boolean) => void;

  updateInsightRows:      (id: string, rows: DataRow[]) => void;
  updateInsightChartType: (id: string, type: ChartType) => void;
  setExpandedInsight:     (id: string | null) => void;

  addDataSet:            () => string;
  removeDataSet:         (id: string) => void;
  updateDataSetRows:     (id: string, rows: DataRow[]) => void;
  updateDataSetChartType: (id: string, type: ChartType) => void;
  updateDataSetSettings: (id: string, partial: Partial<DataSetSettings>) => void;
  setExpandedDataSet:    (id: string | null) => void;

  addConnection:    (fromInsightId: string, toDataSetId: string) => void;
  removeConnection: (id: string) => void;

  addEmptySlide:       () => void;
  addSlideWithDataSet: (dataSetId: string, atIndex?: number) => void;
  removeSlide:         (id: string) => void;
  bindDataSetToSlide:  (slideId: string, dataSetId: string) => void;
  updateSlide:         (id: string, update: Partial<Slide>) => void;
  reorderSlide:        (fromIndex: number, toIndex: number) => void;
  setActiveSlide:      (id: string | null) => void;

  setNodePosition:    (id: string, x: number, y: number) => void;
  setCanvasTransform: (t: { x: number; y: number; zoom: number }) => void;

  /* ── Build mode ─ */
  setBuildAudience:      (a: BuildAudience) => void;
  setBuildTone:          (t: BuildTone) => void;
  toggleBuildNarration:  () => void;
  setBuildNarrationMode: (mode: NarrationMode) => void;
  addBuildMessage:      (msg: BuildMessage) => void;
  updateBuildMessage:   (id: string, update: Partial<BuildMessage>) => void;
  clearBuildMessages:   () => void;
}

export type WorkspaceStore = WorkspaceStateShape & WorkspaceActions;

type Mutator = (s: WorkspaceStateShape) => Partial<WorkspaceStateShape>;

/* ── Store ─────────────────────────────────────────────────────────────── */

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => {
  function commit(mutate: Mutator) {
    set((state) => {
      const patch = mutate(state);
      if (Object.keys(patch).length === 0) return state;
      const next  = { ...state, ...patch };
      const snap  = snapshotFrom(next);
      const trimmed = state.history.slice(0, state.historyIdx + 1);
      return { ...patch, history: [...trimmed, snap], historyIdx: trimmed.length };
    });
  }

  return {
    /* ── initial state ─ */
    ...INITIAL_SNAPSHOT,
    history:    [INITIAL_SNAPSHOT],
    historyIdx: 0,

    mode:              "data",
    chatCollapsed:     false,
    expandedInsightId: null,
    expandedDataSetId: null,
    activeSlideId:     INITIAL_SLIDES[0]?.id ?? null,
    nodePositions:     seedNodePositions(),
    /* Zoomed out to 0.75 so all 3 seed datasets fit without vertical clipping. */
    canvasTransform:   { x: 20, y: 20, zoom: 0.75 },

    buildAudience:      "CEO",
    buildTone:          "Neutral",
    buildNarration:     false,
    buildNarrationMode: "Speaker notes included",
    buildMessages:  [],

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
    setMode:          (mode) => set({ mode }),
    toggleMode:       () => set((s) => ({ mode: s.mode === "data" ? "presentation" : "data" })),
    toggleChat:       () => set((s) => ({ chatCollapsed: !s.chatCollapsed })),
    setChatCollapsed: (chatCollapsed) => set({ chatCollapsed }),

    /* ── insight ops ─ */
    updateInsightRows: (id, rows) => commit((s) => {
      const ins = s.insightsById[id];
      if (!ins?.data) return {};
      return { insightsById: { ...s.insightsById, [id]: { ...ins, data: { ...ins.data, rows } } } };
    }),
    updateInsightChartType: (id, type) => commit((s) => {
      const ins = s.insightsById[id];
      if (!ins?.data) return {};
      return { insightsById: { ...s.insightsById, [id]: { ...ins, data: { ...ins.data, chartType: type } } } };
    }),
    setExpandedInsight: (expandedInsightId) => set({ expandedInsightId }),

    /* ── dataset ops ─ */
    addDataSet: () => {
      const id      = `ds-${Date.now().toString(36)}`;
      const slideId = `slide-${Date.now().toString(36)}-ds`;
      commit((s) => {
        const serial = s.dataSetOrder.length + 1;
        const ds: DataSet = {
          id, serial,
          title:     `New Data Set ${serial}`,
          chartType: "Lollipop",
          columns:   ["Value"],
          rows:      [],
          wide:      true,
        };
        /* Auto-create a paired slide in the tray so the dataset appears
           immediately without requiring a manual drag. Same pattern as slides. */
        const slideSerial = s.slideOrder.length + 1;
        const slide: Slide = {
          id: slideId, serial: slideSerial, dataSetIds: [id], narrative: "",
          archetype: "Chart",
          status: "Paid", aggregation: "Monthly", colorBy: "Segment",
          filter: "All data", colorAccent: "Navy", visualStyle: "Modern",
          showLabels: true, showGrid: true, stackedBars: false,
        };
        return {
          dataSetsById: { ...s.dataSetsById, [id]: ds },
          dataSetOrder: [...s.dataSetOrder, id],
          slidesById:   { ...s.slidesById, [slideId]: slide },
          slideOrder:   [...s.slideOrder, slideId],
        };
      });
      /* Grid-offset spawn around the centre "+ NEW DATA SET" anchor.
         Cards fly out in 8-card rings (N, NE, E, SE, S, SW, W, NW)
         at radii that step out one card-width per ring — so the
         centre button is never obscured and the layout reads as an
         organised burst rather than a stack. */
      set((s) => {
        const idx = s.dataSetOrder.indexOf(id);   // 0-based spawn order
        const SPOKES   = 8;
        const ring     = Math.floor(idx / SPOKES) + 1;
        const slot     = idx % SPOKES;
        /* Start at N (-π/2) so the first card lands directly above the button. */
        const angle    = -Math.PI / 2 + slot * (2 * Math.PI / SPOKES);
        const radius   = Math.min(260, 180 + (ring - 1) * 100);
        const ANCHOR_X = 600;   // world-space centre — canvas mid-point at default pan
        const ANCHOR_Y = 430;
        const cx       = ANCHOR_X + Math.cos(angle) * radius;
        const cy       = ANCHOR_Y + Math.sin(angle) * radius;
        return {
          nodePositions: {
            ...s.nodePositions,
            [id]: { x: cx - DS_W / 2, y: cy - CARD_H_EST / 2 },
          },
        };
      });
      return id;
    },
    removeDataSet: (id) => commit((s) => {
      if (!s.dataSetsById[id]) return {};
      const { [id]: _gone, ...rest } = s.dataSetsById;
      void _gone;
      const newConns = s.connections.filter(c => c.toDataSetId !== id);
      const slidesById = { ...s.slidesById };
      for (const sid of s.slideOrder) {
        const sl = slidesById[sid];
        if (sl?.dataSetIds.includes(id)) {
          slidesById[sid] = { ...sl, dataSetIds: sl.dataSetIds.filter(did => did !== id) };
        }
      }
      return {
        dataSetsById: rest,
        dataSetOrder: s.dataSetOrder.filter(x => x !== id),
        connections: newConns,
        slidesById,
      };
    }),

    updateDataSetRows: (id, rows) => commit((s) => {
      const ds = s.dataSetsById[id];
      if (!ds) return {};
      return { dataSetsById: { ...s.dataSetsById, [id]: { ...ds, rows } } };
    }),

    updateDataSetChartType: (id, type) => commit((s) => {
      const ds = s.dataSetsById[id];
      if (!ds) return {};
      return { dataSetsById: { ...s.dataSetsById, [id]: { ...ds, chartType: type } } };
    }),
    updateDataSetSettings: (id, partial) => commit((s) => {
      const ds = s.dataSetsById[id];
      if (!ds) return {};
      const current = ds.settings ?? DEFAULT_DATASET_SETTINGS;
      return {
        dataSetsById: {
          ...s.dataSetsById,
          [id]: { ...ds, settings: { ...current, ...partial } },
        },
      };
    }),
    setExpandedDataSet: (expandedDataSetId) => set({ expandedDataSetId }),

    /* ── connection ops ─
       addConnection: create the edge AND immediately push the linked insight's
       data into the target DataSet so the chart appears instantly.
       removeConnection: delete the edge AND recompute the DataSet's rows from
       whatever connections remain (empty rows if none left → blank state).   */
    addConnection: (fromInsightId, toDataSetId) => commit((s) => {
      const exists = s.connections.some(
        c => c.fromInsightId === fromInsightId && c.toDataSetId === toDataSetId
      );
      if (exists) return {};

      const id          = `c-${fromInsightId}->${toDataSetId}`;
      const newConns    = [...s.connections, { id, fromInsightId, toDataSetId }];
      const ds          = s.dataSetsById[toDataSetId];
      if (!ds) return { connections: newConns };

      const wasEmpty = ds.rows.length === 0;
      const update   = computeDataSetUpdate(toDataSetId, newConns, s.insightsById, ds, wasEmpty);

      const ins = s.insightsById[fromInsightId];
      let slidesById = s.slidesById;
      if (ins?.kind === "text" && ins.text) {
        const updatedSlides = { ...s.slidesById };
        for (const sid of s.slideOrder) {
          const slide = updatedSlides[sid];
          if (slide?.dataSetIds.includes(toDataSetId) && slide.archetype !== "Quote") {
            updatedSlides[sid] = { ...slide, archetype: "Quote" as SlideArchetype, narrative: ins.text };
          }
        }
        slidesById = updatedSlides;
      }

      return {
        connections:  newConns,
        dataSetsById: { ...s.dataSetsById, [toDataSetId]: { ...ds, ...update } },
        slidesById,
      };
    }),

    removeConnection: (id) => commit((s) => {
      const conn     = s.connections.find(c => c.id === id);
      const newConns = s.connections.filter(c => c.id !== id);
      if (!conn) return { connections: newConns };

      const ds = s.dataSetsById[conn.toDataSetId];
      if (!ds) return { connections: newConns };

      const update = computeDataSetUpdate(conn.toDataSetId, newConns, s.insightsById, ds, false);
      return {
        connections:  newConns,
        dataSetsById: { ...s.dataSetsById, [conn.toDataSetId]: { ...ds, ...update } },
      };
    }),

    /* ── slide ops ─ */
    addEmptySlide: () => commit((s) => {
      const id     = `slide-${Date.now().toString(36)}`;
      const serial = s.slideOrder.length + 1;
      const slide: Slide = {
        id, serial, dataSetIds: [], narrative: "",
        archetype: "Chart" as SlideArchetype,
        status: "Paid", aggregation: "Monthly", colorBy: "Segment",
        filter: "All data", colorAccent: "Navy", visualStyle: "Modern",
        showLabels: true, showGrid: true, stackedBars: false,
      };
      return {
        slidesById: { ...s.slidesById, [id]: slide },
        slideOrder: [...s.slideOrder, id],
      };
    }),

    addSlideWithDataSet: (dataSetId, atIndex) => commit((s) => {
      const id     = `slide-${Date.now().toString(36)}`;
      const serial = s.slideOrder.length + 1;
      const slide: Slide = {
        id, serial, dataSetIds: [dataSetId], narrative: "",
        archetype: "Chart" as SlideArchetype,
        status: "Paid", aggregation: "Monthly", colorBy: "Segment",
        filter: "All data", colorAccent: "Navy", visualStyle: "Modern",
        showLabels: true, showGrid: true, stackedBars: false,
      };
      const order = [...s.slideOrder];
      if (atIndex == null || atIndex >= order.length) order.push(id);
      else order.splice(atIndex, 0, id);
      return { slidesById: { ...s.slidesById, [id]: slide }, slideOrder: order };
    }),

    removeSlide: (id) => commit((s) => {
      if (!s.slidesById[id]) return {};
      const { [id]: _gone, ...rest } = s.slidesById;
      void _gone;
      return { slidesById: rest, slideOrder: s.slideOrder.filter(x => x !== id) };
    }),

    bindDataSetToSlide: (slideId, dataSetId) => commit((s) => {
      const slide = s.slidesById[slideId];
      if (!slide || slide.dataSetIds.includes(dataSetId)) return {};
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
      return { slidesById: { ...s.slidesById, [id]: { ...slide, ...update } } };
    }),

    reorderSlide: (from, to) => commit((s) => {
      if (from === to || from < 0 || to < 0) return {};
      const order = [...s.slideOrder];
      if (from >= order.length || to >= order.length) return {};
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);
      return { slideOrder: order };
    }),
    setActiveSlide: (activeSlideId) => set({ activeSlideId }),

    /* ── node positions (NOT in history) ─ */
    setNodePosition: (id, x, y) => set((s) => ({
      nodePositions: { ...s.nodePositions, [id]: { x, y } },
    })),

    /* ── canvas ─ */
    setCanvasTransform: (canvasTransform) => set({ canvasTransform }),

    /* ── build mode ─ */
    setBuildAudience:     (buildAudience) => set({ buildAudience }),
    setBuildTone:         (buildTone)     => set({ buildTone }),
    toggleBuildNarration: ()              => set((s) => ({ buildNarration: !s.buildNarration })),
    setBuildNarrationMode: (buildNarrationMode) => set({ buildNarrationMode }),
    addBuildMessage: (msg) => set((s) => ({ buildMessages: [...s.buildMessages, msg] })),
    updateBuildMessage: (id, update) => set((s) => ({
      buildMessages: s.buildMessages.map(m => m.id === id ? { ...m, ...update } : m),
    })),
    clearBuildMessages: () => set({ buildMessages: [] }),
  };
});

/* ── Selectors ─────────────────────────────────────────────────────────── */

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
