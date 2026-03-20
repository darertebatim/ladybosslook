

# Fix Routine Card Emojis & Completion % Bugs

## Root Cause

There are two parallel queries for routine tasks, and they use **different** filters:

- `routineTasksMap` (emojis): `.or('pro_link_type.is.null,pro_link_type.neq.routine')` — correct, includes pro-linked member tasks
- `userTasksByRoutine` (completion %): `.is('pro_link_type', null)` — **wrong**, excludes ALL pro-linked member tasks (breathe, mood, journal, etc.)

This means:
- Routines with only pro-linked member tasks show **no emojis** (they do now after our fix) but get **wrong completion %** (either null or 100% when it shouldn't be)
- The completion calculation silently ignores tasks like "Mood Check-in" or "Take 5 Calm breaths" if they have `pro_link_type` set

## Changes

### 1. Fix `userTasksByRoutine` query filter
**File: `src/pages/app/AppRoutinePlayer.tsx` (~line 427)**

Change:
```
.is('pro_link_type', null)
```
To:
```
.or('pro_link_type.is.null,pro_link_type.neq.routine')
```

This mirrors the fix already applied to `routineTasksMap`, ensuring pro-linked member tasks (breathe, mood, journal) are counted for completion tracking while still excluding routine-launcher tasks.

### 2. Verify Calendar+ flow is correct
The Calendar+ button already creates a `pro_link_type: 'routine'` launcher task and opens the RoutinePreviewSheet. No change needed here — it already works as the user described.

## Technical Summary
```
userTasksByRoutine filter:
  Before: .is('pro_link_type', null)         → misses breathe/mood/journal tasks
  After:  .or('pro_link_type.is.null,...')    → includes all except routine launchers
```

One-line fix. Completion percentages and emoji display will be consistent.

