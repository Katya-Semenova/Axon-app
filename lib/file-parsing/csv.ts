import Papa from "papaparse";
import type { ParsedTable, RawCell } from "./types";
import { FileParseError } from "./types";

/**
 * Разбор CSV/TSV через papaparse. Читаем файл как текст и парсим строку
 * синхронно — так контролируем кавычки, разделитель и пустые строки.
 * Разделитель определяется автоматически (запятая / таб / точка-с-запятой).
 *
 * Кодировка: читаем как UTF-8 (поддерживается BOM). Windows-1251 (частые
 * русские выгрузки) пока не детектируем — известное ограничение v1 (см. spec.md).
 */
export async function parseCsv(file: File, rowCap: number): Promise<ParsedTable> {
  const text = await file.text();
  if (!text.trim()) throw new FileParseError("empty", "CSV пустой");

  const result = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: "greedy",
    dynamicTyping: false, // типизацию делает движок; парсер отдаёт строки как есть
    preview: rowCap + 1, // заголовок + rowCap строк — не токенизируем весь файл (защита от зависания)
  });

  const matrix = result.data;
  if (!matrix.length) throw new FileParseError("empty", "В CSV нет строк");

  const headers = (matrix[0] ?? []).map(
    (h, i) => String(h ?? "").trim() || `Колонка ${i + 1}`,
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

/** Приводим строку к длине заголовков: лишнее режем, недостающее → null. */
function normalizeRow(raw: string[], width: number): RawCell[] {
  const out: RawCell[] = [];
  for (let i = 0; i < width; i++) {
    const v = raw[i];
    out.push(v === undefined || v === "" ? null : v);
  }
  return out;
}
