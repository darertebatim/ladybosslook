# iOS Safe Area Header Fixes - COMPLETED

## Summary
Fixed the close button positioning issue on iOS devices where buttons were overlapping with the status bar/notch area.

## Changes Made

### 1. AppWater.tsx ✅
- Replaced `pt-safe-top` (undefined class) with inline style
- Applied: `style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}`

### 2. WaterTrackingScreen.tsx ✅
- Same fix as AppWater - replaced `pt-safe-top` with proper inline style

### 3. TaskTimerScreen.tsx ✅
- Removed separate safe area spacer div
- Combined safe area + content padding into single header container
- Applied: `style={{ paddingTop: 'calc(env(safe-area-inset-top) + 32px)' }}`

### 4. BreathingExerciseScreen.tsx ✅
- Already using correct pattern: `style={{ paddingTop: 'env(safe-area-inset-top)' }}` with internal `py-3`
- No changes needed

## Pattern Established
For fullscreen pages with custom backgrounds on iOS:
```tsx
<div 
  className="flex items-center ... pt-3"
  style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
>
  {/* Header content */}
</div>
```
