

## Remove Gold Streak Recovery

Keep daily streak recovery as-is, but stop offering the recovery shield for broken **gold** streaks. When a user breaks their gold streak, no prompt appears — the gold streak simply resets.

### Changes

**1. `src/pages/app/AppHome.tsx`**
- Remove the `useEffect` block (around lines 365–393) that detects a broken gold streak and triggers `setShowGoldRecoveryPrompt(true)`.
- Remove the `showGoldRecoveryPrompt` / `setShowGoldRecoveryPrompt` state (line 164).
- Remove the related props passed into `<HomeCelebrations />` (`showGoldRecoveryPrompt`, `setShowGoldRecoveryPrompt`, `previousGoldStreak`).
- Keep `showRecoverySuccess` only for the `'streak'` case — narrow its type to `'streak' | null`.

**2. `src/components/app/HomeCelebrations.tsx`**
- Remove the import and rendered `<GoldStreakLostBanner />` block (around lines 23, 355–375).
- Remove the corresponding props from the `HomeCelebrationsProps` interface (`showGoldRecoveryPrompt`, `setShowGoldRecoveryPrompt`, `previousGoldStreak`) and from the destructure.
- Simplify `<RecoverySuccessBanner />` so it always renders the day-streak variant (drop the `=== 'gold'` branches).

**3. `src/components/app/GoldStreakLostBanner.tsx`**
- Delete the file (no longer used in production).

**4. `src/pages/admin/AppTest.tsx`** (admin preview page)
- Remove the `GoldStreakLostBanner` import, the two `<GoldStreakLostBanner />` preview blocks, the related state (`showGoldStreakLostBanner`, `showGoldLostNoShields`), and their trigger buttons. This keeps the admin test page consistent so it doesn't reference a deleted component.

### What stays unchanged
- `StreakRecoveryPrompt` (daily streak shield) and `useRecoverStreak` hook remain fully functional.
- Gold streak tracking, gold celebrations (`GoldStreakCelebration`), and gold badges continue working — only the *recovery offer* for gold is removed.
- Shield quota (1 free / 3 Plus) is still consumed only by daily-streak recovery.

