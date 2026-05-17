# Axon-app — refactor/entities-hierarchy branch

This archive is the Axon-app repository with the partial refactor toward the
new entity hierarchy (Insight → DataSet → Slide) and two-mode workspace
(Data Mode / Presentation Mode) applied on a feature branch.

## What's included

- Full project source on branch `refactor/entities-hierarchy`
- 7 logical commits (run `git log --oneline` to see them)
- `node_modules/` is NOT included — run `npm install` first
- The original `main` branch is intact and unmodified

## How to use

```bash
unzip Axon-app-refactor.zip
cd Axon-app
npm install
git status                       # confirms you're on refactor/entities-hierarchy
git log --oneline                # shows the 7 refactor commits at the top
npm run dev                      # boot the app to verify nothing is broken
```

To switch back to your original code: `git checkout main`.

## What's done

See `REFACTOR_PROGRESS.md` for the full status. In short:

- [x] Branch + dependencies (`zustand`, `@dnd-kit/*`)
- [x] New entity types in `lib/types.ts`
- [x] Normalized mock data
- [x] Zustand store with undo/redo, modes, chat-collapse
- [x] Landing-page extraction
- [x] InsightCard, DataSetCard, Canvas (Data Mode), ModeToggle, `+ NEW DATA SET` placeholder
- [ ] InsightExpandedView + DataSetExpandedView
- [ ] SlideEditor (Presentation Mode)
- [ ] PresentationStructure with dnd-kit drop slots
- [ ] ChatRail with hide/show toggle and squared user bubbles
- [ ] Slim `page.tsx` down to orchestration
- [ ] `--radius-card: 4px` in `globals.css`

## How to continue

Two options to finish the remaining 5 steps:

**Option A — let Claude Code finish it.**
Open the project in Claude Code (`cd Axon-app && claude`) and paste the
contents of `CLAUDE_CODE_INSTRUCTION.md` (sent in chat) as your first
message. It already knows it must keep working on this branch and continue
the commit cadence.

**Option B — keep talking with me in the chat.**
Send me a new message saying "continue", and I'll produce the remaining
files in a follow-up turn and send another zip.

## Note on the current state

The app will compile (`tsc --noEmit` is clean) but **will not run yet** —
because `page.tsx` still references the old `ExpandedView` and
`PresentationStrip`, which haven't been replaced yet. The new Canvas
component is built and ready, but it isn't wired into `page.tsx`. That
wiring is part of the "slim `page.tsx`" step that's still pending.

If you want to test the new Canvas in isolation right now, you can
temporarily replace the body of `Page2` in `app/page.tsx` with:

```tsx
import { Canvas } from "@/app/components/canvas/Canvas";
// ...
return <Canvas />;
```

But the cleaner path is to finish all remaining steps before booting.
