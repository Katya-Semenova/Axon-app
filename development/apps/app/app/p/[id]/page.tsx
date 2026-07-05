import { getSharedBoard } from "@/app/actions/share";
import { PublicDeckView } from "./PublicDeckView";

/**
 * Публичная презентация `/p/[token]` (Шаг 12) — read-only, вход НЕ нужен.
 * Деку грузим по токену на сервере; рендер слайдов и навигация — в клиентском
 * PublicDeckView. Невалидный/отозванный токен → deck=null → «Презентация недоступна».
 * `?view=dashboard` — тот же токен, но вид «таб-дашборд»: закладки по слайдам
 * вместо листания (формат «Web-dashboard (Interactive)» в Показе, 05.07).
 */
export default async function PublicPresentationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const deck = await getSharedBoard(id);
  return <PublicDeckView deck={deck} dashboard={view === "dashboard"} />;
}
