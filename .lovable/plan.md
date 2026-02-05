

## Ritual Detail Page Enhancement Plan

### Overview
Redesign the ritual detail page (`AppInspireDetail.tsx`) to create a more polished, modern iOS-style experience that matches the app's design language and improves visual hierarchy.

---

## Current Issues

1. **Header Icons**: Heart and Share buttons use custom inline styles - need to use a consistent circular button component
2. **Hero Image**: Works well but gradient overlay could be refined
3. **Title Section**: Basic styling - needs more visual polish
4. **Action Cards**: Good styling with pastel colors, but can be refined for better consistency
5. **Bottom CTA**: Uses outline variant which appears too muted

---

## Proposed Enhancements

### 1. Refine Header Icon Buttons

Replace inline icon buttons with consistent circular styling matching BackButtonCircle:

**Current:**
```tsx
<button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
  <Heart className="w-5 h-5" />
</button>
```

**New:**
- Same styling as BackButtonCircle (40x40px, 44px touch target)
- Active scale feedback
- Consistent with CloseButton patterns

### 2. Improve Hero Image Section

- Add subtle gradient fade at bottom for better title readability
- Ensure proper aspect ratio for cover images
- Better fallback for routines without covers (larger emoji, nicer gradient)

### 3. Polish Title & Metadata Section

**Current:** Simple title, subtitle, action count

**Enhanced:**
- Title with slightly larger font (text-2xl → text-[26px])
- Action count as subtle gray badge-style text
- Category badge below title (consistent with card styling)
- Visual separator before description

### 4. Enhance Action Cards Design

Match the reference screenshot style:
- Softer, more pastel backgrounds (using TASK_COLORS)
- Cleaner metadata line: "category • repeat"
- Description box with white background and rounded corners (already present, just ensure consistency)
- Slightly larger emoji icons
- Better spacing

### 5. Upgrade Bottom CTA Button

**Current:** Uses `variant="outline"` which appears muted in lavender

**Enhanced:**
- Change to solid lavender fill: `bg-[#F4ECFE]` 
- Darker text for better contrast
- Match the styling shown in reference screenshot

---

## Technical Implementation

### File to Modify
`src/pages/app/AppInspireDetail.tsx`

### Changes Summary

1. **Header buttons** (lines 158-167):
   - Extract to use consistent styling with 44px touch targets
   - Add `active:scale-95` feedback

2. **Hero section** (lines 176-192):
   - Keep current implementation, minor gradient refinement
   - Maintain safe-area padding

3. **Title section** (lines 195-209):
   - Slightly larger title
   - Improve spacing
   - Add category badge if available

4. **Task cards** (lines 240-276 and 286-320):
   - Keep current TASK_COLORS approach
   - Ensure consistent styling in both section and non-section views
   - Slightly increase emoji size for better visibility

5. **Bottom CTA** (lines 328-341):
   - Keep AddedToRoutineButton but ensure styling consistency
   - The `variant="outline"` already uses the lavender style for not-added state

### Optional Enhancements

- Add subtle animation when scrolling past hero (optional, low priority)
- Show estimated total time for all actions (sum of durations)

---

## Expected Result

After implementation:
- More polished, professional ritual detail page
- Consistent iOS-style interactions and feedback
- Better visual hierarchy and readability
- Matches the high-quality styling shown in reference screenshot
- Consistent with other parts of the app (cards, buttons, colors)

