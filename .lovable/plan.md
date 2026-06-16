# Industry Buckets — Implementation Plan

Address the 5 gaps Claude flagged so the uploaded `aperture_industry_buckets_all.md` becomes a working part of the system, not reference text.

## 1. Industry → Group mapping (machine-readable)

`aperture_industries` already has `group_label` for all 32 industries. Add a stable slug column so code can join cleanly:

- Migration: `ALTER TABLE aperture_industries ADD COLUMN group_slug text;`
- Backfill via a data migration mapping the existing `group_label` values to the 11 group slugs below (group 12 "Other" → `NULL` group_slug, no bucket).

Group slugs:
`food-hospitality`, `beauty-wellness`, `retail-ecommerce`, `professional-services`, `coaching-consulting-therapy`, `education-tutoring`, `real-estate`, `general-contracting`, `outdoor-trade-services`, `medical-dental`, `fitness-training`.

Expose a helper `getIndustryGroupSlug(industrySlug)` on the client (reads `aperture_industries`). On the server (edge functions), join `aperture_user_profile.industry_slug → aperture_industries.group_slug`.

## 2. Storage / seeding

Extend the existing tables (no parallel structure):

- `aperture_buckets`: add `kind text NOT NULL DEFAULT 'default'` (values: `default` | `industry`), and `industry_group_slug text NULL`. Default buckets stay `kind='default'`. The 11 industry buckets are inserted with `kind='industry'` and `industry_group_slug` set.
- `aperture_bucket_questions` already has `layer` — reuse it (`Layer 1`, `Layer 2`, …). No schema change needed.

Seed (one migration containing both buckets + questions):

| Group slug | Bucket slug | Title | Layers → questions |
|---|---|---|---|
| food-hospitality | `ind-food-hospitality` | Food & Hospitality | 7 layers, 36 Qs |
| beauty-wellness | `ind-beauty-wellness` | Beauty & Wellness | ~6 layers |
| retail-ecommerce | `ind-retail-ecommerce` | Retail & E-Commerce | ~6 layers |
| professional-services | `ind-professional-services` | Professional Services & Agencies | ~6 layers |
| coaching-consulting-therapy | `ind-coaching-consulting-therapy` | Coaching, Consulting & Therapy | ~6 layers |
| education-tutoring | `ind-education-tutoring` | Education & Tutoring | ~5 layers |
| real-estate | `ind-real-estate` | Real Estate | ~6 layers |
| general-contracting | `ind-general-contracting` | General Contracting & Renovation | ~6 layers |
| outdoor-trade-services | `ind-outdoor-trade-services` | Outdoor & Recurring Trade Services | ~5 layers |
| medical-dental | `ind-medical-dental` | Medical & Dental Practices | ~6 layers |
| fitness-training | `ind-fitness-training` | Fitness, Training & Movement | ~5 layers |

Each question is one row in `aperture_bucket_questions` with:
- `bucket_slug` = the industry bucket slug above
- `question_key` = stable slug like `food-cost-percentage` (derived from question text)
- `prompt` = exact text from the markdown
- `layer` = `"Layer N — <title>"` exactly as in the doc
- `input_kind = 'text'`, `sort_order` = doc order, `is_active = true`

Calculated metrics from each group are stored as a `metadata` jsonb on the bucket row (new column `metadata jsonb DEFAULT '{}'`), so the chat edge function can inject them into the AI brief.

## 3. Target counts (for progress %)

Match the default-bucket pattern: `target_count` = total questions in that bucket. Set per-group at seed time (Food & Hospitality = 36, others between ~24 and ~32 depending on actual question count parsed from the markdown). Progress % calculation in `Memory.tsx` already reads `target_count` — no UI math change.

## 4. Memory page placement

The industry bucket renders as a **single dynamic 14th card** at the bottom of the memory grid, and only when the user has an `industry_slug` whose group resolves to a non-null `industry_group_slug` (i.e. not "Other"). One card, not 11 — `useApertureMemoryDB` filters `aperture_buckets` where `kind='default' OR (kind='industry' AND industry_group_slug = user's group)`. Card visually marked as industry (small group label under the title, same shape/treatment as default cards so the existing Bucket detail page works unchanged).

## 5. Trigger logic

Activate **immediately after Q11 (industry) is answered in onboarding**:

- `OnboardQuick.tsx` already calls `upsertProfile({ industry_slug })` on the industry question. After that call, also invoke the new edge function `aperture-industry-bucket-init` which:
  - Resolves `group_slug` from the chosen industry.
  - Does nothing if group is null (Other) or if the user already has memory items in that industry bucket.
  - Otherwise inserts a single `aperture_events` row (`industry_bucket_activated`) so analytics can confirm timing. No memory items are pre-filled here — Pass 1 already handles industry-grounded guesses for the default buckets; the industry bucket starts empty and fills as the user/chat answers its questions.
- The chat edge function (`aperture-chat`) is updated so `getOrBuildMemoryCard` also pulls the user's active industry bucket's questions + answers, and `extractFactsFromMessage`'s allowed-bucket list includes the user's industry bucket slug. This lets chat-extracted facts route into the industry bucket the same way they route into defaults today.

## Technical details

### Schema migration
```sql
ALTER TABLE aperture_industries ADD COLUMN group_slug text;
UPDATE aperture_industries SET group_slug = CASE group_label
  WHEN 'Food & Hospitality' THEN 'food-hospitality'
  WHEN 'Beauty & Wellness' THEN 'beauty-wellness'
  ... -- all 11
  ELSE NULL END;

ALTER TABLE aperture_buckets
  ADD COLUMN kind text NOT NULL DEFAULT 'default',
  ADD COLUMN industry_group_slug text NULL,
  ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX ON aperture_buckets (kind, industry_group_slug);
```

### Seed migration
One migration file that:
1. Inserts 11 rows into `aperture_buckets` (kind='industry', industry_group_slug set, target_count = question count, metadata = `{ "calculated_metrics": [...] }`, sort_order = 100+).
2. Inserts ~290 rows into `aperture_bucket_questions` (parsed deterministically from the markdown, layer field populated). Migration generated by a one-off Node script that reads the markdown and emits SQL — committed alongside the migration for reproducibility.

### Code changes
- `useApertureMemoryDB.ts`: include industry-group filter in bucket query; expose `industryBucket` separately if the UI wants a different visual treatment.
- `Memory.tsx`: render the industry bucket card after the 13 defaults; show group label as a sub-line; same progress bar logic.
- `Bucket.tsx`: already generic — works as-is. Add a "Layer" group-by in the question list when `layer` is present (industry buckets only).
- `OnboardQuick.tsx`: after industry upsert, invoke `aperture-industry-bucket-init`.
- `aperture-chat/index.ts`: load active industry bucket into the memory card source set; extend the allowed-bucket list in fact extraction.
- New edge function `aperture-industry-bucket-init`: idempotent activation marker + future hook point.

## Out of scope (per the doc's "Deferred")
- Industry-inferred priors for default buckets (Pass 1 already covers this generically)
- Pattern detection across stored facts
- Relevance/rewording map for default-bucket questions

These remain separate design passes.
