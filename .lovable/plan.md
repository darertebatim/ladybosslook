
# Pre-Pivot Feature: "Name Your Emotion" Tool

## Overview

Building a standalone wellness tool inspired by Finch's emotion-naming feature. This is a **guided, multi-step flow** that helps users identify and articulate their feelings with increasing specificity. This aligns perfectly with the upcoming pivot philosophy of building self-awareness and emotional literacy.

---

## The User Flow

```text
[Intro Screen] → [Valence: Pleasant/Neutral/Unpleasant] → [Category] → [Specific Emotion] → [Context + Notes] → [Confirmation]
```

### Step-by-Step Breakdown

**Step 1: Intro Screen**
- Full-screen with soft background color
- Icon/illustration representing emotions
- Title: "Name Your Emotion"
- Description: "Sometimes, what we feel is not so obvious. Naming the emotion can help gain better control and understanding of ourselves."
- "Start" button

**Step 2: Valence Selection**
- "Start by taking a minute to pause and notice what you are feeling"
- Three large pill buttons stacked vertically:
  - Pleasant (warm yellow/orange)
  - Neutral (soft gray)
  - Unpleasant (muted purple)
- Tapping advances to next step

**Step 3: Category Drill-down**
- Shows selected valence on left side (highlighted)
- Shows 6-9 sub-categories on right side as pills
- Categories vary by valence:
  - **Pleasant**: Optimistic, Accepted, Content, Powerful, Interested, Playful, Proud, Peaceful, Trusting
  - **Neutral**: Bored, Busy, Stressed, Tired, Numb (with "More..." option)
  - **Unpleasant**: Sad, Angry, Fearful, Down, Surprised, Disgusted

**Step 4: Specific Emotion**
- Similar layout with selected category on left
- More specific emotions on right:
  - **Sad**: Lonely, Vulnerable, Depressed, Hurt, Despair, Guilty, More...
  - **Angry**: Mad, Aggressive, Frustrated, Bitter, Distant, Critical, More...
  - **Fearful**: Scared, Anxious, Insecure, Weak, Rejected, Threatened, More...
  - etc.

**Step 5: Context & Notes**
- "What made you feel [selected emotion]?"
- Context chips in 3-column grid: Family, Myself, Health, Pets, Co-workers, Friends, Partner, Acquaintances, Work, Home, School, Hobby, Commuting, Outside
- Multi-select allowed
- Optional text area: "Add details or more reflection..."
- "Save" button

**Step 6: Confirmation**
- Celebratory screen
- "You are getting closer to understanding yourself even more!"
- "Your emotion has been saved in your history."
- "Done" button → returns to home or emotions history

---

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/AppEmotion.tsx` | Main page component (handles routing/state) |
| `src/components/emotion/EmotionIntro.tsx` | Intro screen with Start button |
| `src/components/emotion/EmotionValence.tsx` | Pleasant/Neutral/Unpleasant selection |
| `src/components/emotion/EmotionCategory.tsx` | Category drill-down step |
| `src/components/emotion/EmotionSpecific.tsx` | Specific emotion selection |
| `src/components/emotion/EmotionContext.tsx` | Context chips + notes + save |
| `src/components/emotion/EmotionComplete.tsx` | Completion celebration screen |
| `src/lib/emotionData.ts` | All emotion hierarchies and context options |
| `src/hooks/useEmotionLogs.tsx` | CRUD operations for emotion entries |

### Database Schema

New table: `emotion_logs`

```sql
CREATE TABLE emotion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  valence text NOT NULL, -- 'pleasant', 'neutral', 'unpleasant'
  category text NOT NULL, -- e.g., 'sad', 'angry', 'optimistic'
  emotion text NOT NULL, -- specific emotion e.g., 'lonely', 'frustrated'
  contexts text[] DEFAULT '{}', -- array of context selections
  notes text, -- optional reflection text
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emotion_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs
CREATE POLICY "Users can view own emotion logs" ON emotion_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emotion logs" ON emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotion logs" ON emotion_logs
  FOR DELETE USING (auth.uid() = user_id);
```

### Emotion Hierarchy Data Structure

```typescript
// src/lib/emotionData.ts

export type Valence = 'pleasant' | 'neutral' | 'unpleasant';

export interface EmotionCategory {
  value: string;
  label: string;
  emotions: { value: string; label: string }[];
}

export const VALENCE_OPTIONS = [
  { value: 'pleasant', label: 'Pleasant', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'neutral', label: 'Neutral', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'unpleasant', label: 'Unpleasant', color: 'bg-violet-100 text-violet-700 border-violet-200' },
];

export const EMOTION_CATEGORIES: Record<Valence, EmotionCategory[]> = {
  pleasant: [
    { 
      value: 'optimistic', 
      label: 'Optimistic',
      emotions: [
        { value: 'hopeful', label: 'Hopeful' },
        { value: 'inspired', label: 'Inspired' },
        { value: 'eager', label: 'Eager' },
        // ... more
      ]
    },
    { 
      value: 'content', 
      label: 'Content',
      emotions: [
        { value: 'fulfilled', label: 'Fulfilled' },
        { value: 'calm', label: 'Calm' },
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'balanced', label: 'Balanced' },
        // ... more
      ]
    },
    // ... more categories
  ],
  neutral: [ /* ... */ ],
  unpleasant: [
    {
      value: 'sad',
      label: 'Sad',
      emotions: [
        { value: 'lonely', label: 'Lonely' },
        { value: 'vulnerable', label: 'Vulnerable' },
        { value: 'depressed', label: 'Depressed' },
        { value: 'hurt', label: 'Hurt' },
        { value: 'despair', label: 'Despair' },
        { value: 'guilty', label: 'Guilty' },
        // ... more
      ]
    },
    // ... more categories
  ],
};

export const CONTEXT_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'myself', label: 'Myself' },
  { value: 'health', label: 'Health' },
  { value: 'pets', label: 'Pets' },
  { value: 'coworkers', label: 'Co-workers' },
  { value: 'friends', label: 'Friends' },
  { value: 'partner', label: 'Partner' },
  { value: 'acquaintances', label: 'Acquaintances' },
  { value: 'work', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'school', label: 'School' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'commuting', label: 'Commuting' },
  { value: 'outside', label: 'Outside' },
];
```

### Routing Updates

In `App.tsx`:
```tsx
// Add lazy import
const AppEmotion = lazy(() => import("@/pages/app/AppEmotion"));

// Add route (full-screen, outside AppLayout)
<Route path="/app/emotion" element={<ProtectedRoute><AppEmotion /></ProtectedRoute>} />
```

### ToolsConfig Update

Update `src/lib/toolsConfig.ts` to make the Emotions tool visible:
```typescript
{
  id: 'emotions',
  name: 'Emotions',
  icon: 'Heart', // or 'Sparkles' for a softer feel
  bgColor: 'bg-[#EDE9FE]',
  iconColor: 'text-violet-600',
  route: '/app/emotion',
  description: 'Name your feelings',
  comingSoon: false, // ← Enable
  hidden: false,     // ← Make visible
},
```

---

## UI Design Notes

### Visual Style (Matching Finch)
- Clean, minimal white background for selection screens
- Soft rounded pill buttons for emotion options
- Left-side "breadcrumb" showing previous selections
- Smooth transitions between steps
- Haptic feedback on selections
- Green "Save" button at the bottom of context screen
- Celebratory completion screen with soft animation

### Color Coding
- **Pleasant**: Warm yellows/oranges (bg-amber-100, text-amber-700)
- **Neutral**: Soft grays/blues (bg-slate-100, text-slate-600)
- **Unpleasant**: Muted purples/blues (bg-violet-100, text-violet-700)

### Animations
- Step transitions with slide animation
- Button press feedback
- Completion screen with subtle bounce/celebration

---

## Future Enhancements (Not in V1)

1. **Emotion History View**: See past entries in a timeline or calendar view
2. **Pattern Recognition**: "You tend to feel anxious on Mondays"
3. **Integration with Journal**: Auto-suggest starting a journal entry after logging emotion
4. **Mood Trends**: Weekly/monthly charts showing emotional patterns
5. **Connection to Pivot**: Link emotions to "Strength Reminders" - "Even when you felt anxious, you still showed up"

---

## Implementation Order

1. Create database table `emotion_logs` with RLS policies
2. Create `src/lib/emotionData.ts` with full emotion hierarchy
3. Create `src/hooks/useEmotionLogs.tsx` for CRUD operations
4. Build components in order:
   - `EmotionIntro.tsx`
   - `EmotionValence.tsx`
   - `EmotionCategory.tsx`
   - `EmotionSpecific.tsx`
   - `EmotionContext.tsx`
   - `EmotionComplete.tsx`
5. Create main page `AppEmotion.tsx` with step state management
6. Add route in `App.tsx`
7. Update `toolsConfig.ts` to make visible
8. Test end-to-end flow

---

## Alignment with Pivot Philosophy

This feature aligns perfectly with the "Strength Companion" vision:
- **Pause Ritual**: The intro encourages users to "take a minute to pause"
- **Self-Awareness**: Naming emotions builds emotional literacy
- **No Judgment**: All emotions are valid (Pleasant, Neutral, Unpleasant - not Good/Bad)
- **Context Understanding**: Helps users understand triggers
- **Data for Future Features**: Emotion logs can feed into "Strength Vault" evidence

---

## Summary

This is a well-scoped pre-pivot feature that:
- Adds immediate user value
- Uses existing UI patterns (full-screen tool like Breathe)
- Creates foundation for future emotional intelligence features
- Aligns with the pivot philosophy of self-understanding without shame
- Estimated effort: 2-3 focused implementation sessions
