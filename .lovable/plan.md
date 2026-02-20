
# Persistent Offline Caching Plan

## The Problem

Every time a user opens the app or navigates between tabs, the following content is re-downloaded from Supabase/CDN:
- Audio files (streamed fresh each time)
- Playlist covers & ritual covers (images fetched every session)
- Actions & Routines bank data (DB queries every 2–5 minutes)
- All other app data (playlists, tasks, home data)

React Query already holds data in RAM for 15 minutes — but when the app is closed and reopened, everything starts fresh again. On iOS, the WKWebView image cache is also subject to OS memory pressure and can be wiped at any time.

This plan adds **three layers of persistent caching** that survive app restarts:

---

## Layer 1 — React Query Persistent Cache (Data: Tasks, Routines, Playlists, Home)

**What it does**: Saves React Query's in-memory cache to `localStorage` (or `IndexedDB`) so when the app reopens, data is available instantly — no spinner, no loading state.

**How**: Use `@tanstack/query-persist-client-core` + `createSyncStoragePersister` to automatically serialize/deserialize the query cache on app open/close.

**What gets cached persistently**:
- `player-data` — all playlists and playlist items
- `routines-bank` — all rituals/routines bank items
- `routine-categories` — category list
- `new-home-data` — home page stats
- `courses-data` — enrollment info
- `planner-all-tasks` — user's task list

**Cache expiry**: Each query keeps its existing `staleTime` (2–5 min). Stale data shows instantly while fresh data loads in background. Persisted cache expires after 24 hours automatically.

**Files to change**:
- `src/App.tsx` — wrap `QueryClientProvider` with `PersistQueryClientProvider`, configure `createSyncStoragePersister`

---

## Layer 2 — Image Caching with Capacitor Filesystem (Native Only)

**What it does**: On native iOS/Android, download cover images to the app's private storage the first time they are seen. On subsequent visits, load from device — no network request at all.

**Images to cache**:
- Playlist cover images (`cover_image_url` on `audio_playlists`)
- Ritual/routine cover images (`cover_image_url` on `routines_bank`)
- Audio track cover images (`cover_image_url` on `audio_content`)

**How**:
1. Create `src/lib/imageCache.ts` — a utility using `@capacitor/filesystem` with `Directory.Cache`:
   - `getCachedImage(url)` — checks if image exists locally, returns local `file://` URI if yes
   - `cacheImage(url)` — fetches image bytes and writes to `Directory.Cache/images/<hash>.jpg`
   - `clearImageCache()` — admin utility to wipe cached images
2. Create `src/components/ui/CachedImage.tsx` — a drop-in replacement for `<img>` that transparently uses the cache on native, falls back to normal `<img>` on web.
3. Replace `<img src={coverImageUrl}>` in: `PlaylistCard.tsx`, `AudioCard.tsx`, `MiniPlayer.tsx`, and the ritual card components with `<CachedImage>`.

**Cache key**: MD5/hash of the URL string stored as filename (e.g. `images/a1b2c3.jpg`). This means if the URL changes (admin updates cover), the old cache is ignored and new image is downloaded.

**Admin delete scenario**: If you delete a cover in the admin panel and the URL changes, new image downloads automatically. If the same URL is reused (unlikely), admin can clear cache from Profile settings.

---

## Layer 3 — Audio File Download for Offline Playback (Native Only)

**What it does**: Lets users download individual audio tracks to play without internet, exactly like Spotify's "download" feature.

**How**:
1. Create `src/lib/audioCache.ts` — utility using `@capacitor/filesystem` with `Directory.Data` (permanent, never auto-cleared by OS):
   - `isAudioCached(trackId)` — checks if file exists
   - `downloadAudio(track, onProgress)` — fetches audio file with progress, saves to `audio/<trackId>.mp3`
   - `getCachedAudioPath(trackId)` — returns `file://` URI for local playback
   - `deleteAudio(trackId)` — removes downloaded file
   - `getDownloadedTracks()` — returns list of all downloaded track IDs

2. Update `AudioPlayerContext.tsx`:
   - In `playTrack()`, check `isAudioCached(track.id)` first
   - If cached: use local `file://` path instead of `track.fileUrl`
   - If not cached: stream as today (no change for non-downloaded tracks)

3. Add Download UI in `AppAudioPlayer.tsx` (the full-screen player):
   - Download icon button next to share/other controls
   - Shows progress ring while downloading
   - Shows "Downloaded" checkmark when complete
   - Long-press to delete download

4. Create `src/hooks/useAudioDownload.ts` — React hook wrapping `audioCache.ts`:
   - `downloadTrack(track)` — triggers download with toast progress
   - `isDownloaded(trackId)` — reactive boolean
   - `deleteDownload(trackId)` — removes and shows toast
   - `downloadedTracks` — Set of all downloaded IDs (loaded from filesystem on init)

5. Add "Downloads" section in `AppProfile.tsx` showing downloaded tracks with size info and delete option.

---

## What Does NOT Need Caching (Already Efficient)

- **Journal entries, mood logs, fasting data** — user-specific, changes constantly, should always be fresh
- **Feed posts & chat messages** — real-time, must stay live
- **Task completions** — changes daily, 30-second stale time is correct
- **Emojis (FluentEmoji)** — already served as static assets from CDN with long HTTP cache headers; browser/WebView cache handles this correctly and the OS rarely clears static asset cache

---

## Implementation Order

1. **Layer 1 first** (React Query persist) — highest impact, touches all data, no UI change needed
2. **Layer 2 second** (image cache) — visual improvement, straightforward component swap
3. **Layer 3 last** (audio download) — most complex, adds new UI

---

## Technical Details

### New dependencies needed
- `@tanstack/query-persist-client-core` — React Query's official persistence adapter
- `@tanstack/query-sync-storage-persister` — localStorage persister for React Query

### Capacitor Filesystem directories
```text
Directory.Cache   → Images (OS can clear if low storage — acceptable)
Directory.Data    → Audio downloads (permanent, user controls deletion)
```

### Cache invalidation strategy
- **Data cache**: Invalidated automatically when mutations run (existing `queryClient.invalidateQueries` calls already handle this)
- **Image cache**: URL-based key — if admin changes image URL, new image is downloaded automatically
- **Audio cache**: User explicitly downloads/deletes; admin cannot force re-download (by design — user owns their downloads)

### Size estimates
- Playlist/ritual covers: ~50–100 images × ~50–100KB = 5–10MB total
- One audio track: typically 30–80MB (varies by length)
- React Query persist cache: < 1MB (just JSON data, no binary)

### Web fallback
All caching is wrapped in `isNativeApp()` checks. On web (browser), the app behaves exactly as today — browser HTTP cache handles images, React Query persist uses localStorage.
