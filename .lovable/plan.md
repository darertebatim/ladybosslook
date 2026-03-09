

# Focus Timer - Standalone Tool

## Overview
Build a standalone Focus Timer tool inspired by the me+ reference screenshots. This will be a new page (`/app/timer`) accessible from the tools/explore section. It reuses existing timer logic but with a beautiful, dedicated UI with multiple screens.

## Screens & Flow

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Setup Screen   │────▶│  Running Screen  │────▶│  Done Screen    │
│  (white bg)     │     │  (black bg)      │     │  (lavender bg)  │
│                 │     │                  │     │                 │
│ Timer/Pomodoro  │     │  Colorful time   │     │  "Wow! You did  │
│ tab switch      │     │  countdown       │     │   it!" message  │
│                 │     │                  │     │                 │
│ Ellipse with    │     │  Hearts deco     │     │  Confetti       │
│ time display    │     │                  │     │                 │
│                 │     │  Hold to stop    │     │  "I'm doing     │
│ Theme selector  │     │  progress bar    │     │   great!" btn   │
│                 │     │                  │     │                 │
│ Settings/Start  │     │                  │     │                 │
│ /Calendar btns  │     │                  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │ (hold to stop)
                               ▼
                        ┌─────────────────┐
                        │  Stopped Screen │
                        │  (lavender bg)  │
                        │                 │
                        │  "Relax! Every  │
                        │  effort counts!"│
                        │                 │
                        │  "Got it!" btn  │
                        └─────────────────┘
```

## Screens Detail

### 1. Setup Screen (white background)
- Close (X) button top-left
- **Timer / Pomodoro** tab toggle (lavender active pill, grey inactive) -- Pomodoro is visual only for now (same timer behavior)
- Large lavender hand-drawn ellipse with huge bold time (e.g., "25:00") inside
- Small hearts decoration near top-right of ellipse
- Theme label below ellipse (e.g., "Workout >") - tappable to open theme picker
- Bottom bar: Settings gear icon (opens time adjustment), "Start Timer" black button, Calendar icon (decorative)
- Tapping the time or settings gear opens the **time adjustment** sub-screen

### 2. Time Adjustment Sub-screen
- Back arrow top-left
- "Adjust the time" title
- Large purple number with "min" label
- Horizontal ruler/slider picker (1-90 min range) with haptic feedback
- "Done" black button at bottom
- Lavender gradient at bottom

### 3. Theme Picker Sub-screen
- Back arrow top-left
- Large centered input with placeholder "Custom Themes" (max 50 chars)
- Quick-pick chips: Focus, Read, Study, Workout, Work, Meditate, Relax (pastel colored)

### 4. Running Screen (black background)
- Full-screen black
- Large colorful gradient digits (purple-pink-violet gradient) for countdown
- Hearts decoration
- Decorative lines under the time
- "Hold to stop timer" text at bottom with progress bar that fills as user holds
- No buttons - only hold-to-stop interaction

### 5. Completion Screen (lavender background)
- Checkmark icon (black circle)
- "Wow! You did it!" large bold text
- "Celebrate your progress!" subtitle
- Confetti animation
- "I'm doing great!" black button

### 6. Stopped Early Screen (lavender background)
- Exclamation icon (black circle)
- "Relax! Every effort counts!" large bold text
- "Let's continue when you're ready." subtitle
- "Got it!" black button

## Technical Plan

### New Files
1. **`src/pages/app/AppTimer.tsx`** - Main timer page with all screens/states managed internally
2. **`src/lib/timerThemes.ts`** - Theme presets and colors for quick-pick chips

### Modified Files
1. **`src/lib/toolsConfig.ts`** - Add Focus Timer tool entry to `wellnessTools`
2. **`src/App.tsx`** - Add route `/app/timer` with lazy import
3. **`src/components/app/ToolCard.tsx`** - Add `Clock` to icon map

### State Machine in AppTimer
- `setup` → `adjustTime` → `setup`
- `setup` → `pickTheme` → `setup`
- `setup` → `running`
- `running` → `completed` (timer reaches 0)
- `running` → `stopped` (user holds to stop)
- `completed` / `stopped` → close (navigate back)

### Key Implementation Details
- **Hold-to-stop**: `onTouchStart`/`onMouseDown` starts a 2-second fill animation; if held long enough, stops the timer. Release early cancels.
- **Time picker**: Horizontal scroll ruler component (not reusing TimeWheelPicker which is for clock times). Simple slider or custom ruler with snapping to minute values.
- **Colorful digits**: CSS gradient text using `bg-clip-text` with a purple-pink gradient on the running screen.
- **Confetti**: Reuse existing `canvas-confetti` library already installed.
- **Haptics**: Use existing `haptic` utility throughout.
- **No persistence needed** - this is a standalone utility timer, no Supabase integration.

