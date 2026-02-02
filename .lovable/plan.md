

# Redesign Emotion Intro Page + Add Pro Task Integration

## Overview

Three main changes requested:
1. **Redesign EmotionIntro** to match Finch's beautiful intro style (blue gradient background, emoji cloud illustration, clean typography, white Start button)
2. **Add "emotion" as a Pro Link type** so emotion logging can be linked from tasks
3. **Add "Add to My Routine" button** beside the Start button on the intro page

---

## Part 1: EmotionIntro Redesign (Finch-Style)

### Current vs. Target Design

| Aspect | Current | Target (Finch-style) |
|--------|---------|---------------------|
| Background | Light violet gradient | Solid blue (`#6B7CFF` / indigo-500) |
| Layout | Benefits list, bullet points | Clean and minimal, no bullets |
| Icon | Simple Heart in circle | Emoji cloud (⚡💖😊) illustration |
| Title style | Dark text on light bg | White text on blue bg |
| Description | Black/gray text | White/light blue text |
| Button | Violet button | White pill button with blue text |

### UI Implementation

```text
+------------------------------------------+
|  (X)                                     |
|                                          |
|                                          |
|           ☁️ ⚡💖😊                       |
|                                          |
|        Name your emotion                 |
|                                          |
|   Sometimes, what we feel is not so      |
|   obvious. Naming the emotion can help   |
|   us gain better control and             |
|   understanding of ourselves.            |
|                                          |
|                                          |
|                                          |
|  +------------------------------------+  |
|  |              Start                 |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |       Add to My Routine            |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Design Details

- **Background**: Solid `bg-[#6B7CFF]` (indigo-like blue matching Finch)
- **Close button**: Top-left X icon in a gray circle with 50% opacity
- **Emoji cloud**: Create using overlapping divs with emojis (⚡, 💖, 😊) inside a soft purple cloud shape
- **Title**: "Name your emotion" - white, 2xl font, semibold
- **Description**: White text with 80% opacity, centered, max-width for readability
- **Start button**: White background, blue text, full-width pill, rounded-full
- **Add to Routine button**: Transparent/outline style below Start, or same white style

---

## Part 2: Add "emotion" to Pro Link Types

### Database Migration

Add `emotion` to the pro_link_type check constraints on both tables:

```sql
-- Update user_tasks constraint
ALTER TABLE public.user_tasks DROP CONSTRAINT IF EXISTS user_tasks_pro_link_type_check;
ALTER TABLE public.user_tasks ADD CONSTRAINT user_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN (
  'playlist', 'journal', 'channel', 'program', 'planner', 
  'inspire', 'route', 'breathe', 'water', 'period', 'emotion'
));

-- Update routine_plan_tasks constraint  
ALTER TABLE public.routine_plan_tasks DROP CONSTRAINT IF EXISTS routine_plan_tasks_pro_link_type_check;
ALTER TABLE public.routine_plan_tasks ADD CONSTRAINT routine_plan_tasks_pro_link_type_check 
CHECK (pro_link_type IS NULL OR pro_link_type IN (
  'playlist', 'journal', 'channel', 'program', 'planner', 
  'inspire', 'route', 'breathe', 'water', 'period', 'emotion'
));
```

### Update TypeScript Types

**File: `src/lib/proTaskTypes.ts`**

Add new `emotion` type:

```typescript
export type ProLinkType = 'playlist' | 'journal' | 'channel' | 'program' | 
  'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion';

// Add to PRO_LINK_CONFIGS
emotion: {
  value: 'emotion',
  label: 'Name Your Emotion',
  icon: HeartHandshake, // or Heart
  badgeText: 'Feel',
  color: 'violet',
  gradientClass: 'bg-gradient-to-br from-violet-100 to-purple-100',
  iconColorClass: 'text-violet-600',
  badgeColorClass: 'bg-violet-500/20 text-violet-700',
  buttonClass: 'bg-white hover:bg-white/90 text-foreground border border-border/50 shadow-sm',
  description: 'Open the emotion naming tool',
  requiresValue: false,
},
```

### Update Navigation Path

**File: `src/lib/proTaskTypes.ts`** - `getProTaskNavigationPath`:

```typescript
case 'emotion':
  return '/app/emotion';
```

---

## Part 3: "Add to My Routine" Button

### Component Pattern

Follow the same pattern as `JournalReminderSettings.tsx`:

1. Create a new component or add button logic directly to `EmotionIntro.tsx`
2. Use `useExistingProTask('emotion')` to check if already added
3. On click, either:
   - Open `RoutinePreviewSheet` with synthetic task
   - Or navigate to planner if already added
4. Synthetic task definition:

```typescript
const SYNTHETIC_EMOTION_TASK: RoutinePlanTask = {
  id: 'synthetic-emotion-task',
  plan_id: 'synthetic-emotion',
  title: 'Name Your Emotion',
  icon: '💜',
  color: 'lavender',
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: 'emotion',
  pro_link_value: null,
  linked_playlist: null,
};
```

### Button States

- **Not added**: "Add to My Routine" with Sparkles icon, white/outline style
- **Added**: "Added — Go to Planner" with Check icon, green tint

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/emotion/EmotionIntro.tsx` | Complete UI redesign + Add to Routine button |
| `src/lib/proTaskTypes.ts` | Add `emotion` type definition and navigation |
| New migration SQL file | Add `emotion` to database constraints |

---

## Implementation Summary

1. **Redesign EmotionIntro.tsx**:
   - Blue gradient background (`bg-[#6B7CFF]`)
   - Emoji cloud illustration (⚡💖😊)
   - White text, clean minimal layout
   - White pill "Start" button
   - White "Add to My Routine" button below

2. **Add pro_link_type support**:
   - Database migration to add `emotion` to constraints
   - TypeScript type updates in proTaskTypes.ts
   - Navigation path for emotion tasks

3. **Routine integration**:
   - Use existing patterns from JournalReminderSettings
   - State-aware button (shows "Added — Go to Planner" if exists)
   - Opens RoutinePreviewSheet for customization

