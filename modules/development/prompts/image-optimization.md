# Настройка оптимизации изображений

> Универсальный модуль библиотеки. Происхождение: курс vibecoding, урок 02 (обезличено 2026-07-04).

Цель: один раз настроить автоматическую оптимизацию картинок — чтобы они автоматически сжимались, конвертировались в WebP/AVIF и мобилка никогда не грузила десктопный файл.

## Зачем это нужно

Без настройки:
- Оригинальные JPG/PNG могут весить 5–20 МБ — медленная загрузка, плохой LCP
- Мобилка грузит ту же картинку что десктоп — трафик × 4–5 впустую
- Git-репо раздувается большими бинарными файлами

После настройки:
- Любая картинка при коммите автоматически сжимается до нормального размера
- Браузер получает WebP или AVIF — в 2–4 раза меньше JPG
- Мобилка грузит маленькую версию, десктоп — большую

---

## Шаг 1 — Установить sharp

```bash
# npm
npm install sharp

# pnpm
pnpm add sharp
```

`sharp` — C++ библиотека обработки изображений (libvips). Именно её использует `next/image` под капотом. Без неё Next.js оптимизирует медленно.

---

## Шаг 2 — Настроить next.config.ts

```
Прочитай next.config.ts (или next.config.js).
Добавь в раздел images:
- formats: ['image/avif', 'image/webp']
- deviceSizes под breakpoints проекта (из spec.md или DESIGN.md)
- minimumCacheTTL: 31536000

Пример для обычного лендинга (desktop 1440 + mobile 375):
  deviceSizes: [375, 480, 768, 1024, 1440, 1920, 2560]
  imageSizes: [16, 32, 64, 128, 256]

Если breakpoints в проекте другие — подстрой под них.
```

---

## Шаг 3 — Добавить скрипт оптимизации

```
Создай файл scripts/optimize-images.js

Скрипт должен:
- Принимать аргумент: папка (по умолчанию public/) или один файл
- Принимать флаг --dry-run (только показать, не менять)
- Для каждого JPG/PNG (рекурсивно):
  - Пропустить файлы < 100 КБ (уже маленькие)
  - Сжать JPG: resize max 2560px, quality 82, progressive, mozjpeg
  - Сжать PNG: resize max 2560px, strip metadata
  - Перезаписать оригинал
  - Показать: имя файла + размер до + размер после + процент экономии

Использует: require('sharp'), fs, path. CommonJS, не ESM.

Добавь в package.json scripts:
  "images:opt": "node scripts/optimize-images.js public",
  "images:opt:dry": "node scripts/optimize-images.js public --dry-run"
```

Проверь что скрипт работает:
```bash
node scripts/optimize-images.js public --dry-run
```

---

## Шаг 4 — Авто-сжатие staged-картинок через git pre-commit хук

Сжимать staged-картинки удобно автоматически через git pre-commit хук — тогда ни одна тяжёлая картинка не попадёт в репозиторий.

```
Создай scripts/optimize-staged-images.sh:
- получить staged картинки: git diff --cached --name-only --diff-filter=AM | grep -iE '\.(jpe?g|png)$'
- для каждой: node scripts/optimize-images.js <путь>
- re-stage: git add <путь>
- если node не найден — warn и exit 0 (не ломать коммит)
chmod +x scripts/optimize-staged-images.sh
```

Встрой вызов в pre-commit хук проекта (`scripts/hooks/pre-commit` или `.git/hooks/pre-commit` — в тот же хук, где живут остальные проверки перед коммитом, например спека-гейт; один pre-commit на проект). Вставь в **начало** хука строку `sh scripts/optimize-staged-images.sh` — и сжатие пойдёт автоматически на каждом коммите. Если git в проекте ещё не инициализирован — сжимай вручную: `npm run images:opt`, а хук подключи как только появится git.

---

## Шаг 5 — Первый прогон по всем изображениям

Сжимает все существующие картинки в `public/`:

```bash
node scripts/optimize-images.js public
```

Покажи пользователю результат: сколько файлов, сколько места сэкономлено.

---

## Шаг 6 — Обновить все `<Image>` компоненты

`next/image` может отдавать неправильный размер мобилке если не указан `sizes`:

```
Проверь все использования <Image> в src/
Для каждого без пропа sizes — добавь правильный:

- Изображение во всю ширину экрана: sizes="100vw"
- Изображение в половину экрана: sizes="(max-width: 768px) 100vw, 50vw"
- Карточка в гриде 3-col: sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
- Hero-изображение: добавь также проп priority (влияет на LCP)

Правило: sizes должен описывать РЕАЛЬНУЮ ширину контейнера на каждом breakpoint.
```

---

## После выполнения

Добавь в `docs/memory/state.md`:
```
## Оптимизация изображений — Настроена
- sharp установлен
- next.config.ts: avif/webp форматы, deviceSizes под проект
- scripts/optimize-images.js — pre-compress source files
- scripts/optimize-staged-images.sh — подключён в pre-commit (или готов к подключению, если git ещё не инициализирован)
- Первый прогон: X файлов оптимизировано, сэкономлено Y МБ
```

## Чеклист

- [ ] `sharp` установлен (есть в package.json dependencies)
- [ ] `next.config.ts` содержит `formats: ['image/avif', 'image/webp']` и `deviceSizes`
- [ ] `scripts/optimize-images.js` создан и работает (`--dry-run` показывает файлы)
- [ ] `scripts/optimize-staged-images.sh` создан и встроен в pre-commit хук (или готов к подключению)
- [ ] Первый прогон `node scripts/optimize-images.js public` завершён
- [ ] Все `<Image>` компоненты имеют проп `sizes`
- [ ] Hero-изображения имеют проп `priority`
