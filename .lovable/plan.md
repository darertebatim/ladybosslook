

# Rearchitect: User-Owned Routines + Focus Player Sync

## You're Right

Currently when a user "adds" a routine, we only create a thin junction record in `user_routines_bank` (user_id, routine_id, is_active). The actual routine data (title, emoji, cover, tasks) is always read from the shared bank. Users don't truly own their routines.

The correct architecture:

```text
BANK (template)                    USER (owned copy)
─────────────────                  ──────────────────
routines_bank          ──copy──>   user_routines (NEW table)
  title, emoji, cover                title, emoji, cover (user's copy)
                                     source_routine_id → routines_bank.id

routines_bank_tasks    ──copy──>   user_tasks (already exists)
  task titles, emojis                source_routine_id → routines_bank.id
                                     (user can edit titles, colors, times)
```

## What Changes

### 1. Rename/replace `user_routines_bank` → `user_routines`

Expand the existing table with copied metadata fields. New columns:
- `title` (text) — copied from bank at add time
- `emoji` (text) — copied
- `cover_image_url` (text) — copied
- `category` (text) — copied
- `color` (text) — copied
- `schedule_type` (text) — copied
- `is_focus` (boolean) — copied

Keep existing columns: `user_id`, `routine_id` (now = `source_routine_id`), `is_active`, `current_step`, `completed_at`, `added_at`.

This way the table becomes a real "user's routine" — not just a bookmark.

### 2. Always set `source_routine_id` on `user_tasks`

One-line fix in `useRoutinesBank.tsx`: change `source_routine_id: scheduleType === 'project' ? routineId : null` to `source_routine_id: routineId` for ALL types.

### 3. Copy routine metadata when adding

In `useAddRoutineFromBank`, when upserting into `user_routines_bank`, also copy `title`, `emoji`, `cover_image_url`, `category`, `color`, `schedule_type`, `is_focus` from the bank routine.

### 4. Rewrite Focus Routines page to read user data

**"My Routines" list:** Query `user_routines_bank` (with new metadata columns) instead of `routines_bank` filtered by added IDs. This gives the user's own routine records with their own titles/covers.

**Task list for player:** Query `user_tasks WHERE source_routine_id = X` instead of `routines_bank_tasks`. Tasks are the user's real planner tasks.

**Completion:** Since tasks ARE `user_tasks`, completing them in the player directly creates `task_completions` with the real `user_tasks.id`. No title-matching needed.

### 5. Backfill existing data

**SQL migration** to:
- Add new columns to `user_routines_bank`
- Populate them from `routines_bank` for existing records
- Update `user_tasks.source_routine_id` for existing tasks (match by title + user's added routines)

### 6. Update all consumers

Files reading from `user_routines_bank` or cross-referencing with `routines_bank`:
- `src/pages/app/AppFocusRoutines.tsx` — main rewrite
- `src/hooks/useRoutinesBank.tsx` — add metadata to upsert
- `src/hooks/useUserChallenges.tsx` — can read from user_routines_bank directly
- `src/hooks/useChallengeDayCelebration.tsx` — same
- `src/hooks/useNewHomeData.tsx` — same
- `src/hooks/useFocusRoutinePlayer.ts` — completion uses real user_task IDs

## What This Achieves

- **User owns routines**: Copied at add time, admin changes don't affect existing users
- **User owns tasks**: Already true via `user_tasks`, now properly linked via `source_routine_id`
- **Focus player = real player**: Reads and completes actual planner tasks
- **Single source of truth**: No parallel systems, no title-matching hacks

