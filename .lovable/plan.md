

## Problem

The current approach uses hardcoded z-index values (10000-10004) for every sheet, dialog, and overlay. This is fundamentally fragile because:

1. When a sheet (e.g., Task Builder at z-10003) opens a nested sheet (e.g., Date Picker), they need different z-levels
2. Every time we fix one layer, we bump it up and break another
3. The same component (AppTaskCreate) can be opened from different contexts (home page, routine builder), requiring different z-levels each time

Right now, AppTaskCreate's main sheet AND all its nested sheets are ALL at z-[10004] -- same level -- so nested sheets appear behind the parent.

## Solution: Dynamic Z-Index Stacking Context

Create a React Context (`ZStackProvider`) that automatically assigns incrementing z-index values to nested portals. Each layer that opens gets the next z-index automatically -- no hardcoding needed.

```text
ZStackProvider (base: 10000)
  └─ Dialog (auto: 10000)
  └─ Sheet / RoutineBuilder (auto: 10000)
       └─ AppTaskCreate (auto: 10001)  ← automatically +1
            └─ DatePicker sheet (auto: 10002) ← automatically +1
  └─ Celebration overlay (auto: 10000, but uses OverlayPortal which resets to top)
```

## Implementation Steps

### 1. Create `ZStackContext` (`src/contexts/ZStackContext.tsx`)
- A React context holding a `level` number (default 10000)
- A `ZStackProvider` component that reads the parent level and provides `parentLevel + 1`
- A `useZIndex()` hook that returns the current level

### 2. Create a wrapper component `ZLayer` (`src/components/ui/z-layer.tsx`)
- Wraps children in `ZStackProvider`
- Applies `style={{ zIndex }}` to both overlay and content
- Used as a drop-in replacement for manual z-index classes

### 3. Update `SheetContent` in `sheet.tsx`
- Integrate with `useZIndex()` -- if no explicit z-index class is provided, auto-apply from context
- Each `SheetContent` renders a `ZStackProvider` around its children so anything nested gets level+1

### 4. Update `DialogContent` in `dialog.tsx`
- Same pattern as Sheet

### 5. Remove ALL hardcoded z-index classes
- Remove every `z-[10000]`, `z-[10001]`, `z-[10002]`, `z-[10003]`, `z-[10004]` from sheet/dialog usage across ~22 files
- Celebrations/OverlayPortal keep a high base (e.g., start at 10100) so they always float above sheets

### 6. Keep OverlayPortal celebrations at a fixed high tier
- Celebrations use `OverlayPortal` which renders to `document.body` outside the React tree, so they escape the context. Give them a fixed high z-index (10100) since they should always be on top of everything.

## Benefits
- Never need to manually assign z-index again
- Nesting automatically works regardless of depth
- Adding new sheets or moving components between contexts won't break layering
- Celebrations always on top via separate fixed tier

## Files to change
- **New**: `src/contexts/ZStackContext.tsx`
- **Edit**: `src/components/ui/sheet.tsx` -- auto z-index from context
- **Edit**: `src/components/ui/dialog.tsx` -- auto z-index from context
- **Edit**: `src/components/ui/alert-dialog.tsx` -- auto z-index from context
- **Edit**: `src/components/ui/popover.tsx` -- auto z-index from context
- **Edit**: `src/components/ui/select.tsx` -- auto z-index from context
- **Edit**: `src/components/ui/context-menu.tsx` -- auto z-index from context
- **Edit**: `src/pages/app/AppTaskCreate.tsx` -- remove all hardcoded z-index
- **Edit**: ~15 other files -- remove hardcoded z-index classes
- **Edit**: Celebration components -- use fixed 10100 tier

