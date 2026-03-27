

## Plan: Add "Program" Routine Type

### Overview
Add a new routine type called "Program" in the admin Routines Bank. When selected, the admin can link a program from the `program_catalog` to the routine. When a user adds this routine to their planner, it automatically enrolls them in that program (and its active round).

### Database Changes

**1. Add `linked_program_slug` column to `routines_bank`:**
```sql
ALTER TABLE public.routines_bank 
  ADD COLUMN linked_program_slug text REFERENCES program_catalog(slug) ON DELETE SET NULL;
```

This stores which program a "program" type routine is linked to.

### Admin UI Changes (RoutinesBank.tsx)

**2. Add "Program" as a 4th routine type option:**
- Add `{ value: 'program', label: 'Program', desc: 'Auto-enroll in a program', icon: '🎓' }` to the type selector
- Change the grid from `grid-cols-3` to `grid-cols-4`
- Update the `schedule_type` type to include `'program'`

**3. Show program selector when type is "program":**
- When `schedule_type === 'program'`, render a dropdown/select fetching from `program_catalog` (active programs)
- Store selection in `formData.linked_program_slug`
- Hide start/end mode selectors for program type (not relevant)
- Tasks section remains available (admin can still add routine tasks alongside enrollment)

**4. Save `linked_program_slug` on create/update:**
- Include `linked_program_slug` in the insert/update calls to `routines_bank`

### Enrollment Logic (useRoutinesBank.tsx)

**5. Auto-enroll user when adding a "program" routine:**
- In the `addRoutineToPlanner` mutation, after creating tasks, check if `schedule_type === 'program'` and `linked_program_slug` exists
- Query `program_rounds` for the latest active round of that program
- Insert into `course_enrollments` with `user_id`, `program_slug`, `round_id` (if exists), `status: 'active'`
- Skip enrollment if user is already enrolled (check first)

### App-Side Display

**6. Filter "program" routines in the library:**
- Add `'program'` to the existing category filters alongside challenges/projects
- Program routines display with the 🎓 icon

### Technical Details

- The `schedule_type` enum in the DB is stored as `text`, so no enum migration needed — just store `'program'`
- Round assignment: query `program_rounds` for the program where `is_active = true` or the most recent round, matching existing enrollment logic
- The routine can still have tasks (e.g., "Complete Module 1") that work alongside enrollment
- If the program has no active round, enroll without a round_id (same as self-paced programs)

