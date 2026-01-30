

# Plan: Create NEW Routines Bank System

## Overview
Build a completely new **Routines Bank** feature from scratch at `/admin/tools` with dedicated database tables. This is separate from the existing routine_plans system.

## Database Changes

### 1. Create New `routines_bank` Table
A new table to store routine templates:

```sql
CREATE TABLE routines_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  cover_image_url text,
  category text NOT NULL DEFAULT 'general',
  color text DEFAULT 'yellow',
  emoji text DEFAULT '✨',
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Create `routines_bank_tasks` Table
Links tasks from admin_task_bank to routines, with section support:

```sql
CREATE TABLE routines_bank_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines_bank(id) ON DELETE CASCADE,
  task_id uuid REFERENCES admin_task_bank(id) ON DELETE SET NULL,
  title text NOT NULL,
  emoji text DEFAULT '☀️',
  duration_minutes integer DEFAULT 1,
  section_title text,  -- Optional section header before this task
  task_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 3. RLS Policies
Standard admin-only policies for both tables.

## UI Components

### 1. Add "Routines Bank" Tab to Tools.tsx
- New tab with Layers icon
- Renders `RoutinesBank` component

### 2. Create `RoutinesBank.tsx` Component
Location: `src/components/admin/RoutinesBank.tsx`

**Features:**
- Card-based list of routines (like Tasks Bank style)
- Category filter tabs (reuse routine_categories)
- Quick toggles: Popular (star), Active (eye)
- Each card shows: Emoji, Title, Duration (sum of tasks), Category, Task count

**Create/Edit Dialog:**
- Title (required)
- Subtitle (optional)
- Description (optional)
- Cover Image URL (optional)
- Category dropdown
- Color picker
- Emoji picker

**Task Management (inline in edit view):**
- List of tasks in the routine
- Add task button with searchable picker (from admin_task_bank)
- Reorder tasks with drag handles
- Add section header before any task
- Remove task button
- Duration auto-calculated

### 3. Enhance TasksBank.tsx with Multi-Select

**New UI Elements:**
- "Select" toggle button in header
- Checkbox on each task row when in select mode
- Selection counter bar: "X selected" with "Create Routine" and "Clear" buttons

**Create Routine Dialog (from selection):**
- Name input (required)
- Category dropdown
- Preview of selected tasks (ordered)
- Creates new routine in routines_bank with linked tasks

## File Changes

```text
src/pages/admin/Tools.tsx
├── Add "Routines Bank" tab trigger (Layers icon)
└── Add TabsContent rendering RoutinesBank

src/components/admin/RoutinesBank.tsx (NEW)
├── Query routines_bank with tasks count
├── Category filter tabs
├── Routine cards with quick toggles
├── Create/Edit dialog with form
└── Task management section

src/pages/admin/TasksBank.tsx
├── Add selection mode state
├── Add checkbox column UI
├── Add selection bar with counter
├── Add Create Routine dialog
└── Mutation to create routine from selected tasks
```

## UI Wireframes

### Routines Bank Tab

```text
┌─────────────────────────────────────────────────────────┐
│ Routines Bank                            [+ New Routine]│
├─────────────────────────────────────────────────────────┤
│ [All] [Focus] [Calm] [Self-Care] [Productivity] ...     │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐   │
│ │ ✨ Morning Energy Boost         ⭐ 👁 ✏️ 🗑️      │   │
│ │    15 min • Focus • 5 tasks                       │   │
│ └───────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🌙 Evening Wind Down               👁 ✏️ 🗑️      │   │
│ │    10 min • Calm • 4 tasks                        │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Routine Edit Dialog

```text
┌─────────────────────────────────────────────────────────┐
│ Edit Routine                                     [X]    │
├─────────────────────────────────────────────────────────┤
│ Title: [Morning Energy Boost____________]               │
│ Subtitle: [Start your day right_________]               │
│ Category: [Focus v]   Color: [●●●●●●●]   Emoji: [✨]    │
│ Cover URL: [https://..._________________]               │
│ Description: [_____________________________]            │
│                                                         │
│ Tasks (Total: 15 min)                    [+ Add Task]   │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Section: "Get Moving"               [Edit] [Remove] │ │
│ │ ☀️ Morning Stretch          5m      [≡] [X]         │ │
│ │ 🏃 Light Exercise           5m      [≡] [X]         │ │
│ │ Section: "Mindfulness"              [Edit] [Remove] │ │
│ │ 🧘 Meditation               5m      [≡] [X]         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Routine]   │
└─────────────────────────────────────────────────────────┘
```

### Tasks Bank with Selection Mode

```text
┌─────────────────────────────────────────────────────────┐
│ Tasks Bank                       [Select] [+ Add Task]  │
├─────────────────────────────────────────────────────────┤
│ ☑ 3 selected              [Create Routine] [Clear]     │
├─────────────────────────────────────────────────────────┤
│ ☑ ☀️ Morning Stretch      ⭐ 👁 ⚙️ 🗑️ >               │
│ ☑ 🧘 Meditation           ⭐ 👁 ⚙️ 🗑️ >               │
│ ☐ ☕ Make Coffee          ⭐ 👁 ⚙️ 🗑️ >               │
│ ☑ 📝 Journal              ⭐ 👁 ⚙️ 🗑️ >               │
└─────────────────────────────────────────────────────────┘
```

## Implementation Order

1. **Database migration** - Create routines_bank and routines_bank_tasks tables with RLS
2. **Create RoutinesBank.tsx** - Basic CRUD for routines
3. **Add to Tools.tsx** - New tab
4. **Add task management to RoutinesBank** - Task picker, sections, reordering
5. **Add multi-select to TasksBank.tsx** - Checkboxes, selection state
6. **Create routine dialog in TasksBank** - Quick routine creation from selection
7. **Test end-to-end**

## Technical Notes

- Duration is auto-calculated by summing task durations in routines_bank_tasks
- When adding a task from admin_task_bank, copy title/emoji/duration to routines_bank_tasks
- Section headers are stored as section_title on the task that follows the header
- Reordering updates task_order field
- Uses same category system (routine_categories) as Tasks Bank for consistency

