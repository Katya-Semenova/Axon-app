/**
 * cn — крошечный join классов (clsx-lite, без зависимостей).
 * Фильтрует falsy и склеивает через пробел. className потребителя кладём
 * последним, чтобы переопределения шли по порядку источника.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
