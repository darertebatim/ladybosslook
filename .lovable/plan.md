

# Show All Routines on Focus Page + Support Non-Timer Tasks in Player

## What Changes

### 1. Focus Page shows ALL user routines (not just `is_focus`)
**File: `src/pages/app/AppFocusRoutines.tsx`**
- Remove `.eq('is_focus', true)` filter from the `user_routines_bank` query (line 33)
- Rename query key from `user-focus-routines` to `user-routines-all`
- Update header text from "Focus Routines" to "My Routines"
- Update empty state text accordingly

### 2. Handle non-timer tasks when building the player task list
**File: `src/pages/app/AppFocusRoutines.tsx` — `handlePlay`**
- Currently `targetSeconds` defaults to `t.goal_target || 300` (line 192), which is wrong for non-timer tasks (count goals store a count, not seconds)
- New logic:
  - If `goal_type === 'timer'` → use `goal_target` as seconds
  - If `goal_type === 'count'` or no goal → default to **300 seconds (5 min)** as an estimated duration
- Add a new field `hasTimerGoal: boolean` to the task object so the player knows whether to count down or count up

### 3. Player behavior for non-timer tasks (count-up mode)
**File: `src/hooks/useFocusRoutinePlayer.ts`**
- Add `hasTimerGoal` to the `FocusTask` interface
- Timer logic stays the same (counts down from `targetSeconds`) — no change for focus tasks
- For non-timer tasks (`hasTimerGoal === false`): the timer still counts down from the default 5 min, but when it hits 0 it just keeps going into overtime naturally (already supported). The key difference: **no alarm/notification at 0** — it's just an estimate

### 4. Player UI adaptation for non-timer tasks
**File: `src/components/app/FocusRoutinePlayer.tsx`**
- For non-timer tasks, show the time label as "~5m estimate" instead of the firm countdown range
- The progress ring still fills based on the estimated time — this is useful data for the user ("how long did this actually take me?")
- No other UI changes needed — overtime display already works

### 5. Pre-start overlay — time display for non-timer tasks
**File: `src/pages/app/AppFocusRoutines.tsx`**
- For tasks without timer goals, show "~5m" instead of exact time range
- Total routine time header shows the sum as an estimate when any non-timer tasks are present

### 6. Completion sync for non-timer tasks
**File: `src/hooks/useFocusRoutinePlayer.ts` — `saveTaskResult`**
- Already handles `goalType !== 'timer'` case (lines 189-193) — sets `goal_progress = 0` for non-goal tasks
- Fix: for tasks with NO goal (`!goalType`), insert completion with `goal_progress: 1` so the planner marks them done
- For count goals: set `goal_progress` to `goalTarget` so it counts as complete

## Summary of behavior

| Task type | Timer display | Default duration | On complete → planner |
|-----------|--------------|-----------------|----------------------|
| Timer goal | Countdown | `goal_target` seconds | `goal_progress = goal_target` |
| Count goal | Countdown (estimate) | 5 min | `goal_progress = goal_target` |
| No goal | Countdown (estimate) | 5 min | `goal_progress = 1` (marks done) |

All three types record `actual_seconds` in `routine_session_tasks` for historical data.

