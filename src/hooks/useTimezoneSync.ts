import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to auto-detect and sync user's timezone to their profile.
 * Runs once on app launch and updates the profile if timezone differs.
 * Uses a debounce to avoid excessive writes.
 */
export const useTimezoneSync = (userId: string | undefined) => {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!userId || hasSynced.current) return;

    const syncTimezone = async () => {
      try {
        // Get browser/device timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (!detectedTimezone) {
          console.log('[TimezoneSync] Could not detect timezone');
          return;
        }

        // Check current profile timezone
        const { data: profile, error: fetchError } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', userId)
          .single();

        if (fetchError) {
          console.error('[TimezoneSync] Error fetching profile:', fetchError);
          return;
        }

        // Only update if different
        if (profile?.timezone !== detectedTimezone) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ timezone: detectedTimezone })
            .eq('id', userId);

          if (updateError) {
            console.error('[TimezoneSync] Error updating timezone:', updateError);
          } else {
            console.log(`[TimezoneSync] Updated timezone from ${profile?.timezone} to ${detectedTimezone}`);
          }
        } else {
          console.log(`[TimezoneSync] Timezone already set to ${detectedTimezone}`);
        }

        hasSynced.current = true;
      } catch (error) {
        console.error('[TimezoneSync] Error:', error);
      }
    };

    // Small delay to avoid blocking initial render
    const timeoutId = setTimeout(syncTimezone, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [userId]);
};
