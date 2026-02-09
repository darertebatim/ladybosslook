

# Push Notification Enhancements

## 1. Streak Challenge Notifications (NEW - Server-side)

A new edge function `send-streak-challenges` that runs daily and sends smart, scenario-based notifications to users with active streaks or streak goals.

### Scenarios

**A. Streak Continuation (has active streak, came yesterday)**
- 2-day streak: "2 days in a row! Come back for day 3 and make it a real streak."
- 3-day streak: "3 days strong. You're building something real."
- 5+ days: "Day {n}. You're proving it to yourself."
- Approaching goal (e.g., goal=7, current=5): "{n} of {goal} days done. Just {remaining} more to hit your target."
- Goal reached: "You did it. {goal} days. That's not luck, that's you."

**B. Gold Badge Encouragement (completed some tasks today but not all)**
- Has completions but not 100%: "You've done {completed}/{total} actions today. Finish all to earn your Gold badge."
- Had gold yesterday: "Yesterday was Gold. Can you do it again today?"
- On a gold streak of 2+: "Gold streak: {n} days. Don't break the chain."

**C. First Week Critical Path (account created within 7 days)**
- Day 1 (no completions yet): "Your first action is waiting. Just one tap to start."
- Day 2 (came yesterday): "Day 2! You came back. That's already more than most."
- Day 3-7: "Day {n} of your first week. You're building a habit."
- Didn't come back after day 1: "You started something yesterday. Come back and keep it going."

### Logic
- Runs daily via cron
- Reads from `user_streaks` (current_streak, streak_goal, last_completion_date, current_gold_streak, last_gold_date)
- Reads from `profiles` (created_at for first-week detection, timezone for window check)
- Each user gets MAX 1 notification per day from this function
- Picks the highest-priority scenario (first week > goal proximity > gold > general streak)
- Respects `momentum_celebration` preference toggle (reuses same column)
- Respects 8 AM - 8 PM in user's local timezone
- Deduplicates via `pn_schedule_logs` (type: `streak_challenge_{scenario}`)

### Files
- New: `supabase/functions/send-streak-challenges/index.ts`
- New cron job via SQL (not migration -- contains project-specific keys)
- Update `supabase/config.toml` to add the function
- Update PN Map in admin UI

---

## 2. Non-Rounded Notification Times

You're right -- notifications at :00 or :30 feel scheduled and ignorable. Odd times like 9:47 or 2:13 feel personal and catch attention.

### Changes to `useSmartActionNudges.ts`
- Replace `randomTimeBetween(8, 20)` to generate non-rounded minutes (already does `Math.random() * 60` which naturally produces odd minutes -- this is already correct)
- BUT: avoid exact :00, :15, :30, :45 by adding a small offset if the random minute lands on those values
- Add slight jitter: schedule between 8:03 and 19:47 instead of exactly 8:00-20:00 to avoid edge cases

### Changes to `usePeriodNotifications.ts`
- Currently hardcoded to `hour=9, minute=0` and `hour=10, minute=0` -- change to randomized times like 9:17, 10:43 etc.

---

## 3. Timezone Awareness Audit

Currently timezone is NOT respected in these server-side functions:

| Function | Current | Fix |
|----------|---------|-----|
| `send-drip-followup` | Runs at 10 AM UTC, sends immediately | Add timezone check: only send if user is in 8 AM - 8 PM window |
| `send-momentum-celebration` | Already has `isWithinActiveWindow()` | Good, no change needed |
| `send-streak-challenges` (new) | Will include timezone check | Built-in from the start |
| Drip followup cron | `0 10 * * *` (10 AM UTC) | Change to run every 2 hours so it catches all timezones in their active window |

### Drip Followup Fix
- Update the cron schedule from `0 10 * * *` to `0 */2 * * *` (every 2 hours)
- Add `isWithinActiveWindow()` check to `send-drip-followup/index.ts` using user's `profiles.timezone`
- This way users in any timezone get their notification during their local daytime

### Momentum Keeper Cron
- Currently NOT scheduled as a cron job (missing from `cron.job` table)
- Add cron: run every 2 hours to catch all timezones

---

## Technical Summary

| Change | Type | Files |
|--------|------|-------|
| Streak Challenges | New edge function | `supabase/functions/send-streak-challenges/index.ts` |
| Streak Challenges cron | SQL insert | Via SQL editor (not migration) |
| Momentum Keeper cron | SQL insert | Via SQL editor (not migration) |
| Non-rounded times | Update local scheduler | `src/hooks/useSmartActionNudges.ts` |
| Non-rounded times | Update period notifications | `src/hooks/usePeriodNotifications.ts` |
| Drip timezone fix | Update edge function | `supabase/functions/send-drip-followup/index.ts` |
| Drip cron reschedule | SQL update | Via SQL editor |
| Config + PN Map | Update | `supabase/config.toml`, `src/pages/admin/PushNotifications.tsx` |

