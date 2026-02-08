import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export interface MoodLog {
  id: string;
  mood: string;
  content: string;
  created_at: string;
}

export interface MoodDay {
  date: string;
  mood: string;
  count: number;
}

/**
 * Fetch all mood logs for the current user
 */
export function useMoodLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mood-logs', user?.id],
    queryFn: async (): Promise<MoodLog[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, mood, content, created_at')
        .eq('user_id', user.id)
        .not('mood', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch mood logs for a specific month (for calendar display)
 */
export function useMoodLogsForMonth(month: Date) {
  const { user } = useAuth();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return useQuery({
    queryKey: ['mood-logs-month', user?.id, format(monthStart, 'yyyy-MM')],
    queryFn: async (): Promise<Map<string, MoodDay>> => {
      if (!user?.id) return new Map();

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, mood, created_at')
        .eq('user_id', user.id)
        .not('mood', 'is', null)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by date, taking the most recent mood for each day
      const moodMap = new Map<string, MoodDay>();
      
      data?.forEach(entry => {
        const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
        const existing = moodMap.get(dateKey);
        
        if (existing) {
          existing.count += 1;
        } else {
          moodMap.set(dateKey, {
            date: dateKey,
            mood: entry.mood,
            count: 1,
          });
        }
      });

      return moodMap;
    },
    enabled: !!user?.id,
  });
}

/**
 * Check if mood has been logged today
 */
export function useTodayMood() {
  const { user } = useAuth();
  const today = new Date();

  return useQuery({
    queryKey: ['today-mood', user?.id, format(today, 'yyyy-MM-dd')],
    queryFn: async (): Promise<MoodLog | null> => {
      if (!user?.id) return null;

      const dayStart = startOfDay(today);
      const dayEnd = endOfDay(today);

      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, mood, content, created_at')
        .eq('user_id', user.id)
        .not('mood', 'is', null)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
