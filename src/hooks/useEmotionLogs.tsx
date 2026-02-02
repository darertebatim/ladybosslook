import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { startOfDay, differenceInDays } from 'date-fns';
import type { Valence } from '@/lib/emotionData';

export interface EmotionLog {
  id: string;
  user_id: string;
  valence: Valence;
  category: string;
  emotion: string;
  contexts: string[];
  notes: string | null;
  created_at: string;
}

export interface CreateEmotionLogInput {
  valence: Valence;
  category: string;
  emotion: string;
  contexts: string[];
  notes?: string;
}

// Calculate streak (consecutive days with at least one log)
const calculateStreak = (logs: EmotionLog[]): number => {
  if (logs.length === 0) return 0;
  
  // Get unique days, sorted descending (most recent first)
  const uniqueDays = [...new Set(logs.map(log => 
    startOfDay(new Date(log.created_at)).toISOString()
  ))].sort().reverse();
  
  if (uniqueDays.length === 0) return 0;
  
  const today = startOfDay(new Date());
  const mostRecent = new Date(uniqueDays[0]);
  
  // If no log today or yesterday, streak is 0
  const daysSinceMostRecent = differenceInDays(today, mostRecent);
  if (daysSinceMostRecent > 1) return 0;
  
  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = new Date(uniqueDays[i - 1]);
    const prev = new Date(uniqueDays[i]);
    if (differenceInDays(current, prev) === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export const useEmotionLogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch emotion logs
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['emotion-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('emotion_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmotionLog[];
    },
    enabled: !!user?.id,
  });

  // Create emotion log
  const createLog = useMutation({
    mutationFn: async (input: CreateEmotionLogInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('emotion_logs')
        .insert({
          user_id: user.id,
          valence: input.valence,
          category: input.category,
          emotion: input.emotion,
          contexts: input.contexts,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EmotionLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotion-logs', user?.id] });
    },
    onError: (error) => {
      console.error('Failed to save emotion log:', error);
      toast.error('Failed to save your emotion');
    },
  });

  // Delete emotion log
  const deleteLog = useMutation({
    mutationFn: async (logId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('emotion_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotion-logs', user?.id] });
      toast.success('Emotion log deleted');
    },
    onError: (error) => {
      console.error('Failed to delete emotion log:', error);
      toast.error('Failed to delete emotion log');
    },
  });

  // Get logs from today
  const todayLogs = logs.filter(log => {
    const today = new Date();
    const logDate = new Date(log.created_at);
    return logDate.toDateString() === today.toDateString();
  });

  // Get recent logs (last 7 days)
  const recentLogs = logs.filter(log => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(log.created_at) >= weekAgo;
  });

  // Calculate streak
  const streak = calculateStreak(logs);

  // Stats helpers
  const thisWeekCount = recentLogs.length;
  
  const thisMonthCount = logs.filter(log => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return new Date(log.created_at) >= monthAgo;
  }).length;

  // Valence breakdown for this week
  const valenceBreakdown = {
    pleasant: recentLogs.filter(l => l.valence === 'pleasant').length,
    neutral: recentLogs.filter(l => l.valence === 'neutral').length,
    unpleasant: recentLogs.filter(l => l.valence === 'unpleasant').length,
  };

  return {
    logs,
    todayLogs,
    recentLogs,
    isLoading,
    error,
    createLog,
    deleteLog,
    // Stats
    streak,
    thisWeekCount,
    thisMonthCount,
    valenceBreakdown,
  };
};
