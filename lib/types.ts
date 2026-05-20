/**
 * Core entity hierarchy for Axon.
 *
 *   Insight (3rd level)  →  DataSet (2nd level)  →  Slide (1st level)
 *
 * Insights are pure data carriers (text / sql / code / tabular rows) with no
 * chart attached at the card level. Several insights are wired into a DataSet
 * via Connection nodes; the DataSet adds the visualization. Slides reference
 * one or more DataSets and are the final presentation unit, edited only in
 * Presentation Mode.
 */

/* ── Chart types & data rows — owned by `types`, re-exported from mockData ─ */

/* ── ChartType — narrowed to 8 active types per round-4 spec ──────────────
   The picker offers exactly these 8, no groupings, flat list:
     1. Treemap          5. Stacked Bar
     2. Lollipop         6. Heatmap
     3. Dot Matrix       7. Radar
     4. Scatter          8. Donut

   Legacy names (Bar, Line, Area, Waterfall, Sankey, Bullet, Box Plot,
   "Spline Area", "Clean Columns", "Scatter Plot") stay in the union so
   existing data sets continue to resolve — they're just not offered in
   the dropdown. */
export type ChartType =
  /* Active 8 — exposed in dropdown */
  | "Treemap"
  | "Lollipop"
  | "Dot Matrix"
  | "Scatter"
  | "Stacked Bar"
  | "Heatmap"
  | "Radar"
  | "Donut"
  /* Legacy — still resolve, never offered */
  | "Bar"
  | "Line"
  | "Area"
  | "Waterfall"
  | "Sankey"
  | "Bullet"
  | "Box Plot"
  | "Spline Area"
  | "Clean Columns"
  | "Scatter Plot";

/* The 8 types in dropdown order — single source of truth. */
export const ACTIVE_CHART_TYPES: ChartType[] = [
  "Treemap",
  "Lollipop",
  "Dot Matrix",
  "Scatter",
  "Stacked Bar",
  "Heatmap",
  "Radar",
  "Donut",
];

export interface DataRow {
  id: string;
  label: string;
  values: number[];
  /**
   * Optional pointer back to the Insight that produced this row. Surfaces as
   * the `DATA SET` column ("INSIGHT 3") in SlideEditor's editable data table.
   */
  sourceInsightId?: string;
}

/* ── 3rd level — Insight ───────────────────────────────────────────────── */

/**
 * What kind of payload this insight carries.
 *
 * - `data`: tabular rows + columns (the bulk of the current `CardState`).
 *           Renders as an editable table + companion chart in
 *           InsightExpandedView; the card itself shows only title + a hint.
 * - `text`: free-form Markdown / plain text content (no graph).
 * - `sql`:  a SQL query string (no graph).
 * - `code`: a code snippet, any language (no graph).
 */
export type InsightKind = "data" | "text" | "sql" | "code";

export interface Insight {
  id: string;
  /** Serial number used for the `01 /` label and stable display ordering. */
  serial: number;
  /** Headline shown on the card and at the top of the expanded view. */
  title: string;
  kind: InsightKind;

  /* ── payload — exactly one of these is populated per `kind` ──────────── */

  /** Tabular payload — required when `kind === "data"`. */
  data?: {
    columns: string[];
    rows: DataRow[];
    /** Companion chart type used inside InsightExpandedView. */
    chartType: ChartType;
  };
  /** Free-form text payload — required when `kind === "text"`. */
  text?: string;
  /** SQL query string — required when `kind === "sql"`. */
  sql?: string;
  /** Code snippet — required when `kind === "code"`. */
  code?: { language: string; source: string };

  /** Confidence indicator shown in card footer (same semantics as today). */
  confFilled: number;
  confPct: number;
}

/* ── 2nd level — DataSet ───────────────────────────────────────────────── */

export interface DataSet {
  id: string;
  serial: number;
  title: string;
  /** Aggregate chart type rendered on the DataSet card. */
  chartType: ChartType;
  /**
   * Tabular data shown by the aggregate chart. Each row may optionally point
   * back to the source Insight it came from (`sourceInsightId`), which is what
   * the `DATA SET` column in SlideEditor's table surfaces as "INSIGHT N".
   */
  columns: string[];
  rows: DataRow[];
  /** Wider card on canvas (mirrors today's `wide` flag on `CardState`). */
  wide: boolean;
  /**
   * Settings bound to THIS data set — populated only via the drill-in page
   * (DataSetExpandedView). When undefined, defaults apply: status "All",
   * aggregation "Monthly", colorBy "Segment", filter "All data", accent "Navy".
   * Changes here re-render the aggregate chart on the drill-in page and
   * persist when the user returns to canvas.
   */
  settings?: DataSetSettings;
}

export interface DataSetSettings {
  status: string;
  aggregation: "Monthly" | "Weekly" | "Daily" | "Quarterly";
  colorBy: string;
  filter: string;
  accent: ColorAccent;
}

export const DEFAULT_DATASET_SETTINGS: DataSetSettings = {
  status:      "All",
  aggregation: "Monthly",
  colorBy:     "Segment",
  filter:      "All data",
  accent:      "Navy",
};

/* ── 1st level — Slide ─────────────────────────────────────────────────── */

export type VisualStyle = "Wireframe" | "Magazine" | "Modern";
export type ColorAccent = "Navy" | "Gold" | "Slate" | "Graphite";

export type SlideArchetype =
  | "Chart"
  | "Big Number"
  | "Comparison"
  | "Sentiment"
  | "Map"
  | "Word List"
  | "Treemap"
  | "Quote";

export const SLIDE_ARCHETYPES: SlideArchetype[] = [
  "Chart", "Big Number", "Comparison", "Sentiment", "Map", "Word List", "Treemap", "Quote",
];

/** Archetypes that don't render a chart — controls dropdown/viz-style visibility. */
export const NON_CHART_ARCHETYPES = new Set<SlideArchetype>([
  "Big Number", "Comparison", "Sentiment", "Map", "Word List", "Treemap", "Quote",
]);

export interface Slide {
  id: string;
  serial: number;
  /** DataSets shown on this slide, in display order. */
  dataSetIds: string[];
  /** One-liner narrative subtitle shown below the title in the slide card. */
  narrative?: string;

  /* ── archetype ────────────────────────────────────────────────────── */
  archetype: SlideArchetype;

  /* ── chart settings panel ─────────────────────────────────────────── */
  status: string;
  aggregation: "Monthly" | "Weekly" | "Daily";
  colorBy: string;
  filter: string;
  colorAccent: ColorAccent;

  /* ── visualization style panel ────────────────────────────────────── */
  visualStyle: VisualStyle;
  showLabels: boolean;
  showGrid: boolean;
  stackedBars: boolean;

  /* ── SLIDES mode additions ──────────────────────────────────────────
     Render engine driving the slide's chart — picker lives in the right
     rail of SLIDES mode. UI selection persists per slide.            */
  renderEngine?: RenderEngine;

  /** AI-generated 1–2 sentence headline summary rendered as the prominent
      gold-bordered block under the slide title. When undefined, the slide
      derives one from the bound dataset on the fly. */
  summary?: string;
}

export type RenderEngine = "SciChart" | "Highcharts" | "D3";

export const RENDER_ENGINES: { id: RenderEngine; label: string; subtitle: string }[] = [
  { id: "SciChart",   label: "SciChart",   subtitle: "Modern"  },
  { id: "Highcharts", label: "Highcharts", subtitle: "Classic" },
  { id: "D3",         label: "D3.js",      subtitle: "Custom"  },
];

/* ── Connections — Insight → DataSet ───────────────────────────────────── */

/**
 * A node-graph edge from an Insight's output port to a DataSet's input port.
 * Edges represent "this insight feeds this dataset". The canvas renders one
 * bezier per edge; the store derives "which insights live inside DataSet X"
 * from the set of connections terminating at X.
 */
export interface Connection {
  id: string;
  fromInsightId: string;
  toDataSetId: string;
}

/* ── Mode ──────────────────────────────────────────────────────────────── */

export type Mode = "data" | "presentation" | "build";

/* ── Build-mode types ──────────────────────────────────────────────────── */

export type BuildAudience = "CEO" | "Board" | "Team" | "Investor" | "Custom";
export type BuildTone = "Formal" | "Neutral" | "Casual";

export interface BuildMessage {
  id: string;
  role: "axon" | "user";
  content: string;
  streaming?: boolean;
}

/* ── Canvas node positions ─────────────────────────────────────────────── */

export interface NodePosition {
  x: number;
  y: number;
}

export type NodePositionMap = Record<string, NodePosition>;

/* ── Snapshot used by history-based undo/redo ──────────────────────────── */

export interface WorkspaceSnapshot {
  insightsById: Record<string, Insight>;
  dataSetsById: Record<string, DataSet>;
  slidesById: Record<string, Slide>;
  insightOrder: string[];
  dataSetOrder: string[];
  slideOrder: string[];
  connections: Connection[];
}
