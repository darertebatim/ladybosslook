import { supabase } from '@/integrations/supabase/client';

const MIN_HISTORY_COUNT = 3;
const FALLBACK_SECONDS = 60; // 1 minute

export interface SmartEstimateInput {
  taskTitle: string;
  durationMinutes: number | null;
  goalType: string | null;
  goalTarget: number | null;
}

/**
 * Fetch smart time estimates for non-timer tasks.
 * Waterfall: user history avg (3+ completions) → duration_minutes → 60s fallback.
 * Timer-goal tasks are excluded (they use goalTarget directly).
 */
export async function fetchSmartEstimates(
  userId: string,
  tasks: SmartEstimateInput[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  // Collect titles of non-timer tasks that need estimates
  const nonTimerTitles = tasks
    .filter(t => t.goalType !== 'timer')
    .map(t => t.taskTitle);

  if (nonTimerTitles.length === 0) return result;

  // Batch query: get user's average actual_seconds per task title from routine_session_tasks
  const { data: historyData } = await supabase
    .from('routine_session_tasks')
    .select('task_title, actual_seconds, status')
    .eq('status', 'completed')
    .in('task_title', nonTimerTitles)
    // Filter by session ownership
    .order('task_title');

  // We need to filter by user — routine_session_tasks doesn't have user_id directly,
  // so we join through routine_sessions. Let's use a different approach:
  // Query via routine_sessions join
  const { data: userHistory } = await supabase
    .from('routine_sessions')
    .select(`
      user_id,
      routine_session_tasks!inner(task_title, actual_seconds, status)
    `)
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  // Build averages map
  const titleStats = new Map<string, number[]>();
  
  if (userHistory) {
    for (const session of userHistory) {
      const tasks = (session as any).routine_session_tasks || [];
      for (const task of tasks) {
        if (task.status !== 'completed' || !nonTimerTitles.includes(task.task_title)) continue;
        if (!titleStats.has(task.task_title)) titleStats.set(task.task_title, []);
        titleStats.get(task.task_title)!.push(task.actual_seconds);
      }
    }
  }

  // Apply waterfall for each task
  for (const task of tasks) {
    if (task.goalType === 'timer') continue; // timer tasks use goalTarget directly

    const history = titleStats.get(task.taskTitle);
    
    if (history && history.length >= MIN_HISTORY_COUNT) {
      // Use user's personal average
      const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
      result.set(task.taskTitle, avg);
    } else if (task.durationMinutes && task.durationMinutes > 0) {
      // Use admin-set duration
      result.set(task.taskTitle, task.durationMinutes * 60);
    } else {
      // Fallback: 1 minute
      result.set(task.taskTitle, FALLBACK_SECONDS);
    }
  }

  return result;
}
