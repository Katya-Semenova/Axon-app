import type { ParsedTable } from "./types";
import { FileParseError } from "./types";
import { parseCsv } from "./csv";
import { parseXlsx } from "./xlsx";

export type { ParsedTable, RawCell, ParseErrorCode } from "./types";
export { FileParseError } from "./types";

/** Лимит размера файла — синхронно со spec.md EC-1. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 МБ
/** Кап строк данных для графиков — защита от зависания вкладки. */
export const MAX_DATA_ROWS = 5000;

/** Расширения с полным разбором (CSV/Excel). Остальное — beta-путь, не здесь. */
const FULL_PARSE_EXT = new Set(["csv", "tsv", "xlsx"]);

function extOf(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

/** Полный разбор доступен для этого файла? (CSV/Excel) */
export function isFullParseSupported(file: File): boolean {
  return FULL_PARSE_EXT.has(extOf(file.name));
}

/**
 * Разбор пользовательского файла в таблицу. Только CSV/Excel — полный разбор.
 * Бросает `FileParseError` с кодом причины (для красной рамки dropzone, EC-1).
 */
export async function parseFile(file: File): Promise<ParsedTable> {
  if (file.size > MAX_FILE_BYTES) {
    throw new FileParseError("too-big", "Файл больше 50 МБ");
  }
  const ext = extOf(file.name);
  switch (ext) {
    case "csv":
    case "tsv":
      return parseCsv(file, MAX_DATA_ROWS);
    case "xlsx":
      return parseXlsx(file, MAX_DATA_ROWS);
    case "xls":
      throw new FileParseError(
        "unsupported",
        "Старый формат .xls не поддерживается — сохраните как .xlsx",
      );
    default:
      throw new FileParseError(
        "unsupported",
        `Формат .${ext} не поддерживается для полного разбора`,
      );
  }
}
