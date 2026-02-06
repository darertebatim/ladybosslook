

# Interactive Tour System - Comprehensive Improvements

## Overview
This plan addresses multiple issues with the current tour system: missing tour steps, copy quality, UI accessibility, and missing tours for key features.

---

## 1. TourOverlay UI Improvements

### Close Button Size (Critical - Screenshot Shows Issue)
The close button is too small for mobile touch targets. Apple recommends 44x44pt minimum.

**File: `src/components/app/tour/TourOverlay.tsx`**
- Increase close button from `p-1.5` to `p-2.5`
- Increase icon from `h-4 w-4` to `h-5 w-5`
- Add better touch target with `min-h-[44px] min-w-[44px]`

---

## 2. Home Tour Enhancements

### A. Welcome Card Integration
Add conditional step for the Welcome Ritual Card when user has no actions.

### B. Dynamic Ending
- If Welcome Card is visible: End tour encouraging user to "flip the card"
- If Welcome Card is not visible: End tour encouraging user to add their first action

**File: `src/components/app/tour/HomeTour.tsx`**
- Add `hasWelcomeCard` prop
- Add Welcome Card step targeting `.tour-welcome-card`
- Modify final step based on Welcome Card availability

**File: `src/pages/app/AppHome.tsx`**
- Add `tour-welcome-card` class to `WelcomeRitualCard` component
- Pass `hasWelcomeCard={showWelcomeCard}` to HomeTour

---

## 3. Rituals Tour - Show Actions List

Add step explaining the "Actions" section (task templates) shown under rituals.

**File: `src/components/app/tour/RitualsTour.tsx`**
- Add new step targeting `.tour-actions-section`
- Position after ritual cards, before final step

**File: `src/pages/app/AppInspire.tsx`**
- Add `tour-actions-section` class to the Actions section container

---

## 4. Explore Tour - Explain Specific Tools

Expand Explore tour to highlight individual tools by purpose.

**File: `src/components/app/tour/ExploreTour.tsx`**
Add steps for:
- Journal (reflection)
- Breathe (calm)
- Water (hydration)
- Emotions (name feelings)

---

## 5. New Playlist Tour (Add to Routine Feature)

Create new tour for playlist detail pages that shows the "Add to My Rituals" button.

**New File: `src/components/app/tour/PlaylistTour.tsx`**
Steps:
1. Welcome - This is your audio content
2. Track list - See all tracks, tap to play
3. Add to Routine button - Add this to your daily rituals
4. Done - Enjoy your listening

**Files to Update:**
- `src/hooks/useFeatureTour.tsx` - Add 'playlist' to TourFeature type
- `src/components/app/tour/index.ts` - Export PlaylistTour
- `src/pages/app/AppPlaylistDetail.tsx` - Integrate tour, add class markers
- `src/lib/clientReset.ts` - Add playlist tour key

---

## 6. Breathe Tour - Show Add to Routine

Expand Breathe tour to show the "Add to Routine" button on exercise detail.

**File: `src/components/app/tour/BreatheTour.tsx`**
- Add step for add-to-routine functionality
- Target `.tour-add-to-routine`

**File: `src/components/breathe/BreathingExerciseScreen.tsx`** (or relevant component)
- Add `tour-add-to-routine` class to the add button

---

## 7. Rewrite All Tour Copy

Rewrite all tour text to be warmer, more direct, and aligned with Simora's "strength companion" philosophy. Use simple A2/B1 English, avoid pressure words.

### Home Tour Copy Refresh
```
Welcome: "Hi there! This is your home. Everything starts here."
Menu: "Tap the menu to see all your tools."
Calendar: "Swipe to pick a day. The flame shows days you showed up."
Add Action: "Tap + to add something small to your day."
Explore: "Find new tools and content here."
Listen: "Audio for calm, focus, or movement."
Channels: "See updates from your community."
Support: "We're here if you need anything."
Final (with Welcome Card): "Ready? Flip the card below to pick your first action."
Final (without Welcome Card): "Ready? Tap + to add your first action."
```

### Rituals Tour Copy Refresh
```
Welcome: "These are ready-made rituals. Pick what feels right."
Categories: "Filter by type: morning, evening, focus, and more."
Ritual Card: "Tap any ritual to see what's inside."
Actions Section: "Individual actions live here. Add one at a time."
Done: "Start small. One action is enough."
```

### Player Tour Copy Refresh
```
Welcome: "Your audio library. Listen anytime, anywhere."
Playlists: "Browse by category. Free content is always here."
Continue: "Pick up where you left off."
Done: "Every listen is a step forward."
```

### Breathe Tour Copy Refresh
```
Welcome: "Breathing exercises to calm your mind."
Exercise: "Each one has a different purpose. Try one."
Add to Routine: "Add this to your daily plan."
Done: "Even one minute helps."
```

### Journal Tour Copy Refresh
```
Welcome: "Your private space to reflect."
New Entry: "Tap + to start writing."
Mood: "Track how you feel over time."
Done: "A few words each day make a difference."
```

### Explore Tour Copy Refresh
```
Welcome: "Everything Simora offers is here."
Tools: "Journal, Breathe, Water, Emotions. Tap any to start."
Programs: "Courses and audio content. Browse freely."
Search: "Find what you need quickly."
Done: "Take your time. Explore what calls to you."
```

### Period Tour Copy Refresh
```
Welcome: "Track your cycle privately."
Log: "Tap a day to log."
Insights: "See patterns and predictions."
Done: "Understanding your body is strength."
```

### Programs Tour Copy Refresh
```
Welcome: "Your enrolled programs live here."
Card: "Tap to open lessons and materials."
Progress: "See how far you've come."
Done: "One lesson at a time."
```

### Playlist Tour Copy (New)
```
Welcome: "This is your playlist. Listen at your pace."
Tracks: "Tap any track to play."
Add: "Want to remember this? Add it to your rituals."
Done: "Enjoy. Every listen counts."
```

---

## 8. Files Summary

### Files to Modify:
1. `src/components/app/tour/TourOverlay.tsx` - Bigger close button
2. `src/components/app/tour/HomeTour.tsx` - Welcome card + dynamic ending + copy
3. `src/components/app/tour/RitualsTour.tsx` - Actions section step + copy
4. `src/components/app/tour/ExploreTour.tsx` - Tool explanations + copy
5. `src/components/app/tour/BreatheTour.tsx` - Add to routine + copy
6. `src/components/app/tour/PlayerTour.tsx` - Copy refresh
7. `src/components/app/tour/JournalTour.tsx` - Copy refresh
8. `src/components/app/tour/PeriodTour.tsx` - Copy refresh
9. `src/components/app/tour/ProgramsTour.tsx` - Copy refresh
10. `src/components/app/tour/RoundTour.tsx` - Copy refresh
11. `src/components/app/tour/index.ts` - Export PlaylistTour
12. `src/hooks/useFeatureTour.tsx` - Add 'playlist' type
13. `src/lib/clientReset.ts` - Add playlist reset key
14. `src/pages/app/AppHome.tsx` - Welcome card class + tour prop
15. `src/pages/app/AppInspire.tsx` - Actions section class
16. `src/pages/app/AppPlaylistDetail.tsx` - Tour integration + classes

### New Files:
1. `src/components/app/tour/PlaylistTour.tsx` - Playlist detail tour

---

## 9. Testing Checklist

After implementation, verify:

1. **Home Tour** - Menu, Calendar, Add, Banner (if exists), Rituals (if exists), Programs (if exists), all 4 nav items, Welcome Card / Add Action ending
2. **Rituals Tour** - Categories, Ritual cards, Actions section
3. **Player Tour** - Playlists, Continue listening
4. **Playlist Tour (New)** - Tracks, Add to Routine button
5. **Breathe Tour** - Exercise cards, Add to routine
6. **Journal Tour** - New entry button
7. **Explore Tour** - Tools section, Programs section, Search
8. **Period Tour** - Log days, Insights
9. **Programs Tour** - Program cards, Progress
10. **Round Tour** - Audio, Live sessions, Materials, Feed
11. **UI** - Close button is easy to tap on mobile

---

## Technical Notes

- All tours use `isFirstVisit={true}` for automatic trigger
- Tours persist completion in localStorage: `simora_tour_[feature]_done`
- "Restart All Tours" in Profile clears all these flags
- Admin "Ultimate Reset" also clears tour flags via `fullClientReset()`

