
# Breathing Exercise UI Redesign Plan

## Overview
Complete redesign of the breathing exercise flow to match the Finch app UX pattern with a single-screen experience instead of multiple sheets.

## Current Flow (What Exists Now)
1. User taps exercise from list → Opens **Info Sheet** (description, pattern, Start button)
2. Tap Start → Opens **Settings Sheet** (duration, cycle info)
3. Tap Begin → Opens **Active Screen** (full screen breathing animation)

## New Flow (Finch-Style)
1. User taps exercise from list → Opens **Full-Screen Exercise View** with:
   - Breathing circles visible immediately (in collapsed/ready state)
   - Duration selector (1, 3, 5, 10 min)
   - Start button at bottom
   - X button (close) top-left, ? button (info) top-right
   
2. User taps **?** button → Opens **Info Sheet** as bottom overlay with:
   - Exercise name
   - Visual breakdown: Inhale (Xs, Nose) → Hold (Xs) → Exhale (Xs, Mouth) → Hold (Xs)
   - Description text
   - "Okay" button to dismiss
   - **First-time users see this automatically, then dismiss**

3. User taps **Start** button → Same screen transitions:
   - Duration selector fades out
   - Start button becomes Pause button
   - Breathing animation begins from collapsed state (inhale first)
   - ? button remains accessible

---

## Technical Changes

### 1. Create New Component: `BreathingExerciseScreen.tsx`
A single full-screen component that handles both setup and active breathing states.

**Props:**
- `exercise: BreathingExercise`
- `onClose: () => void`

**Internal States:**
- `isActive: boolean` - Whether breathing session is running
- `isPaused: boolean` - Pause state during active session
- `showInfoSheet: boolean` - Info overlay visibility
- `selectedDuration: number` - 60, 180, 300, or 600 seconds
- `hasSeenInfo: boolean` - Track first-time info display

**Layout Structure:**
```
┌──────────────────────────────┐
│  [X]                    [?]  │  ← Header with close/info buttons
│                              │
│                              │
│     ┌────────────────┐       │
│     │   ┌────────┐   │       │  ← Fixed outer ring (inhale boundary)
│     │   │        │   │       │
│     │   │ Inhale │   │       │  ← Animated circle + center text
│     │   │  Nose  │   │       │
│     │   └────────┘   │       │  ← Fixed inner ring (exhale boundary)
│     └────────────────┘       │
│                              │
│         LENGTH               │
│    [1] [3] [5] [10] min      │  ← Duration buttons (hidden when active)
│                              │
│    ═══════════════════       │  ← Progress bar
│       [ Start/Pause ]        │  ← Primary action button
└──────────────────────────────┘
```

### 2. Modify `BreathingInfoSheet.tsx`
Transform into a simpler info overlay (no Start button here).

**Changes:**
- Remove "Start Breathing" button
- Remove "Add to Routine" button (move to main screen or keep in list)
- Display only:
  - Exercise name as title
  - Phase breakdown with visual icons
  - Description text
  - "Okay" button to dismiss

**Visual Phase Breakdown:**
```
  Inhale    Hold    Exhale    Hold
   [◯]      [●]      [◯]      [●]
  4 sec    4 sec    4 sec    4 sec
   Nose             Mouth
```

### 3. Modify `BreathingCircle.tsx`
Update to start in collapsed state when `phase === 'ready'`.

**Current Issue:** Circle shows in expanded state initially
**Fix:** Ensure `ready` phase uses `animatedScale = 0.40` (collapsed)

### 4. Update `AppBreathe.tsx` Flow
Replace the multi-sheet flow with single-screen navigation.

**Changes:**
- Remove `showInfoSheet`, `showSettingsSheet` states
- Add `selectedExercise` opens `BreathingExerciseScreen` as full-screen overlay
- Handle deep links the same way

### 5. Design Token Updates for Breathing Screens
Use consistent color scheme based on app's design system.

**Color Mapping:**
- Background gradient: `from-primary-dark via-primary to-primary-light`
- Outer ring: `border-primary-foreground/30`
- Inner ring: `border-primary-foreground/30`
- Animated circle: `bg-primary-light/60`
- Center circle: `bg-primary/80`
- Text: `text-primary-foreground`
- Duration buttons (inactive): `bg-primary-foreground/10`
- Duration buttons (active): `bg-primary-foreground text-primary`
- Start/Pause button: `bg-white text-primary-dark`

### 6. First-Time Info Display Logic
Show info sheet automatically on first open of each exercise.

**Implementation:**
- Store viewed exercises in `localStorage` key: `breathe_seen_info`
- On exercise open, check if `exerciseId` is in the set
- If not seen, auto-show info sheet, then add to set on dismiss

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/breathe/BreathingExerciseScreen.tsx` | **CREATE** - New unified screen component |
| `src/components/breathe/BreathingInfoSheet.tsx` | **MODIFY** - Simplify to info-only overlay |
| `src/components/breathe/BreathingCircle.tsx` | **VERIFY** - Ensure ready state is collapsed |
| `src/components/breathe/BreathingActiveScreen.tsx` | **DELETE** - Merged into BreathingExerciseScreen |
| `src/components/breathe/BreathingSettingsSheet.tsx` | **DELETE** - No longer needed |
| `src/pages/app/AppBreathe.tsx` | **MODIFY** - Use new single-screen flow |

---

## UI Details

### Duration Selector
```
       LENGTH
 ┌───┐ ┌───┐ ┌───┐ ┌───┐
 │ 1 │ │ 3 │ │ 5 │ │10 │
 │min│ │min│ │min│ │min│
 └───┘ └───┘ └───┘ └───┘
   ▲ selected = white bg, dark text
```

### Info Sheet Phase Icons
Each phase shows a small circle with visual indicator:
- **Inhale**: Circle with outward arrows `←○→`
- **Hold**: Filled circle `●`
- **Exhale**: Circle with inward arrows `→○←`

### Transitions
- Duration buttons: `animate-fade-out` when session starts
- Start → Pause button: Smooth text/icon swap
- Info sheet: Slide up from bottom with backdrop blur

---

## Summary
This redesign consolidates 3 separate screens (Info Sheet → Settings Sheet → Active Screen) into a single unified experience where the breathing visualization is always visible, settings are inline, and the info is accessible via a ? button overlay.
