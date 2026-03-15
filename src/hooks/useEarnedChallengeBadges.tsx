import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EarnedBadge {
  id: string;
  routineId: string;
  badgeImageUrl: string;
  routineTitle: string;
  routineEmoji: string;
  earnedAt: string;
}

/**
 * Fetches all challenge badges earned by the current user.
 */
export function useEarnedChallengeBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['earned-challenge-badges', user?.id],
    queryFn: async (): Promise<EarnedBadge[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_challenge_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(b => ({
        id: b.id,
        routineId: b.routine_id,
        badgeImageUrl: b.badge_image_url,
        routineTitle: b.routine_title,
        routineEmoji: b.routine_emoji,
        earnedAt: b.earned_at,
      }));
    },
    enabled: !!user,
  });
}
