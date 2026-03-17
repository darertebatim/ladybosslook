

# Focus Routine Player - Implementation Plan

## What We're Building

A **Routinery-style Focus Routine Player** -- a sequential task runner that plays through a routine's tasks one by one, each with its own countdown timer. The flow based on your screenshots:

1. **Routine List** (existing) -- user sees their activated routines with a Play button
2. **Routine Detail** (existing) -- sees tasks with durations, yellow "Done at [time]" button
3. **Pre-start Breathe** -- brief breathing intro before the timer chain begins
4. **Focus Timer Player** -- full-screen player cycling through tasks sequentially (pause/complete/skip controls, "NEXT" preview, end time display)
5. **Completion Summary** -- shows streak, total time, per-task breakdown with actual vs target duration

---

## Technical Approach

### New Files to Create

1. **`src/components/app/FocusRoutinePlayer.tsx`** -- The main full-screen player component
   - State machine: `breathe_intro` → `running` → `paused` → `task_complete` → `next_task` → `routine_done`
   - Tracks: current task index, elapsed seconds per task, total elapsed
   - UI: Large emoji + task title, countdown timer, `- Xm +` time adjuster, Pause | Complete (checkmark) | Skip (next) buttons
   - "NEXT" label showing upcoming task title
   - Bottom bar: "All ends [time]" + Rearrange button
   - Full-screen colored background (task color or neutral)

2. **`src/components/app/FocusRoutineBreathIntro.tsx`** -- Pre-start breathing screen
   - Shows routine name in large circle
   - "Inhale" / breathing cue text
   - Skip + Cancel buttons
   - Auto-transitions to player after ~3 breaths or user skips

3. **`src/components/app/FocusRoutineSummary.tsx`** -- Completion summary screen
   - Routine name + time range (start - end)
   - Streak + Total completions stats
   - Per-task breakdown: emoji, title (truncated), actual time, delta from target (colored red/green)
   - Total time + total delta
   - Done button + Share button

4. **`src/hooks/useFocusRoutinePlayer.ts`** -- State management hook
   - Manages the player lifecycle, task progression, time tracking
   - Saves per-task progress to `task_completions` / `goal_progress`
   - Records routine completion for streak tracking

### Modifications to Existing Files

5. **`src/pages/app/AppHome.tsx`** or wherever routine cards render -- Add Play button handler that opens the Focus Routine Player for `is_focus` routines

6. **`src/components/app/HomeCelebrations.tsx`** -- Mount the `FocusRoutinePlayer` overlay (z-index 9999, same pattern as `TaskTimerScreen`)

7. **`src/hooks/useRoutinePlans.tsx`** or **`src/hooks/useRoutinesBank.tsx`** -- Expose `is_focus` flag when fetching user's routine plans so the UI knows which routines get the focus player

### Data Flow

- When user taps Play on a focus routine, fetch the routine's tasks (from `user_tasks` linked to this routine plan) with their `goal_target` (timer seconds) and `duration_minutes`
- Each task runs as a countdown from its `goal_target` seconds
- On complete/skip, record `goal_progress` for that task's completion
- "All ends" time = current time + sum of remaining task durations
- Summary screen reads from the session data collected during play

### Database

- **`routine_sessions`** table (new) -- Track focus routine play sessions:
  - `id`, `user_id`, `routine_plan_id` (or `routines_bank_id`), `started_at`, `ended_at`, `total_seconds`, `tasks_completed`, `tasks_skipped`
- **`routine_session_tasks`** table (new) -- Per-task results:
  - `id`, `session_id`, `task_id`, `target_seconds`, `actual_seconds`, `status` (completed/skipped)

These tables power the summary screen and future analytics. Streak/Total counts come from `routine_sessions`.

### UI Details (from screenshots)

- **Player screen**: Neutral light background, large circle container with emoji + countdown, `- Xm +` time adjustment below timer, three bottom buttons (Pause | dark checkmark circle | Skip arrow), "NEXT [task title]" preview, bottom card with end time + Rearrange
- **Breathe intro**: Dark overlay with large circle, routine name, "Inhale" text, Skip/Cancel links
- **Summary**: White background, routine name + time range, Streak/Total stat cards, task list with time breakdowns in blue for deficits, Done + share buttons

---

## Implementation Order

1. Create database tables for session tracking
2. Build `FocusRoutineBreathIntro` component
3. Build `FocusRoutinePlayer` component (core timer + task cycling)
4. Build `FocusRoutineSummary` component
5. Create `useFocusRoutinePlayer` hook for state management
6. Wire Play button on routine cards to launch the player
7. Mount player overlay in HomeCelebrations

