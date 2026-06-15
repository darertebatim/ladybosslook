
## Goal

Wire the finalized Aperture design (13 buckets, Quick Onboarding, Full Questionnaire, AI‑led memory chat) into the app — **and** make every piece of it editable from an Aperture admin dashboard at `/admin/aperture` so nothing is hardcoded going forward.

Spec sources: `aperture_buckets_spec.md`, `aperture_quick_onboarding.md`, `existing_business_growth_quiz.md`, `aperture_bucket_questions.md`.

---

## What stays

Memory pool (`aperture_memory_items`), Memory Card + regen, chats/messages, fact extraction, playbook runner, auth gate, routing under `/aperture/app/*`, `RealAppShell`.

---

## Step 1 — Schema: make everything data-driven

One migration that:

1. Wipes the 6 placeholder buckets + their questions (confirmed no `aperture_actions.steps[]` reference them).
2. Extends `aperture_buckets`: add `brief text` (AI-only context), `territory text` (one-line user-facing), `display_order int`, `is_active bool`.
3. Extends `aperture_bucket_questions`: already has `prompt/hint/sort_order`; add `layer text` (e.g. "Layer 1 — Current customers"), `is_active bool`, `audience text` (`all` | `immigrant` | `team_owner` | …) so conditional questions are data, not code.
4. New table `aperture_onboarding_questions` — drives Quick Onboarding + Full Questionnaire from the DB:
   - `id`, `flow text` (`quick` | `full`), `step int`, `question_key text`, `prompt text`, `hint text`, `input_kind text` (`text` | `textarea` | `single_choice` | `multi_choice`), `options jsonb`, `bucket_slugs text[]` (mapping target buckets), `section text`, `is_active bool`, `sort_order int`.
5. New table `aperture_industries` — `slug`, `group_label`, `label`, `sort_order`, `is_active` (drives Q11).
6. New table `aperture_user_profile` — `user_id pk`, `quick_onboarded_at`, `full_onboarded_at`, `industry_slug`, `business_name`, `website`, `instagram`, `created_at`, `updated_at`. RLS: owner-only + service_role.
7. Seed the 13 buckets, their briefs/territories, all bucket questions from `aperture_bucket_questions.md`, all 11 quick + ~43 full questions, and the industry list — as **seed data**, but loaded the same way runtime/admin additions are loaded. Nothing in the UI hardcodes any of it.
8. Admin write access: add policies allowing users with the existing `has_role(auth.uid(), 'admin')` security-definer to insert/update/delete on the new tables and on `aperture_buckets` / `aperture_bucket_questions`.

GRANTs included for every new table per the project rule.

## Step 2 — Aperture admin dashboard `/admin/aperture`

Lives inside the existing `AdminLayout` (same gating as other admin pages). Five tabs:

1. **Buckets** — list of all 13 (sortable). Edit title, territory, brief, display_order, is_active. Add new bucket (sets `source='default'` or `'industry'`/`'situational'`).
2. **Bucket Questions** — pick a bucket, see its questions grouped by `layer`. Reorder, edit prompt/hint/audience, add, deactivate. This is what the AI uses as targets during AI-led conversations.
3. **Onboarding (Quick)** — table of 11 questions. Edit prompt, options, bucket mapping. Reorder.
4. **Onboarding (Full)** — table of ~43 questions grouped by `section`. Same edits as above. Bulk import / export JSON for fast iteration.
5. **Industries** — manage the Q11 industry list (groups + items).

Also a small **Preview** button on each row that opens the user-side question in a sheet so you can see what the owner will actually see.

Pure CRUD, no fancy validation beyond required fields. Uses existing shadcn primitives + the `useApertureAdmin*` hooks I'll add.

## Step 3 — User-side: drive everything from the DB

- `useApertureBucketsDB` already reads from DB ✅ — extend to also return `brief/territory/display_order`.
- New `useApertureOnboardingDB(flow)` reads `aperture_onboarding_questions` filtered by flow.
- New `useApertureIndustriesDB`.
- Delete `src/aperture/data/buckets.ts` and `playbooks.ts` placeholder data files (nothing should reference them after the rewrite).

## Step 4 — Quick Onboarding (`/aperture/app/onboard/quick`)

Renders DB questions for `flow='quick'`. Three phases by `step`:
- **Phase 1** — steps 1–7, one card at a time, swipe/next.
- **Phase 2** — steps 8–11 (name, website, IG, industry).
- **Phase 3** — calls new edge fn `aperture-onboarding-research` (best-effort site/IG scrape via existing AI Gateway), writes extracted notes to memory pool with `source='ai_extracted'`, `bucket_slug='basics'`, then shows the readable summary card for confirm/correct.

All answers stored in `aperture_memory_items` with `source='onboarding'`, `question_key`, `bucket_slug` from the question's `bucket_slugs[0]`. Also stores name/website/industry on `aperture_user_profile`.

Auto-redirect into this flow on first visit to `/aperture/app` when `quick_onboarded_at IS NULL`.

## Step 5 — Full Business Questionnaire (`/aperture/app/onboard/full`)

DB-driven wizard, one section per screen, "Skip" allowed everywhere. Answers fan out to the right buckets via `bucket_slugs[]`. On finish: set `full_onboarded_at`, regenerate Memory Card.

## Step 6 — Memory page rewrite

`pages/real/Memory.tsx`:

- Header: "What Aperture knows about your business."
- "Continue onboarding" card if Quick or Full unfinished.
- Big **"Talk to Aperture"** CTA → creates a chat with `mode='memory'`, routes to `/aperture/app/chat/:id`.
- 13 bucket tiles ordered by `display_order`, each showing title + territory + an **explored badge** (`barely touched / explored / well understood / deeply known`) derived from item count buckets in the pool. **No %, no progress bars.**
- Tap a bucket → simplified read-only view of memory pool items for that `bucket_slug` (no per-bucket forms — buckets 2–13 are conversation-only by design).
- Bucket 1 (Basics) opens to Quick + Full answers in read-mode with "Edit" links back to the wizards.

## Step 7 — AI-led conversation

Update `aperture-chat` edge function: when `mode === 'memory'`, system prompt receives:
- The full memory pool (already wired) ✅
- All bucket briefs + their question targets, grouped by bucket
- Instructions: pick the most useful gap to explore now, follow the thread, never march sequentially, never name buckets to the user, tag each extracted fact with the right `bucket_slug`.

No new edge function. One file change.

## Step 8 — Daily question (light)

Home gets one "Aperture's question for you today" card calling `aperture-chat` with `mode='daily_question'` (same prompt structure, asks one question only). Out of scope: scheduling, dedupe. Just a working card.

---

## Files I'll add / change

```text
supabase/migrations/<ts>_aperture_admin_and_13_buckets.sql
supabase/functions/aperture-onboarding-research/index.ts        // new
supabase/functions/aperture-chat/index.ts                        // mode='memory' | 'daily_question'

src/aperture/hooks/db/useApertureBucketsDB.ts                    // extend
src/aperture/hooks/db/useApertureOnboardingDB.ts                 // new
src/aperture/hooks/db/useApertureIndustriesDB.ts                 // new
src/aperture/hooks/db/useApertureUserProfile.ts                  // new

src/aperture/pages/real/OnboardQuick.tsx                         // new
src/aperture/pages/real/OnboardFull.tsx                          // new
src/aperture/pages/real/Memory.tsx                               // rewrite
src/aperture/pages/real/Bucket.tsx                               // simplify to read-only
src/aperture/pages/real/Home.tsx                                 // CTA + daily card
src/aperture/router.tsx                                          // routes + first-visit redirect

src/pages/admin/Aperture.tsx                                     // dashboard shell with 5 tabs
src/components/admin/aperture/BucketsTab.tsx
src/components/admin/aperture/BucketQuestionsTab.tsx
src/components/admin/aperture/OnboardingQuickTab.tsx
src/components/admin/aperture/OnboardingFullTab.tsx
src/components/admin/aperture/IndustriesTab.tsx
src/aperture/hooks/admin/useApertureAdmin*.ts                    // CRUD hooks

// deletions
src/aperture/data/buckets.ts                                     // remove
src/aperture/data/playbooks.ts                                   // remove (or keep only if admin tab still wants playbooks — out of scope here)
```

## Out of scope (call out as follow-ups)

- Industry-specific bucket packs (mechanism ready; no packs seeded).
- Runtime AI-generated / situational bucket creation (schema ready; trigger logic later).
- Calculated metrics (LTV, CAC, P&L) — added once enough buckets are filled.
- Daily-question scheduler + dedupe.
- Memory item change-detection / "significant change" surfacing.
- Admin tab for Playbooks/Actions (separate concern from buckets; we can do a second pass).

---

## Open question

The Full Questionnaire is ~43 questions. I'll present it as a **section-by-section wizard** (Sales → Marketing → Finance → Hiring → Operations → Strategy → Immigrant Journey → Personal), with "Skip" on every step. That matches Quick Onboarding's feel and is far less intimidating on mobile than one long form. Tell me if you'd rather have one long page.
