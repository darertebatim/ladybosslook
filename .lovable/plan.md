

# Fix Hold Phases in Welcome Breathing

## Problem
The hold phases technically exist (1 second each) but are nearly invisible — the "Hold" text flashes for just 1 second with no distinct visual effect, making it look like the exercise only does inhale/exhale.

## Changes

### `src/components/admin/onboarding/OnboardingStepRenderer.tsx`

1. **Add distinct visual effects for hold phases:**
   - **Inhale hold**: Add a pulsing glow effect on the circle while it stays fully expanded — a gentle brightness pulse to signal "hold here"
   - **Exhale hold**: Add a subtle shimmer/pulse at the collapsed state
   - Add a new CSS keyframe `ob-hold-pulse` for a gentle scale+glow oscillation during holds

2. **Add distinct background gradients for holds:**
   - `inhale_hold`: Slightly brighter/warmer purple gradient than inhale
   - `exhale_hold`: Slightly different tone than exhale to show it's a distinct phase

3. **Make "Hold" text more prominent:**
   - Larger text size during hold phases (text-2xl vs text-xl)
   - Brighter white opacity (text-white/95 vs text-white/90)
   - Show countdown number larger and more visible

4. **Circle behavior during holds:**
   - Instead of instant `0.3s ease-out` snap, apply the `ob-hold-pulse` animation — a gentle scale oscillation (±3%) so the circle visibly "breathes" at its held position, making it clear something is happening
   - Increase glow intensity during holds

### Visual summary

```text
Phase         Circle              Text         Effect
──────────────────────────────────────────────────────
Inhale        0.45 → 1.0 (3s)    "Inhale"     Linear expand
Inhale Hold   ~1.0 pulsing        "Hold" + n   Gentle pulse glow
Exhale        1.0 → 0.45 (3s)    "Exhale"     Linear contract  
Exhale Hold   ~0.45 pulsing       "Hold" + n   Gentle pulse glow
```

