import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ProLinkType } from '@/lib/proTaskTypes';

/**
 * Hook to auto-complete pro tasks when user performs the related action.
 * For example:
 * - When user writes a journal entry → complete all 'journal' pro tasks for today
 * - When user completes an audio track → complete all 'playlist' pro tasks linked to that playlist
 * 
 * Also handles goal progress: if the task has a count goal, it increments goal_progress.
 */
export const useAutoCompleteProTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Auto-complete pro tasks of a specific type for today
   * @param linkType - The pro_link_type (e.g., 'journal', 'playlist')
   * @param linkValue - Optional: specific pro_link_value to match (e.g., playlist ID)
   */
  const autoComplete = useCallback(async (
    linkType: ProLinkType,
    linkValue?: string | null
  ): Promise<number> => {
    if (!user?.id) return 0;

    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Find all active pro tasks of this type that are scheduled for today
      let query = supabase
        .from('user_tasks')
        .select('id, title, pro_link_type, pro_link_value, scheduled_date, repeat_pattern, repeat_days, goal_enabled, goal_type, goal_target')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('pro_link_type', linkType);

      // If linkValue is provided, match it specifically (for playlist tasks)
      if (linkValue) {
        query = query.eq('pro_link_value', linkValue);
      }

      const { data: tasks, error: tasksError } = await query;

      if (tasksError) {
        console.error('Error finding pro tasks:', tasksError);
        return 0;
      }

      if (!tasks || tasks.length === 0) return 0;

      // Filter tasks that are applicable for today
      const applicableTasks = tasks.filter(task => {
        // Check if task is scheduled for today
        if (task.scheduled_date === today) return true;

        // Check repeating tasks
        if (task.repeat_pattern) {
          const dayOfWeek = new Date().getDay(); // 0 = Sunday
          
          if (task.repeat_pattern === 'daily') return true;
          
          if (task.repeat_pattern === 'weekly' && task.repeat_days) {
            // repeat_days is array of day numbers (0-6)
            return (task.repeat_days as number[]).includes(dayOfWeek);
          }
          
          if (task.repeat_pattern === 'weekdays') {
            return dayOfWeek >= 1 && dayOfWeek <= 5;
          }
        }

        return false;
      });

      if (applicableTasks.length === 0) return 0;

      // Get existing completions for today to check progress
      const taskIds = applicableTasks.map(t => t.id);
      const { data: existingCompletions } = await supabase
        .from('task_completions')
        .select('task_id, goal_progress')
        .eq('user_id', user.id)
        .eq('completed_date', today)
        .in('task_id', taskIds);

      const completionMap = new Map(existingCompletions?.map(c => [c.task_id, c.goal_progress || 0]) || []);
      
      let tasksCompleted = 0;

      for (const task of applicableTasks) {
        const currentProgress = completionMap.get(task.id) || 0;
        const hasGoal = task.goal_enabled && task.goal_target && task.goal_target > 0;
        const isCountGoal = hasGoal && task.goal_type === 'count';
        
        if (isCountGoal) {
          // For count goals, increment progress by 1
          const newProgress = currentProgress + 1;
          
          if (completionMap.has(task.id)) {
            // Update existing completion with incremented progress
            await supabase
              .from('task_completions')
              .update({ goal_progress: newProgress })
              .eq('task_id', task.id)
              .eq('user_id', user.id)
              .eq('completed_date', today);
          } else {
            // Insert new completion with progress = 1
            await supabase
              .from('task_completions')
              .insert({
                task_id: task.id,
                user_id: user.id,
                completed_date: today,
                goal_progress: 1,
              });
          }
          tasksCompleted++;
        } else {
          // For non-goal tasks, just mark complete if not already
          if (!completionMap.has(task.id)) {
            await supabase
              .from('task_completions')
              .insert({
                task_id: task.id,
                user_id: user.id,
                completed_date: today,
              });
            tasksCompleted++;
          }
        }
      }

      if (tasksCompleted > 0) {
        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: ['planner-completions', user.id, today] });
        queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
        queryClient.invalidateQueries({ queryKey: ['planner-streak'] });

        console.log(`Auto-completed/progressed ${tasksCompleted} pro task(s) for ${linkType}`);
      }
      
      return tasksCompleted;
    } catch (error) {
      console.error('Error in autoComplete:', error);
      return 0;
    }
  }, [user?.id, queryClient]);

  /**
   * Auto-complete journal pro tasks
   */
  const autoCompleteJournal = useCallback(async (): Promise<number> => {
    return autoComplete('journal');
  }, [autoComplete]);

  /**
   * Auto-complete playlist pro tasks for a specific playlist
   */
  const autoCompletePlaylist = useCallback(async (playlistId: string): Promise<number> => {
    return autoComplete('playlist', playlistId);
  }, [autoComplete]);

  /**
   * Auto-complete breathing pro tasks for a specific exercise
   */
  const autoCompleteBreathe = useCallback(async (exerciseId: string): Promise<number> => {
    return autoComplete('breathe', exerciseId);
  }, [autoComplete]);

  return {
    autoComplete,
    autoCompleteJournal,
    autoCompletePlaylist,
    autoCompleteBreathe,
  };
};
