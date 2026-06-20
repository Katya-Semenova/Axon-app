import type { RawCell } from "@/lib/file-parsing";

/** Тип колонки, выведенный из её значений. Измерения: date/category. Метрика: number. */
export type ColumnType = "number" | "date" | "category" | "text";

export interface ColumnProfile {
  index: number;
  name: string;
  type: ColumnType;
  /** Уникальных непустых значений (мощность измерения). */
  distinct: number;
  /** Непустых ячеек в колонке. */
  nonNull: number;
}

/** Доля значений, при которой колонка считается числовой/датой. */
const TYPE_THRESHOLD = 0.8;
/** Потолок мощности, ниже которого строковая колонка — категория, выше — текст. */
const CATEGORY_MAX_DISTINCT = 50;

const DATE_RE =
  /^\d{4}[-/.]\d{1,2}([-/.]\d{1,2})?$|^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/;

/**
 * Число из ячейки: учитывает `%`, пробелы как разделители тысяч и запятую.
 * `"1 234,5"` → 1234.5, `"6.2%"` → 6.2, `"-0.71"` → -0.71. Иначе — null.
 */
export function parseNumeric(cell: RawCell): number | null {
  if (cell === null || typeof cell === "boolean") return null;
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;

  let s = cell.trim();
  if (!s) return null;
  s = s.replace(/\s/g, "").replace(/%$/, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Десятичный разделитель — тот, что стоит ПОСЛЕДНИМ; другой = разделитель тысяч.
    // US "1,234.5" → точка десятичная; EU "1.234,5" → запятая десятичная.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    s = s.replace(",", "."); // одиночная запятая = десятичная
  }

  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isDateCell(cell: RawCell): boolean {
  return typeof cell === "string" && DATE_RE.test(cell.trim());
}

/** Профилировать одну колонку по её ячейкам. */
export function profileColumn(index: number, name: string, cells: RawCell[]): ColumnProfile {
  const nonNullCells = cells.filter((c): c is Exclude<RawCell, null> => c !== null);
  const nonNull = nonNullCells.length;
  const distinct = new Set(nonNullCells.map((c) => String(c))).size;

  let type: ColumnType = "text";
  if (nonNull > 0) {
    const numCount = nonNullCells.filter((c) => parseNumeric(c) !== null).length;
    const dateCount = nonNullCells.filter(isDateCell).length;
    if (numCount / nonNull >= TYPE_THRESHOLD) type = "number";
    else if (dateCount / nonNull >= TYPE_THRESHOLD) type = "date";
    else if (distinct <= CATEGORY_MAX_DISTINCT) type = "category";
  }
  return { index, name, type, distinct, nonNull };
}

/** Профилировать все колонки таблицы. */
export function profileTable(headers: string[], rows: RawCell[][]): ColumnProfile[] {
  return headers.map((name, i) =>
    profileColumn(i, name, rows.map((r) => r[i] ?? null)),
  );
}
