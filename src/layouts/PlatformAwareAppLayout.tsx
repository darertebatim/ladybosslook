import { isNativeApp } from '@/lib/platform';
import AppLayout from './AppLayout';
import NativeAppLayout from './NativeAppLayout';

/**
 * Platform-aware wrapper that renders different layouts for native vs web
 */
const PlatformAwareAppLayout = () => {
  const isNative = isNativeApp();
  
  console.log('[PlatformAwareAppLayout] 🎯', isNative ? '📱 Rendering NativeAppLayout' : '🌐 Rendering AppLayout');
  
  if (isNative) {
    return <NativeAppLayout />;
  }
  
  return <AppLayout />;
};

export default PlatformAwareAppLayout;
