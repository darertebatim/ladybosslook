import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export function usePWAInstall() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(checkInstalled);

    // Track installation immediately if user is logged in and app is installed
    if (checkInstalled && user?.id) {
      console.log('[PWA] Detected standalone mode, tracking installation for user:', user.id);
      trackInstallation();
    }
  }, [user?.id]); // Re-run when user changes

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

  return {
    deferredPrompt,
    isInstalled,
    handleInstallClick,
  };
}

