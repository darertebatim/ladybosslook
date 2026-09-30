# Forms hub in admin + one-time sign-in form links

## Goal
Students get a form link that signs them straight into the right account (no wrong-account submissions), and all forms live on one clean admin page.

## 1. New admin page: Forms
- New menu item **Forms** in the admin sidebar (same access as Programs).
- Page lists forms as tabs. First tab: **Instagram Profile Analysis** (moved from Programs; removed there).
- Built so more forms can be added later as new tabs.

Inside the Profile Analysis tab:
- **Submissions** (existing): New / In Progress / Done filters, Instagram link, WhatsApp, Message in app, Send analysis video — unchanged.
- **Invite to fill** (new): list of eligible students (Smart IG active students) who have not submitted yet, with:
  - **Send form link** per person, and **Send to all not submitted**.
  - Last invited time so you don't double-send.

## 2. One-time sign-in form link
When you tap Send form link, the student gets:
- **An in-app chat message** (Farsi) with a "Fill the form" button (works on old and new app versions, like the analysis video fix).
- **An email** with a one-time sign-in button — it signs them into *their* account and opens the form directly. Valid 1 hour, one use.

If they're already in the app, the chat button just opens the form in their current session.

Caveat: Apple "Hide My Email" users (~1,221) won't receive the email until the sender is registered with Apple — the chat message still reaches them.

## Technical details
- New edge function `send-form-invite`: admin-only (checks `has_role` / admin page access), takes `user_ids[]` + `form` key; for each user generates a magic link via `auth.admin.generateLink` with `redirectTo https://ladybosslook.com/dashboard/forms/profileanalyze`, sends Resend email (Farsi/English by profile language), inserts the support chat message with `LINK_BUTTON` + structured `buttons`, triggers `send-chat-notification`.
- Reuse styling/logic from `send-desktop-login-link`.
- Track invites: new table `form_invites (id, user_id, form_key, invited_by, sent_at)` with admin-only RLS + grants.
- Form page: if signed-in user differs from the invited one, the magic link replaces the session (standard behavior), so submissions land on the correct account.
- New `src/pages/admin/Forms.tsx`, route `/admin/forms`, nav entry; `ProfileAnalysisManager` moved there and the tab removed from `Programs.tsx`.
