

# Plan: Consolidate All Routine Management into `/admin/tools`

## Current State Analysis

The routine management is split across two locations with significant redundancy and inconsistencies:

### `/admin/routines` (Routines.tsx)
Uses `RoutineTemplatesManager` which contains:
- **Categories** tab - RoutineCategoriesManager (uses Lucide icons, hex colors)
- **Plans** tab - RoutinePlansManager (uses Lucide icons like "Sun", "Moon")  
- **Pro Templates** tab - ProTaskTemplatesManager (uses Lucide icons)
- **Task Templates** tab - TaskTemplatesManager (uses emojis, limited picker with 20 options)
- **Statistics** tab - RoutineStatisticsManager

### `/admin/tools` (Tools.tsx)
Uses `RoutineManager` which has:
- **Plans** tab - Unified plan/task management with EmojiPicker
- **Categories** tab - Basic category management  

### Key Problems
1. **Duplicate functionality** - Two separate routine management systems
2. **Icon inconsistency** - Old managers use Lucide icon strings ("Sun", "Moon"), app uses emojis
3. **Limited emoji selection** - TaskTemplatesManager has only 20 hardcoded emojis vs app's full EmojiPicker
4. **Pro Task confusion** - RoutinePlanDetailManager (1382 lines) duplicates task editing functionality
5. **Fragmented navigation** - Users must navigate between two admin sections

---

## Proposed Solution

Consolidate everything into `/admin/tools` with a completely rebuilt routine management system that:
1. Uses the app's `EmojiPicker` component everywhere
2. Shares `PRO_LINK_CONFIGS` from `proTaskTypes.ts` for feature parity
3. Organizes all features under clear tabs
4. Removes the separate `/admin/routines` route

---

## Implementation Steps

### Step 1: Create New Unified RoutineManagement Component

Create `src/components/admin/RoutineManagement.tsx` with these tabs:

```text
+------------------------------------------------------------------+
|  Routine Management                                               |
+------------------------------------------------------------------+
| [Plans] [Categories] [Pro Templates] [Task Templates] [Stats]    |
+------------------------------------------------------------------+
```

**Plans Tab** - Full plan and task management:
- List all routine plans with filtering (All/Pro/Regular)
- Click "Tasks" to manage tasks inline or in modal
- Create/Edit plan dialog with:
  - EmojiPicker for icon (not Lucide icons)
  - Color picker (consistent color names: yellow, pink, blue, etc.)
  - Category dropdown (from routine_categories)
  - Pro Routine toggle
  - Cover image upload/AI generation
- Task management with:
  - EmojiPicker for task icons
  - Duration picker
  - Pro Link Type selector (from PRO_LINK_CONFIGS)
  - Value selectors for playlists, breathing exercises, etc.

**Categories Tab** - Merged from RoutineCategoriesManager:
- Use EmojiPicker instead of Lucide icon picker
- Keep color picker with named colors
- Display plan/task counts

**Pro Templates Tab** - From ProTaskTemplatesManager:
- Use EmojiPicker instead of Lucide icons
- Keep AI generation features (All Playlists, Journal Tasks)
- Dynamic value selectors for playlists/breathing exercises

**Task Templates Tab** - From TaskTemplatesManager:
- Replace 20-emoji picker with full EmojiPicker
- Keep category sync with routine_categories
- Bulk delete functionality

**Statistics Tab** - Keep RoutineStatisticsManager as-is:
- Plan adoption counts
- Rating averages
- Recent ratings table

### Step 2: Update Tools.tsx

Replace the current simple setup with the new comprehensive management:

```text
Admin > Tools
  +-- Routines tab (new RoutineManagement)
  +-- Breathing tab (existing BreathingExercisesManager)
```

### Step 3: Remove Old Route

- Remove `/admin/routines` route from App.tsx
- Delete or deprecate:
  - `src/pages/admin/Routines.tsx`
  - `src/components/admin/RoutineTemplatesManager.tsx`
  - `src/components/admin/RoutinePlansManager.tsx`
  - `src/components/admin/RoutinePlanDetailManager.tsx`

### Step 4: Update Admin Navigation

Update `AdminNav.tsx` to:
- Remove "Routines" link
- Ensure "Tools" link is properly highlighted

---

## Technical Details

### Shared Components to Reuse

| Component | From | Purpose |
|-----------|------|---------|
| EmojiPicker | `src/components/app/EmojiPicker.tsx` | Full emoji selection |
| PRO_LINK_CONFIGS | `src/lib/proTaskTypes.ts` | Pro task link types |
| PRO_LINK_TYPES | `src/lib/proTaskTypes.ts` | Link type array |

### Database Tables Involved

- `routine_categories` - Categories for plans/tasks
- `routine_plans` - Routine plan templates
- `routine_plan_tasks` - Tasks within plans
- `routine_task_templates` - Pro task templates (for quick add)
- `task_templates` - Basic task templates
- `audio_playlists` - For playlist linking
- `breathing_exercises` - For breathe linking

### Key Form Fields

**Plan Form:**
```text
- title (string)
- subtitle (string, optional)
- description (text, optional)
- icon (emoji from EmojiPicker)
- color (select: yellow, pink, blue, purple, green, orange, peach, sky, mint, lavender)
- category_id (select from routine_categories)
- estimated_minutes (number)
- points (number)
- is_featured (boolean)
- is_popular (boolean)
- is_pro_routine (boolean)
- is_active (boolean)
- cover_image_url (string, optional)
```

**Task Form:**
```text
- title (string)
- duration_minutes (number)
- icon (emoji from EmojiPicker)
- is_active (boolean)
- pro_link_type (select from PRO_LINK_TYPES or null)
- pro_link_value (string, depends on pro_link_type)
```

### Color Constants (Consistent with App)

```typescript
const COLOR_OPTIONS = [
  { name: 'Yellow', value: 'yellow' },
  { name: 'Pink', value: 'pink' },
  { name: 'Blue', value: 'blue' },
  { name: 'Purple', value: 'purple' },
  { name: 'Green', value: 'green' },
  { name: 'Orange', value: 'orange' },
  { name: 'Peach', value: 'peach' },
  { name: 'Sky', value: 'sky' },
  { name: 'Mint', value: 'mint' },
  { name: 'Lavender', value: 'lavender' },
];
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/admin/RoutineManagement.tsx` | New unified management component (~800-1000 lines) |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/Tools.tsx` | Replace RoutineManager with RoutineManagement |
| `src/App.tsx` | Remove `/admin/routines` route |
| `src/layouts/AdminLayout.tsx` or `AdminNav.tsx` | Remove Routines nav link |

## Files to Delete (After Migration)

| File | Reason |
|------|--------|
| `src/pages/admin/Routines.tsx` | Replaced by Tools > Routines |
| `src/components/admin/RoutineTemplatesManager.tsx` | Consolidated |
| `src/components/admin/RoutinePlansManager.tsx` | Consolidated |
| `src/components/admin/RoutinePlanDetailManager.tsx` | Consolidated |
| `src/components/admin/RoutineCategoriesManager.tsx` | Consolidated |
| `src/components/admin/RoutineManager.tsx` | Replaced by RoutineManagement |

Keep existing (used by new component):
- `src/components/admin/ProTaskTemplatesManager.tsx`
- `src/components/admin/TaskTemplatesManager.tsx`
- `src/components/admin/RoutineStatisticsManager.tsx`

---

## Benefits

1. **Single source of truth** - All routine management in one place
2. **App parity** - Same emoji picker and pro link options as the mobile app
3. **Cleaner codebase** - Remove ~3000 lines of duplicate code
4. **Easier maintenance** - Changes to app features automatically available in admin
5. **Better UX** - No more switching between admin sections

