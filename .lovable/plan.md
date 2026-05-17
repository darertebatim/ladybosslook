
# Care Package — v2 spec

Goal: turn a finished "moment" into a beautiful, personal gift the user can send to **anyone** (friend in-app OR a non-user via a shareable link). Non-user opens a public landing page → installs Rilo → dedication auto-claims → both become friends.

All authenticated UI stays inside `/app/friends`. The only new top-level route is the public landing page `/d/:token`, which is unavoidable — non-users can't be sent into `/app/*`. No menu entries, no Home banner.

---

## 1. Scope locks

- One authenticated surface: `/app/friends` (hero, tabs, sheets, banners, history).
- One public surface: `/d/:token` (landing page for non-users; SEO + OG image).
- No friend discovery / search. Add friends by code OR by sending them a Care Package.
- Window to dedicate a moment = **72h**.
- A moment can be dedicated **once**.

---

## 2. What's in a Care Package

| Layer | Required | Notes |
|---|---|---|
| The Moment | yes | breathe / reflection / audio / routine / mood from last 72h |
| Sender note | optional, ≤140 chars | freeform |
| Recipient hint | optional, ≤40 chars | "for Sara", "for mom" — shown on landing page so it feels personal |
| Sticker | v2.1 (out of scope now) | reserve `payload.sticker` for later |

---

## 3. Send flow (inside `/app/friends`)

`DedicateMomentSheet` gets a second step:

1. Pick a moment (existing UI).
2. **Choose recipient** — segmented control:
   - **A friend** → list of accepted friends, pick one → submit (existing path, `recipient_id` filled).
   - **Someone not on Rilo yet** → text input for recipient first name (optional) → submit creates a `dedications` row with `recipient_token` (16-char base32, unguessable), `recipient_id NULL`.
3. After submit for the link path → open `ShareCarePackageSheet`:
   - Big preview card (gradient + moment emoji + "for {name}").
   - Pre-filled message per channel:
     - WhatsApp / SMS / iMessage / Telegram → "I dedicated *3 min of Box Breathing* to you on Rilo 💝 — open it: https://ladybosslook.com/d/TOKEN"
     - Copy link
     - Native share sheet (`@capacitor/share`) on iOS/Android
   - Buttons stay until user closes (link is reusable until claimed).

---

## 4. Public landing page `/d/:token`

Single route, **no auth required**, SSR-ish meta via `react-helmet-async` + a static OG image from an edge function.

Layout (mobile-first, 390px):
- Soft peach→lavender gradient hero, AmbientGlow blobs, subtle sparkle motes (Framer Motion).
- Sender block: 64px avatar + first name → *"dedicated a moment to you"*.
- Moment card center stage: 88px fluent 3D emoji, kind label, title, "x hours ago".
- Optional handwritten-style note in a glass card.
- Single CTA: **"Open your Care Package"**
  - On native browser → smart router:
    - iOS Safari → App Store link (with token in `?dedication=TOKEN` via universal-link if app installed, else App Store).
    - Android Chrome → Play Store with referrer carrying token.
    - Desktop / other → "Continue on web" → `/auth?dedication=TOKEN`.
- Secondary muted line: *"Already have Rilo? Open the app."*
- Footer: tiny Rilo wordmark + "Rilo — your gentle daily reset".

Already-claimed state: still renders, but CTA becomes *"Open in Rilo"* (no claim attempt).
Expired state (token >30 days unclaimed): graceful "This Care Package has expired — ask {name} to send a new one."

---

## 5. OG image (`/og/dedication/:token.png`)

Supabase edge function `og-dedication` returns a 1200×630 PNG.
- Implementation: Deno + `@vercel/og` (works in Deno via `npm:` specifier) or `satori` + `resvg-js` for full control.
- Background: peach→lavender gradient, soft blobs.
- Text: "{Sender first name} dedicated a moment to you" + moment emoji + title.
- Cached aggressively: `Cache-Control: public, max-age=86400, s-maxage=86400`.
- Referenced from `/d/:token` via `<meta property="og:image">` (Helmet).

WhatsApp / iMessage / Slack / Twitter / LinkedIn all read this — without it the link looks like spam.

---

## 6. Attribution (token survives install)

Three layers, fallback chain:

1. **Native installed** → universal link `ladybosslook.com/d/TOKEN` opens the app (AASA already covers `/app/*`; we add `/d/*`). App reads token from launch URL, stores in `pendingDedicationToken` localStorage, claims after signup.
2. **App not installed, store install** → AppsFlyer OneLink carries `?token=TOKEN` deferred deep link. AppsFlyer SDK callback on first open writes `pendingDedicationToken`. (We already integrate AppsFlyer per memory.)
3. **Web signup** → `/auth?dedication=TOKEN` writes `pendingDedicationToken` to localStorage before redirect to OAuth, claims on first authenticated app load.

Claim runs in `useDeepLinks` or a tiny `useClaimPendingDedication` hook mounted in `AppProvidersLayout`:
- Call `claim_dedication(token)` RPC.
- On success: clear localStorage, invalidate queries, navigate to `/app/friends?dedication={id}` which auto-opens `DedicationReceivedSheet` and surfaces the new friendship banner.

---

## 7. Database changes (migration #2)

```sql
-- dedications: open up for non-user sends
ALTER TABLE public.dedications
  ALTER COLUMN recipient_id DROP NOT NULL,
  ADD COLUMN recipient_token TEXT UNIQUE,
  ADD COLUMN recipient_hint TEXT,
  ADD COLUMN claimed_at TIMESTAMPTZ,
  ADD COLUMN claimed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN expires_token_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + interval '30 days') STORED;

-- exactly one of recipient_id / recipient_token must be set at insert time
-- (enforced in validate_dedication trigger, not CHECK — per project rule)
```

`validate_dedication` updated:
- Accept either `recipient_id` (must be accepted friend, existing rule) OR `recipient_token` (must be non-null, ≥16 chars).
- Sender daily cap raised to **8/day total**, of which **≤5 token-shares/day** (anti-abuse).
- Moment ownership / expiry / single-dedication checks unchanged.

New RLS:
- `SELECT` allowed if `auth.uid() = sender_id OR auth.uid() = recipient_id OR auth.uid() = claimed_by_user_id`.
- **Public read by token**: a `SECURITY DEFINER` function `get_dedication_by_token(t TEXT)` returns a minimal projection (sender first name + avatar + moment kind/title/emoji + created_at + note + claimed flag). The landing page calls this anon — no direct table SELECT for anon.
- **Claim**: `SECURITY DEFINER` function `claim_dedication(t TEXT)`:
  - requires `auth.uid()`.
  - rejects if already claimed or expired.
  - sets `recipient_id = auth.uid()`, `claimed_at = now()`, `claimed_by_user_id = auth.uid()`.
  - upserts an accepted `friendships` row between sender and claimer.
  - inserts a notification row for the sender (push trigger handles delivery).

Indexes:
- `CREATE UNIQUE INDEX dedications_recipient_token_idx ON dedications(recipient_token) WHERE recipient_token IS NOT NULL;`
- `CREATE INDEX dedications_claim_lookup ON dedications(recipient_token) WHERE claimed_at IS NULL;`

---

## 8. Anti-abuse

- **Per-sender caps**: 8 dedications/day total, 5 of those token-shares (trigger-enforced).
- **Token entropy**: 16 base32 chars (~80 bits) — unguessable.
- **Token expiry**: unclaimed tokens expire 30 days after creation; expired tokens render a graceful state, can't be claimed.
- **Self-claim block**: `claim_dedication` rejects when `auth.uid() = sender_id`.
- **Re-claim block**: single-use; second claim attempt returns "already claimed".
- **Public projection only**: anon never sees sender email, last name, user_id, or any other PII.
- **Rate-limit on claim RPC**: 10 attempts / minute / IP via a simple `claim_attempts` table; deflects token brute force.
- **Reporting**: claim sheet shows "Report" link → flags `dedications.reported_at`; admins can purge.

---

## 9. Push notifications (extend existing `send-push`)

| Trigger | Template | Recipient | Deep link |
|---|---|---|---|
| `dedications` INSERT with `recipient_id` set | `dedication_received` | recipient | `/app/friends?dedication={id}` |
| `claim_dedication` success | `dedication_claimed` | sender | `/app/friends?friend={claimer_id}` |

Both already fit the existing PN architecture per [Push Notifications](mem://push-notifications/hybrid-strategy-and-plans).

---

## 10. Frontend file plan

New:
```
src/pages/PublicDedication.tsx              ← /d/:token route
src/components/friends/ShareCarePackageSheet.tsx
src/components/friends/RecipientPickerStep.tsx
src/hooks/useClaimPendingDedication.ts      ← mounted in AppProvidersLayout
src/hooks/usePublicDedication.ts            ← anon RPC fetch by token
src/lib/dedicationShare.ts                  ← per-channel share text + native share bridge
supabase/functions/og-dedication/index.ts   ← OG PNG renderer
```

Edited:
```
src/App.tsx                                 ← add /d/:token public route
src/components/friends/DedicateMomentSheet.tsx  ← 2-step: pick moment → pick recipient (friend | link)
src/hooks/useDedications.ts                 ← add createTokenDedication, claim mutation
src/layouts/AppProvidersLayout.tsx          ← mount useClaimPendingDedication
src/hooks/useDeepLinks.tsx                  ← handle /d/:token launch URL
public/.well-known/apple-app-site-association  ← add /d/* path
```

---

## 11. i18n

EN + FA manual for: landing page copy, share-sheet titles, claim toast, recipient picker. Other locales auto-translate per project i18n strategy.

---

## 12. Out of scope (defer)

- Stickers / extra in-package gifts.
- "Send back" after claim (will naturally exist once they're friends).
- Group Care Packages (multiple recipients).
- In-app discovery of other Rilo users.
- Pre-install web onboarding flow tweaks.

---

## 13. Ship order

1. **Migration #2** (schema + trigger update + RPCs + RLS). Wait for approval.
2. **`/d/:token` landing page** + `usePublicDedication` (renders even with no auth).
3. **OG edge function** + Helmet wiring on the landing page.
4. **`DedicateMomentSheet` v2** with recipient picker + `ShareCarePackageSheet`.
5. **Claim flow**: `useClaimPendingDedication` + deep link handling + AppsFlyer deferred param.
6. **Push templates** added to `send-push`.
7. **Anti-abuse**: claim rate-limit table + report action.
8. QA loop end-to-end on web first (easiest), then native.

Ready to proceed with step 1 (migration) on your approval.
