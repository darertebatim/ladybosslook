
# Tour System Overhaul - COMPLETED ✅

All tours now have button-by-button educational guidance with "Add to My Rituals" steps.

## Changes Made

### 1. TourOverlay - Text Color Fix ✅
- Changed description text from grey to black

### 2. Breathe Tour ✅
- Added categories step targeting `.tour-categories`
- Added "Add to Rituals" step targeting `.tour-add-to-routine` on exercise cards

### 3. Round Tour (Course Detail) ✅
- Complete rewrite with 8 button-specific steps
- Targets: Community, Playlist, Meet, Calendar, Sessions, Content Schedule

### 4. Explore Tour ✅
- Expanded to 11 steps covering each tool individually
- Unique class for each tool: `.tour-tool-journal`, `.tour-tool-breathe`, etc.

### 5. Playlist Tour ✅
- Added Continue button step (`.tour-continue-btn`)
- Added Add to Rituals step (`.tour-add-to-routine`)

### 6. Rituals Tour ✅
- Added "Add to My Rituals" step targeting `.tour-action-add-btn` on action cards

### 7. Journal Tour ✅
- Added "Add to My Rituals" step targeting `.tour-journal-add-routine`

### 8. Water Tracking ✅
- Added `.tour-water-add-routine` class to add-to-routine button

### 9. Emotions Dashboard ✅
- Added `.tour-emotion-add-routine` class to add-to-routine button

## Testing Checklist

| Tour | Page | What to Check |
|------|------|---------------|
| **All Tours** | All | Text is now black (was grey) |
| **Breathe** | /app/breathe | Categories + exercise cards + Add to Rituals button |
| **Course (Round)** | /app/course/[slug]/[roundId] | All buttons highlighted |
| **Explore** | /app/browse | Each tool highlighted individually |
| **Playlist** | /app/player/playlist/[id] | Continue + Add to Rituals |
| **Rituals** | /app/routines | Categories + Ritual cards + Actions + Add button |
| **Journal** | /app/journal | New entry + Add to My Rituals |
| **Home** | /app/home | Welcome card or Add Action ending |

Reset tours via Profile → "Restart All Tours" to test each one.

