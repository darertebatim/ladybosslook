

# Plan: Replace "Your Programs" with Enrollment-Day Program Event Cards

## Problem
The "Your Programs" bottom carousel takes up screen space permanently. Users need to know about their programs, but a persistent UI section is overkill when Program Event Cards already exist in the planner.

## Approach

### 1. Add an "enrollment" event type to ProgramEventCard
On the day a user enrolls (or re-enrolls), show a special card like:
- Type: `enrollment` — new gradient (e.g., amber/orange), with a GraduationCap icon
- Title: the program name
- Badge: "New Program" or "Welcome"
- Clicking navigates to `/app/course/{slug}`
- Not completable (no checkbox, or auto-completed)

### 2. Update the RPC to return enrollment events
Modify `get_program_events_for_date` to include a 4th result set: `enrollments`. For each active enrollment where `enrolled_at::date = v_date`, return an enrollment event object with program title, slug, and round info.

### 3. Update `usePlannerProgramEvents` hook
- Process the new `data.enrollments` array from the RPC
- Create `ProgramEvent` objects with `type: 'enrollment'`
- Sort them at the top (before sessions)

### 4. Update ProgramEventCard to handle enrollment type
- Add `enrollment` to `EVENT_STYLES` (amber gradient, GraduationCap icon, "New Program" badge)
- Hide the completion checkbox for enrollment events
- On click, navigate to course detail page

### 5. Handle schedule changes (session updates)
When admin changes session dates, the session events will naturally appear on the new dates via the existing system. No extra work needed — the planner already reflects the current schedule.

### 6. Remove the "Your Programs" bottom carousel
- Remove the `ActiveRoundsCarousel` rendering from `AppHome.tsx` (the fixed bottom section)
- Remove the extra bottom padding that accounts for it
- Adjust FAB positioning
- Clean up the HomeTour step that references it

### 7. Update `useProgramEventDates` for calendar dots
Add enrollment dates to the dot indicator so users see activity on their enrollment day in the calendar.

## Technical Details

**New ProgramEvent type value**: `'enrollment'` added to the union type.

**RPC change** (migration): Add an `enrollment_events` CTE that selects from `course_enrollments` where `enrolled_at::date = v_date`, returning program title, slug, round info.

**Files to modify**:
- `supabase/migrations/` — new migration updating the RPC
- `src/hooks/usePlannerProgramEvents.tsx` — process enrollment events, update types
- `src/components/app/ProgramEventCard.tsx` — add enrollment style, hide checkbox for it
- `src/pages/app/AppHome.tsx` — remove ActiveRoundsCarousel section + related imports/padding
- `src/components/app/tour/HomeTour.tsx` — remove programs tour step
- `src/hooks/usePlannerProgramEvents.tsx` (`useProgramEventDates`) — include enrollment dates

