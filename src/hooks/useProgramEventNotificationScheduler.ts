import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { logLocalNotificationEvent, NotificationType } from '@/lib/localNotificationLogger';
import type { Json } from '@/integrations/supabase/types';

/**
 * Hook that automatically schedules local notifications for program events:
 * - Session reminders (24h and 1h before)
 * - Drip content unlock notifications
 * 
 * Runs when user logs in and syncs enrollment data.
 * Uses localStorage to track which events already have scheduled notifications.
 */

const SESSION_NOTIFICATION_PREFIX = 800000;
const CONTENT_NOTIFICATION_PREFIX = 850000;
const SCHEDULED_SESSIONS_KEY = 'scheduled_session_notifications';
const SCHEDULED_CONTENT_KEY = 'scheduled_content_notifications';

// Hash function for generating stable notification IDs
function hashId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 100000);
}

// Get already scheduled notification IDs from localStorage
function getScheduledIds(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

// Save scheduled notification IDs to localStorage
function saveScheduledIds(key: string, ids: Set<string>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch (e) {
    console.error('[ProgramEventPN] Failed to save scheduled IDs:', e);
  }
}

export function useProgramEventNotificationScheduler() {
  const { user } = useAuth();
  const hasScheduledRef = useRef(false);
  const isSchedulingRef = useRef(false);

  const scheduleSessionNotifications = useCallback(async () => {
    if (!user || !Capacitor.isNativePlatform()) return { scheduled: 0 };
    if (isSchedulingRef.current) return { scheduled: 0 };
    
    isSchedulingRef.current = true;
    
    try {
      // Get user's active enrollments with round data
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          program_slug,
          course_name,
          round_id,
          program_rounds (
            id,
            program_slug,
            round_name,
            google_meet_link
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollError || !enrollments) {
        console.error('[ProgramEventPN] Error fetching enrollments:', enrollError);
        return { scheduled: 0 };
      }

      const roundIds = enrollments
        .map(e => (e.program_rounds as any)?.id)
        .filter(Boolean);

      if (roundIds.length === 0) {
        return { scheduled: 0 };
      }

      // Get future sessions (next 30 days)
      const now = new Date();
      const thirtyDaysLater = addDays(now, 30);
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('program_sessions')
        .select('*')
        .in('round_id', roundIds)
        .gte('session_date', now.toISOString())
        .lte('session_date', thirtyDaysLater.toISOString())
        .eq('status', 'scheduled');

      if (sessionsError) {
        console.error('[ProgramEventPN] Error fetching sessions:', sessionsError);
        return { scheduled: 0 };
      }

      if (!sessions || sessions.length === 0) {
        console.log('[ProgramEventPN] No upcoming sessions to schedule');
        return { scheduled: 0 };
      }

      // Get already scheduled session IDs
      const scheduledIds = getScheduledIds(SCHEDULED_SESSIONS_KEY);
      const notificationsToSchedule: Array<{
        id: number;
        title: string;
        body: string;
        schedule: { at: Date; allowWhileIdle: boolean };
        sound: string;
        extra: Record<string, unknown>;
      }> = [];

      for (const session of sessions) {
        const sessionDate = new Date(session.session_date);
        
        // Schedule 24h reminder
        const reminder24hId = `session-24h-${session.id}`;
        if (!scheduledIds.has(reminder24hId)) {
          const reminder24hTime = new Date(sessionDate);
          reminder24hTime.setHours(reminder24hTime.getHours() - 24);
          
          if (reminder24hTime > now) {
            notificationsToSchedule.push({
              id: SESSION_NOTIFICATION_PREFIX + hashId(reminder24hId),
              title: '📅 Session Tomorrow!',
              body: `"${session.title}" is scheduled for ${format(sessionDate, 'EEEE')} at ${format(sessionDate, 'h:mm a')}`,
              schedule: { at: reminder24hTime, allowWhileIdle: true },
              sound: 'default',
              extra: {
                type: 'session_reminder_24h',
                sessionId: session.id,
                url: '/app/home',
              },
            });
            scheduledIds.add(reminder24hId);
          }
        }

        // Schedule 1h reminder
        const reminder1hId = `session-1h-${session.id}`;
        if (!scheduledIds.has(reminder1hId)) {
          const reminder1hTime = new Date(sessionDate);
          reminder1hTime.setHours(reminder1hTime.getHours() - 1);
          
          if (reminder1hTime > now) {
            notificationsToSchedule.push({
              id: SESSION_NOTIFICATION_PREFIX + hashId(reminder1hId) + 50000,
              title: '📅 Session Starting in 1 Hour!',
              body: `"${session.title}" starts at ${format(sessionDate, 'h:mm a')}. Get ready to join!`,
              schedule: { at: reminder1hTime, allowWhileIdle: true },
              sound: 'default',
              extra: {
                type: 'session_reminder_1h',
                sessionId: session.id,
                meetingLink: session.meeting_link,
                url: '/app/home',
              },
            });
            scheduledIds.add(reminder1hId);
          }
        }
      }

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule as any,
        });
        
        // Log scheduled notifications
        for (const n of notificationsToSchedule) {
          logLocalNotificationEvent({
            notificationType: n.extra.type as NotificationType,
            event: 'scheduled',
            notificationId: n.id,
            metadata: {
              title: n.title,
              body: n.body,
              scheduledAt: n.schedule.at.toISOString(),
              source: 'auto_program_sync',
            } as Record<string, Json>,
          });
        }
        
        saveScheduledIds(SCHEDULED_SESSIONS_KEY, scheduledIds);
        console.log(`[ProgramEventPN] ✅ Scheduled ${notificationsToSchedule.length} session notifications`);
      }

      return { scheduled: notificationsToSchedule.length };
    } catch (error) {
      console.error('[ProgramEventPN] Error scheduling session notifications:', error);
      return { scheduled: 0 };
    } finally {
      isSchedulingRef.current = false;
    }
  }, [user]);

  const scheduleContentNotifications = useCallback(async () => {
    if (!user || !Capacitor.isNativePlatform()) return { scheduled: 0 };

    try {
      // Get user's active enrollments with round and playlist data
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          program_slug,
          round_id,
          program_rounds (
            id,
            first_session_date,
            drip_offset_days,
            audio_playlist_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollError || !enrollments) {
        return { scheduled: 0 };
      }

      const scheduledIds = getScheduledIds(SCHEDULED_CONTENT_KEY);
      const notificationsToSchedule: Array<{
        id: number;
        title: string;
        body: string;
        schedule: { at: Date; allowWhileIdle: boolean };
        sound: string;
        extra: Record<string, unknown>;
      }> = [];

      const now = new Date();
      const thirtyDaysLater = addDays(now, 30);

      for (const enrollment of enrollments) {
        const round = enrollment.program_rounds as any;
        if (!round?.audio_playlist_id || !round?.first_session_date) continue;

        const firstSessionDate = new Date(round.first_session_date);
        const dripOffset = round.drip_offset_days || 0;

        // Get drip content (modules and tracks)
        const [{ data: modules }, { data: tracks }] = await Promise.all([
          supabase
            .from('playlist_supplements')
            .select('id, title, drip_delay_days')
            .eq('playlist_id', round.audio_playlist_id)
            .gt('drip_delay_days', 0),
          supabase
            .from('audio_playlist_items')
            .select('id, drip_delay_days, audio_content(id, title)')
            .eq('playlist_id', round.audio_playlist_id)
            .gt('drip_delay_days', 0),
        ]);

        // Process modules
        for (const module of modules || []) {
          const contentId = `content-${module.id}`;
          if (scheduledIds.has(contentId)) continue;

          const unlockDate = new Date(firstSessionDate);
          unlockDate.setDate(unlockDate.getDate() + (module.drip_delay_days - 1) + dripOffset);

          if (unlockDate > now && unlockDate <= thirtyDaysLater) {
            notificationsToSchedule.push({
              id: CONTENT_NOTIFICATION_PREFIX + hashId(contentId),
              title: '🔓 New Content Available!',
              body: `"${module.title}" is now available. Tap to view!`,
              schedule: { at: unlockDate, allowWhileIdle: true },
              sound: 'default',
              extra: {
                type: 'content_unlock',
                moduleId: module.id,
                playlistId: round.audio_playlist_id,
                url: `/app/programs/${enrollment.program_slug}`,
              },
            });
            scheduledIds.add(contentId);
          }
        }

        // Process audio tracks
        for (const track of tracks || []) {
          const audio = track.audio_content as any;
          if (!audio) continue;

          const contentId = `content-track-${audio.id}`;
          if (scheduledIds.has(contentId)) continue;

          const unlockDate = new Date(firstSessionDate);
          unlockDate.setDate(unlockDate.getDate() + (track.drip_delay_days - 1) + dripOffset);

          if (unlockDate > now && unlockDate <= thirtyDaysLater) {
            notificationsToSchedule.push({
              id: CONTENT_NOTIFICATION_PREFIX + hashId(contentId),
              title: '🎧 New Lesson Available!',
              body: `"${audio.title}" is now available. Tap to listen!`,
              schedule: { at: unlockDate, allowWhileIdle: true },
              sound: 'default',
              extra: {
                type: 'content_unlock',
                trackId: audio.id,
                playlistId: round.audio_playlist_id,
                url: `/app/player/playlist/${round.audio_playlist_id}`,
              },
            });
            scheduledIds.add(contentId);
          }
        }
      }

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule as any,
        });

        for (const n of notificationsToSchedule) {
          logLocalNotificationEvent({
            notificationType: 'content_unlock',
            event: 'scheduled',
            notificationId: n.id,
            metadata: {
              title: n.title,
              body: n.body,
              scheduledAt: n.schedule.at.toISOString(),
              source: 'auto_program_sync',
            } as Record<string, Json>,
          });
        }

        saveScheduledIds(SCHEDULED_CONTENT_KEY, scheduledIds);
        console.log(`[ProgramEventPN] ✅ Scheduled ${notificationsToSchedule.length} content notifications`);
      }

      return { scheduled: notificationsToSchedule.length };
    } catch (error) {
      console.error('[ProgramEventPN] Error scheduling content notifications:', error);
      return { scheduled: 0 };
    }
  }, [user]);

  // Run scheduling when user logs in
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    if (hasScheduledRef.current) return;

    const scheduleAll = async () => {
      hasScheduledRef.current = true;
      
      const [sessionResult, contentResult] = await Promise.all([
        scheduleSessionNotifications(),
        scheduleContentNotifications(),
      ]);

      console.log(`[ProgramEventPN] Total scheduled: ${sessionResult.scheduled + contentResult.scheduled} notifications`);
    };

    // Small delay to let app fully initialize
    const timer = setTimeout(scheduleAll, 2000);
    return () => clearTimeout(timer);
  }, [user, scheduleSessionNotifications, scheduleContentNotifications]);

  return {
    reschedule: async () => {
      hasScheduledRef.current = false;
      // Clear previously scheduled IDs to force reschedule
      localStorage.removeItem(SCHEDULED_SESSIONS_KEY);
      localStorage.removeItem(SCHEDULED_CONTENT_KEY);
      
      const [sessionResult, contentResult] = await Promise.all([
        scheduleSessionNotifications(),
        scheduleContentNotifications(),
      ]);
      
      return {
        sessions: sessionResult.scheduled,
        content: contentResult.scheduled,
      };
    },
  };
}
