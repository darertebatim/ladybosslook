
# Finch-Style "Time of Day" Scheduling Feature

## Overview

This plan adds a **Time of Day** scheduling mode inspired by Finch, allowing users to choose approximate time categories instead of specific clock times. This reduces cognitive load and is perfect for flexible routines.

---

## User Experience

### Time Selection Options

Users will choose between **three modes** when setting task time:

```text
+--------------------------------------------------+
|  (Back)           Time                    Save   |
|                                                  |
|          Do it in the Start of the day          |
|                                                  |
|  +---------+---------+------------+              |
|  | Anytime | Part of | Specific   |              |
|  |         | Day     | Time       |              |
|  +---------+---------+------------+              |
|                                                  |
|  ☀️  Start of Day        (6am - 9am)  [ ● ]     |
|  🌤️  Morning             (9am - 12pm) [   ]     |
|  🌞  Afternoon           (12pm - 5pm) [   ]     |
|  🌅  Evening             (5pm - 9pm)  [   ]     |
|  🌙  Night               (9pm - 12am) [   ]     |
|                                                  |
+--------------------------------------------------+
```

### Three Time Modes

| Mode | Description | Display on Card |
|------|-------------|-----------------|
| **Anytime** | No specific time constraint | "Anytime" |
| **Part of Day** | Approximate time category | "Morning" / "Evening" etc. |
| **Specific Time** | Exact time (current behavior) | "9:30 AM" |

---

## Time of Day Categories

Based on the Finch screenshot, here are the proposed categories:

| ID | Label | Emoji | Time Range | Reminder Default |
|----|-------|-------|------------|------------------|
| `start_of_day` | Start of Day | ☀️ | 6:00 AM - 9:00 AM | 7:00 AM |
| `morning` | Morning | 🌤️ | 9:00 AM - 12:00 PM | 9:00 AM |
| `afternoon` | Afternoon | 🌞 | 12:00 PM - 5:00 PM | 12:00 PM |
| `evening` | Evening | 🌅 | 5:00 PM - 9:00 PM | 6:00 PM |
| `night` | Night | 🌙 | 9:00 PM - 12:00 AM | 9:00 PM |

---

## Database Changes

### Option A: Add `time_period` Column (Recommended)

Add a new column to `user_tasks` table:

```sql
ALTER TABLE user_tasks 
ADD COLUMN time_period TEXT DEFAULT NULL;

-- Valid values: 'start_of_day', 'morning', 'afternoon', 'evening', 'night'
-- NULL means either "Anytime" (if scheduled_time is also NULL) or "Specific Time" (if scheduled_time is set)
```

**Logic:**
- `time_period = NULL` + `scheduled_time = NULL` = Anytime
- `time_period = 'morning'` + `scheduled_time = NULL` = Part of Day (Morning)
- `time_period = NULL` + `scheduled_time = '09:30'` = Specific Time

### Schema Update for `admin_task_bank`

Apply same column to the task bank for template consistency:

```sql
ALTER TABLE admin_task_bank 
ADD COLUMN time_period TEXT DEFAULT NULL;
```

---

## TypeScript Types

```typescript
// lib/taskScheduling.ts (new file)

export type TimePeriod = 
  | 'start_of_day' 
  | 'morning' 
  | 'afternoon' 
  | 'evening' 
  | 'night';

export type TimeMode = 'anytime' | 'part_of_day' | 'specific';

export interface TimePeriodConfig {
  id: TimePeriod;
  label: string;
  emoji: string;
  timeRange: { start: string; end: string }; // HH:mm format
  defaultReminder: string; // HH:mm format
}

export const TIME_PERIODS: TimePeriodConfig[] = [
  { 
    id: 'start_of_day', 
    label: 'Start of Day', 
    emoji: '☀️', 
    timeRange: { start: '06:00', end: '09:00' },
    defaultReminder: '07:00' 
  },
  { 
    id: 'morning', 
    label: 'Morning', 
    emoji: '🌤️', 
    timeRange: { start: '09:00', end: '12:00' },
    defaultReminder: '09:00' 
  },
  { 
    id: 'afternoon', 
    label: 'Afternoon', 
    emoji: '🌞', 
    timeRange: { start: '12:00', end: '17:00' },
    defaultReminder: '12:00' 
  },
  { 
    id: 'evening', 
    label: 'Evening', 
    emoji: '🌅', 
    timeRange: { start: '17:00', end: '21:00' },
    defaultReminder: '18:00' 
  },
  { 
    id: 'night', 
    label: 'Night', 
    emoji: '🌙', 
    timeRange: { start: '21:00', end: '24:00' },
    defaultReminder: '21:00' 
  },
];

// Helper to get time mode from task data
export function getTimeMode(task: { scheduled_time?: string | null; time_period?: string | null }): TimeMode {
  if (task.time_period) return 'part_of_day';
  if (task.scheduled_time) return 'specific';
  return 'anytime';
}

// Helper to format time display
export function formatTimeLabel(task: { scheduled_time?: string | null; time_period?: string | null }): string {
  if (task.time_period) {
    const period = TIME_PERIODS.find(p => p.id === task.time_period);
    return period ? period.label : 'Anytime';
  }
  if (task.scheduled_time) {
    // Format as 12-hour time
    const [hours, minutes] = task.scheduled_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  return 'Anytime';
}
```

---

## UI Component Changes

### 1. Update Time Picker Sheet (`AppTaskCreate.tsx`)

Replace current time picker with a three-tabbed interface:

```text
Current:
- Toggle: Specified time ON/OFF
- Sub-toggle: Point time / Time period

New:
- Three-way toggle: Anytime / Part of Day / Specific Time
- If "Part of Day": Show category list
- If "Specific Time": Show current wheel picker
```

**State Changes:**
```typescript
// Current state
const [scheduledTime, setScheduledTime] = useState<string | null>(null);
const [timeMode, setTimeMode] = useState<'point' | 'period'>('point');

// New state
const [scheduledTime, setScheduledTime] = useState<string | null>(null);
const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(null);
// timeMode is now derived from scheduledTime and timePeriod
```

### 2. Update TaskCard Display

Modify `formatTime` function in `TaskCard.tsx`:

```typescript
const formatTime = (task: UserTask) => {
  // Check for time_period first (Part of Day)
  if (task.time_period) {
    const period = TIME_PERIODS.find(p => p.id === task.time_period);
    return period ? `${period.emoji} ${period.label}` : 'Anytime';
  }
  
  // Check for specific time
  if (task.scheduled_time) {
    const [hours, minutes] = task.scheduled_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  
  return 'Anytime';
};
```

### 3. Update Task Sorting Logic

In `useTaskPlanner.tsx`, update sort logic to handle time periods:

```typescript
// Sort tasks: specific times first (chronologically), then time periods (by category order), then Anytime
const sortedTasks = [...tasksForDate].sort((a, b) => {
  // Both have specific times
  if (a.scheduled_time && b.scheduled_time) {
    return a.scheduled_time.localeCompare(b.scheduled_time);
  }
  
  // Specific time comes before time_period
  if (a.scheduled_time && !b.scheduled_time) return -1;
  if (!a.scheduled_time && b.scheduled_time) return 1;
  
  // Both have time_periods - sort by category order
  if (a.time_period && b.time_period) {
    const aOrder = TIME_PERIODS.findIndex(p => p.id === a.time_period);
    const bOrder = TIME_PERIODS.findIndex(p => p.id === b.time_period);
    return aOrder - bOrder;
  }
  
  // Time period before Anytime
  if (a.time_period && !b.time_period) return -1;
  if (!a.time_period && b.time_period) return 1;
  
  // Both Anytime - sort by order_index
  return a.order_index - b.order_index;
});
```

---

## Reminder Integration

When a task has `time_period` set (and no `scheduled_time`), reminders will use the period's `defaultReminder` time:

**In `send-task-reminders` edge function:**

```typescript
// Calculate reminder time
function getTaskReminderTime(task: TaskWithReminder): string | null {
  // If specific time is set, use it
  if (task.scheduled_time) {
    return task.scheduled_time;
  }
  
  // If time_period is set, use default reminder for that period
  if (task.time_period) {
    const period = TIME_PERIODS.find(p => p.id === task.time_period);
    return period?.defaultReminder || null;
  }
  
  // Anytime tasks - no automatic reminder time
  return null;
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/taskScheduling.ts` | **Create** | Time period constants, types, and helpers |
| `src/pages/app/AppTaskCreate.tsx` | **Modify** | Replace time picker with 3-mode selector |
| `src/components/app/TaskCard.tsx` | **Modify** | Update time display to handle time_period |
| `src/hooks/useTaskPlanner.tsx` | **Modify** | Add time_period to types, update sorting |
| `supabase/functions/send-task-reminders/index.ts` | **Modify** | Handle time_period for reminders |
| `supabase/migrations/xxx.sql` | **Create** | Add time_period column to both tables |

---

## Implementation Order

1. **Database Migration**
   - Add `time_period` column to `user_tasks`
   - Add `time_period` column to `admin_task_bank`

2. **Create Helper File**
   - Create `src/lib/taskScheduling.ts` with types and constants

3. **Update Types**
   - Add `time_period` to `UserTask` interface in `useTaskPlanner.tsx`
   - Add to `CreateTaskInput` and `UpdateTaskInput`

4. **Update Time Picker UI**
   - Modify `AppTaskCreate.tsx` to show three-mode selector
   - Add Part of Day category list UI

5. **Update Task Display**
   - Modify `TaskCard.tsx` to display time_period labels

6. **Update Sorting**
   - Modify `useTasksForDate` to sort with time_periods

7. **Update Reminders**
   - Modify edge function to handle time_period default reminders

---

## UI Design Details

### Time Picker Sheet Layout

```text
+------------------------------------------------+
| (←)              Time               Save        |
+------------------------------------------------+
|                                                 |
|      Do it in the Morning                       |
|                                                 |
| +------------+-----------+-------------+        |
| | 🕐 Anytime | 🌤️ Part  | 🎯 Specific |        |
| |            | of Day    | Time        |        |
| +------------+-----------+-------------+        |
|                                                 |
| [Part of Day selected - show categories:]       |
|                                                 |
| +---------------------------------------------+ |
| | ☀️  Start of Day                       (●) | |
| |     6am - 9am                               | |
| +---------------------------------------------+ |
| | 🌤️  Morning                            ( ) | |
| |     9am - 12pm                              | |
| +---------------------------------------------+ |
| | 🌞  Afternoon                          ( ) | |
| |     12pm - 5pm                              | |
| +---------------------------------------------+ |
| | 🌅  Evening                            ( ) | |
| |     5pm - 9pm                               | |
| +---------------------------------------------+ |
| | 🌙  Night                              ( ) | |
| |     9pm - 12am                              | |
| +---------------------------------------------+ |
+------------------------------------------------+
```

### Category Card Design

Each category option shows:
- Emoji + Label (left aligned, bold)
- Time range below in muted text
- Radio button indicator (right aligned)
- Selected state: Yellow/mint highlight background

---

## Summary

This feature adds **Finch-style approximate time scheduling** to the LadyBoss planner:

- **Lower cognitive load**: Users don't need to pick exact times for flexible tasks
- **Natural language feel**: "Do it in the morning" instead of "Do it at 9:00 AM"
- **Maintains precision option**: Users can still choose specific times when needed
- **Seamless reminder integration**: Each time period has a sensible default reminder time
- **Consistent with existing UX**: Uses the same sheet-based picker pattern
