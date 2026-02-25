

## Redesign Watch Page to Match Calm's Premium Night Sky

The current implementation has the right idea (dark hero + clouds) but falls short of Calm's polished look because:
- Category circles use bright pastel backgrounds that clash with the dark sky
- Cloud effects are barely visible
- No stars or depth layers in the sky
- Text labels in the hero aren't properly styled for dark backgrounds

### Changes

**1. Update CategoryCircle for dark contexts** (`src/components/app/CategoryCircle.tsx`)
- Add a `variant` prop: `"light"` (default, current pastel look) and `"dark"` (for Watch page)
- Dark variant uses translucent white backgrounds (`bg-white/15`) with white icons and white text labels
- Selected state uses a brighter `bg-white/30` with a white ring instead of the primary ring

**2. Overhaul the Watch page hero** (`src/pages/app/AppWatch.tsx`)
- Add a **starfield layer**: Scatter ~40 tiny white dots (CSS pseudo-elements or small divs) with varying opacity and a gentle twinkle animation across the sky area
- Make **cloud layers more visible**: Increase opacity from 0.15-0.25 to 0.3-0.5, use brighter blue-white tones (closer to `rgba(150,180,220,0.5)`)
- Add a subtle **bottom glow/horizon**: A warm subtle glow near the bottom of the hero simulating moonlight or distant light
- Pass `variant="dark"` to CategoryCircle components
- Smooth the hero-to-content transition with a subtle inner shadow on the rounded content area

**3. Add starfield twinkle animation** (`tailwind.config.ts`)
- Add `star-twinkle` keyframe: gentle opacity pulse between 0.3 and 1.0 over 3-5 seconds
- Register `animate-star-twinkle` utility

### Visual Result

```text
+----------------------------------+
|  *  .    *       .    *  .       |  <-- scattered stars (tiny white dots)
|     .  *    .  *    .            |
|  ~~~ brighter cloud layer ~~~    |
|     ~~~ second cloud ~~~         |
|  * lightning flash (periodic) *  |
|                                  |
|  Watch              [+] [Q]     |  <-- white text
|                                  |
|  (O) All  (O) Tutorial  ...     |  <-- dark translucent circles, white icons
|                                  |
|  [All] [In Progress] [Done] [G] |  <-- white/translucent pills
|__________________________________|
/  rounded white content area    /
|  ALL PLAYLISTS                  |
|  [card] [card]                  |
+----------------------------------+
```

### Files to Modify

1. **`src/components/app/CategoryCircle.tsx`** -- Add `variant` prop with dark mode styles
2. **`src/pages/app/AppWatch.tsx`** -- Add starfield, boost cloud visibility, use dark category variant
3. **`tailwind.config.ts`** -- Add `star-twinkle` keyframe and animation

### Technical Notes

- Stars are rendered as a grid of tiny `div` elements with randomized positions and animation delays (no images needed)
- All effects remain pure CSS -- no video files, no canvas, no WebGL
- Performance stays smooth on mobile since we're using GPU-accelerated `opacity` and `transform` animations only
