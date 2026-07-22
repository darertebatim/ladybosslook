
## Webinar data (pulled from `program_catalog` + `program_rounds`)

- **Program**: `Instagram for Business: Avoid the 6 Biggest Mistakes` (slug `instagram6traps`, language: persian, type: webinar)
- **Round #1**: `2026-08-01 18:00 UTC`, 90 minutes
- **Google Meet**: `https://meet.google.com/nqc-gztw-imp`
- **WhatsApp support**: `https://wa.me/16265028535`
- Cover image: the uploaded PNG (added to `src/assets/`)

All webinar info on both pages is pulled **live from the DB** (`program_rounds` + `program_catalog` for slug `instagram6traps`), so future edits in admin/programs automatically flow through.

---

## Page 1 — `/sixtraps` (Farsi, mobile-first)

Structure (single column, RTL, Farsi copy):
1. Cover image (uploaded webinar hero).
2. Farsi headline + short subtitle from the program description.
3. Registration card:
   - Full name (متن)
   - City (شهر)
   - Email (ایمیل)
   - Submit button: «ثبت‌نام رایگان»
4. On submit:
   - Validate with zod (name/city 1–100, valid email).
   - Insert into `form_submissions` (existing public table) with `form_type='sixtraps_registration'` and payload `{name, city, email, program_slug, round_id}`.
   - Call new edge function `send-sixtraps-confirmation` with `{name, email, roundId}` — it fetches round + program from DB and sends a Farsi confirmation email via Resend containing: webinar title, date/time (both UTC and Tehran time), Google Meet link, WhatsApp support link, add-to-calendar links.
   - Navigate to `/thankyousixtraps`.
5. No auth required (public page). Any submit failure still redirects to thank-you but toasts a soft warning — email will be retried by the edge function log path.

---

## Page 2 — `/thankyousixtraps` (Farsi, mobile-first)

1. Farsi thank-you headline.
2. Responsive YouTube embed: `https://youtu.be/nccqY4M6GZ4`.
3. Webinar details card (from round): title, date/time (Tehran + local), duration, «لینک ورود در ایمیل شما ارسال شد».
4. Two calendar buttons:
   - **Google Calendar** — opens `https://calendar.google.com/calendar/render?action=TEMPLATE&...` prefilled from round data.
   - **Apple Calendar** — downloads a generated `.ics` file (client-side blob) with the same event details.
5. Below: single button «ارسال جزئیات به واتس‌اپ من» → opens the round's `support_link_url` (`https://wa.me/16265028535`) with a prefilled Farsi message asking support to resend the webinar details.

---

## Backend

- **New edge function**: `supabase/functions/send-sixtraps-confirmation/index.ts` — public (no JWT), CORS, Resend-based, Farsi HTML email. Requires `RESEND_API_KEY` secret (already used elsewhere; if missing I'll prompt to add).
- No schema changes; reuses `form_submissions` and reads `program_rounds` / `program_catalog`.

## Frontend files

- New: `src/pages/SixTrapsLanding.tsx`, `src/pages/ThankYouSixTraps.tsx`, `src/lib/sixtrapsCalendar.ts` (Google URL + ICS blob helpers).
- New asset: `src/assets/sixtraps-hero.png` (from upload).
- Update: `src/App.tsx` — lazy-register `/sixtraps` and `/thankyousixtraps` (web only, same guard pattern as `/thankfreelive`).

## Out of scope

- Admin UI to edit round content (already exists).
- Payment flow (webinar is free).
- Farsi copy is drafted by me; you can tweak inline after preview.

Confirm and I'll build it.
