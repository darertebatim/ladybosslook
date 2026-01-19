import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const STALE_TIME = 2 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

interface NewHomeData {
  profile: any | null;
  listeningMinutes: number;
  completedTracks: number;
  unreadPosts: number;
  journalStreak: number;
  todayTasksCount: number;
  todayCompletedCount: number;
  activeRounds: any[];
  completedRounds: any[];
  nextSessionMap: Map<string, string>;
  suggestedRoutine: any | null;
}

async function fetchNewHomeData(userId: string): Promise<NewHomeData> {
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();

  const [
    profileRes,
    audioProgressRes,
    allPostsRes,
    readPostsRes,
    journalEntriesRes,
    tasksRes,
    completionsRes,
    enrollmentsRes,
    routineRes,
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
    // Random Pro Routine
    supabase
      .from('routine_plans')
      .select('*')
      .eq('is_active', true)
      .eq('is_pro_routine', true)
      .limit(10),
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
    const entryDates = new Set(
      entries.map(e => new Date(e.created_at).toDateString())
    );
    const checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);
    if (!entryDates.has(checkDate.toDateString())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (entryDates.has(checkDate.toDateString())) {
      journalStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Filter tasks for today
  const allTasks = tasksRes.data || [];
  const todayTasks = allTasks.filter(task => {
    if (task.repeat_pattern === 'none') {
      return task.scheduled_date === dateStr;
    }
    if (task.repeat_pattern === 'daily') return true;
    if (task.repeat_pattern === 'weekend') {
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    if (task.repeat_pattern === 'weekly' && task.scheduled_date) {
      const originalDay = new Date(task.scheduled_date + 'T00:00:00').getDay();
      return dayOfWeek === originalDay;
    }
    if (task.repeat_pattern === 'monthly' && task.scheduled_date) {
      const originalDate = new Date(task.scheduled_date + 'T00:00:00').getDate();
      return today.getDate() === originalDate;
    }
    if (task.repeat_pattern === 'custom' && task.repeat_days) {
      return task.repeat_days.includes(dayOfWeek);
    }
    return false;
  });

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

  // Sort active rounds by next session
  activeRounds.sort((a, b) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;
    const aNextSession = aRoundId ? nextSessionMap.get(aRoundId) : null;
    const bNextSession = bRoundId ? nextSessionMap.get(bRoundId) : null;
    const aDate = aNextSession || a.program_rounds?.first_session_date || a.program_rounds?.start_date;
    const bDate = bNextSession || b.program_rounds?.first_session_date || b.program_rounds?.start_date;
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  // Pick a random pro routine
  const routines = routineRes.data || [];
  const suggestedRoutine = routines.length > 0 
    ? routines[Math.floor(Math.random() * routines.length)] 
    : null;

  return {
    profile: profileRes.data,
    listeningMinutes: Math.floor(listeningSeconds / 60),
    completedTracks,
    unreadPosts,
    journalStreak,
    todayTasksCount: todayTasks.length,
    todayCompletedCount,
    activeRounds,
    completedRounds,
    nextSessionMap,
    suggestedRoutine,
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
    journalStreak: query.data?.journalStreak || 0,
    todayTasksCount: query.data?.todayTasksCount || 0,
    todayCompletedCount: query.data?.todayCompletedCount || 0,
    activeRounds: query.data?.activeRounds || [],
    completedRounds: query.data?.completedRounds || [],
    nextSessionMap: query.data?.nextSessionMap || new Map<string, string>(),
    suggestedRoutine: query.data?.suggestedRoutine || null,
  };
}
