

# Migration Plan: Task Templates → Tasks Bank

## Overview
Migrate all 236 task templates from the legacy `task_templates` table to the new `admin_task_bank` table, which now supports the full app feature set (goals, subtasks, pro links).

## Current Data Summary

| Category | Count |
|----------|-------|
| calm | 24 |
| connection | 26 (+5 with "Connection") |
| easy-win | 14 |
| gratitude | 21 |
| hygiene | 20 |
| inner-strength | 23 |
| movement | 20 |
| nutrition | 20 |
| productivity | 20 |
| self-kindness | 21 |
| sleep | 22 |

**Note:** There's a data inconsistency - some templates use "Connection" (capitalized) instead of "connection". These will be normalized during migration.

## Migration Approach

### Step 1: Data Migration SQL
Run a single INSERT statement that:
1. Maps all compatible fields directly
2. Normalizes category names (lowercase)
3. Sets sensible defaults for new fields (goal_enabled=false, duration_minutes=5)

### Step 2: Verification
After migration, verify:
- All 236 records migrated successfully
- Category distribution matches
- Popular tasks flagged correctly

### Step 3: Remove Legacy Manager (Optional)
Once confirmed, the `TaskTemplatesManager` component can be deprecated or removed from the admin UI.

## Technical Details

### Field Mapping
```text
task_templates          →  admin_task_bank
─────────────────────────────────────────────
title                   →  title
emoji                   →  emoji
color                   →  color
LOWER(category)         →  category (normalized)
description             →  description
repeat_pattern          →  repeat_pattern
display_order           →  sort_order
is_active               →  is_active
is_popular              →  is_popular
(default)               →  goal_enabled = false
(default)               →  duration_minutes = 5
(default)               →  reminder_enabled = false
(default)               →  repeat_days = []
```

### Migration SQL
```sql
INSERT INTO admin_task_bank (
  title, emoji, color, category, description,
  repeat_pattern, sort_order, is_active, is_popular,
  goal_enabled, duration_minutes, reminder_enabled, repeat_days
)
SELECT 
  title,
  emoji,
  color,
  LOWER(category),  -- Normalize category names
  description,
  repeat_pattern,
  display_order,
  is_active,
  is_popular,
  false,            -- goal_enabled
  5,                -- duration_minutes default
  false,            -- reminder_enabled
  '{}'::integer[]   -- repeat_days empty
FROM task_templates
ORDER BY category, display_order;
```

## Execution Steps

1. **Run migration query** - Insert all task_templates into admin_task_bank
2. **Verify counts** - Confirm 236 records exist in admin_task_bank
3. **Verify categories** - Confirm all categories are lowercase and valid
4. **Test in UI** - Open Tasks Bank in admin panel and verify display
5. **Review individual tasks** - Spot check popular tasks for correct data

## Risk Mitigation
- This is an additive migration (no deletions)
- Original task_templates data remains intact
- Can be rolled back by deleting from admin_task_bank if issues arise

