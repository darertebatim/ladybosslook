

# Dedicated Video Player Component for iOS App

## Overview
Build a new `AppVideoPlayer` component -- a full-screen, iOS-optimized video player sheet that handles YouTube, Vimeo, and direct MP4/WebM files from Supabase storage. It will support both landscape (16:9) and vertical (9:16) video orientations, with native-feeling controls and smooth iOS interactions.

## What Gets Built

### 1. New Component: `src/components/app/AppVideoPlayer.tsx`
A full-screen bottom sheet (100vh) video player with:

- **Dark background** for immersive viewing (black bg, white text)
- **Auto-detection** of video type using existing `videoUtils.ts` helpers
- **Orientation-aware layout:**
  - Landscape videos (YouTube, Vimeo, horizontal MP4): standard 16:9 aspect ratio, centered vertically
  - Vertical videos (9:16 MP4/shorts): tall container that fills most of the screen height
- **Direct MP4 support** via native `<video>` tag with `playsInline`, `controls`, and `webkit-playsinline` for proper iOS behavior
- **YouTube/Vimeo** via optimized iframes with `playsinline=1`, `rel=0`, `modestbranding=1`
- **Playback speed toggle** (1x / 1.5x / 2x) for direct video files
- **Loading spinner** while video/iframe loads
- **Fallback button** ("Watch on YouTube/Vimeo") if embed fails
- **Close button** (X) in top-left corner, overlaying the dark background
- **Title bar** below the video showing the video title and optional description
- **Safe area padding** (`pb-safe`) for iPhone home indicator

### 2. Update `src/lib/videoUtils.ts`
Add a helper to detect video orientation:
```text
isVerticalVideo(url: string): boolean
```
- YouTube Shorts URLs return true
- TikTok/Instagram Reels return true
- Direct files: defaults to horizontal (can be overridden via prop)

### 3. Integrate Into Existing Consumers
Replace video rendering in these locations to use the new player:

- **`SupplementViewer.tsx`** -- Video type modules open `AppVideoPlayer` instead of inline iframe
- **`FeedMessage.tsx`** -- Tapping a video thumbnail opens `AppVideoPlayer` instead of inline embed
- **`HomeBanner.tsx`** -- Video banners open `AppVideoPlayer` on tap

Each integration point will show a thumbnail/preview card. Tapping it opens the full-screen player.

## Technical Details

### AppVideoPlayer Props
```text
interface AppVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
  isVertical?: boolean;  // override auto-detection
}
```

### iOS-Specific Handling
- Uses `playsInline` and `webkit-playsinline` attributes on `<video>` to prevent automatic fullscreen on iOS
- Dark status bar area with safe area insets
- `overscroll-contain` to prevent pull-to-close conflicts
- `touch-action: none` on video container to prevent scroll interference
- Hardware-accelerated animations for sheet open/close

### Direct Video Player Features
- Native `<video>` element with built-in controls
- Speed button overlay (cycles 1x -> 1.5x -> 2x)
- Error state with retry button and "Open in Browser" fallback
- Loading state with spinner

### Vertical Video Layout
- For vertical content: container uses `aspect-[9/16]` with `max-h-[75vh]` centered in the sheet
- For horizontal content: standard `aspect-video` (16:9) with full width

### Files to Create
- `src/components/app/AppVideoPlayer.tsx` -- the main player component

### Files to Modify
- `src/lib/videoUtils.ts` -- add `isVerticalVideo()` helper
- `src/components/app/SupplementViewer.tsx` -- delegate video rendering to AppVideoPlayer
- `src/components/feed/FeedMessage.tsx` -- open AppVideoPlayer on video tap
- `src/components/app/HomeBanner.tsx` -- open AppVideoPlayer on banner video tap

