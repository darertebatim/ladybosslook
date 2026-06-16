## Goal

Bring the live quick onboarding in line with `aperture_quick_onboarding_updated.md`:

1. **Industry groups** — restructure to the 12 groups in the spec.
2. **Closing question** — add the single "How can I help you most right now?" step *after* Phase-3 confirmation, before landing on `/aperture/app`.

Both data-driven via existing tables (`aperture_industries`, `aperture_onboarding_questions`) — minimal UI changes.

---

## 1. Industries — regroup (data only)

Spec groups vs current DB:

| Spec group | Items | DB change |
|---|---|---|
| Food & Hospitality | restaurant, catering, food-retail | rename group label `Food & Hospitality` (unchanged content) |
| Beauty & Wellness | hair, nail, skincare | remove `fitness-personal-training` |
| Retail & E-Commerce | clothing, jewelry, home décor, general retail, **ecommerce** | rename `Retail` → `Retail & E-Commerce`; move `ecommerce` here |
| Professional Services & Agencies | accounting, legal, insurance, financial advising, **digital marketing** | rename `Professional Services` → `… & Agencies`; move `digital-marketing-social` here |
| Coaching, Consulting & Therapy | coaching-consulting-courses, mental-health-therapy | NEW group; move both rows in |
| Education & Tutoring | academic, language, test prep | unchanged |
| Real Estate | agent, property mgmt, investment | unchanged |
| General Contracting & Renovation | general contractor, renovation | rename `Construction & Trades` partition |
| Outdoor & Recurring Trade Services | landscaping, cleaning | NEW group; move both rows in |
| Medical & Dental Practices | dentist, physical-therapy/chiro | rename `Health & Medical` → `Medical & Dental Practices`; **delete `pharmacy` row** |
| Fitness, Training & Movement | fitness-personal-training | NEW group; move row in |
| Other | other | unchanged |

Implementation: single `supabase--insert` running `UPDATE`s for `group_label` per slug, plus `DELETE FROM aperture_industries WHERE slug='pharmacy'`. No schema migration needed — `group_label` is free text.

Optional polish: re-number `sort_order` so groups appear in the spec order in the dropdown (cheap update; will do).

---

## 2. Onboarding questions

- **Remove** the `tools_used` row (step 3 / sort 90 / section "Your stack") from `aperture_onboarding_questions` (flow=`quick`). Confirmed by user.
- **Add** closing question:
  - `question_key`: `closing_help`
  - `step`: 12, `sort_order`: 12, `section`: `closing`
  - `prompt`: "How can I help you most right now?"
  - `hint`: "If I could take one thing off your plate starting today — what would it be?"
  - `input_kind`: `textarea`
  - `bucket_slugs`: `['__notes__']` so the answer lands in the freeform notes pool (matches "Everything collected feeds the memory pool").

Both via `supabase--insert` (data ops, not migration).

---

## 3. UI changes (`src/aperture/pages/real/`)

The current flow ends Phase-2 then jumps to `OnboardConfirm.tsx` (Phase 3). The spec puts the closing question *after* confirmation. Two small edits:

### `OnboardQuick.tsx`
- Drop the now-unused `tools_used` branch and the `useApertureToolsDB` import / `tools` prop (dead code once the row is gone).
- Update `phaseLabel` to recognize `step >= 12` → "One last thing" (closing).
- Skip persisting `closing_help` via the bucket path since `__notes__` already routes to `addFreeformNote`; existing logic handles it.
- Currently the closing question would be asked *before* Phase-3 confirmation because all questions live in one flow. Fix: when the current question is `closing_help`, hide it from the in-flow loop — i.e. stop the loop at `total - 1` and instead route to `/aperture/app/onboard/confirm` (as today). Pass nothing extra; `OnboardConfirm` will own the closing step.

### `OnboardConfirm.tsx`
- After the user clicks "Confirm N →" (or "Continue" in the empty state), don't navigate straight to `/aperture/app`. Instead show the closing question (single-screen state inside this file: textarea + Continue button), persist the answer via `addFreeformNote` (already imported indirectly through `useApertureMemoryDB`), then navigate to `/aperture/app`.
- Add a tiny local state machine: `phase: 'review' | 'closing'`. Render the closing card when `phase==='closing'`.

This keeps the spec's order: Phase 1 → 2 → 3 (research + confirm) → Closing → Home.

---

## Technical notes

- All DB content updates use `supabase--insert` (UPDATE/DELETE/INSERT on existing tables) — no schema migration.
- No edge function changes; `aperture-onboarding-research` still runs after Phase 2 as today.
- No new types or hooks; reuse `useApertureMemoryDB.addFreeformNote` for the closing answer.
- The "Other (open field)" industry option in the spec is satisfied by the existing `other` slug; capturing the free-text variant is out of scope unless you want it.

---

## Out of scope

- Phase-3 wording / summary-card style (already shipped).
- Memory bucket question wiring beyond what's already mapped.
- Translations.
