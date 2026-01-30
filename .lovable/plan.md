
# Browse Page Premium Redesign

## Overview
Redesign the Browse page to be more premium, elegant, and visually stunning - inspired by the Water tool's beautiful effects. Replace emojis with proper Lucide icons, make cards smaller and more refined, and add coming soon tools including Workouts (Videos).

## Current Issues Identified
1. Using emojis instead of proper Lucide icons
2. Cards are oversized (aspect-[1/1.1] is too tall)
3. Design is flat/bland - lacks depth, motion, and premium feel
4. Coming soon tools are hidden - should show some to tease future features
5. Workout should be labeled as "Videos" for future expansion

## Design Approach
Take inspiration from the Water tool page which features:
- Gradient backgrounds with depth
- Floating/animated decorative elements
- Glass-morphism effects (backdrop-blur, bg-white/40)
- Subtle shadows and borders
- Smooth transitions and hover effects

---

## Technical Implementation

### 1. Update Tool Configuration (`src/lib/toolsConfig.ts`)
- Remove emoji dependency - use Lucide icons exclusively
- Update Workout description to "Workout videos" 
- Unhide select coming soon tools for teaser (e.g., AI Coach, Challenges, Mood)
- Add gradient color values for more premium look

### 2. Redesign ToolCard Component (`src/components/app/ToolCard.tsx`)
Replace emoji-based cards with premium icon-based cards:

**New Design Features:**
- Smaller, more compact cards with `aspect-square`
- Glass-morphism effect with `bg-white/60 backdrop-blur-md`
- Lucide icon in a soft circular container with gradient background
- Subtle inner shadow/glow effects
- Hover/active states with scale and shadow animations
- "Coming Soon" badge with frosted glass effect

**Visual Structure:**
```
+---------------------------+
|  [Icon in gradient orb]   |
|                           |
|       Tool Name           |
|     Short description     |
+---------------------------+
```

### 3. Redesign AppStore Page (`src/pages/app/AppStore.tsx`)
Transform the browse page with premium visual effects:

**Header Enhancement:**
- Gradient header with subtle animation
- Floating decorative orbs (similar to Water page clouds)

**Section Cards:**
- "Wellness Tools" - 2x2 grid with slightly larger cards
- "Audio & Video" - 3 column row, compact
- "Coming Soon" - Horizontal scroll with teaser cards
- "Browse Programs" - Keep existing but refine spacing

**Background Effects:**
- Subtle gradient mesh background
- Floating decorative elements with CSS animations
- Soft shadows on section containers

### 4. Add Premium CSS Animations
Add to the component or global CSS:
- Floating animation for decorative elements
- Subtle pulse for "Coming Soon" badges
- Smooth gradient transitions

---

## Visual Design Specifications

### Color Palette for Tool Cards
| Tool | Icon Container Gradient | Card Background |
|------|------------------------|-----------------|
| Journal | amber-400 to orange-400 | amber-50/80 |
| Breathe | teal-400 to cyan-400 | teal-50/80 |
| Water | sky-400 to blue-400 | sky-50/80 |
| Routines | violet-400 to purple-400 | violet-50/80 |
| Meditate | indigo-400 to purple-400 | indigo-50/80 |
| Workout | rose-400 to pink-400 | rose-50/80 |
| Soundscape | cyan-400 to teal-400 | cyan-50/80 |

### Card Dimensions
- Wellness Tools: `aspect-[4/3]` in 2-column grid
- Audio Tools: `aspect-square` in 3-column grid  
- Coming Soon: `w-28 aspect-[3/4]` horizontal scroll

### Icon Styling
- Icon container: `w-12 h-12 rounded-2xl` with gradient
- Icon size: `h-6 w-6` in white
- Shadow: `shadow-lg` on icon container

---

## Files to Modify

1. **`src/lib/toolsConfig.ts`**
   - Update tool definitions with proper icon names
   - Update Workout to show as "Videos" category
   - Unhide selected coming soon tools

2. **`src/components/app/ToolCard.tsx`**
   - Complete redesign with Lucide icons
   - Add glass-morphism styling
   - Add premium hover effects
   - Support for icon-only mode (compact)

3. **`src/pages/app/AppStore.tsx`**
   - Add floating decorative elements
   - Enhance section headers
   - Add horizontal scroll for Coming Soon
   - Refine spacing and layout

---

## Coming Soon Tools to Show
Visible teasers (still disabled):
- **AI Coach** - "Personal assistant" - Bot icon
- **Challenges** - "Goal challenges" - Trophy icon  
- **Mood** - "Track emotions" - Smile icon

These create excitement about future features without overwhelming the UI.
