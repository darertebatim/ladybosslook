## Answer to your side question

No — we only have one trophy asset, the gold 🏆 (FluentEmoji), the same one used when you complete your Path in My Rilo. There are no bronze/silver trophy variants. So the planner will award **one trophy when the day is fully complete**, just like the Path trophy.

If you want bronze/silver trophies later, I'd need to generate those assets separately.

## Plan: replace planner coins with the 🏆 trophy + add trophy/streak chip to planner

### 1. Daily completion badge → trophy (Planner)
- `src/pages/app/AppHome.tsx`: drop the `BADGE_IMAGES` coin map (bronze/silver/gold). Show a single 🏆 `FluentEmoji` **only when the day is fully complete** (current "gold" tier).
- `src/components/app/BadgeCelebration.tsx`: swap the coin image for 🏆. Celebration only fires on full completion — silver/bronze celebration variants are removed.
- `src/components/app/WeeklyPresenceGrid.tsx` and `src/components/app/MonthCalendar.tsx`: per-day coin icons replaced with 🏆 on fully-complete days. Partial days show nothing.
- `src/components/app/GoldStreakCelebration.tsx`: floating coin swapped for 🏆.

### 2. Trophies counted independently (your "2 trophies in 1 day" rule)
- Planner trophy and Path trophy stay separate. Completing planner = +1 planner trophy; completing path = +1 path trophy. Same day can yield both.
- No new DB write needed for the planner trophy; we reuse the existing daily-completion signal (`badgeLevel === 'gold'`) as the trigger.

### 3. Trophy + Streak chip on Planner top-right (NEW — matches My Rilo)
- In My Rilo (`AppMyRiloPath.tsx` ~line 522), the top-right shows a pill with Award icon + `trophyCount`, then a flame gradient pill + `streak`, tapping opens Presence.
- Add the **same chip** to the Planner header in `src/pages/app/AppHome.tsx`, with the same styling, navigation to `/app/presence`, and same haptic.
- The trophy number shown there will be the **planner trophy count** (daily completions). The My Rilo chip continues to show the **Path trophy count**. Each page shows the trophy that belongs to it; streak number is the shared daily streak (same value on both).

### What stays the same
- Recovery shields, streak math, Path trophy logic, presence calendar unchanged.
- Bronze/silver/gold eligibility memory rule effectively collapses to a single tier in UI: trophy on full completion only.

### Files I'd edit
- `src/pages/app/AppHome.tsx` (coins → trophy + new top-right chip)
- `src/components/app/BadgeCelebration.tsx`
- `src/components/app/WeeklyPresenceGrid.tsx`
- `src/components/app/MonthCalendar.tsx`
- `src/components/app/GoldStreakCelebration.tsx`

### Confirm before I implement
- Partial-day behavior: today 2-of-3 shows silver coin; after this it will show **nothing** until the last task is done, then 🏆. Sound right?
- Planner chip's trophy count should reflect **planner daily completions** (not the Path count), correct?
