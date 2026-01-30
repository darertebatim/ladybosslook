

# Browse Hub Redesign

## Overview

Transform the Browse page from a programs-only store into a comprehensive **Tools & Content Hub** - the main discovery point for all app features, tools, and content. Designed specifically for iOS users with native-feeling interactions and polished visuals.

---

## Current State

- `AppStore.tsx` only shows free programs/courses with category filters
- Tools like Journal, Breathe, Water, Routines are accessible via Home quick actions or hidden routes
- No unified discovery experience for all app capabilities
- Meditate, Workout, Soundscape exist as playlist categories in Listen but aren't easily discoverable

---

## Proposed Visual Design

The new Browse page will have **four distinct sections** with a clean, iOS-native aesthetic:

```text
+------------------------------------------+
|  Browse                          [search] |
+------------------------------------------+
|                                          |
|  ═══ WELLNESS TOOLS ═══                  |
|  +----------+ +----------+ +----------+  |
|  | Journal  | | Breathe  | |  Water   |  |
|  |    📝    | |   🌬️    | |    💧    |  |
|  |  Daily   | | Breathing| | Hydration|  |
|  | Reflection| Exercises |  Tracker  |  |
|  +----------+ +----------+ +----------+  |
|  +----------+                            |
|  | Routines |                            |
|  |    ✨    |                            |
|  |  Daily   |                            |
|  |  Habits  |                            |
|  +----------+                            |
|                                          |
|  ═══ AUDIO EXPERIENCES ═══               |
|  +----------+ +----------+ +----------+  |
|  | Meditate | | Workout  | |Soundscape|  |
|  |    🧘    | |   💪    | |    🌊    |  |
|  |  Guided  | |Energizing|  Ambient   |  |
|  |Meditation| |  Audio   |   Sounds   |  |
|  +----------+ +----------+ +----------+  |
|                                          |
|  ═══ COMING SOON ═══ (collapsed/hidden)  |
|  [Period] [Fasting] [Mood] [Habits]...   |
|                                          |
|  ═══ BROWSE PROGRAMS ═══                 |
|  [Category circles: All, Courses, etc.]  |
|  [Program Card] [Program Card]           |
|  [Program Card] [Program Card]           |
|                                          |
+------------------------------------------+
```

---

## Tool Card Design

Each tool card will have a premium, iOS-native feel with soft shadows and rounded corners:

**Visual Specification:**

| Element | Style |
|---------|-------|
| Card Size | Square-ish aspect ratio (roughly 1:1.1) |
| Border Radius | 20px (rounded-2xl) |
| Background | Soft gradient based on tool color |
| Shadow | Subtle drop shadow (shadow-md) |
| Icon | Large emoji or Lucide icon in the center |
| Title | Centered, bold, below icon |
| Subtitle | Small muted text describing the tool |
| Active State | Scale down to 98% on tap |

**Color Palette for Tools:**

| Tool | Primary Color | Gradient | Icon |
|------|---------------|----------|------|
| Journal | Warm orange | `from-amber-100 to-orange-100` | BookOpen or 📝 |
| Breathe | Calming teal | `from-teal-100 to-cyan-100` | Wind or 🌬️ |
| Water | Fresh sky blue | `from-sky-100 to-blue-100` | Droplets or 💧 |
| Routines | Vibrant purple | `from-purple-100 to-violet-100` | Sparkles or ✨ |
| Meditate | Deep indigo | `from-indigo-100 to-purple-100` | Brain or 🧘 |
| Workout | Energetic rose | `from-rose-100 to-pink-100` | Dumbbell or 💪 |
| Soundscape | Ocean teal | `from-teal-100 to-blue-100` | Waves or 🌊 |

---

## Section 1: Wellness Tools

Active functional tools that users can use right now:

| Tool | Route | Description |
|------|-------|-------------|
| Journal | `/app/journal` | Daily reflections |
| Breathe | `/app/breathe` | Breathing exercises |
| Water | `/app/water` | Hydration tracker |
| Routines | `/app/routines` | Daily habits & tasks |

**Layout:** 2x2 grid

---

## Section 2: Audio Experiences

Audio-based tools that navigate to the Listen page with a pre-selected category filter:

| Tool | Route | Description |
|------|-------|-------------|
| Meditate | `/app/player?category=meditate` | Guided meditation sessions |
| Workout | `/app/player?category=workout` | Energizing workout audio |
| Soundscape | `/app/player?category=soundscape` | Ambient sounds for focus |

**Layout:** 3-column row or wrap

---

## Section 3: Coming Soon (Hidden by Default)

Future tools that will be grayed out with a "Coming Soon" badge. These are **not visible** yet but structured in the config for easy activation:

| Tool | Status | Description |
|------|--------|-------------|
| Period Tracker | hidden | Cycle tracking |
| Fasting Tracker | hidden | Intermittent fasting |
| Mood Tracker | hidden | Emotional wellness |
| Name Emotions | hidden | Emotional vocabulary |
| Reflections | hidden | Guided prompts |
| Tests | hidden | Assessments |
| Challenges | hidden | Goal challenges |
| AI Companion | hidden | AI chat assistant |
| Habit Tracker | hidden | Habit building |

**Visibility Control:** A simple boolean `comingSoon` flag in the config. When set to `true`, they're hidden. When ready, flip to `false`.

---

## Section 4: Browse Programs

Existing program browsing functionality moved to the bottom, with:
- Category filter circles (scrollable horizontal row)
- Program cards in 2-column grid
- Maintains all current enrollment logic

---

## Technical Implementation

### New Files to Create

**1. `src/lib/toolsConfig.ts`**
Centralized configuration for all tools:

```typescript
export interface ToolConfig {
  id: string;
  name: string;
  icon: string;        // Lucide icon name
  emoji?: string;      // Optional emoji alternative
  color: string;       // Color theme
  gradient: string;    // Tailwind gradient classes
  route: string;       // Navigation path
  description: string; // Short subtitle
  comingSoon?: boolean;
  hidden?: boolean;    // Don't show at all
}

export const wellnessTools: ToolConfig[] = [
  {
    id: 'journal',
    name: 'Journal',
    icon: 'BookOpen',
    emoji: '📝',
    color: 'orange',
    gradient: 'from-amber-100 to-orange-100',
    route: '/app/journal',
    description: 'Daily reflections',
  },
  {
    id: 'breathe',
    name: 'Breathe',
    icon: 'Wind',
    emoji: '🌬️',
    color: 'teal',
    gradient: 'from-teal-100 to-cyan-100',
    route: '/app/breathe',
    description: 'Breathing exercises',
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'Droplets',
    emoji: '💧',
    color: 'sky',
    gradient: 'from-sky-100 to-blue-100',
    route: '/app/water',
    description: 'Hydration tracker',
  },
  {
    id: 'routines',
    name: 'Routines',
    icon: 'Sparkles',
    emoji: '✨',
    color: 'purple',
    gradient: 'from-purple-100 to-violet-100',
    route: '/app/routines',
    description: 'Daily habits',
  },
];

export const audioTools: ToolConfig[] = [
  {
    id: 'meditate',
    name: 'Meditate',
    icon: 'Brain',
    emoji: '🧘',
    color: 'indigo',
    gradient: 'from-indigo-100 to-purple-100',
    route: '/app/player?category=meditate',
    description: 'Guided meditation',
  },
  {
    id: 'workout',
    name: 'Workout',
    icon: 'Dumbbell',
    emoji: '💪',
    color: 'rose',
    gradient: 'from-rose-100 to-pink-100',
    route: '/app/player?category=workout',
    description: 'Energizing audio',
  },
  {
    id: 'soundscape',
    name: 'Soundscape',
    icon: 'Waves',
    emoji: '🌊',
    color: 'teal',
    gradient: 'from-teal-100 to-blue-100',
    route: '/app/player?category=soundscape',
    description: 'Ambient sounds',
  },
];

export const comingSoonTools: ToolConfig[] = [
  { id: 'period', name: 'Period', icon: 'Heart', ... },
  { id: 'fasting', name: 'Fasting', icon: 'Timer', ... },
  { id: 'mood', name: 'Mood', icon: 'Smile', ... },
  { id: 'emotions', name: 'Emotions', icon: 'Palette', ... },
  { id: 'reflections', name: 'Reflections', icon: 'PenLine', ... },
  { id: 'tests', name: 'Tests', icon: 'ClipboardCheck', ... },
  { id: 'challenges', name: 'Challenges', icon: 'Trophy', ... },
  { id: 'ai', name: 'AI Coach', icon: 'Bot', ... },
  { id: 'habits', name: 'Habits', icon: 'Target', ... },
];
```

**2. `src/components/app/ToolCard.tsx`**
Reusable tool card component with iOS-native styling:

```typescript
interface ToolCardProps {
  tool: ToolConfig;
  size?: 'default' | 'compact';
}

export function ToolCard({ tool, size = 'default' }: ToolCardProps) {
  const navigate = useNavigate();
  const IconComponent = icons[tool.icon];
  
  return (
    <button
      onClick={() => {
        haptic.light();
        navigate(tool.route);
      }}
      className={cn(
        'relative rounded-2xl p-4 flex flex-col items-center justify-center gap-2',
        'bg-gradient-to-br shadow-md',
        'transition-all active:scale-[0.98]',
        tool.gradient,
        size === 'default' ? 'aspect-square' : 'aspect-[4/3]'
      )}
    >
      {/* Icon/Emoji */}
      {tool.emoji ? (
        <span className="text-4xl">{tool.emoji}</span>
      ) : (
        <IconComponent className="h-10 w-10 text-foreground/80" />
      )}
      
      {/* Title */}
      <h3 className="font-semibold text-foreground text-sm">{tool.name}</h3>
      
      {/* Subtitle */}
      <p className="text-xs text-muted-foreground text-center">
        {tool.description}
      </p>
    </button>
  );
}
```

### Files to Modify

**3. `src/pages/app/AppStore.tsx`**
Major redesign to incorporate all sections:

- Import new components and config
- Add Wellness Tools section (2x2 grid)
- Add Audio Experiences section (3-column row)
- Keep existing Programs section at the bottom
- Update search to filter tools by name as well

**4. `src/pages/app/AppPlayer.tsx`**
Minor update to support URL query param for initial category:

- Read `category` from search params on mount
- Set initial `selectedCategory` based on query param

---

## Search Behavior

When user searches:
1. First, filter tools by name match
2. Then, filter programs by title/description match
3. Show "Tools" section if any tools match
4. Show "Programs" section if any programs match

---

## Design Tokens

Consistent with existing app patterns:
- Section headers: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
- Card shadows: `shadow-md` for tools, existing styles for programs
- Active states: `active:scale-[0.98]`
- Border radius: `rounded-2xl` (20px)
- Haptic feedback: `haptic.light()` on tap

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/toolsConfig.ts` | Create | Centralized tools configuration |
| `src/components/app/ToolCard.tsx` | Create | Reusable tool card component |
| `src/pages/app/AppStore.tsx` | Modify | Add tools sections, reorganize layout |
| `src/pages/app/AppPlayer.tsx` | Modify | Support category query param |

---

## Future Extensibility

This config-based approach enables:
- Easy addition of new tools by adding to config
- Toggle visibility without code changes
- A/B testing different tool orders
- Per-user tool recommendations (future)
- Progressive disclosure of coming soon features

