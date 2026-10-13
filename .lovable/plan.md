# /l/igthree as two pages

## Page 1: /l/igthree (the email gate)
Everything fits on one phone screen with no scrolling, including small iPhones (about 667px tall):
- A small "ویدیو رایگان — تماشای فوری" pill
- A shorter title: «سه پیشفرض برای جذب مشتری از اینستاگرام در امریکا و کانادا»
- The cover image with a lock/play badge. Tapping it focuses the email field.
- One **email-only** field (large, left-to-right) and a big button: «تماشای ویدیو»
- A tiny reassurance line, for example «ویدیو بلافاصله باز می‌شود»
- A short, tight layout using the real screen height, so the button stays above the fold

When someone submits:
- Their email is saved as a video sign-up
- Meta gets **IGThreeLead** plus Lead, from the browser and the server, counted once
- They go straight to page 2 and the video starts

Returning visitors who already gave their email skip page 1 and go straight to page 2.

## Page 2: /l/igthree/watch (the old igthree page, restored)
- The same as the original page: title, subtitle, video, description, the «ظرفیت دوره بعدی محدود است» note, and the «لیست انتظار دوره بعدی» box
- The video starts playing right away
- The waitlist box comes **pre-filled with their email**, so they only type their name and tap the button
- This waitlist sends no Meta event, so it stays separate from IGThreeLead
- Visitors who open /watch without having given an email are sent back to page 1

## Lead Center
- The IG Three tab counts the **video sign-ups** from page 1
- Program waitlist sign-ups are saved as their own list, so the two never mix
- Older IG Three records stay where they are

## Not changed
/l/customerwithigads and /l/assertive stay exactly as they are.

## Technical details
- New `IgThreeGate.tsx` page at `/l/igthree`. It uses `h-[100svh]` with a flex column and the cover set to `max-h-[38svh] object-cover`, so nothing scrolls. Email is validated with zod and inserted into `form_submissions` (source `igthree_video`, empty name), then `trackWebinarLead({customEvent:"IGThreeLead"})` fires. The email is saved in localStorage `igthree_email`, then the page navigates to `/l/igthree/watch`.
- `/l/igthree/watch` renders `CustomerWithIgAdsLanding` with videoId `Fre2PCAuZW0` and autoplay. The gate logic added earlier is removed, restoring the original page. It redirects to `/l/igthree` when `igthree_email` is missing.
- `WebinarWaitlistBox` gets an `initialEmail` prop. The waitlist source is `igthree_program_waitlist`, and its `onSuccess` fires no Meta event.
- `leadCampaigns.ts`: the igthree `regSource` changes to `igthree_video` and `landingPath`/`thankYouPath` are updated. `igthree_program_waitlist` is added to `ALL_LEAD_SOURCES`.
- After building, check with Playwright at 375x667 and 394x852 that page 1 has no scroll, then test the submit, redirect, prefill, and direct-/watch redirect.
