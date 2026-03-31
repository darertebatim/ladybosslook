import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface DraftSection {
  id: string;
  user_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DraftItem {
  id: string;
  section_id: string;
  user_id: string;
  title: string;
  sort_order: number;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
}

const QUERY_KEY = ['task-drafts'];

export function useTaskDraftSections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEY, 'sections', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_draft_sections' as any)
        .select('*')
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as DraftSection[];
    },
  });
}

export function useTaskDraftItems(sectionIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...QUERY_KEY, 'items', user?.id, sectionIds],
    enabled: !!user?.id && sectionIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_draft_items' as any)
        .select('*')
        .eq('user_id', user!.id)
        .in('section_id', sectionIds)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as DraftItem[];
    },
  });
}

export function useCreateDraftSection() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_draft_sections' as any)
        .insert({ user_id: user.id, title } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DraftSection;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateDraftSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, description }: { id: string; title?: string; description?: string }) => {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      const { error } = await supabase
        .from('task_draft_sections' as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useReorderDraftSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, i) =>
        supabase
          .from('task_draft_sections' as any)
          .update({ sort_order: i } as any)
          .eq('id', id)
      );
      const results = await Promise.all(updates);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_draft_sections' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useCreateDraftItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectionId, title, sortOrder }: { sectionId: string; title: string; sortOrder?: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_draft_items' as any)
        .insert({ section_id: sectionId, user_id: user.id, title, sort_order: sortOrder ?? 0 } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DraftItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateDraftItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from('task_draft_items' as any)
        .update({ title } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteDraftItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_draft_items' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useSendDraftToPlanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, title, date }: { itemId: string; title: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Create a one-time task in planner
      const { error: taskError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title,
          emoji: '📝',
          color: 'sky',
          scheduled_date: format(date, 'yyyy-MM-dd'),
          repeat_pattern: 'none',
          is_active: true,
        });
      if (taskError) throw taskError;
      // Mark draft item as sent
      const { error: updateError } = await supabase
        .from('task_draft_items' as any)
        .update({ is_sent: true, sent_at: new Date().toISOString() } as any)
        .eq('id', itemId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      qc.invalidateQueries({ queryKey: ['new-home-data'] });
      toast.success('Task added to planner ✨');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to send'),
  });
}
