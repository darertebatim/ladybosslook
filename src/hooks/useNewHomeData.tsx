import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

const STALE_TIME = 2 * 60 * 1000;
const GC_TIME = 10 * 60 * 1000;

interface NewHomeData {
  profile: any | null;
  listeningMinutes: number;
  completedTracks: number;
  unreadPosts: number;
  daysThisMonth: number;
  todayTasksCount: number;
  todayCompletedCount: number;
  activeRounds: any[];
  completedRounds: any[];
  nextSessionMap: Record<string, string>;
  suggestedRoutine: any | null;
  periodSettings: any | null;
  isNewUser: boolean;
  totalCompletions: number;
  streak: any | null;
}

async function fetchNewHomeData(userId: string): Promise<NewHomeData> {
  const today = new Date();
  const dateStr = getLocalDateStr(today);

  // 1. Single RPC call replaces 10+ individual queries
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_home_data', { p_user_id: userId, p_date_str: dateStr });

  if (rpcError) {
    console.error('get_home_data RPC error:', rpcError);
    throw rpcError;
  }

  const d = rpcData as any;

  // 2. Remaining queries that need joins/complex logic (run in parallel)
  const tasksQuery = supabase
    .from('user_tasks')
    .select('id, repeat_pattern, scheduled_date, repeat_days, pro_link_type, pro_link_value, source_routine_id, created_at, repeat_end_date')
    .eq('user_id', userId)
    .eq('is_active', true);

  const routineSessionsQuery = supabase
    .from('routine_sessions')
    .select('routine_id, started_at, tasks_completed, tasks_total')
    .eq('user_id', userId)
    .gte('started_at', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
    .lte('started_at', new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString());

  const skipsQuery = supabase
    .from('task_skips')
    .select('task_id, skipped_date')
    .eq('user_id', userId)
    .eq('skipped_date', dateStr);

  // Process enrollments from RPC (exclude simora-plus subscription)
  const enrollments = (d.active_enrollments || []).filter((e: any) => e.program_slug !== 'simora-plus');
  const activeRounds = enrollments.filter((e: any) => e.program_rounds?.status !== 'completed');
  const completedRounds = enrollments.filter((e: any) => e.program_rounds?.status === 'completed');

  // Get next sessions for active rounds
  const roundIds = activeRounds
    .map((e: any) => e.program_rounds?.id)
    .filter((id: string | undefined): id is string => Boolean(id));
  
  let nextSessionMap: Record<string, string> = {};
  if (roundIds.length > 0) {
    const { data: sessions } = await supabase
      .from('program_sessions')
      .select('round_id, session_date')
      .in('round_id', roundIds)
      .gt('session_date', new Date().toISOString())
      .order('session_date', { ascending: true });
    
    if (sessions) {
      for (const session of sessions) {
        if (!nextSessionMap[session.round_id]) {
          nextSessionMap[session.round_id] = session.session_date;
        }
      }
    }
  }

  // Sort active rounds
  activeRounds.sort((a: any, b: any) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;
    const aNextSession = aRoundId ? nextSessionMap[aRoundId] : null;
    const bNextSession = bRoundId ? nextSessionMap[bRoundId] : null;

    if (aNextSession && !bNextSession) return -1;
    if (!aNextSession && bNextSession) return 1;
    
    const aDate = aNextSession || a.program_rounds?.first_session_date || a.program_rounds?.start_date;
    const bDate = bNextSession || b.program_rounds?.first_session_date || b.program_rounds?.start_date;
    
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;
    
    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  // Pick random routine
  const allRoutines = routineRes.data || [];
  const addedRoutineIds = new Set((addedBankRoutinesRes.data || []).map((r: any) => r.routine_id));
  const availableRoutines = allRoutines.filter((r: any) => !addedRoutineIds.has(r.id));
  const suggestedRoutine = availableRoutines.length > 0 
    ? availableRoutines[Math.floor(Math.random() * availableRoutines.length)] 
    : null;

  // New user detection
  const profile = d.profile;
  const totalCompletions = d.total_completions || 0;
  const isNewUser = allTasks.length === 0;

  return {
    profile,
    listeningMinutes: d.listening_minutes || 0,
    completedTracks: d.completed_tracks || 0,
    unreadPosts: d.unread_posts || 0,
    daysThisMonth: d.days_this_month || 0,
    todayTasksCount: todayTasks.length,
    todayCompletedCount,
    activeRounds,
    completedRounds,
    nextSessionMap,
    suggestedRoutine,
    periodSettings: d.period_settings || null,
    isNewUser,
    totalCompletions,
    streak: d.streak || null,
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
    nextSessionMap: query.data?.nextSessionMap || {},
    suggestedRoutine: query.data?.suggestedRoutine || null,
    periodSettings: query.data?.periodSettings || null,
    isNewUser: query.data?.isNewUser || false,
    totalCompletions: query.data?.totalCompletions || 0,
    streak: query.data?.streak || null,
  };
}
