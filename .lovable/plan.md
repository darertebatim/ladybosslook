

# Fix: Black Screen After iOS Rebuild

## Problem Identified

The app shows a black screen immediately after the splash screen disappears. Based on my analysis:

**Root Cause**: `main.tsx` has **static imports** for `@capacitor/status-bar` and `@capacitor/splash-screen` at the top level. After rebuilding the iOS project, if these plugins aren't properly linked, the import throws a fatal JavaScript error before React can mount — leaving you with a blank screen and no visible error.

The other Capacitor plugins (Push Notifications, Local Notifications, Music Controls) already use **dynamic imports** with error handling, which is why they don't cause crashes. StatusBar and SplashScreen were missed.

## Solution

Convert the static imports to dynamic imports with proper error handling, matching the pattern used for other Capacitor plugins.

## Changes Required

### 1. Update `src/main.tsx`

**Before (current code)**:
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
  SplashScreen.hide().catch(console.error);
  // ...
}
```

**After (safe dynamic imports)**:
```typescript
// Remove static imports for StatusBar and SplashScreen

if (Capacitor.isNativePlatform()) {
  // Dynamically import StatusBar with error handling
  import('@capacitor/status-bar')
    .then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
    })
    .catch((e) => console.warn('[Main] StatusBar plugin not available:', e));
  
  // Dynamically import SplashScreen with error handling
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => {
      SplashScreen.hide().catch(console.error);
    })
    .catch((e) => console.warn('[Main] SplashScreen plugin not available:', e));
  
  // ... rest of initialization
}
```

This ensures:
- The app always renders even if a native plugin fails
- Errors are logged but non-fatal
- Consistent pattern with the other hardened plugin imports

## Additional Verification Steps

After I make this fix, you should:

1. **Pull the changes**: `git pull`
2. **Rebuild**: `npm run build`
3. **Sync to iOS**: `npx cap sync ios`
4. **Clean build in Xcode**: Shift+Cmd+K, then Cmd+R

If the black screen persists, we can add more debug logging to pinpoint exactly where the crash occurs.

## Technical Details

| File | Change |
|------|--------|
| `src/main.tsx` | Convert StatusBar and SplashScreen to dynamic imports with try/catch |

This is a minimal, targeted fix that matches the existing hardening pattern already used for Push Notifications, Local Notifications, and Music Controls in this codebase.

