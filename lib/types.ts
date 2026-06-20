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
  /* Active 9 — exposed in dropdown */
  | "Treemap"
  | "Lollipop"
  | "Dot Matrix"
  | "Scatter"
  | "Stacked Bar"
  | "Heatmap"
  | "Radar"
  | "Donut"
  | "Map"
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

/* The 10 types in dropdown order — single source of truth.
   Visually rich types first, utilitarian types last.
   Map moved here from SlideArchetype (it's a data viz, not a presentation format).
   Spline Area promoted from the ChartType union — was seeded in insights but missing here. */
export const ACTIVE_CHART_TYPES: ChartType[] = [
  "Treemap",
  "Heatmap",
  "Map",
  "Lollipop",
  "Donut",
  "Stacked Bar",
  "Dot Matrix",
  "Scatter",
  "Radar",
  "Spline Area",
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

/* ── Speaker notes toggle (SLIDES, deck-wide): show notes or hide them ── */
export type NarrationMode = "Speaker notes included" | "None";

export const NARRATION_MODES: NarrationMode[] = [
  "Speaker notes included",
  "None",
];

/* ── 1st level — Slide ─────────────────────────────────────────────────── */

export type VisualStyle = "Wireframe" | "Magazine" | "Modern";
export type ColorAccent = "Navy" | "Gold" | "Slate" | "Graphite";

export type SlideArchetype =
  | "Chart"
  | "Big Number"
  | "Comparison"
  | "Quote";

export const SLIDE_ARCHETYPES: SlideArchetype[] = [
  "Chart", "Big Number", "Comparison", "Quote",
];

/** Archetypes that don't render a chart — controls dropdown/viz-style visibility. */
export const NON_CHART_ARCHETYPES = new Set<SlideArchetype>([
  "Big Number", "Comparison", "Quote",
]);

/** Slide formats available in Delivery Settings — all non-Chart archetypes.
    "Map" is no longer here — it moved to ChartType (it's a data viz, not a format).
    Sentiment / Word List removed in Slides rework Шаг 4a. */
export const SLIDE_FORMAT_OPTIONS: SlideArchetype[] = [
  "Big Number", "Comparison", "Quote",
];

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

  /** AI-generated 1–2 sentence headline summary rendered as the prominent
      gold-bordered block under the slide title. When undefined, the slide
      derives one from the bound dataset on the fly. */
  summary?: string;
}

/* ── Presentation theme — deck-wide visual preset ───────────────────────────
   A theme restyles the WHOLE presentation — typography, colour, radius,
   density — by overriding the --slide-* custom properties applied at the
   presentation root. Consumed in SLIDES mode; the picker lives in the right
   rail (section «Тема»). */

export type PresentationThemeId = "editorial" | "soft" | "web" | "web-light";

export interface PresentationTheme {
  id: PresentationThemeId;
  label: string;
  blurb: string;
  /** Values for the --slide-* custom properties applied at the deck root. */
  vars: Record<string, string>;
  /** Resolvable by id but NOT shown as its own gallery tile (e.g. the light
      variant of Web-dashboard — surfaced via a ☀/🌙 toggle inside the dark
      tile instead). */
  hidden?: boolean;
}

export const PRESENTATION_THEMES: PresentationTheme[] = [
  {
    id: "editorial",
    label: "Editorial",
    blurb: "Sharp · serif display · hairline",
    vars: {
      "--slide-font-display": "'Playfair Display', 'Instrument Serif', Georgia, serif",
      "--slide-font-body":    "var(--font-inter), system-ui, sans-serif",
      "--slide-font-mono":    "'JetBrains Mono', monospace",
      "--slide-title":        "#1B2840",
      "--slide-text":         "#5C6478",
      "--slide-accent":       "#B89548",
      "--slide-bg":           "#FBF9F3",
      "--slide-border":       "#D9D3C2",
      "--slide-muted":        "#E5E0D2",
      "--slide-radius":       "0px",
      "--slide-block-pad":    "18px 32px",
      "--slide-title-align":  "left",
    },
  },
  {
    id: "soft",
    label: "Soft",
    blurb: "Pinterest · rounded · airy",
    vars: {
      "--slide-font-display": "'Fraunces', 'Playfair Display', Georgia, serif",
      "--slide-font-body":    "var(--font-inter), system-ui, sans-serif",
      "--slide-font-mono":    "var(--font-inter), system-ui, sans-serif",
      "--slide-title":        "#3A2E2A",
      "--slide-text":         "#7A6A60",
      "--slide-accent":       "#C97B5A",
      "--slide-bg":           "#FBF6EF",
      "--slide-border":       "#EBE0D4",
      "--slide-muted":        "#F1E8DE",
      "--slide-radius":       "16px",
      "--slide-block-pad":    "26px 36px",
      "--slide-title-align":  "center",
    },
  },
  {
    id: "web",
    label: "Web-dashboard",
    blurb: "Dark · sans · modern",
    vars: {
      "--slide-font-display": "var(--font-inter), system-ui, sans-serif",
      "--slide-font-body":    "var(--font-inter), system-ui, sans-serif",
      "--slide-font-mono":    "'JetBrains Mono', monospace",
      "--slide-title":        "#F2F5FA",
      "--slide-text":         "#A6B2C4",
      "--slide-accent":       "#D4A94E",
      "--slide-bg":           "#0E1117",
      "--slide-border":       "#232C3A",
      "--slide-muted":        "#1A212C",
      "--slide-radius":       "8px",
      "--slide-block-pad":    "22px 34px",
      "--slide-title-align":  "left",
    },
  },
  {
    /* Light variant of Web-dashboard — hidden tile, reached via the ☀/🌙
       toggle inside the dark Web-dashboard tile (Slides rework Шаг 4c). */
    id: "web-light",
    label: "Web-dashboard",
    blurb: "Light · sans · modern",
    hidden: true,
    vars: {
      "--slide-font-display": "var(--font-inter), system-ui, sans-serif",
      "--slide-font-body":    "var(--font-inter), system-ui, sans-serif",
      "--slide-font-mono":    "'JetBrains Mono', monospace",
      "--slide-title":        "#10151C",
      "--slide-text":         "#4A586B",
      "--slide-accent":       "#B8862E",
      "--slide-bg":           "#F7F9FB",
      "--slide-border":       "#DCE3EC",
      "--slide-muted":        "#EAEFF5",
      "--slide-radius":       "8px",
      "--slide-block-pad":    "22px 34px",
      "--slide-title-align":  "left",
    },
  },
];

/** Web-dashboard theme family — both ids resolve to the same gallery tile;
    the ☀/🌙 toggle flips between them. */
export const WEB_THEME_IDS: PresentationThemeId[] = ["web", "web-light"];

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

/* ── AI insight plan + chat (Урок 5, Шаг 1) ──────────────────────────────────
   AIInsightPlan — «рецепт» инсайта от ИИ (какие колонки, тип графика, текст);
   числа строк считает код из реальных данных. Используется и при ИИ-извлечении
   (lib/insight-engine/ai-plan), и в чате как предложение «построить инсайт». */
export interface AIInsightPlan {
  title: string;
  /** Инсайт словами (plain English). */
  narrative: string;
  /** Тип графика; валидируется против ACTIVE_CHART_TYPES (иначе подбор по форме). */
  chartType: string;
  /** Имя колонки-измерения (ось меток) или null. */
  dimension: string | null;
  /** Имена числовых колонок-метрик. */
  metrics: string[];
}

export type ChatRole = "user" | "axon";

/** Предложение чата применить изменение (v1 — только построить новый инсайт). */
export interface ChatAction {
  type: "add-insight";
  plan: AIInsightPlan;
}

/** Сообщение живого AI-чата по данным (хранится в BoardData, ADR-003). */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  /** Ждём ответ ИИ (точки-тайпинг). */
  pending?: boolean;
  /** Реплика-ошибка (иной стиль + кнопка повтора). */
  error?: boolean;
  /** Предложение построить инсайт → кнопка «Применить». */
  action?: ChatAction;
  /** Действие уже применено (кнопка → «Построено», повтор заблокирован). */
  applied?: boolean;
}

/* ── Board persistence (Урок 4) ─────────────────────────────────────────────
   Что кладём в Board.data (одно JSON-поле в БД): снимок холста + раскладка. */
export interface BoardData {
  snapshot: WorkspaceSnapshot;
  nodePositions: NodePositionMap;
  canvasTransform: { x: number; y: number; zoom: number };
  presentationThemeId: PresentationThemeId;
  /** Имена загруженных файлов-источников — для чипов в чат-рейле (Шаг 11).
      Опционально: старые сохранённые доски этого поля не имеют. */
  sourceFiles?: string[];
  /** Лог живого AI-чата по данным (Урок 5, Шаг 1). Опционально: старые доски без него. */
  chatMessages?: ChatMessage[];
}

/** Краткое описание проекта для списка «Мои проекты» (Урок 4, Шаг 7). */
export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO — сериализуемо для передачи клиенту
}

/** Урезанная дека для публичного показа `/p/[token]` (Шаг 12) — только то, что
    рисуется на read-only странице: слайды + дата-сеты, на которые они ссылаются,
    + тема. Без инсайтов/связей/позиций — наружу не светим лишнего. */
export interface PublicDeck {
  slides: Slide[];
  dataSetsById: Record<string, DataSet>;
  presentationThemeId: PresentationThemeId;
}
