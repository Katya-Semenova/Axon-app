/**
 * Sample content for the Live Prototype showcase — small, realistic Axon
 * insights (shapes mirror the product's INITIAL_INSIGHTS), plus the dataset /
 * slide specs the light replicas render.
 */
import type { Insight } from "./types";

export const SHOWCASE_INSIGHTS: Insight[] = [
  {
    id: "ins-eu",
    serial: 1,
    title: "EU mid-market drove Q3 lift",
    kind: "text",
    text: "Mid-market accounts in the EU contributed +12% of the Q3 revenue increase, outpacing every other segment.",
    confFilled: 5, confPct: 92,
  },
  {
    id: "ins-sql",
    serial: 2,
    title: "Revenue by region, FY",
    kind: "sql",
    sql: "SELECT region, SUM(mrr)\nFROM revenue\nWHERE date > '2024-01'\nGROUP BY region",
    confFilled: 4, confPct: 88,
  },
  {
    id: "ins-churn",
    serial: 3,
    title: "Churn by segment, quarterly",
    kind: "data",
    data: {
      columns: ["Q1", "Q2", "Q3"],
      chartType: "Stacked Bar",
      rows: [
        { id: "r1", label: "Mid-market", Q1: 38, Q2: 42, Q3: 31 },
        { id: "r2", label: "Enterprise", Q1: 27, Q2: 29, Q3: 23 },
        { id: "r3", label: "SMB", Q1: 19, Q2: 21, Q3: 17 },
        { id: "r4", label: "Freemium", Q1: 11, Q2: 13, Q3: 9 },
      ],
    },
    confFilled: 5, confPct: 96,
  },
];

/** Light dataset replica — a structured table the "Datasets" act renders. */
export const SHOWCASE_DATASET = {
  title: "Revenue & retention, FY",
  columns: ["Metric", "Q2", "Q3", "Δ"] as const,
  rows: [
    { metric: "Revenue", q2: "0.94M", q3: "1.04M", delta: "+11%", pos: true },
    { metric: "Churn", q2: "4.8%", q3: "3.9%", delta: "-0.9", pos: true },
    { metric: "CAC", q2: "$212", q3: "$208", delta: "stable", pos: false },
    { metric: "NPS", q2: "68", q3: "72", delta: "+4", pos: true },
    { metric: "MRR", q2: "78.2K", q3: "86.1K", delta: "+10%", pos: true },
  ],
};

/** Light slide replica spec — the "Slides" act renders this as a finished slide. */
export const SHOWCASE_SLIDE = {
  kicker: "Q3 REVIEW",
  title: "Mid-market led a record quarter",
  bullets: [
    "EU mid-market: +12% of the Q3 lift",
    "Churn down to 3.9%, a 4-quarter low",
    "MRR crossed $86K, +10% QoQ",
  ],
  bars: [0.52, 0.68, 0.82, 0.61, 0.9] as const,
};
