import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  morning_summary: boolean;
  evening_checkin: boolean;
  time_period_reminders: boolean;
  goal_nudges: boolean;
  wake_time: string;
  sleep_time: string;
}

interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  hour: number;
  minute: number;
  type: string;
}

// Fixed notification IDs for recurring notifications
const NOTIFICATION_IDS = {
  MORNING_SUMMARY: 100001,
  EVENING_CHECKIN: 100002,
  PERIOD_MORNING: 100003,
  PERIOD_AFTERNOON: 100004,
  PERIOD_EVENING: 100005,
  PERIOD_BEDTIME: 100006,
  GOAL_NUDGE_9AM: 100007,
  GOAL_NUDGE_12PM: 100008,
  GOAL_NUDGE_3PM: 100009,
  GOAL_NUDGE_6PM: 100010,
};

// Parse time string to hours and minutes
function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

// Check if a notification time is within quiet hours
function isWithinActiveHours(hour: number, wakeTime: string, sleepTime: string): boolean {
  const wake = parseTime(wakeTime);
  const sleep = parseTime(sleepTime);
  
  // Handle midnight crossing (e.g., sleep at 23:00, wake at 07:00)
  if (sleep.hour < wake.hour) {
    // Quiet hours span midnight
    return hour >= wake.hour || hour < sleep.hour;
  }
  
  return hour >= wake.hour && hour < sleep.hour;
}

/**
 * Hook to schedule local notifications based on user preferences
 * 
 * DISABLED: Server-side notifications via send-daily-notifications edge function
 * now handle all recurring notifications. This was causing duplicate notifications
 * when both systems ran simultaneously. Keeping hook structure for potential
 * future use with task-specific reminders that require local scheduling.
 */
export function useLocalNotificationScheduler(userId: string | undefined) {
  
  const scheduleNotifications = useCallback(async (prefs: NotificationPreferences) => {
    // DISABLED: Server-side handles all daily notifications now
    // This prevents duplicate notifications from both systems firing
    if (!Capacitor.isNativePlatform()) return;
    
    // Cancel any previously scheduled local notifications to clean up
    try {
      await LocalNotifications.cancel({
        notifications: Object.values(NOTIFICATION_IDS).map(id => ({ id }))
      });
      console.log('[LocalScheduler] Cleared local notifications - server-side handles delivery');
    } catch (e) {
      console.log('[LocalScheduler] No notifications to clear');
    }
    
    // Early return - don't schedule new local notifications
    return;
    
    // Below code is disabled but preserved for reference
    const notifications: ScheduledNotification[] = [];
    const { wake_time, sleep_time } = prefs;
    
    // Cancel all existing scheduled notifications first
    await LocalNotifications.cancel({
      notifications: Object.values(NOTIFICATION_IDS).map(id => ({ id }))
    });
    
    // Morning Summary (7 AM or wake time, whichever is later)
    if (prefs.morning_summary) {
      const wakeHour = parseTime(wake_time).hour;
      const summaryHour = Math.max(7, wakeHour);
      
      if (isWithinActiveHours(summaryHour, wake_time, sleep_time)) {
        notifications.push({
          id: NOTIFICATION_IDS.MORNING_SUMMARY,
          title: '☀️ Good morning!',
          body: 'Your actions for today are ready. Let\'s make it count.',
          hour: summaryHour,
          minute: 0,
          type: 'morning_summary',
        });
      }
    }
    
    // Evening Check-in (6 PM)
    if (prefs.evening_checkin) {
      if (isWithinActiveHours(18, wake_time, sleep_time)) {
        notifications.push({
          id: NOTIFICATION_IDS.EVENING_CHECKIN,
          title: '🌅 Evening check-in',
          body: 'A few actions are still waiting for you today.',
          hour: 18,
          minute: 0,
          type: 'evening_checkin',
        });
      }
    }
    
    // Time Period Reminders
    if (prefs.time_period_reminders) {
      const periods = [
        { id: NOTIFICATION_IDS.PERIOD_MORNING, hour: 6, title: '🌅 Morning time', body: 'Your morning actions are waiting gently.' },
        { id: NOTIFICATION_IDS.PERIOD_AFTERNOON, hour: 12, title: '🌤️ Afternoon is here', body: 'Time for your afternoon actions.' },
        { id: NOTIFICATION_IDS.PERIOD_EVENING, hour: 17, title: '🌇 Evening ritual', body: 'Your evening actions await.' },
        { id: NOTIFICATION_IDS.PERIOD_BEDTIME, hour: 21, title: '🌙 Bedtime routine', body: 'Time to wind down with your bedtime actions.' },
      ];
      
      for (const period of periods) {
        if (isWithinActiveHours(period.hour, wake_time, sleep_time)) {
          notifications.push({
            id: period.id,
            title: period.title,
            body: period.body,
            hour: period.hour,
            minute: 0,
            type: 'time_period',
          });
        }
      }
    }
    
    // Goal Nudges (9am, 12pm, 3pm, 6pm)
    if (prefs.goal_nudges) {
      const nudges = [
        { id: NOTIFICATION_IDS.GOAL_NUDGE_9AM, hour: 9, body: 'How\'s your water intake going? 💧' },
        { id: NOTIFICATION_IDS.GOAL_NUDGE_12PM, hour: 12, body: 'Midday check: Keep going on your goals! 💧' },
        { id: NOTIFICATION_IDS.GOAL_NUDGE_3PM, hour: 15, body: 'Afternoon hydration reminder 💧' },
        { id: NOTIFICATION_IDS.GOAL_NUDGE_6PM, hour: 18, body: 'Almost there! Final push on your goals 💧' },
      ];
      
      for (const nudge of nudges) {
        if (isWithinActiveHours(nudge.hour, wake_time, sleep_time)) {
          notifications.push({
            id: nudge.id,
            title: '💧 Goal Check',
            body: nudge.body,
            hour: nudge.hour,
            minute: 0,
            type: 'goal_nudge',
          });
        }
      }
    }
    
    // Schedule all notifications
    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications: notifications.map(n => ({
          id: n.id,
          title: n.title,
          body: n.body,
          schedule: {
            on: { hour: n.hour, minute: n.minute },
            repeats: true,
          },
          sound: 'default',
          extra: { type: n.type, url: '/app/home' },
        })),
      });
      
      console.log(`[LocalScheduler] ✅ Scheduled ${notifications.length} daily notifications`);
    }
  }, []);
  
  // Fetch preferences and schedule on mount and when user changes
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;
    
    const fetchAndSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('morning_summary, evening_checkin, time_period_reminders, goal_nudges, wake_time, sleep_time')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('[LocalScheduler] Error fetching preferences:', error);
          return;
        }
        
        // Use defaults if no preferences exist
        const prefs: NotificationPreferences = {
          morning_summary: data?.morning_summary ?? true,
          evening_checkin: data?.evening_checkin ?? true,
          time_period_reminders: data?.time_period_reminders ?? true,
          goal_nudges: data?.goal_nudges ?? true,
          wake_time: data?.wake_time ?? '07:00',
          sleep_time: data?.sleep_time ?? '22:00',
        };
        
        await scheduleNotifications(prefs);
      } catch (err) {
        console.error('[LocalScheduler] Error:', err);
      }
    };
    
    fetchAndSchedule();
  }, [userId, scheduleNotifications]);
  
  return { scheduleNotifications };
}
