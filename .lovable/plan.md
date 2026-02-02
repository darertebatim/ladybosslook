
# Simora Product Pivot: Complete Strategic Proposal

## Document Purpose
This document captures the complete philosophy, strategy, and implementation roadmap for transforming Simora from a productivity-focused habit tracker into a **"Strength Companion"** centered on building self-trust through rituals.

---

## Part 1: Strategic Analysis

### The Core Problem with Current Approach
The existing app follows the standard habit-tracker model:
- 249 tasks in `admin_task_bank` across 12 categories
- Streak-based motivation (current streak counts, "days in a row")
- Productivity-focused language ("Complete task", "Daily habits")
- Guilt-inducing patterns (missed days, broken streaks)

### The Pivot Philosophy: "Return Without Shame"
**Central Insight**: Women don't need another app that makes them feel bad about themselves. They need a companion that helps them rebuild trust with themselves after life inevitably gets in the way.

**Core Shift**: From "Did you do the thing?" to "You're here. That matters."

---

## Part 2: The New Framework

### 2.1 Terminology Changes

| Old Term | New Term | Rationale |
|----------|----------|-----------|
| Tasks | Rituals | Rituals are sacred, intentional acts vs. checkboxes |
| Habits | Practices | Practices evolve; habits imply obligation |
| Streaks | Momentum | Momentum can pause and resume without "breaking" |
| Complete | Honor | You "honor" a ritual, not "complete" it |
| Missed | Paused | No judgment, just acknowledgment |

### 2.2 Five Ritual Categories (Replacing 12 Generic Categories)

1. **Pause Rituals** (Emotional Regulation)
   - Breathing exercises
   - Body scans
   - "Name how I'm feeling"
   
2. **Micro Follow-Throughs** (Building Trust)
   - Ultra-small commitments you can't fail
   - "Get out of bed" → "Stand up for 10 seconds"
   - Designed to prove "I do what I say I'll do"

3. **Choice Awareness Rituals** (Agency)
   - "Today I choose to..." declarations
   - Conscious decision-making moments
   - Boundary-setting practices

4. **Gentle Completions** (Self-Kindness)
   - Self-care without guilt
   - Permission-giving rituals
   - "I gave myself permission to rest"

5. **Strength Reminders** (Identity)
   - "I am the woman who..." affirmations
   - Proof collection (journaling wins)
   - Pattern recognition of personal strength

### 2.3 "Return Without Shame" Logic

When a user returns after 3+ days of inactivity:

```text
IF last_active_date < (today - 3 days):
  1. Show "Welcome Back" screen (NOT streak-loss screen)
  2. Message: "You're here. That's what matters."
  3. Offer: "Start fresh today" (reset daily view)
  4. NO mention of missed days or broken streaks
  5. Optional: Gentle question "What brought you back?"
```

**Technical Implementation**:
- Track `last_active_date` in user profile
- Replace StreakCelebration with "Return Celebration"
- Remove streak-loss notifications
- Add `return_count` field (celebrate returns, not streaks)

---

## Part 3: What This Means for the Codebase

### 3.1 UI Language Surgery (Phase 1)

**Files requiring terminology updates**:
- `AppInspire.tsx`: "Routines" → stays as "Rituals" section
- `TaskTemplateCard.tsx`: Update labels
- `StreakCelebration.tsx`: Complete redesign needed
- Navigation labels throughout

**Estimated scope**: ~15-20 files with text changes

### 3.2 Ritual Bank Curation (Phase 2)

**Current state**: 249 active tasks across 12 categories
**Target state**: 25-30 curated "Core Rituals" + archived rest

**Recommendation**:
- Mark ~220 tasks as `is_active: false` (archive, don't delete)
- Elevate 25-30 high-impact rituals aligned with 5 new categories
- Keep existing user data intact (no breaking changes)

**Core Rituals to Elevate** (examples):
- "Take 3 deep breaths" → Pause Ritual
- "Name how I'm feeling" → Pause Ritual  
- "Stand up for 10 seconds" → Micro Follow-Through
- "Thank myself for one thing" → Strength Reminder
- "Write 3 things I'm grateful for" → Strength Reminder

### 3.3 Database Schema Implications

**No breaking changes required**. Additions only:

```sql
-- Add to profiles table
ALTER TABLE profiles ADD COLUMN last_active_date date;
ALTER TABLE profiles ADD COLUMN return_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN strength_archetype text;

-- Future: Strength Vault
CREATE TABLE strength_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  evidence_type text, -- 'ritual', 'journal', 'manual'
  created_at timestamptz DEFAULT now()
);
```

### 3.4 Features to Remove/Hide

| Feature | Action | Rationale |
|---------|--------|-----------|
| Streak counter | Remove from UI | Shame-based motivation |
| "Missed days" messaging | Remove | Judgment language |
| Daily completion % | Replace with "Rituals honored" | Softer framing |
| Streak celebration popup | Replace with "Return celebration" | Different trigger |

### 3.5 Features to Preserve

| Feature | Status | Notes |
|---------|--------|-------|
| Audio playlists | Keep as-is | Core value |
| Journal | Keep, rename prompts | Align with "Strength Reminder" |
| Breathing exercises | Keep as-is | Core "Pause Ritual" |
| Water tracking | Keep as-is | Simple utility |
| Period tracker | Keep as-is | Practical feature |
| Programs/Courses | Keep as-is | Revenue driver |

---

## Part 4: Future Vision (Don't Build Yet)

### 4.1 Strength Archetypes (V2+)

Behavioral patterns that reveal themselves over time:

- **The Steady One**: Consistent small rituals
- **The Returner**: Keeps coming back despite breaks  
- **The Depth-Seeker**: Journals extensively
- **The Calm-Builder**: Focuses on breathing/pause rituals
- **The Connector**: Engages with community features

**Implementation complexity**: High (requires ML pattern detection)
**Recommendation**: Save for V2.0

### 4.2 Proof of Strength Vault (V2+)

A personal collection of evidence that "I am strong":
- Auto-collected from journal entries
- Manual additions ("Today I...")
- Surfaced during difficult moments

**Implementation complexity**: Medium
**Recommendation**: Save for V1.5

### 4.3 AI Strength Coach (V3+)

Contextual encouragement based on patterns:
- "I notice you've returned 5 times this month. That's resilience."
- "Your pause rituals have increased. You're learning to regulate."

**Implementation complexity**: Very High (requires AI integration)
**Recommendation**: Save for V3.0

---

## Part 5: Phased Implementation Roadmap

### Phase 0: Pre-Pivot (Current)
Complete 2-3 features the user wants to add first, then begin pivot.

### Phase 1: Language Surgery (1-2 weeks)
- Rename "Tasks" to "Rituals" throughout UI
- Update 25-30 ritual titles with new voice
- Remove streak-shame language
- Update empty states and error messages

### Phase 2: Return Without Shame (1 week)
- Implement `last_active_date` tracking
- Build "Welcome Back" flow for 3+ day absence
- Replace StreakCelebration with ReturnCelebration
- Add `return_count` celebration logic

### Phase 3: Ritual Bank Curation (1 week)
- Archive 220+ tasks (set `is_active: false`)
- Remap 12 categories to 5 new categories
- Update admin interface for new category structure
- Quality-check remaining 25-30 core rituals

### Phase 4: Observation Period (2-4 weeks)
- Gather user feedback
- Monitor engagement patterns
- Refine ritual language based on response
- Plan V2 features based on learnings

---

## Part 6: Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Users confused by terminology change | Medium | Gradual rollout, in-app explanation |
| Engagement drops without streaks | Medium | A/B test before full removal |
| Archived tasks were popular | Low | Data-driven curation, easy restore |
| Feature creep (building V2 too early) | High | Strict phase discipline |
| App feels "less feature-rich" | Medium | Quality > quantity messaging |

---

## Part 7: Success Metrics

### Phase 1 Success Indicators
- No increase in support tickets about confusion
- Positive feedback on new language (manual review)

### Phase 2 Success Indicators
- 30%+ of returning users (after 3+ day gap) engage same day
- Decrease in app uninstalls after absence periods

### Phase 3 Success Indicators
- 80%+ of active users engage with curated rituals
- No complaints about missing archived tasks

### Long-term Vision Metrics
- Retention after 30-day gap: Target 40%+ (vs. industry ~10%)
- User sentiment: "This app gets me" (qualitative)
- Return rate: Users who leave and come back (celebrate this!)

---

## Summary

This pivot transforms Simora from another productivity app into a unique "Strength Companion" that:

1. **Welcomes you back** instead of shaming absence
2. **Uses ritual language** that feels sacred, not obligatory
3. **Focuses on 25-30 high-impact practices** instead of overwhelming with 250 options
4. **Builds self-trust** through micro follow-throughs
5. **Delays complex features** until core philosophy is proven

The technical implementation is deliberately conservative—mostly UI language changes and database additions, no breaking schema changes. This allows rapid iteration while protecting existing user data.

---

*Document created: February 2026*
*Status: Ready for review before implementation*
*Next step: User to specify 2-3 features to build before pivot begins*
