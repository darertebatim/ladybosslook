# Desktop Dashboard — full app on the web

Replace the outdated `/dashboard` page with a real desktop workspace that gives signed-in users everything the phone app has: My Programs, round pages, learn/courses, tools, chats and support — laid out for a big screen.

## Approach

Instead of rewriting every screen twice, the desktop dashboard reuses the same screens the app already uses, wrapped in a desktop shell (left sidebar + wide content area) instead of the phone's bottom tab bar. One codebase, two layouts.

```text
+------------------+--------------------------------------------+
|  Rilo            |  Welcome back, Ali                          |
|                  |  ------------------------------------------ |
|  Home            |  [Continue]  [Next session]  [Streak]        |
|  My Programs     |                                              |
|  Learn           |  My Programs                                 |
|  Tools           |  [ card ] [ card ] [ card ]                  |
|  Chats           |                                              |
|  Support         |  Upcoming sessions / recent activity         |
|  ---             |                                              |
|  Get the app QR  |                                              |
+------------------+--------------------------------------------+
```

## Phase 1 — Shell and Home

- Desktop shell at `/dashboard/*`: collapsible left sidebar (Home, My Programs, Learn, Tools, Chats, Support, Profile), top bar with user menu, wide centered content.
- New Home overview replacing the current empty stat cards: real numbers (enrolled programs, progress, streak), a "Continue where you left off" block, next live session with local time, and quick actions.
- Gentle "Get the Rilo app" card in the sidebar with the download button and a QR code (reusing the existing download dialog pieces).

## Phase 2 — My Programs and round pages

- `/dashboard/programs`: enrolled programs (active, upcoming, completed) as a responsive grid using the same enrollment data as the app, plus free/waitlist programs to browse.
- `/dashboard/programs/:slug/:roundId`: the full round page — sessions with dates in the user's timezone, join links, recordings, playlists, important messages, materials and content drip — rendered in a two-column desktop layout.

## Phase 3 — Learn (courses)

- `/dashboard/learn`: course cards with cover, lessons, duration, language, host, description sheet.
- Course and lesson pages with the video/audio/PDF/reading/link/session lesson types, sequential locking and progress, at desktop size.

## Phase 4 — Tools and community

- `/dashboard/tools`: hub of the app tools that make sense on desktop (planner, tasks, journal, reflections, breathe, focus timer, reading, listen, watch, quizzes).
- `/dashboard/chats`: channels and posts. Support chat stays at `/dashboard/chat` and gets folded into the same shell.
- Phone-only tools (period, water, protein, haptics-driven flows) stay reachable but show an "open in the app" hint.

## Design

Rilo orange theme, light/dark, generous desktop spacing, `shadow-ios` cards, no hover-dependent controls that break on touch laptops. Existing app components are reused so content and behaviour stay identical to the phone app.

## Technical notes

- New `DashboardLayout` with sidebar nav; app screens are rendered through a shared width/layout context so phone chrome (bottom nav, `PageHeader` back bar) is swapped for desktop chrome instead of duplicated.
- Routes nested under `/dashboard/*` inside `ProtectedRoute`, all lazy-loaded; sign-in redirects keep the exact desktop destination (already handled by `authRedirect`).
- Data comes from the existing hooks (`useCoursesData`, `usePrograms`, learn/lesson hooks) — no new tables or backend work expected.
- Old `Dashboard.tsx` content is removed; `/dashboard` becomes the new Home.

Phases ship in order so you can review each one before the next.
