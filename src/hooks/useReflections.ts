import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Types (since tables are new and not yet in generated types)
export const REFLECTION_CATEGORIES = [
  { value: 'reset', label: 'Reset', emoji: '🧹' },
  { value: 'micro-wins', label: 'Micro-wins', emoji: '🏆' },
  { value: 'deep-dives', label: 'Deep Dives', emoji: '🌊' },
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'energize', label: 'Energize', emoji: '⚡' },
  { value: 'calm', label: 'Calm', emoji: '🧘' },
  { value: 'night', label: 'Night', emoji: '🌙' },
  { value: 'big-picture', label: 'Big picture', emoji: '🔭' },
  { value: 'business-finance', label: 'Business & Finance', emoji: '💼' },
  { value: 'emotion-based', label: 'Emotion-Based', emoji: '💗' },
] as const;

export interface Reflection {
  id: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  emoji: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_free: boolean;
  cover_color: string | null;
  category: string | null;
  shuffle_mode: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReflectionPage {
  id: string;
  reflection_id: string;
  page_order: number;
  type: 'question' | 'message';
  content: string;
  description: string | null;
  created_at: string;
}

export interface UserReflectionResponse {
  id: string;
  user_id: string;
  reflection_id: string;
  page_id: string;
  response_text: string | null;
  completed_at: string | null;
  created_at: string;
}

// ---- App hooks ----

export function useReflections() {
  return useQuery({
    queryKey: ['reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as Reflection[];
    },
    // Always refetch on mount so a stale/empty IDB snapshot doesn't keep
    // the page blank when the user is back online.
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useReflectionPages(reflectionId: string | undefined) {
  return useQuery({
    queryKey: ['reflection-pages', reflectionId],
    enabled: !!reflectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflection_pages' as any)
        .select('*')
        .eq('reflection_id', reflectionId!)
        .order('page_order', { ascending: true });
      if (error) throw error;
      return data as unknown as ReflectionPage[];
    },
  });
}

export function useUserReflectionResponses(reflectionId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reflection-responses', reflectionId, user?.id],
    enabled: !!reflectionId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_reflection_responses' as any)
        .select('*')
        .eq('user_id', user!.id)
        .eq('reflection_id', reflectionId!);
      if (error) throw error;
      return data as unknown as UserReflectionResponse[];
    },
  });
}

export function useSaveReflectionResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reflectionId,
      pageId,
      responseText,
      isCompleted,
    }: {
      reflectionId: string;
      pageId: string;
      responseText?: string;
      isCompleted?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Upsert based on user_id + page_id
      const { data: existing } = await supabase
        .from('user_reflection_responses' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('page_id', pageId)
        .maybeSingle();

      const payload: any = {
        user_id: user.id,
        reflection_id: reflectionId,
        page_id: pageId,
        response_text: responseText || null,
        ...(isCompleted ? { completed_at: new Date().toISOString() } : {}),
      };

      if ((existing as any)?.id) {
        const { error } = await supabase
          .from('user_reflection_responses' as any)
          .update(payload)
          .eq('id', (existing as any).id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_reflection_responses' as any)
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reflection-responses', vars.reflectionId] });
    },
  });
}

// ---- Admin hooks ----

export function useAllReflections() {
  return useQuery({
    queryKey: ['admin-reflections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflections' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as Reflection[];
    },
  });
}

export function useCreateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<Reflection>) => {
      const { error } = await supabase.from('reflections' as any).insert(r as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reflections'] });
      toast.success('Reflection created');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...r }: Partial<Reflection> & { id: string }) => {
      const { error } = await supabase.from('reflections' as any).update(r as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reflections'] });
      toast.success('Reflection updated');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reflections' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reflections'] });
      toast.success('Reflection deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAdminReflectionPages(reflectionId: string | undefined) {
  return useQuery({
    queryKey: ['admin-reflection-pages', reflectionId],
    enabled: !!reflectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflection_pages' as any)
        .select('*')
        .eq('reflection_id', reflectionId!)
        .order('page_order', { ascending: true });
      if (error) throw error;
      return data as unknown as ReflectionPage[];
    },
  });
}

export function useSaveReflectionPages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reflectionId,
      pages,
    }: {
      reflectionId: string;
      pages: { id?: string; page_order: number; type: string; content: string; description?: string }[];
    }) => {
      // Delete all existing pages then re-insert
      await supabase.from('reflection_pages' as any).delete().eq('reflection_id', reflectionId);
      if (pages.length > 0) {
        const rows = pages.map((p) => ({
          reflection_id: reflectionId,
          page_order: p.page_order,
          type: p.type,
          content: p.content,
          description: p.description || null,
        }));
        const { error } = await supabase.from('reflection_pages' as any).insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-reflection-pages', vars.reflectionId] });
      toast.success('Pages saved');
    },
    onError: (e: any) => toast.error(e.message),
  });
}
