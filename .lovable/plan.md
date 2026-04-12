

## Plan: Move Home Banners to /admin/banners as "Box Banners" tab with redesign

### What's happening
The `HomeBannerManager` currently lives under `/admin/communications` (Banners tab). You want to:
1. Move it to `/admin/banners` as a third tab called **"Box Banners"**
2. Redesign it with the same rich features that Promo Banners have (destinations, display locations, audience targeting, display frequency, conditions)
3. Apply brand colors (Phoenix Coral, Luxe Gold, Soft Rose palette)

### Changes

**1. Update `src/pages/admin/Banners.tsx`**
- Add a third tab: "Box Banners"
- Import and render the redesigned `BoxBannerManager` component

**2. Create `src/components/admin/BoxBannerManager.tsx`** (replaces HomeBannerManager)
- Redesign the UI using brand colors (coral primary, gold accents, rose backgrounds)
- Migrate from raw `useEffect`/`useState` fetching to `useQuery`/`useMutation` (React Query) like PromoBannerManager
- Add all Promo Banner features to the form:
  - **Destination type & ID** (routine, playlist, onboarding, custom URL, etc.) -- same options as PromoBannerManager
  - **Display locations** (multi-select checkboxes for home_top, explore, programs, etc.)
  - **Display frequency** (once, daily, weekly, forever)
  - **Audience targeting** via `PromoAudienceSelector` (all, include/exclude programs, languages, timezones, update status)
  - **Scheduling** (starts_at, ends_at)
  - **Priority**
- Keep existing Home Banner fields: title, description, button text, button URL, video URL
- Banner list cards get a branded look: coral/gold accents, better info display showing destinations, locations, and targeting summary

**3. Update `src/pages/admin/Communications.tsx`**
- Remove the "Banners" tab and `HomeBannerManager` import
- Change grid from 6 to 5 columns

**4. Database consideration**
- The `home_banners` table currently lacks columns for `destination_type`, `display_location`, `display_frequency`, `target_type`, etc.
- We'll need a migration to add these columns to the `home_banners` table so Box Banners can store the new fields
- Existing banners will keep working with sensible defaults (destination_type='custom_url', display_frequency='forever', display_location=['home_top'])

### Technical details

New columns for `home_banners` table:
- `destination_type text default 'custom_url'`
- `destination_id text`
- `display_frequency text default 'forever'`
- `display_location text[] default '{home_top}'`
- `target_type text default 'all'`
- `include_programs text[] default '{}'`
- `exclude_programs text[] default '{}'`
- `target_languages text[] default '{}'`
- `target_timezones text[] default '{}'`
- `include_update_status text[] default '{}'`
- `display_delay_seconds integer default 0`

Brand styling: Cards use `border-primary/20` accents, headers with coral gradient backgrounds, gold badge highlights for active status, rose-tinted muted backgrounds.

