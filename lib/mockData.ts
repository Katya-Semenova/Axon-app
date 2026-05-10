export type ChartType =
  | "Lollipop"
  | "Spline Area"
  | "Donut"
  | "Clean Columns"
  | "Stacked Bar"
  | "Waterfall"
  | "Scatter Plot"
  | "Treemap";

export const CHART_TYPES: ChartType[] = [
  "Lollipop",
  "Spline Area",
  "Donut",
  "Clean Columns",
  "Stacked Bar",
  "Waterfall",
  "Scatter Plot",
  "Treemap",
];

export interface DataRow {
  id: string;
  label: string;
  values: number[];
}

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
    chartType: "Clean Columns",
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
    targetType === "Scatter Plot" ? 2
    : targetType === "Stacked Bar" ? targetColumns.length
    : 1;

  return rows.map((r) => {
    if (r.values.length === needCount) return r;
    if (r.values.length > needCount) return { ...r, values: r.values.slice(0, needCount) };
    const padded = [...r.values];
    while (padded.length < needCount) padded.push(0);
    return { ...r, values: padded };
  });
}
