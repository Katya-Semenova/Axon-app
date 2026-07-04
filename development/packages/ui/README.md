# @axon/ui — общие токены бренда

> Дверь в пакет: единые константы бренда AXON для ВСЕХ приложений монорепо
> (сервис + лендинг), чтобы цвета/шрифты не расходились.

Источник значений — [docs/DESIGN.md](../../../docs/DESIGN.md) (контракт) и
`references/palette-reference.png` (палитра). Направление всегда одно:
DESIGN.md → сюда/UI-кит → экраны; наоборот — никогда.

Используется как workspace-зависимость: `"@axon/ui": "*"` в package.json приложений.
Нужен новый токен → сначала DESIGN.md, потом сюда, потом использовать
([docs/rules/design-system-first.md](../../../docs/rules/design-system-first.md)).
