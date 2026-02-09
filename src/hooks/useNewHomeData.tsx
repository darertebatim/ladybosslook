import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

const STALE_TIME = 2 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

interface NewHomeData {
  profile: any | null;
  listeningMinutes: number;
  completedTracks: number;
  unreadPosts: number;
  daysThisMonth: number; // Renamed from journalStreak - strength-first
  todayTasksCount: number;
  todayCompletedCount: number;
  activeRounds: any[];
  completedRounds: any[];
  nextSessionMap: Map<string, string>;
  suggestedRoutine: any | null;
  periodSettings: any | null;
  isNewUser: boolean; // First 24 hours or no tasks ever added
  totalCompletions: number; // Total completions ever
}

async function fetchNewHomeData(userId: string): Promise<NewHomeData> {
  const today = new Date();
  const dateStr = getLocalDateStr(today);
  const dayOfWeek = today.getDay();

  const [
    profileRes,
    audioProgressRes,
    allPostsRes,
    readPostsRes,
    journalEntriesRes,
    tasksRes,
    completionsRes,
    totalCompletionsRes,
    enrollmentsRes,
    routineRes,
    periodSettingsRes,
    addedBankRoutinesRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase
      .from('audio_progress')
      .select('current_position_seconds, completed')
      .eq('user_id', userId),
    supabase
      .from('feed_posts')
      .select('id'),
    supabase
      .from('feed_post_reads')
      .select('post_id')
      .eq('user_id', userId),
    supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100),
    // All active tasks
    supabase
      .from('user_tasks')
      .select('id, repeat_pattern, scheduled_date, repeat_days')
      .eq('user_id', userId)
      .eq('is_active', true),
    // Today's completions
    supabase
      .from('task_completions')
      .select('task_id')
      .eq('user_id', userId)
      .eq('completed_date', dateStr),
    // Total completions ever (for first-action detection)
    supabase
      .from('task_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    // Active enrollments with rounds
    supabase
      .from('course_enrollments')
      .select(`
        *,
        program_rounds (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .not('program_rounds', 'is', null)
      .order('enrolled_at', { ascending: false }),
    // Random Pro Routine - get from routines_bank
    supabase
      .from('routines_bank')
      .select('*')
      .eq('is_active', true)
      .eq('is_popular', true)
      .limit(10),
    // Period settings
    supabase
      .from('period_settings')
      .select('*')
      .eq('user_id', userId)
      .single(),
    // User's added bank routines (to filter out already-added ones)
    supabase
      .from('user_routines_bank')
      .select('routine_id')
      .eq('user_id', userId)
      .eq('is_active', true),
  ]);

  // Calculate listening stats
  const audioProgress = audioProgressRes.data || [];
  const listeningSeconds = audioProgress.reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);
  const completedTracks = audioProgress.filter(p => p.completed).length;

  // Calculate unread posts
  const readPostIds = new Set((readPostsRes.data || []).map(r => r.post_id));
  const unreadPosts = (allPostsRes.data || []).filter(p => !readPostIds.has(p.id)).length;

  // Calculate monthly presence (replaces streak - strength-first philosophy)
  let daysThisMonth = 0;
  const entries = journalEntriesRes.data || [];
  if (entries.length > 0) {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const uniqueDays = new Set<string>();
    
    entries.forEach(e => {
      const entryDate = new Date(e.created_at);
      if (entryDate >= monthStart) {
        uniqueDays.add(entryDate.toDateString());
      }
    });
    
    daysThisMonth = uniqueDays.size;
  }

  // Filter tasks for today
  const allTasks = tasksRes.data || [];
  const todayTasks = allTasks.filter(task => taskAppliesToDate(task, dateStr));

  const completedTaskIds = new Set((completionsRes.data || []).map(c => c.task_id));
  const todayCompletedCount = todayTasks.filter(t => completedTaskIds.has(t.id)).length;

  // Process enrollments
  const enrollments = enrollmentsRes.data || [];
  const activeRounds = enrollments.filter(e => e.program_rounds?.status !== 'completed');
  const completedRounds = enrollments.filter(e => e.program_rounds?.status === 'completed');

  // Get next sessions for active rounds
  const roundIds = activeRounds
    .map(e => e.program_rounds?.id)
    .filter((id): id is string => Boolean(id));
  
  let nextSessionMap = new Map<string, string>();
  if (roundIds.length > 0) {
    const { data: sessions } = await supabase
      .from('program_sessions')
      .select('round_id, session_date')
      .in('round_id', roundIds)
      .gt('session_date', new Date().toISOString())
      .order('session_date', { ascending: true });
    
    if (sessions) {
      for (const session of sessions) {
        if (!nextSessionMap.has(session.round_id)) {
          nextSessionMap.set(session.round_id, session.session_date);
        }
      }
    }
  }

  // Sort active rounds: prioritize those with actual scheduled sessions, then by nearest date
  activeRounds.sort((a, b) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;
    
    // Get next session from map (actual scheduled sessions)
    const aNextSession = aRoundId ? nextSessionMap.get(aRoundId) : null;
    const bNextSession = bRoundId ? nextSessionMap.get(bRoundId) : null;
    
    // Programs with scheduled sessions come first
    if (aNextSession && !bNextSession) return -1;
    if (!aNextSession && bNextSession) return 1;
    
    // Finally sort by nearest date
    const aDate = aNextSession || a.program_rounds?.first_session_date || a.program_rounds?.start_date;
    const bDate = bNextSession || b.program_rounds?.first_session_date || b.program_rounds?.start_date;
    
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;
    
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  // Pick a random routine that user hasn't already added
  const allRoutines = routineRes.data || [];
  const addedRoutineIds = new Set((addedBankRoutinesRes.data || []).map(r => r.routine_id));
  const availableRoutines = allRoutines.filter(r => !addedRoutineIds.has(r.id));
  const suggestedRoutine = availableRoutines.length > 0 
    ? availableRoutines[Math.floor(Math.random() * availableRoutines.length)] 
    : null;

  // New user detection: no tasks and account less than 24 hours old
  const profile = profileRes.data;
  const accountAgeHours = profile?.created_at 
    ? (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60)
    : 999;
  const totalCompletions = totalCompletionsRes.count || 0;
  // Show as "new user" if they have zero tasks - allows welcome card to show for reset accounts
  const isNewUser = allTasks.length === 0;

  return {
    profile,
    listeningMinutes: Math.floor(listeningSeconds / 60),
    completedTracks,
    unreadPosts,
    daysThisMonth,
    todayTasksCount: todayTasks.length,
    todayCompletedCount,
    activeRounds,
    completedRounds,
    nextSessionMap,
    suggestedRoutine,
    periodSettings: periodSettingsRes.data,
    isNewUser,
    totalCompletions,
  };
}

export function useNewHomeData() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['new-home-data', user?.id],
    queryFn: () => fetchNewHomeData(user!.id),
    enabled: !!user?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });

  return {
    ...query,
    profile: query.data?.profile || null,
    listeningMinutes: query.data?.listeningMinutes || 0,
    completedTracks: query.data?.completedTracks || 0,
    unreadPosts: query.data?.unreadPosts || 0,
    daysThisMonth: query.data?.daysThisMonth || 0,
    todayTasksCount: query.data?.todayTasksCount || 0,
    todayCompletedCount: query.data?.todayCompletedCount || 0,
    activeRounds: query.data?.activeRounds || [],
    completedRounds: query.data?.completedRounds || [],
    nextSessionMap: query.data?.nextSessionMap || new Map<string, string>(),
    suggestedRoutine: query.data?.suggestedRoutine || null,
    periodSettings: query.data?.periodSettings || null,
    isNewUser: query.data?.isNewUser || false,
    totalCompletions: query.data?.totalCompletions || 0,
  };
}
