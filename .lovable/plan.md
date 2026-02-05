
# Add Promo Banners to Multiple App Locations

## Overview

Currently, the `PromoBanner` component exists but needs to be placed in strategic locations throughout the app. This plan adds promo banners to four new locations:

1. **Home Page** - Under the "Try a Ritual" section (suggested rituals)
2. **Explore Page** - Under header, above the Tools section
3. **Listen Page** - Under header, above playlists
4. **Audio Player Page** - Under play controls (targeting specific playlists)

## Technical Approach

### Database Changes

Add a new `display_location` column to the `promo_banners` table to control where each banner appears:

```sql
ALTER TABLE promo_banners 
ADD COLUMN display_location text NOT NULL DEFAULT 'home';
```

Supported values:
- `home` - Shows on Home page (existing + under rituals)
- `explore` - Shows on Explore/Browse page
- `listen` - Shows on Listen page
- `player` - Shows on Audio Player page
- `all` - Shows in all locations

### Component Enhancement

Create a reusable `LocationPromoBanner` component that:
- Accepts a `location` prop to filter which banners to show
- Optionally accepts `playlistId` for player-specific targeting
- Reuses the existing filtering logic (audience targeting, display frequency, dismissals)

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/...` | Create | Add `display_location` column |
| `src/components/app/PromoBanner.tsx` | Modify | Add `location` and `playlistId` props for filtering |
| `src/pages/app/AppHome.tsx` | Modify | Add PromoBanner after suggested rituals section |
| `src/pages/app/AppStore.tsx` | Modify | Add PromoBanner below header, above Tools |
| `src/pages/app/AppPlayer.tsx` | Modify | Add PromoBanner below header, above playlists |
| `src/pages/app/AppAudioPlayer.tsx` | Modify | Add PromoBanner below play controls |
| `src/components/admin/PromoBannerManager.tsx` | Modify | Add location selector in admin UI |

---

## Implementation Details

### 1. Database Migration

```sql
ALTER TABLE promo_banners 
ADD COLUMN display_location text NOT NULL DEFAULT 'home';

-- Add location for player-specific banners (filter by playlist)
ALTER TABLE promo_banners 
ADD COLUMN target_playlist_ids uuid[] DEFAULT '{}';

-- Index for efficient location filtering
CREATE INDEX idx_promo_banners_location ON promo_banners(display_location);
```

### 2. Update PromoBanner Component

Add props to the component:

```tsx
interface PromoBannerProps {
  location?: 'home' | 'explore' | 'listen' | 'player' | 'all';
  currentPlaylistId?: string; // For player page targeting
  className?: string;
}

export function PromoBanner({ 
  location = 'home', 
  currentPlaylistId,
  className 
}: PromoBannerProps) {
  // Filter banners by location
  const eligibleBanners = useMemo(() => {
    if (!banners) return [];
    
    return banners.filter(banner => {
      // Location filter
      if (banner.display_location !== 'all' && banner.display_location !== location) {
        return false;
      }
      
      // For player location: check if current playlist matches target
      if (location === 'player' && banner.target_playlist_ids?.length > 0) {
        if (!currentPlaylistId || !banner.target_playlist_ids.includes(currentPlaylistId)) {
          return false;
        }
      }
      
      // ... existing targeting logic ...
    });
  }, [...]);
}
```

### 3. Page Integrations

**AppHome.tsx** - After "Try a Ritual" section (line ~665):
```tsx
{/* Promo Banner - After Rituals */}
<PromoBanner location="home" className="mt-4" />
```

**AppStore.tsx (Explore)** - After header, before Tools section (line ~205):
```tsx
{/* Promo Banner - Explore Page */}
<PromoBanner location="explore" className="mb-4" />

{/* Tools Section */}
<section>
  <h2>Tools</h2>
  ...
</section>
```

**AppPlayer.tsx (Listen)** - After header spacer, before content (line ~311):
```tsx
{/* Promo Banner - Listen Page */}
<PromoBanner location="listen" className="px-4 pt-2" />

{/* Continue Learning Section */}
...
```

**AppAudioPlayer.tsx** - After AudioControls, before "Up Next" (line ~710):
```tsx
{/* Controls */}
<AudioControls ... />

{/* Promo Banner - Player specific */}
<PromoBanner 
  location="player" 
  currentPlaylistId={playlistInfo?.playlist_id || contextPlaylistId}
  className="mt-3"
/>

{/* Up Next Preview */}
{nextTrack && ...}
```

### 4. Admin UI Updates

Add a location selector in `PromoBannerManager.tsx`:

```tsx
<Label>Display Location</Label>
<Select value={displayLocation} onValueChange={setDisplayLocation}>
  <SelectItem value="home">Home Page</SelectItem>
  <SelectItem value="explore">Explore Page</SelectItem>
  <SelectItem value="listen">Listen Page</SelectItem>
  <SelectItem value="player">Audio Player</SelectItem>
  <SelectItem value="all">All Locations</SelectItem>
</Select>

{/* Show playlist selector when player is selected */}
{displayLocation === 'player' && (
  <div>
    <Label>Target Playlists (optional)</Label>
    <p className="text-xs text-muted-foreground">
      Leave empty to show on all audio player pages
    </p>
    <MultiSelect 
      options={playlists}
      value={targetPlaylistIds}
      onChange={setTargetPlaylistIds}
    />
  </div>
)}
```

---

## Visual Placement Summary

```
HOME PAGE
+-----------------------------------------+
| Header                                  |
| Week Strip                              |
+-----------------------------------------+
| My Actions                              |
| [Task Cards...]                         |
+-----------------------------------------+
| Try a Ritual                            |
| [Routine Cards...]                      |
+-----------------------------------------+
| >>> PROMO BANNER HERE <<<               |
+-----------------------------------------+
| Active Rounds Carousel                  |
+-----------------------------------------+

EXPLORE PAGE
+-----------------------------------------+
| Header (Explore Simora)                 |
+-----------------------------------------+
| >>> PROMO BANNER HERE <<<               |
+-----------------------------------------+
| Tools                                   |
| [Tool Cards...]                         |
+-----------------------------------------+
| Programs                                |
+-----------------------------------------+

LISTEN PAGE
+-----------------------------------------+
| Header (Listen)                         |
| Category Circles                        |
| Filter Pills                            |
+-----------------------------------------+
| >>> PROMO BANNER HERE <<<               |
+-----------------------------------------+
| Continue Learning                       |
| All Playlists                           |
+-----------------------------------------+

AUDIO PLAYER
+-----------------------------------------+
| Header                                  |
+-----------------------------------------+
| Cover Art                               |
| Title                                   |
| Progress Bar                            |
| Play Controls                           |
+-----------------------------------------+
| >>> PROMO BANNER HERE <<<               |
+-----------------------------------------+
| Up Next Preview                         |
+-----------------------------------------+
```

---

## Player Page Targeting Logic

The player page banner is the trickiest because it allows:

1. **Show to all audio players** - Banner with no target playlists
2. **Show only for specific playlists** - Banner with `target_playlist_ids` set

Example use cases:
- Promote a meditation course only when user is listening to meditation content
- Cross-promote related playlists
- Upsell premium content while user listens to free tracks

---

## Testing Considerations

After implementation, verify:
1. Banners appear in each location correctly
2. Location filtering works (banner set to "explore" doesn't show on "home")
3. Player targeting works with specific playlist IDs
4. Existing audience targeting (programs, tools, playlists) still works
5. Dismiss functionality persists across all locations
6. Admin can create banners for each location

