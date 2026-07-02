# RiloBiz — Essential Onboarding + Waves + Chat Cleanup

Implements Claude's 6-step brief on top of the current codebase.

## Step 1 — Replace onboarding with Essential Onboarding (28 screens)

**DB (migration)**
- Keep `aperture_onboarding_questions` but repopulate for a single flow. Introduce `flow = 'essential'` and 5 sections: `phase1_identifiers`, `phase2_core`, `phase3_research`, `phase4_contact`, `phase5_closing`.
- Add `signal_key` (text, nullable) so each Phase 2 question has a stable ID (`Q1`…`Q21`) usable by the Wave 2 signal-table lookup.
- Deactivate every existing `flow IN ('quick','full')` row (`is_active=false`), don't delete — preserved as deferred bank per essential_onboarding.md §Deferred.
- Insert the 28 new rows from `docs/rilobiz/wave2/essential_onboarding.md` (Phase 1×2, Phase 2×21, Phase 3×2, Phase 4×3, Phase 5×1) with `bucket_slugs` populated so answers still route into memory.
- On `aperture_user_profile`: add `essential_onboarded_at timestamptz`, keep the legacy `quick_onboarded_at` / `full_onboarded_at` for back-compat but stop reading them.

**Frontend**
- Delete `OnboardQuick.tsx` + `OnboardFull.tsx` from the user path. Router: `/aperture/onboarding` → single new `OnboardEssential.tsx` that walks the 28 screens one-per-screen (reuses existing chip / open-field renderer).
- After Phase 3 (IG + website), call `aperture-onboarding-research` for the confirmation card (already exists, updated in Step 6). Keep `OnboardConfirm.tsx`.
- On completion → write `essential_onboarded_at`, hand off to Home.

## Step 2 — Layer + half tagging on memory

**DB (migration)** — no new buckets, only tags on `aperture_memory_items`:
- `layer text` — one of `revenue_engine | owner_capacity | financial_health | direction` (nullable; not every fact needs it).
- `bucket_half text` — for the split buckets only:
  - customers → `icp` | `existing`
  - money → `revenue` | `cost`
  - products → `front` | `back`
  - partners → `referrals` | `suppliers` | `delivery`
- CHECK constraints per bucket_slug so bad combos are rejected. Backfill: leave existing rows NULL (safe).
- Same two columns on `aperture_bucket_questions` so the bank knows which half/layer each question serves — Wave 2 selector reads this.

## Step 3 — Waves surface on Memory page

**DB**
- New table `aperture_waves`: `id, user_id, wave_number int, status ('ready'|'in_progress'|'complete'|'skipped'), selected_at, completed_at, question_payload jsonb` (the selector's JSON), `active_layers text[]`, `reasoning_summary text`.
- Answers already fit `aperture_memory_items` — add `wave_number int` + set `source = 'wave_answer'`.

**Frontend (`Memory.tsx`)**
- Add "Wave 2 ready" card above the existing memory grid. Tap → calls `aperture-wave-selector` edge function (loading state "Preparing your next wave…") → routes to a new `WaveRunner.tsx` form flow.
- `WaveRunner.tsx`: one question per screen (same shell as OnboardEssential), Skip / I-don't-know footer links per question, progress dots, completion screen. Uses `[OPTIONS]` chips already in codebase.
- On finish → mark wave `complete`, write answers as memory items tagged with `wave_number`, `layer`, `bucket_half` (from selector payload).

## Step 4 — `aperture-wave-selector` edge function (GPT)

- New function `supabase/functions/aperture-wave-selector/index.ts`.
- Input: `{ wave_number: 2 }` (Wave 3+ deferred).
- Assembles: system prompt (from `wave_2_selector_prompt.md` §System Prompt), + full text of `bucket_relationship_map.md` + `essential_onboarding_signal_table.md` (bundled as string constants in the function so no runtime fetch), + user's essential onboarding answers, + memory pool state per bucket (`fill_count`, `already_answered_question_ids`, `pass_1_inferred_items`), + filtered bucket question bank (14 defaults + user's industry bucket).
- Model: `openai/gpt-5.4` via Lovable AI Gateway (chat completions). Logs cost via existing `logAiUsage` helper.
- Returns strict JSON per the spec. Server-side guardrails (all six in the doc): dedupe vs answered, ≤11/bucket retry-once, Revenue Engine sanity flag, question-ID validation, options 3–6, sequence sort (opening first).
- Persists the returned payload to `aperture_waves.question_payload`.

## Step 5 — Chat separation from memory-filling

- `aperture-chat/index.ts` system prompt rewrite: explicit "You answer the user's question. You do NOT drive a question flow. If the user asks nothing, don't push. Background fact-extraction happens elsewhere — do not narrate it."
- Remove any current logic that appends "next question" prompts (audit `apertureChat.ts` / `composeOpener.ts`).
- Keep the existing background fact-extraction path (chat → `aperture_memory_items` with `source='chat_extracted'`) untouched.

## Step 6 — Pass 1 map-aware upgrade

- `aperture-onboarding-research` + `aperture-pass1-prefill`: prompt updates only.
  - Load `bucket_relationship_map.md` + `essential_onboarding_signal_table.md` as system context.
  - Instruct the model to identify active layers from the user's essential answers first, then bias pre-fill guesses into those layers' buckets (still writes across all 14, just weights inference effort).
  - Every inferred item gets `layer` + `bucket_half` set on write.
  - Model swap Gemini → `openai/gpt-5-mini` (matches "not Gemini" directive; keeps cost reasonable for pre-fill).

## Sequencing (matches Claude's brief)

Parallel: Step 1, Step 2, Step 5.
Then: Step 3 (needs 1).
Then: Step 4 (needs 2 + 3).
Anytime: Step 6.

## Explicitly NOT in this plan
Wave 3+ selector, chat-steer override into next wave, home-page fix, relevance scoring, learned weights.

## Open decisions before I build

1. **Old onboarding rows** — deactivate (recommended, keeps deferred bank) vs hard-delete. I'll deactivate unless you say otherwise.
2. **Users mid-onboarding on the old quick/full flow** — force them into the new essential flow on next open? (Recommended: yes; old flow disappears.)
3. **`layer` / `bucket_half` for existing memory items** — leave NULL and let waves/Pass 1 tag new writes only, or run a one-shot AI backfill on existing user_confirmed items? (Recommended: leave NULL for launch; add backfill later if needed.)
