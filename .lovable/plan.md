
Root cause (why it’s empty)
- You were right: focus routines are being added to `user_routines_bank`, but not appearing in `/app/focus` because the parent Pro task insert is failing.
- I checked DB constraints: `user_tasks_pro_link_type_check` (and similar constraints on related tables) do not allow `'focus_routine'` (or `'focus_timer'`), so inserts are rejected.
- Frontend then masked this because the focus-parent insert error in `useAddRoutineFromBank` is currently not handled strictly.

What I will implement
1) Database fix (primary blocker)
- Add a migration to update `pro_link_type` check constraints on:
  - `public.user_tasks`
  - `public.routine_plan_tasks`
  - `public.admin_task_bank`
- Include `'focus_timer'` and `'focus_routine'` in allowed values.

2) One-time data repair (so your existing added routines appear immediately)
- In the same migration, backfill missing parent focus Pro tasks for existing active focus routines:
  - source: `user_routines_bank` + `routines_bank(is_focus=true)`
  - create `user_tasks` rows with `pro_link_type='focus_routine'`, `pro_link_value=routine_id`, default repeat/schedule fields.
- Prevent duplicates with `NOT EXISTS` check.

3) Frontend hardening (to prevent silent failures again)
- `src/hooks/useRoutinesBank.tsx`
  - Handle and log parent-focus-task insert errors explicitly (no silent pass).
  - Keep existing goal calculation, ensure parent row creation is validated.
- `src/pages/app/AppFocusRoutines.tsx`
  - Remove debug-only logging.
  - Keep backfill safety net but make retry behavior safer.
  - Filter out malformed rows (`pro_link_value` null) so invalid links don’t render as broken cards.

4) Pro-link UX cleanup for Focus Routine option
- `src/pages/app/AppTaskCreate.tsx`
  - Fix the currently incomplete “Focus Routine” Pro-link selection path (it currently requires a value but has no picker flow).
  - Minimal safe option: add a routine picker for focus routines (or temporarily hide this option until picker exists, depending on your preference).

Validation checklist
- Add a new focus routine → corresponding `user_tasks` parent row with `pro_link_type='focus_routine'` is created.
- Open `/app/focus` → routine appears under “Your routines” (with schedule and emoji chain).
- Tap card → opens existing task detail modal (`/app/home/edit/:taskId`), edit repeat/time, return to `/app/focus`, values reflect.
- Existing previously-added focus routines now appear after backfill.

Technical details
- Confirmed evidence: recent rows exist in `user_routines_bank` for your user with `is_focus=true`, while `user_tasks` has zero rows with `pro_link_type='focus_routine'`.
- Constraint currently blocks the exact value used by code:
  - Code inserts `'focus_routine'`
  - DB check allows only older list up to `'video_playlist'`
- This is a schema drift bug (frontend updated, DB constraint not updated).
