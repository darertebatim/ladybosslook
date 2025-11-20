import { isNativeApp } from '@/lib/platform';
import AppLayout from './AppLayout';
import NativeAppLayout from './NativeAppLayout';

/**
 * Platform-aware wrapper that renders different layouts for native vs web
 */
const PlatformAwareAppLayout = () => {
  const isNative = isNativeApp();
  const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
  
  console.log('[PlatformAwareAppLayout] 🎯', isNative ? '📱 Rendering NativeAppLayout' : '🌐 Rendering AppLayout', devNative ? '(Dev Preview Mode)' : '');
  
  if (isNative || devNative) {
    return <NativeAppLayout />;
  }
  
  return <AppLayout />;
};

export default PlatformAwareAppLayout;
