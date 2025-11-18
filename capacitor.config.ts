import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ladybosslook.academy',
  appName: 'Ladybosslook',
  webDir: 'dist',
  // 🚨 NUCLEAR GUARD: Ensure native platform is always detected
  ios: {
    contentInset: 'always',
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
      backgroundColor: '#000000',
      showSpinner: false,
    }
  }
};

export default config;
