import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Track user's app version on every app open.
 * Updates both app_installations and push_subscriptions tables.
 */
export const useAppInstallTracking = (userId: string | undefined) => {
  useEffect(() => {
    const trackVersion = async () => {
      // Only track on native platforms with logged-in user
      if (!Capacitor.isNativePlatform() || !userId) {
        return;
      }

      try {
        // Get current app version from native
        const appInfo = await App.getInfo();
        const appVersion = appInfo.version;
        const platform = Capacitor.getPlatform();

        console.log('[VersionTracking] Tracking version:', appVersion, 'for user:', userId.substring(0, 8));

        // Update app_installations - upsert by user_id
        const { error: installError } = await supabase
          .from('app_installations')
          .upsert(
            {
              user_id: userId,
              device_id: userId, // Use user_id as device_id for simplicity
              platform,
              app_version: appVersion,
              last_seen_at: new Date().toISOString(),
              last_seen_version: appVersion,
            },
            { onConflict: 'user_id' }
          );

        if (installError) {
          // If conflict on device_id, try update instead
          if (installError.code === '23505') {
            await supabase
              .from('app_installations')
              .update({
                last_seen_at: new Date().toISOString(),
                last_seen_version: appVersion,
                app_version: appVersion,
              })
              .eq('user_id', userId);
          } else {
            console.error('[VersionTracking] Error updating app_installations:', installError);
          }
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
