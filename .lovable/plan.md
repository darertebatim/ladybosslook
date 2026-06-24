# RiloBiz Invite-Only Gate

Lock down `/app/rilobiz/app/*` so only invited users get in. First-time visitors see a "RiloBiz is invitation only" screen where they enter an invite code OR request access with their email. Admin gets a new tab to issue one-time codes and review access requests.

## User flow

1. User signs in (or arrives via Rilo burger "Go to RiloBiz") and lands on any `/app/rilobiz/app/*` route.
2. New `ApertureInviteGate` (wraps `ApertureAuthGate`) checks if the user is already redeemed:
   - Yes → proceed to app.
   - No → render the invite shield (full-screen, RiloBiz styled, like onboarding).
3. Shield has two modes:
   - **Have a code** → input + Redeem button. Calls edge function; on success marks user as approved and reloads.
   - **Request access** → prefilled email + optional note + Submit. Inserts into `aperture_access_requests`. Shows "We'll be in touch" confirmation.
4. Admin can still bypass (skip the gate for `has_role admin`).

## Admin UI (Admin → Aperture → new "Invites" tab)

- **Invite codes panel**
  - "Generate code" button → creates a one-time code (random 8-char), shows it with copy button, optional note/label.
  - Table: code, label, status (unused / redeemed by email + date), created date, revoke button.
- **Access requests panel**
  - Table: email, note, requested date, status.
  - Per row: "Approve" (generates a code, marks request approved, links code) and "Dismiss".

## Database (migration)

Three new public tables, all with GRANTs + RLS:

- `aperture_invite_codes`
  - `id uuid pk`, `code text unique`, `label text`, `created_by uuid`, `created_at`, `redeemed_by uuid null`, `redeemed_at null`, `revoked_at null`.
  - RLS: admins full access; authenticated can SELECT only their own redeemed row (to check status).
- `aperture_access_requests`
  - `id uuid pk`, `user_id uuid null`, `email text not null`, `note text`, `status text default 'pending'`, `created_at`, `resolved_at`, `resolved_code_id uuid null`.
  - RLS: admins full access; authenticated INSERT for self; SELECT own rows.
- `aperture_approved_users`
  - `user_id uuid pk`, `code_id uuid`, `approved_at`.
  - RLS: admins full access; authenticated SELECT own row.

Plus a security-definer RPC `redeem_aperture_invite(p_code text)` that atomically: validates the code is unused & not revoked, inserts into `aperture_approved_users` for `auth.uid()`, marks the code redeemed, returns ok/error.

Admins are implicitly approved (no row needed — gate checks `has_role` first).

## Frontend changes

- `src/aperture/router.tsx` — wrap each `/app/rilobiz/app/*` route's `ApertureAuthGate` with new `ApertureInviteGate` (single composed `<ApertureGate>` for cleanliness).
- New `src/aperture/components/ApertureInviteGate.tsx` — fetches approval status (admin role OR row in `aperture_approved_users`); renders shield otherwise.
- New `src/aperture/components/ApertureInviteShield.tsx` — two-tab UI (Redeem code / Request access), uses Aperture primitives (`ApertureButton`, `ApertureMonoLabel`), matches existing Auth page styling.
- `src/pages/admin/Aperture.tsx` — add new "Invites" tab with the two panels described above. Reuse existing `useTable` helper.

## Technical notes

- Code generation: client-side `crypto.getRandomValues` over A-Z2-9 alphabet, 8 chars. Uniqueness enforced by DB unique index; retry on collision.
- Status check is a single `SELECT` (cached in React Query) so the gate only blocks for ~100ms after login.
- The shield matches the Aperture look (dark canvas, mono label, soft hairline cards) so it feels like onboarding, not an error.
- No email sending on access requests in this pass — admin sees them in the dashboard. We can add email later if needed.
