import { useEffect } from 'react';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const INSTALL_TRACKED_KEY = 'app_install_tracked';

export const useAppInstallTracking = () => {
  useEffect(() => {
    const trackInstallation = async () => {
      // Only track on native platforms
      if (!Capacitor.isNativePlatform()) {
        return;
      }

      // Check if already tracked
      const alreadyTracked = localStorage.getItem(INSTALL_TRACKED_KEY);
      if (alreadyTracked === 'true') {
        return;
      }

      try {
        // Get device info
        const deviceInfo = await Device.getId();
        const deviceId = deviceInfo.identifier;
        
        // Get app version
        const appInfo = await App.getInfo();
        const appVersion = appInfo.version;

        // Get current user (might be null if not logged in yet)
        const { data: { user } } = await supabase.auth.getUser();

        // Track installation
        const { error } = await supabase
          .from('app_installations')
          .insert({
            device_id: deviceId,
            platform: Capacitor.getPlatform(),
            app_version: appVersion,
            user_id: user?.id || null,
          });

        if (error) {
          // If duplicate key error, it means device already tracked (edge case)
          if (error.code === '23505') {
            localStorage.setItem(INSTALL_TRACKED_KEY, 'true');
          } else {
            console.error('Error tracking app installation:', error);
          }
        } else {
          // Mark as tracked in localStorage
          localStorage.setItem(INSTALL_TRACKED_KEY, 'true');
          console.log('App installation tracked successfully');
        }
      } catch (error) {
        console.error('Error in app install tracking:', error);
      }
    };

    trackInstallation();
  }, []);
};
