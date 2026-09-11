# A student-first first impression

## The problem

Someone buys a program, downloads Rilo, and the first thing they see is the Planner (Path) — tasks, streaks, mood, protein tracking. Their program is buried behind a small "My Programs" shortcut. The product they paid for is not the product they land on.

## The idea: the app greets you as a student

If a person is enrolled in at least one program, the app opens on a **My Learning** home built around their course. The self-care Path stays exactly as it is — it just isn't the front door for buyers anymore. People with no program keep the current Path home, unchanged.

## What the new home looks like

Top to bottom, one clear focus per block:

1. **Welcome strip** — "Welcome, {name}" plus their program name and round, with a live countdown when a session is coming up.
2. **Continue where you left off** — one big card: the next unfinished lesson, its cover, the module it belongs to, and a full-width orange Continue button. If they haven't started, it reads "Start Lesson 1".
3. **Your progress** — a slim bar: lessons done / total, plus how many are unlocked and waiting.
4. **Next live session** — the existing card, with an Add to calendar action and a Join button that lights up 15 minutes before start.
5. **Just unlocked** — anything released since their last visit (drip lessons, new modules, new playlists attached to the round), with a small dot on new items.
6. **Your program materials** — a short row: course, audio playlist, video playlist, files, all as tappable tiles.
7. **Need help?** — one line to Support Chat.
8. **Explore Rilo** — a single soft card at the bottom pointing to the Path, tools and player, so buyers discover the rest of the app without it competing with their course.

## First-open moment

The very first time an enrolled user opens the app, a short 3-screen welcome plays before the home:
"You're in — {program name}" → "Here's how your program works: lessons unlock as you go, live sessions are in your calendar" → "Where to find things" with a Start learning button. Once only, never again.

## Navigation

The bottom bar's first tab becomes **Learn** for enrolled users (the graduation cap), pointing at this new home. Path moves into the tab set as a normal item. Non-enrolled users see today's bar unchanged.

## Technical notes

- New page `src/pages/app/AppStudentHome.tsx` at `/app/learning`; `src/App.tsx` post-auth resolver sends users with an active `course_enrollments` row there instead of `/app/path`.
- New hook `useStudentHome.ts`: nearest active enrollment, its round, attached course via `learn_course_rounds`, next unfinished lesson from existing lesson-progress data, next upcoming session, and items unlocked since a stored `last_seen_at` timestamp.
- Reuse existing pieces rather than rebuild: `EnrolledProgramCard` header gradient, the Next Live Session card from `AppPrograms.tsx`, and lesson-lock logic from `makeLessonLocker` (drip and sequential rules apply unchanged).
- Bottom nav in `NativeAppLayout` gains a conditional first destination based on enrollment state.
- Styling stays on Rilo tokens (`bg-gradient-orange`, `shadow-ios`, `active:` states, 16:9 covers) so it matches the Learn cards you already like.
- No backend or access-control changes; this is a presentation layer over data that already exists.

## Not included

No changes to purchasing, drip rules, or the Path/planner itself.
