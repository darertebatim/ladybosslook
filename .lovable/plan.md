
# Plan: Enhanced Mood Check-in Tool

## Overview

Transform the current Quick Mood Check-in (bottom sheet) into a full-page wellness tool similar to the Emotions and Period tracker tools. The tool will feature:

1. **Interactive "I feel..." button** that updates based on mood selection
2. **Calendar/Stats view** for mood history (like Period tracker)
3. **Add to Rituals integration** as a Pro-linked tool
4. **Auto-complete for planner** when mood is logged

---

## Architecture Design

```
Current Flow:
Home Header → Click Smile → Bottom Sheet Drawer → Select Mood → Done

New Flow:
Home Header → Click Smile → Full Page Tool (/app/mood)
                                    │
                          ┌─────────┴─────────┐
                          ▼                   ▼
                    Stats Button        Add to Rituals
                    (Calendar)            (Pro Task)
                          │
                          ▼
              Mood History Calendar
             (shows mood per day)
```

---

## Changes Summary

### 1. Create New Mood Page (`/app/mood`)

A full-page tool matching the aesthetic of the Emotions tool but with a yellow/amber gradient theme. Features:

- **Header**: Back button, "Mood Check-in" title, History button (calendar icon)
- **5 Mood Options**: Great, Good, Okay, Not Great, Bad with 3D Fluent Emoji
- **Selection indicator**: Checkmark badge on selected mood (like screenshots)
- **Bottom action bar**:
  - Left: Stats/Calendar button (black circle)
  - Center: "I feel..." button that updates to "I feel great!!!", "I feel good!", etc.
  - Right: Add to Rituals button (black circle)

### 2. Create Mood History Page (`/app/mood/history`)

Similar to Period tracker calendar:
- Monthly calendar view
- Each day shows the mood emoji logged
- Color-coded by mood level
- Tap day to see details

### 3. Add Mood as Pro Link Type

Update the Pro Task system to support `mood` as a new link type:
- Add `'mood'` to `ProLinkType` union
- Add `PRO_LINK_CONFIGS.mood` configuration
- Add `autoCompleteMood()` to `useAutoCompleteProTask`
- Add route `/app/mood` to `getProTaskNavigationPath`

### 4. Update Home Header Integration

Change the Smile button behavior:
- Navigate to `/app/mood` instead of opening drawer
- Remove the QuickMoodCheckIn drawer component usage

### 5. Create Mood Logging Hook

Extend journal entry creation to track mood separately for calendar display. Create `useMoodLogs` hook:
- `useMoodLogs()` - fetch mood entries from journal_entries
- `useMoodLogsForMonth(month)` - get moods for calendar display
- `useTodayMood()` - check if mood logged today

---

## Technical Details

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/AppMood.tsx` | Main mood check-in page |
| `src/pages/app/AppMoodHistory.tsx` | Mood calendar/history page |
| `src/components/mood/MoodDashboard.tsx` | Main UI with mood grid and action bar |
| `src/components/mood/MoodCalendar.tsx` | Monthly calendar with mood indicators |
| `src/hooks/useMoodLogs.tsx` | Hook for mood data fetching |

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/proTaskTypes.ts` | Add `'mood'` to ProLinkType, add config |
| `src/hooks/useAutoCompleteProTask.tsx` | Add `autoCompleteMood()` function |
| `src/hooks/useTaskPlanner.tsx` | Add `'mood'` to pro_link_type union |
| `src/hooks/useRoutinePlans.tsx` | Add `'mood'` to pro_link_type union |
| `src/pages/app/AppHome.tsx` | Change Smile button to navigate to /app/mood |
| `src/App.tsx` | Add routes for /app/mood and /app/mood/history |
| `src/components/app/HomeMenu.tsx` | Add Mood tool to menu |

### UI Design

The "I feel..." button states:
- **No selection**: "I feel..." (gray, disabled)
- **Great**: "I feel great!!!" (black, bold)
- **Good**: "I feel good!" (black)
- **Okay**: "I feel just Okay." (black)
- **Not Great**: "I feel not great..." (black)
- **Bad**: "I feel bad..." (black)

### Synthetic Task Definition

```typescript
const SYNTHETIC_MOOD_TASK: RoutinePlanTask = {
  id: 'synthetic-mood-task',
  plan_id: 'synthetic-mood',
  title: 'Daily Mood Check-in',
  icon: '😊',
  color: 'yellow',
  task_order: 0,
  is_active: true,
  pro_link_type: 'mood',
  pro_link_value: null,
  tag: 'pro',
};
```

### Data Model

Mood data continues to use `journal_entries` table:
- `mood` column stores: 'great', 'good', 'okay', 'not_great', 'bad'
- Calendar aggregates by `created_at` date
- Each day shows the most recent mood logged

---

## Implementation Steps

1. **Add 'mood' to Pro Link types** - Update type definitions and configs
2. **Create useMoodLogs hook** - Data fetching from journal_entries
3. **Create AppMood page** - Full-page UI with all features
4. **Create MoodCalendar component** - Calendar visualization
5. **Create AppMoodHistory page** - History view wrapper
6. **Add autoCompleteMood** - Planner integration
7. **Update routes** - Add /app/mood routes to App.tsx
8. **Update Home header** - Navigate to /app/mood
9. **Update HomeMenu** - Add Mood tool entry
10. **Clean up** - Remove unused QuickMoodCheckIn drawer usage

---

## Edge Cases Handled

- **Multiple moods per day**: Show most recent on calendar, list all in history
- **No mood logged**: Calendar shows empty day (no indicator)
- **Legacy moods**: Maintain backward compatibility with existing journal entries
- **Already added ritual**: Show "Added - Go to Planner" state
