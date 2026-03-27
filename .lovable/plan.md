

## Fix: Stop audio when video starts (and vice versa)

**Problem**: When tapping a promo banner that opens a video, the audio player keeps playing in the background alongside the video.

**Solution**: Use the existing `useAudioPlayer` hook inside `AppVideoPlayer` to stop/pause audio whenever a video starts playing. This is the simplest, most reliable approach.

### Changes

**1. `src/components/app/AppVideoPlayer.tsx`**
- Import `useAudioPlayer` from the audio context
- Add a `useEffect` that calls `pause()` (or `stop()`) on the audio player when `isOpen` becomes `true` and the video starts playing
- This mirrors how `playTrack` already stops the previous audio when a new one starts

**2. `src/pages/app/AppVideoDetail.tsx`** (standalone video page)
- Same approach: call `pause()` from `useAudioPlayer` when the component mounts / video loads

This is ~5 lines of code total. When the user navigates back to the audio player, they can resume manually — consistent with how music apps behave (e.g., Spotify pauses when you play a YouTube video).

