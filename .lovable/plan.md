
# Breathe Page Redesign Plan

## Overview
Complete redesign of the `/app/breathe` page to match the design patterns used in other app pages like Listen (AppPlayer) and Routines (AppInspire), while also fixing the "info sheet shows only first time" issue.

## Current Issues
1. **Inconsistent design** - Uses purple gradient background instead of app-theme (black & white)
2. **Missing "All" category** - No way to view all breathing exercises at once
3. **Different category UI** - Uses pill buttons instead of CategoryCircle components
4. **First-time info only** - Info sheet only auto-shows on first view per exercise

## Design Changes

### 1. AppBreathe.tsx - List Page Redesign

**Header Section:**
- Change from `bg-gradient-to-b from-primary-dark to-primary` to `bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl`
- Use app-theme foreground colors for text

**Categories:**
- Add "All" category at the beginning of BREATHING_CATEGORIES
- Replace pill buttons with CategoryCircle components (matching AppPlayer pattern)
- Use horizontal scroll with icons and colors per category

**Category Configuration:**
```
all: { icon: 'Wind', color: 'purple' }
morning: { icon: 'Sunrise', color: 'orange' }
energize: { icon: 'Zap', color: 'yellow' }
focus: { icon: 'Target', color: 'blue' }
calm: { icon: 'Leaf', color: 'green' }
night: { icon: 'Moon', color: 'indigo' }
```

**Content Area:**
- Use `bg-background` instead of gradient
- Cards use proper card styling matching other app pages

### 2. BreathingExerciseCard.tsx - Card Redesign

**Current:** Glass/blur effect with white text
**New:** Standard card styling matching app-theme
- `bg-card` background
- `text-foreground` for title
- `text-muted-foreground` for description
- Rounded corners and subtle shadow

### 3. BreathingExerciseScreen.tsx - Exercise Screen Redesign

**Background:**
- Change from purple gradient to `bg-background`

**Circles & Animation:**
- Use app-theme tokens for rings and animated circle
- Outer ring: `border-muted-foreground/30`
- Inner ring: `border-muted-foreground/30`
- Animated circle: `bg-primary/20` or similar subtle color
- Center circle: `bg-card` with `text-foreground`

**Info Sheet Trigger:**
- Remove localStorage-based "first time" tracking
- Always show info sheet automatically when exercise opens
- User can dismiss and start when ready

**Controls:**
- Duration buttons use muted/primary styling
- Start/Pause button uses primary colors

### 4. BreathingInfoSheet.tsx - Styling Update

**Current:** Uses `bg-primary` with `text-primary-foreground`
**New:** Uses `bg-card` or `bg-background` with `text-foreground`
- Phase breakdown uses muted backgrounds
- Okay button uses primary styling

### 5. BreathingCircle.tsx - Color Updates

Update all colors to use app-theme tokens:
- Rings: `border-muted-foreground/30`
- Animated circle: Subtle primary tint
- Center content: Card background with foreground text

### 6. useBreathingExercises.tsx - Add "All" Category

Add to BREATHING_CATEGORIES array:
```typescript
{ value: 'all', label: 'All', emoji: '🌬️' }
```

Update filtering logic to show all active exercises when "all" is selected.

---

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useBreathingExercises.tsx` | Add "All" category to BREATHING_CATEGORIES |
| `src/pages/app/AppBreathe.tsx` | Complete UI redesign: header, categories, content area |
| `src/components/breathe/BreathingExerciseCard.tsx` | Update to card-based design |
| `src/components/breathe/BreathingExerciseScreen.tsx` | Update colors, remove first-time-only logic |
| `src/components/breathe/BreathingCircle.tsx` | Update colors to app-theme |
| `src/components/breathe/BreathingInfoSheet.tsx` | Update colors to app-theme |

### Color Token Mapping

| Element | Current | New |
|---------|---------|-----|
| List page background | `from-primary-dark to-primary` | `bg-background` |
| Header | `from-primary-dark to-primary` | `bg-[#F4ECFE] dark:bg-violet-950/90` |
| Exercise screen bg | Purple gradient | `bg-background` |
| Circle rings | `border-primary/30` | `border-muted-foreground/30` |
| Animated circle | `bg-primary/60` | `bg-primary/20` |
| Center circle | `bg-primary/80` | `bg-card` |
| Text | `text-primary-foreground` | `text-foreground` |
| Info sheet bg | `bg-primary` | `bg-card` |

### Category Configuration Object

```typescript
const categoryConfig: Record<string, { name: string; icon: string; color: string }> = {
  all: { name: 'All', icon: 'Wind', color: 'purple' },
  morning: { name: 'Morning', icon: 'Sunrise', color: 'orange' },
  energize: { name: 'Energize', icon: 'Zap', color: 'yellow' },
  focus: { name: 'Focus', icon: 'Target', color: 'blue' },
  calm: { name: 'Calm', icon: 'Leaf', color: 'green' },
  night: { name: 'Night', icon: 'Moon', color: 'indigo' },
};
```

### Info Sheet Behavior Change

**Before:**
```typescript
useEffect(() => {
  const seen = getSeenExercises();
  if (!seen.has(exercise.id)) {
    setShowInfoSheet(true);
  }
}, [exercise.id]);
```

**After:**
```typescript
useEffect(() => {
  // Always show info sheet when exercise opens
  setShowInfoSheet(true);
}, [exercise.id]);
```

Remove `markExerciseSeen`, `getSeenExercises`, and `LOCAL_STORAGE_KEY` since they're no longer needed.

---

## Visual Layout

### AppBreathe List Page
```
┌─────────────────────────────────┐
│    ← Breathe         🔍        │ ← Lavender header
│                                │
│ [🌬️All] [🌅Morn] [⚡Ener] [🎯] │ ← CategoryCircle scroll
└────────────────────────────────┘
                                   ← White/background content
┌─────────────────────────────────┐
│ 🧘 Box Breathing               │ ← Card style
│ 4-second cycle for calm...     │
│ [4s cycle] [with holds]        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🌙 4-7-8 Sleep                 │
│ Relaxation technique...        │
│ [19s cycle] [with holds]       │
└─────────────────────────────────┘
```

### Exercise Screen
```
┌─────────────────────────────────┐
│  [X]           2:45        [?] │ ← Header with timer
│                                │
│         ╭─────────────╮        │ ← Outer ring (light gray)
│         │   ╭─────╮   │        │ ← Inner ring (light gray)
│         │   │Inhale│  │        │ ← Animated circle (subtle)
│         │   │ Nose │  │        │
│         │   ╰─────╯   │        │
│         ╰─────────────╯        │
│                                │
│          LENGTH                │
│    [1] [3] [5] [10] min        │ ← Duration options
│                                │
│    ═══════════════════         │ ← Progress bar
│         [ Start ]              │ ← Primary button
└─────────────────────────────────┘
```
