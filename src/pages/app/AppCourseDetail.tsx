import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FolderOpen, Calendar, ExternalLink, Info, MessageCircle, Music, Send, CheckCircle2, CalendarPlus, Loader2, Bell, Clock, Lock, FileText, Play, Settings2, BellRing, HelpCircle } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { BackButton } from '@/components/app/BackButton';
import { downloadICSFile, generateICSFile } from '@/utils/calendar';
import { addEventToCalendar, addMultipleEventsToCalendar, isCalendarAvailable, CalendarEvent, checkCalendarPermission } from '@/lib/calendarIntegration';
import { format, addWeeks } from 'date-fns';
import { toast } from "sonner";
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isNativeApp } from '@/lib/platform';
import { programImages } from '@/data/programs';
import { IAPPlanPicker } from '@/components/app/IAPPlanPicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { shouldShowEnrollmentReminder } from '@/hooks/useNotificationReminder';
import { subscribeToPushNotifications, checkPermissionStatus } from '@/lib/pushNotifications';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUnseenContentContext } from '@/contexts/UnseenContentContext';
import { CalendarPermissionPrompt } from '@/components/app/CalendarPermissionPrompt';
import { CourseNotificationPrompt } from '@/components/app/CourseNotificationPrompt';
import { shouldShowCourseNotificationPrompt } from '@/hooks/usePushNotificationFlow';
import { useCalendarSyncTracking } from '@/hooks/useCalendarSyncTracking';
import { useSessionReminderSettings, ReminderSettings } from '@/hooks/useSessionReminderSettings';
import { SessionReminderSheet } from '@/components/app/SessionReminderSheet';
import { scheduleUrgentAlarm } from '@/lib/taskAlarm';
import { scheduleTaskReminder, cancelTaskReminder, isLocalNotificationsAvailable } from '@/lib/localNotifications';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { RoundTour, TourHelpButton } from '@/components/app/tour';

const AppCourseDetail = () => {
  const { slug, roundId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEnrollmentReminder, setShowEnrollmentReminder] = useState(false);
  const [isEnablingEnrollment, setIsEnablingEnrollment] = useState(false);
  const [isSyncingAllSessions, setIsSyncingAllSessions] = useState(false);
  const [hasNewSessions, setHasNewSessions] = useState(false);
  const [addingSessionId, setAddingSessionId] = useState<string | null>(null);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [showCourseNotificationPrompt, setShowCourseNotificationPrompt] = useState(false);
  const [showSessionReminderSheet, setShowSessionReminderSheet] = useState(false);
  const [showContentReminderSheet, setShowContentReminderSheet] = useState(false);
  const [startTour, setStartTour] = useState<(() => void) | null>(null);
  
  const handleTourReady = useCallback((tourStart: () => void) => {
    setStartTour(() => tourStart);
  }, []);
  
  // Get unseen content functions for view tracking
  let markEnrollmentViewed: ((id: string) => Promise<void>) | null = null;
  let markRoundViewed: ((id: string) => Promise<void>) | null = null;
  try {
    const unseenContent = useUnseenContentContext();
    markEnrollmentViewed = unseenContent.markEnrollmentViewed;
    markRoundViewed = unseenContent.markRoundViewed;
  } catch {
    // Provider not available, ignore
  }
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['course-enrollment', slug, roundId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If round ID is provided, get that specific enrollment
      if (roundId) {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select('*, program_rounds(*)')
          .eq('user_id', user.id)
          .eq('program_slug', slug)
          .eq('round_id', roundId)
          .maybeSingle();

        if (error) throw error;
        return data;
      }

      // Otherwise, fall back to most recent enrollment
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('*, program_rounds(*)')
        .eq('user_id', user.id)
        .eq('program_slug', slug)
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Track view when enrollment data loads
  useEffect(() => {
    if (enrollment?.id && markEnrollmentViewed) {
      markEnrollmentViewed(enrollment.id);
    }
    if (enrollment?.program_rounds?.id && markRoundViewed) {
      markRoundViewed(enrollment.program_rounds.id);
    }
  }, [enrollment?.id, enrollment?.program_rounds?.id, markEnrollmentViewed, markRoundViewed]);

  // Fetch user profile for WhatsApp message
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: program } = useQuery({
    queryKey: ['program', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select(`
          *
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const round = enrollment?.program_rounds;

  // Calendar sync tracking hook - tracks which sessions have been synced to calendar
  const {
    markSessionSynced,
    markAllSessionsSynced,
    isSessionSynced,
    areAllSessionsSynced,
    getUnsyncedCount,
  } = useCalendarSyncTracking(round?.id);

  // Program event reminder settings hook - manages reminder settings for program events (sessions & content) as planner tasks
  const {
    sessionSettings,
    setSessionSettings,
    contentSettings,
    setContentSettings,
    hasContentReminder,
    markContentScheduled,
    unmarkContentScheduled,
  } = useSessionReminderSettings(round?.id);

  // Fetch sessions for this round from the database
  const { data: dbSessions } = useQuery({
    queryKey: ['program-sessions', round?.id],
    queryFn: async () => {
      if (!round?.id) return [];
      
      const { data, error } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('round_id', round.id)
        .eq('status', 'scheduled')
        .order('session_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!round?.id,
  });

  // Fetch the round's feed channel for Community button
  const { data: roundChannel } = useQuery({
    queryKey: ['round-channel', round?.id],
    queryFn: async () => {
      if (!round?.id) return null;
      
      const { data, error } = await supabase
        .from('feed_channels')
        .select('id, name, slug')
        .eq('round_id', round.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!round?.id,
  });

  // Fetch playlist modules for Content Schedule
  const { data: playlistModules } = useQuery({
    queryKey: ['course-modules-schedule', round?.audio_playlist_id],
    queryFn: async () => {
      if (!round?.audio_playlist_id) return [];
      
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select('id, title, type, drip_delay_days')
        .eq('playlist_id', round.audio_playlist_id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!round?.audio_playlist_id,
  });

  // Fetch playlist audio tracks for fallback Content Schedule (e.g., audiobook tracks)
  const { data: playlistTracks } = useQuery({
    queryKey: ['course-tracks-schedule', round?.audio_playlist_id],
    queryFn: async () => {
      if (!round?.audio_playlist_id) return [];
      
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          drip_delay_days,
          sort_order,
          audio_content (
            id,
            title
          )
        `)
        .eq('playlist_id', round.audio_playlist_id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!round?.audio_playlist_id,
  });

  // Fetch unread post count for the round's channel
  const { data: channelUnreadCount } = useQuery({
    queryKey: ['channel-unread-count', roundChannel?.id, user?.id],
    queryFn: async () => {
      if (!roundChannel?.id || !user?.id) return 0;
      
      // Get all posts in this channel
      const { data: allPosts } = await supabase
        .from('feed_posts')
        .select('id')
        .eq('channel_id', roundChannel.id);
      
      if (!allPosts || allPosts.length === 0) return 0;
      
      const postIds = allPosts.map(p => p.id);
      
      // Get which ones the user has read
      const { data: readPostIds } = await supabase
        .from('feed_post_reads')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      
      const readSet = new Set(readPostIds?.map(r => r.post_id) || []);
      const unreadCount = postIds.filter(id => !readSet.has(id)).length;
      
      return unreadCount;
    },
    enabled: !!roundChannel?.id && !!user?.id,
  });

  // Memoize session IDs for sync tracking
  const sessionIds = useMemo(() => dbSessions?.map(s => s.id) || [], [dbSessions]);

  // Check if there are unsynced sessions using the tracking hook
  useEffect(() => {
    if (!round?.id || !dbSessions || dbSessions.length === 0) {
      setHasNewSessions(false);
      return;
    }
    
    // Show banner if there are any unsynced sessions
    const unsyncedCount = getUnsyncedCount(sessionIds);
    setHasNewSessions(unsyncedCount > 0);
  }, [round?.id, dbSessions, sessionIds, getUnsyncedCount]);

  // Show calendar permission prompt for enrolled users on native app
  useEffect(() => {
    const checkCalendarPrompt = async () => {
      // Only on native app with calendar available
      if (!isNativeApp() || !isCalendarAvailable()) return;
      
      // Only for enrolled users with sessions
      if (!enrollment || !dbSessions || dbSessions.length === 0) return;
      
      // Check if dismissed recently (within 7 days)
      const dismissed = localStorage.getItem('calendarPermissionPromptDismissed');
      if (dismissed) {
        const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }
      
      // Check current permission
      const permission = await checkCalendarPermission();
      if (permission === 'granted') return;
      
      // Show prompt after 1.5 seconds
      setTimeout(() => setShowCalendarPrompt(true), 1500);
    };
    
    checkCalendarPrompt();
  }, [enrollment, dbSessions]);

  // Show push notification prompt for enrolled users
  useEffect(() => {
    const checkNotificationPrompt = async () => {
      // Only for enrolled users
      if (!enrollment || !user?.id) return;
      
      // Check if we should show
      const shouldShow = await shouldShowCourseNotificationPrompt();
      if (shouldShow) {
        // Delay slightly to not overwhelm user
        setTimeout(() => setShowCourseNotificationPrompt(true), 2500);
      }
    };
    
    checkNotificationPrompt();
  }, [enrollment, user?.id]);

  // Helper to get course page URL for non-Google Meet sessions
  const getCoursePageUrl = (programSlug: string): string => {
    return `https://ladybosslook.com/app/programs/${programSlug}`;
  };

  // Helper to get event location - uses Google Meet link if enabled, otherwise course page
  const getEventLocation = (meetingLink?: string | null): string | undefined => {
    // If first_session_is_google_meet is true (or undefined for backwards compat), use meeting link
    if ((round as any)?.first_session_is_google_meet !== false) {
      return meetingLink || round?.google_meet_link || undefined;
    }
    // Otherwise, use course page link
    return getCoursePageUrl(slug || '');
  };

  // Helper to get event description - just returns the base description
  const getEventDescription = (baseDescription: string): string => {
    return baseDescription;
  };

  const handleAddToCalendar = async () => {
    if (!nextSession || !program) return;

    const event = {
      title: nextSession.title,
      description: getEventDescription(nextSession.description || `Session ${nextSession.session_number} of ${program.title}`),
      startDate: new Date(nextSession.session_date),
      endDate: new Date(
        new Date(nextSession.session_date).getTime() +
        (nextSession.duration_minutes || 90) * 60000
      ),
      location: getEventLocation(nextSession.meeting_link || round?.google_meet_link),
    };

    // Native iOS/Android: Use native calendar integration
    if (isNativeApp() && isCalendarAvailable()) {
      try {
        const result = await addEventToCalendar({
          ...event,
          reminderMinutes: 60, // 1 hour reminder
        });
        
        if (result.success) {
          toast.success('Session added to your calendar!');
          markSessionSynced(nextSession.id);
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          // Fallback to share sheet if native calendar fails
          const icsContent = generateICSFile(event);
          const fileName = `${program.title.replace(/\s+/g, '-')}.ics`;
          
          const fileResult = await Filesystem.writeFile({
            path: fileName,
            data: icsContent,
            directory: Directory.Cache,
          });

          await Share.share({
            title: 'Add to Calendar',
            text: `${event.title}`,
            url: fileResult.uri,
            dialogTitle: 'Add Event to Calendar'
          });
          
          toast.success('Select Calendar app to add event');
          markSessionSynced(nextSession.id);
        }
      } catch (error) {
        console.error('Error adding calendar event:', error);
        toast.error('Failed to add to calendar');
      }
    } else {
      // Web: Download ICS file
      downloadICSFile(event, `${program.title.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar event downloaded!');
      markSessionSynced(nextSession.id);
    }
  };

  // Generate all session events for the course - use DB sessions if available, otherwise fallback to weekly generation
  const generateAllSessionEvents = (): CalendarEvent[] => {
    if (!program) return [];
    
    // If we have real sessions from the database, use those
    if (dbSessions && dbSessions.length > 0) {
      return dbSessions.map(session => {
        const meetingLink = session.meeting_link || round?.google_meet_link;
        return {
          title: session.title,
          description: getEventDescription(session.description || `Session ${session.session_number} of ${program.title}`),
          startDate: new Date(session.session_date),
          endDate: new Date(new Date(session.session_date).getTime() + (session.duration_minutes || 90) * 60000),
          location: getEventLocation(meetingLink),
          reminderMinutes: 60,
        };
      });
    }
    
    // Fallback: generate weekly sessions from start to end date
    if (!round?.start_date) return [];
    
    const events: CalendarEvent[] = [];
    const startDate = new Date(round.start_date);
    const endDate = round.end_date ? new Date(round.end_date) : addWeeks(startDate, 8);
    const sessionDuration = round.first_session_duration || 90;
    
    let sessionNumber = 1;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      events.push({
        title: `${program.title} - Session ${sessionNumber}`,
        description: getEventDescription(`Session ${sessionNumber} of ${program.title}`),
        startDate: new Date(currentDate),
        endDate: new Date(currentDate.getTime() + sessionDuration * 60000),
        location: getEventLocation(round.google_meet_link),
        reminderMinutes: 60,
      });
      
      sessionNumber++;
      currentDate = addWeeks(currentDate, 1);
    }
    
    return events;
  };

  // Sync all sessions to calendar
  const handleSyncAllSessions = async () => {
    if (!round || !program) return;
    
    const events = generateAllSessionEvents();
    if (events.length === 0) {
      toast.error('No sessions to sync');
      return;
    }

    if (isNativeApp() && isCalendarAvailable()) {
      setIsSyncingAllSessions(true);
      try {
        const result = await addMultipleEventsToCalendar(events);
        
        if (result.success) {
          toast.success(`Added ${result.addedCount} sessions to your calendar!`);
          // Mark all sessions as synced using the tracking hook
          const sessionIds = dbSessions?.map(s => s.id) || [];
          markAllSessionsSynced(sessionIds);
          setHasNewSessions(false);
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          toast.error(result.error || 'Failed to sync sessions');
        }
      } catch (error) {
        console.error('Error syncing sessions:', error);
        toast.error('Failed to sync sessions');
      } finally {
        setIsSyncingAllSessions(false);
      }
    } else {
      // Web fallback: Download ICS with all events
      const icsEvents = events.map(e => ({
        title: e.title,
        description: e.description,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
      }));
      
      // For web, just download first session
      downloadICSFile(icsEvents[0], `${program.title.replace(/\s+/g, '-')}-sessions.ics`);
      toast.success('Calendar file downloaded!');
      // Mark all sessions as synced for web too
      const sessionIds = dbSessions?.map(s => s.id) || [];
      markAllSessionsSynced(sessionIds);
      setHasNewSessions(false);
    }
  };

  // Auto-sync calendar on enrollment if preference is enabled
  const autoSyncCalendarOnEnrollment = async () => {
    const autoSyncEnabled = localStorage.getItem('autoSyncCalendar') === 'true';
    if (!autoSyncEnabled || !isNativeApp() || !isCalendarAvailable()) return;
    
    const events = generateAllSessionEvents();
    if (events.length === 0) return;
    
    try {
      const result = await addMultipleEventsToCalendar(events);
      if (result.success) {
        toast.success(`${result.addedCount} sessions added to calendar!`);
      }
    } catch (error) {
      console.error('Auto-sync calendar error:', error);
    }
  };

  const handleContactSupport = () => {
    // Open the customizable support link from the round
    const supportUrl = (round as any)?.support_link_url || 'https://t.me/ladybosslook';
    window.open(supportUrl, '_blank');
  };

  // Add single session to calendar using GLOBAL reminder settings
  const handleAddSingleSession = async (
    session: typeof dbSessions extends (infer T)[] ? T : never
  ) => {
    if (!program) return;
    
    setAddingSessionId(session.id);
    
    const sessionDate = new Date(session.session_date);
    
    // If urgent mode is enabled, use calendar alarm
    if (sessionSettings.isUrgent && isNativeApp()) {
      try {
        const result = await scheduleUrgentAlarm({
          taskId: `session-${session.id}`,
          title: `📅 ${session.title}`,
          emoji: '📅',
          scheduledDate: format(sessionDate, 'yyyy-MM-dd'),
          scheduledTime: format(sessionDate, 'HH:mm'),
          reminderOffset: sessionSettings.reminderMinutes,
        });
        
        if (result.success) {
          toast.success('Urgent alarm set!');
          markSessionSynced(session.id);
        } else {
          toast.error(result.error || 'Failed to set alarm');
        }
      } catch (error) {
        console.error('Error setting urgent alarm:', error);
        toast.error('Failed to set alarm');
      }
      setAddingSessionId(null);
      return;
    }
    
    // Normal calendar event
    const event: CalendarEvent = {
      title: session.title,
      description: session.description || `Session ${session.session_number} of ${program.title}`,
      startDate: sessionDate,
      endDate: new Date(sessionDate.getTime() + (session.duration_minutes || 90) * 60000),
      location: getEventLocation(session.meeting_link),
      reminderMinutes: sessionSettings.reminderMinutes,
    };

    if (isNativeApp() && isCalendarAvailable()) {
      try {
        const result = await addEventToCalendar(event);
        
        if (result.success) {
          toast.success('Session added to calendar!');
          markSessionSynced(session.id);
        } else if (result.error === 'Calendar permission denied') {
          toast.error('Please allow calendar access in Settings');
        } else {
          toast.error(result.error || 'Failed to add session');
        }
      } catch (error) {
        console.error('Error adding session:', error);
        toast.error('Failed to add to calendar');
      }
    } else {
      downloadICSFile({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
      }, `${session.title.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar file downloaded!');
      markSessionSynced(session.id);
    }
    
    setAddingSessionId(null);
  };

  // Handle saving GLOBAL session reminder settings - schedules notifications for program events
  const handleSaveSessionSettings = async (settings: ReminderSettings) => {
    setSessionSettings(settings);
    
    if (!dbSessions || dbSessions.length === 0) {
      toast.success('Session reminder settings saved');
      return;
    }
    
    if (settings.enabled && isLocalNotificationsAvailable()) {
      // Schedule notifications for all future sessions
      let scheduledCount = 0;
      for (const session of dbSessions) {
        const sessionDate = new Date(session.session_date);
        if (sessionDate > new Date()) {
          if (settings.isUrgent) {
            await scheduleUrgentAlarm({
              taskId: `program-session-${session.id}`,
              title: session.title,
              emoji: '📅',
              scheduledDate: format(sessionDate, 'yyyy-MM-dd'),
              scheduledTime: format(sessionDate, 'HH:mm'),
              reminderOffset: settings.reminderMinutes,
            });
          } else {
            await scheduleTaskReminder({
              taskId: `program-session-${session.id}`,
              title: `📅 ${session.title}`,
              emoji: '📅',
              scheduledDate: format(sessionDate, 'yyyy-MM-dd'),
              scheduledTime: format(sessionDate, 'HH:mm'),
              reminderOffset: settings.reminderMinutes,
              repeatPattern: 'none',
              proLinkType: 'course',
              proLinkValue: slug || null,
            });
          }
          scheduledCount++;
        }
      }
      toast.success(`Reminders set for ${scheduledCount} sessions`);
    } else if (!settings.enabled) {
      // Cancel all session reminders
      for (const session of dbSessions) {
        await cancelTaskReminder(`program-session-${session.id}`);
      }
      toast.success('Session reminders disabled');
    } else {
      toast.success('Session reminder settings saved');
    }
  };

  // Handle saving GLOBAL content reminder settings - schedules notifications for content unlocks
  const handleSaveContentSettings = async (settings: ReminderSettings) => {
    setContentSettings(settings);
    
    const items = hasDripModules ? playlistModules : (hasDripTracks ? playlistTracks : []);
    if (!items || items.length === 0) {
      toast.success('Content reminder settings saved');
      return;
    }
    
    if (settings.enabled && isLocalNotificationsAvailable()) {
      // Schedule notifications for all future content unlocks
      let scheduledCount = 0;
      for (const item of items) {
        const dripDays = item.drip_delay_days || 0;
        const unlockDate = getModuleUnlockDate(dripDays);
        if (unlockDate && unlockDate > new Date()) {
          const title = (item as any).title || (item as any).audio_content?.title || 'Content Unlocked';
          if (settings.isUrgent) {
            await scheduleUrgentAlarm({
              taskId: `program-content-${item.id}`,
              title: title,
              emoji: '🔓',
              scheduledDate: format(unlockDate, 'yyyy-MM-dd'),
              scheduledTime: format(unlockDate, 'HH:mm'),
              reminderOffset: settings.reminderMinutes,
            });
          } else {
            await scheduleTaskReminder({
              taskId: `program-content-${item.id}`,
              title: `🔓 ${title}`,
              emoji: '🔓',
              scheduledDate: format(unlockDate, 'yyyy-MM-dd'),
              scheduledTime: format(unlockDate, 'HH:mm'),
              reminderOffset: settings.reminderMinutes,
              repeatPattern: 'none',
              proLinkType: 'playlist',
              proLinkValue: round?.audio_playlist_id || null,
            });
          }
          markContentScheduled(item.id);
          scheduledCount++;
        }
      }
      toast.success(`Reminders set for ${scheduledCount} content items`);
    } else if (!settings.enabled) {
      // Cancel all content reminders
      for (const item of items) {
        await cancelTaskReminder(`program-content-${item.id}`);
        unmarkContentScheduled(item.id);
      }
      toast.success('Content reminders disabled');
    } else {
      toast.success('Content reminder settings saved');
    }
  };

  // Handle content reminder (for locked modules/tracks) - uses GLOBAL content settings
  const handleContentReminder = async (item: any, unlockDate: Date) => {
    if (!isLocalNotificationsAvailable()) {
      toast.error('Reminders are only available in the app');
      return;
    }
    
    const hasReminder = hasContentReminder(item.id);
    
    if (hasReminder) {
      // Cancel existing reminder
      await cancelTaskReminder(`content-${item.id}`);
      unmarkContentScheduled(item.id);
      toast.success('Reminder cancelled');
    } else {
      // Schedule new reminder using global content settings
      const title = item.title || item.audio_content?.title || 'Content Unlocked';
      
      if (contentSettings.isUrgent) {
        const result = await scheduleUrgentAlarm({
          taskId: `content-${item.id}`,
          title: title,
          emoji: '🔓',
          scheduledDate: format(unlockDate, 'yyyy-MM-dd'),
          scheduledTime: format(unlockDate, 'HH:mm'),
          reminderOffset: contentSettings.reminderMinutes,
        });
        
        if (result.success) {
          markContentScheduled(item.id);
          toast.success('Urgent reminder set for unlock!');
        } else {
          toast.error(result.error || 'Failed to set reminder');
        }
      } else {
        const result = await scheduleTaskReminder({
          taskId: `content-${item.id}`,
          title: `🔓 ${title}`,
          emoji: '🔓',
          scheduledDate: format(unlockDate, 'yyyy-MM-dd'),
          scheduledTime: format(unlockDate, 'HH:mm'),
          reminderOffset: contentSettings.reminderMinutes,
          repeatPattern: 'none',
          proLinkType: 'playlist',
          proLinkValue: round?.audio_playlist_id || null,
        });
        
        if (result.success) {
          markContentScheduled(item.id);
          toast.success('Reminder set for unlock!');
        } else {
          toast.error(result.error || 'Failed to set reminder');
        }
      }
    }
  };

  // Find the next upcoming session (first session with date in the future)
  const getNextUpcomingSession = () => {
    if (!dbSessions || dbSessions.length === 0) return null;
    
    const now = new Date();
    return dbSessions.find(session => new Date(session.session_date) > now) || null;
  };

  const nextSession = getNextUpcomingSession();

  // Helper to determine if a session is in the past
  const isSessionPast = (sessionDate: string) => {
    return new Date(sessionDate) < new Date();
  };

  // Helper to determine if a session is today
  const isSessionToday = (sessionDate: string) => {
    const today = new Date();
    const session = new Date(sessionDate);
    return (
      session.getFullYear() === today.getFullYear() &&
      session.getMonth() === today.getMonth() &&
      session.getDate() === today.getDate()
    );
  };

  // Helper to determine if a date is today
  const isDateToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Calculate module unlock date based on first_session_date (or enrolled_at for self-paced)
  const getModuleUnlockDate = (dripDelayDays: number): Date | null => {
    if (dripDelayDays === 0) return null; // Immediate availability
    
    // For self-paced rounds, use enrollment date as the drip anchor
    const isSelfPaced = round?.is_self_paced;
    const anchorDate = isSelfPaced ? enrollment?.enrolled_at : round?.first_session_date;
    if (!anchorDate) return null; // No drip if no anchor date
    
    // Parse anchor date - supports both date-only and ISO timestamp formats
    const anchor = anchorDate.includes('T') 
      ? new Date(anchorDate)
      : new Date(anchorDate + 'T00:00:00');
    
    // drip_delay_days = 1 means at anchor time
    // drip_delay_days = 2 means 1 day after anchor
    const unlockDate = new Date(anchor);
    unlockDate.setDate(unlockDate.getDate() + (dripDelayDays - 1) + (round?.drip_offset_days || 0));
    
    return unlockDate;
  };

  // Get icon for module type
  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4 text-primary" />;
      case 'audio':
        return <Music className="h-4 w-4 text-primary" />;
      case 'pdf':
      case 'markdown':
      default:
        return <FileText className="h-4 w-4 text-primary" />;
    }
  };

  // Check if there are any drip-scheduled modules (drip_delay_days > 0)
  const hasDripModules = playlistModules && playlistModules.some(m => m.drip_delay_days > 0);
  
  // Fallback: Check if there are drip-scheduled tracks (e.g., audiobook chapters)
  const hasDripTracks = !hasDripModules && playlistTracks && playlistTracks.some(t => t.drip_delay_days > 0);
  
  // Determine if we should show any content schedule
  const showContentSchedule = hasDripModules || hasDripTracks;

  // Centralized invalidation for consistent cache clearing
  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();

  // Free enrollment mutation with optimistic update
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !program) throw new Error('Missing required data');
      
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_name: program.title,
          program_slug: program.slug,
          status: 'active'
        });
      
      if (error) throw error;
    },
    // Optimistic update for instant unlock
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['enrollments', user?.id] });
      await queryClient.cancelQueries({ queryKey: ['player-data', user?.id] });
      
      // Snapshot previous value for rollback
      const previousEnrollments = queryClient.getQueryData<string[]>(['enrollments', user?.id]);
      
      // Optimistically add this program to enrollments cache
      if (program?.slug) {
        queryClient.setQueryData<string[]>(['enrollments', user?.id], (old = []) => {
          return [...old, program.slug].filter(Boolean);
        });
      }
      
      return { previousEnrollments };
    },
    onSuccess: async () => {
      toast.success('Enrolled successfully!');
      
      // Invalidate and refetch with correct user-scoped keys for full data refresh
      invalidateAllEnrollmentData();
      
      // Also invalidate the course-specific query and force immediate refetch
      await queryClient.invalidateQueries({ queryKey: ['course-enrollment', slug] });
      await queryClient.refetchQueries({ queryKey: ['course-enrollment', slug], exact: true });
      
      // Auto-sync calendar if preference enabled
      await autoSyncCalendarOnEnrollment();
      
      // Show enrollment reminder popup if appropriate
      const shouldShow = await shouldShowEnrollmentReminder();
      if (shouldShow && isNativeApp()) {
        setTimeout(() => {
          setShowEnrollmentReminder(true);
        }, 1500); // Show after success toast
      }
    },
    onError: (error, variables, context) => {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll. Please try again.');
      
      // Rollback optimistic update on error
      if (context?.previousEnrollments) {
        queryClient.setQueryData(['enrollments', user?.id], context.previousEnrollments);
      }
    }
  });

  return (
    <>
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Fixed Header with safe area */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-lg rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-1 pb-2 px-4 flex items-center gap-1">
          <BackButton to="/app/programs" showLabel={false} />
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-lg truncate">{program?.title || 'Program Details'}</h1>
            {round && (
              <p className="text-xs text-muted-foreground truncate">
                {round.round_name}
              </p>
            )}
          </div>
          {startTour && <TourHelpButton onClick={startTour} />}
        </div>
      </div>

      {/* Header spacer */}
      <div className="shrink-0" style={{ height: 'calc(76px + env(safe-area-inset-top, 0px))' }} />

      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="container max-w-4xl py-4 px-4 pb-safe">
        <SEOHead 
          title={`${program?.title || 'Program'} Details - LadyBoss Academy`}
          description="Program details and materials"
        />
        
        <div className="space-y-6">

        {enrollmentLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading program details...</p>
            </CardContent>
          </Card>
        ) : !enrollment ? (
          /* Purchase Landing Page */
          <div className="space-y-6">

            {/* Program Video */}
            {program?.video_url && (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-video rounded-md overflow-hidden bg-muted">
                    {(() => {
                      let embedUrl = program.video_url;
                      if (embedUrl.includes('youtube.com/watch')) {
                        embedUrl = embedUrl.replace('watch?v=', 'embed/');
                      } else if (embedUrl.includes('youtu.be/')) {
                        embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
                      }
                      if (embedUrl.includes('vimeo.com/') && !embedUrl.includes('/video/')) {
                        embedUrl = embedUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
                      }
                      
                      if (embedUrl.includes('youtube') || embedUrl.includes('vimeo')) {
                        return (
                          <iframe
                            src={embedUrl}
                            title={`${program.title} video`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        );
                      }
                      return (
                        <video 
                          src={embedUrl} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Program Hero Image (only if no video) */}
            {program && !program.video_url && programImages[program.slug] && (
              <Card className="overflow-hidden">
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={programImages[program.slug]} 
                    alt={program.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Purchase Card */}
            {program && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{program.title}</CardTitle>
                  {program.description && (
                    <div 
                      className="text-muted-foreground mt-2 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(program.description) }}
                    />
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* What's Included */}
                  {program.features && Array.isArray(program.features) && program.features.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-4">What's Included</h3>
                      <div className="space-y-3">
                        {program.features.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Purchase / Enrollment Section */}
                  <div className="border-t pt-6">
                    {program.ios_product_id ? (
                      /* IAP Subscription Plan Picker - shown on both native and web */
                      <IAPPlanPicker program={program} />
                    ) : enrollment ? (
                      <Button 
                        size="lg" 
                        className="w-full" 
                        variant="secondary"
                        disabled
                      >
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Enrolled
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => enrollMutation.mutate()}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          'Enroll Free'
                        )}
                      </Button>
                    )}

                    {!program.ios_product_id && (
                      <p className="text-xs text-center text-muted-foreground mt-4">
                        Free enrollment • Instant access
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            {program && (
              <Card>
                <CardHeader>
                  <CardTitle>Program Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{program.duration || 'Self-paced'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Format</p>
                      <p className="font-semibold capitalize">{program.delivery_method || 'Online'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <>
            {/* Show round video if available, otherwise show program video */}
            {(round?.video_url || program?.video_url) && (() => {
              let embedUrl = round?.video_url || program?.video_url || '';
              
              // Convert YouTube URLs to embed format
              if (embedUrl.includes('youtube.com/watch')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
              } else if (embedUrl.includes('youtu.be/')) {
                embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
              }
              
              // Convert Vimeo URLs to embed format
              if (embedUrl.includes('vimeo.com/') && !embedUrl.includes('/video/')) {
                embedUrl = embedUrl.replace('vimeo.com/', 'player.vimeo.com/video/');
              }
              
              return (
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video rounded-md overflow-hidden bg-muted">
                      {embedUrl.includes('youtube') || embedUrl.includes('vimeo') ? (
                        <iframe
                          src={embedUrl}
                          title="Course video"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video 
                          src={embedUrl} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {round?.important_message && (
              <Alert className="border-primary/20 bg-primary/5" dir="auto">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
                  {round.important_message}
                </AlertDescription>
              </Alert>
            )}

            {/* New Sessions Available Banner */}
            {hasNewSessions && round && (
              <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 tour-sync-banner">
                <CalendarPlus className="h-4 w-4 text-amber-600" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span className="text-sm text-amber-800 dark:text-amber-200">
                    {getUnsyncedCount(sessionIds)} new session{getUnsyncedCount(sessionIds) > 1 ? 's' : ''} available! Sync to your calendar.
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="shrink-0 border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900"
                    onClick={handleSyncAllSessions}
                    disabled={isSyncingAllSessions}
                  >
                    {isSyncingAllSessions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        Sync {getUnsyncedCount(sessionIds)}
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Program Playlist Card */}
            {(program as any)?.audio_playlist_id && enrollment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Program Playlist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Content for this program
                  </p>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/app/player/playlist/${(program as any).audio_playlist_id}`)}
                  >
                    <Music className="h-5 w-5 mr-2" />
                    Open Playlist
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Only show if enrollment has a round */}
            {round && (
              <Card className="tour-quick-actions">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 1. Community Channel - Most used */}
                  {roundChannel && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full relative tour-community-btn"
                      onClick={() => navigate(`/app/channels?channel=${roundChannel.id}`)}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Visit Community
                      {channelUnreadCount && channelUnreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs"
                        >
                          {channelUnreadCount > 99 ? '99+' : channelUnreadCount}
                        </Badge>
                      )}
                    </Button>
                  )}

                  {/* 2. Round Audio Playlist - Primary content */}
                  {round.audio_playlist_id && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full tour-playlist-btn"
                      onClick={() => navigate(`/app/player/playlist/${round.audio_playlist_id}`)}
                    >
                      <Music className="h-5 w-5 mr-2" />
                      Round Playlist
                    </Button>
                  )}

                  {/* 3. Join Google Meet - Time-sensitive */}
                  {round.google_meet_link && (
                    <Button 
                      variant="default" 
                      size="lg" 
                      className="w-full tour-meet-btn"
                      onClick={() => window.open(round.google_meet_link!, '_blank')}
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Join Google Meet
                    </Button>
                  )}

                  {/* 4. Add Next Session to Calendar - only shows if there's an upcoming session */}
                  {nextSession && (
                    <Button 
                      variant={isSessionSynced(nextSession.id) ? "outline" : "secondary"}
                      size="lg" 
                      className={cn(
                        "w-full tour-calendar-btn",
                        isSessionSynced(nextSession.id) && "border-green-500 text-green-700 dark:text-green-400"
                      )}
                      onClick={handleAddToCalendar}
                    >
                      {isSessionSynced(nextSession.id) ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Session {nextSession.session_number} Synced
                        </>
                      ) : (
                        <>
                          <Calendar className="h-5 w-5 mr-2" />
                          {nextSession.session_number === 1 ? 'Add First Session' : `Add Session ${nextSession.session_number}`}
                        </>
                      )}
                    </Button>
                  )}

                  {/* 5. Sync All Sessions to Calendar */}
                  {dbSessions && dbSessions.length > 1 && (
                    <Button 
                      variant={areAllSessionsSynced(sessionIds) ? "outline" : "secondary"}
                      size="lg" 
                      className={cn(
                        "w-full tour-sync-all-btn",
                        areAllSessionsSynced(sessionIds) && "border-green-500 text-green-700 dark:text-green-400"
                      )}
                      onClick={handleSyncAllSessions}
                      disabled={isSyncingAllSessions}
                    >
                      {isSyncingAllSessions ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : areAllSessionsSynced(sessionIds) ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          All Sessions Synced
                        </>
                      ) : getUnsyncedCount(sessionIds) > 0 && getUnsyncedCount(sessionIds) < sessionIds.length ? (
                        <>
                          <CalendarPlus className="h-5 w-5 mr-2" />
                          Sync {getUnsyncedCount(sessionIds)} New Sessions
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-5 w-5 mr-2" />
                          Sync All Sessions
                        </>
                      )}
                    </Button>
                  )}

                  {/* 6. Access Google Drive - Resources */}
                  {round.google_drive_link && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full tour-drive-btn"
                      onClick={() => window.open(round.google_drive_link!, '_blank')}
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Access Google Drive
                    </Button>
                  )}

                  {/* 7. Contact Support - When needed */}
                  {(round as any).support_link_url && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full tour-support-btn"
                      onClick={handleContactSupport}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      {(round as any).support_link_label || 'Contact Support'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Sessions Card */}
            {dbSessions && dbSessions.length > 0 && (
              <Card className="tour-sessions-list">
                <CardHeader className="tour-sessions-header">
                  <CardTitle className="tour-sessions-title flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Sessions
                    <Badge variant="secondary" className="ml-auto">
                      {dbSessions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Reminder Settings Button */}
                  <Button
                    variant="outline"
                    className="w-full mb-4 bg-[#F4ECFE] hover:bg-[#E8DEF8] border-[#F4ECFE] tour-session-reminder-btn"
                    onClick={() => setShowSessionReminderSheet(true)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {sessionSettings.enabled ? 'Reminder Settings' : 'Enable Reminders'}
                  </Button>
                  <div className="space-y-3">
                    {dbSessions.map((session, index) => {
                      const sessionDate = new Date(session.session_date);
                      const isPast = isSessionPast(session.session_date);
                      const isToday = isSessionToday(session.session_date);
                      
                      return (
                        <div 
                          key={session.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isPast 
                              ? 'bg-muted/50 opacity-60' 
                              : isToday 
                                ? 'border-primary bg-primary/5' 
                                : 'bg-card'
                          }`}
                        >
                          {/* Date Column */}
                          <div className="flex flex-col items-center justify-center w-12 shrink-0">
                            <span className="text-xs text-muted-foreground uppercase">
                              {format(sessionDate, 'MMM')}
                            </span>
                            <span className="text-xl font-bold leading-none">
                              {format(sessionDate, 'd')}
                            </span>
                          </div>
                          
                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {session.title}
                              </p>
                              {isToday && (
                                <Badge variant="default" className="shrink-0 text-xs">
                                  Today
                                </Badge>
                              )}
                              {isPast && (
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  Past
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {format(sessionDate, 'h:mm a')} • {session.duration_minutes || 90} min
                            </p>
                          </div>
                          
                          {/* Session Actions - Only calendar button, no per-session settings */}
                          {!isPast && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "shrink-0",
                                isSessionSynced(session.id) && "text-green-600 dark:text-green-400",
                                // Add tour class only to the first non-past session
                                index === dbSessions.findIndex(s => !isSessionPast(s.session_date)) && "tour-session-calendar-icon"
                              )}
                              onClick={() => handleAddSingleSession(session)}
                              disabled={addingSessionId === session.id}
                            >
                              {addingSessionId === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : isSessionSynced(session.id) ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <CalendarPlus className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Content Schedule Card - shows drip unlock timeline for modules or audio tracks */}
            {showContentSchedule && (
              <Card className="tour-content-schedule">
                <CardHeader className="tour-content-schedule-header">
                  <CardTitle className="tour-content-schedule-title flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {hasDripTracks ? 'Audiobook Schedule' : 'Content Schedule'}
                    <Badge variant="secondary" className="ml-auto">
                      {hasDripModules 
                        ? `${playlistModules?.length || 0} modules`
                        : `${playlistTracks?.length || 0} chapters`
                      }
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Reminder Settings Button */}
                  <Button
                    variant="outline"
                    className="w-full mb-4 bg-[#F4ECFE] hover:bg-[#E8DEF8] border-[#F4ECFE] tour-content-reminder-btn"
                    onClick={() => setShowContentReminderSheet(true)}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    {contentSettings.enabled ? 'Reminder Settings' : 'Enable Reminders'}
                  </Button>
                  <div className="space-y-3">
                    {/* Render modules if available */}
                    {hasDripModules && playlistModules?.map((module, moduleIndex) => {
                      const unlockDate = getModuleUnlockDate(module.drip_delay_days);
                      const isAvailable = unlockDate ? new Date() >= unlockDate : true;
                      const isToday = unlockDate && isDateToday(unlockDate);
                      
                      return (
                        <div 
                          key={module.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            !isAvailable 
                              ? 'bg-muted/50 opacity-60' 
                              : isToday 
                                ? 'border-primary bg-primary/5' 
                                : 'bg-card'
                          }`}
                        >
                          {/* Date Column (or "Now" for drip_delay_days=0) */}
                          <div className="flex flex-col items-center justify-center w-12 shrink-0">
                            {unlockDate ? (
                              <>
                                <span className="text-xs text-muted-foreground uppercase">
                                  {format(unlockDate, 'MMM')}
                                </span>
                                <span className="text-xl font-bold leading-none">
                                  {format(unlockDate, 'd')}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-primary">Now</span>
                            )}
                          </div>
                          
                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {getModuleIcon(module.type)}
                              <p className="font-medium truncate">{module.title}</p>
                              {isToday && (
                                <Badge variant="default" className="shrink-0 text-xs">Today</Badge>
                              )}
                              {!isAvailable && !isToday && (
                                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {module.type}
                            </p>
                          </div>
                          
                          {/* Remind Me Button - only for locked future content */}
                          {!isAvailable && unlockDate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "shrink-0",
                                hasContentReminder(module.id) && "text-primary",
                                // Add tour class to first locked module
                                moduleIndex === playlistModules?.findIndex(m => {
                                  const ud = getModuleUnlockDate(m.drip_delay_days);
                                  return ud && new Date() < ud;
                                }) && "tour-content-bell-icon"
                              )}
                              onClick={() => handleContentReminder(module, unlockDate)}
                            >
                              {hasContentReminder(module.id) ? (
                                <BellRing className="h-4 w-4" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Render audio tracks as fallback */}
                    {hasDripTracks && playlistTracks?.map((track) => {
                      const unlockDate = getModuleUnlockDate(track.drip_delay_days);
                      const isAvailable = unlockDate ? new Date() >= unlockDate : true;
                      const isToday = unlockDate && isDateToday(unlockDate);
                      const trackTitle = track.audio_content?.title || 'Untitled Track';
                      
                      return (
                        <div 
                          key={track.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            !isAvailable 
                              ? 'bg-muted/50 opacity-60' 
                              : isToday 
                                ? 'border-primary bg-primary/5' 
                                : 'bg-card'
                          }`}
                        >
                          {/* Date Column (or "Now" for drip_delay_days=0) */}
                          <div className="flex flex-col items-center justify-center w-12 shrink-0">
                            {unlockDate ? (
                              <>
                                <span className="text-xs text-muted-foreground uppercase">
                                  {format(unlockDate, 'MMM')}
                                </span>
                                <span className="text-xl font-bold leading-none">
                                  {format(unlockDate, 'd')}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-primary">Now</span>
                            )}
                          </div>
                          
                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Music className="h-4 w-4 text-primary" />
                              <p className="font-medium truncate">{trackTitle}</p>
                              {isToday && (
                                <Badge variant="default" className="shrink-0 text-xs">Today</Badge>
                              )}
                              {!isAvailable && !isToday && (
                                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Audio
                            </p>
                          </div>
                          
                          {/* Remind Me Button - only for locked future content */}
                          {!isAvailable && unlockDate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "shrink-0",
                                hasContentReminder(track.id) && "text-primary"
                              )}
                              onClick={() => handleContentReminder(track, unlockDate)}
                            >
                              {hasContentReminder(track.id) ? (
                                <BellRing className="h-4 w-4" />
                              ) : (
                                <Bell className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => navigate(`/app/player/playlist/${round?.audio_playlist_id}`)}
                  >
                    <Music className="h-5 w-5 mr-2" />
                    {hasDripTracks ? 'Open Audiobook' : 'Open Course Modules'}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="tour-program-info">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Program Information</CardTitle>
                  <Badge>{enrollment.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {program?.description && (
                  <div 
                    className="text-muted-foreground whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(program.description) }}
                  />
                )}
                {round && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{format(new Date(round.start_date), 'MMM d, yyyy')}</p>
                    </div>
                    {round.end_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-semibold">{format(new Date(round.end_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Complete Program Button - Only for self-paced (no round) */}
            {!round && enrollment?.status === 'active' && (
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant="outline"
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('course_enrollments')
                          .update({ status: 'completed' })
                          .eq('id', enrollment.id);
                        
                        if (error) throw error;
                        
                        queryClient.invalidateQueries({ queryKey: ['course-enrollment', slug] });
                        queryClient.invalidateQueries({ queryKey: ['courses-data'] });
                        toast.success('Program marked as completed!');
                      } catch (err) {
                        toast.error('Failed to mark as completed');
                      }
                    }}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Mark as Completed
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
        </div>
        </div>
      </div>
    </div>

      {/* Enrollment Reminder Popup */}
      <AlertDialog open={showEnrollmentReminder} onOpenChange={setShowEnrollmentReminder}>
        <AlertDialogContent className="max-w-[90%] sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Never Miss Your Classes!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              You just enrolled! Enable notifications so you never miss class reminders
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={async () => {
                if (!user?.id) return;
                setIsEnablingEnrollment(true);
                try {
                  const result = await subscribeToPushNotifications(user.id);
                  if (result.success) {
                    toast.success('Push notifications enabled!');
                    localStorage.setItem('hasSeenEnrollmentPrompt', 'true');
                    setShowEnrollmentReminder(false);
                  } else {
                    toast.error(result.error || 'Failed to enable notifications');
                  }
                } catch (error) {
                  console.error('Error:', error);
                  toast.error('An error occurred');
                } finally {
                  setIsEnablingEnrollment(false);
                }
              }}
              disabled={isEnablingEnrollment}
              className="w-full"
              size="lg"
            >
              {isEnablingEnrollment ? 'Enabling...' : 'Enable Now'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.setItem('hasSeenEnrollmentPrompt', 'true');
                setShowEnrollmentReminder(false);
              }}
              disabled={isEnablingEnrollment}
              className="w-full"
            >
              Not Now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calendar Permission Prompt */}
      <CalendarPermissionPrompt 
        open={showCalendarPrompt}
        onClose={() => setShowCalendarPrompt(false)}
        onPermissionGranted={() => {
          // Auto-sync sessions after permission granted
          handleSyncAllSessions();
        }}
      />

      {/* Push Notification Prompt for Course */}
      {user && program && (
        <CourseNotificationPrompt
          userId={user.id}
          programTitle={program.title}
          open={showCourseNotificationPrompt}
          onClose={() => setShowCourseNotificationPrompt(false)}
        />
      )}

      {/* Session Reminder Settings Sheet - Controls program event task reminders */}
      <SessionReminderSheet
        open={showSessionReminderSheet}
        onOpenChange={setShowSessionReminderSheet}
        title="Session Reminders"
        description="Control notifications for session tasks in your planner"
        currentSettings={sessionSettings}
        onSave={handleSaveSessionSettings}
      />

      {/* Content Reminder Settings Sheet - Controls content unlock task reminders */}
      <SessionReminderSheet
        open={showContentReminderSheet}
        onOpenChange={setShowContentReminderSheet}
        title="Content Reminders"
        description="Control notifications for content unlock tasks in your planner"
        currentSettings={contentSettings}
        onSave={handleSaveContentSettings}
      />

      {/* Round Tour */}
      {enrollment && round && (
        <RoundTour isFirstVisit={true} onTourReady={handleTourReady} />
      )}
    </>
  );
};

export default AppCourseDetail;
