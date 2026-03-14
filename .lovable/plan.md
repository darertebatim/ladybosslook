

# Plan: Redesign StarterRoutineScreen with Step-by-Step Reveal & Rich Celebrations

## Current Problem
The page immediately shows all tasks with the dark spotlight overlay active and the finger hint visible — everything happens at once. The user can't absorb what's on screen before being asked to act.

## Proposed Flow (Timed Sequence)

### Phase 1: "Reveal" (no overlay, no hints)
1. **Title fades in** — "Here's your first routine" (0ms)
2. **Subtitle fades in** — "A simple daily reset..." (400ms)
3. **Tasks appear one-by-one** — staggered fade-up, ~300ms apart (starting at 800ms)
4. **All tasks visible** — user sees the full routine for **3 seconds** with no overlay, no hints

### Phase 2: "Spotlight Task 1" (after ~3s idle)
5. **Dark overlay fades in** (bg-black/50)
6. **"Open Ladyboss App" card** gets spotlighted (z-40)
7. **Instruction text appears** — "👆 Tap the circle to complete your first task!"
8. **Finger hint (👇) appears** after 500ms delay — bouncing on the circle

### Phase 3: "Celebrate Task 1" (on tap)
9. On circle tap:
   - **SealCheck icon** replaces empty circle with `animate-seal-pop` + particle burst
   - **`playCompletionSound()`** — swoosh + ding
   - **`haptic.success()`**
   - **Mini confetti burst** from the card area
   - **Card emoji bounces** (`animate-emoji-bounce`) + **ripple wave** on content
   - **Pause ~1.5s** to let celebration land

### Phase 4: "Spotlight Task 2 — Breathe" (after 1.5s pause)
10. Spotlight moves to Breathing card
11. Instruction: "🫁 Now tap the Breathe button to try it!"
12. Finger hint appears after 500ms
13. On tap → immersive breathing overlay (existing)
14. On breathing complete → same celebration (SealCheck, sound, haptic, confetti, pause)

### Phase 5: "Spotlight Task 3 — Mood" (after 1.5s pause)
15. Spotlight moves to Mood card
16. Instruction: "🌤️ Now check in with your mood!"
17. Finger hint after 500ms
18. On tap → mood picker (existing)
19. On mood select → same celebration (SealCheck, sound, haptic, confetti, pause)

### Phase 6: "Done" (after 1.5s pause)
20. Spotlight on Continue button
21. Instruction: "✨ Tap Continue to keep going!"
22. Finger hint on button

## Technical Changes

### State Machine Update
Replace current `HintPhase` with a more granular state:

```text
'intro'          → tasks not yet visible
'revealing'      → tasks appearing one-by-one  
'viewing'        → all tasks visible, no overlay (3s timer)
'spotlight-app'  → spotlight on task 0, no hint yet
'hint-app'       → finger hint visible on task 0
'celebrate-app'  → SealCheck + sound + confetti playing
'spotlight-breathe' → spotlight on breathing task
'hint-breathe'   → finger hint on breathe button
'celebrate-breathe' → celebration after breathing
'spotlight-mood' → spotlight on mood task
'hint-mood'      → finger hint on mood check button
'celebrate-mood' → celebration after mood select
'done'           → spotlight Continue button
```

### File: `src/components/admin/onboarding/OnboardingStepRenderer.tsx`

**In `StarterRoutineScreen`:**

1. **New state type** with granular phases above
2. **useEffect timer chain** for intro → revealing → viewing → spotlight-app → hint-app
3. **Task visibility** — during `revealing`, only show tasks up to `revealedCount` (incremented via interval)
4. **Overlay** — only render when phase is `spotlight-*` or later (not during intro/revealing/viewing)
5. **Instruction text** — hidden during intro/revealing/viewing phases
6. **Finger hint** — only shows in `hint-*` phases (delayed 500ms after spotlight)
7. **Celebration on complete** — each `handleCheck*` triggers:
   - `playCompletionSound()` (import from `@/lib/completionSound`)
   - `haptic.success()`
   - Small `confetti()` burst
   - Set `isAnimating` state for SealCheck particle burst
   - Mark task completed in `completedIndices`
   - Enter `celebrate-*` phase for 1.5s, then advance to next spotlight
8. **TaskCard rendering** — pass `isAnimating` flag per-task to trigger SealCheck `showParticles` + `animate-seal-pop`

### Key Timing Constants
- Task reveal stagger: 300ms each
- Viewing pause: 3000ms
- Hint delay after spotlight: 500ms  
- Celebration hold: 1500ms
- Transition between spotlight phases: 500ms fade

