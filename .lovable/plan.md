

# Toast Notification Redesign Plan

## Problem
Toast notifications appear at the very bottom of the screen and are often missed by users. The screenshot shows the toast "Let's focus on today's routine" is barely visible, hidden behind the FAB button area.

## Current Implementation
- The app uses **Sonner** library for modern toast notifications
- The `Toaster` component from `src/components/ui/sonner.tsx` is mounted in `App.tsx`
- Current position: **bottom-right** (Sonner's default)
- No `position` prop is explicitly set

## Solution Overview

Redesign toasts to appear at the **top center** of the screen with improved styling that matches the app's native feel.

### Changes

**1. Update Sonner Toaster Position** (`src/components/ui/sonner.tsx`)
- Add `position="top-center"` to move toasts to the top of the screen
- Add `offset` prop for proper safe area spacing on iOS
- Update styling for a more prominent, pill-shaped appearance that matches the app's design language

**2. Enhanced Styling**
- Increase border-radius for a pill/capsule shape (matching the app's rounded design)
- Add subtle shadow for better visibility
- Slightly increase padding for better touch targets
- Add safe-area-aware top offset for iOS notch devices

### Visual Design
```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │ ← Top of screen
│  │  Let's focus on today's routine. │  │ ← New toast position
│  │  You can complete when the day   │  │
│  │  comes.                          │  │
│  └──────────────────────────────────┘  │
│                                        │
│        [Calendar & Tasks UI]           │
│                                        │
└────────────────────────────────────────┘
```

---

## Technical Details

### File: `src/components/ui/sonner.tsx`

Update the Sonner `Toaster` component:

```tsx
<Sonner
  theme={theme as ToasterProps["theme"]}
  position="top-center"
  offset="60px"  // Account for iOS notch + header
  className="toaster group"
  toastOptions={{
    classNames: {
      toast:
        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl",
      description: "group-[.toast]:text-muted-foreground",
      actionButton:
        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
      cancelButton:
        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
    },
  }}
  {...props}
/>
```

### Key Props:
- `position="top-center"`: Moves toasts to the top-center of the screen
- `offset="60px"`: Provides spacing from the top to avoid the iOS notch/dynamic island and app header
- Enhanced `rounded-2xl` and `shadow-xl` for better visibility

### No Changes Needed To:
- `src/components/app/TaskCard.tsx` - toast calls remain the same
- Other files using `toast()` from sonner - the API is unchanged

