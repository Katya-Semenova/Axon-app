import type {
  ChartType, DataRow,
  Insight, DataSet, Slide, Connection, SlideArchetype,
} from "./types";
export type { ChartType, DataRow };

/* Round-4: narrowed to 8 active types. Use ACTIVE_CHART_TYPES from
   lib/types.ts as the single source of truth — this re-export exists
   only for back-compat consumers that still import CHART_TYPES. */
export const CHART_TYPES: ChartType[] = [
  "Treemap",
  "Lollipop",
  "Dot Matrix",
  "Scatter",
  "Stacked Bar",
  "Heatmap",
  "Radar",
  "Donut",
];

export interface CardState {
  id: string;
  serial: number;
  headline: string;
  chartType: ChartType;
  columns: string[];
  rows: DataRow[];
  confFilled: number;
  confPct: number;
  wide: boolean;
}

function row(id: string, label: string, ...values: number[]): DataRow {
  return { id, label, values };
}

export const INITIAL_CARDS: CardState[] = [
  {
    id: "lollipop",
    serial: 1,
    headline: "Revenue contracted 18% in Q3 — mid-market churn led",
    chartType: "Lollipop",
    columns: ["Revenue (K)"],
    rows: [
      row("r1", "Jan", 820), row("r2", "Feb", 890), row("r3", "Mar", 940),
      row("r4", "Apr", 920), row("r5", "May", 980), row("r6", "Jun", 1020),
      row("r7", "Jul", 1040), row("r8", "Aug", 850), row("r9", "Sep", 790),
      row("r10", "Oct", 820), row("r11", "Nov", 860), row("r12", "Dec", 930),
    ],
    confFilled: 4, confPct: 91, wide: true,
  },
  {
    id: "stacked",
    serial: 2,
    headline: "Top 5 churning segments by quarter",
    chartType: "Stacked Bar",
    columns: ["Q1", "Q2", "Q3"],
    rows: [
      row("r1", "Mid-market", 38, 42, 31),
      row("r2", "Enterprise", 27, 29, 23),
      row("r3", "SMB", 19, 21, 17),
      row("r4", "Freemium", 11, 13, 9),
      row("r5", "Annual", 5, 6, 4),
    ],
    confFilled: 5, confPct: 96, wide: false,
  },
  {
    id: "donut",
    serial: 3,
    headline: "Conversion by channel — email leads, paid lags",
    chartType: "Donut",
    columns: ["Rate (%)"],
    rows: [
      row("r1", "Email", 6.2),
      row("r2", "Organic", 4.8),
      row("r3", "Direct", 3.4),
      row("r4", "Paid", 2.9),
    ],
    confFilled: 4, confPct: 88, wide: false,
  },
  {
    id: "spline",
    serial: 4,
    headline: "Cohort retention — 24% holdout at month 12",
    chartType: "Spline Area",
    columns: ["Retention (%)"],
    rows: [
      row("r1", "Month 1", 100), row("r2", "Month 2", 72), row("r3", "Month 3", 58),
      row("r4", "Month 4", 49), row("r5", "Month 5", 42), row("r6", "Month 6", 37),
      row("r7", "Month 7", 33), row("r8", "Month 8", 30), row("r9", "Month 9", 28),
      row("r10", "Month 10", 26), row("r11", "Month 11", 25), row("r12", "Month 12", 24),
    ],
    confFilled: 3, confPct: 79, wide: false,
  },
  {
    id: "columns",
    serial: 5,
    headline: "MRR: $1.2M — 12-month steady growth trajectory",
    chartType: "Bar",
    columns: ["MRR ($K)"],
    rows: [
      row("r1", "Jan", 1050), row("r2", "Feb", 1080), row("r3", "Mar", 1100),
      row("r4", "Apr", 1140), row("r5", "May", 1160), row("r6", "Jun", 1180),
      row("r7", "Jul", 1195), row("r8", "Aug", 1200), row("r9", "Sep", 1210),
      row("r10", "Oct", 1190), row("r11", "Nov", 1205), row("r12", "Dec", 1220),
    ],
    confFilled: 5, confPct: 94, wide: false,
  },
  {
    id: "treemap",
    serial: 6,
    headline: "Revenue by product line — Enterprise anchors the mix",
    chartType: "Treemap",
    columns: ["Revenue ($M)"],
    rows: [
      row("r1", "Enterprise", 4.2),
      row("r2", "Growth", 2.8),
      row("r3", "Starter", 1.9),
      row("r4", "Professional", 1.4),
      row("r5", "Add-ons", 0.8),
      row("r6", "API", 0.5),
    ],
    confFilled: 4, confPct: 87, wide: true,
  },
];

export function defaultDataForType(type: ChartType): { columns: string[]; rows: DataRow[] } {
  switch (type) {
    case "Scatter":
    case "Scatter Plot":
      return {
        columns: ["Engagement", "Revenue ($K)"],
        rows: [
          row("r1", "Segment A", 72, 480), row("r2", "Segment B", 58, 320),
          row("r3", "Segment C", 85, 650), row("r4", "Segment D", 41, 190),
          row("r5", "Segment E", 67, 410), row("r6", "Segment F", 93, 780),
        ],
      };
    case "Waterfall":
      return {
        columns: ["Delta ($K)"],
        rows: [
          row("r1", "Start", 1050), row("r2", "New Biz", 320),
          row("r3", "Expansion", 140), row("r4", "Churn", -180),
          row("r5", "Contract.", -70), row("r6", "End", 1260),
        ],
      };
    case "Stacked Bar":
      return {
        columns: ["Q1", "Q2", "Q3"],
        rows: [
          row("r1", "Mid-market", 38, 42, 31),
          row("r2", "Enterprise", 27, 29, 23),
          row("r3", "SMB", 19, 21, 17),
        ],
      };
    case "Heatmap":
      /* 6×6 SaaS metric correlation matrix — values in [-1, 1].
         Symmetric, diagonal = 1.00. Churn row/column is the "cold" stripe. */
      return {
        columns: ["Revenue", "Conv.", "Churn", "MRR", "Retention", "NPS"],
        rows: [
          row("r1", "Revenue",    1.00,  0.64, -0.71,  0.92,  0.78,  0.55),
          row("r2", "Conv.",      0.64,  1.00, -0.58,  0.61,  0.63,  0.47),
          row("r3", "Churn",     -0.71, -0.58,  1.00, -0.68, -0.82, -0.74),
          row("r4", "MRR",        0.92,  0.61, -0.68,  1.00,  0.71,  0.52),
          row("r5", "Retention",  0.78,  0.63, -0.82,  0.71,  1.00,  0.69),
          row("r6", "NPS",        0.55,  0.47, -0.74,  0.52,  0.69,  1.00),
        ],
      };
    default:
      return {
        columns: ["Value"],
        rows: [
          row("r1", "Jan", 820), row("r2", "Feb", 890), row("r3", "Mar", 940),
          row("r4", "Apr", 920), row("r5", "May", 980), row("r6", "Jun", 1020),
        ],
      };
  }
}

export function adaptRows(rows: DataRow[], targetType: ChartType, targetColumns: string[]): DataRow[] {
  const needCount =
    (targetType === "Scatter" || targetType === "Scatter Plot") ? 2
    : targetType === "Stacked Bar" ? targetColumns.length
    : targetType === "Heatmap"     ? targetColumns.length
    : 1;

  return rows.map((r) => {
    if (r.values.length === needCount) return r;
    if (r.values.length > needCount) return { ...r, values: r.values.slice(0, needCount) };
    const padded = [...r.values];
    while (padded.length < needCount) padded.push(0);
    return { ...r, values: padded };
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   New entity hierarchy — Insight / DataSet / Slide
   ────────────────────────────────────────────────────────────────────────
   Each Insight is a pure data carrier. DataSets aggregate one or more
   Insights through Connections and own the visualization. Slides reference
   one or more DataSets and are edited in Presentation Mode.
══════════════════════════════════════════════════════════════════════════ */

/* ── Insights — 6 (5 tabular + 1 textual context insight) ──────────────── */
export const INITIAL_INSIGHTS: Insight[] = [
  {
    id: "ins-revenue-monthly",
    serial: 1,
    title: "Monthly revenue, FY",
    kind: "data",
    data: {
      columns: ["Revenue (K)"],
      chartType: "Lollipop",
      rows: [
        row("r1",  "Jan", 820), row("r2",  "Feb", 890), row("r3",  "Mar", 940),
        row("r4",  "Apr", 920), row("r5",  "May", 980), row("r6",  "Jun", 1020),
        row("r7",  "Jul", 1040), row("r8",  "Aug", 850), row("r9",  "Sep", 790),
        row("r10", "Oct", 820), row("r11", "Nov", 860), row("r12", "Dec", 930),
      ],
    },
    confFilled: 4, confPct: 91,
  },
  {
    id: "ins-churn-segments",
    serial: 2,
    title: "Churn by segment, quarterly",
    kind: "data",
    data: {
      columns: ["Q1", "Q2", "Q3"],
      chartType: "Stacked Bar",
      rows: [
        row("r1", "Mid-market", 38, 42, 31),
        row("r2", "Enterprise", 27, 29, 23),
        row("r3", "SMB",        19, 21, 17),
        row("r4", "Freemium",   11, 13,  9),
        row("r5", "Annual",      5,  6,  4),
      ],
    },
    confFilled: 5, confPct: 96,
  },
  {
    id: "ins-conversion-channel",
    serial: 3,
    title: "Conversion by channel",
    kind: "data",
    data: {
      columns: ["Rate (%)"],
      chartType: "Donut",
      rows: [
        row("r1", "Email",   6.2),
        row("r2", "Organic", 4.8),
        row("r3", "Direct",  3.4),
        row("r4", "Paid",    2.9),
      ],
    },
    confFilled: 4, confPct: 88,
  },
  {
    id: "ins-cohort-retention",
    serial: 4,
    title: "Cohort retention curve",
    kind: "data",
    data: {
      columns: ["Retention (%)"],
      chartType: "Spline Area",
      rows: [
        row("r1",  "Month 1",  100), row("r2",  "Month 2",  72),
        row("r3",  "Month 3",   58), row("r4",  "Month 4",  49),
        row("r5",  "Month 5",   42), row("r6",  "Month 6",  37),
        row("r7",  "Month 7",   33), row("r8",  "Month 8",  30),
        row("r9",  "Month 9",   28), row("r10", "Month 10", 26),
        row("r11", "Month 11",  25), row("r12", "Month 12", 24),
      ],
    },
    confFilled: 3, confPct: 79,
  },
  {
    id: "ins-mrr-growth",
    serial: 5,
    title: "MRR growth trajectory",
    kind: "data",
    data: {
      columns: ["MRR ($K)"],
      chartType: "Bar",
      rows: [
        row("r1",  "Jan", 1050), row("r2",  "Feb", 1080), row("r3",  "Mar", 1100),
        row("r4",  "Apr", 1140), row("r5",  "May", 1160), row("r6",  "Jun", 1180),
        row("r7",  "Jul", 1195), row("r8",  "Aug", 1200), row("r9",  "Sep", 1210),
        row("r10", "Oct", 1190), row("r11", "Nov", 1205), row("r12", "Dec", 1220),
      ],
    },
    confFilled: 5, confPct: 94,
  },
  {
    id: "ins-metric-correlation",
    serial: 6,
    title: "Metric correlation matrix",
    kind: "data",
    data: {
      columns: ["Revenue", "Conv.", "Churn", "MRR", "Retention", "NPS"],
      chartType: "Heatmap",
      rows: [
        row("r1", "Revenue",    1.00,  0.64, -0.71,  0.92,  0.78,  0.55),
        row("r2", "Conv.",      0.64,  1.00, -0.58,  0.61,  0.63,  0.47),
        row("r3", "Churn",     -0.71, -0.58,  1.00, -0.68, -0.82, -0.74),
        row("r4", "MRR",        0.92,  0.61, -0.68,  1.00,  0.71,  0.52),
        row("r5", "Retention",  0.78,  0.63, -0.82,  0.71,  1.00,  0.69),
        row("r6", "NPS",        0.55,  0.47, -0.74,  0.52,  0.69,  1.00),
      ],
    },
    confFilled: 5, confPct: 93,
  },
  {
    id: "ins-q3-narrative",
    serial: 7,
    title: "Q3 churn narrative",
    kind: "text",
    text:
      "Mid-market accounts drove 71% of Q3 churn. Two clusters: long-tenure customers " +
      "downgrading to lower SKUs, and 90-day actives lapsing after onboarding gaps. " +
      "Conversion held above goal everywhere except Paid.",
    confFilled: 3, confPct: 74,
  },
];

/* ── DataSets — two pre-seeded by the AI agent, connected to insights ───── */
export const INITIAL_DATASETS: DataSet[] = [
  {
    id: "ds-seed-01",
    serial: 1,
    title: "Monthly revenue, FY",
    chartType: "Map",
    columns: ["Revenue (K)"],
    /* Rows pre-computed from ins-revenue-monthly. sourceInsightId matches
       the connection below so the edge renders immediately on canvas load. */
    rows: [
      { id: "ins-revenue-monthly-r1",  label: "Jan", values: [820],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r2",  label: "Feb", values: [890],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r3",  label: "Mar", values: [940],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r4",  label: "Apr", values: [920],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r5",  label: "May", values: [980],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r6",  label: "Jun", values: [1020], sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r7",  label: "Jul", values: [1040], sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r8",  label: "Aug", values: [850],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r9",  label: "Sep", values: [790],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r10", label: "Oct", values: [820],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r11", label: "Nov", values: [860],  sourceInsightId: "ins-revenue-monthly" },
      { id: "ins-revenue-monthly-r12", label: "Dec", values: [930],  sourceInsightId: "ins-revenue-monthly" },
    ],
    wide: true,
  },
  {
    id: "ds-seed-02",
    serial: 2,
    title: "Conversion by channel",
    chartType: "Treemap",
    columns: ["Rate (%)"],
    /* Rows pre-computed from ins-conversion-channel.
       Treemap layout lets size encode conversion rate at a glance. */
    rows: [
      { id: "ins-conversion-channel-r1", label: "Email",   values: [6.2], sourceInsightId: "ins-conversion-channel" },
      { id: "ins-conversion-channel-r2", label: "Organic", values: [4.8], sourceInsightId: "ins-conversion-channel" },
      { id: "ins-conversion-channel-r3", label: "Direct",  values: [3.4], sourceInsightId: "ins-conversion-channel" },
      { id: "ins-conversion-channel-r4", label: "Paid",    values: [2.9], sourceInsightId: "ins-conversion-channel" },
    ],
    wide: false,
  },
  {
    id: "ds-seed-03",
    serial: 3,
    title: "Metric correlation matrix",
    chartType: "Heatmap",
    columns: ["Revenue", "Conv.", "Churn", "MRR", "Retention", "NPS"],
    /* Rows pre-computed from ins-metric-correlation. */
    rows: [
      { id: "ins-metric-correlation-r1", label: "Revenue",   values: [1.00,  0.64, -0.71,  0.92,  0.78,  0.55], sourceInsightId: "ins-metric-correlation" },
      { id: "ins-metric-correlation-r2", label: "Conv.",     values: [0.64,  1.00, -0.58,  0.61,  0.63,  0.47], sourceInsightId: "ins-metric-correlation" },
      { id: "ins-metric-correlation-r3", label: "Churn",     values: [-0.71, -0.58,  1.00, -0.68, -0.82, -0.74], sourceInsightId: "ins-metric-correlation" },
      { id: "ins-metric-correlation-r4", label: "MRR",       values: [0.92,  0.61, -0.68,  1.00,  0.71,  0.52], sourceInsightId: "ins-metric-correlation" },
      { id: "ins-metric-correlation-r5", label: "Retention", values: [0.78,  0.63, -0.82,  0.71,  1.00,  0.69], sourceInsightId: "ins-metric-correlation" },
      { id: "ins-metric-correlation-r6", label: "NPS",       values: [0.55,  0.47, -0.74,  0.52,  0.69,  1.00], sourceInsightId: "ins-metric-correlation" },
    ],
    wide: true,
  },
  {
    id: "ds-seed-04",
    serial: 4,
    title: "Q3 Churn Narrative",
    chartType: "Bar",
    columns: [],
    /* No chart rows — this dataset exists solely to back a Quote archetype slide.
       The narrative text lives on the Slide, not here. */
    rows: [],
    wide: false,
  },
];

/* ── Connections — two pre-seeded edges from the AI agent grouping ───────── */
export const INITIAL_CONNECTIONS: Connection[] = [
  {
    id: "c-ins-revenue-monthly->ds-seed-01",
    fromInsightId: "ins-revenue-monthly",
    toDataSetId:   "ds-seed-01",
  },
  {
    id: "c-ins-conversion-channel->ds-seed-02",
    fromInsightId: "ins-conversion-channel",
    toDataSetId:   "ds-seed-02",
  },
  {
    id: "c-ins-metric-correlation->ds-seed-03",
    fromInsightId: "ins-metric-correlation",
    toDataSetId:   "ds-seed-03",
  },
  {
    id: "c-ins-q3-narrative->ds-seed-01",
    fromInsightId: "ins-q3-narrative",
    toDataSetId:   "ds-seed-01",
  },
  {
    id: "c-ins-q3-narrative->ds-seed-04",
    fromInsightId: "ins-q3-narrative",
    toDataSetId:   "ds-seed-04",
  },
];

/* ── Slides — three, matching the existing presentation defaults ───────── */
const SLIDE_DEFAULTS = {
  archetype: "Chart" as SlideArchetype,
  status: "Paid",
  aggregation: "Monthly" as const,
  colorBy: "Segment",
  filter: "All data",
  colorAccent: "Navy" as const,
};

/* ── Slides — two slides, one per AI-seeded dataset ─────────────────────── */
export const INITIAL_SLIDES: Slide[] = [
  { id: "slide-seed-01", serial: 1, dataSetIds: ["ds-seed-01"], narrative: "", ...SLIDE_DEFAULTS },
  { id: "slide-seed-02", serial: 2, dataSetIds: ["ds-seed-02"], narrative: "", ...SLIDE_DEFAULTS },
  { id: "slide-seed-03", serial: 3, dataSetIds: ["ds-seed-03"], narrative: "", ...SLIDE_DEFAULTS },
  {
    id: "slide-seed-04", serial: 4, dataSetIds: ["ds-seed-04"],
    narrative:
      "Mid-market accounts drove 71% of Q3 churn. Two clusters: long-tenure customers " +
      "downgrading to lower SKUs, and 90-day actives lapsing after onboarding gaps. " +
      "Conversion held above goal everywhere except Paid.",
    ...SLIDE_DEFAULTS,
    archetype: "Quote" as SlideArchetype,
  },
];
