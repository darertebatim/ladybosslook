

# Interactive Starter Routine with Guided Finger Hints

## What We're Building
Transform the starter-routine onboarding screen into a real interactive experience:
1. Add "Get out of bed" as the first task
2. Create real tasks in Supabase when the user reaches this screen
3. Guide the user step-by-step with finger hints (like `AddToRoutineHandHint`):
   - **Step 1**: Finger hint pointing at "Get out of bed" checkmark → user taps to complete it
   - **Step 2**: Spotlight the "Breathing exercise" pro-link action button → user taps, navigates to `/app/breathe`
   - **Step 3**: When user returns from breathing, continue onboarding to the final welcome-aboard screen

## Tasks (5 total)

### 1. Update `STARTER_TASKS` array
Add "Get out of bed" (emoji: 🛏️, color: peach/orange) as the first item. The 5 tasks become:
- 🛏️ Get out of bed — "Start your day with one small win"
- 🌤️ Check in with your mood — pro_link: `mood`
- 🫁 Breathing exercise — pro_link: `breathe`
- 📝 Write a short reflection — pro_link: `journal`
- ✅ Complete one small task — regular task

### 2. Create real tasks on mount
When `StarterRoutineScreen` mounts (and user is authenticated), use `useCreateTask` to insert the 5 tasks into `user_tasks`. Store created task IDs in local state. Tasks are created with `repeat_pattern: 'daily'` (except "Complete one small task" which is `none`). Pro tasks get their `pro_link_type` set.

### 3. Build interactive card list with completion state
Instead of static cards, render cards that respond to taps:
- Each card has a completion circle (like `TaskCard`)
- Tapping the circle marks it complete (calls `useCompleteTask`)
- Completed cards show `SealCheck` in teal

### 4. Implement guided hint system (3 phases)
Use a local state machine (`hintPhase: 'check-bed' | 'breathe' | 'done'`):

**Phase 1 — `check-bed`**: Show a bouncing 👇 finger hint (reuse `AddToRoutineHandHint` pattern) pointing at the "Get out of bed" checkmark circle. When user taps it → mark complete, advance to phase 2.

**Phase 2 — `breathe`**: Spotlight/highlight the breathing exercise card's pro-link action button with a pulsing ring + finger hint. When user taps → navigate to `/app/breathe`. Store `onboarding_breathe_pending` in localStorage.

**Phase 3 — return**: In `AppOnboarding`, check `onboarding_breathe_pending` on mount. If set, clear it and auto-advance to the welcome-aboard step. This handles the "come back from breathing" flow.

### 5. Wire into `AppOnboarding.tsx`
- Pass `user` and `navigate` to `StarterRoutineScreen` (extend Props or use hooks inside)
- On the starter-routine screen, the "Start your first reset" button changes to "Continue" after the breathing exercise is done, or the button is hidden during guided phases (hints guide the user instead)

## Files to Change

| File | Change |
|------|--------|
| `src/components/admin/onboarding/OnboardingStepRenderer.tsx` | Rewrite `StarterRoutineScreen` with real task creation, interactive completion, and hint system |
| `src/data/onboarding-flows/quick-start.ts` | Update starter-routine step config (add "Get out of bed") |
| `src/pages/app/AppOnboarding.tsx` | Add breathe-return detection logic on mount |

## Technical Details

- Hint component: Self-contained inside `StarterRoutineScreen`, using the same CSS keyframe animation pattern from `AddToRoutineHandHint` (bouncing 👇 emoji)
- Spotlight: A pulsing ring (`ring-4 ring-primary/50 animate-pulse`) around the breathing card, similar to `TourOverlay`'s spotlight ring
- Task creation is fire-and-forget with a guard (`localStorage` flag `onboarding_tasks_created`) to avoid duplicates on re-render
- The breathing card's pro-link button gets a CSS class (`tour-onboarding-breathe`) for targeting by the hint

