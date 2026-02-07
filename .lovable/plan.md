

# Presence & Achievements Page

## Overview
Create a new full-screen page called "My Presence" (or similar - aligns with strength-first philosophy) that opens when tapping the orange streak badge. This page will consolidate all presence metrics, achievements, and future gamification elements in one beautiful, motivating space.

## Page Sections

### 1. Hero Stats Card
- Large central display showing **Days This Month** prominently
- Current streak number with flame icon
- Longest streak milestone
- Return count with special "Welcome Back" acknowledgment (strength-first: returning is celebrated, not punished)

### 2. Weekly Presence Visual  
- 7-day week grid (like the one in StreakCelebration modal)
- Checkmarks for active days
- Today highlighted
- Soft, non-judgmental design for missed days

### 3. All-Time Stats
- **Total Active Days** - lifetime count
- **Returns** - number of times came back after 2+ day gap (celebrated!)
- **Listening Minutes** - audio content consumed
- **Completed Tracks** - audio completions
- **Journal Entries** - total entries written
- **Breathing Sessions** - mindfulness sessions completed

### 4. Achievements Section (Unlockable)
Achievement cards that unlock based on milestones:
- **"First Step"** - Completed first task ever
- **"Week Warrior"** - 7 days active in a month
- **"Steady Presence"** - 14 days active in a month
- **"Return Strength"** - Came back after a break (celebrates return count milestones)
- **"Listener"** - 60+ minutes of audio content
- **"Reflective Soul"** - 10+ journal entries
- **"Breath Master"** - 10+ breathing sessions
- **"Full Month"** - Active 30+ days total

### 5. Monthly Progress
- Visual calendar heatmap showing active days this month
- Soft colors (violet/purple gradient to match app theme)
- No shame for gaps - just gentle visualization

## Technical Implementation

### Files to Create
1. **`src/pages/app/AppPresence.tsx`** - Main page component
2. **`src/hooks/usePresenceStats.tsx`** - Hook to fetch all presence/achievement data
3. **`src/components/app/AchievementCard.tsx`** - Reusable achievement display component
4. **`src/components/app/WeeklyPresenceGrid.tsx`** - Week visualization (extracted from StreakCelebration)
5. **`src/lib/achievements.ts`** - Achievement definitions and unlock logic

### Files to Modify
1. **`src/App.tsx`** - Add route `/app/presence` (full-screen, outside AppLayout)
2. **`src/pages/app/AppHome.tsx`** - Change orange badge to navigate to `/app/presence` instead of showing modal

### Data Sources
The hook will aggregate from existing tables:
- `profiles` - total_active_days, return_count, this_month_active_days
- `user_streaks` - current_streak, longest_streak
- `task_completions` - count for "first action" achievement
- `audio_progress` - listening stats
- `journal_entries` - entry count
- `breathing_sessions` - session count
- `emotion_logs` - emotion check-in count

### Achievement System
Achievements will be **calculated client-side** based on existing data (no new database tables needed initially). The logic will check thresholds and return which achievements are unlocked.

Future enhancement: Store unlocked achievements in database for push notification celebrations.

---

## Visual Design Notes
- Gradient purple/violet header matching app theme
- Cards with soft shadows and rounded corners
- Achievements show as locked (grayed) or unlocked (colorful with icon)
- Confetti burst animation when viewing newly unlocked achievements
- Back button to return to Home
- No "shame" language - all copy is encouraging

---

## Technical Details

### Route Configuration
```typescript
// Full-screen page (outside AppLayout for immersive experience)
<Route path="/app/presence" element={<ProtectedRoute><AppPresence /></ProtectedRoute>} />
```

### Navigation Change
```typescript
// AppHome.tsx - Change from modal to navigation
<button onClick={() => navigate('/app/presence')} className="tour-streak ...">
  <Flame className="h-4 w-4 fill-current" />
  <span className="text-sm font-semibold">{streak?.current_streak || 0}</span>
</button>
```

### Achievement Definition Structure
```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or lucide icon name
  color: string; // bg color when unlocked
  unlockCondition: (stats: PresenceStats) => boolean;
}
```

### Data Hook Interface
```typescript
interface PresenceStats {
  // Presence metrics
  totalActiveDays: number;
  thisMonthActiveDays: number;
  returnCount: number;
  currentStreak: number;
  longestStreak: number;
  
  // Activity stats
  listeningMinutes: number;
  completedTracks: number;
  journalEntries: number;
  breathingSessions: number;
  emotionLogs: number;
  totalTaskCompletions: number;
  
  // Computed
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
}
```

