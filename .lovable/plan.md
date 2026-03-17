

# Focus Routine Player Enhancements

Based on the Routinery screenshots, the current player is missing several key features. Here's what needs to be added:

## Changes Overview

### 1. Enhanced Player UI (FocusRoutinePlayer.tsx)

**Header changes:**
- Replace left X with a chevron-down (minimize) button
- Add centered "Focus" pill badge (green dot + "Focus" text)
- Keep X on right -- but X now triggers "End the routine?" confirmation dialog

**Task time range display:**
- Show task start time and end time below the title: e.g. "1:07pm → 1:10pm"
- Calculate based on when the task started and target duration

**Timer overtime mode:**
- When `timeLeft` reaches 0, instead of stopping, count UP in red: `+00:12`
- Circle ring turns yellow/gold when overtime
- Show "Notify again" link below the overtime counter

**Time adjuster -- bottom sheet instead of inline:**
- Tapping the `- Xm +` area opens a bottom sheet titled "Adjust time"
- 4 buttons: `-10 min`, `-1 min`, `+1 min`, `+10 min`
- "Reset" button to restore original target time

**Skip -- bottom sheet confirmation:**
- Tapping skip opens a sheet: "Should we skip?"
- Options: "Rearrange order", "Move task to end", "Skip"

**Paused state UI:**
- Show timer text grayed out with "Paused" label below
- Show pause duration counter in blue below (e.g. "00:04")
- Replace controls with a single "Resume" button (blue, rounded pill)

**"End routine?" confirmation dialog:**
- Modal overlay: "End the routine?" / "Completed tasks will be saved."
- Two buttons: "Cancel" (light) and "End" (dark)
- End = save completed tasks, go to summary with partial results

**Bottom bar:**
- Card with "All ends" time (bold) + "Rearrange" button on the right

### 2. Overtime & Notify (useFocusRoutinePlayer.ts)

- Timer continues past 0 (counts up as negative/overtime)
- Track overtime separately for display
- Add `moveTaskToEnd` action -- moves current task to end of queue
- Add `endRoutineEarly` action -- saves completed tasks, marks remaining as skipped, goes to summary
- Track `taskStartedAt` for each task to show time ranges
- Track `pauseDuration` for paused state display

### 3. Focus Routines List (AppFocusRoutines.tsx)

- Show completion percentage on routine cards (like Routinery: "100%" with refresh icon for completed, "33%" with play icon for partial)
- Show task emoji chain with arrows between them (emoji > emoji > emoji)
- Filter to only show `is_focus` routines (already done)

### 4. Files to Modify

**`src/components/app/FocusRoutinePlayer.tsx`** -- Major rewrite:
- Add all bottom sheets (adjust time, skip confirmation, end routine dialog)
- Overtime display mode (red +MM:SS, yellow ring)
- Paused state with resume button and pause timer
- Task time range header (startTime → endTime)
- "Focus" pill in header
- Bottom card with "All ends" time + Rearrange

**`src/hooks/useFocusRoutinePlayer.ts`** -- Add:
- Overtime counting (timer goes negative / counts up past 0)
- `taskStartedAt` tracking per task
- `moveTaskToEnd()` action
- `endRoutineEarly()` action
- `resetTaskTime()` to restore original target
- `pauseStartedAt` and pause duration tracking

**`src/components/app/FocusPlayerProvider.tsx`** -- Pass new props through

**`src/pages/app/AppFocusRoutines.tsx`** -- Add completion % from `routine_sessions` data

