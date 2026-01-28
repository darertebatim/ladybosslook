
# TaskCard Typography & Emoji Size Update

## Overview
Update the TaskCard component to match Me+ app styling more precisely, focusing on typography adjustments and emoji sizing.

## Changes

### File: `src/components/app/TaskCard.tsx`

#### 1. "Anytime" Line Typography
- **Current**: `text-sm`, `font-medium`, `text-black`
- **New**: `text-[13px]`, no font-medium (regular weight), `text-black/80`

#### 2. Task Title Typography  
- **Current**: `font-semibold`, `text-[15px]`
- **New**: `font-bold`, `text-[16px]`

#### 3. Emoji Size
- **Current**: `size={28}` for regular tasks
- **New**: `size={32}` for regular tasks (matching Me+)

### Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Time text size | `text-sm` (~14px) | `text-[13px]` |
| Time font weight | `font-medium` | (none/regular) |
| Time color | `text-black` | `text-black/80` |
| Title size | `text-[15px]` | `text-[16px]` |
| Title weight | `font-semibold` | `font-bold` |
| Emoji size | 28px | 32px |

## Technical Details
These changes will be applied to both the regular task card and the Pro task card sections within the component to maintain consistency.
