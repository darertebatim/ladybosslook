import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReadingLesson {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  emoji: string;
  source_document_id: string | null;
  category: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingCard {
  id: string;
  lesson_id: string;
  sort_order: number;
  title: string;
  content: string;
  key_point: string | null;
  image_url: string | null;
  bg_color: string;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  last_card_index: number;
  completed: boolean;
  completed_at: string | null;
}

// Admin: fetch all lessons (including unpublished)
export function useAdminReadingLessons() {
  return useQuery({
    queryKey: ['admin-reading-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_lessons' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingLesson[];
    },
  });
}

// Admin: fetch cards for a lesson
export function useAdminReadingCards(lessonId: string | null) {
  return useQuery({
    queryKey: ['admin-reading-cards', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_cards' as any)
        .select('*')
        .eq('lesson_id', lessonId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingCard[];
    },
  });
}

// App: fetch published lessons
export function usePublishedLessons() {
  return useQuery({
    queryKey: ['published-reading-lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_lessons' as any)
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingLesson[];
    },
  });
}

// App: fetch cards for a published lesson
export function useLessonCards(lessonId: string | null) {
  return useQuery({
    queryKey: ['reading-cards', lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_cards' as any)
        .select('*')
        .eq('lesson_id', lessonId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReadingCard[];
    },
  });
}

// App: fetch user progress for all lessons
export function useReadingProgress() {
  return useQuery({
    queryKey: ['reading-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_progress' as any)
        .select('*');
      if (error) throw error;
      return (data || []) as unknown as ReadingProgress[];
    },
  });
}

// Mutations
export function useCreateLesson() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (lesson: Partial<ReadingLesson>) => {
      const { data, error } = await supabase
        .from('reading_lessons' as any)
        .insert(lesson as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingLesson;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-lessons'] });
      toast({ title: 'Lesson created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateLesson() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReadingLesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_lessons' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingLesson;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-lessons'] });
      toast({ title: 'Lesson updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reading_lessons' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reading-lessons'] });
      toast({ title: 'Lesson deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: Partial<ReadingCard>) => {
      const { data, error } = await supabase
        .from('reading_cards' as any)
        .insert(card as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingCard;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-cards', vars.lesson_id] });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReadingCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_cards' as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ReadingCard;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-cards', (data as any).lesson_id] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lessonId }: { id: string; lessonId: string }) => {
      const { error } = await supabase
        .from('reading_cards' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return lessonId;
    },
    onSuccess: (lessonId) => {
      qc.invalidateQueries({ queryKey: ['admin-reading-cards', lessonId] });
    },
  });
}

export function useUpsertProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (progress: { user_id: string; lesson_id: string; last_card_index: number; completed?: boolean; completed_at?: string | null }) => {
      const { data, error } = await supabase
        .from('reading_progress' as any)
        .upsert(progress as any, { onConflict: 'user_id,lesson_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reading-progress'] });
    },
  });
}
