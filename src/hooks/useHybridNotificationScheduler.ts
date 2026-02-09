import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePNConfig } from './usePNConfig';
import { scheduleHybridNotifications, cancelAllHybridNotifications } from '@/lib/hybridLocalNotifications';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook that manages hybrid local notification scheduling
 * 
 * Syncs server config → local notifications:
 * - Fetches pn_config on launch
 * - Subscribes to realtime changes
 * - Reschedules local notifications when config changes
 * - Respects user preferences (wake/sleep time, toggles)
 */
export function useHybridNotificationScheduler(userId: string | undefined) {
  const { configs, lastSyncedAt } = usePNConfig();
  const hasScheduledRef = useRef(false);
  const lastConfigHashRef = useRef<string>('');

  // Fetch user preferences and schedule notifications
  const scheduleFromConfig = useCallback(async () => {
    if (!userId || !Capacitor.isNativePlatform()) return;
    if (configs.length === 0) return;

    // Create a hash of current config to detect changes
    const configHash = JSON.stringify(configs.map(c => ({
      key: c.notification_key,
      enabled: c.is_enabled,
      hour: c.schedule_hour,
      minute: c.schedule_minute,
      title: c.title,
      body: c.body,
    })));

    // Skip if config hasn't changed
    if (configHash === lastConfigHashRef.current && hasScheduledRef.current) {
      console.log('[HybridScheduler] Config unchanged, skipping reschedule');
      return;
    }

    try {
      // Fetch user notification preferences
      const { data: prefsData } = await supabase
        .from('user_notification_preferences')
        .select('morning_summary, evening_checkin, time_period_reminders, goal_nudges, wake_time, sleep_time')
        .eq('user_id', userId)
        .maybeSingle();

      const userPrefs = {
        morning_summary: prefsData?.morning_summary ?? true,
        evening_checkin: prefsData?.evening_checkin ?? true,
        time_period_reminders: prefsData?.time_period_reminders ?? true,
        goal_nudges: prefsData?.goal_nudges ?? true,
        wake_time: prefsData?.wake_time ?? '07:00',
        sleep_time: prefsData?.sleep_time ?? '22:00',
      };

      // Schedule notifications based on server config + user prefs
      const result = await scheduleHybridNotifications(configs, userPrefs);
      console.log(`[HybridScheduler] Scheduled ${result.scheduled}, skipped ${result.skipped}`);

      lastConfigHashRef.current = configHash;
      hasScheduledRef.current = true;
    } catch (err) {
      console.error('[HybridScheduler] Error scheduling:', err);
    }
  }, [userId, configs]);

  // Schedule when configs change or on initial load
  useEffect(() => {
    if (configs.length > 0 && userId) {
      scheduleFromConfig();
    }
  }, [configs, userId, scheduleFromConfig, lastSyncedAt]);

  // Also listen to user preference changes
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    const channel = supabase
      .channel('user_prefs_for_pn')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notification_preferences',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log('[HybridScheduler] User preferences changed, rescheduling');
          // Force reschedule
          lastConfigHashRef.current = '';
          scheduleFromConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, scheduleFromConfig]);

  // Cleanup on unmount/logout
  useEffect(() => {
    return () => {
      if (!userId) {
        cancelAllHybridNotifications();
      }
    };
  }, [userId]);

  return {
    isConfigured: hasScheduledRef.current,
    configCount: configs.length,
  };
}
