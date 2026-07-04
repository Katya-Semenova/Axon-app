/**
 * Интеграционные тесты разбора файла (сценарий 5 из docs/test-cases.md, часть «файл разбирается»).
 * Black-box по границе модуля: File → ParsedTable. Включая регрессии код-ревью Урока 4:
 * честное усечение CSV (truncatedRows) и коды ошибок EC-1.
 */
import { describe, it, expect } from "vitest";
import { parseFile, FileParseError, MAX_DATA_ROWS } from "@/lib/file-parsing";
import { parseCsv } from "@/lib/file-parsing/csv";

function csvFile(content: string, name = "data.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("parseCsv — базовый разбор", () => {
  it("разбирает заголовки и строки, пустых усечений нет", async () => {
    const t = await parseCsv(csvFile("Месяц,Выручка\nЯнв,100\nФев,200\n"), 5000);
    expect(t.headers).toEqual(["Месяц", "Выручка"]);
    expect(t.rows).toEqual([["Янв", "100"], ["Фев", "200"]]);
    expect(t.truncatedRows).toBe(0);
    expect(t.sourceName).toBe("data.csv");
  });

  it("пустой заголовок → «Колонка N»", async () => {
    const t = await parseCsv(csvFile(",Выручка\nЯнв,100\n"), 5000);
    expect(t.headers[0]).toBe("Колонка 1");
  });

  it("короткая строка дополняется null до ширины заголовков", async () => {
    const t = await parseCsv(csvFile("A,B,C\n1,2\n"), 5000);
    expect(t.rows[0]).toEqual(["1", "2", null]);
  });

  it("автоопределение разделителя: точка с запятой", async () => {
    const t = await parseCsv(csvFile("Месяц;Выручка\nЯнв;100\n"), 5000);
    expect(t.headers).toEqual(["Месяц", "Выручка"]);
    expect(t.rows[0]).toEqual(["Янв", "100"]);
  });

  it("РЕГРЕССИЯ (ревью Урока 4): усечение считается честно — truncatedRows > 0", async () => {
    const body = Array.from({ length: 10 }, (_, i) => `r${i},${i}`).join("\n");
    const t = await parseCsv(csvFile(`Имя,Число\n${body}\n`), 7);
    expect(t.rows).toHaveLength(7);
    expect(t.truncatedRows).toBe(3); // раньше при preview-обрезке всегда выходил 0
  });

  it("пустой файл → FileParseError с кодом empty", async () => {
    await expect(parseCsv(csvFile("   \n  "), 5000)).rejects.toMatchObject({ code: "empty" });
  });
});

describe("parseFile — маршрутизация и лимиты (EC-1)", () => {
  it("неподдерживаемое расширение → код unsupported", async () => {
    await expect(parseFile(csvFile("a,b\n1,2", "data.parquet"))).rejects.toMatchObject({
      code: "unsupported",
    });
  });

  it("старый .xls → unsupported с подсказкой про .xlsx", async () => {
    const err = await parseFile(csvFile("x", "old.xls")).catch((e) => e);
    expect(err).toBeInstanceOf(FileParseError);
    expect(err.code).toBe("unsupported");
    expect(err.message).toContain(".xlsx");
  });

  it("кап строк для графиков = 5000 (защита вкладки от зависания)", () => {
    expect(MAX_DATA_ROWS).toBe(5000);
  });
});
