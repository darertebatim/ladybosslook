
# Plan: Create Routines Bank with Task Selection

## Overview
Add a "Routines Bank" tab to /admin/tools that allows managing routine templates (routine_plans). Additionally, enable multi-select in the Tasks Bank to create routines from selected tasks.

## Database Changes

### 1. Add source_task_id to routine_plan_tasks
Link routine tasks back to their source in admin_task_bank:

```sql
ALTER TABLE routine_plan_tasks 
ADD COLUMN source_task_id uuid REFERENCES admin_task_bank(id) ON DELETE SET NULL;
```

This allows tracking which bank task was used to create each routine task.

## UI Changes

### 1. Add "Routines Bank" Tab to Tools.tsx
Add a new tab alongside "Routines", "Tasks Bank", and "Breathing":
- Tab with Layers icon labeled "Routines Bank"
- This will be a simplified routine management focused on creating/editing routine templates

### 2. Create RoutinesBank Component
New component at `src/components/admin/RoutinesBank.tsx`:

**Features:**
- List of routine_plans with card-based view (similar to Tasks Bank)
- Quick toggles for is_popular, is_active
- Create/Edit dialog with:
  - Title, subtitle, description
  - Cover image URL
  - Category selection (from routine_categories)
  - Color picker
  - Emoji picker for icon
- Inline task management:
  - Add tasks from admin_task_bank via searchable picker
  - Reorder tasks with drag-and-drop
  - Edit task duration
  - Add section headers (routine_plan_sections)
- Duration auto-calculated from task durations

### 3. Add Multi-Select to Tasks Bank
Enhance TasksBank.tsx:

**Selection Mode:**
- Add checkbox column to each task row
- "Select Mode" toggle button
- Selection counter badge
- "Create Routine" button (appears when tasks selected)

**Create Routine Flow:**
1. User selects multiple tasks
2. Clicks "Create Routine" button
3. Dialog opens with:
   - Name input (required)
   - Category selector
   - Tasks preview (ordered by selection)
4. Creates new routine_plan and links tasks via routine_plan_tasks

## Technical Details

### File Changes

**src/pages/admin/Tools.tsx**
- Add "Routines Bank" tab trigger with Layers icon
- Add TabsContent that renders RoutinesBank component

**src/components/admin/RoutinesBank.tsx** (new file)
- Query routine_plans with category join
- Query routine_plan_tasks for each plan
- CRUD mutations for plans
- Task picker that queries admin_task_bank
- Create tasks from bank items (copy title, icon, duration)

**src/pages/admin/TasksBank.tsx**
- Add selection state: `selectedTaskIds: Set<string>`
- Add checkbox UI on each task row
- Add "Create Routine" floating action button
- Add CreateRoutineDialog component
- Mutation to create routine_plan with tasks

### UI Layout for Routines Bank

```text
┌─────────────────────────────────────────────────────────┐
│ Routines Bank                            [+ New Routine]│
├─────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                │
│ │ All │ │Focus│ │Calm │ │Care │ │Grow │ ...             │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  │
│ │ ☀️ Morning Mindfulness    ⭐ 👁 ✏️               │  │
│ │ 15 min • Focus • 3 tasks                          │  │
│ └───────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────┐  │
│ │ 🌙 Evening Wind Down      👁 ✏️                   │  │
│ │ 10 min • Calm • 4 tasks                           │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Tasks Bank with Selection Mode

```text
┌─────────────────────────────────────────────────────────┐
│ Tasks Bank                     [Select] [+ Add Task]    │
├─────────────────────────────────────────────────────────┤
│ ☑ 3 selected         [Create Routine]  [Clear]         │
├─────────────────────────────────────────────────────────┤
│ ☑ ☀️ Morning stretch        ⭐ 👁 ⚙️ 🗑️ >          │
│ ☑ 🧘 Meditation             ⭐ 👁 ⚙️ 🗑️ >          │
│ ☐ ☕ Make coffee            ⭐ 👁 ⚙️ 🗑️ >          │
│ ☑ 📝 Journal                ⭐ 👁 ⚙️ 🗑️ >          │
└─────────────────────────────────────────────────────────┘
```

## Implementation Order

1. **Database migration** - Add source_task_id column
2. **Create RoutinesBank.tsx** - Basic CRUD for routine_plans
3. **Add to Tools.tsx** - New tab with RoutinesBank
4. **Add task management to RoutinesBank** - Task picker, inline editing
5. **Add multi-select to TasksBank.tsx** - Checkboxes, selection state
6. **Create routine dialog in TasksBank** - Link selected tasks to new routine
7. **Test end-to-end**
