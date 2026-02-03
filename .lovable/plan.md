

# Plan: Add Menu to Home Header & Simplify Layout

## Summary
Replace the scattered icon buttons around "Today" in the home header with a clean hamburger menu that consolidates all tools and pages in one place. The header will have a simpler layout: menu icon on the left, "Today ★" in the center, and streak badge on the right.

## Current State
The home header currently has:
- **Left side**: 3 buttons (Water, Breathe, Journal)
- **Center**: "Today ★" title or month navigation
- **Right side**: 2 buttons (Routines, Profile) + Streak badge

These buttons clutter the header and take up valuable space.

## Proposed Changes

### Visual Design
```text
┌─────────────────────────────────────────────────┐
│  ☰         Today ★                    🔥 12    │
│  menu      (centered)                 streak   │
└─────────────────────────────────────────────────┘
```

The menu will slide in from the left and show all tools organized in sections:
- **Wellness Tools**: Journal, Breathe, Water, Emotions, Period, Routines
- **Audio & Video**: Meditate, Videos, Sounds  
- **My Account**: My Programs, My Profile

---

## Technical Details

### 1. Create New HomeMenu Component
**File**: `src/components/app/HomeMenu.tsx`

A new Sheet-based menu component that:
- Triggers from a hamburger (Menu) icon button
- Slides in from the left side
- Lists all tools from `toolsConfig.ts` organized by category
- Uses the existing `ToolCard` component in compact mode
- Includes navigation to Profile and Programs pages

### 2. Modify AppHome.tsx Header

**Remove** the following from the header:
- Left side buttons: Water (Droplets), Breathe (Wind), Journal (NotebookPen)
- Right side buttons: Routines (Sparkles), Profile (User)

**Add** a single menu trigger button on the left side.

**Simplified header structure**:
```text
[grid-cols-[auto_1fr_auto]]
  Left: Menu button (hamburger icon)
  Center: "Today ★" or month navigation (with flex justify-center)
  Right: Streak badge only
```

### 3. Files to Modify/Create

| File | Action | Changes |
|------|--------|---------|
| `src/components/app/HomeMenu.tsx` | Create | New menu sheet component with tool categories |
| `src/pages/app/AppHome.tsx` | Modify | Remove 5 icon buttons, add menu trigger, simplify grid layout |

### 4. Menu Content Structure

```text
┌─────────────────────────────────────┐
│  ✕  Menu                            │
├─────────────────────────────────────┤
│  WELLNESS TOOLS                     │
│  ┌─────────┐ ┌─────────┐           │
│  │ Journal │ │ Breathe │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │ Water   │ │ Emotions│           │
│  └─────────┘ └─────────┘           │
│  ...                                │
├─────────────────────────────────────┤
│  AUDIO & VIDEO                      │
│  ...                                │
├─────────────────────────────────────┤
│  MY ACCOUNT                         │
│  My Programs                        │
│  My Profile                         │
└─────────────────────────────────────┘
```

### 5. Implementation Details

**HomeMenu.tsx**:
- Import `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetTrigger` from UI
- Import `wellnessTools`, `audioTools` from `toolsConfig.ts`
- Import `Menu` icon from lucide-react
- Use 2-column grid for tool cards
- Close menu on tool selection using `navigate()` and `setOpen(false)`

**AppHome.tsx changes**:
- Remove imports: `Wind`, `Droplets`, `NotebookPen`, `Sparkles`, `User` (if not used elsewhere)
- Add import for `HomeMenu` component  
- Simplify header grid from 3 columns with complex buttons to simple 3 elements
- Remove the transition logic for hiding buttons when calendar is expanded (no longer needed)

