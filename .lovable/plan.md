
# Plan: Enhance Tasks Bank with Admin Controls

## Overview
Add admin-specific controls to the Tasks Bank that allow managing `is_popular`, `is_active`, `description`, and `duration_minutes` fields. Also add the missing `repeat_interval` column to the schema for full feature parity.

## Changes

### 1. Database: Add Missing Column
Add `repeat_interval` to `admin_task_bank` for parity with user tasks.

```sql
ALTER TABLE admin_task_bank 
ADD COLUMN repeat_interval integer DEFAULT 1;
```

### 2. UI: Add Admin Controls to Task List
Add quick-action buttons directly on each task row in the list:
- **Star toggle** - Click the star icon to toggle `is_popular`
- **Active toggle** - Add an eye/visibility icon to toggle `is_active`

### 3. UI: Extend Edit Sheet with Admin Section
Add an "Admin Settings" collapsible section at the bottom of the task edit sheet with:
- **Description** - Text area for optional description
- **Duration** - Number input for estimated duration in minutes
- **Popular** - Switch to mark as featured/popular
- **Active** - Switch to enable/disable the template

### 4. Update Mutations
Modify `createTask` and `updateTask` mutations to include:
- `is_popular`
- `is_active`
- `description`
- `duration_minutes`
- `repeat_interval`

## Technical Details

### File Changes

**src/pages/admin/TasksBank.tsx**
- Add `togglePopular` mutation for quick star toggle
- Add `toggleActive` mutation for quick visibility toggle
- Add click handlers on star icon to toggle popular status
- Add visibility icon with click handler to toggle active status
- Extend `TaskFormData` interface or add admin-specific fields
- Add admin settings section to the sheet content

**Database Migration**
- Add `repeat_interval` column to `admin_task_bank`

### UI Layout for Admin Settings Section

```text
┌─────────────────────────────────────────┐
│ Admin Settings                      [v] │
├─────────────────────────────────────────┤
│ Description                             │
│ ┌─────────────────────────────────────┐ │
│ │ Optional task description...        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Duration          ┌──────┐              │
│                   │  5   │ minutes      │
│                   └──────┘              │
│                                         │
│ Popular (Featured)        [  Toggle  ]  │
│ Active                    [  Toggle  ]  │
└─────────────────────────────────────────┘
```

### Quick Toggle Behavior in List
- Clicking star icon toggles `is_popular` immediately (optimistic update)
- Inactive tasks show at 50% opacity with strikethrough or badge
- Add eye/eye-off icon for active status toggle

## Implementation Order
1. Run database migration to add `repeat_interval` column
2. Add quick-toggle mutations for `is_popular` and `is_active`
3. Update task list row with clickable star and visibility icons
4. Add admin settings section to the edit sheet
5. Update create/update mutations with new fields
6. Test end-to-end
