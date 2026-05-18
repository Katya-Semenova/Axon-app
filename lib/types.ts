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

export type ChartType =
  | "Lollipop"
  | "Spline Area"
  | "Donut"
  | "Clean Columns"
  | "Stacked Bar"
  | "Waterfall"
  | "Scatter Plot"
  | "Treemap";

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
}

/* ── 1st level — Slide ─────────────────────────────────────────────────── */

export type VisualStyle = "Wireframe" | "Magazine" | "Modern";
export type ColorAccent = "Navy" | "Gold" | "Slate" | "Graphite";

export interface Slide {
  id: string;
  serial: number;
  /** DataSets shown on this slide, in display order. */
  dataSetIds: string[];
  /** One-liner narrative subtitle shown below the title in the slide card. */
  narrative?: string;

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
}

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
