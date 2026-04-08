

## Updated Self-Care Quiz: 4 Smart Questions + Loved Ones Category

### Two additions to the previous plan

**A. Add "Loved Ones" category throughout the quiz**
The `LovedOnes` category already has the `self-care` tag in the database, but it's completely absent from the quiz logic. We need to weave it in everywhere.

**B. Add a 4th dynamic question that adapts based on Q1-Q3 answers**
After the user answers Q1-Q3, we compute their preliminary top gap area client-side, then show a targeted follow-up question that digs deeper into that specific area. This gives the AI much better signal for personalized diagnosis.

---

### How the Dynamic Q4 Works

After Q1 (weighing), Q2 (neglecting), Q3 (win), we run the same scoring logic client-side to find the user's top gap cluster. Then we show ONE of 4 variant questions based on which cluster scored highest:

```text
Cluster: Body (sleep, nutrition, movement, Exercise)
→ "What's your biggest body struggle?"
  - Can't fall asleep / stay asleep
  - No energy to exercise
  - Eating poorly or skipping meals
  - Just feeling physically run down

Cluster: Mind (calm, Presence, gratitude, self-kindness)
→ "What does your mind need most?"
  - A way to quiet racing thoughts
  - Permission to rest without guilt
  - More moments of gratitude
  - Reconnecting with myself

Cluster: Environment (TidyUp, productivity, hygiene, Evening)
→ "What's slipping in your daily life?"
  - My space is a mess
  - I have no real routine
  - I keep skipping basic self-care
  - My evenings are chaotic

Cluster: People (connection, LovedOnes)
→ "What's missing in your relationships?"
  - Quality time with loved ones
  - Feeling seen and supported
  - Making effort to stay in touch
  - Taking care of someone I love
```

The Q4 answer adds weight (+3) to specific sub-categories within the cluster, helping the AI distinguish between e.g. "sleep" vs "nutrition" within the Body cluster.

---

### Flow Summary (8 screens)

```text
1. What's Missing? (intro)
2. Your problem isn't productivity (hook + badges)
3. What's weighing on you? (single-select, 5 options)
4. Which have you been neglecting? (multi-select, 9 options — adds LovedOnes)
5. What would feel like a win? (single-select, 5 options)
6. [Dynamic] Deeper question based on top cluster (single-select, 4 options)
7. Diagnosis (AI analysis)
8. Suggested Habits
```

---

### Files to Modify

**1. `src/data/onboarding-flows/selfcare-quiz.ts`**
- Remove old Q steps (sc-drain, sc-morning, sc-skipping, sc-neglecting, sc-proud)
- Add Q1 `sc-weighing`: 5 options including "Everything feels messy"
- Add Q2 `sc-neglecting`: 9 multi-select options (adds "Caring for loved ones 🥰" → LovedOnes)
- Add Q3 `sc-win`: 5 options (adds "Reconnecting with people" → connection, LovedOnes)
- Add Q4 `sc-deeper`: new step type `dynamic-single-select` with 4 variant question sets stored in step data
- Update hook badges: add `{ emoji: '🥰', label: 'Loved Ones' }`, rename Night → Evening

**2. `src/types/onboarding.ts`**
- Add `'dynamic-single-select'` to `OnboardingStepType`
- Add optional `variants` field to `OnboardingStep` for the dynamic question data

**3. `src/components/admin/onboarding/OnboardingStepRenderer.tsx`**
- Add a `DynamicSingleSelectScreen` renderer for `dynamic-single-select` type
- This component receives `answers` prop, runs client-side scoring to pick top cluster, then renders the matching variant as a normal single-select screen
- Uses `BottomSheetWrapper` layout (same as other questions)

**4. `src/components/app/selfcare-quiz/SelfCareDiagnosisStep.tsx`**
- Add `LovedOnes` to `CATEGORY_EMOJI` (`🥰`) and `CATEGORY_LABELS` (`Loved Ones`)
- Add `easy-win` to `CATEGORY_EMOJI` (`✨`) and `CATEGORY_LABELS` (`Easy Win`)
- Rename `Night` label to `Evening`
- Update `ALL_CATEGORIES` to include new entries

**5. `supabase/functions/selfcare-diagnosis/index.ts`**
- Replace old maps (DRAIN_MAP, MORNING_MAP, SKIP_MAP, PROUD_MAP) with new maps:
  - `WEIGHING_MAP` (5 entries, weight 3)
  - `NEGLECTING_MAP` (9 entries including LovedOnes, weight 3)
  - `WIN_MAP` (5 entries, weight 2)
  - `DEEPER_MAP` (16 entries across 4 clusters, weight 3)
- Update answer key references to new step IDs
- Add `LovedOnes` handling throughout

**6. `src/components/app/selfcare-quiz/SelfCareSuggestionsStep.tsx`**
- Add `LovedOnes` to any category display maps if present

---

### Client-Side Scoring for Dynamic Q4

A small utility function (reused in both the dynamic question renderer and optionally in diagnosis fallback):

```typescript
function computeTopCluster(answers: OnboardingAnswers): string {
  // Same WEIGHING/NEGLECTING/WIN maps as edge function
  // Score categories, group into clusters:
  //   body: [sleep, nutrition, movement, Exercise]
  //   mind: [calm, Presence, gratitude, self-kindness]
  //   environment: [TidyUp, productivity, hygiene, Evening]
  //   people: [connection, LovedOnes]
  // Return cluster with highest combined score
}
```

This lives in a shared util file `src/utils/selfcare-scoring.ts` imported by both the dynamic question renderer and the diagnosis fallback.

