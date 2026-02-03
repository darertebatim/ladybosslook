

# Plan: Smart Task Push Notification System

## Summary
Implement a balanced, timezone-aware push notification strategy for tasks that maximizes user engagement without overwhelming them. The system will:
- Send 3-4 PNs per day maximum
- Remind users of Anytime tasks (morning + evening)
- Celebrate goal milestones (50%, 100%)
- Auto-detect and store user timezone on app open

---

## Notification Schedule Design

```text
Daily PN Timeline (max 3-4 per day):

 7:00 AM   Morning Kickoff (1 PN)
           "☀️ Good morning! You have 5 tasks for today"
           - Lists incomplete tasks with time periods
           - Only if user has tasks for today
           
10:00 AM   Specific Time Task (if any)
           "📝 Journal - It's time!"
           - Only for tasks with scheduled_time
           - Per-task individual PNs

 6:00 PM   Evening Check-in (1 PN)
           "🌅 3 tasks left today - you've got this!"
           - Only if incomplete Anytime tasks remain
           - Shows count + first task name

 9:00 PM   Goal Milestone (when achieved)
           "🎉 2/3 chapters done! Keep going!"
           - When user hits 50% or 100% of count goal
           - Triggered by auto-complete hook
```

---

## Technical Implementation

### 1. Add Timezone to Profiles Table
**Migration**: `add_timezone_to_profiles.sql`

Add `timezone` column to `profiles` table for centralized timezone storage.

```sql
ALTER TABLE profiles 
ADD COLUMN timezone text DEFAULT 'America/Los_Angeles';
```

### 2. Auto-Detect Timezone on App Open
**File**: `src/hooks/useTimezoneSync.ts` (new)

Creates a hook that:
- Runs once on app launch
- Gets browser/device timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Updates `profiles.timezone` if different
- Uses a debounced update to avoid excessive writes

### 3. Integrate Timezone Sync in App Layout
**File**: `src/layouts/NativeAppLayout.tsx` (modify)

Add the new hook to run on every app open.

### 4. Create Summary PN Edge Function
**File**: `supabase/functions/send-task-summary/index.ts` (new)

New edge function that handles:
- **Morning Kickoff** (7 AM local time)
- **Evening Check-in** (6 PM local time)

Logic:
1. Query all users with their timezone
2. For each user where current hour matches target hour:
   - Fetch today's incomplete tasks
   - Skip if no tasks or all completed
   - Send appropriate summary PN

Runs hourly via cron to catch users in different timezones.

### 5. Modify Existing Task Reminders
**File**: `supabase/functions/send-task-reminders/index.ts` (modify)

Update to:
- Use `profiles.timezone` instead of `journal_reminder_settings.timezone`
- Handle `time_period` tasks by using their `defaultReminder` time
- Skip users who already received a summary PN in the same period

### 6. Add Goal Milestone Notifications
**File**: `src/hooks/useAutoCompleteProTask.tsx` (modify)

When goal progress is updated:
- Check if 50% or 100% milestone reached
- Trigger local notification for celebration
- Store milestone in `localStorage` to avoid duplicate celebrations

### 7. Cron Job for Summary PNs
**SQL**: Add new cron schedule

```sql
-- Run hourly to catch users in all timezones
cron.schedule(
  'send-task-summary-hourly',
  '0 * * * *', -- every hour at :00
  ...
)
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `add_timezone_to_profiles.sql` | Migration | Add timezone column |
| `src/hooks/useTimezoneSync.ts` | Create | Auto-detect and sync timezone |
| `src/layouts/NativeAppLayout.tsx` | Modify | Call timezone sync on app load |
| `supabase/functions/send-task-summary/index.ts` | Create | Morning/evening summary PNs |
| `supabase/functions/send-task-reminders/index.ts` | Modify | Use profiles.timezone, handle time_period |
| `src/hooks/useAutoCompleteProTask.tsx` | Modify | Goal milestone celebrations |

---

## PN Logic Summary Table

| Task Type | When Reminded | PN Type |
|-----------|---------------|---------|
| Specific Time (`scheduled_time`) | At scheduled time minus offset | Individual task PN |
| Part of Day (`time_period`) | Morning summary OR evening check-in | Grouped summary PN |
| Anytime (no time set) | Morning summary + evening if incomplete | Grouped summary PN |
| Count Goals | When 50% or 100% reached | Celebration PN (local) |

---

## Timezone-Aware Logic

```text
Server runs hourly at :00

For each user:
  1. Get user's timezone from profiles.timezone
  2. Convert server UTC time → user's local time
  3. If local hour = 7 → Send morning kickoff
  4. If local hour = 18 → Send evening check-in
  5. Track sent PNs in pn_schedule_logs to avoid duplicates
```

---

## Rate Limiting Built-In

| Control | Implementation |
|---------|----------------|
| Max 1 morning PN | Check `pn_schedule_logs` for today's 'morning_summary' |
| Max 1 evening PN | Check `pn_schedule_logs` for today's 'evening_summary' |
| Skip if all complete | Don't send if user has 0 incomplete tasks |
| Individual task PNs | Limited to tasks with specific times only |

---

## Example PN Copy

**Morning Kickoff (7 AM)**
```
Title: ☀️ Good morning, {name}!
Body: You have 5 tasks today. Start with "Morning Journaling" ✨
```

**Evening Check-in (6 PM)**
```
Title: 🌅 Almost done!
Body: 2 tasks left today. You've got this! 💪
```

**Goal Milestone (50%)**
```
Title: 🎉 Halfway there!
Body: 2/4 chapters done on "Listen to Audiobook"
```

**Goal Milestone (100%)**
```
Title: 🏆 Goal complete!
Body: You finished all 4 chapters! Amazing work ✨
```

