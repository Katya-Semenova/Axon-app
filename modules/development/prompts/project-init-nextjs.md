# Инициализация разработки — Next.js + зависимости

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 02 (обезличено 2026-07-04).

Цель: к концу промта в корне проекта есть рабочий Next.js проект с TypeScript, Tailwind и стартовыми зависимостями. На основе этого скелета далее ставится shadcn UI-кит и собираются экраны.

## Рекомендованный стек

| Слой | Рекомендация | Альтернативы (если у тебя другие предпочтения) |
|---|---|---|
| Фреймворк | **Next.js 16** (App Router) | Next.js 15, Remix, Astro |
| Язык | **TypeScript (strict)** | JavaScript (не рекомендуется — AI делает на 30–50% больше итераций без типов) |
| Стили | **Tailwind CSS v4** (идёт по умолчанию с Next.js 16) | Tailwind v3 (если ставишь Next.js 15), CSS Modules, vanilla CSS |
| UI-компоненты | **shadcn/ui** (копи-паст компонентов, не библиотека) | Radix UI напрямую, Headless UI, MUI |
| Иконки | **lucide-react** (идёт с shadcn) | react-icons, Heroicons |
| Архитектура | **Feature-Sliced Design** (структура папок) | Своя структура, классический "components/pages" |

Это **рекомендация, не догма** — каждая позиция меняется по желанию. Дальше промт показывает установку рекомендованного стека; если меняешь — адаптируй команды.

> **React и TypeScript — не «или-или», а разные слои стека.** В таблице нет отдельной строки «React», потому что React приходит вместе с **Next.js** (строка «Фреймворк»): Next.js построен на React. React отвечает за интерфейс — компоненты, из которых собран экран. **TypeScript** (строка «Язык») — это язык, на котором пишется всё, включая сами React-компоненты. Файл `.tsx` = React-компонент (`jsx`) с типами (`ts`). То есть вы пишете React **на** TypeScript внутри Next.js — это один стек, а не выбор между ними. Аналогия: «дом из кирпича» (материал = язык) и «двухэтажный» (конструкция = фреймворк/React) описывают разные вещи, одно другому не замена.

Про деплой здесь не решаем — это отдельный этап. Возможные варианты (VPS / Vercel / Render / Railway / Netlify) рассматриваются позже.

## Шаг 0 — Подтверди стек
Рекомендованный стек: **Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Feature-Sliced Design**.
Подбери другой рекомендованный стек под данную задачу, если явно лучше использовать что-то другое. Покажи пользователю рекомендованный стек и спроси, подходит ли (один вопрос с вариантом отказа):

> «Рекомендованный стек: **Next.js 16 (React) + TypeScript + Tailwind v4 + shadcn/ui + Feature-Sliced Design**.
>
> Можно его использовать, или у тебя есть предпочтения по фреймворку / стилям / TypeScript-vs-JS? (например, "хочу Next.js 15", "хочу без TypeScript", "хочу не Tailwind")»

Это рекомендация по умолчанию. Если пользователь без возражений — берём как есть. Если есть предпочтения — адаптируем.

Действуй по ответу:
- **«Подходит» / «давай» / без возражений** → дальше следуй промту как есть.
- **«Хочу X вместо Y»** → отметь изменение в `docs/spec.md` в разделе «Стек», адаптируй команды установки.

Запиши итоговый стек в `docs/spec.md`:

```markdown
## Стек
- Frontend: Next.js 16 (App Router)
- Язык: TypeScript (strict)
- Стили: Tailwind CSS v4
- UI: shadcn/ui + lucide-react
- Архитектура: Feature-Sliced Design
- Deploy: решается позже
```

## Шаг 1 — Создать Next.js проект

Из папки, в которой должен появиться проект (подставь своё имя проекта вместо `<project>`):

```bash
npx create-next-app@latest <project> \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack \
  --disable-git \
  --no-agents-md
```

Что выбрано флагами:
- `--typescript` — TypeScript включён
- `--tailwind` — Tailwind CSS (на Next.js 16 это автоматически v4)
- `--app` — App Router (FSD структура завязана на него)
- `--src-dir` — код в `src/`, что нужно для FSD-структуры
- `--import-alias "@/*"` — короткие импорты `@/shared/ui/button`
- `--no-turbopack` — пока работаем на стандартном бандлере (опционально, Turbopack можно включить отдельно)
- `--disable-git` — не даём create-next-app самому инициализировать git и делать коммит. Git инициализируется осознанно отдельным шагом (или уже есть на уровне воркспейса). Без этого флага create-next-app тихо создаёт репозиторий и коммитит «Initial commit from Create Next App» — лишнее и сбивает с толку. Если ты уже осознанно ведёшь git в этом репозитории — флаг оставь, чтобы не получить вложенный репозиторий.
- `--no-agents-md` — не генерируем `AGENTS.md`/`CLAUDE.md` от create-next-app: ваш `AGENTS.md` уже собран на этапе настройки AI (промт `ai-assistant-setup.md`), перезаписывать его не нужно.

Если CLI спрашивает «App Router?» или «src directory?» — отвечай "Yes" на обе.

**Если у пользователя в `Шаге 0` выбран Next.js 15** — используй `create-next-app@15`. В этом случае Tailwind будет v3, а не v4 — это нормально, дальше всё работает (только в шаге shadcn config-файл будет `tailwind.config.ts` вместо `@theme` директивы).

## Шаг 1.5 — Префлайт: правила и рецепты в репозитории проекта, обёртки в корне воркспейса

Применяется, если проект живёт в подпапке воркспейса (например, `<project>/` внутри папки, которую открывает AI). Если корень воркспейса = корень проекта — шаг можно пропустить.

Канон воркспейса:
- **Правила (`AGENTS.md`) и промты-рецепты (`prompts/`)** — **внутри** папки проекта. Это git-репозиторий, его клонирует команда; всё, что должно ехать с проектом, живёт внутри него.
- **Обёртки (`.claude/`: скиллы, хуки, `settings.json`)** — в **корне воркспейса**. Claude грузит конфиг из открытой папки (обычно весь воркспейс), а внутрь подпапки проекта сам не заглядывает, поэтому обёртки должны лежать в корне, чтобы гарантированно срабатывать. Внутри скилла — лишь ссылка на рецепт из `prompts/` проекта.
- В **корне воркспейса** `CLAUDE.md` = `@<project>/AGENTS.md` (импорт правил проекта — они в контексте сразу, а не лениво). Документация (`docs/`) — внутри проекта.

Иногда из-за прошлых шагов или из-за того что `create-next-app` инициализировал что-то не там, структура расходится: `.claude` оказался внутри проекта, `AGENTS.md` — в корне воркспейса, или `docs/` не в проекте. Прогони префлайт-гард — он приведёт **любую** структуру к канону (ничего не затирая). Подставь имя своей папки проекта вместо `<project>`:

```bash
# Запускаем из корня воркспейса

# 1) ПРАВИЛА (AGENTS.md) должны быть ВНУТРИ папки проекта. Если оказались в корне — переносим.
if [ -f AGENTS.md ] && [ ! -L AGENTS.md ]; then
  if [ ! -f <project>/AGENTS.md ]; then
    mv AGENTS.md <project>/AGENTS.md
    echo "перенёс ./AGENTS.md → <project>/AGENTS.md"
  else
    echo "⚠️  и в корне, и в проекте есть реальный AGENTS.md — гард не затирает. Слей их вручную: источник правды — <project>/AGENTS.md, корневой замени на указатель."
  fi
fi

# 2) ОБЁРТКИ (.claude / .codex / .cursor) должны быть в КОРНЕ. Если оказались в проекте — поднимаем.
for cfg in .claude .codex .cursor; do
  if [ -d "<project>/$cfg" ]; then
    mkdir -p "$cfg"
    cp -Rn "<project>/$cfg/." "$cfg/" 2>/dev/null
    rm -rf "<project>/$cfg"
    echo "перенёс <project>/$cfg → ./$cfg (обёртки в корень воркспейса)"
  fi
done

# 3) Указатели на правила проекта
[ -f <project>/AGENTS.md ] && ( cd <project> && [ -e CLAUDE.md ] || ln -sf AGENTS.md CLAUDE.md )  # Claude ищет CLAUDE.md
[ -L CLAUDE.md ] && rm -f CLAUDE.md
printf '@<project>/AGENTS.md\n' > CLAUDE.md                                          # корень: импорт правил
{ [ ! -e AGENTS.md ] || [ -L AGENTS.md ]; } && ln -sf <project>/AGENTS.md AGENTS.md  # корень: ярлык для Codex

# 4) Документация проекта (docs/) — внутри проекта. Если docs/ оказалась в корне — переносим/сливаем.
if [ -d docs ] && [ ! -L docs ]; then
  mkdir -p <project>/docs
  cp -Rn docs/. <project>/docs/ 2>/dev/null   # сливаем, не затирая то, что уже есть в docs проекта
  rm -rf docs
  echo "перенёс ./docs → <project>/docs"
fi
```

Если `docs/` обнаружился ещё где-то — перенеси его в `docs/` проекта так же. Цель: `AGENTS.md`, `prompts/`, `docs/` — всегда внутри проекта; `.claude/` (скиллы, хуки) — в корне воркспейса; в корне `CLAUDE.md` импортирует правила проекта.

## Шаг 2 — Проверка что проект собирается

```bash
npm run build
```

Должно завершиться без ошибок. Если есть ошибки — почини **до** перехода дальше, не нагромождай поверх сломанного.

```bash
npm run dev
# открой http://localhost:3000 — стартовая страница Next.js видна
```

## Шаг 3 — Дополнительные зависимости

Сразу ставим минимальный набор, который понадобится дальше:

```bash
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
```

Назначение:
- `class-variance-authority` (`cva`) — описывает варианты компонентов (`variant="primary"`, `size="md"`)
- `clsx` + `tailwind-merge` — утилита `cn()` для объединения классов с разрешением конфликтов
- `lucide-react` — набор иконок (shadcn использует его по умолчанию)

## Шаг 4 — Утилита `cn` в `src/shared/lib/utils.ts`

```bash
mkdir -p src/shared/lib
```

```typescript
// src/shared/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Эту функцию shadcn использует во всех компонентах. Если её нет — компоненты не работают.

## Шаг 5 — Замени стартовую страницу

Перезапиши `src/app/page.tsx` целиком следующим содержимым:

```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">Проект готов к работе</h1>
        <p className="text-sm text-gray-600">
          Дальше — DESIGN.md и UI-кит. После сборки UI-кита эта страница
          в режиме разработки будет вести на <code>/style-guide</code>.
        </p>
      </div>
    </main>
  );
}
```

Перезапиши `src/app/globals.css` — оставь только базовый слой Tailwind, демо-стили `create-next-app` (CSS-переменные для логотипов, gradient-фоны и т.д.) удали:

**Tailwind v4 (Next.js 16):**
```css
/* src/app/globals.css */
@import "tailwindcss";
```

**Tailwind v3 (Next.js 15):**
```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Шаг 6 — pnpm build scripts (если используется pnpm)

Если пользователь использует pnpm (а не npm) — pnpm по умолчанию **блокирует** build-scripts для некоторых пакетов (защита от malicious code). Если при установке `sharp`, `unrs-resolver` или похожих появилось warning — добавь в `package.json`:

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["sharp", "unrs-resolver"]
  }
}
```

Затем `pnpm install` ещё раз.

Если используется npm или yarn — пропусти этот шаг.

## Шаг 7 — Проверка (обязательно, не пропускать)

```bash
npm run dev
```

Открой `http://localhost:3000` — на экране «Проект готов к работе» по центру. Это значит Next.js, TypeScript и Tailwind работают.

В отдельной вкладке прогон сборки:

```bash
npm run build
```

Build должен пройти без ошибок и без TypeScript warning.

## Что НЕ делаем в этом промте

- ❌ Не ставим shadcn — это в промте `ui-kit.md`
- ❌ Не создаём FSD структуру (entities/features/widgets/pages) — это в `fsd-architecture.md`
- ❌ Не пишем DESIGN.md — это в `design-tokens.md`
- ❌ Не настраиваем темы / переменные / дизайн-токены — это в DESIGN.md
- ❌ Не выбираем хостинг / деплой — это отдельный этап
- ❌ Не даём create-next-app самому инициализировать git и коммитить (`--disable-git`) — git, remote и pre-commit хуки настраиваются осознанно отдельным этапом

Цель этого промта — только **скелет проекта**. Остальное по очереди.
