# Action History Implementation — Checkpoints

## Goal

1. Every Delete button opens a centered modal: "Are you sure you want to delete?" with Cancel + Delete buttons. Modal floats above everything else.
2. Confirming Delete executes the action and pops a circular Undo button in the bottom-right for 5 seconds.
3. Stack-based history of all user actions that mutate character/data state, with undo + redo support.

## Architecture (chosen)

**Files to add:**
- `src/pages/FabU/historyAtoms.ts` — jotai in-memory atom holding `{ past: Character[]; future: Character[] }`
- `src/pages/FabU/useCharacterHistory.ts` — hook that wraps `useAtom(characterState)` + history atom. Returns `[character, setCharacter, { undo, redo, canUndo, canRedo }]`.
- `src/components/fab-u/atoms/ConfirmDeleteModal.tsx` — MUI Dialog, centered, "Are you sure you want to delete?" + Cancel/Delete.
- `src/components/fab-u/atoms/UndoSnackbar.tsx` — circular FAB bottom-right, 5s timeout, Fade in/out.
- `src/pages/FabU/ActionsContext.tsx` — context + provider exposing `confirmDelete(fn)` + `undo/redo`. Renders modal + snackbar.

**FabU.tsx changes:**
- Replace `const [character, setCharacter] = useAtom(characterState)` with `const [character, setCharacter, history] = useCharacterHistory()`.
- Wrap rendered output in `<ActionsProvider history={history}>`.
- Wrap each of these delete handlers in `confirmDelete(() => ...)`:
  - `removeBond(id)` — line 664
  - `removeClass(index)` — line 671
  - `handleDeleteSkill(className, skillName)` — line 866
  - `handleDeleteSpell(className, spellName)` — line 907
  - `handleDeleteEquipment(index)` — line 943
  - `handleDeleteBackpackItem(index)` — line 960

## State setter pattern

All mutations are `setCharacter((c) => ({ ...c, ...next }))` — pure functional updater. Wrapping the setter to commit to history is straightforward: compute next, push prev to past, set future = [].

## Existing primitives

- MUI Dialog used in `src/sections/HotKeys/HotKeys.tsx`
- Custom toast pattern uses `<Fade>` from MUI with `setTimeout` (see `notEnoughMpToastOpen` in FabU.tsx:582)

## Progress

- [x] Created this checkpoints file
- [x] Explored codebase: delete sites + state shape
- [x] Designed action history architecture
- [x] Implemented useCharacterHistory hook (`src/pages/FabU/useCharacterHistory.ts`)
- [x] Built ConfirmDeleteModal atom (`src/components/fab-u/atoms/ConfirmDeleteModal.tsx`)
- [x] Built UndoSnackbar atom (`src/components/fab-u/atoms/UndoSnackbar.tsx`)
- [x] Inlined confirm/undo state directly in FabU (skipped ActionsContext for simplicity)
- [x] Wired all 6 delete handlers in FabU.tsx through `confirmDelete(...)`
- [x] Added Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z (redo) keyboard shortcuts
- [x] All setCharacter calls go through the wrapped setter → every mutation pushes to history
- [x] Build + typecheck + lint passing

## Implementation summary

**`src/pages/FabU/useCharacterHistory.ts`** — hook that wraps `useAtom(characterState)` with an in-memory jotai `characterHistoryState` atom holding `{ past, future }` (max depth 100). Returns `[character, setCharacter, { undo, redo, canUndo, canRedo, clear }]`. The wrapped `setCharacter` pushes prev to past and clears future on every commit. `undo`/`redo` move snapshots between the stacks.

**`src/components/fab-u/atoms/ConfirmDeleteModal.tsx`** — MUI Dialog with "Are you sure you want to delete?" centered title, Cancel (outlined) and Delete (filled danger red) full-width buttons in a row. Themed with FabU tokens. Closes on backdrop click via `onClose={onCancel}`.

**`src/components/fab-u/atoms/UndoSnackbar.tsx`** — Circular MUI IconButton (56×56) in fixed bottom-right (right: 20, bottom: 24), brand-green background, Undo2 icon from lucide-react. Auto-dismisses after 5s. Uses `<Fade>` with 200ms transition.

**`src/pages/FabU/FabU.tsx`** changes:
- Imports `useCharacterHistory` + `ConfirmDeleteModal` + `UndoSnackbar`
- Replaces `useAtom(characterState)` with `useCharacterHistory()`
- Adds `pendingDelete`/`undoOpen` state + `confirmDelete(fn)` helper
- Adds `useEffect` keyboard listener for Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z (skipped in inputs)
- Wraps each of the 6 delete handlers in `confirmDelete(() => ...)`:
  - removeBond, removeClass, handleDeleteSkill, handleDeleteSpell, handleDeleteEquipment, handleDeleteBackpackItem
- Renders `<ConfirmDeleteModal>` + `<UndoSnackbar>` at the bottom of the FabUThemeProvider tree

## Resume info (if usage cuts off)

If picked up later, the work is **complete and built**. Remaining: commit + push + report Vercel URL + usage.

Branch: `claude/ui-polish-2`. PR #18. Files modified:
- `src/pages/FabU/FabU.tsx`
- `src/pages/FabU/useCharacterHistory.ts` (NEW)
- `src/components/fab-u/atoms/ConfirmDeleteModal.tsx` (NEW)
- `src/components/fab-u/atoms/UndoSnackbar.tsx` (NEW)
- `src/components/fab-u/atoms/index.ts`
- `src/components/fab-u/molecules/SkillsTable.tsx` (header gray)
- `src/components/fab-u/molecules/SpellsTable.tsx` (header gray)

