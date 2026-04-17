import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAutoCompleteProTask } from './useAutoCompleteProTask';
import { logEvent } from '@/lib/firebaseAnalytics';

interface SaveSessionParams {
  durationSeconds: number;
  sessionType: 'timer' | 'pomodoro';
  theme?: string;
  pomodoroRounds?: number;
  completed: boolean;
  startedAt?: Date;
}

export const useSaveFocusSession = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { autoCompleteFocusTimer } = useAutoCompleteProTask();

  return useMutation({
    mutationFn: async (params: SaveSessionParams) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user.id,
        duration_seconds: params.durationSeconds,
        session_type: params.sessionType,
        theme: params.theme || null,
        pomodoro_rounds: params.pomodoroRounds || null,
        completed: params.completed,
        started_at: (params.startedAt || new Date()).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      // Auto-complete any focus_timer pro tasks
      autoCompleteFocusTimer();
      try {
        logEvent('focus_session_completed', {
          duration_seconds: variables.durationSeconds,
          session_type: variables.sessionType,
          completed: variables.completed,
        });
      } catch { /* ignore */ }
    },
  });
};

type Period = 'day' | 'week' | 'month' | 'year';

function getRange(date: Date, period: Period): { start: Date; end: Date } {
  switch (period) {
    case 'day': return { start: startOfDay(date), end: endOfDay(date) };
    case 'week': return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case 'month': return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'year': return { start: startOfYear(date), end: endOfYear(date) };
  }
}

export interface FocusSession {
  id: string;
  started_at: string;
  duration_seconds: number;
  session_type: string;
  theme: string | null;
  pomodoro_rounds: number | null;
  completed: boolean;
}

export const useFocusStats = (date: Date, period: Period) => {
  const { user } = useAuth();
  const { start, end } = getRange(date, period);

  return useQuery({
    queryKey: ['focus-sessions', user?.id, period, start.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', start.toISOString())
        .lte('started_at', end.toISOString())
        .order('started_at', { ascending: true });
      if (error) throw error;
      return (data || []) as FocusSession[];
    },
    enabled: !!user,
  });
};
