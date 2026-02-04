import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor config
 *
 * Why you were seeing a black screen:
 * - On device, the app loads content from `webDir: 'dist'` unless a `server.url` is set.
 * - If you haven't run `npm run build` (so `dist/` is missing/outdated), you can end up with a blank/black screen.
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
  ios: {
    // Use 'never' to prevent double safe-area insets - we handle them manually in CSS
    contentInset: 'never',
    // Match the working Courageous app pattern
    scheme: 'ladybosslook'
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#7C3AED'
    },
    SocialLogin: {
      google: {
        webClientId: '73288707946-0tf0sdgi5kghdkkl1co0lnnhnegq81ol.apps.googleusercontent.com',
        iOSClientId: '73288707946-3pmdp2b0u3dm7jtoabre2pofk58dq8hd.apps.googleusercontent.com'
      }
    },
    CapacitorCalendar: {}
  }
};

export default config;
