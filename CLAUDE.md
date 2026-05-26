@AGENTS.md

---

# AXON — Session Context

## Rules of Work

1. **One item at a time.** No batching fixes unless explicitly requested.
2. **Plan before code.** For any non-trivial change: describe what will change and where, get approval, then apply.
3. **Show diagnosis before fixing.** For bugs: quote the relevant code, state the root cause in one sentence, then propose the fix.
4. **TypeScript check before every commit.** `npx tsc --noEmit` must be clean.
5. **Commit each item separately** with a descriptive message referencing the item number.
6. **No unsolicited refactors.** Fix only what was asked. Flag adjacent issues via a note, not code.
7. **One-sentence summaries.** After each commit, one sentence describing what changed and why — no recaps.

---

## Item Status

| # | Title | Status | Commit |
|---|-------|--------|--------|
| 1 | Drag-to-reorder slides in tray | ✅ Done | `page.tsx` + `PresentationStructure.tsx` — sortable insertion-line pattern |
| 2 | "+ New Data Set" button always visible | ✅ Done | One-line fix; tray label is mode-aware ("Slides tray" / "Data set tray") |
| 3 | New dataset spawn position | ✅ Done (via Item 4B) | Anchor fixed to (600, 430), radius capped at 260px |
| 4 | Second seeded dataset + spawn anchor | ✅ Done | `ds-seed-02` "Conversion by channel" (Treemap) + `slide-seed-02`; anchor fix |
| 5 | Squarified treemap (d3-hierarchy) | ✅ Done | `ChartRenderer.tsx` + `MiniChart.tsx` — `treemapSquarify`; `@types/d3-hierarchy` installed |
| 6 | Text annotation on dataset tile | ✅ Done | kind=text insights: 3-line italic pull-quote with gold left border |
| 7 | Mode switcher relocation | ✅ Done | ModeTabs variant="bar" in toolbar right slot; floating div removed |
| 8 | Spline Area missing from dropdown | ✅ Done | `ACTIVE_CHART_TYPES` in `types.ts`: added Spline Area, reordered to 10 entries |
| 9 | Donut legend label/value overlap | ✅ Done (partial) | Fixed pixel-budget math, added two-line fallback — see open follow-ups below |
| 10 | Chart Settings panel — style + wiring | ✅ Done | PanelDropdown replaces native select (10a); filter wires to chart (10b) |
| 11 | Initial canvas seed: 3 datasets for wow effect | ✅ Done | ds-seed-01 → Map, ds-seed-03 Heatmap added; all 3 wired + slide-seed-03 |
| A–N | Phase 1 batch items (toolbar, mode switcher, tray, charts, slides) | ✅ Done | See git log — Items A through N committed on feature/disruptive-visual |
| O | Text-insight multi-connection | ✅ Done | DataSetCard 3-state + store.ts addConnection → Quote slide on text wire |
| P | Tray thumbnail color rendering | ✅ Done | MiniChart.tsx — all 10 renderers now use same GOLD/SERIES tokens as full charts |
| Q | Connection edges faint at 0.75 zoom | 🗂 Backlog | See Open Follow-Ups § Q — do not fix in Phase 1 |

**Item 8b (diagnosis):** `ins-cohort-retention` in `mockData.ts` (line 267) has `chartType: "Spline Area"` hardcoded as a seed value — it was always valid in the `ChartType` union but was never promoted into `ACTIVE_CHART_TYPES`. Not a fallback bug.

---

## Open Follow-Ups (do not fix until explicitly tasked)

### 9a — ✅ DONE: Donut center label geometry
numY/chanY computed to center number+CHANNELS pair in the donut hole.

### 9b — ✅ DONE: Donut legend tight-pair + CHANNELS visibility
Legend value now sits MIN_GAP after label text (not right-aligned to edge).
CHANNELS fill upgraded T3→T2 for better visibility across contexts.

### Q — Backlog: Connection edges faint at 0.75 zoom
Bezier connection lines between Insight and DataSet cards are faint / near-invisible at the default 0.75 zoom. They become visible when zooming in. Likely a z-order or SVG clipping issue at sub-1 scale. Do NOT fix in Phase 1.

### 9c — Donut + time-series data compatibility (data/type issue, not layout)
Values on "Monthly revenue, FY" are formatted as `820%`, `890%` etc. — the `%` suffix is hardcoded in DonutChart regardless of the column unit. Also a Donut + monthly time-series is conceptually mismatched (Donut encodes part-of-whole, not time). Flag for future: either block incompatible chart types per data shape, or strip `%` suffix when column name doesn't indicate percentage.
- File: `app/components/ChartRenderer.tsx`, line rendering `{row.values[0]}%`

### 10a — ✅ DONE: Chart Settings custom dropdowns
PanelDropdown/AccentDropdown replace native <select>; match ChartTypeDropdown style.

### 10b — ✅ DONE (Filter): Filter wired to displayRows → chart updates visually.
Status / Aggregation / Color-by / Accent persist to store; chart rendering
will consume them in Phase 2 when ChartRenderer gains accentColor + groupBy props.

### 11 spec — ✅ DONE: Three seeded datasets

### DS_W mismatch — ✅ DONE
`store.ts` DS_W corrected to 340 to match canvas card render width.

---

## Key Files

| File | Role |
|------|------|
| `lib/types.ts` | `ChartType` union + `ACTIVE_CHART_TYPES` (dropdown source of truth) |
| `lib/mockData.ts` | `INITIAL_INSIGHTS`, `INITIAL_DATASETS`, `INITIAL_SLIDES`, `INITIAL_CONNECTIONS` |
| `lib/store.ts` | Zustand store — `addDataSet` spawn logic, `seedNodePositions`, all actions |
| `app/components/ChartRenderer.tsx` | All chart renderers including `DonutChart`, `TreemapChart`, `HeatmapChart` |
| `app/components/MiniChart.tsx` | Thumbnail renderers for slide tray (`MiniTreemap`, `MiniHeatmap`, etc.) |
| `app/components/presentation/PresentationStructure.tsx` | Slide tray with sortable thumbnails |
| `app/components/ui/ChartTypeDropdown.tsx` | Chart type picker — maps over `ACTIVE_CHART_TYPES` |
| `app/page.tsx` | Root layout — DnD wiring, mode switching, drag ghost |

---

## Architecture Notes

- **Entity hierarchy:** Insight → (Connection) → DataSet → Slide
- `computeDataSetUpdate` in `store.ts` rebuilds dataset rows/columns/chartType from linked insights. NOT called at init — seed datasets must have rows hardcoded in `INITIAL_DATASETS`.
- `seedNodePositions()` places insights in a 2-column grid (cols = INS_COL_X + col * INS_COL_STRIDE) and datasets at DS_COL_X = 500 stacked vertically.
- `addDataSet` radial spawn: 8 SPOKES, ring-based. Anchor (600, 430), radius = min(260, 180 + (ring−1)*100).
- Canvas actual card width = 340px. Store DS_W = 248 (mismatch — see follow-ups).
- Heatmap: diverging GOLD→cream→NAVY color scale, global [min, max] across all cells.
- Treemap: d3-hierarchy `treemapSquarify`, both `ChartRenderer` and `MiniChart`.
- Branch: `feature/disruptive-visual`

---

## Locked Product Decisions

Do NOT revisit, "unify", or override these in Phase 2 or any refactor pass:

| Decision | Value | Reason |
|----------|-------|--------|
| Mode switcher buttons | `border-radius: 0` (square) | Intentional — matches editorial grid aesthetic |
| Chat user bubble | `border-radius: 20px` (rounded) | Deliberately different from mode switcher — conversational vs. structural |
| Insight card background | `#F3F4F6` | Fixed per design |
| All dropdowns (incl. Chart Settings) | JetBrains Mono 11px, `SURFACE_MUTED` active bg, navy text, checkmark, 2px menu radius | System-wide standard — `ChartTypeDropdown` is the reference impl; Item 10 is a known violation |
| Palette source | `references/palette-reference.png` | Single source of truth for all colors |
| Tray pagination | Replace with horizontal scroll (planned, not yet done) | Pagination is a stopgap |
| Initial canvas seed | 3 datasets: Map + Treemap + Heatmap (per Item 11) | Wow-effect on first load; do not reduce to fewer |

---

## How to resume next session

First message to Claude in the new session:
"Read CLAUDE.md. Tell me the current status and which open item to start with. 
Don't touch any code until I confirm the plan."

Suggested order for remaining work:
1. Item 6 (text annotation) — new feature, isolated
2. Item 7 (mode switcher) — biggest layout change
3. Item 7-followup: tray pagination → horizontal scroll
4. Items 9a/9b/9c — Donut polish
5. DS_W mismatch — quick cleanup
6. Phase 2 (Design System extraction) — see chat history for plan
7. Phase 3 (DS showcase at /design-system) — see chat history for plan
