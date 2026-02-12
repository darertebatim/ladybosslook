
# Fix Weekly & Challenge Ritual Scheduling

## Problem
When adding a weekly ritual (like "Ladyboss Workout Plan") to the planner, all tasks show as "Repeats every day" and "Starting from: Today" -- ignoring the weekly schedule_days configuration set in the admin. The root cause is in three places:

## Root Causes

1. **Preview label ignores schedule_days**: In `RoutinePreviewSheet.tsx`, `getTaskDisplay()` (line 152) hardcodes `repeatPattern: 'daily'` as default. While `getRepeatLabel()` does check `schedule_days`, the data flows through `display.repeatPattern` which is always `'daily'`.

2. **Edit form ignores weekly/challenge config**: `getInitialDataForEdit()` sets `scheduledDate: new Date()` (today) and `repeatPattern: 'daily'` regardless of the ritual's `scheduleType` or the task's `schedule_days`.

3. **Edited tasks override weekly logic on save**: In `useRoutinesBank.tsx` line 446, `edited?.repeatPattern || 'daily'` takes precedence. If a user clicks edit on any task, the save logic skips the weekly schedule_days mapping at line 450 because `edited.repeatPattern` is set to `'daily'`.

## Plan

### 1. Fix RoutinePreviewSheet -- getTaskDisplay()
Update `getTaskDisplay()` to derive `repeatPattern` from the ritual's `scheduleType` and the task's `schedule_days`:
- If `scheduleType === 'weekly'` and task has `schedule_days`, show the correct weekday label
- If `scheduleType === 'challenge'` and task has `drip_day`, show "Day X"
- Only fall back to `'daily'` for daily rituals

### 2. Fix RoutinePreviewSheet -- getInitialDataForEdit()
When opening the edit modal for a task inside a weekly/challenge ritual:
- For weekly rituals: set `repeatPattern` to `'weekly'` (not `'daily'`)
- For challenge rituals: set `repeatEnabled` to `false` and `repeatPattern` to `'none'`
- Don't hardcode `scheduledDate: new Date()` for challenge tasks; instead derive from drip_day

### 3. Fix useRoutinesBank.tsx -- Save Logic
Update the save mutation to not let edited task data override weekly/challenge scheduling:
- When `scheduleType === 'weekly'`, always use `'custom'` repeat_pattern with the task's `schedule_days` from the bank, regardless of what the edit form says
- When `scheduleType === 'challenge'`, always use `'none'` with the calculated drip date
- Only respect `edited.repeatPattern` for daily rituals

### 4. Fix RoutinePreviewSheet -- Edit Action Modal UI
When editing a task within a weekly ritual, either:
- Make the repeat field read-only showing the assigned weekday(s)
- Or hide the repeat/date fields entirely since they're controlled by the ritual structure

## Technical Details

### Files to modify:
- `src/components/app/RoutinePreviewSheet.tsx` -- Fix display, edit form initialization, and pass schedule context
- `src/hooks/useRoutinesBank.tsx` -- Fix save logic to prioritize ritual schedule_type over edited task data

### No database changes needed
The `routines_bank_tasks.schedule_days` data is already correct (e.g., Day1 has `[1]` for Monday, Day2 has `[2]` for Tuesday, etc.).
