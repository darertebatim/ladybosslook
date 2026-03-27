

## Plan: Program Routine Detail Page + Event Card Preview

### What Changes

**1. "Program Guided" badge and indicator on the routine detail page (`AppInspireDetail.tsx`)**
- Detect `schedule_type === 'program'` (similar to how `isChallenge` and `isProject` are detected)
- Add a 🎓 "Program" badge in the badges row (like the existing Challenge/Project badges)
- Replace the "Ready to start today!" banner with a program-specific banner showing the linked program name (e.g., "🎓 Enrolls you in: [Program Title]")

**2. Fetch linked program info**
- When the routine has `linked_program_slug`, fetch the program's title and cover image from `program_catalog` inside `useRoutineBankDetail` (or as a separate small query in the detail page)
- This data powers the banner and the event card preview

**3. Show a preview ProgramEventCard on the detail page**
- Below the description (or in the start info area), render a static/preview version of the enrollment `ProgramEventCard`
- Build a mock `ProgramEvent` object with `type: 'enrollment'`, the program title, and today's date
- Render the existing `ProgramEventCard` component in a "preview" wrapper with a label like "What you'll see in your planner:"
- The card will be non-interactive (wrap in a `pointer-events-none` container so tapping doesn't navigate)

**4. Hide irrelevant sections for program routines**
- Hide start/end date banners (program timing comes from the round, not the routine)
- The tasks list still shows if the routine has tasks (optional for program routines)

### Files to Edit

- **`src/pages/app/AppInspireDetail.tsx`** — Add `isProgram` detection, program badge, program info banner, and ProgramEventCard preview
- **`src/hooks/useRoutinesBank.tsx`** — Include `linked_program_slug` in the `useRoutineBankDetail` return data; optionally join program title

### Technical Details

- The preview event card uses the existing `ProgramEventCard` component with a fabricated event:
```ts
const previewEvent: ProgramEvent = {
  id: 'preview',
  type: 'enrollment',
  title: programTitle,
  programTitle: programTitle,
  programSlug: routine.linked_program_slug,
  time: null,
  isCompleted: false,
  // ... minimal fields
};
```
- Wrapped in `<div className="pointer-events-none opacity-90">` to prevent interaction
- Label above: "Added to your planner:" in a muted style

