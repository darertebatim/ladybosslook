

# Full Focus Player Re-Architecture: What's Actually Broken

## Investigation Results

The database confirms completions ARE being created from `AppFocusRoutines.tsx` — the `userTaskId` mapping works there. **But there are 4 broken pieces** that make the system feel disconnected:

## Problem 1: AppInspireDetail "Start Routine" — NO planner sync

`src/pages/app/AppInspireDetail.tsx` lines 610-621: The "Start Routine" button on the routine detail page passes `routines_bank_tasks` IDs (template IDs) instead of `user_tasks` IDs. No `userTaskId` is set, so `saveTaskResult` in `useFocusRoutinePlayer.ts` (line 184) skips creating `task_completions` entirely.

**Fix**: Fetch user's `user_tasks` by `source_routine_id` and use those IDs, same as `AppFocusRoutines` does.

## Problem 2: Focus page progress — wrong data source

`AppFocusRoutines.tsx` `getCompletionInfo()` (lines 111-118) reads from `routine_sessions.tasks_completed` — a session-level counter that doesn't reflect actual planner state. If user completed tasks from the home planner directly, this wouldn't update. And vice versa.

**Fix**: Replace `getCompletionInfo` to query `task_completions` for today, matched against `user_tasks` with `source_routine_id`. This gives real planner-synced progress.

## Problem 3: useChallengeDayCelebration — still uses bank task titles

`src/hooks/useChallengeDayCelebration.tsx` lines 66-76: Still fetches `routines_bank_tasks` titles and matches them by title against planner tasks. Should use `user_tasks` with `source_routine_id` instead.

**Fix**: Replace the `routines_bank_tasks` query with a `user_tasks` query filtered by `source_routine_id`, matching by task ID instead of title.

## Problem 4: Pre-start overlay checkmarks — uses session data, not planner data

The pre-start overlay (lines 85-109) checks `routine_session_tasks` for completed titles of incomplete sessions. Should also check `task_completions` for today to show which tasks the user already completed in the planner directly.

**Fix**: Query today's `task_completions` for the routine's `user_tasks` and pre-mark them as done.

## Implementation Plan

### File 1: `src/pages/app/AppInspireDetail.tsx`
- Replace the "Start Routine" button handler to fetch `user_tasks` by `source_routine_id = planId` instead of using `routine.tasks`
- Pass `userTaskId: userTask.id` for each task
- If no user_tasks found (not added yet), show toast "Add routine first"

### File 2: `src/pages/app/AppFocusRoutines.tsx`
- Replace `getCompletionInfo` to use `task_completions` data instead of `routine_sessions`
- Add a new query: fetch today's `task_completions` for all focus routine task IDs
- Compute completion % as: completedTaskIds / totalTasksInRoutine
- Remove the `todaySessions` query dependency for progress display (keep for resume logic only)
- Update pre-start overlay to also check `task_completions` for today

### File 3: `src/hooks/useChallengeDayCelebration.tsx`
- Replace `routines_bank_tasks` query with `user_tasks WHERE source_routine_id IN (challenge routine IDs)`
- Match completion by task ID instead of title

### File 4: `src/hooks/useFocusRoutinePlayer.ts`
- No changes needed — `saveTaskResult` already correctly uses `userTaskId` and creates `task_completions`. The `queryClient.invalidateQueries` calls are also correct.

### No database changes needed
All data structures are already in place. The issues are purely in which data source the UI reads from.

