

## Plan: Redesign Tasks Bank — Show Category Sections with Preview + "All" Button

### Problem
Currently, all tasks display in one long flat list. Users only see the first category (Easy Wins) and don't realize there are more categories unless they tap the category pills.

### Design
Adopt the same section pattern used in AppInspire (routine templates page):
- Each category gets its own section with a **header row** (category name + task count + "All >" button)
- Show only the **first 6 tasks** per category (roughly 2 screen-rows of cards)
- Tapping **"All >"** sets `selectedCategory` to that category, which scrolls to top and shows only that category's full task list with a back/clear option
- Category pills at the top remain for quick jumping
- Search still works across all tasks

### Changes

**File: `src/pages/app/AppTasksBank.tsx`**

1. **Default view (no category selected):** Show each sorted category as a section with:
   - Section header: category name + count badge + "All >" button (ChevronRight icon, `text-primary`)
   - Only first 6 tasks rendered per section
   - Tapping "All >" sets `selectedCategory` to that slug

2. **Filtered view (category selected):** Show full list for that single category (current behavior), with the category pills highlighting the active one. Tapping the same category pill again clears the filter back to the overview.

3. Import `ChevronRight` from lucide-react (already used in AppInspire pattern).

### No new files or routes needed — this is a layout change within the existing page.

