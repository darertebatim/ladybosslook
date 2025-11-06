import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushNotifications';
import { trackPWAInstallation } from '@/lib/pwaTracking';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Detect iOS devices
const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export function usePWAInstall() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const isIOS = isIOSDevice();

  useEffect(() => {
    console.log('[usePWAInstall] Hook initialized');
    console.log('[usePWAInstall] Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
    console.log('[usePWAInstall] Capacitor.getPlatform():', Capacitor.getPlatform());
    console.log('[usePWAInstall] window.Capacitor:', typeof (window as any).Capacitor);
    
    // Skip all PWA logic on native platforms
    if (Capacitor.isNativePlatform()) {
      console.log('[usePWAInstall] Native platform detected - skipping all PWA logic');
      setIsInstalled(true);
      return;
    }

    // Check if running as PWA
    const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isPWAStandalone);

    // Track installation only for web/PWA (not native)
    if (isPWAStandalone && user?.id) {
      console.log('[PWA] Detected app installation, tracking for user:', user.id);
      trackInstallation();
    }
  }, [user?.id]);

  useEffect(() => {
    const handler = (e: any) => {
      console.log('[PWA] Before install prompt received');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const installedHandler = () => {
      console.log('[PWA] App installed event');
      setIsInstalled(true);
      if (user?.id) {
        trackInstallation();
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, [user?.id]);

  const trackInstallation = async () => {
    // Never track on native platforms
    if (Capacitor.isNativePlatform()) {
      return;
    }

    if (!user?.id) {
      console.log('[PWA] No user ID, skipping tracking');
      return;
    }

    console.log('[PWA] Tracking installation for user:', user.id);
    console.log('[PWA] User agent:', navigator.userAgent);
    console.log('[PWA] Platform:', navigator.platform);

    try {
      const { data, error } = await supabase
        .from('pwa_installations')
        .upsert({
          user_id: user.id,
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) {
        console.error('[PWA] Error tracking installation:', error);
      } else {
        console.log('[PWA] Installation tracked successfully:', data);
      }
    } catch (error) {
      console.error('[PWA] Exception tracking installation:', error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available');
      return;
    }

    console.log('[PWA] Prompting user to install');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] User choice:', outcome);
    if (outcome === 'accepted') {
      setIsInstalled(true);
      if (user?.id) {
        trackInstallation();
      }
    }
    
    setDeferredPrompt(null);
  };

  const handleCompleteSetup = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[PWA] Starting complete setup...');

      // Step 1: Try to install PWA if prompt is available
      if (deferredPrompt) {
        console.log('[PWA] Showing install prompt...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('[PWA] Install outcome:', outcome);
        
        if (outcome === 'dismissed') {
          toast.error('Installation cancelled');
          return { success: false, error: 'User dismissed installation' };
        }
        
        setIsInstalled(true);
        setDeferredPrompt(null);
        
        // Track installation
        if (user?.id) {
          await trackPWAInstallation(user.id);
        }
      }

      // Step 2: Request notification permission
      console.log('[PWA] Requesting notification permission...');
      const permission = await requestNotificationPermission();
      
      if (permission === 'denied') {
        toast.warning('App installed, but notifications were denied. You can enable them later in settings.');
        return { success: true };
      }

      if (permission === 'granted' && user?.id) {
        // Step 3: Subscribe to push notifications
        console.log('[PWA] Subscribing to push notifications...');
        const subscribeResult = await subscribeToPushNotifications(user.id);
        
        if (!subscribeResult.success) {
          toast.warning('App installed, but notification setup failed. You can try again later.');
          return { success: true };
        }
      }

      toast.success('Setup complete! App installed and notifications enabled.');
      return { success: true };
    } catch (error: any) {
      console.error('[PWA] Complete setup error:', error);
      toast.error('Setup failed. Please try again.');
      return { success: false, error: error.message };
    }
  };

  return {
    deferredPrompt,
    isInstalled,
    isIOS,
    handleInstallClick,
    handleCompleteSetup,
  };
}

