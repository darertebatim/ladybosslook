
# Fix Ritual Detail Page: End Date Display, Unsectioned Tasks, and End Date in Edit

## Issues Found

### 1. End date not showing in the app frontend
The database has `end_mode`, `end_date`, and `end_after_days` on `routines_bank` and they are populated (e.g., Strength PLUS has `end_mode='date'`, `end_date='2026-02-28'`). However, neither the ritual detail page (`AppInspireDetail.tsx`) nor the edit sheet (`RoutinePreviewSheet.tsx`) display the end date info. Only the start date banner is shown.

**Fix**: Add an end date banner below the start date banner on both:
- `AppInspireDetail.tsx` (ritual detail page) -- show something like "Ends Feb 28" in a red/rose banner
- `RoutinePreviewSheet.tsx` (edit ritual sheet) -- same end date banner

The routine data already includes `end_mode`, `end_date`, and `end_after_days` from the query.

### 2. Actions without a section don't appear on the ritual page
The "Strength PLUS" ritual has 6 tasks, all with `section_id = null`. It also has 1 section ("New Section") with 0 tasks. In the code at `AppInspireDetail.tsx` line 257, tasks are grouped by `section_id`, and the section view iterates `routine.sections` -- so tasks with no section are never rendered. The fallback "What's Included" (line 320) only triggers when there are zero sections. Since there is one (empty) section, unsectioned tasks become invisible.

**Fix**: After rendering section-based tasks, also render any "unsorted" tasks (those with `section_id = null`) as a separate group, either under "Other actions" or "What's Included". This ensures all tasks are always visible regardless of section assignment.

### 3. End date in individual action settings
You mentioned there used to be an ending time in action settings -- looking through the code history, the `repeat_end_date` column exists on `user_tasks` and is used in `taskAppliesToDate`, but there was never a UI field for it in the task editor (`AppTaskCreate`). It was only set programmatically when adopting rituals with end dates. This is by design -- end dates flow from the ritual configuration to the tasks automatically.

## Technical Changes

### File: `src/pages/app/AppInspireDetail.tsx`
1. Add an end date info computation (similar to `startInfo`) that reads `end_mode`, `end_date`, `end_after_days` from the routine
2. Display an end date banner below the start date banner (rose/red colored, e.g., "Ends Feb 28" or "Ends after 28 days")
3. After the sections loop (line 318), add a block to render tasks where `section_id` is null under an "Actions" or "What's Included" heading -- even when sections exist

### File: `src/components/app/RoutinePreviewSheet.tsx`
1. Add props for `endDate`, `endMode`, `endAfterDays` (optional)
2. Display an end date banner below the start date banner
3. Update the call site in `AppInspireDetail.tsx` to pass the end date props

### Passing end date through
The `RoutinePreviewSheet` is called from `AppInspireDetail.tsx` at line 382. Need to pass end date props from the routine data.
