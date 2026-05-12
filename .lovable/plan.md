# Restore Original Coin Badge Logic

## Goal
Bring back the original badge tier rules:
- **Bronze** — at least 1 task completed
- **Silver** — 50% or more completed
- **Gold** — 100% completed (all applicable tasks done)

And make sure the count is based only on planner-level tasks, excluding routine-player child tasks and program event tasks.

## Changes

### 1. `src/hooks/useWeeklyTaskCompletion.tsx`

**`calculateBadgeLevel(completed, total)`** — replace absolute thresholds with percentage logic:
- `total === 0 || completed === 0` → `none`
- `completed >= total` → `gold`
- `completed / total >= 0.5` → `silver`
- otherwise → `bronze`

**Filter `dayTasks`** in both `useWeeklyTaskCompletion` and `useDateRangeTaskCompletion` to skip routine-player child tasks. Add a guard alongside the existing `taskAppliesToDate` / `skippedTaskIds` filter:
```ts
const dayTasks = tasks.filter((task) =>
  !task.source_routine_id &&         // exclude routine-player children
  !skippedTaskIds.has(task.id) &&
  taskAppliesToDate(task, dateStr)
);
```
The routine *launcher* task (the planner row with `pro_link_type === 'routine'`) is kept and continues to count as one task that completes when the routine is fully done — so routines are still represented exactly once in the day's denominator.

`buildRoutineTasksByRoutine` and the routine-completion-from-task-completions logic stay as-is, since they need access to all routine child tasks to detect when a routine launcher is fully completed.

### 2. Event tasks
Verified: program events are not stored in `user_tasks` and never enter this hook, so no change needed. They are already excluded.

### 3. Memory update
Update `mem://features/gamification/gold-badge-eligibility-rules` to reflect the reverted percentage-based rules and the routine-child-task exclusion.

## Files Touched
- `src/hooks/useWeeklyTaskCompletion.tsx`
- `mem://features/gamification/gold-badge-eligibility-rules`

## Out of Scope
- No UI changes (coin images, calendars, celebrations all read from `badgeLevel` and stay the same).
- No changes to celebration trigger thresholds in `useBadgeCelebration` beyond what naturally follows from the new `badgeLevel` values (gold/silver still fire on level changes; the "almost gold = 2 done" branch will simply rarely fire on small days, which matches the old behavior).
