# Friends + Dedicate-a-Moment — Phase 1 (Final Plan)

A single self-contained page at `/app/friends` that hosts everything: friend list, requests, dedications inbox, banners, and celebration sheets. **No menu entry, no Home banner, no other page touched.** This keeps the experiment fully isolated — easy to remove or graduate later.

---

## Scope locks (your confirmed answers)

1. Everything lives inside `/app/friends`. No bottom-tab change, no Home banner, no surfacing elsewhere. Users reach it via a direct link or a small entry we put in Profile/Settings later if needed.
2. Discovery = **friend code + share link only**. No username search.
3. **Daily send cap = 5 dedications/sender/day** (enforced server-side).
4. **Window to dedicate a moment = 72 hours** (configurable; can tighten to 24h later via a single constant — no migration).
5. Visual quality bar: this page must feel like a hero feature — gradient-rich, soft glass cards, fluent 3D emojis, tasteful motion. Same craft level as the redesigned Self-Care Quiz.

---

## What is a "Moment"?

A meaningful completed action worth giving away — not every tap. Phase 1 list:

| Source | Moment title example | Emoji |
|---|---|---|
| Breathe session completed | "3 min of Box Breathing" | 🧘 |
| Reflection submitted (free-form or guided) | "A reflection" | ✍️ |
| Audio track completed | "Listened to *Track Name*" | 🎧 |
| Routine round completed | "Finished Daily Reset" | 🌅 |
| Mood check-in submitted | "A mood check-in" | 💗 |

Excluded: individual tasks, water/fasting toggles, period logs, emotion logs (too noisy).

A moment is eligible for dedication for **72h** after creation; after that it disappears from the picker (but stays in the user's own history). A moment can be dedicated **only once**.

---

## The `/app/friends` page

One page, three vertically-stacked sections, all gorgeous:

### A. Hero header (always visible)
- Soft peach→lavender gradient strip, glow blobs, sparkle motes.
- "Friends" title + my friend code in a glass pill (tap = copy + haptic).
- Two big floating CTAs: **Add a Friend** · **Share Invite Link**.

### B. Pending banners (conditional, animated in)
Stacked at the top when present:
- **Incoming requests** — "Sara wants to be your friend" with Accept / Decline.
- **Unseen dedications** — "✨ Sara dedicated *3 min of Box Breathing* to you" — tap opens the celebration sheet.

These are the in-page "banners and popups" you asked for — no Home interference.

### C. Tabs (TabPills, animated knob)
- **Friends** — accepted friends as glass rows: avatar + name + last activity + "Dedicate" button. Empty state = illustrated.
- **Requests** — incoming + outgoing pending.
- **Received** — full sentimental archive of dedications you've gotten (no expiry on viewing).

---

## Dedicate flow (Phase 1 — pick from a list)

Triggered from any friend row → opens `DedicateMomentSheet`:

1. Header: "Dedicate a moment to **Sara** 💝"
2. Horizontal scrolling stack of glass cards = my last-72h moments (newest first). Each card: big fluent emoji, kind label, title, "x hours ago" + a subtle shimmering border to feel like a trophy.
3. Tap a card → it lifts and dims the others.
4. Optional 140-char message ("This one's for you…").
5. **Dedicate** button → haptic success + confetti burst + toast "Sent to Sara 💝", sheet closes.

Empty-list state: friendly illustration — "Finish a breathe, reflection, or routine to earn a moment to give."

---

## Receiver experience

- **Push notification** (existing PN edge function, new template `dedication_received`): "✨ Sara dedicated a moment to you" → deep link `/app/friends?dedication=:id`.
- **Inside `/app/friends`**: an unseen-dedication banner appears at the top (point B above). Tap → `DedicationReceivedSheet`: full-screen gradient, the moment card centered, sender's name + message, "Send one back" CTA which opens the dedicate flow with sender preselected.
- A small red dot on the Received tab indicates unseen items.
- Dedications are stored forever; only the *eligibility window for sending* is 72h.

---

## Database (migration)

### `profiles` — add column
- `friend_code TEXT UNIQUE` — 8 chars, alphanumeric, no `0/O/1/I/L`. Backfilled for existing users + auto-generated for new users via the existing `handle_new_user` trigger.

### `friendships`
- `id`, `requester_id`, `addressee_id`, `status` (`pending` | `accepted` | `declined` | `blocked`), `created_at`, `accepted_at`.
- Unique expression index on `(LEAST(requester, addressee), GREATEST(requester, addressee))` to prevent dup pairs.
- RLS: each user sees rows where they're requester or addressee; requester inserts; addressee updates status.

### `user_moments`
- `id`, `user_id`, `kind` (`breathe` | `reflection` | `audio` | `routine` | `mood`), `title`, `emoji`, `payload jsonb`, `created_at`, `expires_at` (= created_at + 72h), `dedicated_at` (nullable).
- Idempotency: partial unique index on `(user_id, kind, payload->>'ref_id')` for the last 5 min — prevents double-writes from React strict mode / retries.
- RLS: owner full access; recipient can SELECT only via `dedications` join.

### `dedications`
- `id`, `moment_id`, `sender_id`, `recipient_id`, `message TEXT (≤140)`, `created_at`, `seen_at`.
- Validation trigger (NOT a CHECK — per project rule): moment must belong to sender, not be expired, not already dedicated; recipient must be an accepted friend; sender ≤ 5 dedications today.
- RLS: sender and recipient SELECT; sender INSERT.

### `friend_invite_clicks` (lightweight)
- For later analytics; just `code`, `clicked_at`, `installed_user_id`. Out-of-scope for v1 UI but the table is cheap to create now.

---

## Backend touches

- **`recordMoment(kind, title, emoji, payload)`** helper in `src/lib/moments.ts`, called from existing completion points (no behavior change):
  - `BreathingCompleteSheet` (on open)
  - reflections save mutation
  - audio progress when `completed` flips true
  - routine round completion celebration
  - mood check-in submit
- **Push notification**: extend existing `send-push` edge function with new template `dedication_received`. Daily cap is enforced in the insert path of `dedications` (a `RAISE EXCEPTION` from a trigger).

---

## Frontend files (new)

```
src/pages/app/AppFriends.tsx
src/components/friends/
  FriendsHero.tsx
  PendingBanners.tsx
  FriendsTab.tsx
  RequestsTab.tsx
  ReceivedTab.tsx
  AddFriendSheet.tsx           ← paste code or share link
  DedicateMomentSheet.tsx
  DedicationReceivedSheet.tsx
  MomentCard.tsx               ← reusable, gorgeous
src/hooks/
  useFriends.ts
  useMoments.ts
  useDedications.ts
src/lib/moments.ts             ← recordMoment helper
```

Route added in the app router. **No nav entry, no Home banner.**

---

## Visual craft commitments

- Soft per-section gradients (peach → lavender → mint) with `AmbientGlow` blobs.
- Glass cards: `bg-card-warm/60 backdrop-blur-2xl`, `shadow-ios`, no rings.
- Fluent 3D emoji at 56–72px in moment cards.
- Confetti burst + haptic on send.
- Spring entrance for banners (`framer-motion` already in project).
- Empty states are illustrated, never plain text.
- Honors all project rules: no `hover:`, `shadow-ios` for floats, solid text on gradients, `getLocalDateStr()` for the 72h window, `useGoBack()` on sheets.

---

## i18n

EN + FA written manually (Rilo standard). Other locales auto-translated per the project's i18n strategy.

---

## Out of scope for Phase 1

- Pre-install landing page / deferred deep link onboarding (Phase 2, when we validate the loop works friend-to-friend).
- "Dedicate right after finishing" inline screen (Phase 2 — gated on Phase 1 engagement).
- Username search, group friends, vibes/gifts beyond moments.

---

Ready to ship when you approve. First step after approval: write the migration (4 tables + trigger + RLS), wait for your confirmation, then build the page + sheets + `recordMoment` wiring.
