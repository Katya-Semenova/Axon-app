/**
 * Контракт слоя разбора файла (Шаг 10).
 *
 * Парсинг — «тупой» декод формата в таблицу: заголовки + сырые ячейки.
 * Определение типов колонок и логика инсайтов живут дальше, в `lib/insight-engine`,
 * чтобы разъём `parsedTable → BoardData` оставался сменным — позже сюда встанет ИИ,
 * не трогая ни разбор файла, ни холст (см. docs/briefs/csv-excel-parsing.md).
 */

/** Сырое значение ячейки после декодирования формата (до типизации движком). */
export type RawCell = string | number | boolean | null;

/** Результат разбора файла: заголовки + строки данных (без строки заголовка). */
export interface ParsedTable {
  /** Имена колонок из первой строки файла (пустые → «Колонка N»). */
  headers: string[];
  /** Строки данных, каждая нормализована до длины `headers.length`. */
  rows: RawCell[][];
  /** Имя исходного файла — для заголовка доски/проекта. */
  sourceName: string;
  /** Сколько строк отброшено капом строк (0 — ничего не урезано). */
  truncatedRows: number;
}

/** Код ошибки разбора — UI маппит его в понятное локализованное сообщение (EC-1). */
export type ParseErrorCode =
  | "too-big"      // превышен лимит размера файла
  | "empty"        // файл пустой или нет строк данных
  | "unsupported"  // расширение не поддерживается для полного разбора
  | "corrupt"      // битый / запароленный / не читается
  | "no-columns";  // не удалось выделить заголовки

/** Ошибка разбора с машинным кодом причины (для красной рамки dropzone). */
export class FileParseError extends Error {
  code: ParseErrorCode;
  constructor(code: ParseErrorCode, message: string) {
    super(message);
    this.name = "FileParseError";
    this.code = code;
  }
}
