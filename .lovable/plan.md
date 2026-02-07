
# Plan: Redesign Celebrations with Orange Theme

## Overview
Replace the current dark purple/violet theme in all celebration components with a warm orange theme to match the streak button in the app header and align with the me+ design language.

---

## Design Reference (from me+ screenshots)

- **Streak button**: `bg-gradient-to-r from-orange-400 to-orange-500` with white text/icon
- **Streak page header**: Gradient from orange-400 at top to cream/warm white at bottom
- **Celebration modal**: Dark overlay with orange flame icon, streak count, week progress bar with orange striped pattern, and orange CTA button

---

## Changes Required

### 1. BadgeCelebration Component (`src/components/app/BadgeCelebration.tsx`)

**Toast Celebrations (Silver & Almost-There):**
- Change background from `from-violet-600 to-purple-700` to `from-orange-400 to-orange-500`
- Update sparkle colors from pink to warm white/amber tones
- Keep white text for contrast

**Gold Modal:**
- Change modal background from violet to orange gradient: `from-orange-400 via-orange-500 to-orange-600`
- Update rays background from purple to orange tones
- Update confetti colors to more orange-focused palette
- Change "Collect" button to dark/slate for contrast (already correct)

### 2. StreakCelebration Component (`src/components/app/StreakCelebration.tsx`)

- Change modal gradient from `from-violet-900 to-indigo-900` to `from-orange-500 to-orange-600`
- Update confetti colors from violet/pink to orange/amber tones
- Update week presence indicator circles from violet to orange theme
- Change button from white/violet-900 to appropriate contrast styling
- Update icon backgrounds from violet-500 to orange-500

### 3. AppPresence Page (`src/pages/app/AppPresence.tsx`)

- Change hero header gradient from `from-violet-600 via-violet-700 to-indigo-800` to `from-orange-400 via-orange-500 to-orange-600`
- Update text accent colors from violet-200/300 to orange-100/200 for better contrast
- Update WeeklyPresenceGrid to use orange theme when `variant="dark"`

### 4. WeeklyPresenceGrid Component (if applicable)
- Update active day indicators from violet to orange theme

---

## Color Palette for Orange Theme

| Element | Current | New |
|---------|---------|-----|
| Toast BG | `from-violet-600 to-purple-700` | `from-orange-400 to-orange-500` |
| Gold Modal BG | `from-violet-500 via-violet-500 to-violet-600` | `from-orange-400 via-orange-500 to-orange-600` |
| Streak Modal BG | `from-violet-900 to-indigo-900` | `from-orange-500 to-orange-600` |
| Presence Hero | `from-violet-600 via-violet-700 to-indigo-800` | `from-orange-400 via-orange-500 to-orange-600` |
| Rays/Glow | `rgba(139, 92, 246, 0.3)` (violet) | `rgba(251, 146, 60, 0.3)` (orange-400) |
| Confetti | Violet/Pink | Orange/Amber/Gold |
| Active Indicators | `bg-violet-500` | `bg-orange-500` |

---

## Technical Details

### Confetti Color Update
```javascript
// New orange-focused confetti palette
const CONFETTI_COLORS = [
  '#fb923c', // orange-400
  '#f97316', // orange-500
  '#ea580c', // orange-600
  '#fbbf24', // amber-400
  '#fcd34d', // amber-300
];
```

### Rays Background Update
```javascript
// Gold modal rays
style={{
  background: 'repeating-conic-gradient(from 0deg, rgba(251, 146, 60, 0.3) 0deg 10deg, transparent 10deg 20deg)',
}}
```

---

## Files to Modify

1. `src/components/app/BadgeCelebration.tsx` - Update toast and modal colors
2. `src/components/app/StreakCelebration.tsx` - Update modal and indicators
3. `src/pages/app/AppPresence.tsx` - Update hero header gradient
4. `src/components/app/WeeklyPresenceGrid.tsx` - Update active day colors (if needed)

---

## Visual Outcome

All celebration moments will have a consistent warm orange theme that:
- Matches the streak button in the header
- Aligns with the me+ design inspiration
- Creates visual cohesion across the gamification features
- Maintains good contrast with white text and icons
