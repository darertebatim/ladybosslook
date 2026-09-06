# Courses: admin builder + student player upgrade

Both sides work, but they are a first draft. Here is what is missing and what I would build.

## Admin (Courses page)

Current: one flat list, edit course in a dialog, expand to add modules and lessons, up/down arrows, delete. Cover image is a pasted URL, media is picked from a plain dropdown of every video/audio in the library, and there is no way to see how students are doing.

Changes:

1. **Course cover upload** — drag/drop or file picker with image upload to storage, plus live thumbnail preview, instead of pasting a URL.
2. **Media picker instead of dropdown** — reuse the existing searchable media library sheet (cover art, titles, search) for video / audio / reading lessons, so picking from hundreds of items is possible.
3. **Rich lesson description** — use the existing rich text editor (bold, lists, links, inline images) instead of a plain textarea, and show it in the app.
4. **PDF / file upload** — upload a PDF directly to storage instead of only accepting a link.
5. **Auto duration** — when a video or audio lesson is picked, pull its duration automatically instead of typing minutes.
6. **Drag-and-drop ordering** for modules and lessons (arrows stay as a fallback), and drag a lesson between modules.
7. **Course-level stats** — per course: number of students with access, average completion, count finished. Per lesson: how many students completed it (spot the lesson where people drop off).
8. **Students tab per course** — list enrolled students with their percentage and last activity, searchable.
9. **Course-level extras** — subtitle/short summary, estimated total length (auto-summed), language, and a "welcome / intro" note shown at the top of the course in the app.
10. **Lesson visibility controls** — publish/draft per lesson and per module, plus optional **drip**: unlock lesson on day N after enrolment or on a fixed date.
11. **Free preview flag** — mark a lesson as viewable without enrolment (for sales pages later).
12. **Duplicate course / duplicate module** — clone an entire structure for a new round.
13. **Preview as student** button that opens the app course page.
14. **Better list UI** — cover thumbnails, lesson/module counts, published state, linked rounds, search + filter, and a proper master/detail layout instead of stacked expanding cards.
15. **Safer deletes** — replace browser confirm popups with a proper confirm dialog that names what will be removed.

## Student side (Learn)

Current: a list of course cards, then a page whose header just says "Course", a player box on top, and a curriculum list.

Changes:

1. **Real course header** — course title, cover image, module/lesson counts, total length, and a resume line ("Lesson 4 of 18"). Today the header literally says "Course".
2. **Big Continue button** — one tap jumps to the next unfinished lesson from both the course list and the course page.
3. **Lesson detail as its own screen** — tapping a lesson opens a focused lesson view with previous/next navigation at the bottom, instead of swapping content in a box at the top of a long list.
4. **Video improvements** — resume from where they left off, auto-mark complete at ~90% watched, and show a watched bar on the thumbnail.
5. **Audio improvements** — queue the whole module so it keeps playing lesson to lesson in the mini player.
6. **Reading and PDF** — reading lessons open inline instead of jumping to a separate reader and losing the course context; PDFs get a download button too.
7. **Locked / drip states** — greyed lesson rows with a lock and "Unlocks in 3 days" when drip is on.
8. **Attachments per lesson** — optional downloadable worksheets under the lesson.
9. **Course completion celebration** — confetti sheet + a trophy when the last lesson is done, matching the existing celebration style.
10. **Empty and no-access states** — clearer message when a course has no lessons, and a "not enrolled" state rather than a blank screen.
11. **Notes** — a small personal note field per lesson (optional; say if you don't want it).
12. **Visual polish** — warm card styling everywhere, module accordions that remember their state, per-module progress rings, larger tap targets, and RTL-safe layout for Farsi.

## Technical notes

- New columns: `learn_courses` (subtitle, language, intro_note), `learn_modules` (is_published), `learn_lessons` (is_published, is_free_preview, drip_days, drip_date, attachments jsonb, content_html).
- New table `learn_lesson_attachments` if attachments should be their own rows instead of jsonb — I'd start with jsonb.
- Video resume reuses the existing `video_progress` table; audio reuses `audio_progress`.
- Admin stats read `learn_lesson_progress` joined against `course_enrollments` through `learn_course_rounds`.
- Media picking reuses `MediaLibraryPicker`; rich text reuses `RichTextEditor`; drag-and-drop reuses the project's existing dnd setup with touch sensors.
- New app route `/app/learn/:courseId/:lessonId` for the focused lesson screen.

## Suggested order

Phase 1 (biggest wins): course header + Continue button, media picker, cover upload, auto duration, per-course stats.
Phase 2: lesson screen with next/prev, video/audio resume + auto-complete, drag-and-drop ordering, students tab.
Phase 3: drip and locking, attachments, free preview, duplicate course, completion celebration.
