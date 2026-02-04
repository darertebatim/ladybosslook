
# Strength-First Metrics: Replace Streaks with Depth of Return

Based on my analysis of the codebase, I found streak-related code in **9 components** across the app. This plan transforms the metric system from "streak counting" to "depth of return" - measuring how often users come back, not how long they stay without breaking.

---

## Philosophy Summary

**Current Model (Streak-Based)**:
- Tracks consecutive days
- Resets to 1 when broken
- Creates anxiety about stopping
- Punishes life interruptions

**New Model (Depth of Return)**:
- Tracks total days present this month
- Celebrates each return
- No "breaking" concept
- Measures strength through return, not continuity

**The Core Shift**: "Simora measures depth of return, not length of absence."

---

## Database Changes

### 1. Add New Columns to `profiles` Table

| Column | Type | Purpose |
|--------|------|---------|
| `total_active_days` | integer | All-time count of days with activity |
| `return_count` | integer | Number of times user returned after 2+ day gap |
| `last_active_date` | date | Last date user showed up |
| `this_month_active_days` | integer | Days active in current month (cached, recalculated monthly) |

### 2. Keep `user_streaks` Table (Internal Only)

The table stays for internal analytics but values are no longer shown to users. This gives us historical data without displaying pressure-inducing numbers.

---

## UI Changes Summary

| Component | Current | New |
|-----------|---------|-----|
| StreakCelebration | "🔥 7" big number, streak counter | "You showed up today" with gentle checkmarks |
| JournalHeaderStats | "day streak" label | "this month" (days active) |
| JournalStats | "Day Streak" with flame | "Days This Month" with calendar |
| CompactStatsPills | "🔥 7d streak" pill | "✓ 12 days" (this month) |
| StatsCards | "🔥 7 days" | "Showed up 12 times this month" |
| EmotionDashboard | "Streak" label | "This Month" label |

---

## Component-by-Component Changes

### 1. StreakCelebration.tsx → ReturnCelebration.tsx

**Current**: Shows big streak number with fire emoji, week calendar highlighting consecutive days, "I'm committed 💪" button

**New Design**:
- Gentle illustration (leaf, sun, or heart) instead of fire
- Message: "You showed up today" or "Welcome back" (after gap)
- Show simple week view with checkmarks (not streak-based)
- Button: "I'm here ✨" (present-focused, not commitment-focused)
- For returning users (gap > 2 days): "Your strength is still here. Welcome back."

### 2. JournalHeaderStats.tsx

**Current**:
```text
📈 Total Entries | 🔥 Streak | 📅 This Month
```

**New**:
```text
📈 Total Entries | 📅 This Month | ✨ Returns
```

Changes:
- Replace "streak" with "this month" (days with entries)
- Replace flame icon with calendar or sparkle
- Remove "day streak" label, use "this month" instead

### 3. JournalStats.tsx

**Current**: Shows "Day Streak" with flame icon in stats grid

**New**: 
- Change "Day Streak" to "Days This Month"
- Replace Flame icon with Calendar icon
- calculateStreak() function repurposed to count unique days this month

### 4. CompactStatsPills.tsx

**Current**: `{ icon: Flame, value: "7d", label: "streak" }`

**New**: 
- Icon: CheckCircle2 or Calendar (not Flame)
- Value: "12 days" (this month count)
- Label: "this month"
- Remove "highlight: journalStreak >= 7" logic (no streak milestones)

### 5. StatsCards.tsx

**Current**: 
```tsx
{journalStreak > 0 ? `🔥 ${journalStreak} days` : 'Start today'}
```

**New**:
```tsx
{daysThisMonth > 0 ? `${daysThisMonth} days this month` : 'Start today'}
```

Remove fire emoji entirely.

### 6. EmotionDashboard.tsx

**Current**: Shows "Streak" label under flame icon

**New**: 
- Replace "Streak" with "This Month"
- Replace Flame icon with Calendar or Sparkles icon
- Keep the count but reframe it as presence, not continuity

---

## Hook Changes

### useTaskPlanner.tsx

**Current `updateStreak` function** (lines 1107-1164):
- Resets `current_streak` to 1 if gap > 1 day
- Increments streak on consecutive days

**New `updatePresence` function**:
- Never "resets" anything
- Increments `total_active_days` on each unique day
- Updates `last_active_date`
- If gap > 2 days: increment `return_count` (celebrate the return)
- Updates `this_month_active_days` cache

**useUserStreak hook** (lines 398-417):
- Rename to `useUserPresence`
- Return `{ totalDays, thisMonthDays, returnCount, lastActiveDate }` instead of streak

### useJournal.tsx / JournalStats

Replace `calculateStreak()` with `calculateMonthlyPresence()`:
- Count unique days with entries in current month
- No concept of "breaking"

### useEmotionLogs.tsx

Replace streak calculation with monthly presence count.

---

## New Messages (StreakCelebration → ReturnCelebration)

| Scenario | Current Message | New Message |
|----------|----------------|-------------|
| First activity | "Great start! Keep it going!" | "You showed up. That's strength." |
| Same day return | (not triggered) | (no change) |
| After 1 day | "Two days in a row!" | "You're here again. ✨" |
| After 2+ day gap | Streak reset to 1 | "Welcome back. Your strength is still here." |
| Weekly presence | "One full week!" | "7 days this month. You keep showing up." |
| High presence | "30+ day streak!" | "You've shown up so many times. That's real strength." |

---

## Files to Modify

### Components (UI Changes)
1. `src/components/app/StreakCelebration.tsx` - Complete redesign
2. `src/components/app/JournalHeaderStats.tsx` - Replace streak with monthly
3. `src/components/app/JournalStats.tsx` - Replace streak calculation
4. `src/components/dashboard/CompactStatsPills.tsx` - Replace streak pill
5. `src/components/dashboard/StatsCards.tsx` - Replace journal streak display
6. `src/components/emotion/EmotionDashboard.tsx` - Replace streak label

### Hooks (Logic Changes)
7. `src/hooks/useTaskPlanner.tsx` - Replace updateStreak with updatePresence
8. `src/hooks/useEmotionLogs.tsx` - Replace streak with monthly count

### Database
9. Create migration to add new columns to `profiles` table
10. Update TypeScript types

---

## Implementation Order

**Phase 1: Database & Types**
1. Create migration for new `profiles` columns
2. Update Supabase types

**Phase 2: Core Hook Changes**
3. Modify `useTaskPlanner.tsx` - rename hook, change logic
4. Modify `useEmotionLogs.tsx` - replace streak calculation

**Phase 3: UI Updates**
5. Transform `StreakCelebration.tsx` to `ReturnCelebration.tsx`
6. Update `JournalHeaderStats.tsx`
7. Update `JournalStats.tsx`
8. Update `CompactStatsPills.tsx`
9. Update `StatsCards.tsx`
10. Update `EmotionDashboard.tsx`

---

## Result

After implementation:
- No more "streak broken" anxiety
- Returning after a gap is celebrated, not punished
- Users see "You've shown up 15 days this month" instead of "🔥 3 day streak"
- The celebration modal says "Your strength is still here" instead of counting consecutive days
- Engagement comes from feeling welcomed, not from fear of loss
