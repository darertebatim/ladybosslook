
# Fix iOS Routine Cards Rendering - Hide "All" Category

## Problem
The routine cards are still rendering incorrectly on iOS in the "All" view, even after hiding the points badge. The issue persists because:
- The "All" view shows many routine cards at once, potentially overloading iOS WebKit rendering
- There are still absolute-positioned elements (category badge, title overlay) that may cause rendering issues on iOS

## Solution: Hide the "All" Category Tab
The simplest fix that takes effect immediately without an app update is to remove the "All" category option from the UI. Users will default to "Popular" and can browse specific categories.

## Changes

### File: `src/pages/app/AppInspire.tsx`

| Line | Change |
|------|--------|
| 178-184 | Remove the "All" CategoryCircle component entirely |
| 38-47 | Update `displayPlans` logic - when no category is selected (which won't happen now), fall back to popular |
| 129, 136 | Update conditional checks - Featured and Pro sections showed only when `!selectedCategory` (i.e., "All" was selected). These sections will now never show since "All" is gone. Consider keeping them visible for "Popular" view instead. |
| 204-209 | Update the header text logic since "ALL ROUTINES" case is removed |
| 245-250 | Update task section header text logic |

### Specific Edits

**Remove "All" CategoryCircle (lines 178-184):**
```tsx
// DELETE this entire block:
<CategoryCircle
  name="All"
  icon="LayoutGrid"
  color="purple"
  isSelected={!selectedCategory}
  onClick={() => setSelectedCategory(null)}
/>
```

**Update displayPlans logic (lines 38-47):**
```tsx
const displayPlans = useMemo(() => {
  if (selectedCategory === 'popular') {
    return popularPlans;
  }
  // Category-specific plans
  return filteredPlans;
}, [selectedCategory, filteredPlans, popularPlans]);
```

**Show Featured & Pro sections in Popular view (lines 129, 136):**
```tsx
// Change from: !selectedCategory && !searchQuery
// To: selectedCategory === 'popular' && !searchQuery
{featuredPlans && featuredPlans.length > 0 && selectedCategory === 'popular' && !searchQuery && (
  ...
)}

{proPlans && proPlans.length > 0 && selectedCategory === 'popular' && !searchQuery && (
  ...
)}
```

**Update header text (line 204-209):**
```tsx
{selectedCategory === 'popular'
  ? 'POPULAR ROUTINES'
  : categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'ROUTINES'
}
```

**Update task section header (lines 245-250):**
```tsx
{selectedCategory === 'popular' 
  ? 'POPULAR TASKS'
  : `${categories?.find(c => c.slug === selectedCategory)?.name?.toUpperCase() || 'CATEGORY'} TASKS`
}
```

## Expected Result
- The "All" category tab is hidden from the UI
- Users see "Popular" as the default view (already the initial state)
- Featured banners and Pro Routines sections appear in the Popular view
- No code path leads to showing all routines at once, avoiding the iOS rendering issue
- This fix takes effect immediately for all users without requiring an app store update

## Files to Edit
| File | Description |
|------|-------------|
| `src/pages/app/AppInspire.tsx` | Remove "All" category and update related logic |
