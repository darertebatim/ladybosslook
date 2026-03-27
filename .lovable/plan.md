

# Rename "Simora" → "Ladybosslook" Across the App

## Scope

Found **~1280 occurrences across 94 files**. These fall into several categories:

### 1. User-Facing UI Text (High Priority)
- **Branded splash screen** (`BrandedSplash.tsx`): "Simora" → "Ladybosslook"
- **SEO titles** (e.g., `AppMood.tsx`): "Mood Check-in | Simora" → "Mood Check-in | Ladybosslook"
- **Settings page** (`AppSettings.tsx`): "Rate Simora" → "Rate Ladybosslook"
- **Paywall screens** (`PaywallBold.tsx`, `PaywallVIP.tsx`, `PaywallMascotV2.tsx`, etc.): "Simora Plus" / "simora+" → "Ladybosslook Plus" / "Ladybosslook+"
- **Admin labels** (`VideoPlaylistManager.tsx`, `BreathingExercisesManager.tsx`): "Requires Simora+" → "Requires Ladybosslook+"
- **Admin channel chat** default display name: "Simora" → "Ladybosslook"
- **Rate page** (`AppRate.tsx`): App Store URL slug update
- **Update checker** (`useAppUpdateChecker.tsx`): App Store URL slug
- **Subscriptions admin** (`Subscriptions.tsx`): "simora+ Plus V2" label

### 2. AI Coach System Prompt
- `supabase/functions/ai-coach/index.ts`: "You are Simora" → "You are Ladybosslook"

### 3. Internal Keys (localStorage, product IDs)
- localStorage keys like `simora_daily_reset_enabled`, `simora_tour_*`, `simora_celebrated_*`, `simora_onboarding_completed_*`, etc.
- Product ID fallbacks like `simora_plus_annual`, `simora_plus_monthly`
- Program slug `simora-plus`

**Decision needed for internal keys**: Renaming localStorage keys will break state for existing users (they'll re-see onboarding, lose tour progress, etc.). Product IDs and program slugs are tied to App Store Connect and database records.

### 4. Comments & Documentation
- Hook comments referencing "Simora" philosophy text
- Migration SQL comments

## Recommended Approach

| Category | Action |
|----------|--------|
| UI text, labels, titles | Rename to "Ladybosslook" |
| AI coach prompt | Rename to "Ladybosslook" |
| Admin labels | Rename to "Ladybosslook+" |
| App Store URLs | Update slug if changed, otherwise keep |
| localStorage keys | **Keep as-is** to avoid breaking existing users |
| Product IDs / program slugs | **Keep as-is** (tied to App Store / database) |
| Code comments | Update where trivial |
| Migration SQL comments | Leave untouched |

## Technical Details

Will do a systematic file-by-file pass across all 94 files, applying the rename rules above. Key files with the most impact:

- `src/components/app/BrandedSplash.tsx`
- `src/pages/app/AppSettings.tsx`
- `src/pages/app/AppRate.tsx`
- `src/components/app/paywalls/*.tsx` (all paywall variants)
- `supabase/functions/ai-coach/index.ts`
- `src/components/SEOHead.tsx` default title
- `src/hooks/useAppUpdateChecker.tsx`
- All pages using `<SEOHead title="... Simora">`

