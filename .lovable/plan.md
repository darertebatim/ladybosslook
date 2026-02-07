
# Plan: Streak Goal Challenge Feature

## Overview
Implement a "Streak Goal" feature inspired by the me+ app that:
1. Prompts users to set a streak goal (7, 14, 30, or 50 days) after their first streak day
2. Displays a "Streak Challenge" progress card on the Presence page
3. Shows progress with an animated striped orange progress bar

---

## User Flow

```text
User completes first task → Celebration modal appears → User taps "I'm committed"
                                                              ↓
                                          Streak Goal Selection page slides up
                                                              ↓
                                          User picks goal (7, 14, 30, 50)
                                                              ↓
                                          "Commit to my goal" → Saves to DB
                                                              ↓
                                          Presence page shows Streak Challenge card
```

---

## Components to Create

### 1. StreakGoalSelection (Full-screen modal/page)

Design matching me+ screenshots:
- Purple/violet gradient background (as shown in reference images)
- Large orange flame badge with selected number inside
- "Days" label below flame
- Title: "Pick Your **Streak Goal** and Stay on Track!"
- Four rounded selection buttons: 7, 14, 30, 50
  - Selected: Orange background with white ring
  - Unselected: Semi-transparent purple/gray
- Motivational text with multiplier (2x, 5x, 7x, 9x based on goal)
- Black "Commit to my goal" button at bottom
- Decorative dots/sparkles in background

### 2. StreakChallengeCard (for Presence page)

Design matching me+ screenshot:
- White rounded card
- "Streak Challenge" header
- "Day X" in orange (current streak)
- "of the Y-day challenge" subtitle
- Striped orange progress bar with flame icon
- Goal number badge at end of progress bar

### 3. StreakProgressBar (reusable component)

Custom progress bar with:
- Gray/light background track
- Orange striped fill (diagonal lines like candy cane)
- Small flame icon at current progress position
- Goal number circle at end

---

## Database Changes

### Add to `user_streaks` table:
```sql
ALTER TABLE user_streaks 
ADD COLUMN streak_goal integer DEFAULT NULL,
ADD COLUMN streak_goal_set_at timestamp with time zone DEFAULT NULL;
```

This stores:
- `streak_goal`: The target (7, 14, 30, or 50)
- `streak_goal_set_at`: When the goal was set (to track challenge start)

---

## Files to Create

### New Components:
1. `src/components/app/StreakGoalSelection.tsx` - Full-screen goal picker
2. `src/components/app/StreakChallengeCard.tsx` - Progress card for Presence page
3. `src/components/app/StreakProgressBar.tsx` - Striped progress bar with flame

---

## Files to Modify

### 1. `src/components/app/StreakCelebration.tsx`
- Add state to track if we should show goal selection after close
- On first streak day, trigger goal selection flow after modal closes
- Pass callback to parent to open goal selection

### 2. `src/pages/app/AppHome.tsx`
- Add state for streak goal selection modal
- Handle the flow: celebration closes → goal selection opens (if first day and no goal set)
- Add mutation to save streak goal

### 3. `src/pages/app/AppPresence.tsx`
- Import and display StreakChallengeCard
- Show only when user has a streak goal set
- Fetch streak goal from user_streaks

### 4. `src/hooks/useTaskPlanner.tsx`
- Extend `UserStreak` interface to include `streak_goal` and `streak_goal_set_at`
- Add mutation hook for setting streak goal
- Update query to fetch these new fields

### 5. `src/integrations/supabase/types.ts`
- Will be auto-updated when database migration runs

---

## Design Specifications

### StreakGoalSelection Colors:
- Background: `from-violet-400 via-violet-500 to-violet-600`
- Decorative curves: Semi-transparent white wavy lines
- Sparkle dots: White with varying opacity
- Flame badge: Orange gradient with white stroke
- Selected button: `bg-orange-400` with `ring-4 ring-white`
- Unselected button: `bg-violet-400/50`
- CTA button: `bg-gray-900 text-white`

### Multiplier Messages:
| Goal | Message |
|------|---------|
| 7 days | "You'll be **2x** as likely to achieve a healthier lifestyle!" |
| 14 days | "You'll be **5x** as likely to achieve a healthier lifestyle!" |
| 30 days | "You'll be **7x** as likely to achieve a healthier lifestyle!" |
| 50 days | "You'll be **9x** as likely to achieve a healthier lifestyle!" |

### StreakProgressBar:
```css
/* Striped pattern */
background: repeating-linear-gradient(
  45deg,
  #fb923c,
  #fb923c 8px,
  #fdba74 8px,
  #fdba74 16px
);
```

### StreakChallengeCard Layout:
- Container: `bg-white rounded-2xl p-4 shadow-sm`
- Header: `text-sm font-semibold text-gray-900`
- Day number: `text-3xl font-bold text-orange-500`
- Subtitle: `text-sm text-gray-500`
- Progress bar height: `h-3`
- Goal badge: Small gray circle with number

---

## Flow Logic

### When to Show Goal Selection:
```typescript
const shouldShowGoalSelection = (streak: UserStreak | null) => {
  // Show if:
  // 1. User just got their first streak (current_streak === 1)
  // 2. User doesn't have a goal set yet
  // 3. Today is the first streak day (last_completion_date === today)
  return streak?.current_streak === 1 && 
         !streak?.streak_goal && 
         streak?.last_completion_date === format(new Date(), 'yyyy-MM-dd');
};
```

### Celebration to Goal Selection Flow:
1. User completes task
2. Streak increases to 1 (first day)
3. StreakCelebration modal shows
4. User taps "I'm committed"
5. Modal closes
6. Parent component detects goal selection should show
7. StreakGoalSelection slides up
8. User picks goal and confirms
9. Goal saved to database
10. Selection closes, toast confirms

---

## Technical Details

### New Hook: useStreakGoal
```typescript
export const useSetStreakGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: 7 | 14 | 30 | 50) => {
      await supabase
        .from('user_streaks')
        .update({ 
          streak_goal: goal,
          streak_goal_set_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      toast.success('Challenge accepted! Let's do this!');
    }
  });
};
```

### Challenge Progress Calculation:
```typescript
const getChallengeProgress = (currentStreak: number, goal: number) => {
  return Math.min((currentStreak / goal) * 100, 100);
};
```

---

## Summary of Changes

| File | Action | Description |
|------|--------|-------------|
| `StreakGoalSelection.tsx` | Create | Full-screen goal picker with purple gradient |
| `StreakChallengeCard.tsx` | Create | Progress card for Presence page |
| `StreakProgressBar.tsx` | Create | Striped orange progress bar with flame |
| `StreakCelebration.tsx` | Modify | Add callback for goal selection trigger |
| `AppHome.tsx` | Modify | Handle goal selection flow after celebration |
| `AppPresence.tsx` | Modify | Display Streak Challenge card |
| `useTaskPlanner.tsx` | Modify | Add streak goal mutation and types |
| Database | Migration | Add streak_goal and streak_goal_set_at columns |

---

## Visual Outcome

After implementation:
1. First-time streak users see a beautiful purple goal selection screen
2. The flame badge dynamically shows the selected goal number
3. Presence page displays challenge progress with an engaging striped progress bar
4. Users feel motivated by the "Xx more likely" messaging
5. The entire flow matches the polished me+ aesthetic
