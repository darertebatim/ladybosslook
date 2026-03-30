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

      // Fetch core data in parallel (batch 1)
      const [
        profileResult,
        streakResult,
        taskCompletionsResult,
        audioProgressResult,
        journalResult,
        breathingResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('total_active_days, return_count, this_month_active_days')
          .eq('id', user.id)
          .single(),
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('task_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('audio_progress')
          .select('audio_id, current_position_seconds, completed')
          .eq('user_id', user.id),
        supabase
          .from('free_form_reflections')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('breathing_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      // Fetch extended data in parallel (batch 2)
      const [emotionResult, weeklyReturnsResult, fastingResult, reflectionResult, meditationPlaylistItems, habitStackingResult, focusResult, moodCheckinResult, onlineSessionResult]: any[] = await (Promise.all([
        supabase.from('emotion_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('app_return_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', sevenDaysAgoStr),
        supabase.from('fasting_sessions' as any).select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('ended_at', 'is', null),
        supabase.from('user_reflection_responses' as any).select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('completed_at', 'is', null),
        supabase.from('audio_playlist_items' as any).select('audio_id, audio_playlists!inner(category)').eq('audio_playlists.category', 'meditate'),
        supabase.from('task_completions').select('task_id').eq('user_id', user.id),
        supabase.from('focus_sessions').select('id, duration_seconds', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
        supabase.from('emotion_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('category', 'mood_checkin'),
        supabase.from('app_return_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]) as any);

      // Calculate listening minutes and completed tracks
      const audioData = audioProgressResult.data || [];
      const listeningSeconds = audioData.reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);
      const completedTracks = audioData.filter(p => p.completed).length;

      // Calculate meditation minutes from audio progress filtered by meditation playlist audio IDs
      const meditationAudioIds = new Set(
        ((meditationPlaylistItems as any)?.data || []).map((item: any) => item.audio_id)
      );
      const meditationSeconds = audioData
        .filter(p => meditationAudioIds.has((p as any).audio_id))
        .reduce((sum, p) => sum + (p.current_position_seconds || 0), 0);

      // Calculate max single action completions (habit stacking)
      const taskCompletionsByTask = new Map<string, number>();
      const habitData = habitStackingResult.data || [];
      habitData.forEach((c: any) => {
        taskCompletionsByTask.set(c.task_id, (taskCompletionsByTask.get(c.task_id) || 0) + 1);
      });
      const maxSingleActionCompletions = taskCompletionsByTask.size > 0
        ? Math.max(...taskCompletionsByTask.values())
        : 0;
      // Count how many actions have been repeated 7+ times
      const habitsFormed = [...taskCompletionsByTask.values()].filter(v => v >= 7).length;

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
        fastingSessions: (fastingResult as any).count || 0,
        reflectionCompletions: (reflectionResult as any).count || 0,
        meditationMinutes: Math.floor(meditationSeconds / 60),
        maxSingleActionCompletions,
        habitsFormed,
        focusSessions: focusResult.count || 0,
        focusMinutes: Math.floor(((focusResult.data || []) as any[]).reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / 60),
        moodCheckins: moodCheckinResult.count || 0,
        onlineSessions: onlineSessionResult.count || 0,
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
