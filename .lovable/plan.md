
# Plan: Fix and Complete the Routine Management System

## Issues Identified

Based on my analysis, the current RoutineManagement.tsx has several critical gaps:

### 1. Task Editor Missing App Features
**Current state:** Task editing only has: title, icon, duration, pro_link_type, pro_link_value, is_active
**Missing from app (`AppTaskCreate.tsx`):**
- `linked_playlist_id` field (separate from pro_link_value)
- Description field
- Color selection
- Goal settings (goal_enabled, goal_type, goal_target, goal_unit)

However, checking the DB schema for `routine_plan_tasks`, the table only has:
- id, plan_id, title, duration_minutes, icon, task_order, is_active, linked_playlist_id, pro_link_type, pro_link_value

So the current fields are actually correct for this table. The main issues are:
- **No "Add from Template" button** to quickly add tasks from existing templates
- **No linked_playlist_id handling** (only pro_link_value is being used)

### 2. Plan Editor Missing Cover Image Field
**Current state:** Plan dialog has no cover image input
**In database:** `cover_image_url` column exists
**Needed:** Cover image URL input field

### 3. Pro Templates Manager Uses Lucide Icons, Not Emojis
The `ProTaskTemplatesManager.tsx` still uses:
```javascript
const ICON_OPTIONS = ['Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', ...];
```
Should use `EmojiPicker` like the rest of the system.

### 4. Task Templates Manager Has Limited Emoji Picker
`TaskTemplatesManager.tsx` has only 20 hardcoded emojis:
```javascript
const EMOJI_OPTIONS = ['☀️', '🌙', '💪', '📚', ...]; // Only 20 emojis
```
Should use full `EmojiPicker`.

### 5. No "Add Task from Template" Feature
In the plan tasks editor, there's no way to quickly add a task from existing `routine_task_templates` (Pro Templates).

---

## Implementation Plan

### Step 1: Fix Plan Editor - Add Cover Image Field

In `PlansManager` dialog, add cover image URL input field after the toggles.

### Step 2: Fix Task Editor - Add Template Selection

Add a button/dropdown to quickly add tasks from `routine_task_templates` to the current plan.

### Step 3: Update ProTaskTemplatesManager - Use EmojiPicker

Replace the Lucide icon grid with the app's `EmojiPicker` component.

### Step 4: Update TaskTemplatesManager - Use Full EmojiPicker

Replace the 20-emoji grid with the app's `EmojiPicker` component.

### Step 5: Fix linked_playlist_id Handling

When pro_link_type is 'playlist', properly set both `linked_playlist_id` AND `pro_link_value` for consistency.

---

## Technical Details

### Changes to RoutineManagement.tsx

**Plan Dialog (lines ~637-781):**
Add cover image field:
```tsx
<div>
  <Label>Cover Image URL (optional)</Label>
  <Input
    value={formData.cover_image_url || ''}
    onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value || null }))}
    placeholder="https://..."
  />
</div>
```

**PlanTasksEditor (lines ~816-1148):**
Add "Add from Template" button that shows a dropdown of available `routine_task_templates`:
- Fetch templates from `routine_task_templates` table
- Show dropdown/sheet to select a template
- Pre-fill task form with template data

Fix playlist linking:
```tsx
// When saving task with playlist type:
if (formData.pro_link_type === 'playlist') {
  data.linked_playlist_id = formData.pro_link_value;
}
```

### Changes to ProTaskTemplatesManager.tsx

Replace icon selection (lines ~470-500):
```tsx
// Before: Grid of Lucide icon names
const ICON_OPTIONS = ['Sun', 'Moon', ...];

// After: EmojiPicker button
<Label>Icon (Emoji)</Label>
<Button variant="outline" onClick={() => setShowEmojiPicker(true)}>
  {formData.icon}
</Button>
<EmojiPicker 
  open={showEmojiPicker}
  onOpenChange={setShowEmojiPicker}
  selectedEmoji={formData.icon}
  onSelect={(emoji) => setFormData(prev => ({ ...prev, icon: emoji }))}
/>
```

Update icon default from 'Sparkles' to '✨'.

### Changes to TaskTemplatesManager.tsx

Replace emoji grid (lines ~469-486):
```tsx
// Before: 20-emoji hardcoded grid
const EMOJI_OPTIONS = [...];

// After: EmojiPicker button
<Label>Emoji</Label>
<Button variant="outline" onClick={() => setShowEmojiPicker(true)}>
  {formData.emoji}
</Button>
<EmojiPicker 
  open={showEmojiPicker}
  onOpenChange={setShowEmojiPicker}
  selectedEmoji={formData.emoji}
  onSelect={(emoji) => setFormData(prev => ({ ...prev, emoji }))}
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/RoutineManagement.tsx` | Add cover image field, add template selector, fix playlist linking |
| `src/components/admin/ProTaskTemplatesManager.tsx` | Replace Lucide icons with EmojiPicker |
| `src/components/admin/TaskTemplatesManager.tsx` | Replace 20-emoji grid with EmojiPicker |

---

## Summary of Fixes

1. **Plan editor**: Add missing cover image URL field
2. **Task editor**: Add "Add from Template" feature to quickly populate tasks
3. **Task editor**: Fix linked_playlist_id to be set when pro_link_type is 'playlist'
4. **Pro Templates**: Replace Lucide icon picker with EmojiPicker (full emoji support)
5. **Task Templates**: Replace limited 20-emoji picker with full EmojiPicker

These changes will ensure the admin interface has full feature parity with the app.
