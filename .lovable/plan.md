

# Push Notification System Overhaul

## Overview
Restructure the notification strategy to focus on driving users to take action, maintain momentum, and stay engaged -- not just tell them the time of day.

---

## 1. Momentum Celebration --> "Momentum Keeper" (Rewrite)

**Problem**: Current momentum celebration only fires when users are already active (reaching milestones). It doesn't help bring them back.

**New Strategy -- "Momentum Keeper"**: Server-side notifications that detect INACTIVITY and nudge users back before they lose momentum.

**Logic** (runs daily, checks each user's `last_active_date` and `this_month_active_days`):
- **1 day inactive**: "You showed up {X} days this month. One more today?" (gentle)
- **2 days inactive**: "Your {thisMonthActiveDays}-day momentum is waiting. Come back and keep it alive."
- **3+ days inactive**: "You've been away for {gap} days. Your strength doesn't expire -- come back when you're ready."
- **5+ days inactive**: "Your actions miss you. Even 1 minute counts. Tap to return."
- **7+ days inactive** (final): "No pressure. When you're ready, everything is still here for you."

Also keeps milestone celebrations but only for key ones (7, 14, 21, 30 days) and sends them as local notifications when the user opens the app (in-app toast), not push.

**Changes**:
- Rewrite `send-momentum-celebration` edge function with inactivity-based logic
- Add `coins` context to messages when applicable (e.g., "You have {coins} coins waiting")
- Respect 8 AM - 8 PM window using user timezone
- Rename preference toggle from `momentum_celebration` to keep the same DB column but update label in UI

---

## 2. Daily Notifications --> "Smart Action Nudges" (Replace)

**Problem**: Current system sends generic time-of-day messages ("Morning time", "Afternoon is here") like a clock. Not useful.

**New Strategy**: Local notifications generated from the user's actual planner data. Since all data is on-device, these are 100% local.

### 2a. Random Action Reminder
- On app launch, read user's tasks for today from `user_tasks`
- Pick 1-3 random actions and schedule local notifications at random times between 8 AM and 8 PM
- Message uses actual task data: `"{emoji} {title}" -- "Time to do this! Your strength grows with each action."`
- Only pick incomplete actions
- Reschedule daily on app open

### 2b. ProAction Nudges
- Filter tasks where `pro_link_type` is not null (emotion, journal, breathe, playlist, water)
- Pick one random proaction and schedule at a random time
- Messages like: "🫁 Time for your breathing exercise" or "📝 Your journal is waiting"

### 2c. Water Reminders
- Filter tasks where `pro_link_type = 'water'` or `goal_type = 'water'`
- If user has water tracking: schedule 3-4 random notifications between 8 AM - 8 PM
- Messages: "💧 Have you had water recently?" / "💧 Stay hydrated -- your body will thank you"

### 2d. Period Tracker Notifications (NEW)
- On app launch, if user has `period_settings` with `reminder_enabled = true`:
  - Calculate predicted next period start from `last_period_start + average_cycle`
  - Schedule local notification `reminder_days` before it starts: "🌸 Your period may start in {X} days. Prepare yourself."
  - On predicted start day: "🌸 Your period may have started. Tap to log today."
  - Daily during predicted period (for `average_period` days): "🌸 Don't forget to log today"
- Respect 8 AM - 8 PM window

### Implementation
- Rewrite `useLocalNotificationScheduler.tsx` (currently disabled) as the new "Smart Action Nudge" scheduler
- Remove `send-daily-notifications` edge function's cron job (no longer needed)
- Remove old time-period and goal-nudge notification IDs
- New notification ID ranges: 200001-200010 for action nudges, 200011-200020 for proactions, 200021-200030 for water, 200031-200040 for period
- Add `randomTimeBetween(8, 20)` utility for scheduling
- Update `useLocalNotificationScheduler` to fetch user's tasks and period settings on app launch

---

## 3. Drip Content Follow-up (NEW)

**Problem**: If a user gets a "New content unlocked" notification but never opens the playlist, there's no follow-up.

**Strategy**: Server-side check (daily cron) for users who have unlocked content but haven't listened.

**Logic**:
- Query `audio_playlist_items` with `drip_delay_days` that have been unlocked (based on enrollment date)
- Cross-reference with `audio_progress` to see if user has started/completed
- If unlocked 2+ days ago and no progress: send follow-up
- Only 1 follow-up per content item (track in `pn_schedule_logs`)
- Messages: "🎧 '{title}' is waiting for you. Tap to listen." / "🔓 You unlocked '{title}' {X} days ago. Don't miss it!"

**Changes**:
- Create new edge function `send-drip-followup` 
- Add cron job (daily)
- Add `content_drip` preference check (reuse existing toggle)

---

## 4. Server Logs --> Separate "Logs" Tab (UI)

**Problem**: "Recent Server Runs" is cramped and shows limited data (15 rows).

**Changes**:
- Move logs to a new 4th tab: "Logs"
- Show last 100 entries (up from 15)
- Add columns: `user_id` (show user name via join), `notification_type`
- Add filters: by function name, by date range
- Show summary stats at top: total sent today, total failed, unique users notified
- Make it clear which users are getting notifications and how many

---

## 5. PN Map Updates

Update the PN Map documentation to reflect all changes:
- Rename "Daily Notifications" to "Smart Action Nudges" (Local)
- Rename "Momentum Celebration" to "Momentum Keeper" (Server) 
- Add "Period Reminders" (Local)
- Add "Drip Content Follow-up" (Server)
- Remove old time-based message templates
- Update delivery strategy note at bottom

---

## Technical Summary

| Change | Type | Files |
|--------|------|-------|
| Momentum Keeper | Rewrite edge function | `supabase/functions/send-momentum-celebration/index.ts` |
| Smart Action Nudges | Rewrite local scheduler | `src/hooks/useLocalNotificationScheduler.tsx` |
| Period Reminders | Add to local scheduler | `src/hooks/useLocalNotificationScheduler.tsx` |
| Water Reminders | Add to local scheduler | `src/hooks/useLocalNotificationScheduler.tsx` |
| Drip Follow-up | New edge function + cron | `supabase/functions/send-drip-followup/index.ts` |
| Logs Tab | UI refactor | `src/pages/admin/PushNotifications.tsx` |
| PN Map | Update docs | `src/pages/admin/PushNotifications.tsx` |
| Remove daily-notifications cron | Migration | New migration SQL |
| Notification logger types | Update | `src/lib/localNotificationLogger.ts` |

