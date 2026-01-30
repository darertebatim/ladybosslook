

# Plan: Enhance Routines Bank with Rich Sections

## Current State
The Routines Bank currently uses a simple `section_title` field on each task to create section dividers. This is limited - it only shows a header text above a task.

## What You Want: Rich Sections
Looking at the existing `routine_plan_sections` table structure, a proper section includes:
- **Title** - Section heading (e.g., "Get Moving", "Mindfulness")
- **Content** - Rich text describing the section and its purpose
- **Image URL** - Optional visual for the section
- **Order** - Position in the routine

This allows you to write detailed introductions for each group of tasks.

## Database Changes

### Create `routines_bank_sections` Table
A new table for rich section content:

```sql
CREATE TABLE routines_bank_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines_bank(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,           -- Descriptive text about this section
  image_url text,         -- Optional section image
  section_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS Policy
ALTER TABLE routines_bank_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage routine sections"
  ON routines_bank_sections FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Update `routines_bank_tasks` Table
Add a reference to which section the task belongs to:

```sql
ALTER TABLE routines_bank_tasks 
ADD COLUMN section_id uuid REFERENCES routines_bank_sections(id) ON DELETE SET NULL;
```

## UI Changes

### Enhanced Edit Dialog Structure

```text
┌─────────────────────────────────────────────────────────┐
│ Edit Routine: Morning Energy Boost               [X]    │
├─────────────────────────────────────────────────────────┤
│ [Basic Info] [Sections & Tasks]                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SECTIONS (Rich content introducing each part)          │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Section 1: Get Moving                    [Edit] [X] │ │
│ │ "Start with light movement to wake up..."          │ │
│ │                                                     │ │
│ │ Tasks in this section:                              │ │
│ │   ☀️ Morning Stretch         1m         [X]        │ │
│ │   🏃 Light Exercise          1m         [X]        │ │
│ │                              [+ Add Task]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Section 2: Mindfulness                   [Edit] [X] │ │
│ │ "Take time to center yourself..."                  │ │
│ │                                                     │ │
│ │ Tasks in this section:                              │ │
│ │   🧘 Meditation              1m         [X]        │ │
│ │                              [+ Add Task]           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ [+ Add Section]                                         │
│                                                         │
│ UNCATEGORIZED TASKS                                     │
│ (Tasks not assigned to any section)                     │
│   📝 Journal                   1m         [X]          │
│                                [+ Add Task]             │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Routine]   │
└─────────────────────────────────────────────────────────┘
```

### Section Editor Dialog

```text
┌─────────────────────────────────────────────────────────┐
│ Edit Section                                      [X]   │
├─────────────────────────────────────────────────────────┤
│ Title: [Get Moving_____________________]                │
│                                                         │
│ Content (What this section is about):                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Start your morning with light movement to wake     │ │
│ │ up your body and increase blood flow. These        │ │
│ │ exercises are designed to be gentle yet effective..│ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Image URL (optional):                                   │
│ [https://example.com/stretching.jpg___________]        │
├─────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Section]   │
└─────────────────────────────────────────────────────────┘
```

## File Changes

### Database Migration
Create `routines_bank_sections` table and add `section_id` to `routines_bank_tasks`

### Updated RoutinesBank.tsx
- Add sections management
- Section CRUD operations
- Assign tasks to sections
- Reorder sections
- Edit section content/image

## How It Works

1. **Create Routine** - Add basic info (title, subtitle, cover, category)
2. **Add Sections** - Create sections with title + descriptive content
3. **Add Tasks** - Add tasks from the bank, assign to sections
4. **Rich Content** - Each section can have explanatory text and images

## Visual Flow on Routine Page (App Side - Future)

When a user views a routine:

```text
┌─────────────────────────────────────────────────────────┐
│ ✨ Morning Energy Boost                                 │
│ Start your day with intention                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ GET MOVING                                              │
│ ───────────                                             │
│ Start your morning with light movement to wake up       │
│ your body and increase blood flow...                    │
│                                                         │
│ [Image: stretching.jpg]                                │
│                                                         │
│ ☀️ Morning Stretch                              1 min  │
│ 🏃 Light Exercise                               1 min  │
│                                                         │
│ MINDFULNESS                                             │
│ ───────────                                             │
│ Take time to center yourself before the day begins...   │
│                                                         │
│ 🧘 Meditation                                   1 min  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Implementation Order

1. **Database migration** - Create `routines_bank_sections` table, add `section_id` to tasks
2. **Update RoutinesBank.tsx** - Add sections management UI
3. **Section CRUD** - Create, edit, delete sections with rich content
4. **Task-Section linking** - Assign tasks to sections, move between sections
5. **Test end-to-end**

## Summary

**What we're adding:**
- A new `routines_bank_sections` table for rich section content
- Each section has a title, descriptive content, and optional image
- Tasks can be assigned to sections
- The edit dialog will show sections with their tasks grouped together
- Sections provide the "discussion" content that introduces each part of the routine

This gives you the ability to create beautifully structured routine templates with explanatory content for each section, similar to how courses have modules with descriptions.

