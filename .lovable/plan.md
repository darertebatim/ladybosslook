

## Redesign: Streak Celebration → Me+ Style Daily Streak Progress

### What Changes

Replace the current "You showed up for yourself" presence-based celebration with a Me+-inspired **streak day celebration** that shows:

1. **Day 1 (first action ever)**: Large animated flame icon + streak count "1" + message "A streak is born! Keep it up every day to help it grow." + progress bar showing day 1/7 of the week + weekday labels (M T W T F S S) + "I'm committed" button
2. **Day 2+ (returning days)**: Same flame + streak count (e.g. "3") + contextual message like "Your habit is getting stronger—let's keep it going!" + striped progress bar with flame indicator showing progress across the week + highlighted current weekday + "I'm committed" button

### Design (Me+ Style)

- **Full-screen dark overlay** with content card at bottom (not centered modal)
- **Large 3D-style flame icon** centered above the card, overlapping the content behind
- **Big orange streak number** below the flame
- **Dark rounded card** (`bg-gray-800/95 rounded-3xl`) containing:
  - Motivational message text (white, centered)
  - Striped orange progress bar with flame indicator (reuse `StreakProgressBar` pattern but for 7-day week view)
  - Weekday labels (M T W T F S S) with current day highlighted
- **Orange CTA button** at bottom: "I'm committed"
- After closing on Day 1 (and no streak goal set), still triggers goal selection flow

### Messages by Streak Count
- Day 1: "A streak is born! Keep it up every day to help it grow."
- Day 2: "Two in a row! You're building momentum."
- Day 3: "Your habit is getting stronger—let's keep it going!"
- Day 4-6: "You're on fire! Keep showing up."
- Day 7+: "{N} days strong! Nothing can stop you."

### Files to Modify

1. **`src/components/app/StreakCelebration.tsx`** — Complete rewrite to Me+ style:
   - Remove presence-based logic (thisMonthDays, isReturning)
   - Accept `currentStreak` number prop
   - New layout: flame + number overlay, dark bottom card, week progress bar, orange CTA
   - Keep SoftReviewPrompt integration and goal selection flow

2. **`src/components/app/HomeCelebrations.tsx`** — Pass `currentStreak` from streak data to StreakCelebration

3. **`src/pages/app/AppHome.tsx`** — No structural changes needed, streak data already passed

### No Breaking Changes
- Goal selection flow after Day 1 stays intact
- First action detection logic stays the same
- Review prompt trigger stays the same
- Coach mark trigger on close stays the same

