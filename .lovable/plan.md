
# Tour System Overhaul: Educational Button-by-Button Guidance

## Overview
Complete overhaul of all tours to provide specific, educational guidance for every button and feature. The current tours show sections but don't teach users what each button does. This plan fixes that by making every tour step highlight a specific actionable button with clear instructions.

---

## 1. TourOverlay - Text Color Fix

**File: `src/components/app/tour/TourOverlay.tsx`**

Change the description text from grey to black for better readability:
- Line 300: Change `text-muted-foreground` to `text-foreground`

---

## 2. Breathe Tour - Fix "Add to Routine" Step

**Problem**: The `.tour-add-to-routine` class doesn't exist in the Breathe exercise screen. The screen auto-saves sessions but doesn't have an explicit "Add to Routine" button.

**Solution**: Remove the non-existent step and instead explain the exercise cards and duration options clearly.

**File: `src/components/app/tour/BreatheTour.tsx`**

New steps:
1. Welcome: "Take a moment to breathe. These exercises help calm your mind."
2. Categories: Target `.tour-categories` - "Filter by what you need: Calm, Focus, Energy, or Sleep."
3. Exercise Card: Target `.tour-exercise-card` - "Tap any card to start. Each exercise has a different rhythm."
4. Done: "Complete a session to track your progress. Just one minute helps."

**File: `src/pages/app/AppBreathe.tsx`**
- Add `tour-categories` class to the category filter container

---

## 3. Round Tour - Complete Course Detail Integration

**Problem**: RoundTour exists but is never used in AppCourseDetail. The course page has many important buttons that users need to understand.

**File: `src/pages/app/AppCourseDetail.tsx`**
- Import and add `RoundTour` component
- Add tour class markers to all key buttons

**File: `src/components/app/tour/RoundTour.tsx`**

Complete rewrite with steps for each button:

1. Welcome: "Welcome to your course! Everything you need is on this page."
2. Community Button: Target `.tour-community-btn` - "Tap to join your course community. Ask questions, share progress."
3. Playlist Button: Target `.tour-playlist-btn` - "Tap to access all audio lessons. New content unlocks as you progress."
4. Google Meet: Target `.tour-meet-btn` (conditional) - "Join live sessions with your coach. Check the schedule for times."
5. Calendar Sync: Target `.tour-calendar-btn` - "Sync all sessions to your phone calendar so you never miss one."
6. Sessions List: Target `.tour-sessions-list` - "See all scheduled sessions. Today's session is highlighted."
7. Content Schedule: Target `.tour-content-schedule` (conditional) - "Track when new lessons unlock. Set reminders to stay on track."
8. Done: "You're all set! Tap 'Community' to introduce yourself."

---

## 4. Explore Tour - Explain Each Tool

**File: `src/components/app/tour/ExploreTour.tsx`**

New steps explaining each tool individually:

1. Welcome: "This is your wellness toolkit. Each tool helps a different part of your day."
2. Journal: Target `.tour-tool-journal` - "Write daily reflections. Just a few words make a difference."
3. Breathe: Target `.tour-tool-breathe` - "Breathing exercises to calm your mind. Try one when stressed."
4. Water: Target `.tour-tool-water` - "Track your water intake. Hydration helps everything."
5. Emotions: Target `.tour-tool-emotions` - "Name how you feel. It helps you understand yourself."
6. Period: Target `.tour-tool-period` - "Track your cycle privately. See patterns and predictions."
7. Meditate: Target `.tour-tool-meditate` - "Guided meditations for any moment."
8. Sounds: Target `.tour-tool-soundscape` - "Ambient sounds for focus, sleep, or relaxation."
9. Programs: Target `.tour-programs-section` - "Browse courses and audio content. Tap to preview."
10. Search: Target `.tour-search-button` - "Can't find something? Search here."
11. Done: "Explore at your pace. Start with what feels right today."

**File: `src/pages/app/AppStore.tsx`**
- Add unique tour classes to each ToolCard (e.g., `tour-tool-journal`, `tour-tool-breathe`, etc.)

**File: `src/components/app/ToolCard.tsx`**
- Accept a `className` prop to enable tour markers

---

## 5. Playlist Tour - Clear Button Guidance

**File: `src/components/app/tour/PlaylistTour.tsx`**

New steps with specific button guidance:

1. Welcome: "This is your playlist. Each track is ready to play."
2. Track List: Target `.tour-track-list` - "Tap any track to start listening. Your progress is saved automatically."
3. Continue Button: Target `.tour-continue-btn` - "Tap 'Continue' to pick up where you left off."
4. Add to Rituals: Target `.tour-add-to-routine` - "Add this playlist to your daily rituals. Get reminders to listen."
5. Done: "Enjoy listening. Every minute counts toward your progress."

**File: `src/pages/app/AppPlaylistDetail.tsx`**
- Add `tour-continue-btn` class to the Continue/Play button

---

## 6. Home Tour - Verify Existing Steps

The Home Tour already covers nav items and welcome card. Verify it's working correctly.

**Check:**
- `.tour-welcome-card` class is on the WelcomeRitualCard
- `hasWelcomeCard` prop is correctly passed to HomeTour

---

## 7. Rituals Tour - Verify Actions Section

Already has `.tour-actions-section` targeting. Verify it's working.

**Check:**
- The class exists in AppInspire.tsx (confirmed: line 320)
- The step should work if elements exist

---

## Files Summary

### Files to Modify:

1. **`src/components/app/tour/TourOverlay.tsx`**
   - Change description text color from grey to black

2. **`src/components/app/tour/BreatheTour.tsx`**
   - Remove non-existent "add-to-routine" step
   - Add categories step

3. **`src/pages/app/AppBreathe.tsx`**
   - Add `tour-categories` class to category container

4. **`src/components/app/tour/RoundTour.tsx`**
   - Complete rewrite with 8 button-specific steps

5. **`src/pages/app/AppCourseDetail.tsx`**
   - Import and add RoundTour component
   - Add tour class markers to all buttons

6. **`src/components/app/tour/ExploreTour.tsx`**
   - Expand to 11 steps covering each tool individually

7. **`src/pages/app/AppStore.tsx`**
   - Add unique tour classes to each ToolCard

8. **`src/components/app/ToolCard.tsx`**
   - Accept className prop for tour markers

9. **`src/components/app/tour/PlaylistTour.tsx`**
   - Expand with Continue button step

10. **`src/pages/app/AppPlaylistDetail.tsx`**
    - Add `tour-continue-btn` class to Continue/Play button

---

## Testing Checklist

After implementation, verify each tour:

| Tour | Check |
|------|-------|
| **All Tours** | Text is black (not grey) |
| **Breathe** | Categories step highlights filter, exercise card works |
| **Course (Round)** | Each button is highlighted: Community, Playlist, Meet, Calendar, Sessions |
| **Explore** | Each tool is highlighted individually: Journal, Breathe, Water, Emotions, Period, Meditate, Sounds |
| **Playlist** | Continue button and Add to Rituals are explained |
| **Home** | Welcome card or Add Action ending works |
| **Rituals** | Actions section is highlighted |

---

## Technical Notes

- All tours use CSS class markers (e.g., `.tour-tool-journal`)
- Steps with `condition` functions skip if element doesn't exist
- Tours persist completion in localStorage
- "Restart All Tours" in Profile resets all flags
