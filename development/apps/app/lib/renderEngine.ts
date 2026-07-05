/* ── Render-engine feature flag (SPIKE) ──────────────────────────────────────
   Который движок рисует графики:
     'native'     — родной SVG-рендерер AXON (ChartRenderer). ЗНАЧЕНИЕ ПО УМОЛЧАНИЮ.
     'highcharts' — спайк: bar-графики идут через движок Highcharts (коллеги).

   Для живого показа держим 'native'. Чтобы продемонстрировать интеграцию —
   поменять ОДНУ строку ниже на 'highcharts'. Старый путь при этом не трогается. */
import type { ChartType } from "@/lib/types";

export type RenderEngine = "native" | "highcharts";

export const RENDER_ENGINE: RenderEngine = "native";

/* Типы, которые умеет движок Highcharts (волна 1 + бары со спайка).
   Живёт здесь, а не в HighchartsRenderer.tsx: тот файл импортирует модули
   Highcharts и грузится ТОЛЬКО на клиенте (ssr:false) — списку же нужен
   и серверный рендер диспетчера. Новый тип: сюда + кейс в HighchartsRenderer. */
export const HIGHCHARTS_TYPES: ChartType[] = [
  "Bar", "Clean Columns", "Stacked Bar",
  "Heatmap", "Lollipop", "Scatter", "Scatter Plot", "Radar", "Donut",
  "Spline Area", "Line", "Area",
];
