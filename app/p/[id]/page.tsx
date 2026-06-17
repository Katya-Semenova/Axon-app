import { getSharedBoard } from "@/app/actions/share";
import { PublicDeckView } from "./PublicDeckView";

/**
 * Публичная презентация `/p/[token]` (Шаг 12) — read-only, вход НЕ нужен.
 * Деку грузим по токену на сервере; рендер слайдов и навигация — в клиентском
 * PublicDeckView. Невалидный/отозванный токен → deck=null → «Презентация недоступна».
 */
export default async function PublicPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await getSharedBoard(id);
  return <PublicDeckView deck={deck} />;
}
