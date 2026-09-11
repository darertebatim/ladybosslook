import { QueryClient } from '@tanstack/react-query';
import { updateStreak } from '@/hooks/useTaskPlanner';
import { getLocalDateStr } from '@/lib/localDate';

/**
 * Streak activity sources.
 *
 * The streak used to only move when a planner task was checked off.
 * Now ANY meaningful action on the Path keeps the day alive:
 *  - task completion (planner / routine player)
 *  - event tasks on the Path (program, course, playlist events)
 *  - Check In (mood check-in, breathing, reflection/journal)
 *  - course progress (finishing a lesson)
 *  - tools activity (focus timer, breathe, journal)
 *
 * Rule: any ONE action in a local day counts. It never decreases a streak.
 */
export type StreakActivitySource =
  | 'task'
  | 'event'
  | 'mood'
  | 'lesson'
  | 'journal'
  | 'breathe'
  | 'focus'
  | 'routine';

/**
 * Mark today as an active day for the streak. Safe to call many times a day —
 * updateStreak is a no-op once today is already recorded.
 */
export async function recordStreakActivity(
  userId: string | undefined,
  source: StreakActivitySource,
  queryClient?: QueryClient,
): Promise<void> {
  if (!userId) return;
  try {
    const result = await updateStreak(userId, getLocalDateStr());
    if (result.increased && queryClient) {
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      queryClient.invalidateQueries({ queryKey: ['nav-streak'] });
      queryClient.invalidateQueries({ queryKey: ['presence-stats'] });
      queryClient.invalidateQueries({ queryKey: ['today-path'] });
    }
  } catch (e) {
    console.warn('[streak] failed to record activity from', source, e);
  }
}
