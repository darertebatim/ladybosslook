import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LinkedRoutinePlan {
  id: string;
  title: string;
  icon: string;
  color: string;
  estimated_minutes: number;
  description: string | null;
}

// Find a Pro Routine that links to a specific playlist
export function usePlaylistRoutine(playlistId: string | undefined) {
  return useQuery({
    queryKey: ['playlist-routine', playlistId],
    queryFn: async () => {
      if (!playlistId) return null;

      // Find routine plan that has a task linking to this playlist
      const { data, error } = await supabase
        .from('routine_plan_tasks')
        .select(`
          plan_id,
          routine_plans!inner(
            id,
            title,
            icon,
            color,
            estimated_minutes,
            description,
            is_active
          )
        `)
        .eq('pro_link_type', 'playlist')
        .eq('pro_link_value', playlistId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      
      const plan = data.routine_plans as unknown as LinkedRoutinePlan & { is_active: boolean };
      if (!plan.is_active) return null;
      
      return plan as LinkedRoutinePlan;
    },
    enabled: !!playlistId,
  });
}

// Check if user already has a task linked to this playlist
export function useExistingPlaylistTask(playlistId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['playlist-task-exists', playlistId, user?.id],
    queryFn: async () => {
      if (!playlistId || !user) return false;

      const { data, error } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('linked_playlist_id', playlistId)
        .eq('is_active', true)
        .limit(1);

      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!playlistId && !!user,
  });
}

// Check if user already has a task with a specific pro_link_type (and optionally pro_link_value)
export function useExistingProTask(linkType: string | undefined, linkValue?: string | null) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pro-task-exists', linkType, linkValue, user?.id],
    queryFn: async () => {
      if (!linkType || !user) return false;

      let query = supabase
        .from('user_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('pro_link_type', linkType)
        .eq('is_active', true);

      // If linkValue is provided, also filter by it
      if (linkValue) {
        query = query.eq('pro_link_value', linkValue);
      }

      const { data, error } = await query.limit(1);

      if (error) return false;
      return data && data.length > 0;
    },
    enabled: !!linkType && !!user,
  });
}
