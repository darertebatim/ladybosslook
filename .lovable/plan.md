## Goal
Convert every share action in the app from "→ App Store dead link" to "→ AppsFlyer OneLink" so:
1. Android friends can also install
2. We get per-surface analytics (which screens drive installs)
3. We add share buttons where they're currently missing (celebration moments + content pages)

**No referral system. No rewards. No new tables.** Just trackable links + a few new buttons.

---

## Step 1 — Add `buildShareOneLink` helper

**File:** `src/lib/appsflyer.ts`

Add a third helper next to the existing `buildInstructorOneLink` / `buildPackageOneLink`:

```ts
export function buildShareOneLink(
  source: string,           // e.g. 'routine_completion', 'audio_player', 'gold_streak'
  contentId?: string,       // optional: routine slug, audio id, story id
  contentTitle?: string,    // optional: human-readable title
): string {
  const params = new URLSearchParams({
    af_xp: 'custom',
    pid: 'user_share',
    c: source,
  });
  if (contentId) params.set('af_sub1', contentId);
  if (contentTitle) params.set('af_sub2', contentTitle.substring(0, 40));
  return `${ONELINK_BASE_URL}?${params.toString()}`;
}
```

`pid=user_share` keeps organic-user shares clearly separated from `instructor_referral` traffic in AppsFlyer dashboard.

---

## Step 2 — Update `useShareContent` hook to use OneLinks

**File:** `src/hooks/useShareContent.ts`

- Remove the hardcoded `APP_STORE_URL` constant.
- Add `source: string` and optional `contentId?: string` to `UseShareContentOptions`.
- Build the share URL via `buildShareOneLink(source, contentId, title)`.
- Add `logAppsFlyerEvent('af_share', { source, content_id: contentId })` call when share is triggered, so AppsFlyer can correlate share-intent → install.
- Everything else stays (image sharing, IG share, clipboard fallback).

---

## Step 3 — Update existing share call sites to pass a `source`

One-line update in each — just add the `source` prop. Suggested source names:

| File | source |
|---|---|
| `src/pages/app/AppAudioPlayer.tsx` | `audio_player` |
| `src/pages/app/AppPlaylistDetail.tsx` | `audio_playlist` |
| `src/pages/app/AppVideoPlaylistDetail.tsx` | `video_playlist` |
| `src/components/app/RoutinePlayerSummary.tsx` | `routine_summary` |
| `src/pages/app/AppJournalEntry.tsx` | `journal_entry` |
| `src/pages/app/AppReflectionNoteDetail.tsx` | `reflection_note` |
| `src/pages/app/AppFreeFormNoteDetail.tsx` | `free_note` |
| `src/pages/app/AppInspireDetail.tsx` | `inspire_story` |
| `src/pages/app/AppFeedPost.tsx` | `feed_post` |
| `src/pages/app/QuizPlay.tsx` | `quiz_result` |

---

## Step 4 — Refactor 2 components that currently bypass the hook

These call `@capacitor/share` directly with hardcoded App Store URLs. Switch them to `useShareContent`:

- `src/components/app/ChallengeCompleteSummary.tsx` → source `challenge_complete`
- `src/components/app/ProjectCompletionCelebration.tsx` → source `project_complete`

Removes duplicate share logic; gives them OneLink + image-share support too.

---

## Step 5 — Add share buttons to missing high-emotion moments (Tier A)

Small `Share2` icon button in each, wired to `useShareContent`:

### `src/components/app/RoutineCompletionCelebration.tsx`
The big ✓ screen shown right after a routine ends. Add a small "Share" pill below the title.
- source: `routine_completion`
- text: `Just finished my "${routineTitle}" routine on Rilo ✨`

### `src/components/app/GoldStreakCelebration.tsx`
Top-right share icon on the gold streak modal.
- source: `gold_streak`
- text: `🥇 Gold streak day on Rilo! Building my self-care routine.`

### `src/components/app/BadgeCelebration.tsx`
Share icon next to the badge.
- source: `badge_earned`
- text: `Just earned the "${badgeName}" badge on Rilo 🏆`

---

## Step 6 — Add share buttons to missing content pages (Tier B)

Header share icon (matches existing pattern in audio/playlist screens):

### `src/pages/app/AppReadDetail.tsx`
- source: `read_story`
- text: `Reading "${title}" on Rilo — loved this 📖`

### `src/pages/app/AppCourseDetail.tsx`
- source: `course_detail`
- text: `Check out "${courseName}" on Rilo`

### `src/pages/app/AppBreathe.tsx`
- source: `breathe_tool`
- text: `My favorite calm-down tool on Rilo 🌬️`

---

## Step 7 — Verify

1. Open any share button → confirm URL format is `https://ladyboss.onelink.me/lt6v?pid=user_share&c=<source>...`
2. Open URL on iOS → should resolve to App Store
3. Open URL on Android → should resolve to Play Store
4. Check AppsFlyer dashboard → `af_share` events grouped by `c` (source) should appear

---

## Files touched (~13 total)

**Modified:**
- `src/lib/appsflyer.ts` (add helper)
- `src/hooks/useShareContent.ts` (use OneLink + log event)
- 10 existing call sites (1-line `source` prop addition)
- 2 components that bypass the hook (refactor to use hook)

**Light additions to existing components:**
- `RoutineCompletionCelebration.tsx`, `GoldStreakCelebration.tsx`, `BadgeCelebration.tsx`
- `AppReadDetail.tsx`, `AppCourseDetail.tsx`, `AppBreathe.tsx`

**No new files. No DB changes. No new dependencies.**

---

## Out of scope (intentionally)

- ❌ Per-user referral codes / rewards / Plus trials → that's a separate feature
- ❌ Branded canvas-generated share cards → can be added later if you want
- ❌ Custom domain (`share.ladybosslook.com`) → onelink.me works fine for now
- ❌ New "Invite Friends" hub in Settings → separate decision

These can all be layered on later without touching this work.