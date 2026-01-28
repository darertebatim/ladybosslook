

# Breathe App Implementation Plan

## Overview
Building a complete breathing exercise tool inspired by Finch app, with:
- User-facing `/app/breathe` page with animated breathing circles
- Admin panel to manage breathing techniques
- Categories for filtering (Morning, Energize, Focus, Calm, Night)
- Full-screen breathing animation with circular visualizations
- Button on home header for quick access

## Feature Breakdown

### 1. Database Schema

**New Table: `breathing_exercises`**
```
id: uuid (primary key)
name: text (e.g., "Calm Breathing", "Focus Breathing")
description: text (explanation of technique)
category: text (morning, energize, focus, calm, night)
emoji: text (icon for the card)
inhale_seconds: integer (e.g., 4)
inhale_hold_seconds: integer (nullable, 0 if no hold)
exhale_seconds: integer (e.g., 6)
exhale_hold_seconds: integer (nullable, 0 if no hold)
inhale_method: text ("nose" or "mouth")
exhale_method: text ("nose" or "mouth")
sort_order: integer
is_active: boolean
created_at: timestamp
updated_at: timestamp
```

**New Table: `breathing_sessions`** (for tracking user history - optional for analytics)
```
id: uuid
user_id: uuid (references profiles)
exercise_id: uuid (references breathing_exercises)
duration_seconds: integer (how long user did it)
completed_at: timestamp
```

### 2. User-Facing Pages and Components

**Route: `/app/breathe` (full-screen, outside AppLayout)**

**Page Flow:**
1. **Exercise List Screen** - Purple gradient background, category tabs, exercise cards
2. **Info Sheet** - Shows technique details before starting (inhale/exhale timings)
3. **Settings Screen** - Choose duration (1, 3, 5, 10 min), breath type (Normal/Easier)
4. **Active Breathing Screen** - Full-screen animated circles with instructions

**Components to Create:**

| Component | Purpose |
|-----------|---------|
| `src/pages/app/AppBreathe.tsx` | Main page with exercise list |
| `src/components/breathe/BreathingExerciseCard.tsx` | Card for each exercise |
| `src/components/breathe/BreathingInfoSheet.tsx` | Bottom sheet showing technique details |
| `src/components/breathe/BreathingSettingsSheet.tsx` | Duration and type selector |
| `src/components/breathe/BreathingActiveScreen.tsx` | Full-screen animated breathing interface |
| `src/components/breathe/BreathingCircle.tsx` | Animated concentric circles component |

### 3. Animation System (Breathing Circles)

The core visual is **two concentric circles** that expand/contract:

**Circle Animation Logic:**
- **Outer circle**: Large background circle, subtle pulse
- **Middle circle**: Follows breathing rhythm - expands on inhale, contracts on exhale
- **Inner circle**: Contains text (phase name, method, countdown)

**Animation States:**
- `inhale`: Circles expand smoothly over N seconds
- `inhale_hold`: Circles stay expanded, shows countdown
- `exhale`: Circles contract smoothly over N seconds  
- `exhale_hold`: Circles stay contracted, shows countdown

**Technical Implementation:**
- Use CSS transitions with `transform: scale()` for smooth animations
- `transition-duration` set dynamically based on phase duration
- Inner text updates: "Inhale" / "Hold" / "Exhale" with method (Nose/Mouth)
- Progress bar at bottom fills over total session duration

### 4. Screen Designs

**Exercise List Screen:**
```
┌────────────────────────────────────────┐
│ ✕                  🍃                  │
│               Breathe                   │
│                                         │
│ ┌───────┬─────────┬───────┬─────┬─────┐│
│ │MORNING│ENERGIZE │ FOCUS │CALM │NIGHT││
│ └───────┴─────────┴───────┴─────┴─────┘│
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🏝️  Calm Breathing                  │ │
│ │     Lower your heart rate...        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🐯  Energy Breathing                │ │
│ │     Perfect when you need...        │ │
│ └─────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Active Breathing Screen:**
```
┌────────────────────────────────────────┐
│                                    (?) │
│                                        │
│         ┌──────────────────┐           │
│        ╱                    ╲          │
│       │    ┌──────────┐     │          │
│       │   ╱            ╲    │          │
│       │  │   Inhale    │    │          │
│       │  │    Nose     │    │          │
│       │   ╲            ╱    │          │
│       │    └──────────┘     │          │
│        ╲                    ╱          │
│         └──────────────────┘           │
│                                        │
│    ═══════════════════════════════     │
│    (progress bar)                      │
│                                        │
│    ┌──────────────────────────────┐    │
│    │           Pause              │    │
│    └──────────────────────────────┘    │
└────────────────────────────────────────┘
```

### 5. Admin Panel

**New admin page: `/admin/tools`**

Add "Tools" tab to AdminNav with a `breathing_exercises` manager:
- CRUD for breathing exercises
- Fields: name, description, category, emoji, timings, methods
- Sort order management
- Toggle active/inactive

### 6. Home Header Integration

**Modify:** `src/pages/app/AppHome.tsx`

Add a "Breathe" button next to the Journal icon in the header:
```tsx
<button onClick={() => navigate('/app/breathe')} className="p-2 text-foreground/70">
  <Wind className="h-5 w-5" />  {/* or custom breathing icon */}
</button>
```

### 7. Routing Updates

**Modify:** `src/App.tsx`

Add new route outside AppLayout (full-screen experience):
```tsx
<Route path="/app/breathe" element={<ProtectedRoute><AppBreathe /></ProtectedRoute>} />
```

Add admin route:
```tsx
<Route path="tools" element={<ProtectedRoute requiredPage="tools"><Tools /></ProtectedRoute>} />
```

---

## Technical Details

### Breathing Animation Algorithm

```typescript
interface BreathingPhase {
  type: 'inhale' | 'inhale_hold' | 'exhale' | 'exhale_hold';
  duration: number; // seconds
  method?: 'nose' | 'mouth';
}

// For "Calm Breathing" (4s inhale, 6s exhale):
const phases: BreathingPhase[] = [
  { type: 'inhale', duration: 4, method: 'nose' },
  { type: 'exhale', duration: 6, method: 'mouth' },
];

// For "Focus Breathing" (4-4-4-4 box breathing):
const phases: BreathingPhase[] = [
  { type: 'inhale', duration: 4, method: 'nose' },
  { type: 'inhale_hold', duration: 4 },
  { type: 'exhale', duration: 4, method: 'mouth' },
  { type: 'exhale_hold', duration: 4 },
];
```

### Circle Scale Values
- **Contracted** (exhale complete): `scale(0.4)` inner, `scale(0.6)` middle
- **Expanded** (inhale complete): `scale(1.0)` inner, `scale(1.0)` middle

### Color Scheme (matching Finch screenshots)
- Background: `#5C5A8D` (deep purple-blue)
- Outer circle: `#6B699E` (lighter purple)
- Middle circle: `#9A98C2` (light purple/gray)
- Inner circle: `#7C7AB0` (medium purple)
- Text: White

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/AppBreathe.tsx` | Main breathe page |
| `src/pages/admin/Tools.tsx` | Admin tools page |
| `src/components/breathe/BreathingExerciseCard.tsx` | Exercise list card |
| `src/components/breathe/BreathingInfoSheet.tsx` | Technique info sheet |
| `src/components/breathe/BreathingSettingsSheet.tsx` | Duration selector |
| `src/components/breathe/BreathingActiveScreen.tsx` | Active breathing UI |
| `src/components/breathe/BreathingCircle.tsx` | Animated circles |
| `src/components/admin/BreathingExercisesManager.tsx` | Admin CRUD |
| `src/hooks/useBreathingExercises.tsx` | Data fetching hook |

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/app/breathe` and `/admin/tools` routes |
| `src/pages/app/AppHome.tsx` | Add breathe button to header |
| `src/components/admin/AdminNav.tsx` | Add Tools menu item |

---

## Implementation Order

1. **Database**: Create `breathing_exercises` table with RLS
2. **Admin**: Build BreathingExercisesManager and Tools page
3. **Seed Data**: Add initial exercises (Calm, Focus, Energy, etc.)
4. **User Page**: Build AppBreathe with exercise list
5. **Animation**: Build BreathingActiveScreen with circle animations
6. **Sheets**: Build info and settings sheets
7. **Integration**: Add button to home header
8. **Testing**: Test full flow end-to-end

