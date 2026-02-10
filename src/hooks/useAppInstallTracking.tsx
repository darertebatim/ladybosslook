import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Track user's app version on every app open.
 * Updates both app_installations and push_subscriptions tables.
 */
export const useAppInstallTracking = (userId: string | undefined) => {
  useEffect(() => {
    const trackVersion = async () => {
      if (!Capacitor.isNativePlatform() || !userId) return;

      try {
        const [appInfo, deviceInfo] = await Promise.all([
          App.getInfo(),
          Device.getId(),
        ]);
        const appVersion = appInfo.version;
        const platform = Capacitor.getPlatform();
        const deviceId = deviceInfo.identifier;

        console.log('[VersionTracking] Tracking version:', appVersion, 'device:', deviceId.substring(0, 8));

        // Upsert app_installations by device_id (the actual unique constraint)
        const { error: installError } = await supabase
          .from('app_installations')
          .upsert(
            {
              user_id: userId,
              device_id: deviceId,
              platform,
              app_version: appVersion,
              last_seen_at: new Date().toISOString(),
              last_seen_version: appVersion,
            },
            { onConflict: 'device_id' }
          );

        if (installError) {
          console.error('[VersionTracking] Error updating app_installations:', installError);
        }

        // Update push_subscriptions with current version
        const { error: pushError } = await supabase
          .from('push_subscriptions')
          .update({ app_version: appVersion })
          .eq('user_id', userId);

        if (pushError) {
          console.error('[VersionTracking] Error updating push_subscriptions:', pushError);
        } else {
          console.log('[VersionTracking] ✅ Version tracked successfully:', appVersion);
        }
      } catch (error) {
        console.error('[VersionTracking] Error tracking version:', error);
      }
    };

    trackVersion();
  }, [userId]);
};
