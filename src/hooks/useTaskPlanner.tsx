import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, subDays, isEqual, parseISO } from 'date-fns';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';
import { scheduleUrgentAlarm, cancelUrgentAlarms, isUrgentAlarmAvailable } from '@/lib/taskAlarm';
import { scheduleTaskReminder, cancelTaskReminder, isLocalNotificationsAvailable } from '@/lib/localNotifications';
import { getTimePeriodSortOrder, TimePeriod } from '@/lib/taskScheduling';
import { updatePresence } from '@/hooks/useUserPresence';

// ============================================
// TYPES
// ============================================

export interface UserTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: TaskColor;
  scheduled_date: string | null;
  scheduled_time: string | null;
  time_period: TimePeriod | null;
  repeat_pattern: RepeatPattern;
  repeat_days: number[];
  reminder_enabled: boolean;
  reminder_offset: number;
  is_urgent: boolean;
  tag: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  linked_playlist_id: string | null;
  // Pro Task fields
  pro_link_type: 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | null;
  pro_link_value: string | null;
  // Goal tracking fields
  goal_enabled: boolean;
  goal_type: 'timer' | 'count' | null;
  goal_target: number | null;
  goal_unit: string | null;
  // Joined data (optional, populated by queries)
  linked_playlist?: {
    id: string;
    name: string;
    cover_image_url: string | null;
  } | null;
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
  goal_progress: number;
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
  // Streak goal challenge fields
  streak_goal: number | null;
  streak_goal_set_at: string | null;
}

export interface TaskTemplate {
  id: string;
  title: string;
  emoji: string;
  color: TaskColor;
  category: string;
  description: string | null;
  repeat_pattern: RepeatPattern;
  repeat_days: number[] | null;
  sort_order: number;
  is_active: boolean;
  is_popular: boolean;
  pro_link_type: string | null;
  pro_link_value: string | null;
  goal_enabled: boolean;
  goal_type: string | null;
  goal_target: number | null;
  goal_unit: string | null;
  tag: string | null;
  linked_playlist_id: string | null;
  time_period: string | null;
  created_at: string;
  updated_at: string;
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
  description?: string | null;
  emoji?: string;
  color?: TaskColor;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  time_period?: TimePeriod | null;
  repeat_pattern?: RepeatPattern;
  repeat_days?: number[];
  reminder_enabled?: boolean;
  reminder_offset?: number;
  is_urgent?: boolean;
  tag?: string | null;
  subtasks?: string[];
  linked_playlist_id?: string | null;
  pro_link_type?: 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | null;
  pro_link_value?: string | null;
  goal_enabled?: boolean;
  goal_type?: 'timer' | 'count' | null;
  goal_target?: number | null;
  goal_unit?: string | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  description?: string | null;
  is_active?: boolean;
  order_index?: number;
  is_urgent?: boolean;
  linked_playlist_id?: string | null;
  pro_link_type?: 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | null;
  pro_link_value?: string | null;
  time_period?: TimePeriod | null;
}

// Color mapping for UI - Me+ style brighter pastels
// Palette: FFD6E8, FFE4C4, FFF59D, E8F5A3, C5E8FA, B8F5E4, E8D4F8
export const TASK_COLORS: Record<TaskColor, string> = {
  pink: '#FFD6E8',      // Bright pink
  peach: '#FFE4C4',     // Warm peach
  yellow: '#FFF59D',    // Bright sunny yellow
  lime: '#E8F5A3',      // Fresh lime
  sky: '#C5E8FA',       // Cyan sky blue
  mint: '#B8F5E4',      // Vibrant mint
  lavender: '#E8D4F8',  // Soft lavender
  purple: '#E8D4F8',    // Same as lavender
  blue: '#C5E8FA',      // Same as sky
  red: '#FFD6E8',       // Use pink for red
  orange: '#FFE4C4',    // Use peach for orange
  green: '#E8F5A3',     // Use lime for green
};

export const TASK_COLOR_CLASSES: Record<TaskColor, string> = {
  pink: 'bg-[#FFD6E8]',
  peach: 'bg-[#FFE4C4]',
  yellow: 'bg-[#FFF59D]',
  lime: 'bg-[#E8F5A3]',
  sky: 'bg-[#C5E8FA]',
  mint: 'bg-[#B8F5E4]',
  lavender: 'bg-[#E8D4F8]',
  purple: 'bg-[#E8D4F8]',
  blue: 'bg-[#C5E8FA]',
  red: 'bg-[#FFD6E8]',
  orange: 'bg-[#FFE4C4]',
  green: 'bg-[#E8F5A3]',
};

// ============================================
// HOOKS - QUERIES
// ============================================

/**
 * Get ALL active tasks (cached) - base query that rarely refetches
 */
export const useAllActiveTasks = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planner-all-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: tasks, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name, cover_image_url)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return tasks as UserTask[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes - tasks rarely change
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 min
  });
};

/**
 * Get tasks for a specific date (filters from cached all-tasks)
 * This is instant after initial load since it reuses cached data
 */
export const useTasksForDate = (date: Date) => {
  const { data: allTasks = [], isLoading } = useAllActiveTasks();
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Filter tasks that apply to this date - computed from cached data
  const tasksForDate = allTasks.filter(task => taskAppliesToDate(task, dateStr));

  // Sort tasks: specific times first (chronologically), then time periods (by category order), then Anytime by order_index
  const sortedTasks = [...tasksForDate].sort((a, b) => {
    const aHasTime = !!a.scheduled_time;
    const bHasTime = !!b.scheduled_time;
    const aHasPeriod = !!a.time_period;
    const bHasPeriod = !!b.time_period;
    
    // Both have specific times - sort chronologically
    if (aHasTime && bHasTime) {
      return a.scheduled_time!.localeCompare(b.scheduled_time!);
    }
    
    // Specific time comes before time_period and Anytime
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    
    // Both have time_periods - sort by category order
    if (aHasPeriod && bHasPeriod) {
      const aOrder = getTimePeriodSortOrder(a.time_period);
      const bOrder = getTimePeriodSortOrder(b.time_period);
      if (aOrder !== bOrder) return aOrder - bOrder;
      // Same period - sort by order_index
      return a.order_index - b.order_index;
    }
    
    // Time period before Anytime
    if (aHasPeriod && !bHasPeriod) return -1;
    if (!aHasPeriod && bHasPeriod) return 1;
    
    // Both Anytime - sort by order_index
    return a.order_index - b.order_index;
  });

  return {
    data: sortedTasks,
    isLoading,
  };
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
    staleTime: 1000 * 30, // 30 seconds - completions change more often
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
 * Get task templates from admin_task_bank (single source of truth)
 */
export const useTaskTemplates = (category?: string) => {
  return useQuery({
    queryKey: ['planner-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('admin_task_bank')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TaskTemplate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - refresh on app reopen
    refetchOnMount: 'always', // Always refetch when component mounts
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
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name, cover_image_url)
        `)
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
          description: taskData.description || null,
          emoji: taskData.emoji || '☀️',
          color: taskData.color || 'yellow',
          scheduled_date: taskData.scheduled_date || null,
          scheduled_time: taskData.scheduled_time || null,
          repeat_pattern: taskData.repeat_pattern || 'none',
          repeat_days: taskData.repeat_days || [],
          reminder_enabled: taskData.reminder_enabled || false,
          reminder_offset: taskData.reminder_offset || 0,
          is_urgent: taskData.is_urgent || false,
          tag: taskData.tag || null,
          linked_playlist_id: taskData.linked_playlist_id || null,
          pro_link_type: taskData.pro_link_type || null,
          pro_link_value: taskData.pro_link_value || null,
          goal_enabled: taskData.goal_enabled || false,
          goal_type: taskData.goal_type || null,
          goal_target: taskData.goal_target || null,
          goal_unit: taskData.goal_unit || null,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Schedule local notification reminder if enabled (non-urgent tasks)
      if (taskData.reminder_enabled && taskData.scheduled_time && taskData.scheduled_date && !taskData.is_urgent && isLocalNotificationsAvailable()) {
        const reminderResult = await scheduleTaskReminder({
          taskId: task.id,
          title: taskData.title,
          emoji: taskData.emoji || '☀️',
          scheduledDate: taskData.scheduled_date,
          scheduledTime: taskData.scheduled_time,
          reminderOffset: taskData.reminder_offset || 0,
          repeatPattern: taskData.repeat_pattern || 'none',
          repeatDays: taskData.repeat_days,
          proLinkType: taskData.pro_link_type,
          proLinkValue: taskData.pro_link_value,
        });
        
        if (!reminderResult.success && reminderResult.error) {
          console.warn('[CreateTask] Local notification scheduling failed:', reminderResult.error);
        }
      }

      // Schedule urgent alarm if enabled (uses Calendar for loud alarms)
      // For recurring tasks, this schedules 7 days of alarms
      if (taskData.is_urgent && taskData.scheduled_time && isUrgentAlarmAvailable()) {
        const alarmResult = await scheduleUrgentAlarm({
          taskId: task.id,
          title: taskData.title,
          emoji: taskData.emoji || '☀️',
          scheduledDate: taskData.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
          scheduledTime: taskData.scheduled_time,
          reminderOffset: taskData.reminder_offset || 0,
          repeatPattern: taskData.repeat_pattern || 'none',
          repeatDays: taskData.repeat_days,
        });
        
        if (!alarmResult.success && alarmResult.error) {
          console.warn('[CreateTask] Urgent alarm scheduling failed:', alarmResult.error);
        } else if (alarmResult.scheduledCount) {
          console.log(`[CreateTask] Scheduled ${alarmResult.scheduledCount} urgent alarms`);
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      toast({ title: 'Action created! ✨' });
    },
    onError: (error) => {
      console.error('Create task error:', error);
      toast({ title: 'Failed to create action', variant: 'destructive' });
    },
  });
};

/**
 * Quick-add a playlist task directly (no Pro Routine needed)
 */
export const useQuickAddPlaylistTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      playlistId, 
      playlistName,
      scheduledTime,
      repeatPattern,
      color,
      icon,
    }: { 
      playlistId: string; 
      playlistName: string;
      scheduledTime?: string | null;
      repeatPattern?: RepeatPattern;
      color?: TaskColor;
      icon?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: playlistName,
          emoji: icon || '🎧',
          color: (color || 'sky') as TaskColor,
          repeat_pattern: (repeatPattern || 'daily') as RepeatPattern,
          repeat_days: [],
          scheduled_time: scheduledTime || null,
          pro_link_type: 'playlist' as const,
          pro_link_value: playlistId,
          linked_playlist_id: playlistId,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-task-exists'] });
      toast({ title: 'Added to your rituals! 🎧' });
    },
    onError: (error) => {
      console.error('Quick add playlist task error:', error);
      toast({ title: 'Failed to add to rituals', variant: 'destructive' });
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

      // Cancel existing local notification and urgent alarms before updating
      if (isLocalNotificationsAvailable()) {
        await cancelTaskReminder(id);
      }
      
      // Cancel existing urgent alarms (will be rescheduled if still urgent)
      if (isUrgentAlarmAvailable()) {
        await cancelUrgentAlarms(id);
      }

      // Update the task
      const { data, error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const task = data as UserTask;

      // Reschedule local notification if reminder is enabled (non-urgent)
      if (task.reminder_enabled && task.scheduled_time && task.scheduled_date && !task.is_urgent && isLocalNotificationsAvailable()) {
        await scheduleTaskReminder({
          taskId: task.id,
          title: task.title,
          emoji: task.emoji,
          scheduledDate: task.scheduled_date,
          scheduledTime: task.scheduled_time,
          reminderOffset: task.reminder_offset,
          repeatPattern: task.repeat_pattern,
          repeatDays: task.repeat_days,
          proLinkType: task.pro_link_type,
          proLinkValue: task.pro_link_value,
        });
      }

      // Schedule urgent alarm if enabled (uses Calendar for loud alarms)
      // For recurring tasks, this schedules 7 days of alarms
      if (task.is_urgent && task.scheduled_time && isUrgentAlarmAvailable()) {
        const alarmResult = await scheduleUrgentAlarm({
          taskId: task.id,
          title: task.title,
          emoji: task.emoji,
          scheduledDate: task.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
          scheduledTime: task.scheduled_time,
          reminderOffset: task.reminder_offset,
          repeatPattern: task.repeat_pattern,
          repeatDays: task.repeat_days,
        });
        
        if (!alarmResult.success) {
          console.warn('[UpdateTask] Urgent alarm not scheduled:', alarmResult.error);
        } else if (alarmResult.scheduledCount) {
          console.log(`[UpdateTask] Scheduled ${alarmResult.scheduledCount} urgent alarms`);
        }
      }

      // If subtasks are provided, replace existing subtasks
      if (subtasks !== undefined) {
        // Delete existing subtasks
        const { error: deleteError } = await supabase
          .from('user_subtasks')
          .delete()
          .eq('task_id', id);

        if (deleteError) throw deleteError;

        // Insert new subtasks if any
        if (subtasks.length > 0) {
          const subtaskData = subtasks.map((title, index) => ({
            task_id: id,
            title,
            order_index: index,
          }));

          const { error: subtaskError } = await supabase
            .from('user_subtasks')
            .insert(subtaskData);

          if (subtaskError) throw subtaskError;
        }
      }

      return task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['planner-task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['planner-subtasks', data.id] });
    },
    onError: (error) => {
      console.error('Update task error:', error);
      toast({ title: 'Failed to update action', variant: 'destructive' });
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
      // Cancel local notification before deleting
      if (isLocalNotificationsAvailable()) {
        await cancelTaskReminder(taskId);
      }

      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      toast({ title: 'Action deleted' });
    },
    onError: (error) => {
      console.error('Delete task error:', error);
      toast({ title: 'Failed to delete action', variant: 'destructive' });
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
      
      // Update presence metrics
      await updatePresence(user.id, dateStr);

      return { completion: data, streakIncreased: streakResult.increased };
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      // Ensure Home stats (including totalCompletions) update immediately
      queryClient.invalidateQueries({ queryKey: ['new-home-data', user?.id] });
      // Update weekly task completion badges
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
      // Update presence stats
      queryClient.invalidateQueries({ queryKey: ['user-presence'] });
      queryClient.invalidateQueries({ queryKey: ['presence-stats'] });
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
      // Update weekly task completion badges
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
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
 * Add goal progress for a task on a specific date (with custom amount)
 */
export const useAddGoalProgress = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date, amount }: { taskId: string; date: Date; amount: number }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      // Check if completion exists for this date
      const { data: existing } = await supabase
        .from('task_completions')
        .select('id, goal_progress')
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('completed_date', dateStr)
        .maybeSingle();

      if (existing) {
        // Update existing completion with added amount
        const newProgress = (existing.goal_progress || 0) + amount;
        const { data, error } = await supabase
          .from('task_completions')
          .update({ goal_progress: newProgress })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return { completion: data, newProgress, addedAmount: amount };
      } else {
        // Create new completion with goal_progress = amount
        const { data, error } = await supabase
          .from('task_completions')
          .insert({
            task_id: taskId,
            user_id: user.id,
            completed_date: dateStr,
            goal_progress: amount,
          })
          .select()
          .single();

        if (error) throw error;
        
        // Update streak
        const streakResult = await updateStreak(user.id, dateStr);
        
        // Update presence metrics
        await updatePresence(user.id, dateStr);
        
        return { completion: data, newProgress: amount, addedAmount: amount, streakIncreased: streakResult.increased };
      }
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      // Update presence stats
      queryClient.invalidateQueries({ queryKey: ['user-presence'] });
      queryClient.invalidateQueries({ queryKey: ['presence-stats'] });
    },
    onError: (error) => {
      console.error('Add goal progress error:', error);
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
          scheduled_time: null, // admin_task_bank doesn't have suggested_time
          repeat_pattern: template.repeat_pattern,
          repeat_days: template.repeat_days || [],
          tag: template.tag || template.category,
          pro_link_type: template.pro_link_type as any,
          pro_link_value: template.pro_link_value,
          linked_playlist_id: template.linked_playlist_id,
          goal_enabled: template.goal_enabled || false,
          goal_type: template.goal_type as any,
          goal_target: template.goal_target,
          goal_unit: template.goal_unit,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      toast({ title: 'Action added from template! ✨' });
    },
    onError: (error) => {
      console.error('Create from template error:', error);
      toast({ title: 'Failed to add action', variant: 'destructive' });
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

/**
 * Complete reset - like day one fresh start (admin testing only)
 */
export const useResetPlannerData = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!isAdmin) throw new Error('Forbidden');

      const { data, error } = await supabase.functions.invoke('reset-user-data');
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      return data;
    },
    onSuccess: () => {
      // Clear localStorage flags for new user experience
      localStorage.removeItem('simora_first_action_celebrated');
      
      // Clear ALL cached queries and reload to guarantee a true "day one" UI.
      queryClient.clear();
      toast({ title: 'Complete Reset', description: 'Fresh start like day one.' });
      window.location.reload();
    },
    onError: (error) => {
      console.error('Reset error:', error);
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'Could not reset',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Reorder tasks (update order_index for multiple tasks)
 */
export const useReorderTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tasks: { id: string; order_index: number }[]) => {
      // Update each task's order_index
      const updates = tasks.map(({ id, order_index }) =>
        supabase
          .from('user_tasks')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      return tasks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
    },
    onError: (error) => {
      console.error('Reorder tasks error:', error);
      toast({ title: 'Failed to reorder actions', variant: 'destructive' });
    },
  });
};

// ============================================
// SKIP & SNOOZE FUNCTIONALITY
// ============================================

export interface TaskSkip {
  id: string;
  task_id: string;
  user_id: string;
  skipped_date: string;
  snoozed_to_date: string | null;
  created_at: string;
}

/**
 * Get skipped task IDs for a specific date
 */
export const useSkipsForDate = (date: Date) => {
  const { user } = useAuth();
  const dateStr = format(date, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['planner-skips', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('task_skips')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('skipped_date', dateStr);

      if (error) throw error;
      return new Set(data.map(s => s.task_id));
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Skip a task for a specific date
 */
export const useSkipTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('task_skips')
        .upsert({
          task_id: taskId,
          user_id: user.id,
          skipped_date: dateStr,
          snoozed_to_date: null,
        }, {
          onConflict: 'task_id,skipped_date',
        })
        .select()
        .single();

      if (error) throw error;
      return data as TaskSkip;
    },
    onSuccess: (_, { date }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, dateStr] });
      toast({ title: 'Action skipped for today' });
    },
    onError: (error) => {
      console.error('Skip task error:', error);
      toast({ title: 'Failed to skip action', variant: 'destructive' });
    },
  });
};

/**
 * Snooze (reschedule) a non-repeating task to another date
 */
export const useSnoozeTask = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, fromDate, toDate }: { taskId: string; fromDate: Date; toDate: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fromDateStr = format(fromDate, 'yyyy-MM-dd');
      const toDateStr = format(toDate, 'yyyy-MM-dd');

      // For non-repeating tasks, update the scheduled_date directly
      const { data: task } = await supabase
        .from('user_tasks')
        .select('repeat_pattern')
        .eq('id', taskId)
        .single();

      if (task?.repeat_pattern === 'none') {
        // Update the task's scheduled_date to the new date
        const { error } = await supabase
          .from('user_tasks')
          .update({ scheduled_date: toDateStr })
          .eq('id', taskId);

        if (error) throw error;
      } else {
        // For repeating tasks, record the skip with snooze-to date
        const { error } = await supabase
          .from('task_skips')
          .upsert({
            task_id: taskId,
            user_id: user.id,
            skipped_date: fromDateStr,
            snoozed_to_date: toDateStr,
          }, {
            onConflict: 'task_id,skipped_date',
          });

        if (error) throw error;
      }

      return { taskId, fromDate, toDate };
    },
    onSuccess: (_, { fromDate, toDate }) => {
      const fromDateStr = format(fromDate, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, fromDateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      
      const toDateFormatted = format(toDate, 'MMM d');
      toast({ title: `Rescheduled to ${toDateFormatted}` });
    },
    onError: (error) => {
      console.error('Snooze task error:', error);
      toast({ title: 'Failed to reschedule action', variant: 'destructive' });
    },
  });
};

/**
 * Undo a skip/snooze
 */
export const useUndoSkip = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, date }: { taskId: string; date: Date }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const dateStr = format(date, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('task_skips')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('skipped_date', dateStr);

      if (error) throw error;
      return { taskId, date };
    },
    onSuccess: (_, { date }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, dateStr] });
      toast({ title: 'Skip undone' });
    },
    onError: (error) => {
      console.error('Undo skip error:', error);
      toast({ title: 'Failed to undo skip', variant: 'destructive' });
    },
  });
};

/**
 * Set streak goal for the challenge
 */
export const useSetStreakGoal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: 7 | 14 | 30 | 50) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_streaks')
        .update({
          streak_goal: goal,
          streak_goal_set_at: new Date().toISOString(),
          streak_goal_completed_at: null, // Reset completion when upgrading
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;
      return goal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    },
    onError: (error) => {
      console.error('Set streak goal error:', error);
      toast({ title: 'Failed to set goal', variant: 'destructive' });
    },
  });
};
