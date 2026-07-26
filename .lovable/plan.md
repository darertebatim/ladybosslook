# Program Enrollment Email

Send a branded confirmation email whenever a user enrolls in a program — free, Stripe paid, RevenueCat, or admin-created. If the program has an auto-enroll round, include the round details. Include an onelink to download the app and a universal link to open the program inside the app.

## What the email contains

- Subject: `You're enrolled in {program title} 🎉` (Farsi variant when program language is `fa`)
- Header with Rilo/Ladybosslook branding + orange theme
- Greeting with user's name
- Program block: cover image, title, host, language, short description
- **Round details block** (only if an auto-enroll round or specific round is attached):
  - Round name / number
  - Start date + first session date (formatted in user's timezone if available; else PT with `PT` label)
  - End date / duration
  - Google Meet link (button)
  - Google Drive link (if any)
  - WhatsApp support number (if any)
  - Important message (if any)
- **Access buttons**:
  - "Open in app" → universal link `https://ladybosslook.com/app/programs/{slug}` (AASA already covers `/app/*`)
  - "Download the app" → AppsFlyer OneLink (new secret `APPSFLYER_ONELINK_URL`, fallback to App Store + Play Store buttons if not set)
  - "View on web" → `https://ladybosslook.com/programs/{slug}`
- Order summary line (amount, currency, payment type) — omitted for $0/free
- Support footer: `hi@ladybosslook.com`, unsubscribe/legal links, copyright

Bilingual: English by default; Farsi (RTL) template variant used when `program_catalog.language = 'fa'`. Layout mirrors the existing `/sixtraps` confirmation styling for consistency.

## Where it gets sent from

New edge function `send-enrollment-confirmation` that:
1. Accepts `{ user_id, program_slug, round_id? , order_id? }`
2. Loads user email/name from `auth.users` + `profiles`
3. Loads `program_catalog` row
4. Resolves round: use passed `round_id`, else look up `program_auto_enrollment.round_id` for the slug, else the next upcoming `program_rounds` row
5. Renders HTML (inline template, no React Email dependency — keep it self-contained like `send-sixtraps-confirmation`)
6. Sends via Resend using existing `RESEND_API_KEY` from `hi@ladybosslook.com`
7. Logs to `email_logs` (already exists) with type `program_enrollment` for idempotency — skip if a row with same `user_id + program_slug + type` exists

## Wiring into existing flows

Call the new function (fire-and-forget, non-blocking) from:
- `supabase/functions/enroll-free-programs/index.ts` — after `enrollFreeProgram`
- `supabase/functions/stripe-webhook/index.ts` — right after `sendPurchaseWelcomeMessage` for each enrolled slug
- `supabase/functions/revenuecat-webhook/index.ts` — same spot
- `supabase/functions/admin-create-enrollment/index.ts` — same spot

Reuse the same `sendPurchaseWelcomeMessage` pattern (try/catch, log-and-continue) so email failures never break enrollment.

Skip sending for the `simora-plus` / `simora-plus-annual` subscription slugs (those already get the Plus welcome chat message and aren't program enrollments).

## Technical notes

- New file: `supabase/functions/send-enrollment-confirmation/index.ts` (JWT-verified for direct calls; internal calls use service role via `supabase.functions.invoke`)
- New shared helper: `supabase/functions/_shared/send-enrollment-email.ts` — thin wrapper the four enrollment functions call, mirroring `send-purchase-welcome.ts`
- Uses existing `RESEND_API_KEY`; will request `APPSFLYER_ONELINK_URL` secret via `add_secret` if you want the download CTA to use OneLink (otherwise falls back to direct App Store / Play Store URLs already in the codebase)
- Idempotency via `email_logs` insert with unique-ish check on `(recipient_email, type, metadata->>program_slug)`
- Timezone: format round times in `America/Los_Angeles` with `PT` abbrev (matches current session-card convention); no per-user TZ resolution in the email
- No schema changes required

## Open question

Do you want a separate download CTA using AppsFlyer OneLink (needs the OneLink URL as a secret), or is a plain App Store + Google Play button pair fine?
