

# Spotlight Continue Button After Mood Check-in

## Problem
After the mood check-in demo completes and `hintPhase` becomes `'done'`, the dark overlay disappears and the Continue button just appears — it's not spotlighted, so users may not notice it.

## Changes — `src/components/admin/onboarding/OnboardingStepRenderer.tsx`

1. **Extend the dark overlay to also show during `'done'` phase** — add `hintPhase === 'done'` to the overlay condition on line 2232.

2. **Move the Continue button to render always (not just in `done`)**, but keep it visible only in `done` phase, and give it `relative z-40` so it sits above the dark overlay — making it the spotlighted element.

3. **Update the hint text for `done` phase** to point at Continue, e.g.: `"✨ Tap Continue to keep going!"`

This keeps the spotlight/overlay pattern consistent through all phases, ending with the Continue button as the final spotlighted element.

