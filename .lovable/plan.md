
# UI Redesign: Name Your Emotion (Finch-Style)

## Overview

Complete redesign of the emotion selection flow to match Finch's two-column, progressive-drilling UI pattern. The key change is moving from **separate pages per step** to a **single-screen column layout** where selections expand to the right.

---

## Current vs. Finch Comparison

| Aspect | Current Implementation | Finch Design |
|--------|----------------------|--------------|
| Layout | Separate pages for each step | Single screen with columns |
| Navigation | Page-by-page steps | Drill right, back collapses |
| Valence | Full-width stacked buttons | Small pills on left column |
| Categories | Flex-wrap grid on new page | Vertical list on right column |
| Specific emotions | Flex-wrap on new page | Vertical list, replaces categories |
| Sub-sub emotions | Not implemented | 3rd level for some unpleasant emotions |
| Scrolling | Required on many screens | Minimal/no scroll |
| Colors | Uniform per valence | Unique colors per category in unpleasant |

---

## New UI Architecture

### Single-Screen Column Layout

```text
+--------------------------------------------------+
|  < (back)           Try to dig a little deeper   |
+--------------------------------------------------+
|                                                  |
|                        [ Optimistic ]            |
|                        [ Accepted   ]            |
|  [ Pleasant  ]         [ Content    ]            |
|  [ Neutral   ]         [ Powerful   ]            |
|  [ Unpleasant]         [ Interested ]            |
|                        [ Playful    ]            |
|                        [ Proud      ]            |
|                        [ Peaceful   ]            |
|                        [ Trusting   ]            |
|                                                  |
+--------------------------------------------------+
```

### Column Expansion Flow

1. **Initial**: Show 3 valence buttons (left column only)
2. **After selecting valence**: Keep valence buttons (selected highlighted), show categories in middle column
3. **After selecting category**: Show specific emotions in right column (or replace middle column)
4. **For Unpleasant emotions**: Some have a "More..." button that reveals additional sub-sub emotions

---

## Implementation Changes

### 1. New Combined Selection Component

Create `EmotionSelector.tsx` - replaces separate Valence/Category/Specific components:

```typescript
interface EmotionSelectorProps {
  onComplete: (valence: Valence, category: string, emotion: string) => void;
  onBack: () => void;
}
```

**State Machine:**
- `depth: 0` = Only valence shown
- `depth: 1` = Valence + categories (for Pleasant/Neutral, or categories for Unpleasant)
- `depth: 2` = Valence + category + emotions
- `depth: 3` = Valence + category + emotion + sub-emotions (only for some Unpleasant)

### 2. Layout Structure (No Scroll)

```jsx
<div className="h-full flex flex-col bg-[#F8F9FA]">
  {/* Header - fixed */}
  <header className="shrink-0 flex items-center px-4 py-3">
    <BackButton />
    <h1>Try to dig a little deeper</h1>
  </header>
  
  {/* Content - flex columns, centered vertically */}
  <div className="flex-1 flex items-center justify-center px-4 gap-6">
    {/* Column 1: Valence */}
    <div className="flex flex-col gap-3">
      {VALENCE_OPTIONS.map(v => <ValencePill />)}
    </div>
    
    {/* Column 2: Categories (conditionally shown) */}
    {selectedValence && (
      <div className="flex flex-col gap-2">
        {categories.map(c => <CategoryPill />)}
      </div>
    )}
    
    {/* Column 3: Emotions (conditionally shown) */}
    {selectedCategory && (
      <div className="flex flex-col gap-2">
        {emotions.map(e => <EmotionPill />)}
      </div>
    )}
  </div>
</div>
```

### 3. Updated Color System

Finch uses distinct colors for each emotion category. New color mapping:

**Pleasant (warm oranges/yellows):**
- Optimistic, Accepted, Content, Powerful, etc.: `bg-[#FFF3E0] text-[#E65100]`

**Neutral (blue-grays):**
- Bored, Busy, Stressed, Tired, Numb: `bg-[#E3F2FD] text-[#1565C0]`

**Unpleasant (varied by category):**
- Sad: `bg-[#CFD8DC] text-[#37474F]` (blue-gray)
- Angry: `bg-[#FFCDD2] text-[#C62828]` (red tint)
- Fearful: `bg-[#455A64] text-white` (dark slate - solid bg)
- Down: `bg-[#ECEFF1] text-[#546E7A]` (light gray)
- Surprised: `bg-[#FCE4EC] text-[#AD1457]` (pink)
- Disgusted: `bg-[#EFEBE9] text-[#5D4037]` (brown tint)

### 4. Updated Data Structure

Add sub-sub emotions for "Unpleasant" categories and "More..." expansion:

```typescript
interface EmotionCategory {
  value: string;
  label: string;
  color: { bg: string; text: string; bgActive: string };
  emotions: EmotionOption[];
  subEmotions?: Record<string, EmotionOption[]>; // For "Lonely" → [Isolated, Abandoned, etc.]
}
```

**Example - Sad category with nested structure:**
```typescript
{
  value: 'sad',
  label: 'Sad',
  color: { bg: 'bg-slate-200', text: 'text-slate-700', bgActive: 'bg-slate-500' },
  emotions: [
    { value: 'lonely', label: 'Lonely', hasSubEmotions: true },
    { value: 'vulnerable', label: 'Vulnerable' },
    { value: 'depressed', label: 'Depressed' },
    { value: 'hurt', label: 'Hurt' },
    { value: 'despair', label: 'Despair' },
    { value: 'guilty', label: 'Guilty', hasSubEmotions: true },
  ],
  subEmotions: {
    lonely: [
      { value: 'isolated', label: 'Isolated' },
      { value: 'abandoned', label: 'Abandoned' },
      { value: 'forlorn', label: 'Forlorn' },
      { value: 'alienated', label: 'Alienated' },
      { value: 'nostalgic', label: 'Nostalgic' },
      { value: 'victimized', label: 'Victimized' },
      { value: 'fragile', label: 'Fragile' },
      { value: 'lost', label: 'Lost' },
    ],
    guilty: [
      { value: 'embarrassed', label: 'Embarrassed' },
      { value: 'disappointed', label: 'Disappointed' },
      { value: 'powerless', label: 'Powerless' },
      { value: 'grief', label: 'Grief' },
      { value: 'trapped', label: 'Trapped' },
      { value: 'discouraged', label: 'Discouraged' },
      { value: 'ashamed', label: 'Ashamed' },
      { value: 'remorseful', label: 'Remorseful' },
    ],
  }
}
```

### 5. Pill Button Sizes

Matching Finch's compact design:
- **Valence pills**: `px-5 py-2.5 text-sm rounded-full`
- **Category pills**: `px-4 py-2 text-sm rounded-full`  
- **Emotion pills**: `px-4 py-2 text-sm rounded-full`
- Active state: Solid background color, white or dark text
- Inactive state: Light tinted background, colored text

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/emotionData.ts` | Add colors per category, add subEmotions structure, complete emotion lists from PDF |
| `src/components/emotion/EmotionValence.tsx` | Redesign as part of column layout OR merge into new EmotionSelector |
| `src/components/emotion/EmotionCategory.tsx` | Merge into EmotionSelector |
| `src/components/emotion/EmotionSpecific.tsx` | Merge into EmotionSelector |
| `src/pages/app/AppEmotion.tsx` | Simplify step management - fewer steps |
| `src/components/emotion/EmotionContext.tsx` | Keep but update styling to match |
| `src/components/emotion/EmotionComplete.tsx` | Keep as-is (green Done button matches Finch) |

### New File

`src/components/emotion/EmotionSelector.tsx` - Main two-column selection UI

---

## Technical Approach

### Single-Screen vs. Multi-Page

**Recommended approach**: Create a new `EmotionSelector.tsx` that handles all the column-based drilling in a single component with internal state. This replaces EmotionValence, EmotionCategory, and EmotionSpecific.

Benefits:
- Smoother transitions (CSS animations between columns)
- Single viewport without page navigation
- Matches Finch's UX exactly
- Easier to manage back navigation (just collapse column)

### Animation

- Columns slide in from right when drilling deeper
- Columns slide out to right when going back
- Use `transition-all duration-200` for smooth feel

### Height Management

- Use `h-[100dvh]` for iOS viewport stability
- Content vertically centered with `items-center justify-center`
- No scroll needed if pills are compact enough

---

## Complete Emotion List from PDF

### Pleasant

- **Optimistic**: Hopeful, Inspired, Eager, Open, Curious
- **Accepted**: Respected, Valued, Fulfilled, Appreciated
- **Content**: Calm, Mellow, Good, Fulfilled, Peaceful, Comfortable, Balanced
- **Powerful**: Confident, Courageous, Creative, Successful
- **Interested**: Inquisitive, Amused, Fascinated, Absorbed
- **Playful**: Aroused, Cheeky, Energetic, Free
- **Proud**: Important, Worthy, Accomplished, Triumphant
- **Peaceful**: Loving, Thankful, Trusting, Hopeful
- **Trusting**: Sensitive, Intimate, Secure

### Neutral

- **Bored**: Indifferent, Apathetic
- **Busy**: Rushed, Pressured
- **Stressed**: Overwhelmed, Out of control
- **Tired**: Sleepy, Unfocused
- **Numb**: (direct select, no sub-emotions shown in PDF)

### Unpleasant (3 levels for some)

- **Sad**:
  - Lonely → [Isolated, Abandoned, Forlorn, Alienated, Nostalgic, Victimized, Fragile, Lost]
  - Vulnerable, Depressed, Hurt, Despair
  - Guilty → [Embarrassed, Disappointed, Powerless, Grief, Trapped, Discouraged, Ashamed, Remorseful]

- **Angry**:
  - Mad, Aggressive, Frustrated, Bitter, Distant
  - Critical → [Betrayed, Humiliated, Infuriated, Annoyed, Furious, Provoked, Jealous, Hostile]

- **Fearful**:
  - Scared, Anxious, Insecure, Weak, Rejected
  - Threatened → [Helpless, Frightened, Terrified, Panicked, Overwhelmed, Worried, Jittery, FOMO]

- **Down**:
  - Insecure, Inferior, Pessimistic
  - Miserable → [Embarrassed, Disappointed, Powerless, Grief, Trapped, Discouraged, Ashamed, Remorseful]
  - Empty

- **Surprised**:
  - Startled, Shocked, Dismayed, Confused, Disillusioned, Perplexed

- **Disgusted**:
  - Disapproving, Disappointed, Repelled
  - Awful → [Judgemental, Embarrassed, Appalled, Revolted, Horrified, Hesitant, Nauseated, Detestable]

---

## Implementation Order

1. **Update `emotionData.ts`** with complete emotion hierarchy, colors, and sub-sub-emotions
2. **Create `EmotionSelector.tsx`** with two-column layout and state machine
3. **Update `AppEmotion.tsx`** to use new component flow
4. **Update `EmotionContext.tsx`** to match styling (gray pills, green Save button)
5. **Test on iOS** to ensure no scroll issues and proper safe area handling

---

## Summary

This redesign transforms the emotion selection from a multi-page wizard into a single-screen, column-based drilling experience that:
- Matches Finch's UI exactly
- Eliminates unnecessary page navigation
- Fits on iOS screen without scrolling
- Supports 3-level depth for complex unpleasant emotions
- Uses color-coded pills for visual clarity
