

## Calm-Style Animated Background for Watch Page

Transform the Watch page header and background into a premium, Calm-inspired dark blue atmosphere with animated clouds and subtle lightning effects.

### What You'll Get

- A deep dark blue gradient background on the Watch page header area
- Soft, slowly drifting cloud layers (pure CSS animations, no video needed)
- Subtle lightning flashes that pulse periodically
- All text updated to white/light colors for contrast
- Lightweight implementation using CSS keyframes (no extra dependencies)

### Design Details

- **Background**: Deep navy-to-indigo gradient (`#0a1628` to `#1a2744`)
- **Clouds**: 2-3 semi-transparent radial gradient "blobs" that slowly drift horizontally using CSS translate animations (15-25s loop)
- **Lightning**: A brief white flash overlay that triggers every ~8 seconds using a CSS opacity keyframe
- **Header**: The fixed header becomes transparent/dark blue instead of the current light blue `#E8F4FE`
- **Text**: Title, filters, and category labels switch to white/white-alpha for readability

### Technical Approach

**Files to modify:**

1. **`src/pages/app/AppWatch.tsx`**
   - Replace the header `bg-[#E8F4FE]` with the dark gradient
   - Add animated cloud `div` layers (absolute positioned, CSS-animated)
   - Add a lightning flash overlay div
   - Update all text classes to white variants (`text-white`, `text-white/60`)
   - Update filter buttons to use dark-friendly styles (`bg-white/10` instead of `bg-muted`)
   - Extend the gradient into the page background behind the content area

2. **`tailwind.config.ts`**
   - Add custom keyframes: `cloud-drift-1`, `cloud-drift-2`, `lightning-flash`
   - Register corresponding animation utilities

### Visual Structure

```text
+----------------------------------+
|  [dark blue gradient header]     |
|  ~~~ cloud layer 1 (slow) ~~~   |
|  ~~~ cloud layer 2 (slower) ~~~ |
|  * lightning flash (periodic) *  |
|                                  |
|  Watch          [icons]          |
|  [categories row]                |
|  [filters]              [lang]   |
+----------------------------------+
|  [normal white content area]     |
|  [playlist cards grid]           |
+----------------------------------+
```

The clouds are CSS-only (radial-gradient blobs with `animation: cloud-drift`), keeping performance smooth on mobile. No video files or heavy assets needed.

