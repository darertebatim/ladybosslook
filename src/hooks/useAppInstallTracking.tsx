import { useEffect } from 'react';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const INSTALL_TRACKED_KEY = 'app_install_tracked';
const LAST_TRACKED_VERSION_KEY = 'app_last_tracked_version';

export const useAppInstallTracking = () => {
  useEffect(() => {
    const trackInstallation = async () => {
      // Only track on native platforms
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      try {
        // Get device info
        const deviceInfo = await Device.getId();
        const deviceId = deviceInfo.identifier;
        
        // Get app version
        const appInfo = await App.getInfo();
        const appVersion = appInfo.version;

        // Check if we've already tracked this version
        const lastTrackedVersion = localStorage.getItem(LAST_TRACKED_VERSION_KEY);
        const alreadyTracked = localStorage.getItem(INSTALL_TRACKED_KEY);

        // Get current user (might be null if not logged in yet)
        const { data: { user } } = await supabase.auth.getUser();

        // If version changed or never tracked, update/insert
        if (!alreadyTracked || lastTrackedVersion !== appVersion) {
          console.log('[AppInstallTracking] Tracking version:', appVersion, 'Previous:', lastTrackedVersion);

          if (!alreadyTracked) {
            // First install - insert new record
            const { error } = await supabase
              .from('app_installations')
              .insert({
                device_id: deviceId,
                platform: Capacitor.getPlatform(),
                app_version: appVersion,
                user_id: user?.id || null,
                last_seen_at: new Date().toISOString(),
                last_seen_version: appVersion,
              });

            if (error) {
              if (error.code === '23505') {
                // Duplicate - device already exists, try to update
                localStorage.setItem(INSTALL_TRACKED_KEY, 'true');
              } else {
                console.error('Error tracking app installation:', error);
                return;
              }
            } else {
              localStorage.setItem(INSTALL_TRACKED_KEY, 'true');
              localStorage.setItem(LAST_TRACKED_VERSION_KEY, appVersion);
              console.log('App installation tracked successfully');
              return;
            }
          }

          // Update existing record with new version (if user is logged in)
          if (user?.id) {
            const { error: updateError } = await supabase
              .from('app_installations')
              .update({
                last_seen_at: new Date().toISOString(),
                last_seen_version: appVersion,
              })
              .eq('device_id', deviceId)
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating app version:', updateError);
            } else {
              localStorage.setItem(LAST_TRACKED_VERSION_KEY, appVersion);
              console.log('App version updated to:', appVersion);
            }
          }
        }
      } catch (error) {
        console.error('Error in app install tracking:', error);
      }
    };

    trackInstallation();
  }, []);
};
