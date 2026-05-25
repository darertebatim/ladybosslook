
# My Rilo — Path (v3): how it would actually work

The mock at `/admin/brand/mock` is a static picture. To turn it into a real screen, we need three things working together: a **path engine** (the brain that decides today's steps), a **path screen** (renders those steps as a live timeline), and **step actions** (Start / Swap / Snooze / Skip + completion).

I'd ship it in 4 phases so you can use it after Phase 1 instead of waiting for everything.

---

## How the Path engine works (the brain)

Every time the user opens the screen, a `useTodayPath()` hook assembles **5–8 steps** for today by pulling from real data, deduping against what's already done, and ordering them by time-of-day buckets (Morning · Right now · Later).

**Source pool** (each source produces zero, one, or more candidates):

| Source | Pulled from | Becomes a step when… |
|---|---|---|
| Mood check-in | `mood_logs` for today | No log yet today |
| Breath | `useBreathingExercises` | Always (1 short pattern) |
| Rilo's pick | Self-Care Quiz top categories → matched task / playlist / story | Quiz has been taken |
| User routines | `user_routines_bank` where `is_active` | One step per active routine, with live "X of Y done" |
| Community | Joined chats with unread posts | At least 1 unread |
| Playlist | Last-played or recommended track | A track exists & isn't done today |
| End-of-path reward | streak service | Always (last item) |

**Picker rules:**
- Time-bucket assignment is implicit: anything completed before now → Morning · done. First non-done → Right now (active hero). Everything after → Later.
- Dedupe: never include a step whose underlying action is already completed today (mood logged, routine 100% done, etc.).
- Cap: max 8 steps. If too many candidates, drop community/playlist first.
- Deterministic per (userId, date) so it doesn't reshuffle on refresh.

**Active card promotion:** the first non-done step gets the big peach hero card with Start / Swap / Snooze / Skip. All others render as the compact `PathStep` row from the mock.

---

## How the Path screen works

New route `/app/my-rilo` rendered by a new `AppMyRiloPath.tsx`:

```text
┌─────────────────────────────┐
│ Header: My Rilo  · streak 🔥│
│ "Your path for today"       │
│ 6 steps · ~22 min · 2/6 ▰▰░░│
├─────────────────────────────┤
│ ☀️ Morning · done           │
│  ●─ 💛 Mood: Calm  ✓        │
│  ●─ 🌬️ 2-min breath ✓       │
│ ✨ Right now                │
│  ▶ [HERO ACTIVE CARD]       │
│      Start · Swap · Snooze  │
│ 🌙 Later today              │
│  ○─ 🔥 My Rilo Self Care    │
│  ○─ 🤱 New Mom routine      │
│  ○─ 💬 Community check-in   │
│  ◌─ 🏆 +1 streak reward     │
├─────────────────────────────┤
│ [Ask Rilo to change path…]  │
└─────────────────────────────┘
```

Completing a step (via Start → child screen → done) refetches the path; the hero promotes to the next pending step automatically.

---

## How step actions work

- **Start** — navigates into the existing screen for that step (mood check-in, breath player, routine player, playlist track, community chat, quiz pick page). Already built — we just wire links.
- **Skip** — marks the step `dismissed_today` in a new tiny `path_dismissals` table. Won't show again today.
- **Snooze 15m** — pushes the step to Later bucket and sets `snoozed_until` timestamp. Hero promotes to the next step in the meantime.
- **Swap** — opens a sheet with 2–3 alternate candidates from the same source (e.g. swap "Quiet inner critic" for another quiz pick).

For Phase 1 we only build **Start + Skip**. Swap/Snooze come in Phase 3.

---

## Phasing

**Phase 1 — Build it as a sibling page (ship-able, low blast radius)**
- New route `/app/my-rilo` (existing Home tab unchanged)
- `useTodayPath()` engine with: mood, breath, user routines, quiz pick, community, end-of-path reward
- Time-bucket grouping, active hero, compact rows
- Start + Skip actions only
- `path_dismissals` table for Skip
- Day 1 detection → renders the 3-step starter path (Quiz hero → breath → pick routine)
- Empty/no-quiz/no-routine fallback path
- Static "Ask Rilo…" pill (no AI yet, just visual)
- Add temp entry in the Hub menu so you can open it to test

**Phase 2 — Navigation swap**
- Bottom tab: "Home" becomes "My Rilo" pointing to `/app/my-rilo`
- Existing planner moves to its own "Planner" tab
- Update deep links, redirects from `/app/home`, and any code that assumes Home === Planner

**Phase 3 — Full actions**
- Swap (alternate-candidates sheet)
- Snooze 15m (snoozed_until logic)
- "Skip-tomorrow" memory so dismissed picks don't reappear next day

**Phase 4 — "Ask Rilo to change your path"**
- Lovable AI Gateway edge function (Gemini 2.5 Pro) with tools to insert/remove/swap path steps
- Free-text input mutates today's path live

---

## Technical details

**New files (Phase 1):**
- `src/pages/app/AppMyRiloPath.tsx` — the page (copy structure from the v3 mock)
- `src/hooks/useTodayPath.tsx` — engine + React Query cache
- `src/lib/pathEngine.ts` — pure picker (testable, no React)
- `src/components/path/PathStep.tsx` — extracted from mock
- `src/components/path/PathActiveHero.tsx` — extracted from mock
- `src/components/path/PathHeader.tsx` — title + progress dots
- `src/components/path/PathRewardCard.tsx` — end reward
- One new migration: `path_dismissals (user_id, date, step_kind, step_ref, dismissed_at)` with RLS

**Reused (no changes):**
- `useMoodLogs`, `useBreathingExercises`, `useUserChallenges`, `usePrograms`, `useMyRecentMoments`, `usePlaylistRoutine`, `useAudioRoutine`, `useTodayProLinkCompletions`, `getOrCreateMyRilo`, `useSelfCareBalance`
- `ZStackContext`, `getLocalDateStr()`, `useGoBack()`, `shadow-ios`, orange tokens

**Performance:** all source queries run in parallel via React Query; the picker is sync. Cached per (userId, date). Refetch on completion via query invalidation, not polling.

**What's NOT changing in Phase 1:** Home tab, Planner, routes from any other page. The mock stays at `/admin/brand/mock` for reference.

---

## Open decisions before I start

I need 2 answers (I'll ask via choice questions right after you approve this plan):

1. Phasing — Phase 1 only (recommended), Phase 1+2, or all phases in one push?
2. Fallback path for new users with no routines & no quiz — Day 1 flow, generic 3-step, or hybrid with quiz banner?
