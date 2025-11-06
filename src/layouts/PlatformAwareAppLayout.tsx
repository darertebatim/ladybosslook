import { isDefinitelyNative } from '@/lib/platform';
import AppLayout from './AppLayout';
import NativeAppLayout from './NativeAppLayout';

/**
 * Platform-aware wrapper that renders different layouts for native vs web
 * This ensures PWA code never runs on native platforms
 */
const PlatformAwareAppLayout = () => {
  const isNative = isDefinitelyNative();
  
  console.log('[PlatformAwareAppLayout] 🎯', isNative ? '📱 Rendering NativeAppLayout' : '🌐 Rendering AppLayout');
  
  if (isNative) {
    return <NativeAppLayout />;
  }
  
  return <AppLayout />;
};

export default PlatformAwareAppLayout;
