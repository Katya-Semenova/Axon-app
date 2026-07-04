# UI-кит в `shared/ui/`

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 02 (обезличено 2026-07-04).

Цель: собрать в `src/shared/ui/` ~15 базовых компонентов, все стили через токены из `DESIGN.md`.

## Архитектура: мягкий Atomic Design внутри `shared/ui/`

Снаружи проекта работает Feature-Sliced Design (см. промт `fsd-architecture.md`). Внутри `shared/ui/` дополнительно работает **мягкий Atomic Design** — как способ думать про компоненты, **не как файловая структура**.

**Файлы лежат плоско**, без подпапок `atoms/molecules/organisms/`:

```
src/shared/ui/
├── button/         ← atom
├── input/          ← atom
├── icon/           ← atom
├── badge/          ← atom
├── avatar/         ← atom
├── form-field/     ← molecule (Label + Input + Error)
├── search-bar/     ← molecule (Input + Icon + Button)
├── card/           ← molecule
├── tabs/           ← molecule
├── tooltip/        ← molecule
├── modal/          ← UI-organism (без знания о домене)
├── table/          ← UI-organism (универсальная DataTable)
└── toast/          ← UI-organism
```

**Иерархия в голове, не в файлах:**

| Уровень | Что это | Признак | Зависимости |
|---|---|---|---|
| **Atom** | Button, Input, Icon, Badge | Не разбивается на компоненты | Только `shared/lib/utils` |
| **Molecule** | FormField, SearchBar, Card | Комбинация 2–3 атомов | Атомы из `shared/ui/` |
| **UI-organism** | Modal, Toast, DataTable | Сложная логика (focus trap, виртуализация), универсальный | Атомы + молекулы, иногда внешние библиотеки |

**Граница `shared/ui/` ↔ FSD-слои.** Как только компонент узнаёт о бизнес-домене (User, Product, Order, Cart) — он уходит из `shared/ui/`:

| Компонент | Где живёт | Почему |
|---|---|---|
| `Modal` | `shared/ui/modal/` | UI-organism, нет домена |
| `DataTable` (с пропами `columns`, `data`) | `shared/ui/table/` | Универсальная, не знает что показывает |
| `UserCard` | `entities/user/ui/` | Знает о User |
| `OrderStatus` | `entities/order/ui/` | Знает о Order |
| `LoginForm` | `features/login/ui/` | Действие пользователя |
| `Header` | `widgets/header/` | Содержит юзера, меню, действия |

На этом шаге создаём ТОЛЬКО `shared/ui/` (atoms + molecules + UI-organisms без домена). Доменные компоненты придут далее через FSD-слайсы.

Подробное правило (в чате с AI можно сослаться): `docs/rules/ui-kit-atomic.md`.

## Шаг 0 — Проверь предусловия

Перед стартом убедись, что выполнен промт `project-init-nextjs.md`:
- Существует `package.json`, `src/`, `tsconfig.json`
- В `package.json` есть зависимости `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- Есть файл `src/shared/lib/utils.ts` с функцией `cn()`
- `npm run dev` запускается, открывает Hello World на `localhost:3000`

Если чего-то нет — **остановись и попроси пользователя сначала выполнить `project-init-nextjs.md`**. Не пытайся инициализировать Next.js здесь — это не задача этого промта.

Стек уже зафиксирован в `spec.md` (раздел «Стек») на этапе init. Используй его как контекст: если там Tailwind v4 — конфиг через `@theme` директиву в CSS; если v3 — через `tailwind.config.ts`.

## Главные правила

1. **Один компонент = один файл**. Не `PrimaryButton.tsx` + `GhostButton.tsx`, а один `Button.tsx` с пропом `variant`.

2. **Все варианты — через `variant`**. `<Button variant="primary">`, `<Button variant="ghost">`. Описано в `cva()` (class-variance-authority).

3. **Все состояния — внутри компонента**. `hover`, `focus`, `disabled`, `loading` живут в файле компонента, не на местах использования.

4. **Курсор на интерактивных элементах — `cursor-pointer` обязательно в `cva()`.** Tailwind 3+ убирает `cursor: pointer` у `<button>` по умолчанию — это известная ловушка. Любой интерактивный элемент (button, кликабельная card, dropdown trigger, tabs trigger) должен иметь `cursor-pointer` в базовых классах. `disabled` → `cursor-not-allowed`, `loading` → `cursor-wait`. Полные правила: `docs/rules/ui-components-first.md` секция 2.1.

5. **Стили через переменные**. `bg-primary`, `text-foreground`, `rounded-md`. Никаких `bg-[#1A1C1E]`, `[16px]`, конкретных шрифтов.

6. **TypeScript-типы для всех пропов**. Через `VariantProps<typeof buttonVariants>`.

7. **Файлы лежат плоско**. `shared/ui/button/`, не `shared/ui/atoms/button/`. Atomic — в голове, не в файловой системе.

8. **НЕ клади в `shared/ui/` доменные компоненты**. Если компонент принимает `user: User` или `product: Product` — он не сюда, а в `entities/`.

## Стек используй тот, что утвердили ранее с пользователем. Например, для рекомендуемого стека:

- shadcn-ui как база компонентов (копи-паст в проект, не библиотека)
- Tailwind CSS с токенами из DESIGN.md
- Radix UI primitives под капотом (a11y, фокус-менеджмент) — приходит вместе с shadcn
- `cva` для вариантов (уже установлен на этапе init)
- `cn()` утилита для условных классов (уже в `shared/lib/utils.ts`)

## Установка shadcn CLI

```bash
npx shadcn@latest init
```

CLI задаст несколько вопросов — отвечай так:
- **Style:** New York (плотнее и аккуратнее, чем Default)
- **Base color:** возьми из `docs/DESIGN.md` секции `colors.primary` (slate / gray / zinc / neutral — что ближе)
- **CSS variables:** Yes (нужно, чтобы цвета из DESIGN.md подцеплялись)

После init появится `components.json` и обновится конфиг стилей:
- **Tailwind v4 (Next.js 16):** обновится `src/app/globals.css` — в нём появятся CSS-переменные и `@theme` директива
- **Tailwind v3 (Next.js 15):** обновится `tailwind.config.ts` — там будут токены через `theme.extend.colors`

В обоих случаях надо синхронизировать значения с `docs/DESIGN.md`. Это делается на следующем шаге (см. ниже «Синхронизация токенов»).

## Если есть Figma UI Kit — режим pixel-perfect

Применяется только если пользователь шёл по **режиму A (Figma)** на этапе продуктового интервью.

**Это не «адаптация под shadcn».** Это **точный перенос**. Дизайн в Figma — источник правды, код должен повторить его 1:1. Любое «возьму за основу и адаптирую» — нарушение режима A.

### Какую ссылку кидать

Не нужно давать ссылку на каждый компонент отдельно. **Одна ссылка на всю страницу UI Kit** в Figma. AI сам пройдётся по компонентам.

Как получить:
- В Figma Desktop открой файл с дизайном
- В левой панели выдели страницу `UI Kit` (или как она называется в проекте — `Components`, `Library`, `Design System`)
- ПКМ по странице → Copy link to selection
- Дай эту ссылку в чат

### Что AI делает с этой ссылкой

1. `get_metadata` на странице — получает список всех top-level frames / component sets

2. Классифицирует на **atoms / molecules / UI-organisms** по правилам выше

3. Показывает карту пользователю (см. ниже), ждёт подтверждения

4. После подтверждения — идёт по компонентам **в правильном порядке**: сначала atoms, потом molecules (которые используют atoms), потом organisms. Для **каждого** компонента — обязательный 5-шаговый workflow ниже.

### Что AI показывает ДО генерации кода

После прохода по странице UI Kit — **карта пользователю**:

```markdown
Нашёл в Figma UI Kit 14 компонентов:

**Atoms (создаём первыми):**
- Button (variants: primary, secondary, ghost, outline, destructive, link; sizes: sm, md, lg, icon)
- Input (states: default, focused, invalid, disabled)
- Badge (variants: default, secondary, destructive, outline)
- Avatar (sizes: sm, md, lg)
- Spinner

**Molecules:**
- FormField (Label + Input + ErrorMessage)
- Card (variants: default, elevated, outlined)
- ...

**UI-organisms:**
- Modal
- Toast

Иду по списку сверху вниз. Начнём с Button — это эталон, по нему остальные пойдут проще. Подтвердите?
```

Только после подтверждения — начинай генерацию. Это даёт пользователю шанс сказать «Avatar не нужен, у нас аватаров нет» или «добавь Tabs — его в Figma нет но нужен».

### Обязательный 5-шаговый workflow для каждого компонента

Для **каждого** компонента из Figma UI Kit. Пропуск любого шага = выход из режима pixel-perfect и переход к интерпретации. Это причина №1 расхождения экранов с макетом.

1. **`get_design_context` на node-id компонента** — получаешь точные значения: размеры (width / height / min-width), padding, gap, скругления (border-radius), цвета (fill / stroke / text), шрифт и его размер/вес/line-height, все состояния (default / hover / focus / disabled / pressed), variants. Записываешь точные числа, не «примерно».

2. **`get_screenshot` того же node-id** — сохраняешь в `docs/figma-snapshots/<component>.png` для последующей сверки.

3. **Сборка компонента** в `src/shared/ui/<name>.tsx` через `cva()` — НЕ «по образу», а **с точными значениями из шага 1**. Если в Figma `padding: 12px 16px, border-radius: 8px, font-size: 14px` — в `cva()` точно те же значения через токены DESIGN.md (или, если токена нет, сначала добавить токен в DESIGN.md, потом использовать).

4. **Локальный скриншот для сверки.** Открой `localhost:3000/style-guide`, найди компонент в showcase, через Playwright MCP `browser_navigate` → `browser_take_screenshot` сохрани в `docs/local-snapshots/<component>.png`.

5. **Сверка side-by-side: Figma snapshot vs локальный snapshot.** Открой оба файла рядом. Сверь по чек-листу:
   - [ ] Размеры (ширина/высота/min-width) совпадают
   - [ ] Padding и gap совпадают
   - [ ] Скругления совпадают
   - [ ] Цвета фона / границ / текста совпадают
   - [ ] Шрифт, размер, вес, line-height совпадают
   - [ ] Все states (hover, focus, disabled, pressed) визуально совпадают
   - [ ] Иконки на правильных позициях и правильного размера

   Если хоть один пункт расходится — **СТОП**. Не двигайся к следующему компоненту. Спроси пользователя: «Вижу расхождение в [конкретный пункт]: Figma говорит [X], в коде получилось [Y]. Как поступить — поправить токены / поправить вариант / оставить как есть с обоснованием?» Жди ответа.

### Запрещённые слова при работе в режиме A

Эти слова в коде, комментариях и в общении с пользователем — **сигнал что ты переходишь к интерпретации** вместо точного переноса:

- «адаптируй» / «адаптация»
- «возьми за основу»
- «по образу и подобию»
- «примерно как»
- «интерпретируй»
- «упростим» / «приведём к shadcn»

Если возникает желание написать что-то из этого — остановись. Сделай `get_design_context` ещё раз. Перепиши с точными значениями из Figma. В режиме A нет «близких аналогов» — есть только точные значения дизайна.

### Если в Figma компоненты «как frames» а не как настоящие components

Бывает что дизайнер не оформил compound components с variants — просто нарисовал 5 кнопок рядом. Тогда `get_design_context` вернёт 5 отдельных frames вместо одного с variants. В этом случае:
- Сообщи пользователю что нашёл «5 frames с похожими именами `Button-Primary`, `Button-Secondary`, ...» — это **анти-паттерн в Figma**
- Предложи объединить в один Button с 5 variants — но не блокируй работу. Можешь сгенерировать React-Button с тем же набором variants по информации из этих 5 frames. **Workflow выше применяется к каждому из 5 frames** — для каждого свой `get_design_context` + `get_screenshot` + сверка.

### После UI-кита — обязательный следующий шаг

После того как все компоненты UI-кита собраны и прошли сверку — **обязательный** следующий промт `figma-code-connect.md`. Без Code Connect mapping каждый `get_design_context` экрана в промтах `screen-visual-spec.md` и `screen-generation.md` возвращает Tailwind-каркас, который AI каждый раз заново интерпретирует — это **всегда** даёт потери точности. Code Connect делает так, что MCP возвращает готовый JSX с твоими `<Button variant="primary">` и точными props.

Code Connect пропускается **только** в режиме Б/В (без Figma).

---

## Порядок — по одному компоненту

**Не пытайся сгенерировать все 15 разом — будут поверхностные.** Делай по одному, начни с `Button.tsx` — он эталонный, остальные пойдут по образцу.

### Список компонентов с обязательными variants / sizes / states

Базовый набор. Каждый компонент собирается **полностью** — со всеми перечисленными вариантами, размерами и состояниями. Если какой-то variant/size/state не нужен в продукте сейчас — всё равно реализуй, чтобы на этапе сборки экранов AI не сочинял новые на лету.

**Atoms** (неделимые, не импортят другие компоненты `shared/ui/`):

1. **`Button`**
   - variants: `default`, `primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`
   - sizes: `sm`, `md`, `lg`, `icon` (квадратная под иконку)
   - states: `default`, `hover`, `focus-visible` (через `:focus-visible`), `active/pressed`, `disabled`, `loading` (со спиннером, текст блокируется)
   - props: `asChild` (для рендера как `<a>`), `leftIcon`, `rightIcon`

2. **`Input`**
   - types: `text`, `email`, `password`, `number`, `tel`, `url`, `search`
   - sizes: `sm`, `md`, `lg`
   - states: `default`, `hover`, `focus`, `invalid` (красная рамка + focus-ring), `disabled`, `readonly`
   - props: `leftIcon`, `rightIcon`, `clearable`

3. **`Textarea`**
   - sizes: `sm`, `md`, `lg`
   - states: `default`, `focus`, `invalid`, `disabled`
   - props: `autoResize` (опционально), `maxLength` с countdown

4. **`Checkbox`** — states: `default` / `checked` / `indeterminate` / `disabled` / `invalid`. sizes: `sm`, `md`

5. **`Radio`** — states: `default` / `checked` / `disabled`. Группа через `RadioGroup`

6. **`Switch`** — states: `off` / `on` / `disabled`. sizes: `sm`, `md`

7. **`Label`** — связь с input через `htmlFor`. variant: `default`, `required` (со звёздочкой)

8. **`Badge`** — variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`. sizes: `sm`, `md`

9. **`Avatar`** — sizes: `xs`, `sm`, `md`, `lg`, `xl`. С fallback (инициалы при отсутствии image)

10. **`Spinner`** — sizes: `sm`, `md`, `lg`. Опционально с label «Загрузка…»

11. **`Icon`** — обёртка над `lucide-react`. sizes: `sm`, `md`, `lg`. Цвет наследуется от `currentColor`

12. **`Skeleton`** — placeholder для loading-состояний. variants: `text`, `circular`, `rectangular`

**Molecules** (комбинации атомов, без бизнес-домена):

13. **`FormField`** — Label + Input/Textarea/Select + ErrorMessage + опциональный hint. Принимает `error: string | undefined`, при наличии — Input в `invalid` + красный текст ошибки

14. **`Select`** — single + multi режимы. states: `default`, `open`, `disabled`, `invalid`. Поиск по опциям, очистка выбора

15. **`Combobox`** — Select с поиском и keyboard navigation

16. **`Card`** — variants: `default`, `elevated`, `outlined`, `interactive` (hover-эффект). Слоты: `header`, `content`, `footer`

17. **`Tabs`** — variants: `default` (underline), `pills`. orientation: `horizontal`, `vertical`

18. **`Tooltip`** — placement: `top`, `right`, `bottom`, `left`. trigger: `hover`, `click`

19. **`Breadcrumb`** — разделитель `/` или `>` или иконкой. Последний элемент — без ссылки

20. **`Pagination`** — для списков и таблиц. sizes: `sm`, `md`. С первой/последней страницей и многоточием

**UI-organisms** (сложная логика, без домена):

21. **`Dialog` / `Modal`** — sizes: `sm`, `md`, `lg`, `xl`, `full`. focus trap, portal, escape-close, click-outside-close. Слоты: `header`, `content`, `footer`

22. **`Sheet` / `Drawer`** — placement: `left`, `right`, `top`, `bottom`. Тот же набор слотов что у Dialog

23. **`Toast`** — variants: `default`, `success`, `error`, `warning`, `info`. С action-button опционально. Автозакрытие + manual close

24. **`AlertDialog`** — confirm/destructive диалог. Variants: `default`, `destructive`

25. **`Dropdown Menu`** — items, separators, nested submenus, keyboard navigation

26. **`Popover`** — для inline-форм и фильтров. placement как у Tooltip

27. **`Table` / `DataTable`** — sorting, header, body, footer, pagination, row selection (checkbox). Универсальная (принимает `columns` и `data` как пропы)

28. **`Form`** — orchestration через `react-hook-form` + `zod`. Связка с FormField

29. **`Command Palette`** (`Cmd+K`) — опционально, но обычно нужно

30. **`Empty State`** — для пустых списков. Слоты: icon/illustration, title, description, action

### Полнота UI-кита — жёсткое правило

**Если на этапе сборки экранов AI обнаружит, что нужного variant / size / state нет в компоненте** — это **блокер**. Действия:

1. Не хардкодить inline в коде экрана

2. Не создавать «локальную копию» компонента в `features/` или `entities/`

3. Возвращаться сюда: добавлять variant/size/state в `shared/ui/<component>.tsx`, дополнять `cva()` определение, добавлять секцию в showcase

4. Только после этого продолжать экран

Это держит UI-кит **единственным источником визуальной правды**.

> Если пользователь хочет компонент, который принимает `user`, `product`, `order` — это сигнал что компонент **доменный**, его место в `entities/<name>/ui/`, не в `shared/ui/`. Откажи и предложи правильное место.

## Эталон Button.tsx (паттерн)

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

Остальные компоненты строй по этому образцу.

## Проверка хардкода (после каждого компонента)

```bash
grep -E '#[0-9a-fA-F]{3,8}' src/shared/ui/<component>.tsx
grep -E '\[\d+px\]' src/shared/ui/<component>.tsx
```

Если что-то нашлось → переделай через токен из DESIGN.md или добавь новый токен (с прогоном lint).

## После UI-кита — полноценный showcase с боковой панелью

**Это критичная часть, не сокращать**. UI-кит без showcase = непроверяемая работа. Нужна страница, где видны **все** компоненты, **все** варианты, **все** состояния, и для каждого можно **интерактивно переключать** props.

### Структура страницы `/style-guide`

Создай `src/app/style-guide/page.tsx` (это App Router — путь именно `app/style-guide/page.tsx`, не `pages/style-guide`). Раскладка — 2 колонки:

```
┌─────────────────────┬──────────────────────────────────────────┐
│                     │                                          │
│  Sidebar навигация  │  Main content                            │
│  (sticky, 240px)    │                                          │
│                     │  [Component Name]                        │
│  Atoms              │                                          │
│   • Button          │  Variants:                               │
│   • Input           │   [primary] [secondary] [ghost] ...      │
│   • Badge           │                                          │
│   • Avatar          │  Sizes:                                  │
│   • Spinner         │   [sm] [md] [lg] [icon]                  │
│                     │                                          │
│  Molecules          │  States:                                 │
│   • FormField       │   [default] [hover] [focused] [disabled] │
│   • Card            │   [loading] [invalid]                    │
│   • Tabs            │                                          │
│   • Tooltip         │  Interactive controls:                   │
│                     │   variant: [primary ▼]                   │
│  UI-organisms       │   size:    [md ▼]                        │
│   • Modal           │   disabled: [ ]                          │
│   • Toast           │   loading:  [ ]                          │
│   • Form            │                                          │
│                     │  Preview:                                │
│                     │   ┌──────────────────────────┐           │
│                     │   │  <Button> рендер тут     │           │
│                     │   └──────────────────────────┘           │
│                     │                                          │
│                     │  Code snippet (для копирования):         │
│                     │   <Button variant="primary" size="md">   │
│                     │     Сохранить                            │
│                     │   </Button>                              │
│                     │                                          │
└─────────────────────┴──────────────────────────────────────────┘
```

### Требования к showcase (жёсткие)

**Sidebar:**
- Sticky слева (фиксированный при скролле основной области)
- Четыре группы заголовками: «Foundations» (токены — первой), «Atoms», «Molecules», «UI-organisms»
- Под каждой группой — список как ссылки
- Клик по пункту → скроллит main content к соответствующей секции (anchor `#colors`, `#button`, etc.)
- Активный пункт подсвечен (по `IntersectionObserver` или по hash)

**Foundations (токены дизайн-системы) — первая секция showcase, до компонентов:**
- **Colors (`#colors`)** — свотчи **всех** цветов из DESIGN.md: brand, neutral (все ступени), surface (card / popover / border / ring), semantic (success / warning / error / info). Для каждого свотча: квадрат цвета + имя токена (`bg-primary`, CSS-переменная `--color-primary`) + hex. На цветных свотчах показывай текст соответствующим `on-*` токеном (`on-primary` поверх `primary`) — сразу видно контраст. Если в DESIGN.md есть тёмная тема — покажи пары light/dark.
- **Typography (`#typography`)** — все размеры и веса из DESIGN.md на примере текста (h1 … body … caption) с именами токенов.
- **Spacing (`#spacing`)** — шкала отступов (xs … 2xl) полосками с подписями значений.
- **Radii (`#radii`)** — скругления (none … full) квадратами с подписями.

Всё в Foundations берётся **из DESIGN.md** (промт `design-tokens.md`), не хардкодом. Это визуальная проверка, что токены реально подключены: видишь палитру и шкалы — значит дизайн-система живая, а не «на бумаге».

**Main content:**
- Каждый компонент = отдельная секция с `<h2 id="button">Button</h2>`
- Внутри секции:
  - **Variants** — все варианты компонента, отрендеренные рядом (для Button: primary, secondary, ghost, outline, destructive, link)
  - **Sizes** — все размеры (sm, md, lg, icon-only)
  - **States** — состояния: default, hover (через CSS `:hover`, не имитация), focused (через `:focus-visible`), disabled, loading
  - **Interactive controls** — UI с реальными контролами для переключения пропов:
    - Для Button: dropdown для variant, dropdown для size, checkbox для disabled, checkbox для loading → preview обновляется в реальном времени
    - Для Input: те же + переключатель type (text/email/password), checkbox для invalid
    - Для Select: добавить-удалить-опции в реальном времени
    - Для Modal: кнопка «Open Modal», открывает реальный модальный диалог
    - Для Tooltip: hover/click triggers
  - **Code snippet** — пример использования с текущими настройками контролов (обновляется когда меняются контролы)

**Каждый компонент должен быть полностью интерактивным.** Никаких «вот так выглядит disabled» статичной картинкой — пользователь должен реально переключить toggle и увидеть disabled-состояние.

### Реализация — структура файлов

```
src/app/style-guide/
├── page.tsx                    ← главная страница с layout (sidebar + main)
├── _components/
│   ├── ComponentSection.tsx    ← обёртка одной секции: h2, variants, controls, preview, code
│   ├── PropControl.tsx         ← универсальный контрол: dropdown / toggle / text input для пропа
│   ├── PreviewBox.tsx          ← обёртка для рендера компонента (с фоном и границами)
│   └── CodeSnippet.tsx         ← блок с подсветкой синтаксиса (можно `react-syntax-highlighter` или просто `<pre>`)
└── _sections/
    ├── button-section.tsx      ← одна секция на компонент
    ├── input-section.tsx
    ├── card-section.tsx
    └── ...
```

В `page.tsx` собирает sidebar + рендерит все секции по очереди.

### Главная страница `/` — удобный заход на витрину ТОЛЬКО в dev

Чтобы при локальной разработке `npm run dev` сразу попадать на UI-кит, добавь редирект на `/style-guide` — **но только для режима разработки**. Это важно: если редиректить безусловно, он «прилипнет» к приложению и в задеплоенном проекте главная страница будет вести на UI-кит вместо вашего продукта (частая путаница: «почему на сервере открывается style-guide?»). Поэтому в проде главная отдаёт настоящую страницу, а не витрину.

Замени `src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  // Только в локальной разработке: сразу открываем витрину UI-кита.
  if (process.env.NODE_ENV !== "production") {
    redirect("/style-guide");
  }
  // Прод: настоящая главная продукта. Её соберёшь в шаге экранов и заменишь
  // этот файл целиком (тогда и dev-редирект уйдёт). Пока — простая заглушка.
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Скоро здесь будет приложение</h1>
        <p className="text-sm text-gray-600">
          UI-кит — на <code>/style-guide</code>.
        </p>
      </div>
    </main>
  );
}
```

Так `localhost:3000` в dev сразу ведёт на UI-кит, а задеплоенный сайт по IP/домену показывает страницу продукта (сейчас — заглушку). Когда в шаге экранов соберётся настоящая главная — этот файл заменяется целиком, и временный dev-редирект исчезает вместе с ним.

### Проверка качества showcase (обязательно)

Перед тем как сказать пользователю «готово» — открой `localhost:3000/style-guide` (если есть доступ к Playwright MCP) или попроси пользователя проверить **каждый** пункт:

- [ ] Sidebar виден слева, прилипает при скролле
- [ ] Секция Foundations первой: Colors (свотчи всех токенов DESIGN.md + имя + hex), Typography, Spacing, Radii
- [ ] В sidebar есть все 15+ компонентов под правильными группами
- [ ] Клик по пункту sidebar — скроллит к секции компонента
- [ ] Активный пункт sidebar подсвечивается при скролле
- [ ] У **каждого** компонента есть блок Variants (если их > 1)
- [ ] У **каждого** компонента есть блок Sizes (если их > 1)
- [ ] У **каждого** компонента есть блок States (минимум default + hover + disabled)
- [ ] У **каждого** компонента есть Interactive controls — реально работают, переключение видно
- [ ] Modal, Tooltip, Toast — реально открываются/закрываются на клике (не статичные превью)
- [ ] Select / Dropdown — реально открываются, опции выбираются
- [ ] Code snippet есть под каждой Preview, отражает текущее состояние контролов

Если хоть один пункт «нет» — **доделай**, не считай работу законченной. UI-кит без полного showcase = непроверяемая работа.

## После выполнения

1. Покажи `tree src/shared/ui/`

2. Покажи `tree src/app/style-guide/`

3. Прогон grep по хардкоду в `src/shared/ui/` и `src/app/style-guide/` — должно быть пусто

4. **Финал — запусти сервер и покажи UI-кит пользователю, НЕ закрывай его.**
   - Запусти `npm run dev` **в фоне**, чтобы сервер остался работать (а не завершился сразу после команды).
   - Открой витрину в **браузере пользователя**: `open http://localhost:3000/style-guide` (macOS) / `xdg-open http://localhost:3000/style-guide` (Linux) / `start http://localhost:3000/style-guide` (Windows). Это его обычный браузер, а не служебный браузер Playwright.
   - Скажи пользователю: «UI-кит собран, сервер запущен, витрина открыта в браузере — посмотрите». **Сервер оставь работать, не глуши после проверок.**
   - Если для сверки использовался Playwright MCP — его браузер служебный, его закрыть можно; dev-сервер и пользовательский браузер оставляем открытыми.
