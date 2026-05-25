import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isSameDay, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export interface ProgramEvent {
  id: string;
  type: 'session' | 'module' | 'track' | 'enrollment' | 'round_update' | 'playlist_save' | 'playlist_update';
  title: string;
  programSlug?: string;
  programTitle?: string;
  roundId?: string; // For navigating to reminder settings
  time?: string; // For sessions OR module release time
  isCompleted: boolean;
  
  // Type-specific data
  meetingLink?: string;
  moduleId?: string;
  trackId?: string;
  playlistId?: string;
  sessionNumber?: number;
  // Playlist-event-specific
  audioId?: string;
  audioTitle?: string;
  coverImageUrl?: string;
  // Aggregated playlist_update specific
  audioIds?: string[];
  audioCount?: number;
}

interface PlannerProgramCompletion {
  id: string;
  user_id: string;
  event_type: 'session' | 'module' | 'track' | 'enrollment';
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
  
  // Handle both ISO format (contains T) and PostgreSQL format (space-separated)
  // e.g. "2026-01-11T16:00:00+00:00" or "2026-01-11 16:00:00+00"
  let firstSession: Date;
  if (firstSessionDate.includes('T') || firstSessionDate.includes('+') || firstSessionDate.includes('Z')) {
    // Already has timezone or ISO marker — parse directly
    firstSession = new Date(firstSessionDate);
  } else {
    // Date-only string like "2026-01-11" — add time component
    firstSession = new Date(firstSessionDate + 'T00:00:00');
  }

  // Guard against invalid dates
  if (isNaN(firstSession.getTime())) return { unlockDate: null, unlockTime: null };
  
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
 * Uses a single RPC call instead of multiple sequential queries
 */
export function useProgramEventsForDate(date: Date) {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planner-program-events', dateStr, user?.id],
    queryFn: async (): Promise<ProgramEvent[]> => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_program_events_for_date', {
        p_user_id: user.id,
        p_date_str: dateStr,
      }) as { data: any; error: any };

      if (error) {
        console.error('Error fetching program events:', error);
        return [];
      }

      if (!data) return [];

      const events: ProgramEvent[] = [];

      // Process sessions — apply client-side local date filtering
      // The RPC filters by UTC day boundaries which can mismatch the user's local date
      for (const s of (data.sessions || [])) {
        const sessionDate = new Date(s.sessionDate);
        if (!isSameDay(sessionDate, date)) continue;
        events.push({
          id: s.id,
          type: 'session',
          title: s.title,
          programSlug: s.programSlug,
          programTitle: s.programTitle,
          roundId: s.roundId,
          time: format(sessionDate, 'h:mm a'),
          isCompleted: s.isCompleted,
          meetingLink: s.meetingLink,
          sessionNumber: s.sessionNumber,
        });
      }

      // Process modules — client-side drip date filtering
      for (const m of (data.modules || [])) {
        const { unlockDate, unlockTime } = getUnlockDateTime(
          m.dripDelayDays,
          m.dripAnchorDate,
          m.dripOffsetDays || 0
        );
        if (unlockDate && isSameDay(unlockDate, date)) {
          events.push({
            id: m.id,
            type: 'module',
            title: m.title,
            programSlug: m.programSlug,
            programTitle: m.programTitle,
            roundId: m.roundId,
            time: unlockTime || undefined,
            isCompleted: m.isCompleted,
            moduleId: m.moduleId,
            playlistId: m.playlistId,
          });
        }
      }

      // Process tracks — client-side drip date filtering
      for (const t of (data.tracks || [])) {
        const { unlockDate, unlockTime } = getUnlockDateTime(
          t.dripDelayDays,
          t.dripAnchorDate,
          t.dripOffsetDays || 0
        );
        if (unlockDate && isSameDay(unlockDate, date)) {
          events.push({
            id: t.id,
            type: 'track',
            title: t.title,
            programSlug: t.programSlug,
            programTitle: t.programTitle,
            roundId: t.roundId,
            time: unlockTime || undefined,
            isCompleted: t.isCompleted,
            trackId: t.trackId,
            playlistId: t.playlistId,
          });
        }
      }

      // Process enrollments
      for (const e of (data.enrollments || [])) {
        events.push({
          id: e.id,
          type: 'enrollment',
          title: e.programTitle,
          programSlug: e.programSlug,
          programTitle: e.programTitle,
          roundId: e.roundId,
          isCompleted: e.isCompleted || false,
        });
      }

      // Process round update notifications
      for (const u of (data.round_updates || [])) {
        events.push({
          id: u.id,
          type: 'round_update',
          title: u.programTitle,
          programSlug: u.programSlug,
          programTitle: u.programTitle,
          roundId: u.roundId,
          isCompleted: false,
        });
      }

      // Process playlist save events (one-time card on day user activated playlist)
      for (const ps of (data.playlist_saves || [])) {
        events.push({
          id: ps.id,
          type: 'playlist_save',
          title: ps.title,
          isCompleted: ps.isCompleted || false,
          playlistId: ps.playlistId,
          coverImageUrl: ps.coverImageUrl,
        });
      }

      // Process playlist update events (new audio added to a playlist user has access to)
      for (const pu of (data.playlist_updates || [])) {
        const count: number = pu.audioCount ?? 1;
        const playlistName: string = pu.title || 'Playlist';
        const displayTitle = count > 1
          ? `${count} new audios in ${playlistName}`
          : (pu.firstAudioTitle || playlistName);
        events.push({
          id: pu.id,
          type: 'playlist_update',
          title: displayTitle,
          isCompleted: false,
          playlistId: pu.playlistId,
          audioIds: Array.isArray(pu.audioIds) ? pu.audioIds : [],
          audioCount: count,
          audioTitle: pu.firstAudioTitle,
          coverImageUrl: pu.coverImageUrl,
        });
      }

      // Sort: enrollments first, then sessions, then by time
      const typePriority: Record<string, number> = {
        enrollment: 0,
        round_update: 0.5,
        playlist_save: 0.6,
        playlist_update: 0.7,
        session: 1,
        module: 2,
        track: 3,
      };
      events.sort((a, b) => {
        const pa = typePriority[a.type] ?? 9;
        const pb = typePriority[b.type] ?? 9;
        if (pa !== pb) return pa - pb;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });

      return events;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
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
      eventType: 'session' | 'module' | 'track' | 'enrollment' | 'playlist_save'; 
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
      eventType: 'session' | 'module' | 'track' | 'enrollment' | 'playlist_save'; 
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
          enrolled_at,
          program_rounds (
            id,
            first_session_date,
            drip_offset_days,
            audio_playlist_id,
            is_self_paced
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
        // Add enrollment date itself as an event date
        if (enrollment.enrolled_at) {
          const enrolledDate = new Date(enrollment.enrolled_at);
          if (isWithinInterval(enrolledDate, { start: rangeStart, end: rangeEnd })) {
            eventDates.add(format(enrolledDate, 'yyyy-MM-dd'));
          }
        }

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
        const dripAnchorDate = round.is_self_paced ? enrollment.enrolled_at : round.first_session_date;
        if (round.audio_playlist_id && dripAnchorDate) {
          // Get modules
          const { data: modules } = await supabase
            .from('playlist_supplements')
            .select('drip_delay_days')
            .eq('playlist_id', round.audio_playlist_id);

          for (const module of modules || []) {
            const { unlockDate } = getUnlockDateTime(
              module.drip_delay_days,
              dripAnchorDate,
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
              dripAnchorDate,
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
