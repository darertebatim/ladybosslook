

# Fix Onboarding Breathing: Use Real Components + Info Guide

## Problem
1. The onboarding breathing overlay is a custom mini-implementation instead of using the real breathing components
2. It doesn't show the info/guide sheet before starting (like the real breathe tool does — see screenshot)
3. The exercise name lookup works, but the experience doesn't match what the user expects

## Plan

### Rewrite `OnboardingBreathingOverlay` to use real components

Instead of the custom mini breathing circle, the overlay will:

1. **Phase 1 — Info Sheet**: Show `BreathingInfoSheet` with the "Welcome Breathing" exercise details (3s inhale nose, 1s hold, 3s exhale mouth, 1s hold). User taps "Okay" to proceed.

2. **Phase 2 — Breathing Session**: Render the real `BreathingCircle` component (from `src/components/breathe/BreathingCircle.tsx`) with a 3-second countdown, then 3 full breath cycles using the exercise's exact timings. Show cycle count (1/3, 2/3, 3/3).

3. **Phase 3 — Complete**: After 3 cycles, auto-call `onComplete` to mark the breathing task done and return to the starter routine.

### Key details
- Fetch "Welcome Breathing" by exact name from `breathing_exercises` table (ID: `02b049a0-...`)
- Use `BreathingInfoSheet` directly (it accepts a `BreathingExercise` object, `open`, `onOpenChange`, `onDismiss`)
- Use `BreathingCircle` for the actual animation (accepts `phase`, `phaseDuration`, `phaseText`, `methodText`, `countdown`)
- The overlay remains full-screen (`fixed inset-0 z-[100]`) with a close/X button
- No duration picker — hardcoded to 3 cycles
- No completion sheet — just auto-returns to onboarding

### Files to change
| File | Change |
|------|--------|
| `src/components/admin/onboarding/OnboardingStepRenderer.tsx` | Rewrite `OnboardingBreathingOverlay` to use `BreathingInfoSheet` + `BreathingCircle`, 3-cycle limit |

