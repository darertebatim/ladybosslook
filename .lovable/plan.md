

# Rebrand: Ladybosslook → Rilo

## Summary

Rename the app from "Ladybosslook" to "Rilo" across all user-facing UI. Subscription plan names stay as **Simora Plus** (unchanged in App Store). Legal pages (Terms, Privacy) and contact emails (`@ladybosslook.com`) are left untouched for now since those depend on domain/legal updates.

## What changes

### 1. Core branding files
| File | Change |
|------|--------|
| `index.html` | `<title>Rilo</title>`, `apple-mobile-web-app-title`, `meta author` |
| `src/components/SEOHead.tsx` | Default title `"Rilo"` |
| `src/components/app/BrandedSplash.tsx` | "Rilo Self-Care & Routines" as h1, update tagline |

### 2. SEO page titles (~10 files)
Replace "Ladybosslook" in SEOHead `title` props:
- `AppMood.tsx` → "Mood Check-in | Rilo"
- `AppMoodHistory.tsx` → "Mood History | Rilo"
- `AppStore.tsx` → "Explore - Rilo"
- `AppBrowsePrograms.tsx` → "Academy Programs - Rilo"
- `AppProfile.tsx` → "Profile - Rilo"
- `AppSupport.tsx` → "App Support - Rilo"
- `AppMarketing.tsx` → "Rilo - Empower Your Journey"
- `DeleteAccount.tsx` → "Delete Account | Rilo"

### 3. Subscription / paywall labels (~8 files)
Replace "Ladybosslook+" with **"Simora Plus"**:
- `SubscriptionManagement.tsx` — plan labels
- `PaywallMascot.tsx`, `PaywallMascotV2.tsx`, `PaywallBold.tsx`, `PaywallVIP.tsx`
- `PlusGateSheet.tsx`
- `StreakLostBanner.tsx`
- `ChatConversationList.tsx` program label
- `PlaylistManager.tsx`, `VideoPlaylistManager.tsx` admin labels
- `AppWater.tsx`, `AppPeriod.tsx` — gated feature messages
- `AppPlaylistDetail.tsx`

### 4. Onboarding flows (~5 files)
- `quick-start.ts`, `quick-start-v2.ts` — "Welcome to Rilo!"
- `me-plus.ts` — all "Ladybosslook" mentions → "Rilo", "Ladybosslook+" → "Simora Plus"
- `selfcare-quiz.ts`, `selfcare-weekly-review.ts`, `weekly-review.ts` — `appName: 'Rilo'`

### 5. In-app copy
- `HomeTour.tsx` — "Welcome to Rilo ✨"
- `ChatInput.tsx` — settings instruction text
- `QuizPlay.tsx` — share text → "Rilo"
- `ProjectCompletionCelebration.tsx` — share hashtag
- `AppTaskCreate.tsx` — comment reference

### 6. Not changing (intentionally)
- **Legal pages** (`SMSTerms.tsx`) — requires legal review
- **Email addresses** (`@ladybosslook.com`, `@simora.app`) — domain-dependent
- **Telegram links** (`t.me/ladybosslook`) — social handle change needed first
- **App Store URLs** — still point to "simora-ladybosslook"
- **Supabase edge functions** — email sender names need separate update
- **Internal technical identifiers** (product IDs, slugs like `simora-plus`)

## Approach
Straightforward find-and-replace across ~25 files. Each file gets a targeted edit — no structural changes. After merging, run `npx cap sync` to update native Android/iOS metadata.

