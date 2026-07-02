# RiloBiz — Bucket Relationship Map

## Purpose

The shared reasoning reference for every AI-driven surface in RiloBiz that touches business logic. It exists because the 14 buckets are storage, not reasoning. Treating buckets as parallel, independent topics produces question selection and chat behavior that's technically correct but practically wrong (routing "inconsistent revenue" to Operations when it's a Marketing/Sales symptom; leaving pricing off a marketing conversation because it "belongs to Money").

Without a shared reference, each AI pass re-derives (or fails to derive) how facts across buckets connect, inconsistently. This document is the fix: write the judgment once, apply it everywhere.

Used by:
- Every memory-fill wave (Wave 2, Wave 3, and onward)
- Pass 1 (post-onboarding pre-fill AI)
- Live chat

---

## Glossary

Terms used throughout this document.

- **Bucket** — a storage territory for a category of facts about the business. RiloBiz has 14 default buckets (Basics, Your Story, Customers & Market, Products & Services, Sales & Conversion, Marketing & Visibility, Money & Finance, Goals & Vision, Tools & Systems, Team & People, Operations, Partners & Dependencies, Competitors, Content & Media) plus industry-specific buckets loaded based on the user's industry. Full question set lives in `aperture_bucket_questions.md`.
- **Layer** — a coherent slice of facts pulled from across multiple buckets, defined by what the AI can *do* with them together. This document defines four layers.
- **Essential onboarding** — the ~30-question form the user completes at signup, before anything else. Spec in `essential_onboarding.md`.
- **Pass 1** — an AI call that runs after essential onboarding, using industry + onboarding answers + website/Instagram scan to pre-fill low-confidence guesses across the memory pool, so the user doesn't start with an empty map.
- **Wave** — a batched form-based questionnaire, 10–15 AI-selected questions, that the user completes to fill more memory. Wave 2 is the first one after essential onboarding. Waves continue (3, 4, 5…) as the user chooses to do them.
- **Memory page** — where waves live. Only used for structured memory-filling. Not conversational.
- **Chat** — where the user asks the AI questions or requests specific outputs (write a caption, plan a launch, review a pricing decision). Uses whatever memory already exists. Facts extracted from chat feed back into memory automatically in the background, but chat is not a fill flow.
- **Memory pool** — the store of facts about a specific user's business, tagged by bucket and by source (`user_confirmed`, `ai_extracted`, `ai_inferred_pre_onboarding`, `file_extracted`).

---

## What the memory is for

RiloBiz memory is not a form to be filled evenly across 14 buckets. It is the specific set of facts the AI needs to give the business owner useful, specific advice about their real problem — usually revenue growth — **without making them answer 500 questions to get there**.

Every wave should be selecting the fewest questions that give the AI enough context to actually help with the owner's next real question. Chat should be reading the memory that exists and responding to what the owner asked, not drifting into fill mode. The two jobs are separate on purpose.

---

## Core principle — layers, not bucket tiers

Facts across buckets are interconnected. Product price is a Money fact *and* a Sales fact *and* a Marketing fact. Target audience is a Customers fact *and* a Marketing prerequisite *and* the foundation of Content. You cannot rank the 14 buckets themselves and get to good question selection — the buckets are the wrong unit.

**The right unit is a layer:** a coherent slice of information, pulled from wherever it lives across the 14 buckets, that together lets the AI answer a specific *kind* of business question well.

**Buckets are storage. Layers are reasoning.**

When any AI pass prioritizes, it asks: *which layers matter most for this business right now?* — then pulls the specific fact gaps from within those layers, wherever they happen to live.

---

## The layers

### 1. Revenue Engine Layer — the default for most users

*When it activates:* by default for almost everyone. This is the layer that answers "how do I make more money" / "how do I get more customers" — the question 7–8 in 10 small business owners actually have. Nearly every vague pain signal ("business is slow," "revenue is flat," "not enough time") should be read as a Revenue Engine problem first, before any other interpretation.

*The facts this layer needs, pulled from across buckets:*

- **What's being sold** — Products bucket, front-facing half: the specific offer, features, benefits, what makes it valuable
- **At what price** — Money bucket, revenue half + Products bucket: price points, pricing logic, tiers/bundles, price vs. perceived value
- **To whom** — Customers bucket, ICP half: target audience — their voice, specific pain, what makes them buy, how they talk about their own problem
- **Through which channel** — Marketing bucket: current channels, what's been tried, what converts, which channel this specific business's audience actually uses
- **With what content/message** — Content bucket: what they post, what performs, format strategy (especially short-form) — plus the offer's actual promise/hook in words
- **How strangers become customers** — Sales bucket: conversion mechanics, objections, follow-up, close
- **Referral flow** — Partners bucket, referral half: who sends customers, what percentage of new business comes from referrals, any formal referral arrangement
- **Which tools power this** — Tools bucket, marketing/sales/content subset: CRM, email/SMS, ad platform, landing page, scheduling, analytics
- **Competitive lens** — Competitors modifier, applied throughout: how pricing, positioning, and channels compare to others doing the same thing
- **Industry vocabulary** — industry bucket modifier, applied throughout: metrics and specifics that only exist in this industry (e.g. food cost %, session utilization, avg ticket size)

*What the AI can do with this layer well-filled:* answer "how do I grow to $X," write specific marketing content, diagnose why a channel isn't converting, recommend pricing changes, spot the actual bottleneck between traffic → lead → sale, suggest tools with reference to what they already use.

---

### 2. Owner Capacity Layer

*When it activates:* on concrete signals of the owner being the bottleneck — team size 2+ with owner still doing the work, explicit "I'm at capacity," "I can't take a day off," "I want to hire but don't know how." Do NOT activate this layer on "not enough time" alone — that's almost always a Revenue Engine problem (too many low-quality leads, no qualification, no self-serve tools) before it's a capacity problem.

*The facts this layer needs:*

- **Where the owner's time goes** — Operations bucket
- **What depends on the owner personally** — Operations, Team
- **Current team structure and roles** — Team bucket
- **What's delegatable and what isn't** — Team, Operations
- **Delivery mechanics** — Products bucket, back-facing half: how the product/service is actually produced/delivered
- **Existing-customer facts** — Customers bucket, existing-customer half: retention, complaints, delivery quality (these are operational, not acquisition)
- **Delivery/fulfillment partners** — Partners bucket, delivery half: contractors, subcontractors, third-party logistics
- **Which tools power operations** — Tools bucket, ops subset: PM, scheduling, delivery tools, internal comms
- **Cost of the current setup** — Money bucket, cost half, briefly, only as it constrains hiring
- **Industry vocabulary** — industry bucket modifier: staff scheduling patterns, booking density, session load, inventory rhythm

*What the AI can do with this layer well-filled:* recommend specific delegation moves, size a first hire, spot which owner activities create the most value vs. which are pure overhead, design a step-back plan, flag delivery bottlenecks.

---

### 3. Financial Health Layer

*When it activates:* on concrete financial signals — "I don't track my numbers," "I'm breaking even or losing money," stated debt problem, explicit margin/profit anxiety, or Revenue Engine work reveals a healthy top line but no profit. Do NOT activate on vague "I need more money" — that's Revenue Engine.

*The facts this layer needs:*

- **Real numbers** — Money bucket: revenue, profit, biggest expenses, cash on hand
- **Cost structure** — Money bucket, cost half + Operations, Team as cost centers
- **Debt and obligations** — Money bucket
- **Pricing logic vs. actual margin** — Money bucket + Products bucket, the intersection matters
- **Supplier and platform costs** — Partners bucket, supplier/platform half: what they buy, from whom, at what cost; platform fees and terms
- **Which tools power finance** — Tools bucket, finance subset: bookkeeping, invoicing, payment processing
- **Industry vocabulary** — industry bucket modifier: industry-standard margin benchmarks, cost ratios, seasonality

*What the AI can do with this layer well-filled:* diagnose why revenue growth isn't producing profit, recommend cost cuts, flag pricing that's structurally unprofitable, plan for debt payoff, benchmark cost structure against industry norms.

---

### 4. Direction Layer

*When it activates:* early, at low intensity, for every user — to calibrate tone and urgency of everything else. Higher intensity when signals are contradictory (the user's stated need doesn't match their stated blocker), or when the owner explicitly says they don't know what they're building.

*The facts this layer needs:*

- **What they're actually building toward** — Vision bucket
- **Urgency horizon** — Vision: need income fast vs. long-term compounding
- **Why they started, background, immigrant context** — Story bucket
- **Personal definition of winning** — Vision, Story

*What the AI can do with this layer well-filled:* match tactical advice to the owner's actual time horizon, avoid recommending patient long-arc strategies to someone in survival mode (or vice versa), spot when the real blocker is unclear direction rather than lack of execution.

---

## Industry buckets — how they fit

Industry buckets are **not a fifth layer.** They are a **vocabulary and metric modifier applied within layers**, in the same way Competitors is a lens modifier.

A restaurant's food cost % is a Revenue Engine question (margin/pricing constraint on the offer) *and* a Financial Health question (cost structure). A salon's booking density is an Owner Capacity question (delivery load) *and* a Revenue Engine question (utilization → revenue). A coach's session mix is Revenue Engine (offer structure).

The layer decides *which kind of question is being asked*. The industry modifier decides *which vocabulary and metrics are used to ask it*. When Revenue Engine activates for a restaurant, industry-specific questions about food cost enter the Revenue Engine pool alongside the default ones — not as a separate priority.

---

## How layers interact — the BMC sequencing intuition

Layers correspond loosely to the two sides of Business Model Canvas:

- **Front / revenue-facing:** Revenue Engine Layer (this is where most users are, and where filling starts)
- **Back / cost-facing:** Owner Capacity Layer, Financial Health Layer
- **Straddles both:** Products (its front-facing half sits in Revenue Engine, back-facing half in Owner Capacity), Money (revenue half in Revenue Engine, cost half in Financial Health), Partners (referral half in Revenue Engine, supplier/platform half in Financial Health, delivery half in Owner Capacity)
- **Cross-cutting:** Direction Layer (shapes tone and sequencing rather than tactics), Tools (resource dimension of every other layer)

**Sequencing principle:** for most users, start with Revenue Engine — that's their actual problem. Move into Owner Capacity and Financial Health once Revenue Engine has real coverage, *or* immediately if a Back-side signal is concrete and specific (real team size, explicit debt, stated capacity crisis). Do not delay Back-side work when the signal is real; do not front-load Back-side work when the signal is vague.

---

## Cross-cutting rules

- **Customers & Market must be split.** ICP/target-audience facts sit in Revenue Engine (prerequisite for Marketing and Content). Existing-customer facts (retention, delivery quality, complaints) sit in Owner Capacity. When a question touches "who are your customers," check which half it means before routing.
- **Money & Finance must be split.** Revenue half (pricing, revenue drivers) sits in Revenue Engine. Cost half (expenses, debt, cash flow) sits in Financial Health. Same bucket, two different reasoning roles.
- **Products & Services must be split.** Front-facing (offer, price, features, differentiation) sits in Revenue Engine. Back-facing (delivery, catalog depth, fulfillment) sits in Owner Capacity.
- **Partners & Dependencies must be split three ways.** Referrals sit in Revenue Engine (referral flow is a sales channel). Suppliers and platform dependencies sit in Financial Health (cost and risk). Delivery/fulfillment partners sit in Owner Capacity (they extend the delivery mechanism).
- **Tools is a resource dimension of every layer.** Not a standalone layer. Whichever layer is active, the AI needs to know which tools the user already has in that layer's territory before recommending anything, or recommendations get generic ("try email marketing") when they could be specific ("use the Mailchimp list you already have").
- **Competitors is never a standalone slot.** It is a lens applied inside whichever layer is active — sharpening pricing questions in Revenue Engine, sharpening cost benchmarking in Financial Health, sharpening hiring reference points in Owner Capacity.
- **Content and Marketing activate together, not separately.** When social/IG is signaled, both buckets fire — Marketing (should I invest here, is it working) and Content (what do I actually post) — as one Revenue Engine activation.
- **Industry buckets are a vocabulary/metric modifier within layers,** not a fifth layer. See section above.

---

## Depth and adjacency across waves

The map governs not just *which* layer to work in, but *how deep* and *what opens next*.

### Depth principle

Each pass through a layer goes deeper into the *same* facts, not wider across new buckets. Wave 2 asks the surface facts inside a layer; Wave 3 asks the sharper questions that only make sense once the surface facts exist; Wave 4 goes deeper still.

Rough depth sketch per layer (not a fixed sequence, a rough shape):

- **Revenue Engine — shallow:** what's the offer, main channel, who's the target, current price. **Medium:** conversion mechanics per channel, ICP voice and pain, content format performance, referral pattern. **Deep:** offer stack and premium tier logic, cross-channel funnel math, ICP segmentation, price sensitivity, content hook formulas.
- **Owner Capacity — shallow:** team size, where time goes, who does what. **Medium:** which activities are delegatable, current dependencies, delivery bottlenecks. **Deep:** step-back plan mechanics, second-hire logic, systems for the specific bottlenecks named earlier.
- **Financial Health — shallow:** real revenue/profit numbers, biggest expense, debt yes/no. **Medium:** cost structure breakdown, margin per offer, cash flow rhythm. **Deep:** unit economics, allocation planning, tax/legal structure implications.
- **Direction — shallow:** urgency horizon, one-line "what are you building." **Medium:** what winning looks like at 12 and 24 months, personal definition of enough. **Deep:** trade-offs between paths, exit or scale intent, alignment of daily work with stated direction.

Wave N pulls from the current depth of the dominant layer. Wave N+1 goes one level deeper in the same layer, using Wave N's answers as foundation. It doesn't jump to a new layer until the current one is meaningfully deep.

### Adjacency principle

Which layer opens next after the dominant one is deep depends on what the dominant layer *revealed*, not on a fixed sequence.

For a Revenue Engine business:
- If deep Revenue Engine work shows the offer converts but the owner can't deliver at scale → Owner Capacity opens next
- If deep Revenue Engine work shows healthy top line but weak margin → Financial Health opens next
- If deep Revenue Engine work shows the owner is chasing a channel that doesn't match their stated 2-year direction → Direction opens next (before more tactical work is worth doing)

The map's job is to say: *look at what previous waves revealed, and let that decide which adjacent layer opens*, rather than defaulting to a topic checklist.

### User-steer override

If the user says something in chat that clearly points at a layer other than what the map's default sequence would open ("actually, forget the IG stuff, help me figure out whether to hire someone"), that overrides the map's default. The map governs default reasoning when the user isn't steering; explicit intent from the user always wins.

---

## Practical reasoning anchors (for calibration)

Use these to check that a reasoning pass is applying the map correctly.

- **"Revenue is inconsistent"** → Revenue Engine (unstable lead flow), not Owner Capacity.
- **"Revenue is flat"** → Revenue Engine (not reaching new people), not Financial Health.
- **"Not enough time / already at capacity"** → Revenue Engine first (Sales: low-quality leads, high churn, no self-serve tools). Owner Capacity only if that check comes back negative.
- **"I need more money"** (vague) → Revenue Engine.
- **"I don't track my revenue"** (concrete) → Financial Health, urgent.
- **Team size 6+** (concrete) → Owner Capacity activates for real, in parallel with Revenue Engine.
- **"Instagram is a big priority"** → Revenue Engine — Marketing + Content fire together, plus ICP check, plus a Tools check on what's currently in their marketing stack.
- **IG-driven business, Wave 3** → still Revenue Engine, but medium/deep: ICP voice specifics, top-performing format, hook patterns, conversion mechanic from IG DM/link to sale — not a jump to Team or Operations.
- **Pricing question, any context** → Revenue Engine (front-facing Products + revenue-half Money), with Competitors lens applied.
- **"I'm breaking even despite good revenue"** → Financial Health takes precedence; something in the cost structure or pricing math is broken.
- **"Just surviving right now"** → Direction Layer flag: suppress long-horizon questions across every layer, focus tactical work on immediate stabilization.
- **User in chat: "forget IG, help me hire"** → Owner Capacity leapfrogs to primary regardless of wave sequence.

---

## How each surface uses the map

- **Memory-fill waves (Wave 2 and onward).** Before selecting questions, identify which layer(s) apply for this business given everything known so far (essential onboarding + any prior wave answers + Pass 1 guesses that have been confirmed or corrected). Select 10–15 questions from within the active layer(s) at the appropriate depth. Do not select questions by bucket score. Wave 2 works at shallow depth; Wave 3+ goes deeper in the same layer, or opens the adjacent layer indicated by previous answers.
- **Pass 1.** Before generating pre-fill guesses, identify which layer(s) apply given industry + essential onboarding. Focus guesses within those layers rather than scattering evenly across all 14 buckets. A restaurant with Revenue Engine as the dominant layer gets rich guesses about offer/pricing/target audience and thin guesses about Partners or Team — not the reverse.
- **Chat.** When the user asks a question or requests an output, identify which layer their request sits inside. Stay coherent with that layer — don't drift bucket-to-bucket by keyword. If a Revenue Engine question needs a fact from Financial Health to answer well, pull it (the layers cross the same bucket in different ways, that's the whole point), but don't wander into Financial Health topics the user didn't ask about. If the user explicitly steers to a different layer, follow.

---

## Assumptions and how to update this

**Assumption 1 — "7–8 in 10 users want revenue growth."** This is derived from Ali's coaching experience (hundreds of clients per year over 15+ years, and current 1-on-1 practice). It shapes the entire map — Revenue Engine as default, Money/Team/Ops as tier-2. It is a strong prior, not a proven fact for the RiloBiz user base specifically. Validate against real usage once there's a meaningful user base. If it turns out RiloBiz users skew heavily toward pre-revenue or ops-heavy problems, the default layer should shift accordingly.

**Assumption 2 — the four layers cover everything worth covering.** Also derived from Ali's experience. If real usage surfaces a coherent slice that doesn't fit any of the four (e.g. an "immigrant transition" layer that's more than what Direction covers), a fifth layer is added, not forced into an existing one.

**When to revise this document:**
- Real user data contradicts a default (e.g. the "not enough time → Revenue Engine first" rule turns out to be wrong for a significant subset — the calibration anchor should change or become conditional).
- A new bucket is added to the 14, or a bucket splits (a bucket split changes the cross-cutting rules section).
- The AI's job in RiloBiz meaningfully expands (e.g. becomes proactive/agentic rather than reactive) — that changes which surfaces need the map and how they use it.
- The essential onboarding question set changes materially — reasoning anchors reference specific answer patterns and may need to be updated.

**Change-tracking practice:** each material revision should be dated and briefly noted at the bottom of the document. A stranger reading the map two versions from now should be able to see what shifted and why.
