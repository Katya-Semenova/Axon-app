/**
 * Интеграционные тесты движка инсайтов (сценарий 5 из docs/test-cases.md,
 * часть «на холсте появляются инсайты и дата-сеты»). Black-box по границе
 * разъёма ParsedTable → BoardData (ADR-011: тесты не лезут во внутренности холста).
 * Включая регрессии код-ревью Урока 4: европейские числа и сортировка временного ряда.
 */
import { describe, it, expect } from "vitest";
import type { ParsedTable } from "@/lib/file-parsing";
import { buildBoardData } from "@/lib/insight-engine";
import { parseNumeric, profileColumn } from "@/lib/insight-engine/column-types";
import { pickChartType, metricLooksShare } from "@/lib/insight-engine/chart-rules";

function table(headers: string[], rows: (string | number | null)[][]): ParsedTable {
  return { headers, rows, sourceName: "test.csv", truncatedRows: 0 };
}

/* ── parseNumeric — РЕГРЕССИЯ «европейские числа» (ревью Урока 4) ────────── */

describe("parseNumeric — форматы чисел", () => {
  it("US-формат: «1,234.5» → 1234.5", () => {
    expect(parseNumeric("1,234.5")).toBe(1234.5);
  });
  it("ЕВРО-формат: «1.234,5» → 1234.5 (регрессия ревью)", () => {
    expect(parseNumeric("1.234,5")).toBe(1234.5);
  });
  it("пробелы-тысячи + запятая-десятичная: «1 234,5» → 1234.5", () => {
    expect(parseNumeric("1 234,5")).toBe(1234.5);
  });
  it("процент: «6.2%» → 6.2; отрицательное: «-0.71» → -0.71", () => {
    expect(parseNumeric("6.2%")).toBe(6.2);
    expect(parseNumeric("-0.71")).toBe(-0.71);
  });
  it("мусор и пустота → null", () => {
    expect(parseNumeric("abc")).toBeNull();
    expect(parseNumeric("")).toBeNull();
    expect(parseNumeric(null)).toBeNull();
    expect(parseNumeric(true)).toBeNull();
  });
});

/* ── Определение типов колонок ───────────────────────────────────────────── */

describe("profileColumn — типизация", () => {
  it("≥80% чисел → number (одна мусорная ячейка не ломает)", () => {
    const p = profileColumn(0, "Выручка", ["100", "200", "300", "400", "n/a"]);
    expect(p.type).toBe("number");
  });
  it("даты ISO → date", () => {
    const p = profileColumn(0, "Дата", ["2024-01-01", "2024-02-01", "2024-03-01"]);
    expect(p.type).toBe("date");
  });
  it("немного уникальных строк → category", () => {
    const p = profileColumn(0, "Канал", ["Organic", "Paid", "Organic", "Email"]);
    expect(p.type).toBe("category");
    expect(p.distinct).toBe(3);
  });
});

/* ── Выбор типа графика ──────────────────────────────────────────────────── */

describe("pickChartType — правила формы данных", () => {
  it("дата → Spline Area (временной ряд)", () => {
    expect(pickChartType("date", 12, 1)).toBe("Spline Area");
  });
  it("категория + несколько метрик → Stacked Bar", () => {
    expect(pickChartType("category", 5, 3)).toBe("Stacked Bar");
  });
  it("складываемая метрика, 3–6 категорий → Donut; ставка/% → Radar (регрессия «918000%»)", () => {
    expect(pickChartType("category", 4, 1, true)).toBe("Donut");
    expect(pickChartType("category", 4, 1, false)).toBe("Radar");
  });
  it("много категорий → Treemap (≤14) или Lollipop (>14)", () => {
    expect(pickChartType("category", 12, 1, true)).toBe("Treemap");
    expect(pickChartType("category", 30, 1, true)).toBe("Lollipop");
  });
});

describe("metricLooksShare — ставка/процент не притворяется долей-от-целого", () => {
  it("по имени колонки: Conversion rate / Доля", () => {
    expect(metricLooksShare("Conversion rate", ["1", "2"])).toBe(true);
    expect(metricLooksShare("Доля рынка", ["1"])).toBe(true);
    expect(metricLooksShare("Revenue", ["100", "200"])).toBe(false);
  });
  it("по ячейкам: большинство с «%»", () => {
    expect(metricLooksShare("Metric", ["5%", "6%", "7"])).toBe(true);
  });
});

/* ── buildBoardData — сборка доски целиком ───────────────────────────────── */

describe("buildBoardData — ParsedTable → BoardData", () => {
  it("дата+метрика: Spline Area, числа посчитаны кодом, есть дата-сет+связь+слайд", () => {
    const b = buildBoardData(
      table(["Дата", "Выручка"], [
        ["2024-01-01", "100"],
        ["2024-02-01", "1.234,5"], // евро-формат протекает сквозь весь конвейер
        ["2024-03-01", "300"],
      ]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.kind).toBe("data");
    expect(ins.data!.chartType).toBe("Spline Area");
    expect(ins.data!.rows.map((r) => r.values[0])).toEqual([100, 1234.5, 300]);

    expect(b.snapshot.dataSetOrder).toHaveLength(1);
    expect(b.snapshot.connections).toHaveLength(1);
    expect(b.snapshot.slideOrder).toHaveLength(1);
    expect(b.sourceFiles).toEqual(["test.csv"]);
  });

  it("РЕГРЕССИЯ (ревью Урока 4): ISO-даты в разнобой → ряд сортируется по дате", () => {
    const b = buildBoardData(
      table(["Дата", "Продажи"], [
        ["2024-03-01", "3"],
        ["2024-01-01", "1"],
        ["2024-02-01", "2"],
      ]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.data!.rows.map((r) => r.label)).toEqual(["2024-01-01", "2024-02-01", "2024-03-01"]);
  });

  it("неоднозначные даты (день впереди) НЕ пересортировываются — порядок файла", () => {
    const b = buildBoardData(
      table(["Дата", "Продажи"], [
        ["03.01.2024", "3"],
        ["01.01.2024", "1"],
      ]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.data!.rows.map((r) => r.label)).toEqual(["03.01.2024", "01.01.2024"]);
  });

  it("категория+метрика: суммирование по категории и сортировка по убыванию", () => {
    const b = buildBoardData(
      table(["Канал", "Выручка"], [
        ["Organic", "100"], ["Paid", "300"], ["Organic", "50"], ["Email", "200"],
      ]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.data!.rows.map((r) => [r.label, r.values[0]])).toEqual([
      ["Paid", 300], ["Organic", 150], ["Email", 200],
    ].sort((a, b2) => (b2[1] as number) - (a[1] as number)));
  });

  it("EC-2: нет числовых колонок → текстовая «Сводка по файлу», без графиков", () => {
    const b = buildBoardData(
      table(["Имя", "Город"], [["Аня", "Москва"], ["Боря", "Питер"]]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.kind).toBe("text");
    expect(ins.text).toContain("Числовых колонок не найдено");
    expect(b.snapshot.dataSetOrder).toHaveLength(0);
  });

  it("БЕЗОПАСНОСТЬ: формульная инъекция в заголовке нейтрализуется апострофом", () => {
    const b = buildBoardData(
      table(["=SUM(A1:A9)", "Выручка"], [["x", "1"], ["y", "2"]]),
    );
    const ins = Object.values(b.snapshot.insightsById)[0];
    expect(ins.data!.rows.every((r) => !r.label.startsWith("="))).toBe(true);
  });
});
