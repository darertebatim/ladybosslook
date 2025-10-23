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

    // Track installation if user is logged in and app is installed
    if (checkInstalled && user?.id) {
      trackInstallation();
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      if (user?.id) {
        trackInstallation();
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [user?.id]);

  const trackInstallation = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('pwa_installations')
        .upsert({
          user_id: user.id,
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('[PWA] Error tracking installation:', error);
      } else {
        console.log('[PWA] Installation tracked successfully');
      }
    } catch (error) {
      console.error('[PWA] Error tracking installation:', error);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
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
