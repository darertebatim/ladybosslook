import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, subDays, isEqual, parseISO } from 'date-fns';

// ============================================
// TYPES
// ============================================

export interface UserTask {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  color: TaskColor;
  scheduled_date: string | null;
  scheduled_time: string | null;
  repeat_pattern: RepeatPattern;
  repeat_days: number[];
  reminder_enabled: boolean;
  reminder_offset: number;
  tag: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubtask {
  id: string;
  task_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
}

export interface SubtaskCompletion {
  id: string;
  subtask_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date: string | null;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  emoji: string;
  color: TaskColor;
  category: TemplateCategory;
  description: string | null;
  suggested_time: string | null;
  repeat_pattern: RepeatPattern;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserTag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export type TaskColor = 'pink' | 'peach' | 'yellow' | 'lime' | 'sky' | 'mint' | 'lavender' | 'purple' | 'blue' | 'red' | 'orange' | 'green';
export type RepeatPattern = 'none' | 'daily' | 'weekly' | 'monthly' | 'weekend' | 'custom';
export type TemplateCategory = 'morning' | 'evening' | 'selfcare' | 'business' | 'wellness';

export interface CreateTaskInput {
  title: string;
  emoji?: string;
  color?: TaskColor;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  repeat_pattern?: RepeatPattern;
  repeat_days?: number[];
  reminder_enabled?: boolean;
  reminder_offset?: number;
  tag?: string | null;
  subtasks?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  is_active?: boolean;
  order_index?: number;
}

// Color mapping for UI - Me+ style vibrant pastels
export const TASK_COLORS: Record<TaskColor, string> = {
  pink: 'hsl(330 100% 85%)',      // Vibrant pink like Me+
  peach: 'hsl(30 100% 82%)',      // Warm peachy orange
  yellow: 'hsl(48 100% 72%)',     // Bright sunny yellow
  lime: 'hsl(85 70% 78%)',        // Fresh lime green
  sky: 'hsl(210 100% 85%)',       // Soft sky blue
  mint: 'hsl(155 65% 80%)',       // Cool mint
  lavender: 'hsl(270 80% 88%)',   // Soft lavender
  purple: 'hsl(280 75% 85%)',     // Light purple
  blue: 'hsl(220 90% 85%)',       // Bright blue
  red: 'hsl(0 85% 85%)',          // Soft coral red
  orange: 'hsl(25 100% 80%)',     // Warm orange
  green: 'hsl(140 65% 78%)',      // Fresh green
};

export const TASK_COLOR_CLASSES: Record<TaskColor, string> = {
  pink: 'bg-[hsl(330,100%,85%)]',
  peach: 'bg-[hsl(30,100%,82%)]',
  yellow: 'bg-[hsl(48,100%,72%)]',
  lime: 'bg-[hsl(85,70%,78%)]',
  sky: 'bg-[hsl(210,100%,85%)]',
  mint: 'bg-[hsl(155,65%,80%)]',
  lavender: 'bg-[hsl(270,80%,88%)]',
  purple: 'bg-[hsl(280,75%,85%)]',
  blue: 'bg-[hsl(220,90%,85%)]',
  red: 'bg-[hsl(0,85%,85%)]',
  orange: 'bg-[hsl(25,100%,80%)]',
  green: 'bg-[hsl(140,65%,78%)]',
};

// ============================================
// HOOKS - QUERIES
// ============================================

/**
 * Get tasks for a specific date (including repeating tasks)
 */
export const useTasksForDate = (date: Date) => {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay(); // 0 = Sunday

  return useQuery({
    queryKey: ['planner-tasks', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all active tasks
      const { data: tasks, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Filter tasks that apply to this date
      return (tasks as UserTask[]).filter(task => {
        // Non-repeating tasks - only show on scheduled date
        if (task.repeat_pattern === 'none') {
          return task.scheduled_date === dateStr;
        }

        // Daily tasks - always show
        if (task.repeat_pattern === 'daily') return true;

        // Weekend tasks - only Sat/Sun
        if (task.repeat_pattern === 'weekend') {
          return dayOfWeek === 0 || dayOfWeek === 6;
        }

        // Weekly tasks - show on same day of week as original
        if (task.repeat_pattern === 'weekly' && task.scheduled_date) {
          const originalDay = parseISO(task.scheduled_date).getDay();
          return dayOfWeek === originalDay;
        }

        // Monthly tasks - show on same day of month
        if (task.repeat_pattern === 'monthly' && task.scheduled_date) {
          const originalDate = parseISO(task.scheduled_date).getDate();
          return date.getDate() === originalDate;
        }

        // Custom - check repeat_days array
        if (task.repeat_pattern === 'custom' && task.repeat_days) {
          return task.repeat_days.includes(dayOfWeek);
        }

        return false;
      });
    },
    enabled: !!user?.id,
  });
};

/**
 * Get subtasks for a task
 */
export const useSubtasks = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['planner-subtasks', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('user_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as UserSubtask[];
    },
    enabled: !!taskId,
  });
};

/**
 * Get completions for a specific date
 */
export const useCompletionsForDate = (date: Date) => {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planner-completions', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return { tasks: [], subtasks: [] };

      const [tasksResult, subtasksResult] = await Promise.all([
        supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed_date', dateStr),
        supabase
          .from('subtask_completions')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed_date', dateStr),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (subtasksResult.error) throw subtasksResult.error;

      return {
        tasks: tasksResult.data as TaskCompletion[],
        subtasks: subtasksResult.data as SubtaskCompletion[],
      };
    },
    enabled: !!user?.id,
  });
};

/**
 * Get dates that have at least one task completion within a date range
 */
export const useCompletedDates = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planner-completed-dates', user?.id, startStr, endStr],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('task_completions')
        .select('completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', startStr)
        .lte('completed_date', endStr);

      if (error) throw error;
      
      return new Set(data.map(c => c.completed_date));
    },
    enabled: !!user?.id,
  });
};

/**
 * Get user's current streak
 */
export const useUserStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planner-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserStreak | null;
    },
    enabled: !!user?.id,
  });
};

/**
 * Get user's tags
 */
export const useUserTags = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planner-tags', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as UserTag[];
    },
    enabled: !!user?.id,
  });
};

/**
 * Get task templates
 */
export const useTaskTemplates = (category?: TemplateCategory) => {
  return useQuery({
    queryKey: ['planner-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('task_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskTemplate[];
    },
  });
};

/**
 * Get a single task by ID
 */
export const useTask = (taskId: string | undefined) => {
  return useQuery({
    queryKey: ['planner-task', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data as UserTask;
    },
    enabled: !!taskId,
  });
};

// ============================================
// HOOKS - MUTATIONS
// ============================================

/**
 * Create a new task
 */
export const useCreateTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { subtasks, ...taskData } = input;

      // Create the task
      const { data: task, error: taskError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          emoji: taskData.emoji || '☀️',
          color: taskData.color || 'yellow',
          scheduled_date: taskData.scheduled_date || null,
          scheduled_time: taskData.scheduled_time || null,
          repeat_pattern: taskData.repeat_pattern || 'none',
          repeat_days: taskData.repeat_days || [],
          reminder_enabled: taskData.reminder_enabled || false,
          reminder_offset: taskData.reminder_offset || 0,
          tag: taskData.tag || null,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create subtasks if provided
      if (subtasks && subtasks.length > 0) {
        const subtaskData = subtasks.map((title, index) => ({
          task_id: task.id,
          title,
          order_index: index,
        }));

        const { error: subtaskError } = await supabase
          .from('user_subtasks')
          .insert(subtaskData);

        if (subtaskError) throw subtaskError;
      }

      return task as UserTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      toast({ title: 'Task created! ✨' });
    },
    onError: (error) => {
      console.error('Create task error:', error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
    },
  });
};

/**
 * Update a task
 */
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const { id, subtasks, ...updates } = input;

      const { data, error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['planner-task', data.id] });
    },
    onError: (error) => {
      console.error('Update task error:', error);
      toast({ title: 'Failed to update task', variant: 'destructive' });
    },
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      toast({ title: 'Task deleted' });
    },
    onError: (error) => {
      console.error('Delete task error:', error);
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    },
  });
};

/**
 * Complete a task for a specific date
 */
export const useCompleteTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      // Insert completion
      const { data, error } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          user_id: user.id,
          completed_date: dateStr,
        })
        .select()
        .single();

      if (error) throw error;

      // Update streak
      const streakResult = await updateStreak(user.id, dateStr);

      return { completion: data, streakIncreased: streakResult.increased };
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
    },
    onError: (error) => {
      console.error('Complete task error:', error);
    },
  });
};

/**
 * Uncomplete a task for a specific date
 */
export const useUncompleteTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('completed_date', dateStr);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
    },
    onError: (error) => {
      console.error('Uncomplete task error:', error);
    },
  });
};

/**
 * Complete a subtask
 */
export const useCompleteSubtask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subtaskId, date }: { subtaskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('subtask_completions')
        .insert({
          subtask_id: subtaskId,
          user_id: user.id,
          completed_date: dateStr,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
    },
    onError: (error) => {
      console.error('Complete subtask error:', error);
    },
  });
};

/**
 * Uncomplete a subtask
 */
export const useUncompleteSubtask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subtaskId, date }: { subtaskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('subtask_completions')
        .delete()
        .eq('subtask_id', subtaskId)
        .eq('user_id', user.id)
        .eq('completed_date', dateStr);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
    },
    onError: (error) => {
      console.error('Uncomplete subtask error:', error);
    },
  });
};

/**
 * Create a tag
 */
export const useCreateTag = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user.id,
          name,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tags'] });
    },
    onError: (error) => {
      console.error('Create tag error:', error);
      toast({ title: 'Failed to create tag', variant: 'destructive' });
    },
  });
};

/**
 * Create task from template
 */
export const useCreateTaskFromTemplate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ template, date }: { template: TaskTemplate; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: template.title,
          emoji: template.emoji,
          color: template.color,
          scheduled_date: format(date, 'yyyy-MM-dd'),
          scheduled_time: template.suggested_time,
          repeat_pattern: template.repeat_pattern,
          tag: template.category,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      toast({ title: 'Task added from template! ✨' });
    },
    onError: (error) => {
      console.error('Create from template error:', error);
      toast({ title: 'Failed to add task', variant: 'destructive' });
    },
  });
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update user streak on task completion
 */
async function updateStreak(userId: string, completedDateStr: string): Promise<{ increased: boolean }> {
  // Get current streak
  const { data: streak } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const today = completedDateStr;
  const yesterday = format(subDays(parseISO(completedDateStr), 1), 'yyyy-MM-dd');

  if (!streak) {
    // First completion ever - create streak
    await supabase.from('user_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_completion_date: today,
    });
    return { increased: true };
  }

  // If already completed today, no change
  if (streak.last_completion_date === today) {
    return { increased: false };
  }

  // If completed yesterday, increment streak
  if (streak.last_completion_date === yesterday) {
    const newStreak = streak.current_streak + 1;
    const newLongest = Math.max(newStreak, streak.longest_streak);

    await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_completion_date: today,
      })
      .eq('user_id', userId);

    return { increased: true };
  }

  // Otherwise, reset streak to 1
  await supabase
    .from('user_streaks')
    .update({
      current_streak: 1,
      last_completion_date: today,
    })
    .eq('user_id', userId);

  return { increased: true };
}
