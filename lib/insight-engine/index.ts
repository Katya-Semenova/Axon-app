/**
 * Движок инсайтов (Шаг 10) — сменный разъём `ParsedTable → BoardData`.
 *
 * По правилам, без ИИ: профилирует колонки, выбирает тип графика по форме
 * данных, рождает Insight-карточки, собирает из них DataSet-узлы + связи и
 * пару Chart-слайдов. Выдаёт `BoardData` той же формы, что и initialBoardData()
 * в lib/store.ts — холст грузит результат через store.hydrate().
 *
 * Позже сюда встанет ИИ (GigaChat / OpenRouter), не трогая ни разбор файла,
 * ни холст — граница проходит ровно по сигнатуре buildBoardData().
 */
import type {
  BoardData, Insight, DataSet, Slide, Connection, DataRow,
  ChartType, WorkspaceSnapshot, SlideArchetype,
} from "@/lib/types";
import type { ParsedTable, RawCell } from "@/lib/file-parsing";
import { profileTable, parseNumeric, type ColumnProfile } from "./column-types";
import { pickChartType, pickNumericMatrixChart, isWideChart } from "./chart-rules";
import { layoutPositions } from "./layout";

/* Капы — держим доску читаемой, а вкладку — отзывчивой. */
const MAX_INSIGHTS = 5;
const MAX_SLIDES = 4;
const TOP_CATEGORIES = 20;
const MAX_SERIES_POINTS = 60;

const CANVAS_TRANSFORM = { x: 20, y: 20, zoom: 0.75 };

/* Дефолты слайда — зеркалят SLIDE_DEFAULTS из lib/mockData.ts (status → "All",
   т.к. это произвольные данные, а не демо про каналы). */
const SLIDE_DEFAULTS = {
  archetype:   "Chart" as SlideArchetype,
  status:      "All",
  aggregation: "Monthly" as const,
  colorBy:     "Segment",
  filter:      "All data",
  colorAccent: "Navy" as const,
  visualStyle: "Modern" as const,
  showLabels:  true,
  showGrid:    true,
  stackedBars: false,
};

/* ── Точка входа ───────────────────────────────────────────────────────── */

export function buildBoardData(table: ParsedTable): BoardData {
  // Заголовки → имена колонок/титулы: нейтрализуем формульные инъекции (=, +, @).
  const headers = table.headers.map(neutralizeFormula);
  const profiles = profileTable(headers, table.rows);
  const metrics = profiles.filter((p) => p.type === "number");
  const dims = profiles.filter((p) => p.type === "date" || p.type === "category");

  // EC-2: чисел нет → текстовое резюме + подсказка, не пустой тупик.
  if (metrics.length === 0) {
    return { ...assemble([buildSummaryInsight(table, profiles)], [], [], []), sourceFiles: [table.sourceName] };
  }

  const insights = planInsights(table, metrics, dims).slice(0, MAX_INSIGHTS);

  // Дата-сет + связь на каждый data-инсайт.
  const dataSets: DataSet[] = [];
  const connections: Connection[] = [];
  insights.forEach((ins, i) => {
    if (ins.kind !== "data" || !ins.data) return;
    const ds = dataSetFromInsight(ins, dataSets.length + 1);
    dataSets.push(ds);
    connections.push({ id: `c-up-${i + 1}`, fromInsightId: ins.id, toDataSetId: ds.id });
  });

  // Chart-слайды — по одному на дата-сет, до MAX_SLIDES.
  const slides: Slide[] = dataSets.slice(0, MAX_SLIDES).map((ds, i) => ({
    id: `slide-up-${i + 1}`,
    serial: i + 1,
    dataSetIds: [ds.id],
    narrative: "",
    ...SLIDE_DEFAULTS,
  }));

  return { ...assemble(insights, dataSets, connections, slides), sourceFiles: [table.sourceName] };
}

/* ── Планирование инсайтов по форме данных ─────────────────────────────── */

function planInsights(
  table: ParsedTable,
  metrics: ColumnProfile[],
  dims: ColumnProfile[],
): Insight[] {
  const out: Insight[] = [];
  let serial = 1;

  const primaryDim = pickPrimaryDim(dims);

  // Нет измерений — таблица из одних чисел.
  if (!primaryDim) {
    const chart = pickNumericMatrixChart(metrics.length);
    if (chart === "Scatter") out.push(scatterInsight(table, metrics[0], metrics[1], serial++));
    else if (chart === "Heatmap") out.push(numericMatrixInsight(table, metrics, serial++));
    else out.push(indexSeriesInsight(table, metrics[0], serial++));
    return out;
  }

  // Категория + несколько метрик → сводный Stacked Bar первым.
  if (primaryDim.type === "category" && metrics.length >= 2) {
    out.push(multiMetricByCategory(table, primaryDim, metrics, serial++));
  }

  // По одному инсайту на метрику.
  for (const metric of metrics) {
    if (out.length >= MAX_INSIGHTS) break;
    out.push(singleMetricByDim(table, primaryDim, metric, serial++));
  }

  return out;
}

/** Лучшее измерение: дата важнее категории; среди категорий — с наименьшей мощностью (≥2). */
function pickPrimaryDim(dims: ColumnProfile[]): ColumnProfile | null {
  const date = dims.find((d) => d.type === "date");
  if (date) return date;
  const cats = dims.filter((d) => d.type === "category" && d.distinct >= 2);
  if (!cats.length) return dims[0] ?? null;
  return cats.reduce((best, d) => (d.distinct < best.distinct ? d : best));
}

/* ── Построители инсайтов ──────────────────────────────────────────────── */

function singleMetricByDim(
  table: ParsedTable, dim: ColumnProfile, metric: ColumnProfile, serial: number,
): Insight {
  const ratio = metric.nonNull / Math.max(1, table.rows.length);

  if (dim.type === "date") {
    // Временной ряд, отсортированный по дате (файл может быть не упорядочен — иначе
    // Spline Area зигзагует). Сортируем ТОЛЬКО если все метки «год впереди» (ISO,
    // в т.ч. даты из xlsx); неоднозначные форматы (день/месяц впереди) не трогаем,
    // чтобы не перемешать уже верный порядок файла.
    const pts: { label: string; value: number }[] = [];
    for (const r of table.rows) {
      const v = parseNumeric(r[metric.index]);
      if (v !== null) pts.push({ label: cellLabel(r[dim.index]), value: r2(v) });
    }
    const keyed = pts.map((p) => ({ p, k: dateSortKey(p.label) }));
    if (keyed.every((x) => !Number.isNaN(x.k))) keyed.sort((a, b) => a.k - b.k);
    const rows = keyed.slice(0, MAX_SERIES_POINTS).map((x, i) => row(`r${i + 1}`, x.p.label, x.p.value));
    return dataInsight(serial, `${metric.name} · ${dim.name}`, "Spline Area", [metric.name], rows, ratio);
  }

  // Категория: сумма метрики по категории, топ-N.
  const agg = aggregateByCategory(table, dim, metric);
  const rows = agg.map((a, i) => row(`r${i + 1}`, a.label, r2(a.sum)));
  const chart = pickChartType("category", rows.length, 1);
  return dataInsight(serial, `${metric.name} · ${dim.name}`, chart, [metric.name], rows, ratio);
}

function multiMetricByCategory(
  table: ParsedTable, dim: ColumnProfile, metrics: ColumnProfile[], serial: number,
): Insight {
  const cols = metrics.map((m) => m.name);
  const byCat = new Map<string, number[]>();
  for (const r of table.rows) {
    const label = cellLabel(r[dim.index]);
    const acc = byCat.get(label) ?? metrics.map(() => 0);
    metrics.forEach((m, mi) => {
      const v = parseNumeric(r[m.index]);
      if (v !== null) acc[mi] += v;
    });
    byCat.set(label, acc);
  }
  const rows = [...byCat.entries()]
    .sort((a, b) => sum(b[1]) - sum(a[1]))
    .slice(0, TOP_CATEGORIES)
    .map(([label, vals], i) => ({ id: `r${i + 1}`, label, values: vals.map(r2) }));
  return dataInsight(serial, dim.name, "Stacked Bar", cols, rows, 1);
}

function scatterInsight(
  table: ParsedTable, mx: ColumnProfile, my: ColumnProfile, serial: number,
): Insight {
  const rows: DataRow[] = [];
  table.rows.forEach((r, i) => {
    const x = parseNumeric(r[mx.index]);
    const y = parseNumeric(r[my.index]);
    if (x === null || y === null) return;
    if (rows.length >= MAX_SERIES_POINTS) return;
    rows.push({ id: `r${rows.length + 1}`, label: `#${i + 1}`, values: [r2(x), r2(y)] });
  });
  return dataInsight(serial, `${mx.name} × ${my.name}`, "Scatter", [mx.name, my.name], rows, 1);
}

function numericMatrixInsight(table: ParsedTable, metrics: ColumnProfile[], serial: number): Insight {
  const cols = metrics.map((m) => m.name);
  const rows: DataRow[] = table.rows.slice(0, TOP_CATEGORIES).map((r, i) => ({
    id: `r${i + 1}`,
    label: `#${i + 1}`,
    values: metrics.map((m) => r2(parseNumeric(r[m.index]) ?? 0)),
  }));
  return dataInsight(serial, cols.slice(0, 3).join(" · "), "Heatmap", cols, rows, 1);
}

function indexSeriesInsight(table: ParsedTable, metric: ColumnProfile, serial: number): Insight {
  const rows: DataRow[] = [];
  table.rows.forEach((r, i) => {
    const v = parseNumeric(r[metric.index]);
    if (v === null) return;
    if (rows.length >= TOP_CATEGORIES) return;
    rows.push(row(`r${rows.length + 1}`, `#${i + 1}`, r2(v)));
  });
  return dataInsight(serial, metric.name, "Lollipop", [metric.name], rows, 1);
}

function buildSummaryInsight(table: ParsedTable, profiles: ColumnProfile[]): Insight {
  const colList = profiles.map((p) => p.name).join(", ");
  const text =
    `Файл «${table.sourceName}»: ${table.rows.length} строк, ${table.headers.length} колонок ` +
    `(${colList}). Числовых колонок не найдено — графики не построены автоматически. ` +
    `Опишите в чате, что показать, или добавьте инсайт вручную.`;
  return { id: "ins-up-1", serial: 1, title: "Сводка по файлу", kind: "text", text, confFilled: 2, confPct: 60 };
}

/* ── Дата-сет из инсайта ───────────────────────────────────────────────── */

function dataSetFromInsight(ins: Insight, serial: number): DataSet {
  const data = ins.data!;
  const rows: DataRow[] = data.rows.map((r) => ({
    id: `${ins.id}-${r.id}`,
    label: r.label,
    values: r.values,
    sourceInsightId: ins.id,
  }));
  return {
    id: `ds-up-${serial}`,
    serial,
    title: ins.title,
    chartType: data.chartType,
    columns: data.columns,
    rows,
    wide: isWideChart(data.chartType),
  };
}

/* ── Сборка BoardData ──────────────────────────────────────────────────── */

function assemble(
  insights: Insight[], dataSets: DataSet[], connections: Connection[], slides: Slide[],
): BoardData {
  const snapshot: WorkspaceSnapshot = {
    insightsById: byId(insights),
    dataSetsById: byId(dataSets),
    slidesById:   byId(slides),
    insightOrder: insights.map((i) => i.id),
    dataSetOrder: dataSets.map((d) => d.id),
    slideOrder:   slides.map((s) => s.id),
    connections,
  };
  return {
    snapshot,
    nodePositions:       layoutPositions(insights.map((i) => i.id), dataSets.map((d) => d.id)),
    canvasTransform:     CANVAS_TRANSFORM,
    presentationThemeId: "editorial",
  };
}

/* ── Мелкие помощники ──────────────────────────────────────────────────── */

function dataInsight(
  serial: number, title: string, chartType: ChartType,
  columns: string[], rows: DataRow[], ratio: number,
): Insight {
  return {
    id: `ins-up-${serial}`,
    serial,
    title,
    kind: "data",
    data: { columns, chartType, rows },
    ...confidence(ratio),
  };
}

function aggregateByCategory(table: ParsedTable, dim: ColumnProfile, metric: ColumnProfile) {
  const sums = new Map<string, number>();
  for (const r of table.rows) {
    const v = parseNumeric(r[metric.index]);
    if (v === null) continue;
    const label = cellLabel(r[dim.index]);
    sums.set(label, (sums.get(label) ?? 0) + v);
  }
  return [...sums.entries()]
    .map(([label, total]) => ({ label, sum: total }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, TOP_CATEGORIES);
}

function confidence(ratio: number): { confFilled: number; confPct: number } {
  const confPct = Math.max(60, Math.min(98, Math.round(ratio * 100)));
  const confFilled = Math.max(1, Math.min(5, Math.round(confPct / 20)));
  return { confFilled, confPct };
}

/** Нейтрализация формульных инъекций: ведущие = + @ экранируем апострофом. */
function neutralizeFormula(s: string): string {
  const t = s.trim();
  return /^[=+@]/.test(t) ? `'${t}` : t;
}

/** Метка из ячейки (с нейтрализацией формул); пустое → «—». */
function cellLabel(cell: RawCell): string {
  if (cell === null) return "—";
  return neutralizeFormula(String(cell)) || "—";
}

/** Сортировочный ключ ISO-подобной даты «год впереди» (2024-12-31, 2024/12, 2024.12.31):
    число YYYYMMDD. NaN, если формат не «год впереди» — тогда ряд остаётся в порядке
    файла (не рискуем перемешать неоднозначные день/месяц-первые форматы). */
function dateSortKey(label: string): number {
  const m = /^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?$/.exec(label.trim());
  if (!m) return NaN;
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3] ?? "1");
}

function row(id: string, label: string, ...values: number[]): DataRow {
  return { id, label, values };
}

function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const it of items) out[it.id] = it;
  return out;
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}
