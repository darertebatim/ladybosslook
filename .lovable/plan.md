

## Focus Routine Player - Implementation (Completed)

A **Routinery-style Focus Routine Player** — a sequential task runner that plays through a routine's tasks one by one with countdown timers.

### Flow
1. User opens a focus routine detail page → sees "▶ Start Routine" button (if already added)
2. Pre-start breathing intro (3 cycles, skippable)
3. Full-screen timer player cycling tasks sequentially (pause/complete/skip controls)
4. Completion summary with streaks, total time, per-task breakdown

### Files Created
- `src/components/app/FocusRoutineBreathIntro.tsx` — Breathing intro screen
- `src/components/app/FocusRoutinePlayer.tsx` — Main timer player component
- `src/components/app/FocusRoutineSummary.tsx` — Post-routine summary
- `src/components/app/FocusPlayerProvider.tsx` — Context provider + overlay mount
- `src/hooks/useFocusRoutinePlayer.ts` — State management hook

### Files Modified
- `src/layouts/NativeAppLayout.tsx` — Wrapped with FocusPlayerProvider
- `src/pages/app/AppInspireDetail.tsx` — Added Play button for focus routines
- `src/hooks/useRoutinesBank.tsx` — Added `is_focus` and `duration_minutes` to types

### Database
- `routine_sessions` — Tracks focus routine play sessions
- `routine_session_tasks` — Per-task results within a session
