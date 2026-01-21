import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useCallback } from 'react';

// Cache time constants
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

// ============ ENROLLMENTS - SINGLE SOURCE OF TRUTH ============
export function useEnrollments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', user!.id)
        .in('status', ['active', 'completed']);
      
      if (error) throw error;
      return (data || []).map(e => e.program_slug).filter(Boolean) as string[];
    },
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============ INVALIDATE ALL ENROLLMENT-RELATED CACHES ============
export function useInvalidateAllEnrollmentData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useCallback(() => {
    if (user?.id) {
      // Invalidate all enrollment-related caches atomically
      queryClient.invalidateQueries({ queryKey: ['enrollments', user.id] });
      queryClient.invalidateQueries({ queryKey: ['player-data', user.id] });
      queryClient.invalidateQueries({ queryKey: ['home-data', user.id] });
      queryClient.invalidateQueries({ queryKey: ['courses-data', user.id] });
      // Legacy key used by some components
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
    }
  }, [queryClient, user?.id]);
}

// Types
interface HomeData {
  profile: any | null;
  enrollments: any[];
  wallet: { credits_balance: number } | null;
  hasActiveRounds: boolean;
  listeningMinutes: number;
  completedTracks: number;
  unreadPosts: number;
  journalStreak: number;
}

interface CoursesData {
  enrollments: any[];
  nextSessionMap: Map<string, string>;
}

interface PlayerData {
  playlists: any[];
  playlistItems: any[];
  progressData: any[];
  enrollments: string[];
  programs: any[];
}

// ============ HOME PAGE DATA ============
async function fetchHomeData(userId: string): Promise<HomeData> {
  // Parallel fetch all home page data
  const [
    profileRes, 
    enrollmentsRes, 
    walletRes, 
    activeRoundsRes,
    audioProgressRes,
    allPostsRes,
    readPostsRes,
    journalEntriesRes
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('user_wallets')
      .select('credits_balance')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('round_id', 'is', null)
      .limit(1),
    // Audio progress for listening time and completed tracks
    supabase
      .from('audio_progress')
      .select('current_position_seconds, completed')
      .eq('user_id', userId),
    // All feed posts for unread count
    supabase
      .from('feed_posts')
      .select('id'),
    // User's read posts
    supabase
      .from('feed_post_reads')
      .select('post_id')
      .eq('user_id', userId),
    // Journal entries for streak calculation (last 30 days)
    supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // Calculate listening stats
  const audioProgress = audioProgressRes.data || [];
  const listeningSeconds = audioProgress.reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);
  const completedTracks = audioProgress.filter(p => p.completed).length;

  // Calculate unread posts
  const readPostIds = new Set((readPostsRes.data || []).map(r => r.post_id));
  const unreadPosts = (allPostsRes.data || []).filter(p => !readPostIds.has(p.id)).length;

  // Calculate journal streak
  let journalStreak = 0;
  const entries = journalEntriesRes.data || [];
  if (entries.length > 0) {
    // Get unique dates with entries
    const entryDates = new Set(
      entries.map(e => new Date(e.created_at).toDateString())
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    
    // Allow streak to continue if wrote today OR yesterday
    if (!entryDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count consecutive days
    while (entryDates.has(checkDate.toDateString())) {
      journalStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    profile: profileRes.data,
    enrollments: enrollmentsRes.data || [],
    wallet: walletRes.data,
    hasActiveRounds: (activeRoundsRes.data?.length || 0) > 0,
    listeningMinutes: Math.floor(listeningSeconds / 60),
    completedTracks,
    unreadPosts,
    journalStreak,
  };
}

export function useHomeData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['home-data', user?.id],
    queryFn: () => fetchHomeData(user!.id),
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Prefetch courses data when home loads
  useEffect(() => {
    if (user?.id && query.data) {
      queryClient.prefetchQuery({
        queryKey: ['courses-data', user.id],
        queryFn: () => fetchCoursesData(user.id),
        staleTime: STALE_TIME,
      });
    }
  }, [user?.id, query.data, queryClient]);

  return {
    ...query,
    profile: query.data?.profile || null,
    enrollments: query.data?.enrollments || [],
    wallet: query.data?.wallet || null,
    hasActiveRounds: query.data?.hasActiveRounds || false,
    listeningMinutes: query.data?.listeningMinutes || 0,
    completedTracks: query.data?.completedTracks || 0,
    unreadPosts: query.data?.unreadPosts || 0,
    journalStreak: query.data?.journalStreak || 0,
  };
}

// ============ COURSES PAGE DATA ============
interface NextContentInfo {
  title: string;
  type: 'module' | 'track';
  countdownText: string | null;
}

interface CoursesDataExtended {
  enrollments: any[];
  nextSessionMap: Map<string, string>;
  nextContentMap: Map<string, NextContentInfo>;
}

async function fetchCoursesData(userId: string): Promise<CoursesDataExtended> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      program_rounds (
        id,
        round_name,
        round_number,
        start_date,
        end_date,
        first_session_date,
        status,
        video_url,
        important_message,
        audio_playlist_id,
        drip_offset_days
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;

  // Dedupe enrollments (prevents duplicate cards if the DB contains duplicates)
  // Keep the most recent enrollment per (program_slug + round_id) since we order by enrolled_at DESC.
  const rawEnrollments = data || [];
  const enrollments: any[] = [];
  const seenKeys = new Set<string>();
  for (const e of rawEnrollments) {
    const key = `${e.program_slug || e.course_name || 'unknown'}::${e.round_id || 'self'}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    enrollments.push(e);
  }
  
  // Get all round IDs and playlist IDs
  const roundIds = enrollments
    .map(e => e.program_rounds?.id)
    .filter((id): id is string => Boolean(id));
  
  const playlistIds = enrollments
    .map(e => e.program_rounds?.audio_playlist_id)
    .filter((id): id is string => Boolean(id));
  
  // Fetch next upcoming session for each round
  let nextSessionMap = new Map<string, string>();
  if (roundIds.length > 0) {
    const { data: sessions } = await supabase
      .from('program_sessions')
      .select('round_id, session_date')
      .in('round_id', roundIds)
      .gt('session_date', new Date().toISOString())
      .order('session_date', { ascending: true });
    
    // Build map with first (soonest) session per round
    if (sessions) {
      for (const session of sessions) {
        if (!nextSessionMap.has(session.round_id)) {
          nextSessionMap.set(session.round_id, session.session_date);
        }
      }
    }
  }
  
  // Fetch next content (modules/tracks) for each playlist
  let nextContentMap = new Map<string, NextContentInfo>();
  if (playlistIds.length > 0) {
    // Fetch modules (playlist_supplements)
    const { data: modules } = await supabase
      .from('playlist_supplements')
      .select('playlist_id, title, drip_delay_days')
      .in('playlist_id', playlistIds)
      .order('drip_delay_days', { ascending: true });
    
    // Fetch tracks (audio_playlist_items)
    const { data: tracks } = await supabase
      .from('audio_playlist_items')
      .select('playlist_id, drip_delay_days, audio_content(title)')
      .in('playlist_id', playlistIds)
      .order('drip_delay_days', { ascending: true });
    
    const now = new Date();
    
    // For each enrollment, find the next upcoming content
    for (const enrollment of enrollments) {
      const round = enrollment.program_rounds;
      if (!round?.audio_playlist_id || !round?.first_session_date) continue;
      
      const playlistId = round.audio_playlist_id;
      const firstSession = round.first_session_date.includes('T') 
        ? new Date(round.first_session_date)
        : new Date(round.first_session_date + 'T00:00:00');
      const dripOffset = round.drip_offset_days || 0;
      
      // Check modules first
      const playlistModules = (modules || []).filter(m => m.playlist_id === playlistId);
      for (const mod of playlistModules) {
        if (mod.drip_delay_days === 0) continue; // Skip immediate content
        
        const availableDate = new Date(firstSession);
        availableDate.setDate(availableDate.getDate() + (mod.drip_delay_days - 1) + dripOffset);
        
        if (now < availableDate) {
          // Calculate countdown
          const diffMs = availableDate.getTime() - now.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          let countdownText = '';
          if (diffDays > 0) {
            countdownText = `in ${diffDays}d`;
          } else if (diffHours > 0) {
            countdownText = `in ${diffHours}h`;
          } else {
            countdownText = 'soon';
          }
          
          nextContentMap.set(round.id, {
            title: mod.title,
            type: 'module',
            countdownText,
          });
          break;
        }
      }
      
      // If no module found, check tracks
      if (!nextContentMap.has(round.id)) {
        const playlistTracks = (tracks || []).filter(t => t.playlist_id === playlistId);
        for (const track of playlistTracks) {
          if (track.drip_delay_days === 0) continue;
          
          const availableDate = new Date(firstSession);
          availableDate.setDate(availableDate.getDate() + (track.drip_delay_days - 1) + dripOffset);
          
          if (now < availableDate) {
            const diffMs = availableDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            let countdownText = '';
            if (diffDays > 0) {
              countdownText = `in ${diffDays}d`;
            } else if (diffHours > 0) {
              countdownText = `in ${diffHours}h`;
            } else {
              countdownText = 'soon';
            }
            
            nextContentMap.set(round.id, {
              title: (track.audio_content as any)?.title || 'New Track',
              type: 'track',
              countdownText,
            });
            break;
          }
        }
      }
    }
  }
  
  return { enrollments, nextSessionMap, nextContentMap };
}

export function useCoursesData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['courses-data', user?.id],
    queryFn: () => fetchCoursesData(user!.id),
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  // Prefetch first course detail when courses load
  useEffect(() => {
    if (user?.id && query.data?.enrollments?.[0]?.program_slug) {
      const firstSlug = query.data.enrollments[0].program_slug;
      queryClient.prefetchQuery({
        queryKey: ['course-detail', firstSlug, user.id],
        staleTime: STALE_TIME,
      });
    }
  }, [user?.id, query.data, queryClient]);

  return {
    ...query,
    enrollments: query.data?.enrollments || [],
    nextSessionMap: query.data?.nextSessionMap || new Map<string, string>(),
    nextContentMap: query.data?.nextContentMap || new Map<string, { title: string; type: 'module' | 'track'; countdownText: string | null }>(),
  };
}

// ============ PLAYER PAGE DATA ============
async function fetchPlayerData(userId: string): Promise<PlayerData> {
  // Parallel fetch all player data
  const [playlistsRes, playlistItemsRes, progressRes, enrollmentsRes, programsRes] = await Promise.all([
    supabase
      .from('audio_playlists')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('audio_playlist_items')
      .select(`
        playlist_id,
        audio_id,
        audio_content (
          id,
          duration_seconds,
          cover_image_url
        )
      `)
      .order('sort_order', { ascending: true }),
    supabase
      .from('audio_progress')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('course_enrollments')
      .select('program_slug')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('program_catalog')
      .select('slug, available_on_mobile'),
  ]);

  return {
    playlists: playlistsRes.data || [],
    playlistItems: playlistItemsRes.data || [],
    progressData: progressRes.data || [],
    enrollments: (enrollmentsRes.data || []).map(e => e.program_slug),
    programs: programsRes.data || [],
  };
}

export function usePlayerData() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['player-data', user?.id],
    queryFn: () => fetchPlayerData(user!.id),
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    ...query,
    playlists: query.data?.playlists || [],
    playlistItems: query.data?.playlistItems || [],
    progressData: query.data?.progressData || [],
    enrollments: query.data?.enrollments || [],
    programs: query.data?.programs || [],
  };
}

// ============ INVALIDATION HELPERS ============
export function useInvalidateHomeData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useCallback(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['home-data', user.id] });
    }
  }, [queryClient, user?.id]);
}

export function useInvalidateCoursesData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useCallback(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['courses-data', user.id] });
    }
  }, [queryClient, user?.id]);
}

export function useInvalidatePlayerData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useCallback(() => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['player-data', user.id] });
    }
  }, [queryClient, user?.id]);
}
