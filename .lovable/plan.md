
# Add Individual Audio to Routine

## Overview
Replace the bookmark functionality in the audio player with an "Add to My Rituals" feature. This allows users to add individual audio tracks (not just playlists) to their daily routine/planner.

## Changes

### 1. Add New Pro Link Type for Audio
**File: `src/lib/proTaskTypes.ts`**
- Add `'audio'` to the `ProLinkType` union type
- Add configuration entry in `PRO_LINK_CONFIGS` for audio type with:
  - Icon: Headphones
  - Badge text: "Listen"
  - Color: emerald (same family as playlist)
  - requiresValue: true (needs audio ID)
- Update `getProTaskNavigationPath()` to handle `'audio'` type → `/app/player/{audioId}`

### 2. Create Hooks for Audio Task Management
**New file: `src/hooks/useAudioRoutine.tsx`**
- `useExistingAudioTask(audioId)`: Check if user already has a routine task for this specific audio track
- `useQuickAddAudioTask()`: Mutation hook to add an audio track directly to user's routine

### 3. Replace Bookmark Button with Add to Routine
**File: `src/pages/app/AppAudioPlayer.tsx`**
- Remove `BookmarkButton` import and usage
- Remove `useBookmarks` hook and related state
- Add new "Add to Routine" button in the header (CalendarPlus icon)
- Implement simple tap-to-add behavior:
  - Shows CalendarPlus icon by default
  - On tap: adds audio to routine with default settings (daily, pro link to audio)
  - Shows success toast "Added to your rituals! 🎧"
  - After added: button becomes Check icon, tapping navigates to planner

### 4. Update TypeScript Types
**File: `src/hooks/useTaskPlanner.tsx`**
- Add `'audio'` to the `pro_link_type` union type in `UserTask`, `CreateTaskInput`, and `UpdateTaskInput` interfaces

### 5. Cleanup Bookmark Code (Optional but Recommended)
The following files can be removed or deprecated since bookmarks are no longer used:
- `src/components/audio/BookmarkButton.tsx` (remove)
- `src/components/audio/BookmarksList.tsx` (remove)
- `src/hooks/useBookmarks.tsx` (remove)
- Database table `audio_bookmarks` remains (can be cleaned later)

---

## Technical Details

### New ProLinkConfig for Audio
```text
audio: {
  value: 'audio',
  label: 'Audio Track',
  icon: Headphones,
  badgeText: 'Listen',
  color: 'emerald',
  gradientClass: 'bg-gradient-to-br from-emerald-100 to-teal-100',
  iconColorClass: 'text-emerald-600',
  badgeColorClass: 'bg-emerald-500/20 text-emerald-700',
  buttonClass: 'bg-white hover:bg-white/90 text-foreground',
  description: 'Link to a specific audio track',
  requiresValue: true,
}
```

### Navigation Path Update
```text
case 'audio':
  return `/app/player/${linkValue}`;
```

### Audio Player Header Button Logic
- Fetch current audio info (title, cover, duration)
- Check if task exists via `useExistingAudioTask(audioId)`
- If not added: show CalendarPlus icon → tap adds task
- If added: show Check icon → tap navigates to /app/home

### Task Creation Data
When adding an audio to routine:
```text
{
  title: audio.title,
  emoji: '🎧',
  color: 'sky',
  repeat_pattern: 'daily',
  pro_link_type: 'audio',
  pro_link_value: audioId,
  is_active: true,
}
```

---

## Files to Modify
1. `src/lib/proTaskTypes.ts` - Add 'audio' type and config
2. `src/hooks/useTaskPlanner.tsx` - Add 'audio' to type unions
3. `src/pages/app/AppAudioPlayer.tsx` - Replace bookmark with add-to-routine
4. **New:** `src/hooks/useAudioRoutine.tsx` - Hooks for audio task management

## Files to Remove
1. `src/components/audio/BookmarkButton.tsx`
2. `src/components/audio/BookmarksList.tsx`
3. `src/hooks/useBookmarks.tsx`

---

## User Experience
1. User opens audio player
2. In header, sees CalendarPlus icon instead of Bookmark icon
3. Taps icon → audio is added to their daily rituals
4. Toast appears: "Added to your rituals! 🎧"
5. Icon changes to Check mark
6. Tapping again navigates to Home/Planner
7. In planner, tapping the audio task opens the audio player directly
