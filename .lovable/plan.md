
# Elevate Emotion Tool: Full-Page Dashboard + History View

## Overview

Drawing inspiration from the **Water** and **Period** tool designs, this plan transforms the Emotion tool from a simple flow wizard into a rich, immersive experience with:
1. **Dashboard-style intro page** with gradient background, stats summary, and quick actions
2. **Emotion history/log viewer** to browse past emotion entries
3. **Visual insights** (mood trends, recent emotions)

---

## Design Patterns from Water & Period Tools

| Feature | Water Tool | Period Tool | Emotion Tool (Proposed) |
|---------|-----------|-------------|------------------------|
| Background | Sky blue gradient with clouds | Rose/pink gradient with floating petals | Violet/purple gradient with floating orbs |
| Main visual | Animated water wave rising | Cycle insights + calendar | Recent mood indicator + emotion stats |
| Stats display | Progress counter (64/64oz) | Cycle status + phase badge | Today's emotions + streak |
| Primary action | "Add Water" button | "Log Today" button | "Check In" button |
| History access | N/A (single metric) | Calendar with logged days | History list grouped by date |
| Navigation | Full-screen overlay | Full-screen overlay | Full-screen overlay |

---

## New Architecture

### Routes Structure
```text
/app/emotion           - Main dashboard (intro + stats + quick check-in)
/app/emotion/new       - New emotion logging flow (current wizard)
/app/emotion/history   - View past emotion logs (new)
```

**Alternative (simpler)**: Keep single route but transform EmotionIntro into a dashboard with tabs/sections.

### Recommended Approach: Enhanced Dashboard

Transform the current `EmotionIntro` into a full **Emotion Dashboard** that shows:
1. Greeting + today's check-in status
2. Recent emotions (today's logs)
3. Quick stats (streak, weekly mood breakdown)
4. Start button + History button

---

## UI Design: Emotion Dashboard

```text
+--------------------------------------------------+
|  (X)                                   (History) |
|                                                  |
|        🌈 Floating gradient orbs                 |
|                                                  |
|              💜 🧡 💚                             |
|                                                  |
|          How are you feeling?                    |
|                                                  |
|     +----------------------------------+         |
|     |  Today's Check-ins               |         |
|     |  • 😊 Content, Peaceful (9:30am) |         |
|     |  • 😔 Anxious (2:15pm)           |         |
|     +----------------------------------+         |
|                                                  |
|     +------+  +------+  +------+                 |
|     |🔥 5  |  |📊 12 |  |💜 3  |                 |
|     |Streak|  |Total |  |Today |                 |
|     +------+  +------+  +------+                 |
|                                                  |
|  +--------------------------------------------+  |
|  |              Check In Now                  |  |
|  +--------------------------------------------+  |
|  +--------------------------------------------+  |
|  |       ✨ Add to My Routine                 |  |
|  +--------------------------------------------+  |
+--------------------------------------------------+
```

---

## New Components

### 1. EmotionDashboard.tsx (replaces EmotionIntro role)

Full-screen dashboard with:
- Violet gradient background (`bg-[#6B7CFF]` → `bg-[#8B5CF6]`)
- Floating decorative orbs (like Period's petals)
- Today's emotions list (if any logged)
- Stats pills (streak, total, today count)
- "Check In Now" primary button
- "View History" secondary button
- "Add to Routine" tertiary button

### 2. EmotionHistory.tsx (new page component)

History list page showing:
- Header with back button + title
- Filter tabs: All / This Week / This Month
- Grouped entries by date (like Journal)
- Each entry shows: emotion emoji, emotion names, time, valence color indicator
- Tap to view detail or delete

### 3. EmotionLogCard.tsx (new component)

Card component for displaying a single emotion log:
- Emoji based on valence (😊/😐/😔)
- Emotion names (comma-separated)
- Time logged
- Context tags (work, relationships, etc.)
- Valence color indicator (amber/gray/violet)

### 4. EmotionInsights.tsx (dashboard summary)

Stats component showing:
- Streak counter (days in a row with check-ins)
- Total check-ins this week/month
- Most common emotions
- Valence distribution (pleasant/neutral/unpleasant pie)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/app/AppEmotion.tsx` | Modify | Update to use new dashboard as default view |
| `src/components/emotion/EmotionDashboard.tsx` | Create | New dashboard home with gradient, stats, actions |
| `src/pages/app/AppEmotionHistory.tsx` | Create | History list page |
| `src/components/emotion/EmotionLogCard.tsx` | Create | Card for displaying single log entry |
| `src/components/emotion/EmotionInsights.tsx` | Create | Stats summary component |
| `src/hooks/useEmotionLogs.tsx` | Modify | Add streak calculation, add stats helpers |
| `src/App.tsx` | Modify | Add `/app/emotion/history` route |
| `src/components/emotion/EmotionIntro.tsx` | Delete/Merge | Merge into EmotionDashboard |

---

## Updated Flow

```text
User opens /app/emotion
    ↓
EmotionDashboard (shows stats, today's logs)
    ↓
    ├── "Check In Now" → EmotionSelector flow → EmotionContext → EmotionComplete → back to Dashboard
    ├── "View History" → /app/emotion/history
    └── "Add to Routine" → RoutinePreviewSheet
```

---

## Visual Design Tokens

### Color Palette (Violet/Purple Theme)
- Primary gradient: `linear-gradient(180deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)`
- Background: `#6B7CFF` (existing intro color)
- Card backgrounds: `white/60` with backdrop blur
- Text: White on gradient, violet-800 on cards
- Valence indicators:
  - Pleasant: Amber/Yellow badge
  - Neutral: Slate/Gray badge  
  - Unpleasant: Violet/Purple badge

### Animation
- Floating orbs with `animate-float` (like Period's petals)
- Subtle pulse on main emoji icon
- Slide transitions between views

---

## Emotion Streak Calculation

Add to `useEmotionLogs.tsx`:

```typescript
const calculateStreak = (logs: EmotionLog[]): number => {
  if (logs.length === 0) return 0;
  
  const uniqueDays = [...new Set(logs.map(log => 
    startOfDay(new Date(log.created_at)).toISOString()
  ))].sort().reverse();
  
  const today = startOfDay(new Date());
  const mostRecent = new Date(uniqueDays[0]);
  
  // If no log today or yesterday, streak is 0
  if (differenceInDays(today, mostRecent) > 1) return 0;
  
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = new Date(uniqueDays[i - 1]);
    const prev = new Date(uniqueDays[i]);
    if (differenceInDays(current, prev) === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};
```

---

## Implementation Order

1. **Create EmotionDashboard.tsx**
   - Violet gradient background with floating orbs
   - Today's emotions summary (from `useEmotionLogs`)
   - Stats pills (streak, total, today)
   - Check In button + History button + Routine button

2. **Create EmotionLogCard.tsx**
   - Compact card with emoji, emotions, time, valence indicator

3. **Create AppEmotionHistory.tsx**
   - List view with grouped entries
   - Delete functionality
   - Empty state

4. **Update useEmotionLogs.tsx**
   - Add streak calculation
   - Add stats helpers (thisWeek, thisMonth, valenceBreakdown)

5. **Update AppEmotion.tsx**
   - Use EmotionDashboard as entry point
   - Flow: Dashboard → Selector → Context → Complete → Dashboard

6. **Update App.tsx**
   - Add `/app/emotion/history` route

7. **Delete EmotionIntro.tsx**
   - Content merged into EmotionDashboard

---

## Summary

This elevation transforms the Emotion tool from a simple wizard into a **rich wellness dashboard** that:
- Matches the visual polish of Water and Period tools
- Provides instant value by showing recent emotions and streaks
- Makes history accessible with a dedicated view
- Encourages daily check-ins with streak tracking
- Maintains the Finch-style aesthetic with gradient backgrounds and floating decorations
