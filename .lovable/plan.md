

## Problem

The Focus Routine Player is completely disconnected from the planner's task system. When a task is completed in the player, it only writes to `routine_session_tasks` (a player-specific tracking table) but never creates `task_completions` records. This means:

1. Completing a focus routine task doesn't mark the corresponding `user_tasks` entry as done in the planner
2. The home planner still shows these tasks as incomplete
3. Streaks, presence metrics, and challenge progress are not updated

### Root Cause

The player works with `routines_bank_tasks` IDs (from the routine template), while the planner works with `user_tasks` IDs (user-specific copies). There's no bridge between them.

## Solution

### 1. Map focus routine tasks to user_tasks at play time

In `AppFocusRoutines.tsx` `handlePlay`, after fetching `routines_bank_tasks`, also fetch the user's `user_tasks` that were created from this routine. Match them by **title** (since `user_tasks` doesn't store a `routines_bank_tasks` foreign key). Store the mapping `{ taskTitle → user_task_id }` in the `FocusTask` object (new optional field `userTaskId`).

### 2. Add `userTaskId` to FocusTask interface

```ts
export interface FocusTask {
  id: string;
  title: string;
  emoji: string;
  targetSeconds: number;
  color?: string;
  userTaskId?: string; // maps to user_tasks.id for planner completion
}
```

### 3. Complete the planner task when a focus task is completed

In `useFocusRoutinePlayer.ts` `saveTaskResult`, when `status === 'completed'` and the task has a `userTaskId`, insert into `task_completions` (same logic as `useCompleteTask`). This includes:
- Inserting into `task_completions` with today's date
- Calling streak/presence update functions (or simply invalidating queries and letting the existing logic handle it)

Since importing the full `useCompleteTask` mutation inside the hook is awkward, the simplest approach is to:
- Accept a callback `onTaskCompleted?: (userTaskId: string) => void` in the player config
- Or directly insert into `task_completions` from within `saveTaskResult` and invalidate relevant queries

### 4. Wire up the query invalidation

After inserting `task_completions`, invalidate:
- `planner-completions`
- `planner-completed-dates`
- `planner-streak`
- `new-home-data`

### 5. Fetch user_tasks mapping in handlePlay

```ts
// In handlePlay, after getting routines_bank_tasks:
const { data: userTasks } = await supabase
  .from('user_tasks')
  .select('id, title')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .eq('tag', routine.category); // or match by routine association

// Build title→id map
const titleToUserTaskId = new Map<string, string>();
(userTasks || []).forEach(ut => titleToUserTaskId.set(ut.title, ut.id));

// Enrich FocusTask objects
const tasks = data.map(t => ({
  ...existingMapping,
  userTaskId: titleToUserTaskId.get(t.title) || undefined,
}));
```

### 6. Handle the reverse — uncomplete on skip

When a task is skipped in the player, no `task_completions` record should be created (current behavior is fine).

### Files to modify

- **`src/hooks/useFocusRoutinePlayer.ts`** — Add `userTaskId` to `FocusTask`, insert `task_completions` in `saveTaskResult` when completed, invalidate planner queries
- **`src/pages/app/AppFocusRoutines.tsx`** — Fetch matching `user_tasks` during `handlePlay` and populate `userTaskId` on each `FocusTask`

