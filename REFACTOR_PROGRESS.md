# Refactor progress — entities hierarchy + two modes

Branch: `refactor/entities-hierarchy`
Base:   `main` at commit `ef14c1e` (chore: save partial hero card changes)

## Done

### 1. `chore: add zustand and @dnd-kit dependencies`
`package.json` updated. Run `npm install` to pull them in.

### 2. `feat: introduce Insight/DataSet/Slide entity types`
- `lib/types.ts` — owns `ChartType`, `DataRow`, `Insight`, `DataSet`, `Slide`,
  `Connection`, `Mode`, `NodePosition`, `WorkspaceSnapshot`.
- `DataRow` gained an optional `sourceInsightId?: string` — surfaces as the
  `DATA SET` column ("INSIGHT N") in the slide editor's data table.

### 3. `feat: normalized mock data under new hierarchy`
- `lib/mockData.ts` re-exports `ChartType` and `DataRow` from `types.ts` for
  backward compatibility, then adds normalized initial state:
  `INITIAL_INSIGHTS` (6 items, 5 tabular + 1 textual), `INITIAL_DATASETS`
  (2 items), `INITIAL_SLIDES` (2 items), `INITIAL_CONNECTIONS` (6 edges).
- The legacy `CardState` and `INITIAL_CARDS` are still exported so old code
  paths keep compiling until they're rewritten.

### 4. `feat: zustand workspace store with undo/redo and modes`
- `lib/store.ts` — single `useWorkspaceStore` with normalized state, history
  snapshots, mode toggle, chat-collapse, expanded ids, node positions,
  canvas transform, and atomic mutators (`addDataSet`, `addConnection`,
  `addSlideWithDataSet`, `bindDataSetToSlide`, `updateSlide`,
  `updateInsightRows`, `updateInsightChartType`, `updateDataSetChartType`,
  etc.). Selectors `selectInsights`, `selectDataSets`, `selectSlides`,
  `selectInsightsForDataSet` are exported.
- History is per-mutation; view state (mode, drag state, positions) is
  deliberately excluded so undo doesn't reopen closed drawers.

### 5. `refactor: extract landing components from page.tsx`
- `app/components/ui/tokens.ts` — JS-side palette mirror.
- `app/components/landing/{MiniSparkline,ConfBar,ProjectCard,LandingPage}.tsx`
- The original landing logic in `page.tsx` is untouched for now — the new
  `LandingPage` component is available, but not yet imported into `page.tsx`.

### 6. `feat: InsightCard, DataSetCard, and Canvas for Data Mode`
- `app/components/ui/ModeToggle.tsx` — segmented pill (Figma-style
  Design/Dev toggle), reads/writes `mode` in the store.
- `app/components/ui/ChartTypeDropdown.tsx` — reusable, portals its
  backdrop to body to escape canvas transforms.
- `app/components/canvas/InsightCard.tsx` — 3rd-level card with kind badge
  (DATA/TEXT/SQL/CODE), payload-specific preview, no chart, output port only.
- `app/components/canvas/DataSetCard.tsx` — 2nd-level card with chart, input
  port, drag-handle wired through `@dnd-kit/core`'s `useDraggable`. Plus
  `DataSetPlaceholder` (the `+ NEW DATA SET` empty dashed slot).
- `app/components/canvas/Canvas.tsx` — full Data Mode canvas (pan, zoom,
  node drag, connection drawing, undo/redo, ModeToggle in toolbar). Reads
  everything from the store; the parent only needs to wrap it in
  `<DndContext>`.

## Remaining

### 7. `refactor: InsightExpandedView from ExpandedView; add sourceInsightId column`
- Rename `app/components/ExpandedView.tsx` → `InsightExpandedView.tsx`.
- Change props from `CardState` to `Insight` (use `insight.data.rows`,
  `insight.data.columns`, `insight.data.chartType`).
- Pass `insightsById` to `<DataTable>` so it renders the `DATA SET` column.
  (`DataTable.tsx` already accepts this prop — extended in step 6.5, see
  the partial `DataTable.tsx` edit in `/home/claude` if needed; otherwise
  re-apply the patch documented at the end of this file.)
- Wire to `useWorkspaceStore`'s `expandedInsightId`,
  `updateInsightRows`, `updateInsightChartType`, `setExpandedInsight(null)`,
  `undo`, `redo`.

### 8. `feat: DataSetExpandedView`
- New file `app/components/canvas/DataSetExpandedView.tsx`.
- Layout: header (back button, title, chart-type dropdown), aggregate chart
  on top, list of incoming insights below (use `selectInsightsForDataSet`),
  each row clickable to open that insight's expanded view.
- Smaller than `InsightExpandedView` — no editable table here; insights are
  edited in their own expanded view.

### 9. `feat: SlideEditor — Presentation Mode full-screen`
- New file `app/components/presentation/SlideEditor.tsx`.
- Layout per the wireframe `presentation_mode.png`:
  - Top ~55%: large slide card (`01 /`, title, subtitle, chart, expand
    button inside chart).
  - Middle: horizontal pair — editable data table on the left
    (~⅔ width, with `DATA SET` column showing source insight), `CHART
    SETTINGS` panel on the right (~⅓ width, 5 selects in a 3×2 grid).
  - Bottom ~25%: thumbnail strip on the left (`PRESENTATION (N)`,
    pagination 1 2 .. N), `VISUALIZATION STYLE` panel on the right
    (3 style tiles, 3 toggles, `Build Presentation` pill button).
- Reuse the existing `SettingsPanel` markup from `Presentation.tsx` —
  it's almost 1:1 what the right column needs.
- `previewSlideId` field on the store (already typed in the store as
  `activeSlideId`) selects which slide is being edited. The strip below
  changes the active slide.

### 10. `refactor: PresentationStructure with dnd-kit drop slots`
- Rewrite `app/components/Presentation.tsx` →
  `app/components/presentation/PresentationStructure.tsx`.
- Only the lower band ("Структура презентации") remains here — the
  settings panel moves into `SlideEditor`.
- Each slide thumbnail is wrapped in `useDroppable({ id: 'slide-slot:<id>' })`.
  Plus a final `+ SLIDE` placeholder that's also droppable
  (`id: 'slide-slot:new'`) — dropping there calls `addSlideWithDataSet`.
- The parent `<DndContext>` `onDragEnd` handler reads
  `event.active.data.current` (set in `DataSetCard` to
  `{ type: "dataset", dataSetId }`) and `event.over.id` to decide
  `bindDataSetToSlide(slideId, dataSetId)` vs `addSlideWithDataSet`.

### 11. `feat: Chat with hide/show toggle and squared user bubbles`
- New file `app/components/chat/ChatRail.tsx`.
- Add a chevron button in the chat header that flips `chatCollapsed` in
  the store. When `chatCollapsed === true`, the left rail collapses to
  ~40px and shows just the expand chevron.
- User message bubbles: replace `rounded-pill` with the new
  `rounded-card` (4px). Keep `rounded-pill` for primary CTAs (send button,
  Build Presentation).
- Mobile drawer: same bubble change; toggle is hidden on mobile (drawer
  has its own dismiss).

### 12. `refactor: slim down page.tsx to orchestration only`
- Replace all of `Page2`'s internal logic with:
  ```tsx
  function Page2({ onBack }: { onBack: () => void }) {
    const mode = useWorkspaceStore(s => s.mode);
    return (
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex h-screen overflow-hidden bg-bg animate-fade-in">
          <ChatRail onBack={onBack} />
          <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
            {mode === "data" ? <Canvas /> : <SlideEditor />}
            {mode === "data" && <PresentationStructure />}
          </div>
          <InsightExpandedViewOverlay />
          <DataSetExpandedViewOverlay />
        </div>
      </DndContext>
    );
  }
  ```
- `handleDragEnd` lives here (it needs both `event.active` and
  `event.over` plus access to store mutators).
- The legacy `Page1` is replaced by `<LandingPage onNavigate={...} />`.
- Anything else in `page.tsx` should be deleted.

### 13. `+ --radius-card: 4px in globals.css`
- Add `--radius-card: 4px;` to the `@theme inline` block near the
  existing radius vars. The Tailwind utility becomes `rounded-card`.

## DataTable diff to apply (step 7)

In `app/components/DataTable.tsx`, the patch adds an optional source-insight
column. The diff is small — about 30 lines added, no lines removed. The
final file at `/home/claude/Axon-app/app/components/DataTable.tsx` in this
archive shows the original (unmodified) state; the new version was prepared
but not committed because of a timing issue in the assistant's tooling.
The full new file is included as `DataTable.NEW.tsx.txt` in this archive —
rename it to replace `DataTable.tsx` and commit as part of step 7.
