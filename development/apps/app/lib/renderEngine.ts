/* ── Render-engine feature flag (SPIKE) ──────────────────────────────────────
   Который движок рисует графики:
     'native'     — родной SVG-рендерер AXON (ChartRenderer). ЗНАЧЕНИЕ ПО УМОЛЧАНИЮ.
     'highcharts' — спайк: bar-графики идут через движок Highcharts (коллеги).

   Для живого показа держим 'native'. Чтобы продемонстрировать интеграцию —
   поменять ОДНУ строку ниже на 'highcharts'. Старый путь при этом не трогается. */
export type RenderEngine = "native" | "highcharts";

export const RENDER_ENGINE: RenderEngine = "native";
