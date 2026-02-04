

# Plan: Remove All Capacitor Dependencies

## Overview

This plan completely removes all Capacitor-related code from the app to establish a clean baseline. The app will work as a pure web app. Tomorrow we can add Capacitor plugins back one by one to identify which one causes the black screen.

## What Gets Removed

### Package Dependencies (17 packages)
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- `@capacitor/action-sheet`, `@capacitor/app`, `@capacitor/browser`, `@capacitor/camera`
- `@capacitor/device`, `@capacitor/filesystem`, `@capacitor/haptics`, `@capacitor/keyboard`
- `@capacitor/local-notifications`, `@capacitor/push-notifications`, `@capacitor/share`
- `@capacitor/splash-screen`, `@capacitor/status-bar`
- `@capawesome/capacitor-app-review`, `@capawesome/capacitor-file-picker`
- `@capgo/capacitor-social-login`, `@ebarooni/capacitor-calendar`
- `capacitor-music-controls-plugin`, `capacitor-native-settings`

### Files to Modify (~25 files)

**Core Entry Points:**
1. `src/main.tsx` - Remove all Capacitor initialization, keep just React mount
2. `capacitor.config.ts` - Keep file but simplify (needed for future reinstall)

**Library Files (provide no-op stubs):**
3. `src/lib/platform.ts` - Always return `false` for native checks
4. `src/lib/haptics.ts` - No-op functions
5. `src/lib/pushNotifications.ts` - No-op functions returning safe defaults
6. `src/lib/localNotifications.ts` - No-op functions
7. `src/lib/musicControls.ts` - Already stubbed
8. `src/lib/appReview.ts` - Already disabled, ensure no imports
9. `src/lib/nativeSocialAuth.ts` - Use browser OAuth only
10. `src/lib/nativeFilePicker.ts` - Return "not supported" or use web APIs
11. `src/lib/calendarIntegration.ts` - No-op functions
12. `src/lib/taskAlarm.ts` - No-op functions

**Hooks:**
13. `src/hooks/useKeyboard.tsx` - Return empty/default values
14. `src/hooks/useDeepLinks.tsx` - No-op hook
15. `src/hooks/useAppInstallTracking.tsx` - No-op hook
16. `src/hooks/usePushNotificationFlow.tsx` - Return safe defaults
17. `src/hooks/useAutoCompleteProTask.tsx` - Remove Capacitor imports

**Components:**
18. `src/components/app/AppUpdateBanner.tsx` - Use window.open instead of Browser
19. `src/components/app/PushNotificationOnboarding.tsx` - Hide on web or show web alternative
20. `src/components/app/ProgramEventCard.tsx` - Use window.open instead of Browser
21. `src/components/app/TaskQuickStartSheet.tsx` - Remove Keyboard imports
22. `src/components/feed/FeedReplyInput.tsx` - Remove Keyboard imports

**Pages:**
23. `src/pages/Auth.tsx` - Remove Capacitor imports
24. `src/pages/app/AppProfile.tsx` - Remove native settings, use web alternatives
25. `src/pages/app/AppCourseDetail.tsx` - Remove Share/Filesystem, use web share API
26. `src/pages/app/AppTaskCreate.tsx` - Remove Capacitor imports

**Build Config:**
27. `vite.config.ts` - Remove Capacitor chunk from manualChunks

## Technical Approach

For each file, we'll:
1. Remove all `@capacitor/*` and `capacitor-*` imports
2. Replace functionality with web equivalents or no-ops
3. Keep function signatures intact so components don't break

### Example Transformations

**Platform detection:**
```typescript
// Before
import { Capacitor } from '@capacitor/core';
export const isNativeApp = () => Capacitor.isNativePlatform();

// After
export const isNativeApp = () => false;
export const isIOSApp = () => false;
```

**Haptics:**
```typescript
// Before
import { Haptics } from '@capacitor/haptics';
haptic.light = () => Haptics.impact({ style: ImpactStyle.Light });

// After
haptic.light = () => {}; // no-op
```

**Browser plugin:**
```typescript
// Before
import { Browser } from '@capacitor/browser';
await Browser.open({ url });

// After
window.open(url, '_blank');
```

## Execution Order

1. First: Update `src/lib/platform.ts` (everything else depends on this)
2. Next: Update all other `src/lib/*.ts` utility files
3. Then: Update hooks in `src/hooks/`
4. Then: Update components and pages
5. Finally: Update `vite.config.ts` and `package.json`

## After Implementation

Run these commands locally:
```bash
git pull
npm install
npm run build
npx cap sync ios
```

In Xcode: Clean Build (⇧⌘K) → Run (⌘R)

**Expected Result:** The app should now show the yellow "SIMORA DEBUG v2" screen (proving HTML loads), then React should mount and display the app normally.

## Tomorrow's Reinstall Strategy

Once we confirm the app works:
1. Add back `@capacitor/core` only → test
2. Add `@capacitor/app` → test
3. Add plugins one by one, testing each
4. This will identify the exact plugin causing the black screen

