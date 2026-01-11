import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntry {
  title?: string;
  content: string;
  mood?: string;
}

export interface UpdateJournalEntry {
  id: string;
  title?: string;
  content?: string;
  mood?: string;
}

export const useJournalEntries = (searchQuery?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-entries', user?.id, searchQuery],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!user?.id,
  });
};

export const useJournalEntry = (entryId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: async () => {
      if (!entryId || !user?.id) return null;

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    enabled: !!entryId && !!user?.id,
  });
};

export const useCreateJournalEntry = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: CreateJournalEntry) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          title: entry.title || null,
          content: entry.content,
          mood: entry.mood || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
    onError: (error) => {
      console.error('Failed to create journal entry:', error);
      toast.error('Failed to save journal entry');
    },
  });
};

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: UpdateJournalEntry) => {
      const updateData: Record<string, unknown> = {};
      if (entry.title !== undefined) updateData.title = entry.title || null;
      if (entry.content !== undefined) updateData.content = entry.content;
      if (entry.mood !== undefined) updateData.mood = entry.mood || null;

      const { data, error } = await supabase
        .from('journal_entries')
        .update(updateData)
        .eq('id', entry.id)
        .select()
        .single();

      if (error) throw error;
      return data as JournalEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry', data.id] });
    },
    onError: (error) => {
      console.error('Failed to update journal entry:', error);
      toast.error('Failed to save changes');
    },
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      return entryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast.success('Entry deleted');
    },
    onError: (error) => {
      console.error('Failed to delete journal entry:', error);
      toast.error('Failed to delete entry');
    },
  });
};
