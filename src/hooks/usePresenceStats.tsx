import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PresenceStats, getAchievementStatus } from '@/lib/achievements';

export function usePresenceStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['presence-stats', user?.id],
    queryFn: async (): Promise<PresenceStats & { unlockedCount: number; lockedCount: number; weeklyReturns: number }> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      // Fetch all data in parallel
      const [
        profileResult,
        streakResult,
        taskCompletionsResult,
        audioProgressResult,
        journalResult,
        breathingResult,
        emotionResult,
        weeklyReturnsResult,
      ] = await Promise.all([
        // Profile data (strength-first metrics)
        supabase
          .from('profiles')
          .select('total_active_days, return_count, this_month_active_days')
          .eq('id', user.id)
          .single(),
        
        // Streak data
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single(),
        
        // Total task completions count
        supabase
          .from('task_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Audio progress for listening stats
        supabase
          .from('audio_progress')
          .select('current_position_seconds, completed')
          .eq('user_id', user.id),
        
        // Journal entries count
        supabase
          .from('journal_entries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Breathing sessions count
        supabase
          .from('breathing_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Emotion logs count
        supabase
          .from('emotion_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Weekly return events count
        supabase
          .from('app_return_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgoStr),
      ]);

      // Calculate listening minutes and completed tracks
      const audioData = audioProgressResult.data || [];
      const listeningSeconds = audioData.reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);
      const completedTracks = audioData.filter(p => p.completed).length;

      const stats: PresenceStats = {
        // Presence metrics
        totalActiveDays: profileResult.data?.total_active_days || 0,
        thisMonthActiveDays: profileResult.data?.this_month_active_days || 0,
        returnCount: profileResult.data?.return_count || 0,
        currentStreak: streakResult.data?.current_streak || 0,
        longestStreak: streakResult.data?.longest_streak || 0,
        
        // Activity stats
        listeningMinutes: Math.floor(listeningSeconds / 60),
        completedTracks,
        journalEntries: journalResult.count || 0,
        breathingSessions: breathingResult.count || 0,
        emotionLogs: emotionResult.count || 0,
        totalTaskCompletions: taskCompletionsResult.count || 0,
      };

      const { unlocked, locked } = getAchievementStatus(stats);

      return {
        ...stats,
        weeklyReturns: weeklyReturnsResult.count || 0,
        unlockedCount: unlocked.length,
        lockedCount: locked.length,
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
