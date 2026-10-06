# Stop popups from piling up when the app opens

## The problem

When the app opens, several popups can appear at once. In the screenshot, the streak sheet opened on top of the "New Update Available" popup, two dark backdrops stacked, and the screen stopped responding to taps.

Popups that can fire at startup or on Home today, each on its own timer:
- App update popup
- Push notification onboarding / returning-user push sheet / task push nudge
- Streak celebration (opened from **two** places: the global celebration host and Home celebrations)
- Badge, gold streak, challenge day celebrations
- Shield earned sheet
- Instructor invite / instructor welcome sheet
- Planner intro sheet, spotlight tour
- Language preference popup
- Soft review prompt (can also open from inside the streak sheet)

## The fix: one popup at a time, in a fixed order

### 1. A single "popup queue"
A shared gatekeeper that every automatic popup must ask before opening:
- Only **one** popup is visible at any moment.
- When it closes, the app waits **~1.2 seconds** before the next one may show.
- Nothing automatic appears in the first **~2.5 seconds** after launch (the screen settles first).
- Popups the user opens with a tap are unaffected.

### 2. Priority order (highest first)
1. App update (required updates only block; optional updates wait)
2. Celebrations from what the user just did (streak, then badge, gold streak, challenge day, shield)
3. Instructor invite / welcome
4. Push notification ask
5. Planner intro / spotlight tour
6. Language preference
7. Review prompt

If several want to show, the highest one goes first; the rest wait their turn.

### 3. Limits per session
- At most **2** automatic popups per app open; everything else waits for next time.
- Optional update popup: once per day.
- Review prompt never chains directly after a celebration.

### 4. Remove the duplicate streak sheet
The streak celebration is opened by both the global celebration host and the Home page. Keep one owner so it can never open twice.

### 5. Safety net against freezes
- If a popup reports open but never finishes opening, it releases its slot after a timeout.
- When any popup closes, leftover dark backdrops and the "page locked" state are cleared, so the screen is always tappable again.
- Returning to the app from the background does not replay popups already shown.

## Technical notes
- New `PopupQueueContext` (in `AppProvidersLayout`) exposing `useQueuedPopup(id, priority, wantsToShow)` → `{ canShow, done }`; queue state is in memory, with per-day and per-session caps in localStorage (`simora_popup_*`).
- Wire into: `AppUpdatePopup`, `PushNotificationOnboarding`, `ReturningUserPushSheet`, `TaskCompletionPushNudge`, `GlobalCelebrationHost` (streak/badge/gold/challenge), `ShieldEarnedSheet`, `InstructorInviteModal`, `InstructorWelcomeSheet`, `PlannerIntroSheet`, `HomeSpotlightIntro`, `LanguagePreferencePopup`, `SoftReviewPrompt`.
- Remove the `StreakCelebration` from `HomeCelebrations.tsx`, keeping `GlobalCelebrationHost` as the only owner.
- On close: clear `body` `pointer-events`/`overflow` styles left by Radix/vaul when a second overlay unmounts first.
- Admin AppTest previews bypass the queue.
