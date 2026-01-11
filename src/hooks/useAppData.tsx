import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

// Cache time constants
const STALE_TIME = 2 * 60 * 1000; // 2 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

// Types
interface HomeData {
  profile: any | null;
  enrollments: any[];
  wallet: { credits_balance: number } | null;
  hasActiveRounds: boolean;
  listeningMinutes: number;
  completedTracks: number;
  unreadPosts: number;
  nextSession: Date | null;
}

interface CoursesData {
  enrollments: any[];
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
    nextSessionRes
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
    // Next upcoming session for user's enrolled rounds
    supabase
      .from('program_sessions')
      .select('session_date, round_id')
      .gte('session_date', new Date().toISOString())
      .order('session_date', { ascending: true })
      .limit(20),
  ]);

  // Calculate listening stats
  const audioProgress = audioProgressRes.data || [];
  const listeningSeconds = audioProgress.reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);
  const completedTracks = audioProgress.filter(p => p.completed).length;

  // Calculate unread posts
  const readPostIds = new Set((readPostsRes.data || []).map(r => r.post_id));
  const unreadPosts = (allPostsRes.data || []).filter(p => !readPostIds.has(p.id)).length;

  // Get user's round IDs from enrollments
  const userRoundIds = (enrollmentsRes.data || [])
    .filter(e => e.round_id)
    .map(e => e.round_id);

  // Find next session for user's rounds
  const nextSessionData = (nextSessionRes.data || [])
    .find(s => userRoundIds.includes(s.round_id));

  return {
    profile: profileRes.data,
    enrollments: enrollmentsRes.data || [],
    wallet: walletRes.data,
    hasActiveRounds: (activeRoundsRes.data?.length || 0) > 0,
    listeningMinutes: Math.floor(listeningSeconds / 60),
    completedTracks,
    unreadPosts,
    nextSession: nextSessionData ? new Date(nextSessionData.session_date) : null,
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
    nextSession: query.data?.nextSession || null,
  };
}

// ============ COURSES PAGE DATA ============
async function fetchCoursesData(userId: string): Promise<CoursesData> {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      program_rounds (
        round_name,
        round_number,
        start_date,
        status
      )
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return { enrollments: data || [] };
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
  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['home-data', user.id] });
    }
  };
}

export function useInvalidateCoursesData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['courses-data', user.id] });
    }
  };
}

export function useInvalidatePlayerData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['player-data', user.id] });
    }
  };
}
