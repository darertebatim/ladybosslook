# Bundle Home Spotlights Behind an Intro Popup

## Problem
The 3 new-user home coach marks (mark first task → tap task → tap +) currently fire on independent timers (3s, 5s, 2s after sheet close). If the user scrolls before the timer fires, the spotlight target is offscreen and they only see a black overlay. They also feel disconnected from each other.

The old `AppTour` / `useAppTour` / `TourBanner` system is unrelated and should be left alone.

## Solution

### 1. New intro popup: `HomeSpotlightIntro`
Create `src/components/app/home/HomeSpotlightIntro.tsx` — a Dear-Me-style bottom sheet with:
- Cream background, rounded top
- Title: "Let's take a quick tour!"
- Body: "We'll show you 3 quick things — how to complete a task, view its details, and add a new one."
- Primary button: "Show me" (dark navy, full width)
- Secondary text button: "Skip"
- Dismissible by tapping Skip only (no backdrop dismiss to avoid accidental skip)
- Optional small mascot/illustration area at top (use existing emoji or skip if no asset handy)

### 2. Orchestrate the 3 spotlights as a sequence
In `src/pages/app/AppHome.tsx`:

- **Remove** the 3 independent auto-show timers (the `useEffect` blocks at ~lines 768, 793, 812 that set `showFirstCoachMark`, `showTapCoachMark`, `showAddCoachMark` on timers).
- **Add** new state `showSpotlightIntro` plus an orchestrator state `spotlightStep: 'idle' | 'intro' | 'first' | 'tap' | 'add' | 'done'`.
- **Trigger intro** for new users when:
  - `!homeDataLoading && totalCompletions === 0 && tasks.length > 0`
  - `localStorage.getItem('simora_spotlight_tour_done') !== 'true'`
  - After a 1s delay (for layout settle)
- **On "Show me" tap**:
  1. Scroll the home scroll container to top (smooth) and wait ~400ms.
  2. Set `spotlightStep = 'first'` → renders existing first coach mark spotlight on the first task.
- **On task completion** (existing effect at ~787): advance `spotlightStep` to `'tap'` after a brief delay; before showing, scroll to top again.
- **On task detail close** (existing logic at ~812 using `tapCoachMarkTriggeredRef`): advance to `'add'`; scroll to top again.
- **On + button shown / dismissed**: set `spotlightStep = 'done'` and write `localStorage.setItem('simora_spotlight_tour_done', 'true')`.
- Each step also writes its existing legacy localStorage key so we don't break re-entry logic.

Scroll-to-top: locate the scrollable home container (the main content `div` inside the home layout) via a `ref`, and call `containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })`. If the page uses `window` scroll, use `window.scrollTo` instead — confirm during implementation.

### 3. Keep spotlight rendering unchanged
The existing render conditions at lines 1210, 1268, 1417 stay the same — they already key off `showFirstCoachMark` / `showTapCoachMark` / `showAddCoachMark`. The orchestrator just sets those flags one at a time after the intro and after scrolling.

### 4. Don't touch the old tour
`useAppTour`, `AppTour`, `TourBanner`, `TourOverlay` — leave as-is. Already disabled per `useAppTour.tsx` comment.

### 5. Admin reset button
In `src/pages/admin/System.tsx`, add a new card "Reset Home Spotlight Tour":
- Description: "Clears the new-user spotlight flags so the intro popup + 3-step spotlight sequence plays again on next visit to /app/home."
- Button "Reset Spotlight Tour" that on click:
  - Removes localStorage keys: `simora_spotlight_tour_done`, `simora_first_action_celebrated`, `simora_tap_coach_shown`, `simora_add_coach_shown`
  - Sets `simora_force_new_user = 'true'` (already supported in AppHome at line 259)
  - Toasts "Spotlight tour reset — open /app/home to test"

## Files to Edit
- `src/pages/app/AppHome.tsx` — remove 3 auto-timers, add orchestrator + scroll-to-top, render intro
- `src/components/app/home/HomeSpotlightIntro.tsx` — NEW intro popup component
- `src/pages/admin/System.tsx` — add reset card/button

## Out of Scope
- Old `AppTour` / `TourBanner` system
- Visual restyle of the existing spotlight rings/hint hands (keep as-is)
- Translations (use English strings; matches current coach mark copy)
