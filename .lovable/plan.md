
## Root causes (from logs + DB inspection on darertebatim@gmail.com)

- DB has only 2 memory items for the user: a stale "Uses Square" and "Getting more clients". None of the answers from Quick or Full onboarding were saved — even though `quick_onboarded_at` and `full_onboarded_at` are set.
- The unique index on `aperture_memory_items` is **partial** (`WHERE question_key IS NOT NULL`), but the client upserts with `onConflict: "user_id,bucket_slug,question_key"` without a `WHERE` predicate. PostgREST requires a matching full index, so every onboarding upsert silently fails. This is bug #1, #2, and #5 (the lingering "Uses Square" is from a previous test before we rewrote onboarding).

## Fixes

### 1. Memory writes (bug #1, #2, #5)
- Migration: drop the partial unique index, recreate it as a full unique index on `(user_id, bucket_slug, question_key)` so PostgREST upserts work. `bucket_slug` and `question_key` together with `user_id` are the conflict target.
- In `useApertureMemoryDB.saveBucketAnswer`: check the upsert's `error` and surface failures via toast instead of swallowing them.
- After the index fix, the "Uses Square" stale item will simply stay until the user deletes it; add a one-time cleanup so it isn't shown — actually leave the row; the user can delete from Memory. (No data delete in plan.)

### 2. Home prompts user to finish Full onboarding (bug #2)
- In `Home.tsx`: when `profile.quick_onboarded_at` is set but `profile.full_onboarded_at` is null, render a top banner card "Finish the full onboarding so I really get your business →" linking to `/aperture/app/onboard/full`.

### 3. Instagram lookup is smarter (bug #3)
- In `OnboardQuick.tsx` and the `aperture-onboarding-research` edge function: normalize Instagram input — strip `@`, strip URL prefixes, accept bare handles like `alilotfivip`, then construct `https://instagram.com/<handle>` before invoking research. Pass the normalized handle to the research function and store the normalized handle (with `@`) in `profile.instagram`.

### 4. Industry picker as two steps (bug #4)
- Rewrite the `industry` branch in `OnboardQuick.tsx` `QuestionInput`:
  - Step A: render group chips (distinct `group_label` from `aperture_industries`).
  - Step B: after a group is picked, render the industries inside that group as chips, plus a "← Change category" link.
- Same two-step picker in `Settings.tsx` profile card and any other place the industry picker appears.

### 5. Quick vs Full overlap (bug #6)
- The 8 Quick questions cover: owner_name, business_name, industry, how-long-running, team-size, revenue, revenue-mix, biggest-stuck. The Full flow re-asks: `full_q2_how_long`, `full_q3_people` / `full_q16_team`, `full_q5_revenue` / `full_q31_same_revenue`, `full_q8_revenue_source`, `full_q26_stuck`, `full_q27_question`.
- Migration: mark those 6 full questions as `is_active=false` (they're already covered by Quick) so the Full flow skips them. We keep deeper follow-ups (revenue feel, profit, raise prices, etc.).

### 6. Onboarding tap responsiveness (bug #7)
- In `OnboardQuick.tsx` and `OnboardFull.tsx`:
  - On the Next button, show inline spinner + label "Saving…" while `busy`.
  - Disable the question inputs while `busy` and run the multiple `saveBucketAnswer` writes in `Promise.all` instead of sequential `await` loops, which is currently O(n) round-trips per question (up to ~6 per click).
  - On choice chips, add `active:` scale/opacity feedback so taps feel immediate.

### 7. Chat composer hidden behind nav (bug #8)
- In `ChatThread.tsx` (mobile): the floating composer overlaps the fixed `MobileTabBar`. Add bottom padding to the chat scroll container equal to `calc(env(safe-area-inset-bottom) + 96px)` (tab bar height + composer height), and lift the composer to `bottom: calc(env(safe-area-inset-bottom) + 80px)` so it sits above the tab bar.
- Verify in mobile preview via Playwright screenshot.

## Files to change

- `supabase/migrations/<new>.sql` — drop+recreate unique index, deactivate 6 overlapping full-flow questions.
- `src/aperture/hooks/db/useApertureMemoryDB.ts` — error surface on upsert.
- `src/aperture/pages/real/Home.tsx` — "Finish full onboarding" banner.
- `src/aperture/pages/real/OnboardQuick.tsx` — instagram normalize, two-step industry, busy spinner, parallel writes, tap feedback.
- `src/aperture/pages/real/OnboardFull.tsx` — busy spinner, parallel writes, tap feedback.
- `src/aperture/pages/real/Settings.tsx` — two-step industry picker.
- `src/aperture/pages/real/ChatThread.tsx` — composer padding/position above tab bar.
- `supabase/functions/aperture-onboarding-research/index.ts` — accept bare Instagram handle.

## Verification

- Run quick onboarding as a fresh user, then read `aperture_memory_items` for that user_id and confirm all answers are present.
- Reload Home and confirm the "Finish full onboarding" banner appears.
- Type `alilotfivip` for Instagram → research function logs a successful fetch.
- Industry picker shows group chips first, then industries.
- Open Full onboarding and confirm the 6 redundant questions no longer appear.
- Mobile Playwright screenshot of `/aperture/app/chats/<id>`: composer sits above the tab bar, "Skip for now / I don't know" links visible above the tab bar, no overlap.
