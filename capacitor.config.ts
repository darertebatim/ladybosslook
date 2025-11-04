import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9d54663c1af540669ceb1723206ae5f8',
  appName: 'LadyBoss Academy',
  webDir: 'dist',
  // DEVELOPMENT ONLY: Uncomment for hot reload during development
  // server: {
  //   url: 'https://9d54663c-1af5-4066-9ceb-1723206ae5f8.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
