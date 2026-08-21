# Editable Protein Shortcuts

Make the quick-add buttons in the Add Protein sheet specific, accurate, and user-editable.

## 1. Better default shortcuts

Replace the vague defaults with clear, portion-specific ones:

- Egg (1 large) — 6g
- Greek yogurt (170g cup) — 17g
- Whey (1 scoop) — 25g
- Chicken breast (½, ~85g) — 27g
- Chicken thigh (1, ~85g) — 21g
- Chicken wings (2) — 12g
- Tuna (1 can, drained, 142g) — 30g
- Cottage cheese (½ cup) — 14g
- Protein bar (1) — 20g
- Tofu (½ cup firm) — 10g

Each button shows a short label plus grams; the full portion description shows on the edit screen so the numbers are never ambiguous.

## 2. User-editable shortcuts

- Long-press (or an "Edit" pencil in the sheet header) puts the grid into edit mode.
- Users can: rename a shortcut, change its grams, delete it, reorder is out of scope for now.
- An "+ Add" tile lets users create their own shortcut (name + grams + optional emoji/icon).
- A "Reset to defaults" action restores the built-in list.
- Shortcuts are per-user and sync across devices; if a user has never customised anything, they see the defaults.

## 3. Same pattern for Water (optional, same code path)

The Water sheet uses the same preset mechanism, so the editing UI will be built generically and can be turned on for water shortcuts (oz amounts) with no extra work.

## Technical notes

- New table `public.user_quick_presets`: `id`, `user_id`, `tool` (`protein` | `water`), `label`, `amount` (numeric), `icon` (text, lucide key or emoji), `sort_order`, `created_at`. RLS: user can select/insert/update/delete only their own rows; grants for `authenticated` + `service_role`.
- New hook `useQuickPresets(tool)` (React Query) returning defaults when the user has no rows, plus mutations for create/update/delete/reset.
- `src/lib/proteinTracking.ts`: update `PROTEIN_PRESETS` to the new default list including chicken thigh/wings and explicit portion text.
- `src/components/app/ProteinInputSheet.tsx`: render presets from the hook, add edit mode, add-tile, and a small `PresetEditSheet` for name/grams entry (reuses the existing keypad styling).
- Grid stays `grid-cols-4`, scrolls vertically if the user adds more than 8.
