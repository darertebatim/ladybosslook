

# Task Hub — Apple Reminders-Style Task Manager

## What This Is

A new "My Tasks" tool at `/app/my-tasks` that gives users a single place to see, organize, and manage ALL their tasks — not just what's scheduled for today. It uses existing `user_tasks`, `routine_categories`, and `source_routine_id` data rather than creating parallel tables.

Think of it as **Apple Reminders built on top of your existing task system**.

## Core Screens

### 1. Main Hub (List of Lists)

Top section — **Smart Lists** (auto-computed, no new tables):

| List | Logic |
|------|-------|
| 📥 **Inbox** | Tasks with no `tag` and `repeat_pattern = 'none'` and no `source_routine_id` |
| 📅 **Today** | Same filter as home planner (`taskAppliesToDate`) |
| 📆 **Scheduled** | Tasks with a `scheduled_date` or `repeat_pattern != 'none'` |
| 🚩 **Flagged** | Tasks with `is_urgent = true` |
| ✅ **Completed** | Tasks from `task_completions` (recent 30 days) |
| 📦 **All Tasks** | Everything active |

Bottom section — **Category Lists** (from `routine_categories`):
- Each category with its icon/color, showing count of tasks with matching `tag`
- "My Lists" header above them

Tapping a **routine-sourced group** shows tasks grouped by `source_routine_id` with the routine name as header, and project tasks show step labels.

### 2. List Detail View

When user taps a smart list or category:
- Shows filtered tasks as a clean checklist (Apple Reminders style)
- Swipe right → complete, swipe left → flag/delete
- Each task row: emoji, title, due date chip, flag indicator
- Tap → opens existing `TaskDetailModal`
- Floating "+" button → navigates to existing `AppTaskCreate`

### 3. Project Tasks View

Special sub-view when viewing tasks from a project routine:
- Groups tasks by step number (`project_step`)
- Shows locked steps (greyed out) vs current/completed steps
- Users can finally SEE all steps of a project, not just the current one

## Database Changes

**One new column on `user_tasks`:**
```sql
ALTER TABLE user_tasks ADD COLUMN flagged boolean NOT NULL DEFAULT false;
```

This replaces the overloaded `is_urgent` for the "Flagged" smart list (or we can just reuse `is_urgent` as-is — cleaner to keep it).

**Actually, `is_urgent` already exists and serves this purpose.** No schema changes needed for the MVP.

## No New Tables

- Smart lists = computed queries on `user_tasks`
- Category lists = `tag` field on `user_tasks` mapped to `routine_categories`
- Routine groups = `source_routine_id` on `user_tasks`
- Project steps = `project_step` on `user_tasks`

## New Files

1. **`src/pages/app/AppMyTasks.tsx`** — Main hub with smart list cards + category lists
2. **`src/components/app/TaskListView.tsx`** — Reusable filtered task list with swipe actions
3. **`src/components/app/SmartListCard.tsx`** — Count badge card for smart lists
4. **`src/hooks/useTaskHub.tsx`** — Queries for smart list counts and filtered task fetching
5. **Route** added at `/app/my-tasks`
6. **Tool config** entry added to `wellnessTools` in `toolsConfig.ts`

## UX Details

- Smart list cards in a 2-column grid (like Apple Reminders) with count badges
- Category lists below as a simple list with chevrons
- Clean white cards, SF-style rounded corners, subtle shadows
- Quick-add floating button on every list view
- Reuses existing `TaskDetailModal`, `TaskCard`, and `AppTaskCreate` — no duplication

## Implementation Order

1. Create the hub page with smart list cards (computed from `useAllActiveTasks`)
2. Create the list detail view with swipe actions
3. Add project tasks grouped-by-step view
4. Wire up routing and tool config
5. Polish the Apple Reminders visual style

