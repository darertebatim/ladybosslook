

# Period Tracker - Complete Implementation Plan (Updated)

## Answers to Your Questions

### 1. Can users add previous cycle history?
**Yes!** The app will include an onboarding flow where users can:
- Enter their last period start date
- Input their average cycle length (or use default 28 days)
- Optionally log previous period dates to improve prediction accuracy

This gives the app historical data from day one for better predictions.

### 2. Does it have its own calendar view?
**Yes!** The Period tracker page includes:
- A beautiful full-month calendar (reusing `MonthCalendar` component)
- Period days marked with pink filled circles
- Predicted period days shown with pink dashed/outlined circles
- Ovulation window marked with a subtle indicator
- Swipe between months to view history

### 3. Is the design beautiful with effects?
**Absolutely!** Following the app's established patterns:
- **Pink/Rose gradient backgrounds** (like Water's sky gradient)
- **Animated cycle visualization** (similar to Breathing circle)
- **Floating decorative elements** (soft petal/flower shapes)
- **Haptic feedback** on all interactions
- **Confetti celebration** when logging a new cycle
- **Smooth transitions** between screens

### 4. What other internal functions do users need?
Here's the complete feature set:

---

## Complete Feature List

### Core Logging
| Feature | Description |
|---------|-------------|
| Period day toggle | One-tap to mark day as period/not period |
| Flow intensity | Light / Medium / Heavy selector |
| Symptom tracking | Chips: Cramps, Bloating, Headache, Fatigue, Mood swings, Cravings, Back pain |
| Notes | Optional text notes for any day |

### Predictions & Insights
| Feature | Description |
|---------|-------------|
| Next period prediction | Based on rolling average of last 3-6 cycles |
| Ovulation window | Calculated as ~14 days before next predicted period |
| Cycle phase display | Menstrual, Follicular, Ovulation, Luteal |
| Cycle length stats | Average cycle length, average period length |
| Cycle history | View past cycles in calendar or list format |

### Onboarding & Settings
| Feature | Description |
|---------|-------------|
| First-time setup | Enter last period date + average cycle length |
| Import history | Log up to 3 past periods for better predictions |
| Reminder settings | Notify X days before predicted period |
| Privacy mode | Option to hide from Home screen entirely |

### Home Integration
| Feature | Description |
|---------|-------------|
| Status card | Shows current phase/prediction (like ProgramEventCard) |
| Calendar markers | Optional pink dots on planner week strip |

---

## Visual Design Spec

### Color Palette
```text
Primary Pink:   #EC4899 (pink-500)
Light Pink:     #FCE7F3 (pink-100)
Rose Accent:    #F43F5E (rose-500)
Soft Rose:      #FEE2E2 (rose-100)
```

### Tool Page Layout
Following `AppWater.tsx` pattern with pink/rose theme:

```text
+------------------------------------------+
|   [X]           Today            [Settings] |  <- Header
+------------------------------------------+
|                                          |
|        [Rose gradient background]        |
|                                          |
|              ♥  (heart icon)             |
|                                          |
|           "Day 14 of 28"                 |
|           Ovulation Window               |  <- Dynamic phase display
|                                          |
|    [Monthly Calendar with markers]       |
|     Period days = pink filled            |
|     Predicted = pink outlined            |
|                                          |
+------------------------------------------+
|   [Settings]  [Log Today]  [History]     |  <- Bottom actions
+------------------------------------------+
```

### Day Logging Sheet (Bottom Sheet)
```text
+------------------------------------------+
|             Log Period Day               |
+------------------------------------------+
|                                          |
|   Flow:  [Light] [Medium] [Heavy]        |
|                                          |
|   Symptoms:                              |
|   [Cramps] [Bloating] [Headache]         |
|   [Fatigue] [Mood] [Cravings]            |
|                                          |
|   Notes:                                 |
|   [_____________________________]        |
|                                          |
|           [Save]                         |
+------------------------------------------+
```

### Home Status Card (ProgramEventCard style)
```text
+------------------------------------------+
|  [♥ pink circle]   Period in 3 days      |
|                    Day 25 · Luteal       |
+------------------------------------------+
```

- **No checkbox** (not completable, just informative)
- **Tappable** (opens /app/period)
- **Gradient background**: `from-pink-100 to-rose-100`

---

## Onboarding Flow (First-Time Setup)

When user opens Period tracker for the first time:

```text
Screen 1: Welcome
+------------------------------------------+
|                                          |
|         🌸 Period Tracker                |
|                                          |
|    Track your cycle with ease.           |
|    Get predictions and insights.         |
|                                          |
|           [Get Started]                  |
+------------------------------------------+

Screen 2: Last Period
+------------------------------------------+
|                                          |
|    When did your last period start?      |
|                                          |
|         [Calendar Picker]                |
|                                          |
|    [Skip]              [Continue]        |
+------------------------------------------+

Screen 3: Cycle Length
+------------------------------------------+
|                                          |
|    What's your average cycle length?     |
|                                          |
|           [28] days                      |
|         (slider: 21-40 days)             |
|                                          |
|    Don't know? We'll learn from          |
|    your data over time.                  |
|                                          |
|    [Skip]              [Finish]          |
+------------------------------------------+
```

---

## Database Schema

### Table: `period_logs`
```text
| Column           | Type        | Notes                        |
|------------------|-------------|------------------------------|
| id               | uuid (PK)   | gen_random_uuid()            |
| user_id          | uuid        | References auth.users        |
| date             | date        | Unique per user              |
| is_period_day    | boolean     | true = period day            |
| flow_intensity   | text        | 'light' | 'medium' | 'heavy' |
| symptoms         | text[]      | Array of symptom strings     |
| notes            | text        | Optional                     |
| created_at       | timestamptz | Default: now()               |
| updated_at       | timestamptz | Default: now()               |
```

**Constraints:**
- UNIQUE (user_id, date)
- RLS: Users can only access their own data
- No admin access (maximum privacy)

### Table: `period_settings`
```text
| Column             | Type        | Notes                        |
|--------------------|-------------|------------------------------|
| id                 | uuid (PK)   | gen_random_uuid()            |
| user_id            | uuid        | References auth.users (unique)|
| average_cycle      | integer     | Rolling average, default 28  |
| average_period     | integer     | Average period length, default 5 |
| last_period_start  | date        | Most recent period start     |
| reminder_enabled   | boolean     | Notify before period         |
| reminder_days      | integer     | Days before to remind (1-7)  |
| show_on_home       | boolean     | Show status card on home     |
| onboarding_done    | boolean     | Has completed setup          |
| created_at         | timestamptz | Default: now()               |
| updated_at         | timestamptz | Default: now()               |
```

---

## File Structure

```text
src/
├── pages/app/
│   └── AppPeriod.tsx                    # Main tool page
├── components/app/
│   ├── PeriodStatusCard.tsx             # Home page card
│   ├── PeriodOnboarding.tsx             # First-time setup flow
│   ├── PeriodCalendar.tsx               # Month calendar with markers
│   ├── PeriodDaySheet.tsx               # Day logging bottom sheet
│   ├── PeriodSymptomChips.tsx           # Symptom selector
│   ├── PeriodFlowSelector.tsx           # Flow intensity picker
│   ├── PeriodCycleInsights.tsx          # Stats & predictions display
│   └── PeriodSettingsSheet.tsx          # Reminder & privacy settings
├── hooks/
│   └── usePeriodTracker.tsx             # All data logic
├── lib/
│   ├── periodTracking.ts                # Cycle calculations
│   ├── proTaskTypes.ts                  # Add 'period' type
│   └── toolsConfig.ts                   # Add to wellness tools

supabase/
└── migrations/
    └── XXXXXX_create_period_tracking.sql
```

---

## Cycle Phase Calculation Logic

```typescript
function getCyclePhase(dayOfCycle: number, cycleLength: number): CyclePhase {
  const ovulationDay = cycleLength - 14; // ~14 days before next period
  
  if (dayOfCycle <= 5) {
    return { name: 'Menstrual', emoji: '🩸', color: 'rose' };
  }
  if (dayOfCycle < ovulationDay - 2) {
    return { name: 'Follicular', emoji: '🌱', color: 'green' };
  }
  if (dayOfCycle <= ovulationDay + 2) {
    return { name: 'Ovulation', emoji: '✨', color: 'amber' };
  }
  return { name: 'Luteal', emoji: '🌙', color: 'purple' };
}
```

### Prediction Algorithm
- Uses weighted average of last 3-6 cycles
- Most recent cycles have higher weight
- Recalculates when new period is logged
- Shows confidence level (higher with more data)

---

## Animations & Effects

### Page Background
- Soft rose gradient: `linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 50%, #FFF 100%)`
- Floating petal shapes (like Water's clouds)

### Calendar Interactions
- `active:scale-95` on date taps
- Haptic feedback on every tap
- Confetti when logging first day of new cycle

### Transitions
- Sheet slides up smoothly (Vaul drawer)
- Phase badge animates on change
- Progress ring for cycle visualization

---

## Pro Task Integration

Add to `proTaskTypes.ts`:
```typescript
period: {
  value: 'period',
  label: 'Period Tracker',
  icon: Heart,
  badgeText: 'Log',
  color: 'pink',
  gradientClass: 'bg-gradient-to-br from-pink-100 to-rose-100',
  iconColorClass: 'text-pink-600',
  description: 'Open the period tracker',
  requiresValue: false,
}
```

---

## Privacy & Security

- **Strict RLS**: Only user can see their own data
- **No admin access**: Unlike other tables, admins cannot view period data
- **Hide from Home**: Optional setting to completely hide status card
- **Local-first feel**: Data syncs silently, no loading spinners for privacy

---

## Implementation Order

1. **Database migration** - Create tables with RLS
2. **Hook** (`usePeriodTracker`) - CRUD operations + calculations
3. **Tool page** (`AppPeriod`) - Main UI with calendar
4. **Onboarding** (`PeriodOnboarding`) - First-time setup
5. **Day sheet** (`PeriodDaySheet`) - Logging interface
6. **Home card** (`PeriodStatusCard`) - Status display
7. **Pro task type** - Add to proTaskTypes.ts
8. **Browse integration** - Add to toolsConfig.ts

---

## Summary

This Period Tracker will be:
- Beautiful with gradient backgrounds and smooth animations
- Feature-complete with symptom tracking, predictions, and history
- Privacy-first with strict RLS and no admin access
- Well-integrated with Home status card and routine tasks
- Smart from day one by allowing historical data entry

