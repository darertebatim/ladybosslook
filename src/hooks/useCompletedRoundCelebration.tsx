import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CompletedRound {
  enrollmentId: string;
  courseName: string;
  roundName: string;
  roundId: string;
}

const CELEBRATED_ROUNDS_KEY = 'celebrated_completed_rounds';

export function useCompletedRoundCelebration() {
  const { user } = useAuth();
  const [celebrationData, setCelebrationData] = useState<CompletedRound | null>(null);

  // Get list of already celebrated rounds from localStorage
  const getCelebratedRounds = (): string[] => {
    try {
      const stored = localStorage.getItem(CELEBRATED_ROUNDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Mark a round as celebrated
  const markAsCelebrated = (roundId: string) => {
    const celebrated = getCelebratedRounds();
    if (!celebrated.includes(roundId)) {
      celebrated.push(roundId);
      localStorage.setItem(CELEBRATED_ROUNDS_KEY, JSON.stringify(celebrated));
    }
  };

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

  // Check for newly completed rounds
  useEffect(() => {
    if (!completedEnrollments) return;

    const celebratedRounds = getCelebratedRounds();
    
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
  }, [completedEnrollments]);

  const closeCelebration = () => {
    if (celebrationData) {
      markAsCelebrated(celebrationData.roundId);
    }
    setCelebrationData(null);
  };

  return {
    celebrationData,
    closeCelebration,
    showCelebration: !!celebrationData,
  };
}