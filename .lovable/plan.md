

## Plan: Standardize to Emojis Across Task System

### Current State Analysis

| Component | Field | Current Format | Example |
|-----------|-------|----------------|---------|
| `task_templates` | `emoji` | ✅ Emoji | '💪', '🧘', '💧' |
| `routine_plan_tasks` | `icon` | ❌ Lucide icon name | 'Dumbbell', 'Coffee' |
| User tasks (`user_tasks`) | `emoji` | ✅ Emoji | Already emoji |
| App Task Create | icon picker | ❌ Lucide icons | Shows icon grid |
| RoutinePreviewSheet | TaskIcon | ❌ Lucide icons | Renders icons |
| Admin RoutinePlanDetailManager | icon selector | ❌ Lucide icons | 18 icon options |

### Changes Required

---

#### 1. Database Schema Change

**File**: Create migration to rename column  
Rename `routine_plan_tasks.icon` to `emoji` for consistency (or keep as `icon` but store emojis).

Decision: Keep the column named `icon` but change its contents to store emojis. This avoids breaking existing code references while changing the actual values.

---

#### 2. Replace IconPicker with EmojiPicker in App Task Edit

**File**: `src/pages/app/AppTaskCreate.tsx`

- Replace the `IconPicker` component with a new `EmojiPicker` component
- Change the `icon` state variable to store emoji values
- The icon picker currently opens when tapping the icon at the top of the task form
- Replace with an emoji grid picker (similar to `TaskTemplatesManager.tsx` emoji selector)

Create new component: `src/components/app/EmojiPicker.tsx`
- Sheet-based picker with emoji categories
- Common task emojis curated for routines/wellness
- Search functionality
- Categories: Common, Wellness, Work, Lifestyle, Nature, Objects

---

#### 3. Update RoutinePreviewSheet to Use Emojis

**File**: `src/components/app/RoutinePreviewSheet.tsx`

- Currently imports `* as LucideIcons` and renders `<TaskIcon className="w-4 h-4" />`
- Change to render emoji text directly: `<span className="text-lg">{display.icon}</span>`
- Update `getTaskDisplay` to return emoji instead of icon name

---

#### 4. Update Admin RoutinePlanDetailManager

**File**: `src/components/admin/RoutinePlanDetailManager.tsx`

Current icon selector (lines 1046-1061):
```tsx
const ICON_OPTIONS = [
  'Sun', 'Moon', 'Heart', 'Brain', 'Dumbbell', 'Coffee', ...
];
// Grid of icons with renderIcon()
```

Change to emoji selector:
```tsx
const EMOJI_OPTIONS = [
  '☀️', '🌙', '❤️', '🧠', '💪', '☕',
  '📖', '⭐', '✨', '⚡', '🎯', '🕐',
  '✅', '🏆', '🔥', '🌿', '💧', '💨'
];
// Grid of emoji buttons
```

Update:
- `taskForm.icon` default from `'CheckCircle'` to `'✨'`
- `renderIcon()` function to just return the emoji text
- Bulk task creation default icon

---

#### 5. Update useAddRoutinePlan Hook

**File**: `src/hooks/useRoutinePlans.tsx`

Line 406: Currently sets `emoji: edited?.icon || task.icon || plan.icon`

This already maps `icon` to `emoji`, but the source values are Lucide names. Once the database contains emojis, this will work correctly.

---

#### 6. Data Migration (Optional but Recommended)

Create a mapping from existing Lucide icon names to emojis and update existing `routine_plan_tasks` records:

```
Dumbbell → 💪
Coffee → ☕
Heart → ❤️
Brain → 🧠
Sparkles → ✨
Clock → 🕐
Star → ⭐
Book → 📖
Sun → ☀️
Moon → 🌙
Droplet → 💧
MessageCircle → 💬
CheckCircle → ✅
...
```

---

### Files to Modify

1. **`src/components/app/EmojiPicker.tsx`** (NEW) - Create emoji picker component
2. **`src/pages/app/AppTaskCreate.tsx`** - Replace IconPicker with EmojiPicker
3. **`src/components/app/RoutinePreviewSheet.tsx`** - Render emojis instead of icons
4. **`src/components/admin/RoutinePlanDetailManager.tsx`** - Replace icon grid with emoji grid
5. **`src/hooks/useRoutinePlans.tsx`** - Minor adjustments if needed

---

### Technical Details

#### New EmojiPicker Component Structure

```tsx
// src/components/app/EmojiPicker.tsx
const EMOJI_CATEGORIES = {
  common: ['☀️', '🎯', '💪', '❤️', '⭐', '✨', '📖', '✏️', '☕', '💧', '🕐', '📅', '🔔', '✅', '⭕'],
  wellness: ['🧘', '🍎', '👶', '🛁', '🛏️', '🧠', '🌸', '🤲', '🌿', '🌙', '🥗', '😊', '🍲', '🌅', '🌇', '🌳', '💨'],
  work: ['💼', '🏢', '🧮', '📊', '📋', '💳', '💵', '📄', '📂', '💻', '✉️', '💬', '📱', '🐷', '📈', '👥', '👛'],
  lifestyle: ['🚴', '📚', '📷', '🚗', '🐕', '🎮', '🎁', '🥤', '🎧', '🏠', '🔑', '🧳', '🗺️', '🎵', '🎨', '✈️', '🛍️', '🛒', '👕', '🎟️', '🏆', '📺', '🍽️', '🍷'],
};

export function EmojiPicker({ open, onOpenChange, selectedEmoji, onSelect }) {
  // Sheet with emoji grid, categories, and search
}
```

#### Rendering Emoji in Task Cards

```tsx
// Before (RoutinePreviewSheet.tsx line 230)
<TaskIcon className="w-4 h-4" />

// After
<span className="text-base">{display.icon}</span>
```

---

### Visual Impact

- Task cards will show colorful emojis instead of monochrome line icons
- More expressive and playful UI
- Consistent with the existing `task_templates` which already use emojis
- Better visual distinction between different tasks

