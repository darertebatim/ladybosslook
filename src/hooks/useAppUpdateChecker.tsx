import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isNativeApp, isIOSApp } from '@/lib/platform';
import { BUILD_INFO } from '@/lib/buildInfo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UpdateStatus {
  updateAvailable: boolean;
  latestVersion: string | null;
  storeUrl: string;
  isChecking: boolean;
  isDismissed: boolean;
  dismiss: () => void;
}

const LAST_CHECK_KEY = 'app_update_last_check';
const DISMISSED_VERSION_KEY = 'app_update_dismissed_version';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useAppUpdateChecker(): UpdateStatus {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const debugUpdate = searchParams.get('debugUpdate') === 'true';
  
  const [updateAvailable, setUpdateAvailable] = useState(debugUpdate);
  const [latestVersion, setLatestVersion] = useState<string | null>(debugUpdate ? '99.0.0' : null);
  const [storeUrl, setStoreUrl] = useState('https://apps.apple.com/app/simora-ladybosslook/id6755076134');
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const dismiss = () => {
    if (latestVersion) {
      localStorage.setItem(DISMISSED_VERSION_KEY, JSON.stringify({
        version: latestVersion,
        timestamp: Date.now(),
      }));
    }
    setIsDismissed(true);
  };

  useEffect(() => {
    // Skip API check if in debug mode (already showing mock update)
    if (debugUpdate) return;
    
    // Only run on native iOS
    if (!isNativeApp() || !isIOSApp()) {
      return;
    }

    const checkForUpdate = async () => {
      // Check if we've already checked recently
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      if (lastCheck) {
        const lastCheckTime = parseInt(lastCheck, 10);
        if (Date.now() - lastCheckTime < CHECK_INTERVAL_MS) {
          console.log('[useAppUpdateChecker] Skipping check - checked recently');
          return;
        }
      }

      setIsChecking(true);

      try {
        console.log('[useAppUpdateChecker] Checking for updates, current version:', BUILD_INFO.version);

        const { data, error } = await supabase.functions.invoke('check-app-version', {
          body: { currentVersion: BUILD_INFO.version },
        });

        if (error) {
          console.error('[useAppUpdateChecker] Error checking for updates:', error);
          return;
        }

        if (data?.success) {
          console.log('[useAppUpdateChecker] Update check result:', data);
          
          setLatestVersion(data.latestVersion);
          setStoreUrl(data.storeUrl || 'https://apps.apple.com/app/simora-ladybosslook/id6755076134');
          
          // Log the check to database if user is authenticated
          if (user?.id) {
            supabase.from('app_update_logs').insert({
              user_id: user.id,
              device_version: BUILD_INFO.version,
              latest_version: data.latestVersion,
              update_available: data.updateAvailable,
              platform: 'ios',
            }).then(({ error: logError }) => {
              if (logError) console.error('[useAppUpdateChecker] Failed to log check:', logError);
            });
          }
          
          if (data.updateAvailable) {
            // Check if user dismissed this specific version
            const dismissedData = localStorage.getItem(DISMISSED_VERSION_KEY);
            if (dismissedData) {
              try {
                const { version, timestamp } = JSON.parse(dismissedData);
                const timeSinceDismiss = Date.now() - timestamp;
                
                if (version === data.latestVersion && timeSinceDismiss < DISMISS_DURATION_MS) {
                  console.log('[useAppUpdateChecker] User dismissed this version recently');
                  setIsDismissed(true);
                } else {
                  setUpdateAvailable(true);
                }
              } catch {
                setUpdateAvailable(true);
              }
            } else {
              setUpdateAvailable(true);
            }
          }

          // Store last check time
          localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
        }
      } catch (error) {
        console.error('[useAppUpdateChecker] Unexpected error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkForUpdate();

    // Also check when app comes to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [debugUpdate]);

  return {
    updateAvailable: updateAvailable && !isDismissed,
    latestVersion,
    storeUrl,
    isChecking,
    isDismissed,
    dismiss,
  };
}
