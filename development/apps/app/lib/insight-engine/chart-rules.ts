import type { ChartType } from "@/lib/types";
import type { ColumnType } from "./column-types";

/**
 * Тип графика по форме данных — правила брифа, без ИИ
 * (docs/briefs/csv-excel-parsing.md → «Движок инсайтов»).
 *
 * @param dimType     тип измерения (оси): "date" или "category"
 * @param dimCard     число категорий/точек по оси
 * @param metricCount сколько числовых метрик участвует
 */
export function pickChartType(
  dimType: ColumnType,
  dimCard: number,
  metricCount: number,
): ChartType {
  if (dimType === "date") return "Spline Area";          // дата + число → временной ряд
  if (metricCount >= 2) return "Stacked Bar";            // категория + несколько метрик
  if (dimCard <= 6) return "Donut";                      // мало категорий → part-of-whole
  if (dimCard <= 14) return "Treemap";                   // больше категорий → площади
  return "Lollipop";                                     // много категорий → рейтинг
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
