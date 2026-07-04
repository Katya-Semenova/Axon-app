# Code Connect — точный маппинг Figma-компонентов на React UI-кит

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 02 (обезличено 2026-07-04).

**Обязательный шаг между UI-китом и экранами в режиме A (Figma).** Не опциональная фича — без Code Connect mapping любая генерация экрана из Figma будет терять точность. Подробное объяснение почему — в секции «Зачем это нужно» ниже.

Цель: после того как UI-кит собран в `src/shared/ui/`, настроить **Code Connect** — связку «Figma-компонент → твой React-импорт с правильными props». После этого AI при чтении любого экрана из Figma автоматически использует твои компоненты, а не генерирует JSX с нуля.

Это даёт **1:1 точность переноса** Figma → код. Делается один раз, дальше работает само.

## Когда этот промт пропускается

**В режиме Б/В (без Figma)** — целиком. Если пользователь шёл без Figma — переходи сразу к `fsd-architecture.md`. Code Connect нужен исключительно для пути A.

**В подслучае A2 (Figma только с макетами, без библиотеки компонентов)** — почти целиком. Code Connect привязывает Figma-**компонент** к React-импорту (см. предусловие ниже: элементы должны быть настоящими `components`, не frames). Если в файле только макеты, а кнопки и карточки нарисованы как frames, привязывать не к чему. Тогда: смаппь только те элементы, что реально оформлены компонентами (если такие есть), а остальное оставь на сверку скриншотами в `screen-generation.md`. Если компонентов нет вовсе — пропусти промт и переходи к `fsd-architecture.md`.

**В подслучае A1 (в Figma есть библиотека компонентов) пропускать нельзя.** Это не «опционально, рекомендуется» — это обязательный шаг. Чтобы понять, A1 у тебя или A2: выполнил ли UI-кит в `ui-kit.md` в режиме pixel-perfect по готовым Figma-компонентам (A1) или вычленял компоненты из макетов сам (A2).

## Зачем это нужно

Без Code Connect, когда AI на этапе генерации экранов делает `get_design_context` для конкретного экрана, Figma MCP возвращает **Tailwind-каркас** — сырые классы и JSX-структуру, не привязанную к твоему UI-киту. AI **каждый раз заново интерпретирует** этот каркас: пытается понять «эта прямоугольная штука с тёмным фоном и текстом — это, наверное, мой `<Button variant="primary">`», и каждый раз ошибается по чуть-чуть. Результат: экраны в коде сильно расходятся с макетом, кнопки оказываются другого размера, отступы плывут, иконки на не тех позициях.

С Code Connect — Figma MCP при `get_design_context` экрана возвращает **готовый JSX с твоими компонентами и точными props**. Никакой интерпретации, никаких догадок. Это и есть тот самый «1:1 перенос дизайна в код», ради которого вообще выбирали путь A.

Без этого промта весь предыдущий труд по UI-киту (с pixel-perfect сверкой) на этапе экранов превращается в кашу — каждый экран AI собирает заново, не зная что у тебя уже есть `<Button>` нужного вида.

## Предусловия

- DESIGN.md готов, UI-кит в `shared/ui/` собран — **со всеми компонентами по 5-шаговому workflow** из `ui-kit.md` (каждый прошёл `get_design_context` + сверку скриншотов).
- Пользователь шёл по **режиму A (Figma)** при работе с дизайном.
- Figma MCP подключён (`mcp__figma__*` доступен).
- В Figma-файле компоненты UI-кита оформлены как настоящие **components** (с variants и properties), не как frames.

## Шаг 1 — Установить Code Connect CLI

В корне проекта:

```bash
npm install -D @figma/code-connect
```

Проверка:
```bash
npx figma connect --version
```

## Шаг 2 — Создать `figma.config.json`

В корне проекта (рядом с `package.json`):

```json
{
  "codeConnect": {
    "include": ["src/shared/ui/**/*.figma.tsx"],
    "parser": "react",
    "importPaths": {
      "src/shared/ui/*": "@/shared/ui/*"
    }
  }
}
```

`importPaths` маппит относительный путь к alias из `tsconfig.json` — чтобы Figma показывал правильный импорт `import { Button } from "@/shared/ui/button"`, а не `import { Button } from "./Button"`.

## Шаг 3 — Получить Personal Access Token для публикации

Code Connect для **публикации** маппинга использует PAT (не OAuth Figma MCP). Это отдельный токен только для publish-команды.

1. Открой `https://www.figma.com/settings/personal-access-tokens`

2. Create new token. Scope: **Code Connect → Write**, **File content → Read**. Срок жизни 30 дней (потом продлишь).

3. Положи токен в env-файл (не в код, не в чат, не в терминал). Сам создай или дополни `.env.local` строкой-плейсхолдером:
   ```
   FIGMA_ACCESS_TOKEN=впиши-сюда-свой-Code-Connect-токен
   ```
   Скажи пользователю: «Создал `.env.local`. Открой и впиши токен после `FIGMA_ACCESS_TOKEN=`, сохрани». Значение токена ты не видишь. Убедись, что `.env*` внесён в `.gitignore` — токен в репозиторий не уйдёт.

4. Publish-команда Code Connect берёт токен из `.env.local` (переменная `FIGMA_ACCESS_TOKEN`). Запуск публикации делает AI, подставляя значение из env, — пользователю в терминал ничего вводить не нужно.

## Шаг 4 — Сгенерировать `.figma.tsx` для каждого компонента

Code Connect может сгенерировать заготовки автоматически по списку Figma node-id, но для точности лучше пройти по UI-киту вручную — там 10–15 компонентов, это быстро.

**Для каждого компонента** в `shared/ui/<name>/`:

1. В Figma выдели нужный компонент (например, `Button` component set).

2. Скопируй ссылку: ПКМ → Copy link to selection. Будет вида `https://figma.com/file/<fileKey>/...?node-id=<nodeId>`.

3. Создай рядом с компонентом файл `<Component>.figma.tsx`. Например для `shared/ui/button/Button.tsx` → `shared/ui/button/Button.figma.tsx`:

```tsx
import { figma } from "@figma/code-connect"
import { Button } from "./Button"

figma.connect(
  Button,
  "https://figma.com/file/<fileKey>/...?node-id=<nodeId>",
  {
    props: {
      // Маппинг Figma variant → React prop value
      variant: figma.enum("Variant", {
        Primary: "primary",
        Secondary: "secondary",
        Outline: "outline",
        Ghost: "ghost",
        Destructive: "destructive",
        Link: "link",
      }),
      size: figma.enum("Size", {
        Small: "sm",
        Medium: "default",
        Large: "lg",
        Icon: "icon",
      }),
      // Текст кнопки приходит из children Figma-компонента
      children: figma.children("*"),
      // Состояние loading — boolean variant в Figma
      loading: figma.boolean("Loading"),
    },
    example: ({ variant, size, children, loading }) => (
      <Button variant={variant} size={size} loading={loading}>
        {children}
      </Button>
    ),
  }
)
```

**Соответствие property → figma.{type}:**

| Figma property type | Code Connect API | Пример |
|---|---|---|
| Variant (enum) | `figma.enum("PropName", {...})` | размер, тип кнопки |
| Boolean (toggle) | `figma.boolean("PropName")` | loading, disabled |
| Text | `figma.string("PropName")` | подпись |
| Instance | `figma.instance("PropName")` | вложенный компонент (например, иконка в кнопке) |
| Children (auto layout) | `figma.children("*")` или `figma.children("Icon")` | дочерние элементы |

**Важно:** имена Figma-property (`Variant`, `Size`, `Loading`) и их значения (`Primary`, `Small`) должны точно совпадать с тем что в Figma. Проверяй через Figma → Inspect → Properties.

Пройди так по всем компонентам UI-кита. Файлов будет 10–15.

## Шаг 5 — Опубликовать маппинг в Figma

```bash
npx figma connect publish
```

Команда:
- Найдёт все `*.figma.tsx` файлы согласно `figma.config.json`
- Свалидирует каждый
- Загрузит маппинг в Figma (привяжет к node-id)

Результат: в Figma открой компонент → правая панель Inspect → секция Dev Resources → **должен появиться React-сниппет** с правильным импортом и props. Это значит маппинг работает.

## Шаг 6 — Проверка через MCP

В чате с AI:
```
Возьми <ссылка на любой экран в Figma>. Сгенерируй React-компонент. Используй компоненты из @/shared/ui/.
```

Через Figma MCP агент сделает `get_code_connect_map` — увидит твои маппинги — сгенерит экран **используя твои компоненты с правильными props**, а не свой JSX.

**Если агент всё ещё генерирует свой Button вместо твоего:**
- Проверь что `npx figma connect publish` прошёл без ошибок
- Проверь что ссылка на экран в том же файле где компоненты с маппингом
- Запроси у MCP `get_code_connect_map` напрямую — должен вернуть твой маппинг

## После выполнения

1. Покажи пользователю `tree shared/ui/` — должны быть пары `<Component>.tsx` + `<Component>.figma.tsx`

2. Покажи скриншот секции Dev Resources в Figma — там React-сниппет

3. Сгенерируй один тестовый экран через MCP с использованием маппинга — покажи что в результате импорты идут из `@/shared/ui/`

4. Зафиксируй ADR в `docs/memory/decisions/ADR-XXX-code-connect.md`:
   - Что: настроен Code Connect для UI-кита
   - Зачем: 1:1 перенос Figma → код
   - Когда обновлять: при добавлении нового компонента в UI-кит → новый `*.figma.tsx` + `npx figma connect publish`

## Когда нужно обновлять маппинг

| Событие | Действие |
|---|---|
| Добавил новый компонент в UI-кит | Создай `<Component>.figma.tsx`, прогон `npx figma connect publish` |
| Изменил variant'ы или props компонента | Обнови соответствующий `*.figma.tsx`, прогон `publish` |
| Перенёс компонент из `shared/ui/` в `entities/` | Перенеси `*.figma.tsx` рядом, обнови `importPaths` если нужно |
| Дизайнер переименовал variant в Figma | Обнови маппинг enum в `*.figma.tsx` |

## Почему PAT а не OAuth MCP

Code Connect — отдельный инструмент Figma для **публикации** маппинга. Он работает через REST API с PAT. Это разделение интенциональное: MCP для чтения дизайна в агенте, Code Connect для пуша маппинга в Figma. Токены разные.

PAT хранится только в `.env.local` (переменная `FIGMA_ACCESS_TOKEN`). В git не попадает (`.env.local` в `.gitignore`), в чат не даём.
