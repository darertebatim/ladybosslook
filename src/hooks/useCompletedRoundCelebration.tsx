import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CompletedRound {
  enrollmentId: string;
  courseName: string;
  roundName: string;
  roundId: string;
}

export function useCompletedRoundCelebration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [celebrationData, setCelebrationData] = useState<CompletedRound | null>(null);

  // Fetch already celebrated rounds from database (persistent across devices/sessions)
  const { data: celebratedRounds } = useQuery({
    queryKey: ['celebrated-rounds', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_celebrated_rounds')
        .select('round_id')
        .eq('user_id', user?.id);

      if (error) throw error;
      return data?.map(r => r.round_id) || [];
    },
    enabled: !!user?.id,
  });

  // Fetch completed enrollments
  const { data: completedEnrollments } = useQuery({
    queryKey: ['completed-enrollments-celebration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_name,
          program_rounds (
            id,
            round_name,
            status
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mutation to mark a round as celebrated in the database
  const markCelebratedMutation = useMutation({
    mutationFn: async (roundId: string) => {
      const { error } = await supabase
        .from('user_celebrated_rounds')
        .insert({
          user_id: user?.id,
          round_id: roundId,
        });

      // Ignore unique constraint violations (already celebrated)
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celebrated-rounds', user?.id] });
    },
  });

  // Check for newly completed rounds
  useEffect(() => {
    if (!completedEnrollments || !celebratedRounds) return;

    // Find completed rounds that haven't been celebrated yet
    for (const enrollment of completedEnrollments) {
      const round = enrollment.program_rounds;
      if (round && round.status === 'completed' && !celebratedRounds.includes(round.id)) {
        setCelebrationData({
          enrollmentId: enrollment.id,
          courseName: enrollment.course_name,
          roundName: round.round_name,
          roundId: round.id,
        });
        break; // Show one at a time
      }
    }
  }, [completedEnrollments, celebratedRounds]);

  const closeCelebration = () => {
    if (celebrationData) {
      markCelebratedMutation.mutate(celebrationData.roundId);
    }
    setCelebrationData(null);
  };

  return {
    celebrationData,
    closeCelebration,
    showCelebration: !!celebrationData,
  };
}
