
## Plan: Redesign Routine Cards to Match Playlist Card Style

### Goal
Update the `RoutinePlanCard` component to match the visual design of `PlaylistCard` - featuring a Card wrapper with borders, an aspect-square image area with overlaid title, category badge, and a separate content section below with description and meta info.

### Visual Comparison

```text
Current RoutinePlanCard:          Target PlaylistCard Style:
┌─────────────────────┐           ┌─────────────────────┐
│                     │           │ [Category]    [pts] │ ← Top badges
│   (gradient/image)  │           │                     │
│   aspect-4/5 tall   │           │   (square image)    │
│                     │           │                     │
│   ═══════════════   │           │   Title overlaid    │
│   Title             │           │───────────────────── │
│   Subtitle          │           │ Description...      │
│   ⏱ 15 min  ★ 4.5  │           │ 📝 5 tasks  ⏱ 15m   │
└─────────────────────┘           │ ★ 4.5 (rating)      │
                                  └─────────────────────┘
```

### Changes to `RoutinePlanCard.tsx`

#### 1. Add Card Wrapper
- Import and use `Card` component from `@/components/ui/card`
- Add border styling and shadow similar to PlaylistCard
- Keep hover/active scale transitions

#### 2. Change Aspect Ratio
- Change from `aspect-[4/5]` (tall) to `aspect-square` to match playlist cards

#### 3. Restructure Content
**Image section (inside Card):**
- Cover image or gradient with emoji fallback
- Bottom gradient overlay for title
- Category badge (top-left) - show the category name from `plan.category?.name`
- Points badge (top-right) - keep the star + points display
- Title overlaid at bottom of image

**Content section (below image, `p-3`):**
- Description text (line-clamp-2) if available
- Meta row: number of tasks icon + count, clock icon + duration
- Rating display if `average_rating` exists

#### 4. Update Emoji Display
- Replace Lucide icon fallback with emoji (from the standardization we just did)
- Use `isEmoji()` helper function

#### 5. Keep Compact Variant
- The compact variant will also be updated to use emojis instead of icons

### Code Changes

**File: `src/components/app/RoutinePlanCard.tsx`**

```tsx
import { memo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { RoutinePlan } from '@/hooks/useRoutinePlans';

// Helper to check if string is emoji
const isEmoji = (str: string) => 
  /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u.test(str);

// Color gradients for fallback when no cover image
const colorGradients = { /* existing */ };

export const RoutinePlanCard = memo(function RoutinePlanCard({ 
  plan, 
  onClick, 
  variant = 'default' 
}: RoutinePlanCardProps) {
  // ... compact variant stays similar but with emoji
  
  // Default variant - PlaylistCard style:
  return (
    <Card 
      className="overflow-hidden rounded-2xl border-border/50 cursor-pointer 
                 hover:shadow-lg hover:border-border transition-all 
                 hover:scale-[1.02] active:scale-[0.98]"
      onClick={handleClick}
    >
      {/* Image Section - aspect-square */}
      <div className="relative aspect-square">
        {/* Cover image or gradient with emoji */}
        {/* Bottom gradient overlay */}
        {/* Category badge - top left */}
        {/* Points badge - top right */}
        {/* Title overlay - bottom */}
      </div>
      
      {/* Content Section */}
      <div className="p-3 space-y-2">
        {/* Description */}
        {/* Meta: tasks count, duration */}
        {/* Rating if available */}
      </div>
    </Card>
  );
});
```

### Files to Modify

1. **`src/components/app/RoutinePlanCard.tsx`** - Complete redesign to match PlaylistCard style

### Data Considerations

The card needs `tasks.length` to show task count, but the current `RoutinePlan` type doesn't include tasks by default. Options:
- Use the `points` field as a proxy (already displayed)
- Add a `task_count` field to the query (would need hook changes)
- For now, display points badge + duration, skip task count

### Expected Result

After this change:
- Routine cards will have the same visual structure as playlist cards
- Cards will have proper borders and shadows
- Image section will be square with overlaid title
- Category badge will appear in top-left if category exists
- Description and meta info will appear below the image
- Consistent look across the app's card-based UI
