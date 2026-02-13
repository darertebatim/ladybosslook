

# Fasting Tracker Tool

## Overview
Build an intermittent fasting tracker at `/app/fasting`, inspired by the "Intermittent Fasting Tracker" app screenshots. The tool features a large circular progress ring, fasting zone indicators, preset fasting protocols, and session history -- all following existing tool patterns (Water, Breathe, etc.).

## Screens and States

### 1. Idle State (no active fast)
- Full-screen layout with warm gradient background (soft peach/rose tones matching the reference app)
- Large circular ring in the center showing "Time Since Last Fast" with elapsed time
- Bottom bar with 3 buttons:
  - **Protocol pill** (left): shows current protocol (e.g., "16h"), tapping opens the protocol selector sheet
  - **Start Fast** button (center): green rounded button to begin fasting
  - **Stats button** (right): bar-chart icon, opens history/stats sheet

### 2. Active Fasting State
- Same circular ring, now filling as a progress indicator
- Center shows: current fasting zone emoji + name, "Elapsed Time X%", and a large `HH:MM:SS` timer
- A small zone icon sits on top of the ring at the progress point
- A lightning bolt button on the right side of the ring opens the Fasting Zones info sheet
- Below the ring: **STARTED** (date/time) and **GOAL** (target date/time)
- Bottom bar changes: protocol pill (left), **End Fast** button (center, outlined), stats button (right)

### 3. Eating Window State (after ending a fast, for protocols with eating windows)
- Ring shows eating window countdown
- Center: "Eating window" label, elapsed time, "Ends on [date/time]"
- A colored dot sits on the ring progress point
- Bottom bar: protocol pill, **Start Fast** button (green), stats button

### 4. Fast Completion Sheet
- Bottom sheet that appears when ending a fast
- Shows: "Nice effort!" title, total fasting duration, zone reached
- Started/Ended timestamps with Edit buttons
- Delete and Save buttons at bottom

### 5. Protocol Selector Sheet
- Bottom sheet titled "Change fast goal"
- **Standard goals** grid (3 columns): Circadian 13h, 15:9 TRF 15h, 16:8 TRF 16h, 18:6 TRF 18h, 20:4 TRF 20h, OMAD 23h
- Each protocol card has a distinct color

### 6. Fasting Zones Sheet
- Bottom sheet showing metabolic phases with emoji, name, time range, description, and a progress bar for the active zone
- Zones:
  - Anabolic (0-4h) -- digestion phase
  - Catabolic (4-16h) -- glycogen burning
  - Fat Burning (16-24h) -- fat metabolism
  - Ketosis (24-72h) -- ketone production
  - Deep Ketosis (72h+) -- cellular repair
- Additional info section: Exercise, Nutrition, Body differences, Longer fasts, Research disclaimer

## Database

### New table: `fasting_sessions`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References auth.users |
| protocol | text | e.g., "16:8", "18:6", "20:4", "OMAD" |
| fasting_hours | integer | Target fasting hours |
| started_at | timestamptz | When fasting began |
| ended_at | timestamptz | When fasting ended (null if active) |
| created_at | timestamptz | Record creation |

- RLS: Users can only read/write their own rows

### New table: `fasting_preferences`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK, unique) | References auth.users |
| default_protocol | text | Default protocol (e.g., "16:8") |
| default_fasting_hours | integer | Default fasting duration |
| updated_at | timestamptz | Last updated |

- RLS: Users can only read/write their own row

## New Files

### Hooks
- **`src/hooks/useFastingTracker.tsx`**: Core hook managing active session state, CRUD for `fasting_sessions`, preferences, computed fasting zones, elapsed time, and stats (total fasts, average duration, longest streak)

### Components (in `src/components/fasting/`)
- **`FastingRing.tsx`**: SVG circular progress ring with zone indicator dot, zone emoji at progress point
- **`FastingZonesSheet.tsx`**: Bottom sheet with all zone descriptions and progress indicators
- **`FastingProtocolSheet.tsx`**: Bottom sheet with protocol grid selector
- **`FastingCompletionSheet.tsx`**: End-of-fast summary with edit capabilities
- **`FastingStatsSheet.tsx`**: History and stats view

### Page
- **`src/pages/app/AppFasting.tsx`**: Main page composing all components, managing state transitions between idle/fasting/eating

### Config Updates
- **`src/lib/toolsConfig.ts`**: Set `comingSoon: false` and `hidden: false` for the fasting tool
- **`src/App.tsx`**: Add route for `/app/fasting`
- **`src/integrations/supabase/types.ts`**: Add types for new tables

## Technical Details

- Timer uses `setInterval` with 1-second ticks (same pattern as `TaskTimerScreen` and `BreathingExerciseScreen`)
- Active fasting state persists in the database (`ended_at = null`), so reopening the app resumes the timer
- Fasting zones are computed client-side from elapsed hours -- no server logic needed
- The circular ring uses SVG `stroke-dasharray` / `stroke-dashoffset` for progress animation (similar to `TaskTimerScreen`)
- iOS safe areas handled via `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` padding
- Haptic feedback on start, end, zone transitions
- Pro task integration via `pro_link_type: 'fasting'` for routine linking (future phase)

