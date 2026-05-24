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
| 6 | Text annotation on dataset tile | 🔲 Not started | Render text-insight content on the insight card in canvas |
| 7 | Mode switcher relocation | 🔲 Not started | Move pill from floating over canvas to top breadcrumb row |
| 8 | Spline Area missing from dropdown | ✅ Done | `ACTIVE_CHART_TYPES` in `types.ts`: added Spline Area, reordered to 10 entries |
| 9 | Donut legend label/value overlap | ✅ Done (partial) | Fixed pixel-budget math, added two-line fallback — see open follow-ups below |
| 10 | Chart Settings panel — style + wiring | 🔲 Not started | Dropdowns use native browser style; changing any option doesn't update chart |
| 11 | Initial canvas seed: 3 datasets for wow effect | 🔲 Not started | Map (revenue) + Treemap (conversion) + Heatmap (correlation); all connected to insights |

**Item 8b (diagnosis):** `ins-cohort-retention` in `mockData.ts` (line 267) has `chartType: "Spline Area"` hardcoded as a seed value — it was always valid in the `ChartType` union but was never promoted into `ACTIVE_CHART_TYPES`. Not a fallback bug.

---

## Open Follow-Ups (do not fix until explicitly tasked)

### 9a — Donut: CHANNELS label position (Canvas tile)
`CHANNELS` label sits inside the donut hole but touches the ring at the bottom. It should be directly below the center number with proper spacing, both visually centered as a unit in the hole.
- File: `app/components/ChartRenderer.tsx`, `DonutChart` function
- The center text is at `y={CY + 5}` and `CHANNELS` is at `y={CY + OR*0.5 + 10}` — the offset is relative to font size, not the hole boundary.

### 9b — Donut: Slides view legend spacing + CHANNELS visibility
In the Slides editor, legend labels and values are too far apart (labels far left, values far right of container). Should be a tight pair with a small fixed gap, matching the canvas tile style. Also `CHANNELS` label has too low opacity/color — barely visible in the Slides context.
- File: `app/components/ChartRenderer.tsx`, `DonutChart` — same component, different `containerWidth` from Slides view inflates the legend column.

### 9c — Donut + time-series data compatibility (data/type issue, not layout)
Values on "Monthly revenue, FY" are formatted as `820%`, `890%` etc. — the `%` suffix is hardcoded in DonutChart regardless of the column unit. Also a Donut + monthly time-series is conceptually mismatched (Donut encodes part-of-whole, not time). Flag for future: either block incompatible chart types per data shape, or strip `%` suffix when column name doesn't indicate percentage.
- File: `app/components/ChartRenderer.tsx`, line rendering `{row.values[0]}%`

### 10a — Chart Settings: native browser dropdown style (violates design system)
Filter, Aggregation, Accent dropdowns in the expanded dataset view use native browser styling — bright blue active state, system font. Must match `ChartTypeDropdown`: JetBrains Mono 11px, `SURFACE_MUTED` active bg, navy text, checkmark, 2px menu radius.
- File: wherever chart settings panel is rendered in expanded view (likely `DataSetExpandedView.tsx` or similar)

### 10b — Chart Settings: option changes don't update chart
Changing Filter / Aggregation / Accent / segmented control (All / Paid / Pending / Failed) has no visible effect on the chart. Wiring to store or local state is missing.
- Investigate which actions exist in `store.ts` and which are no-ops before fixing.

### 11 spec — Three seeded datasets
- `ds-seed-01`: "Monthly revenue, FY" → change `chartType` from `Lollipop` to `Map`
- `ds-seed-02`: "Conversion by channel" → `Treemap` (already done in item 4)
- `ds-seed-03` (new): "Metric correlation matrix" → `Heatmap`, connected to `ins-metric-correlation`
- All three visible in Data set tray on load (`slide-seed-03` also needed)
- Spec/reference screenshot will be in chat history

### DS_W mismatch (pre-existing, low priority)
`store.ts` uses `DS_W = 248` for spawn centering; `Canvas.tsx` renders dataset cards at `DS_W = 340`. New cards spawn 46px off-center horizontally. Fix: change `DS_W` in `store.ts` to `340`.

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
