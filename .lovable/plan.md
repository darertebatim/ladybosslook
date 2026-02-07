
# iOS Celebrations & Rating Issues Fix Plan

## Summary of Issues

Based on the screenshots and code analysis, there are **6 distinct issues** to address:

1. **Toast notifications covering the menu** - Currently positioned at `bottom-center` with `120px` offset, but still overlapping the iOS tab bar in some cases
2. **Review rating prompt "Not Now" button freezing** - The custom rating prompt dialog needs proper event handling 
3. **Gold coins becoming silver when adding new actions** - Badge level calculation uses current task count, so adding a new task retroactively changes completion percentages
4. **Coin sizes in WeeklyPresenceGrid on Presence page** - Need 140% scaling like other places
5. **Badge celebrations shape/appearance issues** - The toast celebrations need iOS-safe positioning adjustments
6. **HomeTour causing "Maximum update depth" errors** - Infinite loop in useEffect callback

---

## Technical Details

### Issue 1: Toast Notifications Covering Menu

**Current State:**
- `src/components/ui/sonner.tsx` sets `offset="120px"` and `position="bottom-center"`
- On iOS, the safe area + tab bar height can exceed 120px

**Fix:**
- Increase the offset to `140px` to ensure toasts appear well above the bottom navigation

---

### Issue 2: Review Rating Prompt Freezing

**Analysis:**
The screenshot shows a custom "Enjoying Simora?" dialog with stars and "Not Now" button. This appears to be a native iOS App Store review overlay or a custom component that was deleted. Since the InAppReview plugin is used directly (which triggers the system's native review dialog), there's no custom dialog code in the current codebase.

**Fix:**
- The native InAppReview plugin dialog is controlled by iOS - the "Not Now" button behavior is managed by the OS
- Need to create a custom "soft prompt" dialog that appears BEFORE the native review, allowing users to decline without triggering the native flow
- Add proper `e.stopPropagation()` on the Not Now button

---

### Issue 3: Gold Coins Becoming Silver When Adding New Actions

**Root Cause:**
The `useWeeklyTaskCompletion` hook calculates badge levels based on the **current** active task list. When a new task is added:
- Previous days' completion percentages are recalculated
- A day that was 100% (gold) becomes less than 100% because a new task now exists

**Example:**
- Day had 3/3 tasks completed = Gold (100%)
- User adds a new daily task
- Day now has 3/4 tasks completed = Silver (75%)

**Fix:**
- Store the snapshot of total tasks per day when tasks are completed
- OR calculate badges based only on tasks that existed on that specific day (using task `created_at`)
- Modify `taskAppliesToDate` to also check if the task existed before or on that date

---

### Issue 4: Coin Sizes in WeeklyPresenceGrid on Presence Page

**Current State:**
- `src/components/app/WeeklyPresenceGrid.tsx` uses `w-full h-full object-cover`
- This doesn't scale up the image to fill the container edge-to-edge

**Fix:**
- Change to `w-[140%] h-[140%] object-cover` to match AppHome styling

---

### Issue 5: Badge Celebrations iOS Positioning

**Current State:**
- `BadgeCelebration.tsx` uses `bottom-24` for toasts
- Gold celebration uses `items-end` and safe area padding

**Fix:**
- Increase bottom offset for toasts to `bottom-32` (128px) to clear iOS tab bar + safe area
- Ensure modals respect safe areas consistently

---

### Issue 6: HomeTour Maximum Update Depth Error

**Root Cause:**
Console shows infinite loop in `HomeTour.tsx` related to `setState` in `useEffect`

**Fix:**
- Add proper dependency array to prevent re-running
- Wrap the tour start callback in `useCallback` with stable dependencies

---

## Implementation Steps

### Step 1: Fix Toast Positioning (sonner.tsx)
- Increase offset from `120px` to `140px`

### Step 2: Fix Badge Celebration Toast Positioning (BadgeCelebration.tsx)
- Change `bottom-24` to `bottom-32` for silver/almostGold toasts
- Ensure proper iOS safe area handling

### Step 3: Create Custom Pre-Review Prompt
- Create `SoftReviewPrompt.tsx` component
- Show before triggering native InAppReview
- Include proper button event handling with `stopPropagation`

### Step 4: Fix WeeklyPresenceGrid Coin Sizing
- Update image classes from `w-full h-full` to `w-[140%] h-[140%]`

### Step 5: Fix Gold-to-Silver Badge Regression
- Modify `useWeeklyTaskCompletion.tsx` to filter tasks by creation date
- Only count tasks that existed on or before the day being calculated

### Step 6: Fix HomeTour Infinite Loop
- Stabilize the callback with proper memoization
- Add missing dependencies to useEffect

---

## Files to Modify

1. `src/components/ui/sonner.tsx` - Toast offset
2. `src/components/app/BadgeCelebration.tsx` - Toast bottom positioning
3. `src/components/app/WeeklyPresenceGrid.tsx` - Coin image sizing
4. `src/hooks/useWeeklyTaskCompletion.tsx` - Badge calculation logic
5. `src/components/app/tour/HomeTour.tsx` - Fix infinite loop
6. **New File:** `src/components/app/SoftReviewPrompt.tsx` - Custom review pre-prompt

---

## Expected Outcomes

- Toasts appear above the iOS tab bar consistently
- Review prompt allows dismissal without freezing
- Gold badges remain gold even after adding new tasks
- Coins on Presence page display at correct size (edge-to-edge in circles)
- No console errors from HomeTour component
