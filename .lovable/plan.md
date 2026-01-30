
# Browse Page iOS-Native Redesign

## Problem Analysis
The current Browse page has several issues:
- Uses hover effects (`group-hover`) which don't work on iOS touch devices
- Overly complex glass-morphism effects that look web-like, not native
- Large, chunky cards that feel childish
- Floating decorative elements that feel out of place
- Doesn't match the clean, minimal iOS aesthetic of the Home page

## Design Philosophy
Match the Home page's design language:
- Clean, minimal iOS-native feel
- Soft pastel icon backgrounds (not gradients)
- Touch feedback with `active:scale-95` instead of hover
- Simple, subtle shadows
- Compact elements with proper spacing

---

## Implementation Plan

### 1. Simplify AppStore.tsx Page Layout
**Remove:**
- Floating decorative orbs/blur elements
- Complex gradient header
- Glass-morphism backdrop effects

**Keep/Add:**
- Simple gradient header matching Home (`bg-gradient-to-b from-violet-50`)
- Clean section structure
- Proper iOS touch interactions

### 2. Redesign ToolCard.tsx Component
**New Design Approach:**
Create cards that match the QuickActionsGrid style from Home:

**Wellness Tools (2-column grid):**
- Simple colored background (solid pastel, not gradient)
- Icon in colored square container
- Clean title and subtitle
- `active:scale-95` for touch feedback
- Remove all hover effects

**Audio Tools (3-column, icon-focused):**
- Same style as Quick Actions on Home
- Icon in colored rounded square
- Label below
- Very compact

**Coming Soon Teasers:**
- Horizontal scroll
- Small icon + name + "Soon" badge
- Subtle, not flashy

### 3. Update toolsConfig.ts
Add simple pastel background colors to match Home page:
- `bgColor` property for each tool (like `bg-[#FAE5C5]` for orange/journal)
- `iconColor` for the icon itself (like `text-orange-600`)

### 4. Visual Style Reference
Following the QuickActionsGrid pattern:

```
+---------------------------+
|  +---+                    |
|  |   | <- Icon in colored |
|  | 📖|    square bg       |
|  +---+                    |
|                           |
|  Journal                  |
|  Daily reflections        |
+---------------------------+
```

Card styling:
- Background: `bg-card` or subtle tint
- Icon container: `w-12 h-12 rounded-2xl bg-[pastelColor]`
- Icon: `h-6 w-6 text-[accentColor]`
- Shadow: `shadow-sm`
- Touch: `active:scale-[0.97] transition-transform`

---

## Files to Modify

### `src/lib/toolsConfig.ts`
- Add `bgColor` and `iconColor` properties to each tool
- Remove complex gradient properties
- Keep route/description/icon

### `src/components/app/ToolCard.tsx`
- Complete rewrite to match iOS native style
- Remove all `group-hover` animations
- Use `active:scale-95` for touch feedback
- Simplify to colored icon + text layout
- Match QuickActionsGrid aesthetic

### `src/pages/app/AppStore.tsx`
- Remove floating decorative elements
- Simplify header to match Home page style
- Clean, minimal section structure
- Proper spacing matching other app pages

---

## Color Palette (Matching Home)
| Tool | Background | Icon Color |
|------|------------|------------|
| Journal | `#FAE5C5` (peach) | `text-orange-600` |
| Breathe | `#D3F2EA` (mint) | `text-teal-600` |
| Water | `#D6E6FC` (sky) | `text-blue-600` |
| Routines | `#E6D9FC` (lavender) | `text-violet-600` |
| Meditate | `#E8E4F8` (soft purple) | `text-indigo-600` |
| Workout | `#FCE4EC` (soft rose) | `text-rose-600` |
| Soundscape | `#D4F1F4` (aqua) | `text-cyan-600` |

---

## Technical Notes
- All animations removed (no hover effects)
- Touch feedback via `active:scale-[0.97]`
- Simple Tailwind utilities, no custom keyframes needed for cards
- Keep existing tailwind config keyframes for other uses, just don't use them here
