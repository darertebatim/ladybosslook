import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay, parseISO, addDays } from 'date-fns';

export interface ProgramEvent {
  id: string;
  type: 'session' | 'module' | 'track';
  title: string;
  programSlug: string;
  programTitle: string;
  time?: string; // For sessions OR module release time
  isCompleted: boolean;
  
  // Type-specific data
  meetingLink?: string;
  moduleId?: string;
  trackId?: string;
  playlistId?: string;
  sessionNumber?: number;
}

interface PlannerProgramCompletion {
  id: string;
  user_id: string;
  event_type: 'session' | 'module' | 'track';
  event_id: string;
  completed_date: string;
}

/**
 * Get the unlock date for drip content
 * drip_delay_days = 0: immediately available
 * drip_delay_days >= 1: firstSession + (drip_delay_days - 1) + offset
 * Returns both the date and the time from firstSessionDate
 */
function getUnlockDateTime(
  dripDelayDays: number,
  firstSessionDate: string | null | undefined,
  dripOffsetDays: number = 0
): { unlockDate: Date | null; unlockTime: string | null } {
  if (dripDelayDays === 0) return { unlockDate: null, unlockTime: null };
  if (!firstSessionDate) return { unlockDate: null, unlockTime: null };
  
  const firstSession = firstSessionDate.includes('T')
    ? new Date(firstSessionDate)
    : new Date(firstSessionDate + 'T00:00:00');
  
  const unlockDate = new Date(firstSession);
  unlockDate.setDate(unlockDate.getDate() + (dripDelayDays - 1) + dripOffsetDays);
  
  // Extract the time from the first session date
  const hours = firstSession.getHours();
  const minutes = firstSession.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const unlockTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  return { unlockDate, unlockTime };
}

/**
 * Hook to fetch program events (sessions + content unlocks) for a specific date
 */
export function useProgramEventsForDate(date: Date) {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Compute local day boundaries in ISO format for timezone-safe session queries
  // This ensures a session stored as "2026-01-22 01:30:00+00" (UTC) appears on Jan 21 (local)
  const startOfDayLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const endOfDayLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  const startIso = startOfDayLocal.toISOString();
  const endIso = endOfDayLocal.toISOString();
  return useQuery({
    queryKey: ['planner-program-events', dateStr, user?.id],
    queryFn: async (): Promise<ProgramEvent[]> => {
      if (!user) return [];

      const events: ProgramEvent[] = [];

      // 1. Get user's active enrollments with round data
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
            first_session_date,
            drip_offset_days,
            audio_playlist_id,
            google_meet_link
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (enrollError || !enrollments) {
        console.error('Error fetching enrollments:', enrollError);
        return [];
      }

      // Get completions for this date
      const { data: completions } = await supabase
        .from('planner_program_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed_date', dateStr);

      const completionSet = new Set(
        (completions || []).map((c) => `${c.event_type}:${c.event_id}`)
      );

      // Get program catalog for titles
      const { data: programs } = await supabase
        .from('program_catalog')
        .select('slug, title');
      
      const programTitleMap = new Map(
        (programs || []).map(p => [p.slug, p.title])
      );

      // Process each enrollment
      for (const enrollment of enrollments) {
        const round = enrollment.program_rounds as any;
        if (!round) continue;

        const programTitle = programTitleMap.get(enrollment.program_slug || '') || enrollment.course_name;
        const programSlug = enrollment.program_slug || '';

        // 2. Get live sessions for this round on the selected date (timezone-safe)
        const { data: sessions } = await supabase
          .from('program_sessions')
          .select('*')
          .eq('round_id', round.id)
          .gte('session_date', startIso)
          .lt('session_date', endIso);

        for (const session of sessions || []) {
          const sessionDate = new Date(session.session_date);
          events.push({
            id: session.id,
            type: 'session',
            title: session.title,
            programSlug,
            programTitle,
            time: format(sessionDate, 'h:mm a'),
            isCompleted: completionSet.has(`session:${session.id}`),
            meetingLink: session.meeting_link || round.google_meet_link,
            sessionNumber: session.session_number,
          });
        }

        // 3. Get content unlocks for this date (modules/supplements)
        if (round.audio_playlist_id) {
          // Get modules (supplements)
          const { data: modules } = await supabase
            .from('playlist_supplements')
            .select('*')
            .eq('playlist_id', round.audio_playlist_id);

          for (const module of modules || []) {
            const { unlockDate, unlockTime } = getUnlockDateTime(
              module.drip_delay_days,
              round.first_session_date,
              round.drip_offset_days || 0
            );
            
            if (unlockDate && isSameDay(unlockDate, date)) {
              events.push({
                id: module.id,
                type: 'module',
                title: module.title,
                programSlug,
                programTitle,
                time: unlockTime || undefined,
                isCompleted: completionSet.has(`module:${module.id}`),
                moduleId: module.id,
                playlistId: round.audio_playlist_id,
              });
            }
          }

          // Get audio tracks
          const { data: playlistItems } = await supabase
            .from('audio_playlist_items')
            .select(`
              id,
              drip_delay_days,
              audio_content (
                id,
                title
              )
            `)
            .eq('playlist_id', round.audio_playlist_id);

          for (const item of playlistItems || []) {
            const { unlockDate, unlockTime } = getUnlockDateTime(
              item.drip_delay_days,
              round.first_session_date,
              round.drip_offset_days || 0
            );
            
            const audio = item.audio_content as any;
            if (unlockDate && isSameDay(unlockDate, date) && audio) {
              events.push({
                id: audio.id,
                type: 'track',
                title: audio.title,
                programSlug,
                programTitle,
                time: unlockTime || undefined,
                isCompleted: completionSet.has(`track:${audio.id}`),
                trackId: audio.id,
                playlistId: round.audio_playlist_id,
              });
            }
          }
        }
      }

      // Sort: sessions with time first, then by time, then modules/tracks
      events.sort((a, b) => {
        if (a.type === 'session' && b.type !== 'session') return -1;
        if (a.type !== 'session' && b.type === 'session') return 1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });

      return events;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to complete a program event
 */
export function useCompleteProgramEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventType, 
      eventId, 
      date 
    }: { 
      eventType: 'session' | 'module' | 'track'; 
      eventId: string; 
      date: Date;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('planner_program_completions')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_id: eventId,
          completed_date: format(date, 'yyyy-MM-dd'),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-program-events'] });
    },
  });
}

/**
 * Hook to uncomplete a program event
 */
export function useUncompleteProgramEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      eventType, 
      eventId, 
      date 
    }: { 
      eventType: 'session' | 'module' | 'track'; 
      eventId: string; 
      date: Date;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('planner_program_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('event_type', eventType)
        .eq('event_id', eventId)
        .eq('completed_date', format(date, 'yyyy-MM-dd'));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-program-events'] });
    },
  });
}

/**
 * Hook to fetch dates that have program events within a given date range
 * Returns a Set of date strings (yyyy-MM-dd format)
 */
export function useProgramEventDates(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planner-program-event-dates', user?.id, startStr, endStr],
    queryFn: async (): Promise<Set<string>> => {
      if (!user) return new Set();

      const eventDates = new Set<string>();

      // Get user's active enrollments with round data
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
        console.error('Error fetching enrollments for event dates:', enrollError);
        return eventDates;
      }

      // Convert date range to ISO for session queries
      const rangeStart = startOfDay(startDate);
      const rangeEnd = endOfDay(endDate);
      const startIso = rangeStart.toISOString();
      const endIso = rangeEnd.toISOString();

      for (const enrollment of enrollments) {
        const round = enrollment.program_rounds as any;
        if (!round) continue;

        // Get sessions in range
        const { data: sessions } = await supabase
          .from('program_sessions')
          .select('session_date')
          .eq('round_id', round.id)
          .gte('session_date', startIso)
          .lte('session_date', endIso);

        for (const session of sessions || []) {
          const sessionDate = new Date(session.session_date);
          eventDates.add(format(sessionDate, 'yyyy-MM-dd'));
        }

        // Get content unlocks (modules and tracks) in range
        if (round.audio_playlist_id && round.first_session_date) {
          // Get modules
          const { data: modules } = await supabase
            .from('playlist_supplements')
            .select('drip_delay_days')
            .eq('playlist_id', round.audio_playlist_id);

          for (const module of modules || []) {
            const { unlockDate } = getUnlockDateTime(
              module.drip_delay_days,
              round.first_session_date,
              round.drip_offset_days || 0
            );
            
            if (unlockDate && isWithinInterval(unlockDate, { start: rangeStart, end: rangeEnd })) {
              eventDates.add(format(unlockDate, 'yyyy-MM-dd'));
            }
          }

          // Get tracks
          const { data: playlistItems } = await supabase
            .from('audio_playlist_items')
            .select('drip_delay_days')
            .eq('playlist_id', round.audio_playlist_id);

          for (const item of playlistItems || []) {
            const { unlockDate } = getUnlockDateTime(
              item.drip_delay_days,
              round.first_session_date,
              round.drip_offset_days || 0
            );
            
            if (unlockDate && isWithinInterval(unlockDate, { start: rangeStart, end: rangeEnd })) {
              eventDates.add(format(unlockDate, 'yyyy-MM-dd'));
            }
          }
        }
      }

      return eventDates;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
