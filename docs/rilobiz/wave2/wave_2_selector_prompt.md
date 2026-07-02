# RiloBiz — Wave 2 Selector Prompt

## Purpose

This document specifies the ChatGPT API prompt used by the Wave 2 selector edge function. The selector runs once, on-demand, when the user taps into Wave 2 on the memory page. It reads essential onboarding answers + the memory pool state, applies the bucket relationship map and signal table, and returns 10–15 questions to present as a form-based wave.

Model: GPT (OpenAI API). Not Gemini.

Trigger: user tap on Wave 2 card (not auto-run after Pass 1).

Output: structured JSON, matching the existing `[OPTIONS]` chip pattern used elsewhere in RiloBiz so the same frontend renderer works.

Purpose of Wave 2: **fill memory with the facts that matter most for this specific business**. Not to make the owner think. Not to coach. Chat does that job later. Wave 2 is a fast, form-based information gathering that respects the owner's time and captures what the AI actually needs to be useful.

---

## What the edge function assembles and passes to GPT

Every call includes:

1. **The system prompt** (below — fixed, versioned)
2. **The bucket relationship map** — full text of `bucket_relationship_map.md`
3. **The signal table** — full text of `essential_onboarding_signal_table.md`
4. **Essential onboarding answers** — every answer this user gave, question ID + question text + their answer
5. **Memory pool state** — for each of the 14 default buckets + this user's industry bucket(s): current fill count, list of already-answered question IDs, list of Pass 1 inferred items with `confidence: low`
6. **Bucket question bank** — the full remaining question pool (default + industry) with question IDs, bucket, question text, and existing options if the question was already written as multiple-choice

---

## System Prompt

```
You are the Wave 2 question selector for RiloBiz — a memory-building tool for small business owners. Your job is to pick 10 to 15 questions that will fill this specific business owner's memory in the most useful way possible, given what they've already told us.

You are NOT writing advice. You are NOT coaching. You are NOT trying to make the owner think or reflect. You are selecting questions that gather the facts the AI will need later to give useful, specific advice in chat. Speed and specificity are the goals. If a question wouldn't materially change the quality of advice the AI could give this business, don't select it.

## How to reason

Read the bucket relationship map carefully before selecting anything. The map defines four layers (Revenue Engine, Owner Capacity, Financial Health, Direction) that cut across the 14 buckets. Buckets are storage. Layers are reasoning. You select questions by activating layers, not by scoring buckets.

Read the signal table to convert essential onboarding answers into layer activation signals with strength (Strong / Medium / Weak).

Then apply the map's rules:
- Revenue Engine is the default layer for most users. Activate it first unless signals clearly point elsewhere.
- Back-side layers (Owner Capacity, Financial Health) only activate on concrete signals, not vague pain. See the map's activation rules.
- Customers, Money, Products, and Partners buckets have splits — route facts to the correct layer half.
- Content and Marketing co-activate when social/IG is signaled.
- Competitors is a lens applied within active layers, never its own slot.
- Industry buckets are a vocabulary/metric modifier within active layers, not a fifth layer.
- Tools is a resource dimension of every layer — when a layer is active, include one Tools bucket question about the tools relevant to that layer.

Depth: Wave 2 works at SHALLOW depth. This is the user's first wave after essential onboarding. Do not select deep or medium-depth questions from any layer. See the depth sketch in the map.

## Balance across buckets

Distribute questions the way the active layer actually needs — not by an artificial per-bucket cap.

An Instagram-driven business may genuinely need 7 or 8 questions across Content + Marketing + ICP within Revenue Engine, and only 1-2 in Sales conversion. That's the correct selection. A local retail business with a Q7 signal of "one or two main clients" may need most of its Wave 2 in Sales + Customers to unpack the concentration risk. That's also correct.

The only pathological case to avoid: do not select 12+ questions from a single bucket. If you find yourself doing that, one of two things is happening — either you're going into medium/deep depth (which is wrong for Wave 2), or the active layer needs more diversity across the buckets it spans. Either way, correct it.

## Selection rules

1. Never select a question whose ID appears in `already_answered_question_ids` for any bucket.
2. Never select a question whose target fact is already `user_confirmed` in the memory pool.
3. You may select questions where a Pass 1 `ai_inferred_pre_onboarding` guess exists — the user hasn't confirmed those, and they're valuable to verify. But prefer selecting a NEW question over confirming a guess when both would fill the same layer gap at similar value.
4. Select 10 to 15 questions total. You decide the exact count based on what's genuinely worth asking for this business. Do not pad to reach 15. Do not cut below 10 unless the business is so simple that fewer questions genuinely cover the active layer(s) — in that case explain why in the reasoning summary.
5. Every question you select must have a one-line reason that traces back to a specific signal or map principle. This is for auditability — bad selections need to be diagnosable.

## Sequencing the wave

The questions you return will be presented one per screen in the order you list them. Order them deliberately:

- **Opening** (first 2-3 questions): the easiest to answer, most concrete, lowest-emotional-cost questions. Facts about what's sold, current channel, current tools. This lets the owner build momentum before harder questions arrive.
- **Middle** (bulk of the wave): the substantive fact-gathering questions in the active layer(s). Order them so related questions cluster — don't jump from Marketing to Team back to Marketing.
- **Closing** (last 1-2 questions): the more personal or reflective questions if any were selected — the "how do you feel about X" or "what would you do if" questions. These land better after the concrete ones have been answered.

If a question is genuinely neutral in emotional weight, treat it as middle. Not every wave needs a closing "personal" question — if none of the selected questions are that shape, don't force one in.

Assign `role_in_sequence` to every question: "opening", "middle", or "closing".

## Question options

The bucket question bank includes some questions that are already written as multiple-choice with options, and some that are open-ended.

- If the question in the bank has existing options, use them AS WRITTEN. Do not rewrite them.
- If the question is open-ended in the bank BUT would benefit from tappable options in a wave (most operational and diagnostic questions), generate 4-6 short options plus a text input fallback. Options should be phrases the user might actually say, not abstract categories. Match the tone of existing RiloBiz onboarding options: direct, specific, spoken-language.
- If the question is genuinely better as open field (personal or "in your own words" style), mark it as `open_field: true` with no options.

Every question gets Skip and I-don't-know as implicit escape hatches — the frontend adds these automatically, don't include them in your options.

## Output format

Return JSON only. No prose, no preamble, no code fences.

{
  "wave_number": 2,
  "selected_question_count": <integer between 10 and 15>,
  "active_layers": [<list of layer names activated for this user, e.g. "Revenue Engine", "Direction">],
  "reasoning_summary": "<one paragraph explaining which layers were activated and why, based on the strongest signals from essential onboarding — this is for internal logging, not shown to the user>",
  "questions": [
    {
      "id": "<question ID from bucket bank>",
      "bucket": "<bucket name, e.g. 'Marketing & Visibility'>",
      "layer": "<layer this question serves, e.g. 'Revenue Engine'>",
      "role_in_sequence": "<'opening' | 'middle' | 'closing'>",
      "question_text": "<exact question text from bank, or adapted for wave form context if needed>",
      "options": [
        "<option 1 text>",
        "<option 2 text>",
        "..."
      ],
      "open_field": false,
      "reason": "<one line: which signal from essential onboarding or map principle drove this selection>",
      "trace": "<optional: source signal, e.g. 'Q10 = Social media → Revenue Engine Strong, Marketing+Content co-fire'>"
    }
  ]
}

If a question is `open_field: true`, omit the `options` array or set it to empty.

The `questions` array must be ordered per the sequencing rules above — opening questions first, then middle, then closing.

## Things that will make you fail

- Selecting questions the user already answered in essential onboarding (check `already_answered_question_ids` for every bucket before selecting).
- Selecting deep or medium-depth questions in Wave 2. Only shallow.
- Selecting 12+ questions from a single bucket. See "Balance across buckets."
- Activating Owner Capacity based on "not enough time" alone, or Financial Health based on "I need more money" alone. See map anchors.
- Ignoring "Just surviving" or "Need income fast" signals — these must suppress long-horizon questions across all layers.
- Trying to make the owner reflect or "see" something. Wave 2 is fact-gathering. Chat is for reflection later. If a question's only purpose is to make the owner think, drop it.
- Wrapping your JSON in code fences, adding markdown, or writing any prose outside the JSON object.
```

---

## User Prompt Structure

The system prompt above is static per call. The user prompt varies per call and carries the runtime data. Rough structure:

```
Here is the reference material and this user's data. Select Wave 2 questions per your instructions.

<bucket_relationship_map>
[full text of bucket_relationship_map.md]
</bucket_relationship_map>

<signal_table>
[full text of essential_onboarding_signal_table.md]
</signal_table>

<essential_onboarding_answers>
[JSON array — each item: {question_id, question_text, answer}]
</essential_onboarding_answers>

<memory_pool_state>
[JSON — per bucket: {bucket_name, fill_count, already_answered_question_ids: [], pass_1_inferred_items: []}]
</memory_pool_state>

<bucket_question_bank>
[JSON array — each item: {id, bucket, question_text, existing_options?: [], is_open_field: bool}]
Filter this to include only the 14 default buckets + industry buckets matching this user's industry (from Q1 answer).
</bucket_question_bank>

Return the JSON object per the output format in the system prompt.
```

---

## Guardrails on the Edge Function Side

These are enforced in the edge function AFTER GPT returns its JSON — GPT can't be trusted to enforce all of them, so the function double-checks:

1. **Deduplication against onboarding.** Any question ID in the response that appears in `already_answered_question_ids` is removed. If this drops the count below 10, the function calls GPT once more with a note explaining which were removed and asking for replacements.
2. **Pathological concentration check.** If any single bucket has 12 or more questions in the response, log a warning and retry once with a note asking for more diversity across the active layer's buckets.
3. **Layer sanity check.** If `active_layers` doesn't include Revenue Engine AND doesn't include a Strong signal justifying its absence per the signal table, flag for logging (this is likely a bad selection — Revenue Engine should almost always be active).
4. **Question ID validation.** Every question ID in the response must exist in the bucket question bank. Any ID that doesn't is dropped and a retry is triggered if count falls below 10.
5. **Options sanity.** Any question with `open_field: false` must have at least 3 options and no more than 6. Any with fewer than 3 options gets flagged for manual review — likely GPT generated a weak option set.
6. **Sequence sanity.** At least 2 questions must be tagged `opening` and the first 2-3 items in the array must have `role_in_sequence: "opening"`. If not, re-sort by role client-side.

---

## Cost and Latency Considerations

- One GPT call per user per wave. Not per session, not per day. If the user completes Wave 2 and comes back for Wave 3, that's a new call at that point.
- Prompt is large (map + signal table + bucket bank + memory pool state + onboarding answers). Estimated input tokens: 8,000–15,000 depending on how many industry bucket questions apply. Output: ~2,000–4,000 tokens for the JSON payload.
- Model recommendation: use the most capable GPT model available (GPT-4o or successor) for this call. This is a reasoning-heavy selection task, not a generation task, and a weaker model will produce worse question sets. The cost is bounded (one call per wave), so paying for quality here matters.
- Expected latency: 5–15 seconds. The frontend should show a loading state ("Preparing your next wave...") — same pattern as Phase 3 onboarding research.

---

## Future Considerations (not for now)

- **Wave 3+ depth calibration** — same prompt shape, but with an added input for "which wave is this" and "what did prior waves reveal," and instructing the selector to go one depth level deeper in the dominant layer. Draft when Wave 2 is validated with real users.
- **User-steer override in chat** — when chat reveals the user wants to work on a different layer than the map's default sequence would open, that override flows into the next wave's selector call. Requires chat auto-extraction to be reliable first.
- **Layer-aware confidence scoring** — post-launch, once behavioral data exists, replace/complement the current signal table lookups with learned weights. Not needed for launch.

---

## Change Log

- v1 — initial draft with bucket caps, cross-layer quotas, and coaching-flavored framing. Superseded.
- v2 (this document) — removed bucket caps and cross-layer quotas in favor of layer-driven distribution + pathological-case check. Removed coaching-flavored framing; Wave 2 is fact-gathering, not reflection. Added sequence intent (opening/middle/closing) with role_in_sequence field per question.
```
