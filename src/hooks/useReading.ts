import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReadingContent {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_url: string | null;
  emoji: string | null;
  type: 'story' | 'lesson';
  category: string;
  author: string | null;
  reading_time_minutes: number;
  theme_color: string;
  is_published: boolean;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingSection {
  id: string;
  content_id: string;
  sort_order: number;
  heading: string | null;
  body: string;
  quote: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ReadingUserProgress {
  id: string;
  user_id: string;
  content_id: string;
  last_section_index: number;
  completed: boolean;
  completed_at: string | null;
}

// Admin: all content
export function useAdminReadingContent() {
  return useQuery({
    queryKey: ['admin-reading-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingContent[];
    },
  });
}

// Admin: sections for a content item
export function useAdminReadingSections(contentId: string | null) {
  return useQuery({
    queryKey: ['admin-reading-sections', contentId],
    enabled: !!contentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_sections' as any)
        .select('*')
        .eq('content_id', contentId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingSection[];
    },
  });
}

// App: published content
export function usePublishedContent(type?: 'story' | 'lesson') {
  return useQuery({
    queryKey: ['published-reading-content', type],
    queryFn: async () => {
      let query = supabase
        .from('reading_content' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ReadingContent[];
    },
  });
}

// App: sections for content
export function useContentSections(contentId: string | null) {
  return useQuery({
    queryKey: ['reading-sections', contentId],
    enabled: !!contentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_sections' as any)
        .select('*')
        .eq('content_id', contentId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingSection[];
    },
  });
}

// App: single content by id
export function useReadingContentById(id: string | null) {
  return useQuery({
    queryKey: ['reading-content', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as unknown as ReadingContent;
    },
  });
}

// App: user progress
export function useReadingUserProgress() {
  return useQuery({
    queryKey: ['reading-user-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_user_progress' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as ReadingUserProgress[];
    },
  });
}

// Mutations
export function useCreateContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (content: Partial<ReadingContent>) => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .insert(content as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingContent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-content'] });
      toast({ title: 'Content created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReadingContent> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_content' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingContent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-content'] });
      toast({ title: 'Content updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reading_content' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-content'] });
      toast({ title: 'Content deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (section: Partial<ReadingSection>) => {
      const { data, error } = await supabase
        .from('reading_sections' as any)
        .insert(section as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingSection;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-sections', vars.content_id] });
    },
  });
}

export function useUpdateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReadingSection> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_sections' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingSection;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-sections', (data as any).content_id] });
    },
  });
}

export function useDeleteSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contentId }: { id: string; contentId: string }) => {
      const { error } = await supabase
        .from('reading_sections' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return contentId;
    },
    onSuccess: (contentId) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-sections', contentId] });
    },
  });
}

export function useUpsertReadingProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (progress: { user_id: string; content_id: string; last_section_index: number; completed?: boolean; completed_at?: string | null }) => {
      const { data, error } = await supabase
        .from('reading_user_progress' as any)
        .upsert(progress as any, { onConflict: 'user_id,content_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading-user-progress'] });
    },
  });
}
