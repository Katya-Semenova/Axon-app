import { readSheet } from "read-excel-file/browser";
import type { ParsedTable, RawCell } from "./types";
import { FileParseError } from "./types";

/** Ячейки, как их отдаёт read-excel-file (Date — для дат). */
type XlsxCell = string | number | boolean | Date | null;

/**
 * Разбор .xlsx через read-excel-file (браузерная сборка). Берём первый лист.
 * Старый .xls (Excel ≤2003) и .ods библиотека не читает — это отсекается в
 * dispatch (`index.ts`) до вызова сюда; здесь любой сбой чтения → "corrupt".
 */
export async function parseXlsx(file: File, rowCap: number): Promise<ParsedTable> {
  let matrix: XlsxCell[][];
  try {
    // readSheet типизирован через хитрый CellValue; берём матрицу как есть.
    matrix = (await readSheet(file)) as unknown as XlsxCell[][];
  } catch {
    throw new FileParseError("corrupt", "Не удалось прочитать Excel-файл");
  }

  if (!matrix.length) throw new FileParseError("empty", "В книге нет строк");

  const headers = (matrix[0] ?? []).map(
    (h, i) => cellToText(h).trim() || `Колонка ${i + 1}`,
  );
  if (!headers.length) throw new FileParseError("no-columns", "Не удалось выделить заголовки");

  const dataRows = matrix.slice(1);
  const capped = dataRows.slice(0, rowCap);

  return {
    headers,
    rows: capped.map((r) => normalizeRow(r, headers.length)),
    sourceName: file.name,
    truncatedRows: Math.max(0, dataRows.length - capped.length),
  };
}

/** Приводим строку к длине заголовков и нормализуем каждую ячейку. */
function normalizeRow(raw: XlsxCell[], width: number): RawCell[] {
  const out: RawCell[] = [];
  for (let i = 0; i < width; i++) out.push(toRawCell(raw[i]));
  return out;
}

function toRawCell(v: XlsxCell | undefined): RawCell {
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) return isoDate(v); // дату → текст YYYY-MM-DD
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "string") return v;
  return String(v);
}

function cellToText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return isoDate(v);
  return String(v);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
