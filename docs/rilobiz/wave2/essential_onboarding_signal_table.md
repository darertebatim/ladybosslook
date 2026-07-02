# RiloBiz — Essential Onboarding Signal Table

## Purpose

Companion to `bucket_relationship_map.md`. The map tells the AI *how* to reason across layers. This table tells the AI *what each essential onboarding answer signals*.

Format: `Question / Answer → Layer(s) activated, strength, optional dependency note`

Strength values:
- **Strong** — clear signal, act on it
- **Medium** — real but conditional signal, cross-check before acting
- **Weak** — background context, don't drive selection

The AI uses this table as lookup, then applies the map's reasoning (splits, modifiers, sequencing) when building the actual question set.

If two signals point at different layers, the map's default (Revenue Engine as primary for most users) breaks ties unless a signal is explicitly Strong for a Back-side layer.

---

## Phase 2 — Core Questions

### Q1 — Which industry are you in?
- *Any industry selected* → loads industry bucket, applied as vocabulary/metric modifier within whichever layer is active (Strong, structural — not itself an activation signal)
- *Other (open field)* → no industry bucket loaded; rely on defaults only

### Q2 — How long have you been running this business?
- *Just started* → Direction (Strong: horizon and identity still forming), Revenue Engine at shallow depth only
- *Less than 1 year* → Direction (Medium), Revenue Engine at shallow depth
- *Between 1 and 3 years* → no layer bias; use defaults
- *Between 3 and 7 years* → if paired with any Q6 stagnation signal, boost Direction (Medium: stuck at same shape means direction needs re-examination)
- *More than 7 years* → assume basics are known; deep-Revenue-Engine and Direction re-examination both viable

### Q3 — How many people work in your business including yourself?
- *Just me* → Owner Capacity suppressed (Team bucket effectively off; Operations narrows to owner-as-bottleneck)
- *2 to 5 people* → Owner Capacity available (Weak baseline, activate on other signals)
- *6 to 10 people* → Owner Capacity (Strong: activates in parallel with Revenue Engine)
- *More than 10 people* → Owner Capacity (Strong) + Financial Health cost half (Medium: payroll is now a material cost)

### Q4 — What area do you most need help with right now?
- *Sales* → Revenue Engine (Strong, stated need)
- *Marketing* → Revenue Engine (Strong, stated need — Marketing + Content co-fire per map, plus ICP check)
- *Finance* → Financial Health (Strong, stated need) — check against Q5/Q20 to distinguish literal financial-health signal from vague "I want more money"
- *Hiring* → Owner Capacity (Strong) — cross-check Q3; if solo, treat as intent for future not current state
- *Operations* → Owner Capacity (Strong, stated need)
- *Strategy* → Direction (Strong, stated need — hold back tactical questions in other layers until direction is clearer)

### Q5 — What is your average monthly revenue right now?
- *Less than $5,000* → Financial Health basics (Medium: small margin for error, know-your-numbers matters more)
- *Between $5,000 and $15,000* → no layer bias
- *Between $15,000 and $50,000* → no layer bias
- *Between $50,000 and $100,000* → Revenue Engine can go medium depth immediately
- *More than $100,000* → Revenue Engine can go medium/deep immediately; Financial Health (Medium: at this scale, margin structure and allocation start mattering)
- *I don't track it consistently* → Financial Health (Strong, urgent — literal signal, not vague pain)

### Q6 — When you think honestly about your revenue — what best describes it?
- *Growing steadily* → no layer bias; Revenue Engine default depth
- *Flat for a while* → Revenue Engine (Strong: reach problem, per map anchor "flat = not reaching new people")
- *Goes up and down* → Revenue Engine (Strong: unstable lead flow, per map anchor "inconsistent = pipeline problem")
- *Lower than it should be* → Revenue Engine (Strong) + Direction (Weak: self-worth/pricing floor question)
- *Growing but not enough profit* → Financial Health (Strong: literal margin problem, per map anchor "healthy top line + no profit")

### Q7 — Where does most of your revenue come from?
- *Repeat clients* → Revenue Engine with existing-customer emphasis; Owner Capacity (Weak: retention is operational)
- *New clients every time* → Revenue Engine (Strong, acquisition focus) + flag: no repeat business is itself a diagnosis
- *One or two main clients* → Revenue Engine + Financial Health (Strong, concentration risk — cross-layer concern earning a dedicated slot even without other signals)
- *Walk-in / online traffic* → Revenue Engine (Marketing + Sales conversion at point of contact)
- *Referrals / word of mouth* → Revenue Engine with Partners referral half emphasis (Strong)

### Q8 — How many products or services do you sell?
- *Just one* → Products front-facing can go deep safely
- *2 to 5* → default depth
- *6 to 10* → Products front-facing needs triage question first ("which one drives most revenue") before going deep
- *More than 10* → same as above, plus flag catalog complexity for Owner Capacity check

### Q9 — On a typical workday, what does most of your time go toward?
- *Delivering the service/product* → Owner Capacity (Medium: owner-as-worker) — but per map, cross-check with Q4/Q16 before activating over Revenue Engine
- *Finding and talking to new clients* → Revenue Engine, Sales bucket emphasis
- *Managing operations, admin, logistics* → Owner Capacity (Medium)
- *Managing a team* → Owner Capacity (Strong) — cross-check with Q3; only Strong if team ≥ 2
- *A mix of everything* → Owner Capacity (Medium: classic owner-bottleneck signal) — still cross-check with Revenue Engine per map

### Q10 — Main way of getting new clients or customers in the last 6 months?
- *Social media* → Revenue Engine, Marketing + Content co-fire (Strong)
- *Word of mouth* → Revenue Engine with Partners referral half emphasis (Strong)
- *Existing network* → Revenue Engine + flag: cold acquisition not figured out yet
- *Paid ads* → Revenue Engine, Marketing + Financial Health (Medium: ad spend efficiency has cost implications)
- *Haven't been actively trying* → Revenue Engine (Strong, urgent — overrides Q4 if Q4 wasn't Sales/Marketing)
- *Struggling to get new clients consistently* → Revenue Engine (Strong, urgent — same override)

### Q11 — How did you get most of your followers on Instagram?
- *Organic — posting regularly* → Revenue Engine, Content bucket emphasis
- *Collaborating with influencers / accounts* → Revenue Engine, Marketing partnership emphasis
- *Boosting posts or Meta ads* → Revenue Engine, Marketing paid emphasis + Financial Health (Weak: ad spend)
- *Mostly friends and family* → IG treated as unproven for this business; deprioritize IG-specific Content questions unless Q13 overrides
- *Haven't really tried to grow it* → same, deprioritize IG-specific questions

### Q12 — Are you getting clients or customers from Instagram?
- *Yes, main source* → Revenue Engine, Marketing + Sales cross-bucket emphasis on scaling what works
- *Sometimes, not consistently* → Revenue Engine, Marketing consistency/system questions
- *Rarely, post but doesn't convert* → Revenue Engine (Strong signal for offer clarity/CTA questions in Marketing, not more Content questions)
- *No, don't use for business* → suppress IG-specific questions unless Q13 overrides

### Q13 — How do you see Instagram in your business going forward?
- *Big priority* → Revenue Engine, Marketing + Content activate even if Q11/Q12 show weak current results (stated intent overrides current-state)
- *Useful but not main focus* → Marketing/Content at default depth only
- *Not sure, haven't seen results* → Revenue Engine, Marketing diagnosis emphasis (why isn't it working)
- *Not relevant for my type of business* → suppress IG/Content questions entirely regardless of other IG-related signals (respect the stated no)

### Q14 — Who are most of your customers?
- *Own community (cultural/ethnic/religious)* → Revenue Engine, ICP emphasis on community-driven buying patterns
- *A general mix* → Revenue Engine, ICP segmentation questions needed ("everyone" isn't workable)
- *Local people* → Revenue Engine, ICP + geography constraint
- *Mostly businesses (B2B)* → Revenue Engine, but Sales bucket takes a B2B question path (sales cycle, decision-makers) rather than B2C

### Q15 — Is that who you actually want to be serving?
- *Yes, exactly who I want* → Revenue Engine, ICP can go deep on current audience
- *Not quite* → Revenue Engine (Strong: gap signal — ICP redefinition becomes a top Wave 2 priority regardless of other signals)
- *No, different customer* → Revenue Engine (Strong, same as above)
- *Haven't really thought about it* → Revenue Engine + Direction (Weak — foundational ICP + who they want to serve)

### Q16 — What do you think is the main thing limiting your growth right now?
- *Not enough clients or customers* → Revenue Engine (Strong)
- *Not enough time / at capacity* → Revenue Engine first, per map anchor. Owner Capacity only if Revenue Engine check comes back negative in later waves
- *Not enough money to invest in growth* → Revenue Engine (vague "money" reading) OR Financial Health if paired with Q20 = breaking even
- *Not the right team or people* → Owner Capacity (Strong) — cross-check Q3
- *No clear strategy* → Direction (Strong: hold back tactical questions until direction exists)
- *Pricing too low but afraid to raise it* → Revenue Engine, pricing-confidence emphasis (emotional, not purely analytical) + Competitors lens

### Q17 — When you imagine your business two years from now — what does the win look like?
- *More revenue and profit, same business* → Revenue Engine + Financial Health (Medium)
- *Runs without me* → Owner Capacity (Strong) + Revenue Engine
- *Recognizable brand with real market presence* → Revenue Engine, Marketing + Content emphasis
- *Expanded — more locations/services/markets* → Owner Capacity (Strong: scalability infrastructure) + Financial Health (Medium)
- *Just surviving right now* → Direction flag: suppress all long-horizon questions across every layer, tactical Revenue Engine only

### Q18 — What are you actually building toward?
- *Need income fast* → Revenue Engine, short-horizon only + Financial Health (Medium if any distress signal); suppress long-arc Vision questions
- *Stable financial freedom in 1–2 years* → default across layers
- *Long-term compounding* → Direction can go deeper; patient questions welcome
- *Not sure yet* → Direction (Strong: clarify before other layers get tactical)

### Q19 — If someone handed you $20,000 for your business today — where would it go?
- *Marketing and ads* → Revenue Engine (Strong, stated bucket by instinct)
- *Hiring someone* → Owner Capacity (Strong, stated bucket by instinct)
- *Inventory, equipment, upgrading* → Owner Capacity (Products back-facing) + Revenue Engine (Products front-facing if it changes what's sold)
- *Paying down debt or stability first* → Financial Health (Strong, defensive posture)
- *I'd save it — not sure* → Direction (Strong, urgent: real blocker may be lack of plan, not lack of resources)
- *Honestly not sure — that's part of the problem* → Direction (Strong, same)

### Q20 — What is your average monthly profit after all expenses?
- *Not sure / don't separate revenue-profit* → Financial Health (Strong, urgent — money literacy basics before anything else)
- *Breaking even or losing money* → Financial Health (Strong, urgent — top priority regardless of other signals, per map anchor)
- *Between $1,000 and $5,000* → default
- *Between $5,000 and $15,000* → default
- *Between $15,000 and $50,000* → Financial Health can go medium depth (allocation, reinvestment)
- *More than $50,000* → Financial Health can go deeper (allocation, tax structure)

### Q21 — Which AI tool do you use the most?
- *Any tool named* → Tools bucket in whichever layer is active (Weak signal only — feeds Tools dimension, doesn't drive layer selection)
- *I don't use AI tools* → product-tone signal only (assume less AI fluency in chat), no bucket direction

---

## Phase 5 — Closing Question

### "How can I help you most right now? If I could take one thing off your plate starting today — what would it be?"
Open field. Read as free-text signal, not table lookup — but the topic they name should activate the corresponding layer strongly, treated as equivalent to a Strong Q4 signal:
- Content/marketing/customer topics → Revenue Engine
- Team/delegation/capacity topics → Owner Capacity
- Money/profit/cost topics → Financial Health
- Direction/strategy/what-to-focus-on topics → Direction

If the answer is emotional but non-directional ("I'm tired, I don't know") — treat as Direction (Medium) plus a note for chat to open gently, not tactically.

---

## Cross-signal rules

- **Q4 vs Q16 disagreement is itself a signal.** Q4 asks where they *want* help, Q16 asks what they think is *actually* stopping them. When they name different layers, that misalignment is worth surfacing in Wave 2 questions or chat — not just resolved by picking one.
- **Q4/Q16 vs Q9/Q10 contradiction overrides Q4.** If Q4 says "Marketing" but Q10 shows they haven't been trying to get clients at all, Revenue Engine is urgent regardless of what they said they wanted help with. "Haven't been trying" and "struggling" always upgrade Revenue Engine to Strong.
- **Owner Capacity requires either explicit intent (Q4=Hiring, Q17=runs-without-me, Q19=hiring) or concrete state (Q3 ≥ 2, Q9=managing team).** Do not activate Owner Capacity on "not enough time" alone (Q16). Per map anchor.
- **Financial Health requires concrete literal signal (Q5=don't-track, Q6=growing-but-no-profit, Q20=breaking-even, Q4=Finance, Q19=paying-down-debt).** Do not activate on vague money pain alone.
- **Q15 = "not quite" or "no"** is a special case: pushes ICP redefinition into Revenue Engine's Wave 2 priorities regardless of other signals. A business marketing to the wrong audience needs that fixed before Marketing/Content questions become useful.
