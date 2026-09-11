# My Learning section on Path

## The idea

Keep Path as the home. For users enrolled in a program, add a **My Learning** block directly under the header, above the shortcuts row. When it is present, the shortcuts row is removed for that user (they can still reach everything via the menu) — so the program becomes the first thing they see after buying, without inventing a new page.

Users with no enrollment see today's Path unchanged.

## The My Learning block

One bordered card with a warm orange-tinted background, containing:

1. **Greeting line** — "Welcome back, {name}" (first visit after enrollment: "You're in — {program name}"), plus program and round name in small caps.
2. **Continue where you left off** — 16:9 cover thumb, next unfinished lesson title and its module, and a full-width orange Continue button ("Start Lesson 1" if untouched). Tapping goes straight to the lesson.
3. **Progress line** — slim bar: X of Y lessons done, with count of lessons unlocked and waiting.
4. **Next live session** — if the round has one upcoming: date/time in local timezone with a Join link 15 minutes before start, and Add to calendar otherwise.
5. **Just unlocked** — anything released since their last visit (drip lessons, new modules, new playlists attached to the round) with a small orange dot.
6. **Program materials row** — small tiles: Course, Audio, Video, Files — each opening the round's attached content.
7. **Support line** — one subtle link to Support Chat.

Only rows 1–3 always show; the rest appear when data exists.

## First-open welcome

The first time an enrolled user opens Path after enrolling, a one-time bottom sheet plays over it: "You're in — {program name}", how the program works (lessons unlock as you go, live sessions in your calendar), where to find things, and a Start learning button that scrolls to My Learning. Once per enrollment, never again.

## Technical notes

- New component `src/components/app/home/MyLearningSection.tsx` rendered inside `AppHome.tsx` above the shortcuts grid, gated on an active `course_enrollments` row; the shortcuts grid and the "+ Add" tile are hidden when the section shows.
- New hook `useStudentHome.ts`: nearest active enrollment, its round, attached course via `learn_course_rounds`, next unfinished lesson from existing lesson-progress data, next upcoming session, and items unlocked since a stored `last_seen_at` timestamp (localStorage per user).
- Drip/sequential rules reused from `makeLessonLocker` so "next lesson" always respects existing locking.
- Styling on Rilo tokens (`bg-gradient-orange`, `shadow-ios`, `active:` states, 16:9 covers), matching the Learn cards.
- No backend or access-control changes.

## Not included

No changes to purchasing, drip rules, or the planner itself. Non-enrolled users are untouched.
