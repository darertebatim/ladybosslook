

# Three Presence Improvements

## 1. Streak Challenge Completion Celebration + Upgrade Prompt

**Problem**: User ALILOTFIHAMI has `current_streak=9` with `streak_goal=7` -- they completed the challenge but nothing happened. The `StreakChallengeCard` just shows a static "You completed the 7-day challenge!" text.

**Solution**:
- When `current_streak >= streak_goal` is first detected, show a **celebration modal** (similar to the gold celebration style) congratulating the user
- After dismissing, show the **StreakGoalSelection** modal pre-filtered to show only goals **higher** than the completed one (e.g., completed 7 -> show 14, 30, 50)
- Track in `user_streaks` table: add a `streak_goal_completed_at` column to know when it was completed and prevent re-showing the celebration
- The `StreakChallengeCard` should also show a "Level Up" button when the challenge is completed, so users can upgrade anytime

**Files to change**:
- `src/components/app/StreakChallengeCard.tsx` -- add "Level Up" CTA when completed
- `src/components/app/StreakGoalSelection.tsx` -- add `minGoal` prop to filter out already-completed goals, add a congratulatory header variant
- `src/pages/app/AppHome.tsx` -- detect streak goal completion, trigger celebration + upgrade flow
- `src/hooks/useTaskPlanner.tsx` -- update `useSetStreakGoal` to also set `streak_goal_completed_at` to null when upgrading
- New migration -- add `streak_goal_completed_at` column to `user_streaks`

## 2. Redefine "Returns" as App Visit Count

**Problem**: Currently `return_count` only increments when a user comes back after a 2+ day absence. The user wants "Returns" to count how many times a user opens/returns to the app, encouraging healthy app visits instead of social media scrolling.

**Solution**:
- Change the `return_count` logic to increment every time the user opens/visits the app (each app launch or return from background counts as 1)
- Track via a lightweight mechanism: when the app mounts or returns to foreground, call a simple increment
- Use the existing Capacitor `App` plugin's `appStateChange` listener (already available) to detect foreground returns
- Add a new `app_return_count` column to `profiles` (keep old `return_count` for migration safety), or repurpose `return_count` directly since its current value is 0 for most users

**Files to change**:
- `src/hooks/useUserPresence.tsx` -- new `useTrackAppReturn()` hook that increments `return_count` on each app open/foreground event
- `src/components/app/AppShell.tsx` or top-level layout -- call the tracking hook on mount and on `appStateChange` resume
- `src/pages/app/AppPresence.tsx` -- the "Returns" stat card already shows `returnCount`, so it will automatically reflect the new behavior
- The `updatePresence` function's return-tracking logic (gap > 2 days) should be removed, as returns are now tracked independently

## 3. Fix Push Notification Timing (Double PNs at Same Time)

**Problem**: All three 2-hourly crons (`send-momentum-celebration-2h`, `send-streak-challenges-2h`, `send-drip-followup-2h`) run at the exact same schedule: `0 */2 * * *` (top of every 2 hours). This means:
- User got BOTH a `momentum_keeper_1d` AND a `streak_challenge_gold_streak` at the exact same second
- The staggering described in the architecture (Drip at :00, Momentum at :20, Streak at :40) was **never implemented**

Additionally, there's a **timezone bug**: the momentum function sent a "1 day inactive" notification to a user who was active that same day in their local timezone (PST), because the cron ran at midnight UTC (4 PM PST on Feb 12) and saw `last_active_date = 2026-02-12` as "1 day ago" in UTC terms.

**Solution**:
- **Stagger the cron schedules** via a migration:
  - `send-drip-followup-2h`: keep at `0 */2 * * *` (offset :00)
  - `send-momentum-celebration-2h`: change to `20 */2 * * *` (offset :20)
  - `send-streak-challenges-2h`: change to `40 */2 * * *` (offset :40)
- **Add cross-function daily cooldown**: Before sending, each function should check if the user already received ANY server-side PN today (not just from its own function). This prevents the same user from getting both a momentum and a streak notification on the same day.
- **Fix timezone in momentum function**: The `last_active_date` comparison should use the user's local date, not UTC date, to determine inactivity gap.

**Files to change**:
- New migration SQL -- `cron.unschedule` + `cron.schedule` with staggered offsets
- `supabase/functions/send-momentum-celebration/index.ts` -- add cross-function cooldown check + fix timezone date comparison
- `supabase/functions/send-streak-challenges/index.ts` -- add cross-function cooldown check (query `pn_schedule_logs` for ANY server-side PN today, not just `streak_challenge_%`)

---

## Technical Details

### Migration: Streak Goal Completion Tracking
```sql
ALTER TABLE user_streaks 
ADD COLUMN IF NOT EXISTS streak_goal_completed_at TIMESTAMPTZ DEFAULT NULL;
```

### Migration: Stagger Cron Jobs
```sql
SELECT cron.unschedule('send-momentum-celebration-2h');
SELECT cron.schedule('send-momentum-celebration-2h', '20 */2 * * *', ...);

SELECT cron.unschedule('send-streak-challenges-2h');
SELECT cron.schedule('send-streak-challenges-2h', '40 */2 * * *', ...);
```

### Cross-Function Cooldown Logic (in both edge functions)
```typescript
// Check if user already got ANY server-side PN today
const { data: anyPnToday } = await supabase
  .from('pn_schedule_logs')
  .select('user_id')
  .in('function_name', ['send-momentum-celebration', 'send-streak-challenges', 'send-drip-followup'])
  .gte('sent_at', `${todayInUserTz}T00:00:00Z`);
const alreadyNotifiedSet = new Set(anyPnToday?.map(s => s.user_id));
```

### App Return Tracking
```typescript
// In a top-level component
useEffect(() => {
  // Track initial app open
  incrementReturnCount();
  
  // Track returns from background (Capacitor)
  const listener = App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) incrementReturnCount();
  });
  
  return () => { listener.then(l => l.remove()); };
}, []);
```

