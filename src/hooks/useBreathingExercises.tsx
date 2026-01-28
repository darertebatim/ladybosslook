import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BreathingExercise {
  id: string;
  name: string;
  description: string | null;
  category: 'morning' | 'energize' | 'focus' | 'calm' | 'night';
  emoji: string;
  inhale_seconds: number;
  inhale_hold_seconds: number;
  exhale_seconds: number;
  exhale_hold_seconds: number;
  inhale_method: 'nose' | 'mouth';
  exhale_method: 'nose' | 'mouth';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BreathingSession {
  id: string;
  user_id: string;
  exercise_id: string;
  duration_seconds: number;
  completed_at: string;
}

export const BREATHING_CATEGORIES = [
  { value: 'morning', label: 'Morning', emoji: '🌅' },
  { value: 'energize', label: 'Energize', emoji: '⚡' },
  { value: 'focus', label: 'Focus', emoji: '🎯' },
  { value: 'calm', label: 'Calm', emoji: '🧘' },
  { value: 'night', label: 'Night', emoji: '🌙' },
] as const;

// Fetch all breathing exercises
export function useBreathingExercises() {
  return useQuery({
    queryKey: ['breathing-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as BreathingExercise[];
    },
  });
}

// Fetch exercises by category
export function useBreathingExercisesByCategory(category: string | null) {
  const { data: allExercises, ...rest } = useBreathingExercises();
  
  const filteredExercises = category && category !== 'all'
    ? allExercises?.filter(e => e.category === category)
    : allExercises;
    
  return { data: filteredExercises, ...rest };
}

// Create breathing exercise (admin)
export function useCreateBreathingExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (exercise: Omit<BreathingExercise, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .insert(exercise)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
    },
  });
}

// Update breathing exercise (admin)
export function useUpdateBreathingExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BreathingExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
    },
  });
}

// Delete breathing exercise (admin)
export function useDeleteBreathingExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('breathing_exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breathing-exercises'] });
    },
  });
}

// Save breathing session
export function useSaveBreathingSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ exerciseId, durationSeconds }: { exerciseId: string; durationSeconds: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('breathing_sessions')
        .insert({
          user_id: user.id,
          exercise_id: exerciseId,
          duration_seconds: durationSeconds,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breathing-sessions'] });
    },
  });
}

// Get user's breathing sessions
export function useBreathingSessions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['breathing-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('breathing_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BreathingSession[];
    },
    enabled: !!user,
  });
}
