

## Expand Share Button Across the App

### Summary
Create a reusable `useShareContent` hook and add Share2 buttons to 7 more places across the app. Also fix "Simora" branding in ChallengeCompleteSummary.

### 1. New file: `src/hooks/useShareContent.ts`
Reusable hook that extracts the share logic from `AppInspireDetail.tsx`:
- Accepts `{ title, text, imageUrl? }`
- Returns `{ handleShare, isSharing }`
- Logic: fetch image → File → `navigator.share({ files, title, text })` → fallback text-only → fallback clipboard
- All messages append `\nDownload the app: https://apps.apple.com/app/id6755076134`

### 2. Refactor `AppInspireDetail.tsx`
Replace inline share logic with `useShareContent` hook (remove Instagram button too).

### 3. Pages to add Share2 button

| Page | Button Location | Image | Share Message |
|---|---|---|---|
| **AppVideoPlaylistDetail** | Header (next to AddedToRoutineButton) | `playlist.cover_image_url` | "🎬 Check out '{name}' on Routine Ladyboss 💫" |
| **AppPlaylistDetail** | Header (next to AddedToRoutineButton) | cover from hero | "🎵 Check out the '{name}' playlist on Routine Ladyboss 💫" |
| **AppAudioPlayer** | Header area | playlist/track cover | "🎧 I'm listening to '{track}' on Routine Ladyboss 💫" |
| **AppCourseDetail** | Header area | program cover image | "📚 I'm taking '{course}' on Routine Ladyboss 💫" |
| **AppJournalEntry** | Header (next to Done button) | No image (text only) | "📝 I just journaled on Routine Ladyboss — try it! 💫" |
| **AppFeedPost** | Header area | No image | "💬 Check out this post on Routine Ladyboss 💫" |
| **AppReflectionNoteDetail** | Header area | No image | "🪞 I just reflected on Routine Ladyboss 💫" |

### 4. Fix branding: `ChallengeCompleteSummary.tsx`
Replace `#Simora` → `#RoutineLadyboss` in the share text (line 74).

### Implementation order
1. Create `useShareContent` hook
2. Refactor `AppInspireDetail` to use it (remove Instagram button)
3. Add share to each page one by one
4. Fix ChallengeCompleteSummary branding

