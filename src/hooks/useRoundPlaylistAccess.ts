import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Playlists (audio or video) attached to programs or rounds the user is actively
 * enrolled in. Enrollment unlocks attached playlists, including Plus-only ones.
 */
export const useRoundPlaylistAccess = () => {
  const { user } = useAuth();

  const { data: ids } = useQuery({
    queryKey: ['round-attached-playlist-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as string[];
      const { data: enr, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('round_id, program_slug')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (enrollmentError) throw enrollmentError;
      const roundIds = (enr || [])
        .map((e: any) => e.round_id)
        .filter(Boolean) as string[];
      const slugs = [...new Set((enr || []).map((e) => e.program_slug).filter(Boolean))];
      const [roundResult, programResult] = await Promise.all([
        roundIds.length ? supabase.from('program_round_playlists').select('playlist_id').in('round_id', roundIds) : Promise.resolve({ data: [], error: null }),
        slugs.length ? supabase.from('program_content_links').select('content_id').in('program_slug', slugs).in('content_type', ['audio', 'video']) : Promise.resolve({ data: [], error: null }),
      ]);
      if (roundResult.error) throw roundResult.error;
      if (programResult.error) throw programResult.error;
      return [...new Set([...(roundResult.data || []).map((r) => r.playlist_id), ...(programResult.data || []).map((r) => r.content_id)])];
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
