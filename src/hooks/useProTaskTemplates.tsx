import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { ProLinkType } from '@/lib/proTaskTypes';

export interface ProTaskTemplate {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  duration_minutes: number;
  pro_link_type: ProLinkType;
  pro_link_value: string | null;
  linked_playlist_id: string | null;
  category: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  linked_playlist?: {
    id: string;
    name: string;
    cover_image_url: string | null;
  } | null;
}

// Fetch active Pro Task Templates for user display
export function useProTaskTemplates() {
  return useQuery({
    queryKey: ['pro-task-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name, cover_image_url)
        `)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data as ProTaskTemplate[];
    },
  });
}

// Fetch a single Pro Task Template by ID
export function useProTaskTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ['pro-task-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from('routine_task_templates')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name, cover_image_url, description)
        `)
        .eq('id', templateId)
        .single();
      
      if (error) throw error;
      return data as ProTaskTemplate;
    },
    enabled: !!templateId,
  });
}

// Add single Pro Task directly to user's planner
export function useAddProTaskToPlanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      template, 
      scheduledTime 
    }: { 
      template: ProTaskTemplate; 
      scheduledTime?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Insert into user_tasks with pro_link_type and pro_link_value
      const { data, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: template.title,
          notes: template.description,
          icon: template.icon,
          color: getColorFromLinkType(template.pro_link_type),
          duration_minutes: template.duration_minutes,
          scheduled_date: today,
          scheduled_time: scheduledTime || null,
          pro_link_type: template.pro_link_type,
          pro_link_value: template.pro_link_value || template.linked_playlist_id,
          repeat_pattern: 'none',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      toast.success('Added to your planner!');
    },
    onError: (error) => {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    },
  });
}

// Helper to get a color based on link type
function getColorFromLinkType(linkType: ProLinkType): string {
  const colorMap: Record<ProLinkType, string> = {
    playlist: 'emerald',
    journal: 'purple',
    channel: 'blue',
    program: 'orange',
    planner: 'yellow',
    inspire: 'pink',
    route: 'gray',
  };
  return colorMap[linkType] || 'purple';
}
