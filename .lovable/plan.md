

# Revamp Ritual Scheduling + Challenge Start Date

## Overview
Two main changes: (1) Simplify ritual types to Normal and Challenge, with per-task repeat settings shown grouped in the preview, and (2) Add a "Start Date" picker for Challenge rituals so admins can set when the challenge begins (e.g., next Monday).

---

## Change 1: Remove "Weekly" Ritual Type from Admin Builder

**File: `src/components/admin/RoutinesBank.tsx`**

- Remove the "Weekly Plan" option from the 3-column Ritual Type grid (lines 948-970), leaving only "Normal" (formerly Daily) and "Challenge"
- Change `grid-cols-3` to `grid-cols-2`
- Rename "Daily" to "Normal" with updated description: "Actions with their own repeat settings"
- Keep "Challenge" as-is
- Remove the weekly `schedule_days` weekday picker from `renderTaskScheduleConfig()` (lines 621-665) -- only keep challenge `drip_day` config
- Keep the `schedule_type` form field but only allow `'daily'` or `'challenge'`

---

## Change 2: Add Challenge Start Date Picker

**File: `src/components/admin/RoutinesBank.tsx`**

- Add a new `challenge_start_date` field to the form state
- When `schedule_type === 'challenge'`, show a date picker below the Ritual Type selector using the Shadcn Calendar/Popover pattern
- Label: "Challenge Starts On" with a calendar popover
- Default: today's date, but admin can pick any future date (e.g., next Monday)

**File: `src/hooks/useRoutinesBank.tsx`**

- In the `useAddRoutineFromBank` save mutation, when `scheduleType === 'challenge'`:
  - Use the ritual's `challenge_start_date` (if set) instead of `today` as the base date for calculating drip dates
  - If no start date is stored, fall back to today

**Database**: The `routines_bank` table needs a `challenge_start_date` column (type: `date`, nullable). A migration will add this.

---

## Change 3: Group Tasks by Repeat Type in Preview Sheet

**File: `src/components/app/RoutinePreviewSheet.tsx`**

- For non-challenge rituals (`scheduleType !== 'challenge'`), group tasks into sections based on each task's own `repeat_pattern` from the bank:
  - **Daily Tasks** -- `repeat_pattern === 'daily'` or null
  - **Weekly Tasks** -- `repeat_pattern === 'weekly'`
  - **Monthly Tasks** -- `repeat_pattern === 'monthly'`
  - **Special Events** -- `repeat_pattern === 'none'`
- Each section renders only if it has tasks, with a styled header (like Me+ screenshots)
- For challenge rituals, keep the flat "Challenge Actions" list with Day numbers

- Revert `getTaskDisplay()` to use each task's own `repeat_pattern` instead of deriving from `scheduleType`
- Revert `getInitialDataForEdit()` to use each task's own repeat settings, allowing full edit freedom
- The edit form (AppTaskCreate) already supports daily/weekly/monthly/custom repeat -- no changes needed there

---

## Change 4: Update Save Logic for Per-Task Repeat

**File: `src/hooks/useRoutinesBank.tsx`**

- For non-challenge rituals: use each task's `repeat_pattern` from the bank (or `edited.repeatPattern` if user changed it in the edit form)
- Remove the `scheduleType === 'weekly'` branch that forces `custom` repeat with `schedule_days`
- For challenge rituals: keep existing drip logic but use `challenge_start_date` from the routine

---

## Change 5: Pass `repeat_pattern` Through to Preview

**File: `src/pages/app/AppInspireDetail.tsx`**

- The `convertToRoutinePlanTask` function already passes `repeat_pattern` -- just ensure it's mapped correctly and add `repeat_days` from `admin_task_bank` if available

---

## Technical Summary

### Files to modify:
- `src/components/admin/RoutinesBank.tsx` -- Remove Weekly option, add challenge start date picker
- `src/components/app/RoutinePreviewSheet.tsx` -- Group tasks by repeat type, revert schedule-type-based logic
- `src/hooks/useRoutinesBank.tsx` -- Use per-task repeat, support challenge_start_date
- `src/pages/app/AppInspireDetail.tsx` -- Ensure repeat_pattern pass-through

### Database migration:
- Add `challenge_start_date` column (type `date`, nullable) to `routines_bank` table

