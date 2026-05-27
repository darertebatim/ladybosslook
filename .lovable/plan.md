## Goal

Today's streak celebrations (first-action, Silver/Almost-Gold/Gold badge, 7-day Gold streak, challenge-day shield) only fire while you're physically on the Home/planner page. If you complete a task from My Rilo and never return to Home that day, you miss them.

Goal: make those celebrations **page-agnostic + deferred**. They queue up when triggered from anywhere, and pop the next time you land on either **/app/home** or **/app/my-rilo** — whichever comes first.

## How it works

The current hooks use in-memory refs (`prevCompletedRef`) to detect "new completion just happened." That dies on unmount. Replace that with **persisted-state detection**: compare today's live data against a localStorage snapshot of "last-seen data." Triggers become idempotent — refresh, navigation, app reopen all behave the same.

## Architecture

```text
AppProvidersLayout
  └─ <GlobalCelebrationHost />        ← new, mounted once
        ├─ subscribes to: weeklyCompletion, goldStreak, challenges
        ├─ detects new triggers (vs localStorage snapshot)
        ├─ writes pending celebration → state
        └─ when pathname ∈ {/app/home, /app/my-rilo}:
              render the modal
              save "celebrated" flag → never replays
```

AppHome keeps its existing modal mounts for now (they share the same localStorage flags, so the global one writes the flag → AppHome's instance silently skips). No risk of double-fire.

## Scope of celebrations included

1. **First-action streak** (`StreakCelebration` with `isFirstAction=true`) — fires when `totalCompletions` goes from 0 → ≥1
2. **Badge level-ups** (`BadgeCelebration` — Silver, Almost-Gold, Gold) — fires when today's badge tier increases
3. **Gold streak milestone** (`GoldStreakCelebration`) — fires when consecutive gold days hits a milestone (1, 7, 30…)
4. **Challenge day shield** (`ChallengeDayCelebration`) — fires when a challenge-day's required task is completed

NOT included (out of scope, keep on Home only): paywall, task detail, push onboarding, step/project completion, routine-ended sheet. Those are Home-feature-specific.

## Files

**New**
- `src/hooks/useGlobalCelebrationQueue.tsx` — central queue + persisted-state detection
- `src/components/app/GlobalCelebrationHost.tsx` — mounts the 4 modals, gates by pathname

**Edited**
- `src/layouts/AppProvidersLayout.tsx` — mount `<GlobalCelebrationHost />` once
- `src/hooks/useBadgeCelebration.tsx` — add a second mode that detects via persisted snapshot (keep old in-memory mode for backwards compat with Home)
- `src/hooks/useChallengeDayCelebration.tsx` — same
- (Streak + gold streak triggers are simple enough to write directly inside the global hook)

## Behavior verification

- Complete mood check-in from My Rilo → navigate to 3 other tools → return to My Rilo → 🎉 modal fires.
- Same scenario but return to Home first → modal fires there. Coming back to My Rilo afterwards → no replay.
- Already on Home when completion happens → fires immediately (existing path unchanged).
- Reload mid-pending → still fires on next Home/My Rilo visit (persisted).
- Same day, second qualifying event (e.g. first-action already done, now Silver badge unlocks) → queued + shown independently.

## Risk

- The 4 celebration modals are still mounted in `HomeCelebrations.tsx`. They use the same localStorage flags, so once the global host shows one and writes the flag, Home's instance reads it and skips on its next data update. Verified by inspecting `getCelebratedLevels()` in `useBadgeCelebration` and the equivalent keys in the others.
- Estimated touch: ~3 new files, 3 edits, no migrations.
