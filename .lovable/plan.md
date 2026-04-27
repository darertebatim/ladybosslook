# Android Updates Tab in /admin/communications

## Current state

The Updates tab already supports Android in **one place**: the "App Update Popup" card has a Platform selector (`ios` / `android`) and `AppUpdatePopup.tsx` correctly opens the Play Store when `platform === 'android'`. Everything else is iOS-only:

- **Version Distribution** counts ALL `native:` push subscriptions together (no iOS/Android split).
- **Latest version** reads only `app_settings.latest_ios_version`.
- **Send Update Push** doesn't filter by platform — it would push iOS copy to Android users.
- **Update Banner** hardcodes the App Store URL.
- The `check-app-version` edge function only knows iOS (iTunes Lookup).

## Do we have Android KPIs today?

**Partially.** Push tokens are stored as `native:<token>` with no platform prefix, so we currently **cannot** tell iOS from Android in `push_subscriptions`. All 1024 native devices look identical. We need to fix this before the Android tab can show meaningful numbers.

The good news: the device platform is known at registration time (`Capacitor.getPlatform()`), we just aren't persisting it. Easy fix.

## Plan

### 1. Capture platform on push subscription (foundation)

- Add a `platform` column (`text`, nullable, values `'ios' | 'android' | 'web'`) to `push_subscriptions` via migration.
- Update `src/lib/pushNotifications.ts` (both registration paths, ~lines 309 and 445) to set `platform: Capacitor.getPlatform()` on insert/update.
- Backfill heuristic: leave existing rows as `null` → shown as "Unknown" in stats. They'll re-register on next app open and self-correct over a few days.

### 2. Split the Updates tab into iOS / Android sub-tabs

Refactor `UpdateNotificationSender.tsx` into a parent with a 2-pill switcher (iOS | Android). Each sub-tab renders the same four cards (Version Distribution, Send Push, Banner, Popup) but parameterized by platform:

| Concern | iOS | Android |
|---|---|---|
| Version filter | `platform = 'ios'` (+ legacy nulls) | `platform = 'android'` |
| Latest version key | `latest_ios_version` | `latest_android_version` (new app_settings row) |
| Store URL | App Store | Play Store |
| Popup `platform` field | `ios` | `android` |
| Push send filter | only iOS subs | only Android subs |

Show a clear "Unknown platform: N devices (legacy, will resolve as users reopen the app)" line under each distribution card.

### 3. Edge function updates

- `send-update-push-notification`: accept a `platform` param and filter `push_subscriptions` by it. Backwards compatible — omitting it preserves current behavior, but the admin UI will always send it.
- `check-app-version`: add Android branch. Since the Play Store has no public lookup API, **rely on the admin override** (`latest_android_version` in `app_settings`) only. If the admin hasn't set it, return `updateAvailable: false` for Android. Document this in the Android tab UI.

### 4. UI/UX cleanup

- Remove the platform dropdown from the Popup card (it becomes implicit per sub-tab).
- Add a small KPI strip at the top of each sub-tab: "X devices on latest, Y outdated, Z unknown."
- For Android, show a tooltip explaining no automatic store-version fetch — admin must enter the latest Play Store version manually.

## Technical notes

- Migration: `ALTER TABLE push_subscriptions ADD COLUMN platform text;` plus an index `(platform, app_version)` for fast version-distribution queries.
- The 1024 existing "native-other" rows will gradually be re-attributed as users open the app (push token registration runs on every launch in `useAppInstallTracking.tsx`).
- `AppUpdatePopup.tsx` already handles both stores correctly — no client changes needed beyond the admin tab.
- Total surface: 1 migration, 2 edge function tweaks, 1 admin component refactor, 2 lines in `pushNotifications.ts`.

## My recommendation on KPIs

After step 1 ships, give it ~3-7 days for Android users to reopen the app and self-register their platform. During that window, the Android tab will show low numbers — that's expected, not a bug. After the backfill window, you'll have accurate Android version distribution and can target push/banner/popup campaigns precisely.
