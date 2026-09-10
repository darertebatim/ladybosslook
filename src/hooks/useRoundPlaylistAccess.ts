import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Playlists (audio or video) attached to program rounds the user is actively
 * enrolled in. Enrolling in a round unlocks every playlist attached to it,
 * including Plus-only playlists.
 */
export const useRoundPlaylistAccess = () => {
  const { user } = useAuth();

  const { data: ids } = useQuery({
    queryKey: ['round-attached-playlist-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as string[];
      const { data: enr } = await supabase
        .from('course_enrollments')
        .select('round_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
      const roundIds = (enr || [])
        .map((e: any) => e.round_id)
        .filter(Boolean) as string[];
      if (roundIds.length === 0) return [] as string[];
      const { data: rows } = await supabase
        .from('program_round_playlists')
        .select('playlist_id')
        .in('round_id', roundIds);
      return (rows || []).map((r: any) => r.playlist_id).filter(Boolean) as string[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const set = new Set(ids || []);
  return {
    roundPlaylistIds: set,
    hasRoundAccess: (playlistId?: string | null) => !!playlistId && set.has(playlistId),
  };
};
