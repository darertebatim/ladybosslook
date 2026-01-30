
# Migration Plan: Pro Task Templates → Tasks Bank

## Overview
Migrate all 14 Pro Task Templates from the legacy `routine_task_templates` table to the unified `admin_task_bank` table. These are special tasks that deep-link to app features like playlists, breathing exercises, journal, water tracking, and channels.

## Current Pro Task Templates (14 total)

| Type | Count | Examples |
|------|-------|----------|
| Playlist | 7 | Relaxing Rain, Ladyboss Inner-Strength, Courageous Character |
| Breathe | 4 | Calm Breathing, Box Breathing, Energy Boost, Simora Breathing |
| Journal | 1 | Journal Writings |
| Water | 1 | Drink Water |
| Channel | 1 | Channel Check-in |

## Migration Details

### Field Mapping

```text
routine_task_templates     →  admin_task_bank
──────────────────────────────────────────────────
title                      →  title
icon (may be emoji/text)   →  emoji (convert legacy icons)
duration_minutes           →  duration_minutes
pro_link_type              →  pro_link_type
pro_link_value             →  pro_link_value
linked_playlist_id         →  linked_playlist_id
description                →  description
category ('Pro')           →  category ('pro' lowercase)
is_active                  →  is_active
is_popular                 →  is_popular
display_order              →  sort_order
(default)                  →  color = 'amber' (Pro color)
(default)                  →  goal_enabled = false
(default)                  →  repeat_pattern = 'none'
```

### Icon Conversion
Some Pro Task Templates use legacy Lucide icon names (e.g., "BookOpen", "Music", "Mic", "Users"). These will be converted to appropriate emojis:
- `BookOpen` → 📖
- `Music` → 🎵
- `Mic` → 🎙️
- `Users` → 👥

### SQL Migration

```sql
INSERT INTO admin_task_bank (
  title, emoji, color, category, description,
  duration_minutes, pro_link_type, pro_link_value, 
  linked_playlist_id, is_active, is_popular, 
  sort_order, goal_enabled, repeat_pattern
)
SELECT 
  title,
  CASE 
    WHEN icon = 'BookOpen' THEN '📖'
    WHEN icon = 'Music' THEN '🎵'
    WHEN icon = 'Mic' THEN '🎙️'
    WHEN icon = 'Users' THEN '👥'
    ELSE icon  -- Already an emoji
  END,
  'amber',  -- Pro tasks use amber color
  'pro',    -- Normalized category
  description,
  duration_minutes,
  pro_link_type,
  pro_link_value,
  linked_playlist_id,
  is_active,
  is_popular,
  (SELECT COALESCE(MAX(sort_order), 0) FROM admin_task_bank) + display_order,
  false,
  'none'
FROM routine_task_templates
ORDER BY display_order;
```

## Execution Steps

1. **Run migration query** - Insert all 14 Pro Task Templates into admin_task_bank
2. **Verify counts** - Confirm 14 new records with `pro_link_type IS NOT NULL`
3. **Verify icon conversion** - Ensure legacy icon names are converted to emojis
4. **Test in UI** - Open Tasks Bank and filter by "Pro" category
5. **Spot check** - Verify playlist-linked tasks have correct `linked_playlist_id`

## Post-Migration

After migration:
- Tasks Bank will contain **250 templates** (236 legacy + 14 Pro)
- Pro category tab will show all 14 deep-linked tasks
- Legacy `ProTaskTemplatesManager` can be deprecated (future cleanup)

## Risk Mitigation
- Additive migration only (no deletions)
- Original `routine_task_templates` data remains intact
- Can be rolled back by deleting Pro category tasks from `admin_task_bank`
