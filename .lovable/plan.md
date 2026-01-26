

## Plan: Complete Emoji Standardization for Routine Pages

### Problem Identified

From the screenshots, I can see three places still showing Lucide icons instead of emojis:

1. **Admin Tasks tab** (`RoutinePlanDetailManager.tsx`) - The `renderIcon` function already has emoji support, but the database contains Lucide icon names
2. **RoutinePreviewSheet** - Shows icon *names* as text because database has "Dumbbell", "Heart" etc.
3. **Routine detail page** (`AppInspireDetail.tsx`) - Line 181 uses `LucideIcons[task.icon]` to render icons

### Root Cause

The database table `routine_plan_tasks` has the `icon` column populated with Lucide icon names (e.g., "Brain", "Clock", "Star", "Book") instead of emoji characters.

### Solution: Two-Part Fix

---

#### Part 1: Update AppInspireDetail.tsx

Update the task rendering in the "What's Included" section to handle both emojis and legacy Lucide icons (with emoji fallback display).

**File:** `src/pages/app/AppInspireDetail.tsx`

```tsx
// Line 180-197: Replace the task rendering logic

// Add helper function to check if string is emoji
const isEmoji = (str: string) => 
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u.test(str);

// In the map function, replace TaskIcon with:
{isEmoji(task.icon) ? (
  <span className="text-xl">{task.icon}</span>
) : (
  // Fallback for legacy Lucide names - show default emoji
  <span className="text-xl">✨</span>
)}
```

---

#### Part 2: Database Migration

Run a SQL migration to convert existing Lucide icon names to emojis in the `routine_plan_tasks` table.

**Icon to Emoji Mapping:**
| Lucide Icon | Emoji |
|-------------|-------|
| Brain | 🧠 |
| Sparkles | ✨ |
| Clock | 🕐 |
| Star | ⭐ |
| Book | 📖 |
| BookOpen | 📖 |
| Heart | ❤️ |
| Droplet | 💧 |
| Coffee | ☕ |
| Dumbbell | 💪 |
| Sun | ☀️ |
| Moon | 🌙 |
| Users | 👥 |
| Target | 🎯 |
| Music | 🎵 |
| Mic | 🎤 |
| MessageCircle | 💬 |
| CheckCircle | ✅ |
| Apple | 🍎 |
| Bed | 🛏️ |
| Calendar | 📅 |
| Flame | 🔥 |
| Leaf | 🌿 |
| Phone | 📱 |
| Smile | 😊 |
| Wind | 💨 |

**SQL Migration:**
```sql
UPDATE routine_plan_tasks SET icon = '🧠' WHERE icon = 'Brain';
UPDATE routine_plan_tasks SET icon = '✨' WHERE icon = 'Sparkles';
UPDATE routine_plan_tasks SET icon = '🕐' WHERE icon = 'Clock';
UPDATE routine_plan_tasks SET icon = '⭐' WHERE icon = 'Star';
UPDATE routine_plan_tasks SET icon = '📖' WHERE icon = 'Book';
UPDATE routine_plan_tasks SET icon = '📖' WHERE icon = 'BookOpen';
UPDATE routine_plan_tasks SET icon = '❤️' WHERE icon = 'Heart';
UPDATE routine_plan_tasks SET icon = '💧' WHERE icon = 'Droplet';
UPDATE routine_plan_tasks SET icon = '☕' WHERE icon = 'Coffee';
UPDATE routine_plan_tasks SET icon = '💪' WHERE icon = 'Dumbbell';
UPDATE routine_plan_tasks SET icon = '☀️' WHERE icon = 'Sun';
UPDATE routine_plan_tasks SET icon = '🌙' WHERE icon = 'Moon';
UPDATE routine_plan_tasks SET icon = '👥' WHERE icon = 'Users';
UPDATE routine_plan_tasks SET icon = '🎯' WHERE icon = 'Target';
UPDATE routine_plan_tasks SET icon = '🎵' WHERE icon = 'Music';
UPDATE routine_plan_tasks SET icon = '🎤' WHERE icon = 'Mic';
UPDATE routine_plan_tasks SET icon = '💬' WHERE icon = 'MessageCircle';
UPDATE routine_plan_tasks SET icon = '✅' WHERE icon = 'CheckCircle';
UPDATE routine_plan_tasks SET icon = '🍎' WHERE icon = 'Apple';
UPDATE routine_plan_tasks SET icon = '🛏️' WHERE icon = 'Bed';
UPDATE routine_plan_tasks SET icon = '📅' WHERE icon = 'Calendar';
UPDATE routine_plan_tasks SET icon = '🔥' WHERE icon = 'Flame';
UPDATE routine_plan_tasks SET icon = '🌿' WHERE icon = 'Leaf';
UPDATE routine_plan_tasks SET icon = '📱' WHERE icon = 'Phone';
UPDATE routine_plan_tasks SET icon = '😊' WHERE icon = 'Smile';
UPDATE routine_plan_tasks SET icon = '💨' WHERE icon = 'Wind';
```

---

### Files to Modify

1. **`src/pages/app/AppInspireDetail.tsx`**
   - Remove `* as LucideIcons` import for task icons
   - Update task rendering in "What's Included" section to display emojis directly

### Database Action Required

After code changes, you'll need to run the SQL migration in Supabase to convert existing icon values to emojis. I can execute this migration for you.

---

### Expected Result

After these changes:
- Admin task list will show emojis (already has `renderIcon` with emoji support)
- RoutinePreviewSheet will show emojis (already updated, just needs emoji data)
- Routine detail page will show emojis in "What's Included" section
- All new tasks created will use emojis
- Existing tasks will be migrated to emojis

