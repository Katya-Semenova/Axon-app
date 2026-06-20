/**
 * Minimal Insight type — trimmed mirror of the Axon product's `lib/types.ts`,
 * carrying only the fields the vendored InsightCard reads. Kept local so the
 * landing doesn't pull the full product type graph.
 */

export type DataRow = { id?: string; label?: string; [k: string]: string | number | undefined };
export type InsightKind = "data" | "text" | "sql" | "code";

export interface Insight {
  id: string;
  serial: number;
  title: string;
  kind: InsightKind;
  data?: { columns: string[]; rows: DataRow[]; chartType?: string };
  text?: string;
  sql?: string;
  code?: { language: string; source: string };
  confFilled: number;
  confPct: number;
}
