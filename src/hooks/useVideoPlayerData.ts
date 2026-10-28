import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Video catalog and account progress for the shared Player library. */
export function useVideoPlayerData() {
  const { user } = useAuth();
  const playlists = useQuery({
    queryKey: ['video-playlists-app'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlists')
        .select('*').eq('is_hidden', false).order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
  const items = useQuery({
    queryKey: ['player-video-playlist-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlist_items')
        .select('playlist_id, video_id, video_content(id, duration_seconds, thumbnail_url)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
  const progress = useQuery({
    queryKey: ['video-progress-app', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('video_progress')
        .select('*').eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
  return {
    playlists: playlists.data || [],
    items: items.data || [],
    progress: progress.data || [],
    isLoading: playlists.isLoading,
  };
}