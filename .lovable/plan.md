

# Plan: User Routine Builder (Lite) — Updated

## What We're Building

A lightweight routine creation/editing flow for users, reusing existing components. Two entry points: "Create Routine" (new) and "Edit Routine" (existing routines).

## Flow

```text
Routine Player Page
├── [+ Create Routine] card
│   └── RoutineBuilderSheet (2-step wizard)
│       Step 1: Name + Emoji
│       Step 2: Add tasks (My Tasks / Bank / Create New)
│       → Tap "Create" → RoutinePreviewSheet opens
│           (with auto-generated Routine Player pro-task)
│           → Tap "Save" → routine saved to planner
│
├── [Existing Routine Card]
│   └── [Edit ✏️ button] → RoutineBuilderSheet (pre-filled, edit mode)
│       → Tap "Save" → updates routine + tasks
```

## Steps

### 1. Database: Make `routine_id` nullable on `user_routines_bank`
Allow user-created routines (no admin bank origin) to exist in the same table.

### 2. Create `RoutineBuilderSheet.tsx`
Bottom sheet with two steps:
- **Step 1**: Routine name input + emoji picker (simple grid, reuse `FluentEmoji`)
- **Step 2**: Task list builder
  - "My Tasks" tab — pick from existing `user_tasks`
  - "Suggestions" tab — pick from `admin_task_bank` templates
  - "Create New" — inline `AppTaskCreate` form
- **Create/Save button** at bottom

**Edit mode**: Accepts optional `routineId` prop. When provided, pre-fills name/emoji and loads existing tasks. Save updates instead of inserts.

### 3. On "Create" tap → Open `RoutinePreviewSheet`
After user taps "Create" in the builder:
1. Build the task list as `RoutinePlanTask[]`
2. Auto-generate the Routine Player pro-task (same logic already in `RoutinePreviewSheet` lines 114-130)
3. Open existing `RoutinePreviewSheet` with the tasks
4. User reviews, toggles tasks, taps "Save" → routine is persisted via existing `useAddRoutinePlan` flow

This reuses the exact same preview + save flow that admin bank routines use — no new save logic needed.

### 4. Add Edit button to existing routine cards
In `AppRoutinePlayer.tsx`, add a small edit (pencil) icon button on each user-created routine card. Tapping opens `RoutineBuilderSheet` in edit mode with the routine's data pre-loaded.

Only show edit for user-created routines (`routine_id IS NULL`) — admin bank routines keep their current behavior.

### 5. Wire up entry points in `AppRoutinePlayer.tsx`
- Add a "Create Routine" dashed card (+ icon) in the routines list
- State management for opening builder sheet and preview sheet
- Pass builder output into `RoutinePreviewSheet` on create

## Technical Details

**Files to create:**
- `supabase/migrations/...` — alter `user_routines_bank.routine_id` to nullable
- `src/components/app/RoutineBuilderSheet.tsx` — the 2-step builder

**Files to modify:**
- `src/pages/app/AppRoutinePlayer.tsx` — add Create card, Edit button, wire sheets
- `src/components/app/RoutinePreviewSheet.tsx` — minor: accept user-built routine data (no `routineBankId`)

**Data flow on create:**
1. Builder collects name, emoji, tasks → passes to RoutinePreviewSheet as `RoutinePlanTask[]`
2. RoutinePreviewSheet generates the pro-task automatically (existing logic)
3. User taps Save → `useAddRoutinePlan` inserts into `user_routines_bank` + `user_tasks`

**Data flow on edit:**
1. Load routine + tasks from `user_routines_bank` + `user_tasks`
2. User modifies in builder → saves updates (upsert tasks, delete removed ones)
3. No preview sheet on edit — direct save since routine already exists

