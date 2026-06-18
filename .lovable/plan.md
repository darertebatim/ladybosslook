# Tools page: surface Website & Instagram as first-class sources

Right now when a user adds their website or Instagram in onboarding, the only visible trace on Tools is a checked Instagram pill in "Marketing & Social". Everything the research function fetched lives invisibly in memory items. Let's make those sources tangible.

## What we'll build

### 1. New "Your sources" section at the top of Tools
Above the category list, render a card grid of the user's connected sources:
- **Website card** — shown if `profile.website` is set. Title = domain (e.g. `ladybosslook.com`), small "Website" label, status chip ("Synced" / "Never fetched" / "Fetching…").
- **Instagram card** — shown if `profile.instagram` is set. Title = `@handle`, small "Instagram" label, status chip.
- Each card shows last-fetched timestamp + a count of facts extracted ("12 facts in memory").
- Tap card → opens a detail sheet (right-side slide-over / modal using existing aperture primitives).

### 2. Source detail sheet
When a user taps a card:
- **Header**: source name, URL link out, last-fetched timestamp, "Refetch" button.
- **What we know** list: all `aperture_memory_items` where `source = 'ai_extracted'` AND `question_key LIKE 'website__%'` (or `instagram__%`) — grouped by bucket. Each item shows content + edit/delete (reuses existing memory item actions).
- **Raw snapshot** (collapsed accordion): the raw fetched text/meta that the research function pulled, stored in a new `aperture_source_snapshots` table so we don't re-scrape on every view.
- **Footer actions**:
  - "Refetch" — re-runs `aperture-onboarding-research` scoped to just this source, replaces snapshot, re-extracts facts.
  - "Ask Aperture about this" — opens a new chat thread pre-seeded with a system note like `Context: user's ${source} at ${url}. Snapshot:\n${snapshot}` so the user can prompt freely ("summarize their offerings", "what tone do they use", etc.).
  - "Prompt for more info" (website only) — free-text input that sends `{ url, userPrompt }` to a focused fetch (extracts facts matching the prompt, writes them to memory, surfaces them in chat).

### 3. Backend additions
- **New table `aperture_source_snapshots`**: `(id, user_id, source_kind ['website'|'instagram'], url, raw_text, meta_jsonb, fetched_at)`. Unique on `(user_id, source_kind)`. Standard RLS + grants per project rules.
- **Refactor `aperture-onboarding-research` edge function** to:
  - Accept `{ source: 'website'|'instagram', url, userPrompt? }` for targeted re-fetches (in addition to current bulk mode).
  - Persist the raw snapshot to `aperture_source_snapshots`.
  - Tag extracted memory items with `question_key = website__<topic>` / `instagram__<topic>` so the detail sheet can filter them.
- **Chat handoff**: reuse existing `aperture_chats` creation flow; on "Ask Aperture about this", create a new chat with an initial system message containing the snapshot excerpt + a starter prompt.

### 4. Onboarding tie-in
- Keep the current Instagram → tool pill behavior, but also ensure the website triggers the same fetch path so both sources land in `aperture_source_snapshots` immediately after Quick onboarding.

## Files to touch
- `src/aperture/pages/real/Tools.tsx` — add "Your sources" section at top.
- `src/aperture/components/SourceCard.tsx` (new) — card UI.
- `src/aperture/components/SourceDetailSheet.tsx` (new) — slide-over with facts, snapshot, actions.
- `src/aperture/hooks/db/useApertureSources.ts` (new) — read profile + snapshots + scoped memory items, expose `refetch(source)` and `askAboutSource(source)`.
- `supabase/functions/aperture-onboarding-research/index.ts` — accept targeted mode, write snapshots, tag memory items.
- Migration: `aperture_source_snapshots` table + RLS + grants.

## Open questions before I build
1. Detail UI: **slide-over sheet** (matches Aperture's existing right-panel feel) or **dedicated route** `/aperture/app/tools/source/:kind`?
2. "Ask Aperture about this" → should it **create a new chat thread** or **append to the active chat**?
3. Should the website card also auto-poll periodically (weekly refetch) or strictly **manual refetch**?
