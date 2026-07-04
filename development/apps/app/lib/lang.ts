/**
 * Язык ДАННЫХ по образцам текста (заголовки колонок, метки строк, названия):
 * есть кириллица → ru, иначе en.
 *
 * Решение 2026-07-04 (spec.md): контент слайдов следует за языком ДАННЫХ,
 * а не за локалью интерфейса — категории/оси всё равно приходят из файла,
 * и только так слайд остаётся одноязычным.
 */
export type DataLang = "ru" | "en";

export function dataLang(...samples: Array<string | null | undefined>): DataLang {
  return /[а-яё]/i.test(samples.filter(Boolean).join(" ")) ? "ru" : "en";
}
