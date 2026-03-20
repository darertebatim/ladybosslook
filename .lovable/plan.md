

# Fix Pro-Task (Routine Launcher) Root Issues

## Problem
1. The routine launcher pro-task is inserted with `source_routine_id = routineId`, making it appear as a member task of the routine it launches
2. When playing a routine, tasks with `pro_link_type = 'routine'` (pointing back to routine player) are included in the play session, causing loops and wrong percentages

## Changes

### 1. Separate launcher from routine tasks at insert time
**File: `src/hooks/useRoutinesBank.tsx` (line 643)**
- Change `source_routine_id: routineId` to `source_routine_id: null` in the pro-task insert block
- This makes the launcher a standalone planner shortcut, not a routine member

### 2. Exclude routine-launcher tasks from play session
**File: `src/pages/app/AppRoutinePlayer.tsx` (line 629-631)**
- In `routineFilteredTasks`, add filter: exclude tasks where `pro_link_type === 'routine'`
- This prevents any routine-launcher task from appearing in the pre-start list or being sent to `startRoutine()`

### 3. Delete launcher alongside routine
**File: `src/pages/app/AppRoutinePlayer.tsx` (line 529-538)**
- In `handleDeleteRoutine`, add a second delete call to remove standalone launcher tasks: `pro_link_type = 'routine'` AND `pro_link_value = routine.routine_id`
- Since the launcher now has `source_routine_id = null`, the existing delete by `source_routine_id` won't catch it

### 4. Fix orphan cleanup to not delete routines with launchers only
**File: `src/pages/app/AppRoutinePlayer.tsx` (line 504-527)**
- The orphan cleanup counts tasks by `source_routine_id`. Since launcher now has `source_routine_id = null`, it won't inflate the count. This is correct behavior — a routine with only a launcher and no real tasks should be cleanable.

### 5. Fix existing bad data
- Run a data update: `UPDATE user_tasks SET source_routine_id = NULL WHERE pro_link_type = 'routine' AND source_routine_id IS NOT NULL`
- This repairs previously inserted launcher tasks

## Technical Summary
```
Before: launcher has source_routine_id = routineId → counted as routine step
After:  launcher has source_routine_id = null → standalone planner shortcut
        + routineFilteredTasks excludes pro_link_type='routine' defensively
```

