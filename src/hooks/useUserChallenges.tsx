import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserChallenge {
  routineId: string;
  title: string;
  emoji: string;
  totalDays: number;
  completedDays: number;
  challengeStartDate: string | null;
  addedAt: string;
}

/**
 * Fetches the user's active challenge-type routines with progress.
 * 
 * Progress is calculated by counting how many distinct dates the user
 * has completed tasks since adopting the challenge.
 */
export function useUserChallenges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-challenges', user?.id],
    queryFn: async (): Promise<UserChallenge[]> => {
      if (!user) return [];

      // 1. Get user's adopted routines
      const { data: userRoutines, error: urError } = await supabase
        .from('user_routines_bank')
        .select('routine_id, added_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (urError) throw urError;
      if (!userRoutines?.length) return [];

      const routineIds = userRoutines.map(r => r.routine_id);

      // 2. Get only challenge-type routines
      const { data: routines, error: rError } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, schedule_type, challenge_start_date')
        .in('id', routineIds)
        .eq('schedule_type', 'challenge');

      if (rError) throw rError;
      if (!routines?.length) return [];

      // 3. Get total task count per challenge routine
      const { data: routineTasks, error: tError } = await supabase
        .from('routines_bank_tasks')
        .select('routine_id, title')
        .in('routine_id', routines.map(r => r.id));

      if (tError) throw tError;

      // Build task count per routine
      const taskCountMap = new Map<string, number>();
      const taskTitlesByRoutine = new Map<string, string[]>();
      (routineTasks || []).forEach(t => {
        taskCountMap.set(t.routine_id, (taskCountMap.get(t.routine_id) || 0) + 1);
        const titles = taskTitlesByRoutine.get(t.routine_id) || [];
        titles.push(t.title);
        taskTitlesByRoutine.set(t.routine_id, titles);
      });

      // 4. For each challenge, find matching user_tasks by title and count completions
      const addedAtMap = new Map(userRoutines.map(r => [r.routine_id, r.added_at]));
      const challenges: UserChallenge[] = [];

      for (const routine of routines) {
        const titles = taskTitlesByRoutine.get(routine.id) || [];
        const totalDays = taskCountMap.get(routine.id) || 0;
        const addedAt = addedAtMap.get(routine.id) || '';

        if (totalDays === 0) {
          challenges.push({
            routineId: routine.id,
            title: routine.title,
            emoji: routine.emoji || '✨',
            totalDays: 0,
            completedDays: 0,
            challengeStartDate: routine.challenge_start_date,
            addedAt,
          });
          continue;
        }

        // Find user_tasks matching these titles (created around adoption time)
        const { data: matchingUserTasks } = await supabase
          .from('user_tasks')
          .select('id')
          .eq('user_id', user.id)
          .in('title', titles);

        const matchingTaskIds = (matchingUserTasks || []).map(t => t.id);
        let completedDays = 0;

        if (matchingTaskIds.length > 0) {
          const { data: completions } = await supabase
            .from('task_completions')
            .select('task_id')
            .eq('user_id', user.id)
            .in('task_id', matchingTaskIds);

          completedDays = (completions || []).length;
        }

        challenges.push({
          routineId: routine.id,
          title: routine.title,
          emoji: routine.emoji || '✨',
          totalDays,
          completedDays: Math.min(completedDays, totalDays),
          challengeStartDate: routine.challenge_start_date,
          addedAt,
        });
      }

      return challenges;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
