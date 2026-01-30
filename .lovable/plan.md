

# Plan: Migrate /app/routines to Use Tasks Bank

## Overview
Consolidate task templates by making `admin_task_bank` the single source of truth. Remove the `task_templates` table and update all code to read from `admin_task_bank` instead.

## What Changes

### 1. Update `useTaskPlanner.tsx` Hooks

**Current:**
```typescript
export const useTaskTemplates = (category?: TemplateCategory) => {
  return useQuery({
    queryKey: ['planner-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('task_templates')  // OLD TABLE
        .select('*')
        ...
    }
  });
};
```

**New:**
```typescript
export const useTaskTemplates = (category?: TemplateCategory) => {
  return useQuery({
    queryKey: ['planner-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('admin_task_bank')  // NEW TABLE
        .select('*')
        .eq('is_active', true)
        ...
    }
  });
};
```

Also update:
- `TaskTemplate` interface to match `admin_task_bank` schema
- `useCreateTaskFromTemplate` to use the correct field mappings

### 2. Update AppInspire.tsx (Routines Page)

**Current behavior:** Shows task templates with a "+" button that adds task directly to planner

**New behavior:** 
- When user taps "+" on a task, open a sheet/dialog to edit the routine
- User can then add this task to a routine or add directly to their planner

Changes:
- Replace `TaskTemplateCard` with updated version that opens routine editor
- Add routine edit dialog/sheet for adding tasks to routines

### 3. Update TaskQuickStartSheet.tsx

This component shows task suggestions when creating a new task. Update to query from `admin_task_bank` instead of `task_templates`.

### 4. Delete Deprecated Components

Remove components that manage the old `task_templates` table:
- `src/components/admin/TaskTemplatesManager.tsx`

### 5. Update Edge Functions

These edge functions reference `task_templates` and need updating:
- `generate-plans-from-task-templates/index.ts` → Use `admin_task_bank`
- `generate-routine-plan-ai/index.ts` → Use `admin_task_bank`
- `admin-assistant/index.ts` → Update tool references

### 6. Database Changes

**Migration:**
```sql
-- Drop the task_templates table (after confirming data migration)
DROP TABLE IF EXISTS task_templates;
```

Note: The `routine_task_templates` table is separate (for Pro Tasks with playlist links). If you want to consolidate that too, let me know and I'll include it.

## File Changes Summary

```text
src/hooks/useTaskPlanner.tsx
├── Update TaskTemplate interface
├── Update useTaskTemplates to query admin_task_bank
└── Update useCreateTaskFromTemplate field mappings

src/pages/app/AppInspire.tsx
├── Update to use new task bank data
└── Add routine edit sheet when tapping "+"

src/components/app/TaskQuickStartSheet.tsx
└── Already uses useTaskTemplates (will auto-update)

src/components/app/TaskTemplateCard.tsx
└── Update to open routine editor on "+"

src/components/admin/TaskTemplatesManager.tsx
└── DELETE (replaced by TasksBank.tsx)

supabase/functions/generate-plans-from-task-templates/index.ts
└── Update to use admin_task_bank

supabase/functions/generate-routine-plan-ai/index.ts
└── Update to use admin_task_bank

supabase/functions/admin-assistant/index.ts
└── Update tool descriptions

supabase/migrations/xxx.sql
└── DROP TABLE task_templates
```

## UI Flow: Tapping "+" on Task

```text
User on /app/routines
        ↓
    Sees task: "☀️ Morning Stretch"
        ↓
    Taps "+"
        ↓
┌─────────────────────────────────┐
│ Add "Morning Stretch"           │
├─────────────────────────────────┤
│                                 │
│ ○ Add to Today's Planner       │
│ ○ Add to Routine               │
│                                 │
│ [Select Routine ▼]              │
│ or [+ Create New Routine]       │
│                                 │
│              [Cancel]  [Add]    │
└─────────────────────────────────┘
```

## Implementation Order

1. **Update useTaskPlanner.tsx** - Change data source to admin_task_bank
2. **Update TaskTemplate interface** - Match admin_task_bank schema
3. **Update AppInspire.tsx** - Add routine selection dialog
4. **Update TaskTemplateCard.tsx** - Open dialog instead of direct add
5. **Update edge functions** - Point to admin_task_bank
6. **Delete TaskTemplatesManager.tsx** - Remove deprecated component
7. **Database migration** - Drop task_templates table
8. **Test end-to-end**

## Schema Mapping

| task_templates | admin_task_bank | Notes |
|----------------|-----------------|-------|
| id | id | Same |
| title | title | Same |
| emoji | emoji | Same |
| color | color | Same |
| category | category | Same |
| description | description | Same |
| suggested_time | - | Not in bank, can add or skip |
| repeat_pattern | repeat_pattern | Same |
| display_order | sort_order | Different name |
| is_active | is_active | Same |
| is_popular | is_popular | Same |
| - | duration_minutes | New field (useful!) |
| - | pro_link_type | New field |
| - | goal_enabled | New field |

The `admin_task_bank` has MORE fields, so this is an upgrade.

