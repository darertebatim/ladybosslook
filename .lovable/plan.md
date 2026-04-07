

## Plan: Add "Optimize Covers" Button to Routines and Audio Playlists Admin Pages

### What We're Doing
Adding the same batch cover optimization feature (compress existing covers to WebP) that exists in the Reading Manager to two more admin sections: **Routines Bank** and **Audio Playlist Manager**.

### Technical Approach

**1. Extract a reusable `optimizeCoversForTable` utility** (in `src/lib/imageUtils.ts`)
- A generic async function that takes a list of items with cover URLs, a Supabase table name, and a column name
- Downloads each non-WebP cover, compresses it via `compressImage`, re-uploads as `.webp`, and updates the DB record
- Returns a `{ done, failed }` count
- This avoids duplicating the same logic in three places

**2. Add "Optimize Covers" button to `RoutinesBank.tsx`**
- Query `routines_bank` for entries where `cover_image_url` exists and doesn't end with `.webp`
- Show the ⚡ Optimize Covers button in the header when unoptimized covers exist
- Uses the shared utility to process them

**3. Add "Optimize Covers" button to `PlaylistManager.tsx`**
- Same pattern for `audio_playlists` table, checking `cover_image_url`
- Button appears in the playlist list header area

**4. Refactor `ReadingManager.tsx`**
- Replace its inline optimization logic with a call to the shared utility

### Files Changed
- `src/lib/imageUtils.ts` — add `optimizeCoversForTable()` helper
- `src/pages/admin/ReadingManager.tsx` — refactor to use shared helper
- `src/components/admin/RoutinesBank.tsx` — add optimize button
- `src/components/admin/PlaylistManager.tsx` — add optimize button

