import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/localDate';

export interface UserChallenge {
  routineId: string;
  title: string;
  emoji: string;
  totalDays: number;
  completedDays: number;
  challengeStartDate: string | null;
  startDayOfWeek: number | null;
  endAfterDays: number | null;
  addedAt: string;
  /** Computed: the actual date the challenge begins for this user */
  computedStartDate: string | null;
  hasStarted: boolean;
  badgeImageUrl: string | null;
}

/**
 * Calculates the next occurrence of a given day-of-week (0=Sun, 1=Mon, ...).
 * If today IS that day, returns today.
 */
function getNextDayOfWeek(dayOfWeek: number, fromDate: Date): Date {
  const current = fromDate.getDay();
  const daysUntil = (dayOfWeek - current + 7) % 7;
  const result = new Date(fromDate);
  result.setDate(result.getDate() + daysUntil);
  return result;
}

/**
 * Fetches the user's active challenge-type routines with progress.
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

      // 2. Get only challenge-type routines with scheduling fields
      // Still need routines_bank for schedule metadata not copied to user_routines_bank
      const { data: routines, error: rError } = await supabase
        .from('routines_bank')
        .select('id, title, emoji, schedule_type, challenge_start_date, start_day_of_week, end_after_days, end_mode, badge_image_url')
        .in('id', routineIds)
        .eq('is_challenge', true);

      if (rError) throw rError;
      if (!routines?.length) return [];

      // 3. Get task titles per routine for completion tracking
      const { data: routineTasks, error: tError } = await supabase
        .from('routines_bank_tasks')
        .select('routine_id, title')
        .in('routine_id', routines.map(r => r.id));

      if (tError) throw tError;

      const taskTitlesByRoutine = new Map<string, string[]>();
      (routineTasks || []).forEach(t => {
        const titles = taskTitlesByRoutine.get(t.routine_id) || [];
        titles.push(t.title);
        taskTitlesByRoutine.set(t.routine_id, titles);
      });

      const addedAtMap = new Map(userRoutines.map(r => [r.routine_id, r.added_at]));
      const today = new Date();
      const todayStr = getLocalDateStr();
      const challenges: UserChallenge[] = [];

      for (const routine of routines) {
        const titles = taskTitlesByRoutine.get(routine.id) || [];
        const addedAt = addedAtMap.get(routine.id) || '';
        
        // Determine totalDays from end_after_days (the 28-day challenge duration),
        // falling back to task count only if not set
        const totalDays = routine.end_after_days || titles.length || 0;

        // Compute the actual start date for this challenge
        let computedStartDate: string | null = null;
        let hasStarted = true;

        if (routine.challenge_start_date) {
          // Admin set a specific start date
          computedStartDate = routine.challenge_start_date;
          hasStarted = todayStr >= routine.challenge_start_date;
        } else if (routine.start_day_of_week !== null && routine.start_day_of_week !== undefined) {
          // "Day of week" mode - find the next occurrence from when user adopted
          const adoptionDate = addedAt ? new Date(addedAt) : today;
          const startDate = getNextDayOfWeek(routine.start_day_of_week, adoptionDate);
          const y = startDate.getFullYear();
          const m = String(startDate.getMonth() + 1).padStart(2, '0');
          const d = String(startDate.getDate()).padStart(2, '0');
          computedStartDate = `${y}-${m}-${d}`;
          hasStarted = todayStr >= computedStartDate;
        }
        // else: "Immediately" mode → hasStarted = true, computedStartDate = addedAt

        // Count completions using source_routine_id instead of title-matching
        let completedDays = 0;
        if (hasStarted) {
          const { data: matchingUserTasks } = await supabase
            .from('user_tasks')
            .select('id')
            .eq('user_id', user.id)
            .eq('source_routine_id', routine.id)
            .eq('is_active', true);

          const matchingTaskIds = (matchingUserTasks || []).map(t => t.id);

          if (matchingTaskIds.length > 0) {
            const { data: completions } = await supabase
              .from('task_completions')
              .select('task_id')
              .eq('user_id', user.id)
              .in('task_id', matchingTaskIds);

            completedDays = (completions || []).length;
          }
        }

        challenges.push({
          routineId: routine.id,
          title: routine.title,
          emoji: routine.emoji || '✨',
          totalDays,
          completedDays: Math.min(completedDays, totalDays),
          challengeStartDate: routine.challenge_start_date,
          startDayOfWeek: routine.start_day_of_week,
          endAfterDays: routine.end_after_days,
          addedAt,
          computedStartDate,
          hasStarted,
          badgeImageUrl: (routine as any).badge_image_url || null,
        });
      }

      return challenges;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}
