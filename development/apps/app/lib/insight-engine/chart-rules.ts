import type { ChartType } from "@/lib/types";
import type { RawCell } from "@/lib/file-parsing";
import type { ColumnType } from "./column-types";

/**
 * Тип графика по форме данных — правила брифа, без ИИ
 * (docs/briefs/csv-excel-parsing.md → «Движок инсайтов»).
 *
 * Приоритет — самый яркий из СОВМЕСТИМЫХ с формой типов (бэклог «приоритет типов»):
 * Treemap → Radar → Lollipop → Heatmap → … → Stacked Bar → Spline Area (последним).
 * Donut — только при явной доле-от-целого (см. `metricIsAdditive`), иначе врёт о долях.
 *
 * @param dimType         тип измерения (оси): "date" или "category"
 * @param dimCard         число категорий/точек по оси
 * @param metricCount     сколько числовых метрик участвует
 * @param metricIsAdditive одна метрика — складываемая величина (деньги/штуки)?
 *                         только тогда Donut честен; ставки/проценты → не Donut
 */
export function pickChartType(
  dimType: ColumnType,
  dimCard: number,
  metricCount: number,
  metricIsAdditive = false,
): ChartType {
  if (dimType === "date") return "Spline Area";          // дата + число → честный временной ряд
  if (metricCount >= 2) return "Stacked Bar";            // категория + несколько метрик — законный дом Stacked Bar

  // Категория + одно число — самый яркий совместимый тип по числу категорий.
  if (metricIsAdditive && dimCard >= 3 && dimCard <= 6) return "Donut";  // складываемая величина → доля-от-целого
  if (!metricIsAdditive && dimCard >= 3 && dimCard <= 8) return "Radar"; // ставка/% → «звезда» без вранья о долях
  if (dimCard <= 14) return "Treemap";                   // универсально — площади
  return "Lollipop";                                     // много категорий → рейтинг
}

/**
 * Похоже ли одно число на ставку/процент/долю (тогда Donut «доля-от-целого» врёт).
 * Смотрим имя колонки и наличие «%» в самих ячейках — этого достаточно, чтобы
 * не подсунуть бублик на проценты конверсии (наш старый баг «918000%»).
 */
export function metricLooksShare(name: string, cells: RawCell[]): boolean {
  if (/%|percent|\brate\b|ratio|share|ставк|доля|процент|конверс|\bconv/i.test(name)) return true;
  const nonNull = cells.filter((c) => c !== null);
  if (nonNull.length === 0) return false;
  const pct = nonNull.filter((c) => typeof c === "string" && c.includes("%")).length;
  return pct / nonNull.length >= 0.5;
}

/** Тип графика для таблицы без измерений (все колонки числовые). */
export function pickNumericMatrixChart(metricCount: number): ChartType {
  if (metricCount >= 3) return "Heatmap";                // матрица чисел
  if (metricCount === 2) return "Scatter";               // две числовые
  return "Lollipop";                                     // одна числовая → рейтинг по строкам
}

/** Широкая карточка на холсте — для «крупных» типов графиков (как в сидах). */
export function isWideChart(type: ChartType): boolean {
  return (
    type === "Heatmap" ||
    type === "Stacked Bar" ||
    type === "Treemap" ||
    type === "Spline Area" ||
    type === "Map"
  );
}
