import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config
 *
 * Why you were seeing a black screen:
 * - On device, the app loads content from `webDir: 'dist'` unless a `server.url` is set.
 * - If you haven’t run `npm run build` (so `dist/` is missing/outdated), you can end up with a blank/black screen.
 *
 * This file makes development reliable:
 * - Set CAP_USE_LIVE_RELOAD=true to load from the Lovable preview URL.
 * - Otherwise (default), it loads from the bundled `dist/` for production builds.
 */

const LIVE_RELOAD_URL =
  process.env.CAP_SERVER_URL ||
  'https://9d54663c-1af5-4066-9ceb-1723206ae5f8.lovableproject.com?forceHideBadge=true';

const useLiveReload = process.env.CAP_USE_LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.ladybosslook.academy',
  appName: 'Simora Ladybosslook',
  webDir: 'dist',
  // DEV (optional): load from remote dev server instead of bundled dist/
  ...(useLiveReload
    ? {
        server: {
          url: LIVE_RELOAD_URL,
          cleartext: true,
        },
      }
    : {}),
  // 🚨 NUCLEAR GUARD: Ensure native platform is always detected
  ios: {
    // Use 'never' to prevent double safe-area insets - we handle them manually in CSS
    contentInset: 'never',
    icon: {
      sources: [
        { src: 'public/app-icons/ios/icon-40.png', width: 40, height: 40 },
        { src: 'public/app-icons/ios/icon-58.png', width: 58, height: 58 },
        { src: 'public/app-icons/ios/icon-60.png', width: 60, height: 60 },
        { src: 'public/app-icons/ios/icon-80.png', width: 80, height: 80 },
        { src: 'public/app-icons/ios/icon-120.png', width: 120, height: 120 },
        { src: 'public/app-icons/ios/icon-152.png', width: 152, height: 152 },
        { src: 'public/app-icons/ios/icon-167.png', width: 167, height: 167 },
        { src: 'public/app-icons/ios/icon-180.png', width: 180, height: 180 },
        { src: 'public/app-icons/ios/icon-1024.png', width: 1024, height: 1024 }
      ]
    }
  },
  android: {
    allowMixedContent: false,
  },
  // DEVELOPMENT ONLY: Uncomment for hot reload during development
  // server: {
  //   url: 'https://9d54663c-1af5-4066-9ceb-1723206ae5f8.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      // Keep this light so if content is slow to load you don't see a “black app”.
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    Keyboard: {
      // 'native' lets iOS handle viewport resize naturally - works perfectly with flexbox
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
