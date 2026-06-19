
# Post-Onboarding Memory Continuation (v2)

Implements the brief in `aperture_post_onboarding_memory_continuation.md`. Incorporates Claude's review notes from v1 — chip ranking now reuses the fallback score, guess styling is spec'd explicitly, and the signal logging scope is confirmed.

---

## 1. Memory page — persistent "Continue filling out your memory" card

`src/aperture/pages/real/Memory.tsx`

- Today the right-hand CTA card is "Continue onboarding" and disappears once `full_onboarded_at` is set, leaving only "Talk to Aperture" (generic chat, not memory-building).
- After full onboarding, replace it with a permanent **"Continue filling out your memory"** card. Before full onboarding, the existing "Continue onboarding" card stays.
- Tapping it calls `startMemoryChat()`:
  1. Runs the **fallback bucket picker** (§4) → returns one bucket slug.
  2. Calls `createChat({ entry_point: "memory_general", bucket_slug })`.
  3. Navigates to `/aperture/app/chats/:id`.
- Copy: "I'll pick the territory that looks most useful right now and we'll go from there."
- "Talk to Aperture" stays as the third, neutral general-chat entry (`entry_point: "general_chat"`).

---

## 2. Bucket page — split into Fact View + Continue chat

Replace `src/aperture/pages/real/Bucket.tsx` (currently a static Q&A form) with:

**Top — Continue chat CTA**
- Button: "Continue chat about {bucket.title} →"
- Calls `createChat({ entry_point: "bucket_specific", bucket_slug: slug })`.

**Below — Fact View (new)**
Browsable list of every active `aperture_memory_items` row for this user + bucket, sorted by `updated_at` desc. Each item shows:
- Content, in plain language.
- Source pill (see styling spec below).
- Relative timestamp ("3d ago"), full datetime in tooltip.
- Inline actions: **Confirm** (only on `ai_inferred_pre_onboarding` → writes new `user_confirmed` row carrying same content/bucket/question_key, deactivates the guess), **Edit** (writes new row with corrected text, deactivates old), **Delete** (sets `is_active=false`, kept in History).
- "History" expander on items sharing a `question_key` with prior inactive rows — shows older values + dates. Nothing is ever hard-deleted from the user's view of history.

### Source pill styling spec (resolves Claude's note 2 — functional, not just verbal, distinction)

| Source | Label | Visual |
|---|---|---|
| `user_confirmed` | Confirmed | Solid `--ap-signal` background, black text, full opacity |
| `bucket_answer` | Saved | Solid `--ap-signal` background (same as confirmed — both are owner-stated) |
| `ai_extracted` | Noticed | Outlined pill, signal-colored border + text, no fill |
| `file_extracted` | From file | Outlined pill, neutral border + text |
| `ai_inferred_pre_onboarding` | Guess · tap to confirm | **Dashed** border, muted text, **0.7 opacity on entire row**, italic content text, persistent "Confirm" button visible inline (not hover) |

Guesses are also excluded from being referenced as "things you mentioned" in opener B (§3) and de-weighted in progress (already done in `Memory.tsx`).

**Hook extensions** (`useApertureMemoryDB`, no edge fn):
- `confirmGuess(itemId)`
- `editFact(itemId, newContent)`
- `deactivateFact(itemId)`
- `historyFor(bucket_slug, question_key)` — returns all rows (active + inactive) ordered desc

No schema change to `aperture_memory_items` — `source`, `is_active`, `updated_at`, `question_key` already exist.

---

## 3. Entry-point-aware opener

Today `createChat` pre-seeds one static `OPENER_TEXT` regardless of origin.

**Migration:**
```sql
ALTER TABLE public.aperture_chats
  ADD COLUMN entry_point text NOT NULL DEFAULT 'general_chat',
  ADD COLUMN bucket_slug text NULL;
```
(Grants already in place.)

**`createChat` signature** → `createChat({ title?, entry_point?, bucket_slug? })`. Default `general_chat` so existing callers keep working.

**Opener selection** (client-side, written into the pre-seed assistant message so it persists in history):

- **`general_chat`** → current static opener (unchanged).
- **`memory_general` — Opener A**: frames as building the profile. Chip set is the **top 4–6 buckets ranked by the same `score()` from §4**, not raw lowest-progress. This avoids surfacing cold dead-zone buckets (Partners, Competitors at 0% with no context) next to high-value ones. Plus a final "Something else" chip that opens a bucket picker.
  > "Let's fill in a bit more about your business. What's been on your mind?"
  > [{Bucket 1}] [{Bucket 2}] [{Bucket 3}] [{Bucket 4}] [Something else]
- **`bucket_specific` — Opener B**: references the bucket by name.
  - If the bucket has **≥1 active `user_confirmed` OR `ai_extracted` OR `bucket_answer`** fact → reference the most recent one ("Last time you mentioned {fact_content}. What's changed, or what's on your mind there now?").
  - If only `ai_inferred_pre_onboarding` guesses exist, or 0 facts → **do not** reference any item; fall back to the bucket's first `aperture_bucket_questions` row by `order_index`. This explicitly prevents the AI from quoting an unconfirmed guess back to the user as if they said it.

Composed client-side from already-loaded data — no extra round trip.

**Edge function** `aperture-chat/index.ts`: read `entry_point` + `bucket_slug` off the chat row at top of handler and add a short system-prompt hint ("This conversation was opened from the {bucket.title} bucket — stay scoped to it unless the user pivots."). Skip-classifier and fact-extraction unchanged.

---

## 4. Bucket selection — fallback rule (now) + signals scaffold (later)

**Fallback picker** (`aperture/lib/pickFallbackBucket.ts`) — used by both §1 (single pick) and §3 Opener A (top-N ranking, single source of truth):
```
score(bucket) =
    (1 - progress_pct)                                  // lower-progress = more useful
  + 0.15 * (has ≥1 onboarding-mapped fact ? 1 : 0)     // tiny warm-context bonus
filter:   target_count - count > 0                      // ignore filled buckets
pickOne:  argmax(score)
topN:     sort desc by score, take N
```
Same function, two consumers. Keeps the rule consistent everywhere per Claude's note 1.

**Signals table** (migration):
```sql
CREATE TABLE public.aperture_user_bucket_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket_slug text NOT NULL,
  signal_type text NOT NULL,
  -- enum values (full set scaffolded, only 4 wired in this round):
  --   chat_topic | library_action | daily_q_answered | daily_q_skipped
  --   | auto_extracted | bucket_visit | home_suggestion_tap | home_suggestion_ignore
  weight real NOT NULL DEFAULT 1,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.aperture_user_bucket_signals TO authenticated;
GRANT ALL ON public.aperture_user_bucket_signals TO service_role;
ALTER TABLE public.aperture_user_bucket_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own signals read"   ON public.aperture_user_bucket_signals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own signals insert" ON public.aperture_user_bucket_signals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
```

**Wired in this round (4 of 8, intentional — confirms Claude's note 4):**
- `bucket_visit` on `/aperture/app/memory/:slug` open.
- `auto_extracted` server-side in `aperture-chat` alongside existing memory write.
- `chat_topic` on `createChat` with `memory_general` or `bucket_specific`.
- `home_suggestion_tap` from existing handler.

**Deferred** (enum present, no wiring yet — wire when daily questions and library action telemetry get their next pass):
- `daily_q_answered`, `daily_q_skipped` — wire alongside the daily question feature's next touch.
- `library_action` — wire with the Library tap handler refactor.
- `home_suggestion_ignore` — needs an impression tracker we don't have yet.

**Not built this round (deferred per brief):**
- `aperture_user_bucket_relevance` table + daily scorer job.
- Feeding relevance into daily question / home suggestions / live chat context.

---

## 5. Out of scope (called out so we don't over-build)

- Live relevance scorer + scores table.
- Replacing home or daily-question selection with scores.
- Conflict-resolution UI beyond per-item History expander.

---

## Technical summary

| Change | Where |
|---|---|
| Persistent memory card | `pages/real/Memory.tsx` |
| Bucket page rewrite (fact view + chat CTA, drop form) | `pages/real/Bucket.tsx` |
| Source pill component w/ styling spec from §2 | new `components/MemorySourcePill.tsx` |
| `confirmGuess` / `editFact` / `deactivateFact` / `historyFor` | `hooks/db/useApertureMemoryDB.ts` |
| Shared fallback scorer (single pick + top-N) | new `aperture/lib/pickFallbackBucket.ts` |
| `createChat({entry_point, bucket_slug})` + opener A/B/C | `hooks/db/useApertureChatsDB.ts` |
| Read `entry_point` + `bucket_slug`, inject hint | `supabase/functions/aperture-chat/index.ts` |
| Migration: `aperture_chats` cols + `aperture_user_bucket_signals` table | new migration |
| Signal logging (4 spots) | bucket page, chat creation, chat edge fn extraction, home suggestion click |

No new edge functions. No onboarding flow changes. `aperture_memory_items` schema unchanged.
