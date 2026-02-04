

# iOS Black Screen Fix - Complete Plan

## Understanding the Problem

After thorough investigation, I found **three separate issues** working together to cause the black screen:

### Issue 1: Asset Path Resolution (CRITICAL)
**File:** `vite.config.ts`

The `base` configuration for relative asset paths was **never applied**. This means on iOS:
- Capacitor uses `file://` protocol to load the bundled app
- Without `base: "./"`, all asset paths start with `/` (absolute)
- iOS cannot resolve `/assets/main.js` via `file://` protocol
- **Result:** JavaScript files fail to load = black screen

### Issue 2: Unsafe Plugin Initialization (CRITICAL)
**File:** `src/main.tsx` (lines 6-7, 21-22)

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';  // Top-level import
import { SplashScreen } from '@capacitor/splash-screen';    // Top-level import

StatusBar.setStyle({ style: Style.Dark }).catch(console.error);  // Synchronous call
SplashScreen.hide().catch(console.error);                         // Synchronous call
```

**Problem:** Top-level imports fail silently when native modules aren't properly linked. The `.catch()` only handles promise errors, not import failures.

### Issue 3: SPM Plugin Incompatibility
**Plugin:** `capacitor-music-controls-plugin`

This plugin does NOT support Swift Package Manager (SPM) - it has no `Package.swift` file. Capacitor 8 defaults to SPM, so when you recreated the `ios/` folder yesterday, the plugin failed to link correctly.

---

## Why This Appeared Yesterday (Not 2 Weeks Ago)

1. **2 weeks ago:** Capacitor 8 upgrade happened
2. **After upgrade:** Your existing `ios/` folder still used CocoaPods from before
3. **Yesterday:** You deleted and recreated `ios/` folder, triggering Capacitor 8's SPM default
4. **Result:** `capacitor-music-controls-plugin` failed to link, causing silent crash on startup

---

## The Fix (3 Parts)

### Part 1: Fix Asset Paths in Vite

**File:** `vite.config.ts`

Add the `base` configuration so iOS can load bundled assets:

```typescript
export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "./",  // ADD THIS LINE
  define: {
    // ... existing config
```

Also add React deduplication to prevent duplicate React instances:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
  dedupe: ["react", "react-dom", "react/jsx-runtime"],  // ADD THIS
},
```

### Part 2: Harden Plugin Initialization

**File:** `src/main.tsx`

Replace synchronous imports with try-catch wrapped dynamic imports:

```typescript
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';

logBuildInfo();

if (Capacitor.isNativePlatform()) {
  console.log('[Main] Native platform detected:', Capacitor.getPlatform());
  document.documentElement.classList.add('native-app');
  
  // Safe async initialization
  (async () => {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      console.warn('[Main] StatusBar init failed:', e);
    }
    
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
    } catch (e) {
      console.warn('[Main] SplashScreen init failed:', e);
    }
    
    initializePushNotificationHandlers();
    clearBadge();
  })();
} else {
  console.log('[Main] Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Part 3: Add Error Fallback to index.html

**File:** `index.html`

Add a visible loading fallback and global error handler so crashes show an error instead of black screen:

```html
<div id="root">
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
    Loading...
  </div>
</div>

<script>
  window.onerror = function(msg, url, line) {
    document.getElementById('root').innerHTML = 
      '<div style="padding:20px;text-align:center;font-family:sans-serif;">' +
      '<h2>App Error</h2><p>' + msg + '</p><p>Line: ' + line + '</p>' +
      '<button onclick="location.reload()">Reload</button></div>';
  };
</script>
```

---

## Part 4: Recreate iOS with CocoaPods

After implementing the code fixes above, you need to recreate the iOS folder with CocoaPods:

### Step-by-Step Instructions

1. **Build the updated web assets:**
   ```bash
   npm run build
   ```

2. **Delete the iOS folder completely:**
   ```bash
   rm -rf ios
   ```

3. **Add iOS with CocoaPods (NOT SPM):**
   ```bash
   npx cap add ios --packagemanager cocoapods
   ```

4. **Sync the project:**
   ```bash
   npx cap sync ios
   ```

5. **Re-apply your custom configuration files:**
   Copy these files back into `ios/App/App/`:
   - `AppDelegate.swift` (with APNs handlers)
   - `App.entitlements` (with capabilities)
   - `Info.plist` (with permissions)

6. **Open in Xcode and configure signing:**
   ```bash
   npx cap open ios
   ```
   - Go to Signing & Capabilities
   - Select your Team
   - Verify capabilities are enabled

7. **Clean and rebuild:**
   - Product > Clean Build Folder (Shift+Cmd+K)
   - Build and run (Cmd+R)

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `vite.config.ts` | Add `base: "./"` for production | Fix iOS asset loading |
| `vite.config.ts` | Add React dedupe | Prevent duplicate React |
| `src/main.tsx` | Dynamic imports with try-catch | Prevent crash on plugin failure |
| `index.html` | Add loading fallback + error handler | Show errors instead of black screen |
| `ios/` folder | Recreate with CocoaPods | Fix music controls plugin |

---

## About Your Database Concern

I checked the app initialization flow and Supabase connection:
- The Supabase client in `src/integrations/supabase/client.ts` is configured correctly
- Database connections happen AFTER React mounts
- A database issue would show errors in the UI, not a black screen

The black screen happens BEFORE React even mounts because JavaScript files fail to load (asset paths) or crash on import (plugin linking). This is why Safari developer tools show no activity - the app never gets to execute any JavaScript.

