# My Learning — fix links, self-paced support, match the mockup

The section on Path works but three things are off: the look doesn't match the approved mockup, the buttons go to the wrong places, and self-paced programs (no live sessions) aren't handled.

## 1. Buttons go where they should

Today "Next live session" and "Course" both open the program round page, and "Audio" opens the whole player library.

New behaviour:
- Next live session -> the round page (correct), plus a small "Add to calendar" action as in the mockup.
- Course -> the course page for this round's course; if there is no course, the tile is hidden instead of falling back to the round page.
- Audio -> if the round has exactly one audio playlist, open that playlist directly; if several, open the round page's materials; never the generic player.
- Video -> same rule with the round's video playlists.
- Continue lesson -> unchanged (opens the lesson, back goes to the round).
- Files tile appears only when the round/course actually has downloadable documents.

## 2. Self-paced programs

When the round is self-paced (or has no upcoming session):
- Replace the "Next live session" row with a "Started <date>" / "Learn at your own pace" row using the learner's enrolment date, matching how the round page already shows it.
- If the round has a course, the continue-lesson block stays the hero.
- If the round has no course but has playlists, the hero becomes "Continue listening / watching" pointing at the next unfinished item in that playlist, so audio-only self-paced programs still get a real primary action.
- Progress falls back to playlist completion when there are no lessons.

## 3. Visual pass to match the mockup

- Card: soft peach-to-white gradient, warm border, soft orange shadow (mockup styling, using existing Rilo tokens).
- Primary button: orange gradient with the warm shadow, not the flat solid used now.
- Material tiles: rounded, distinct soft backgrounds (peach / lavender / pink / yellow) with colored icons and bold labels, in one row.
- Add the "Just unlocked" strip from the mockup (mint) listing newly unlocked lessons/playlists when there are any.
- Tighter spacing so the whole card fits without scrolling on a phone.

## Technical notes

- `src/hooks/useMyLearning.ts`: return the actual playlist rows (id + type + title) instead of counts, expose `isSelfPaced`, enrolment date, document count, and a playlist-based fallback for `nextItem`/progress.
- `src/components/app/MyLearningCard.tsx`: rewrite presentation with Rilo semantic tokens (`bg-gradient-orange`, `bg-card-warm`, `shadow-ios`, peach/lavender chips), route to `/app/player/playlist/:id` and `/app/watch/playlist/:id` for single-playlist cases, hide tiles with nothing behind them.
- No schema changes; drip/sequential locking logic stays as-is.
