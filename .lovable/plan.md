

## Back Button Audit & iOS-Style Redesign

### Executive Summary
This plan addresses three major issues with back buttons across the app:
1. Non-functional back buttons on certain pages
2. Inconsistent navigation behavior (jumping to home instead of intelligent routing)
3. Non-iOS-compliant back button design (too small, with hover effects)

---

## Current State Analysis

### Problem 1: Non-Functional Back Buttons

**Affected Pages:**
- **AppInspireDetail** (Ritual Detail page) - The back button at lines 155-166 uses `navigate(-1)` with a history check fallback, but since the page may be entered from multiple sources (Home, Rituals page, direct link), the history approach can fail

### Problem 2: Inconsistent Navigation Logic

**Current Patterns Found:**

| Page | Back Behavior | Issue |
|------|---------------|-------|
| AppChat | `navigate(-1)` swipe-back + button | Good iOS pattern |
| AppEmotionHistory | Hard-coded `/app/emotion` | Correct - knows parent |
| AppJournal | Hard-coded `/app/home` | Correct for top-level |
| AppPlaylistDetail | Context-aware (`cameFromPlanner ? '/app/home' : '/app/player'`) | Best practice |
| AppFeed | Hard-coded `/app/home` | Should be `/app/channels` |
| AppCourseDetail | Hard-coded `/app/programs` | Correct |
| AppBreathe | Uses AppHeader with `/app/home` | Correct for tool |
| AppInspireDetail | `navigate(-1)` with fallback | Unreliable |

**Best Practice Pattern**: Pages like `AppPlaylistDetail` use query params or referrer tracking to provide intelligent back navigation based on where the user came from

### Problem 3: Non-iOS Back Button Design

**Current BackButton Component Issues:**
- Uses `<Button variant="ghost" size="icon">` - has hover effects, small tap target
- Uses `ArrowLeft` icon instead of iOS-standard `ChevronLeft`
- No text label (iOS typically shows "< Back" or parent page name)
- Icon size is only 20px (h-5 w-5) - iOS uses larger icons

**Good iOS Pattern Already in App** (AppChat):
```tsx
<Button 
  variant="ghost" 
  onClick={handleBack}
  className="-ml-2 h-10 px-2 gap-0.5 text-primary hover:bg-transparent active:opacity-70"
>
  <ChevronLeft className="h-7 w-7" />
  <span className="text-[17px]">Back</span>
</Button>
```

---

## Proposed Solution

### Phase 1: Create iOS-Style Back Button Component

Replace the current `BackButton` component with an iOS-compliant design:

**New BackButton Features:**
- ChevronLeft icon (h-6 to h-7) instead of ArrowLeft
- Optional text label (defaults to "Back")
- No hover background - only opacity change on press
- Primary color (blue/violet) for icon and text
- Minimum 44px tap target (iOS HIG requirement)
- Left-aligned with negative margin for edge alignment

**New API:**
```tsx
interface BackButtonProps {
  to?: string;              // Explicit destination
  label?: string;           // Text to show (default: "Back")
  showLabel?: boolean;      // Whether to show label (default: true)
  onClick?: () => void;     // Custom handler before navigation
  className?: string;
}
```

### Phase 2: Fix Navigation Logic

**Pattern to Implement:**
1. For pages accessed from single parent: Use explicit `to` prop
2. For pages accessed from multiple sources: Use URL query param or referrer tracking

**Specific Fixes:**

| Page | Current | Fix |
|------|---------|-----|
| AppInspireDetail | `navigate(-1)` | Add explicit `to="/app/routines"` or track referrer |
| AppFeed | `/app/home` | Change to `/app/channels` |
| AppFeedPost | `navigate(-1)` | Keep - nested page, history is reliable |
| AppPlaylistDetail | Context-aware | Already good - keep pattern |

### Phase 3: Update All Pages

Pages requiring updates:

1. **Pages using old BackButton component:**
   - AppPlaylistDetail
   - AppFeed  
   - AppCourseDetail
   - AppJournal
   - AppJournalEntry
   - AppBreathe (via AppHeader)

2. **Pages with inline back buttons needing style update:**
   - AppInspireDetail
   - AppEmotionHistory
   - AppFeedPost
   - AppPeriod
   - AppWater
   - AppAudioPlayer

3. **Pages with correct iOS style (no change needed):**
   - AppChat

---

## Technical Implementation Details

### Updated BackButton Component

```tsx
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BackButton({ 
  to, 
  label = 'Back',
  showLabel = true,
  onClick, 
  className 
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    haptic.light();
    onClick?.();
    
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={cn(
        'flex items-center gap-0.5 h-10 px-1 -ml-1',
        'text-primary hover:bg-transparent active:opacity-70',
        'transition-opacity',
        className
      )}
    >
      <ChevronLeft className="h-7 w-7" />
      {showLabel && (
        <span className="text-[17px]">{label}</span>
      )}
    </button>
  );
}
```

### Circular Icon-Only Variant for Overlay Headers

For pages like AppInspireDetail with image headers:

```tsx
export function BackButtonCircle({ 
  to,
  onClick,
  className 
}: Omit<BackButtonProps, 'label' | 'showLabel'>) {
  const navigate = useNavigate();

  const handleClick = () => {
    haptic.light();
    onClick?.();
    to ? navigate(to) : navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm',
        'flex items-center justify-center',
        'text-white active:scale-95 transition-transform',
        className
      )}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
```

### AppHeader Update

Update the AppHeader to use the new iOS-style back button:

```tsx
{showBack && (
  <BackButton 
    to={backTo} 
    label={backLabel || 'Back'}
    showLabel={showBackLabel ?? true}
  />
)}
```

---

## Files to Modify

1. `src/components/app/BackButton.tsx` - Complete rewrite with iOS style
2. `src/components/app/AppHeader.tsx` - Update to use new BackButton props
3. `src/pages/app/AppInspireDetail.tsx` - Use BackButtonCircle, fix destination
4. `src/pages/app/AppEmotionHistory.tsx` - Use new BackButton component
5. `src/pages/app/AppFeedPost.tsx` - Use new BackButton style
6. `src/pages/app/AppPeriod.tsx` - Use new BackButton style
7. `src/pages/app/AppWater.tsx` - Use new BackButton style
8. `src/pages/app/AppAudioPlayer.tsx` - Update to iOS style
9. `src/pages/app/AppFeed.tsx` - Fix destination from `/app/home` to `/app/channels`
10. `src/pages/app/AppPlaylistDetail.tsx` - Update component style
11. `src/pages/app/AppJournal.tsx` - Update component style
12. `src/pages/app/AppJournalEntry.tsx` - Update component style
13. `src/pages/app/AppCourseDetail.tsx` - Update component style

---

## Expected Outcome

After implementation:
- All back buttons will have consistent iOS-style appearance
- ChevronLeft icon with optional "Back" text label
- Minimum 44px tap targets
- No hover effects, only press opacity feedback
- Intelligent navigation (knows where to go back to)
- No broken/non-functional back buttons

