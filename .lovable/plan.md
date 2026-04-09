

# Creative Haptic Effects for Home Page

## Problem
Almost every interaction on the home page uses `haptic.light()` — the same flat, single pulse. This feels lifeless compared to apps like Apple Health, Things 3, or Todoist that use varied, satisfying haptic patterns.

## Plan

### 1. Add compound haptic patterns to `src/lib/haptics.ts`

Add new methods that chain multiple haptic pulses with tiny delays to create richer tactile signatures:

- **`doubleTab`** — two quick light taps (for task detail open)
- **`successBurst`** — medium + light + light rapid cascade (for task completion)
- **`softRise`** — light → medium in quick succession (for opening add-task sheet)
- **`deleteSweep`** — warning notification + heavy tap (for delete confirmation)
- **`celebrate`** — success notification + medium + light cascade (for streak/badge moments)
- **`tick`** — selection change (already exists, will use more)

### 2. Apply patterns across home page interactions

| Interaction | Current | New |
|---|---|---|
| **Task completion** (TaskCard checkbox) | `haptic.light()` | `haptic.successBurst()` |
| **Task uncomplete** | `haptic.light()` | `haptic.light()` (keep subtle) |
| **Task detail modal open** (handleTaskTap) | none | `haptic.doubleTab()` |
| **Task detail modal close** | none | `haptic.light()` |
| **Add task (sheet open)** | none currently | `haptic.softRise()` |
| **Delete task** | `haptic.light()` | `haptic.deleteSweep()` |
| **Skip task** | none | `haptic.medium()` |
| **Streak increase** | `haptic.medium()` | `haptic.celebrate()` |
| **Calendar date swipe** | `haptic.light()` | `haptic.selection()` |
| **Tab switch (Routines/Tasks/One-time)** | `haptic.selection()` | keep as-is |
| **Goal progress add (+1)** | `haptic.medium()` | `haptic.successBurst()` |
| **Subtask toggle** (TaskDetailModal) | `haptic.light()` | `haptic.selection()` |

### Files to modify
- **`src/lib/haptics.ts`** — add `doubleTab`, `successBurst`, `softRise`, `deleteSweep`, `celebrate`
- **`src/components/app/TaskCard.tsx`** — update completion, goal-add, and card-tap haptics
- **`src/pages/app/AppHome.tsx`** — update delete, streak, add-task, and detail-open haptics
- **`src/components/app/TaskDetailModal.tsx`** — update subtask toggle, complete, and close haptics

