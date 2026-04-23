## Post-Reflection Celebration Sheet

Replace the green "Reflection saved/completed ✨" toast with a 4-card bottom sheet suggesting next steps — mirroring the post mood check-in UX.

### What the user will see

After saving any reflection (free-form OR structured), a sheet slides up from the bottom with:

- **Header**
  - Notebook emoji (📓) in a soft circle
  - Small line: *"Nice work — you reflected today."*
  - Bold title: *"Keep the momentum going"*
- **2×2 cards** (white cards on a soft pastel background, illustrated)
  1. **Academy** → /app/academy 
  2. **Listen** → `/app/player`
  3. **Focus Timer** → `/app/timer`
  4. **My Presence** → `/app/presence`
- **Bottom button** — solid white pill with black text: **"Back to Home Planner"** (or **"Continue Routine ▶"** if a routine player is active)

Tapping any card haptic-taps and navigates. Dismissing the sheet returns to the routine player if active, otherwise goes back to `/app/reflections`.

### Technical changes

**1. New component: `src/components/reflection/ReflectionCelebrationSheet.tsx**`

- Modeled directly on `MoodCelebrationSheet.tsx`.
- Props: `open`, `onOpenChange`, `onDone`.
- Uses `Sheet` primitive (`side="bottom"`, rounded top, soft pastel background to differentiate from mood sheet).
- Card → route mapping:
  - Academy → `/app/courses`
  - Listen → `/app/player`
  - Focus Timer → `/app/timer`
  - Presence → `/app/presence`
- Integrates with `useRoutinePlayerContext` exactly like `MoodCelebrationSheet` so an active routine player resumes correctly when sheet is dismissed.
- Wrapped in `OverlayPortal` so it escapes scroll containers.

**2. `src/pages/app/AppFreeFormReflection.tsx**`

- Remove `toast.success('Reflection saved ✨')` and the immediate `navigate/goBack` from `onSuccess`.
- Add local state `const [showCelebration, setShowCelebration] = useState(false)`.
- On success: still invalidate queries + `autoCompleteJournal()`, then `setShowCelebration(true)`.
- Render `<ReflectionCelebrationSheet>` at the bottom of the JSX. Its `onDone` triggers existing routine-player-aware navigation (`/app/home` + maximize, or `goBack()`).

**3. `src/pages/app/AppReflectionFlow.tsx**`

- Same change applied to BOTH completion branches (`handleSaveSinglePage` and the `isLast` branch in `handleNext`):
  - Remove the toast.
  - Trigger `setShowCelebration(true)` after `autoCompleteReflection`.
- Render the same `<ReflectionCelebrationSheet>` once at the page root.

**4. Asset generation**

- Generate 4 small flat-illustration cards (~512×512 PNG) consistent with existing `mood-card-*.png` style:
  - `reflection-card-academy.png` (graduation cap / open book with bookmark)
  - `reflection-card-listen.png` (headphones / sound waves)
  - `reflection-card-timer.png` (stopwatch)
  - `reflection-card-presence.png` (calendar with check / streak)

### What stays unchanged

- `useReflections` admin toasts ("Reflection created/updated/deleted") — admin CRUD, untouched.
- Auto-completion of pro-tasks (`autoCompleteJournal`, `autoCompleteReflection`) still runs before the sheet appears.
- Routine-player resume logic preserved end-to-end.
- `MoodCelebrationSheet` is untouched.