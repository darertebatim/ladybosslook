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

// Calculate monthly presence (unique days with logs this month)
// Replaces streak calculation - strength-first philosophy
const calculateMonthlyPresence = (logs: EmotionLog[]): number => {
  if (logs.length === 0) return 0;
  
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get unique days this month
  const uniqueDays = new Set<string>();
  
  logs.forEach(log => {
    const logDate = new Date(log.created_at);
    if (logDate >= monthStart) {
      uniqueDays.add(startOfDay(logDate).toISOString());
    }
  });
  
  return uniqueDays.size;
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

  // Calculate monthly presence (replaces streak)
  const thisMonthDays = calculateMonthlyPresence(logs);

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
    // Stats - strength-first: monthly presence, not streak
    thisMonthDays,
    thisWeekCount,
    thisMonthCount,
    valenceBreakdown,
  };
};
