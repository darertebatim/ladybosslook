

# Fasting Action Card for Home Page

## What We're Building
A dedicated fasting status card (like the Period card) that appears on the home planner and shows live progress for both fasting and eating windows.

## Card Design

The card follows the same pattern as `PeriodStatusCard`:
- Rounded-2xl card with a warm gradient background (amber/orange tones)
- Left: Timer icon circle (amber)
- Center: Status text showing current mode + time remaining
- Right: Action button (navigate to fasting page)
- Bottom: A thin progress bar showing fasting or eating progress

### Card States

**1. Idle (no active fast, no eating window)**
- Title: "Ready to fast"
- Subtitle: "Tap to start your next fast"
- No progress bar
- Right button: Play icon to navigate to /app/fasting

**2. Fasting Mode**
- Title: "Fasting -- [zone emoji] [zone name]"
- Subtitle: Time remaining (e.g., "4h 23m remaining")
- Amber/orange striped progress bar showing fasting progress
- Right button: "Fast" badge button navigating to /app/fasting

**3. Eating Window**
- Title: "Eating Window"
- Subtitle: Time remaining (e.g., "5h 12m left to eat")
- Green progress bar showing eating window progress
- Right button: "Start Fast" or navigate button

## Technical Plan

### 1. Create `src/components/app/FastingStatusCard.tsx`
- New component following `PeriodStatusCard` pattern
- Uses a lightweight version of `useFastingTracker` data (reuse the hook)
- Shows live-updating progress with a 1-second interval
- Card structure:
  - Icon circle (amber, Timer icon)
  - Status badge ("Fasting" / "Eating" / "Idle")
  - Title + subtitle text
  - Thin progress bar at the bottom (amber for fasting, green for eating)
  - Navigate button on the right

### 2. Integrate into `src/pages/app/AppHome.tsx`
- Import `FastingStatusCard`
- Show it near the `PeriodStatusCard` section (when user has an active fast or has used fasting before)
- Only display when `selectedTag === null` (same as Period card)

### 3. Progress Bar Design
- Fasting bar: Amber gradient fill, shows elapsed vs target hours
- Eating bar: Green gradient fill, shows elapsed vs total eating window
- Both use the same thin rounded-full style (h-1.5)

## Files to Create/Edit
- **Create**: `src/components/app/FastingStatusCard.tsx`
- **Edit**: `src/pages/app/AppHome.tsx` (add import and render the card)
