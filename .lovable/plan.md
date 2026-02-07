
# iOS Celebrations & Rating Issues Fix Plan

## ✅ COMPLETED - All Issues Fixed

### Summary of Changes Made:

1. **Toast notifications covering the menu** ✅
   - Increased toast offset from `120px` to `140px` in `src/components/ui/sonner.tsx`

2. **Review rating prompt "Not Now" button freezing** ✅
   - Created new `src/components/app/SoftReviewPrompt.tsx` component
   - Integrated into `StreakCelebration.tsx` to show custom prompt before native iOS review
   - Proper event handling with `e.stopPropagation()` on all buttons

3. **Gold coins becoming silver when adding new actions** ✅
   - Modified `useWeeklyTaskCompletion.tsx` to filter tasks by `created_at` date
   - Tasks are now only counted if they existed on or before the day being calculated
   - Added `created_at` field to the task query

4. **Coin sizes in WeeklyPresenceGrid on Presence page** ✅
   - Changed image classes from `w-full h-full` to `w-[140%] h-[140%]` to fill circles edge-to-edge

5. **Badge celebrations iOS positioning** ✅
   - Changed toast positioning from `bottom-24` to `bottom-32` in `BadgeCelebration.tsx`
   - Added `paddingBottom: env(safe-area-inset-bottom)` for iOS safe area support

6. **HomeTour causing "Maximum update depth" errors** ✅
   - Added `useRef` to track if `onTourReady` has been called
   - Stabilized `handleStartTour` callback with proper `tour.forceStartTour` dependency
   - Prevents infinite re-renders from the callback chain

---

## Files Modified

1. `src/components/ui/sonner.tsx` - Toast offset 120px → 140px
2. `src/components/app/BadgeCelebration.tsx` - Toast bottom-24 → bottom-32, added safe area padding
3. `src/components/app/WeeklyPresenceGrid.tsx` - Coin sizing w-full → w-[140%]
4. `src/hooks/useWeeklyTaskCompletion.tsx` - Added created_at filter to prevent retroactive badge changes
5. `src/components/app/tour/HomeTour.tsx` - Fixed infinite loop with useRef guard
6. `src/components/app/StreakCelebration.tsx` - Integrated SoftReviewPrompt
7. **New:** `src/components/app/SoftReviewPrompt.tsx` - Custom pre-review dialog

---

## Testing Instructions

1. Sync to iOS: `git pull && npm install && npm run build && npx cap sync ios`
2. Clean build in Xcode: `Cmd+Shift+K`
3. Run on device: `Cmd+R`

### Expected Outcomes

- ✅ Toasts appear above the iOS tab bar consistently
- ✅ Review prompt allows dismissal without freezing
- ✅ Gold badges remain gold even after adding new tasks
- ✅ Coins on Presence page display at correct size (edge-to-edge in circles)
- ✅ No console errors from HomeTour component
