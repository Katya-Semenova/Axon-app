import type { NodePositionMap } from "@/lib/types";

/* Раскладка загруженной доски: каждый инсайт — на своей строке, слева от своего
   дата-сета (пары «инсайт → дата-сет»). У загрузки инсайтов мало и связь 1:1,
   поэтому пары по строкам читаются чище 2-колоночной сетки сида и не дают тесноты.
   X-колонки совпадают с seedNodePositions()/Canvas: инсайты x=28, дата-сеты x=500. */
const INS_COL_X      = 28;   // левая колонка — инсайты
const DS_COL_X       = 500;  // правая колонка — дата-сеты
const TOP            = 28;
const ROW_STRIDE     = 300;  // высота строки с запасом под высокие карточки (Heatmap/Map ~285px)
const INS_ROW_OFFSET = 36;   // опускаем инсайт — центрируем против более высокой карточки дата-сета

/**
 * Позиции нод: инсайт i и дата-сет i — в одной строке (инсайт слева, его дата-сет
 * справа). У загрузки инсайтов мало и связь 1:1, поэтому пары по строкам.
 */
export function layoutPositions(insightIds: string[], dataSetIds: string[]): NodePositionMap {
  const p: NodePositionMap = {};
  insightIds.forEach((id, i) => {
    p[id] = { x: INS_COL_X, y: TOP + i * ROW_STRIDE + INS_ROW_OFFSET };
  });
  dataSetIds.forEach((id, i) => {
    p[id] = { x: DS_COL_X, y: TOP + i * ROW_STRIDE };
  });
  return p;
}
