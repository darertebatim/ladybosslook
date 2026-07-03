
This is a big one — sequencing exactly the way the plan doc's section 11 suggests, batched into two shippable waves so you can test between them.

## Wave A — plumbing (ship first, verifiable end-to-end)

1. **Nav item.** Add `Tools` to `RealAppShell` sidebar + mobile bar (icon = plug). Route already exists at `/app/rilobiz/app/tools`.
2. **Mutual exclusivity fix.** In `togglePick`, when a real tool is turned on, deactivate `nothing_yet__<cat>` and `spreadsheet_or_notes__<cat>` for that category. When a marker is turned on, deactivate all real tools in that category. (Markers already exclude each other — extend to real tools.)
3. **Tool Onboarding pass (first-visit).** Detect "user has zero `aperture_user_tools` rows" → render a slimmed picker-only mode ("Tap what you use, category by category, then continue"). On tap **Continue**, mark a `tool_onboarding_done_at` field on `aperture_user_profile` and redirect to the living Tools page. Existing users with any picks are treated as done.
4. **Static category order (section 6).** Replace current order in `TOOL_CATEGORY_GROUPS` iteration with: Marketing & Social → Communication → Email & CRM → Payments → Scheduling → E-commerce → Website & Domain → everything else. Categories with no picks/gaps are skipped in the living view (still shown during onboarding).
5. **Data model.**
   - New table `aperture_tool_card_questions` (`user_id, card_key, question_text, answer_text, generated_at, answered_at, is_active`). `card_key` = `tool:<slug>` | `gap:<category>` | `multi:<category>`.
   - Answers additionally insert into `aperture_memory_items` (tag `source='tool_card'`, `question_key='tool_card__<card_key>__<hash>'`, bucket routed via `bucketForCategory` or AI).
   - GRANTs + RLS scoped to `auth.uid()`.

## Wave B — living cards (the actual redesign)

6. **Card model (sections 4, 4b, 5).** New `ToolCard` component:
   - Renders collapsed by default (title + tool/gap name + state chip).
   - On tap: if no cached questions → call edge fn `aperture-tool-card-generate` → cache 3 questions in `aperture_tool_card_questions` → render. If answered → also render the 3 suggestions.
   - Wave-runner style open textareas per question. Submit → writes answer to card_questions + memory_items → fetches suggestions (same edge fn, mode=`suggestions`).
   - "Ask me something new" button once all 3 are answered → deletes/marks-inactive old row set, generates a fresh 3.
   - **Multi-tool card** auto-appears when a category has ≥2 real tools (card_key `multi:<category>`).
   - Top 1-2 cards per category expanded by default; rest collapsed.

7. **Edge function `aperture-tool-card-generate`.**
   - Input: `{ card_key, mode: 'questions' | 'suggestions' }`.
   - Loads: user memory for the bucket + full stack (`aperture_user_tools`) + bucket relationship map + already-asked questions for this card_key.
   - `questions` mode → returns 3 questions (Q1 = satisfaction/priority check per plan section 4). Persists them.
   - `suggestions` mode → returns 3 suggestions ordered per plan (RiloBiz-native first).

8. **Batch quick-pass card (section 7).**
   - Passive: on Tools page load, count rows in `aperture_tool_card_questions` where `answer_text IS NULL AND is_active`.
   - If count ≥ 7, render a single card above the category list: "You've got N quick questions waiting — answer them in one pass?" → opens a modal listing all pending questions (reuses same submit path).

Chat/Brief pair (section 10) — already exists on the page, kept as-is.

## Technical notes

- Reuse Wave 2 answer input component from `WaveRunner.tsx` (open textarea, submit) for card questions — no new input primitive.
- `SourceCard` block ("Your sources") stays exactly where it is (plan §1b).
- No changes to `INTEGRATIONS` block; the "Coming soon" section stays for now.
- `aperture_user_profile.tool_onboarding_done_at TIMESTAMPTZ NULL` — nullable so existing users default to null = "treat as done if they already picked tools".

## What I'll skip until you confirm

- Splitting migrations for approval — I'll bundle all schema in one migration.
- Building an admin surface for tool cards.
- Analytics / instrumentation beyond `aperture_ai_usage` (already logs edge fn spend).

Want me to ship **Wave A first** and let you test, then follow with Wave B? Or do the whole thing in one go?
