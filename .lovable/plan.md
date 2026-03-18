

## Rearchitect: User-Owned Routines + Focus Player Sync (Completed)

### Architecture Change
- `user_routines_bank` now stores copied metadata (title, emoji, cover_image_url, category, color, schedule_type, is_focus)
- `user_tasks.source_routine_id` is always set when adding any routine (not just projects)
- Focus Routines page reads from `user_routines_bank` + `user_tasks` — no more bank template lookups
- Player uses real `user_tasks.id` for completions — no more title-matching hacks

### Database Migrations
1. Added metadata columns to `user_routines_bank` (title, emoji, cover_image_url, category, color, schedule_type, is_focus)
2. Backfilled existing records from `routines_bank`
3. Backfilled `source_routine_id` on `user_tasks` for existing routine tasks

### Files Modified
- `src/hooks/useRoutinesBank.tsx` — Always set `source_routine_id`, copy metadata on upsert
- `src/pages/app/AppFocusRoutines.tsx` — Full rewrite: reads from user-owned data
- `src/hooks/useUserChallenges.tsx` — Uses `source_routine_id` instead of title-matching
- `src/hooks/useProjectStepUnlock.ts` — Reads routine info from `user_routines_bank`
