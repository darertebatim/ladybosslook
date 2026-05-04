import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format, subDays, isEqual, parseISO, addDays } from 'date-fns';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';
import { scheduleUrgentAlarm, cancelUrgentAlarms, isUrgentAlarmAvailable } from '@/lib/taskAlarm';
import { scheduleTaskReminder, cancelTaskReminder, isLocalNotificationsAvailable } from '@/lib/localNotifications';
import { getTimePeriodSortOrder, TimePeriod } from '@/lib/taskScheduling';
import { updatePresence } from '@/hooks/useUserPresence';
import { checkAndUnlockNextProjectStep } from '@/hooks/useProjectStepUnlock';
import type { ProLinkType } from '@/lib/proTaskTypes';
import { getIsOnline } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offline/offlineMutationQueue';
import {
  addEventToCalendar,
  replaceCalendarEvent,
  deleteCalendarEventsById,
  isCalendarAvailable,
} from '@/lib/calendarIntegration';

/**
 * Compute the next occurrence Date (local) for a task. Returns null if it
 * cannot be determined (no time, no future date, etc.).
 */
function computeNextTaskOccurrence(opts: {
  scheduledDate: string | null;
  scheduledTime: string | null;
  repeatPattern: RepeatPattern;
  repeatDays?: number[];
}): Date | null {
  const { scheduledDate, scheduledTime, repeatPattern, repeatDays } = opts;
  if (!scheduledTime) return null;
  const [hh, mm] = scheduledTime.split(':').map(Number);

  const now = new Date();

  // Non-repeating: use scheduled_date or today
  if (!repeatPattern || repeatPattern === 'none') {
    if (!scheduledDate) return null;
    const [y, m, d] = scheduledDate.split('-').map(Number);
    const at = new Date(y, m - 1, d, hh, mm, 0, 0);
    return at > now ? at : null;
  }

  // Repeating: scan next 35 days for the first matching occurrence in the future
  const start = scheduledDate
    ? (() => {
        const [y, m, d] = scheduledDate.split('-').map(Number);
        return new Date(y, m - 1, d);
      })()
    : now;
  for (let i = 0; i < 35; i++) {
    const candidate = addDays(now, i);
    candidate.setHours(hh, mm, 0, 0);
    if (candidate <= now) continue;
    const dow = candidate.getDay();
    let match = false;
    if (repeatPattern === 'daily') match = true;
    else if (repeatPattern === 'weekly') match = dow === start.getDay();
    else if (repeatPattern === 'monthly') match = candidate.getDate() === start.getDate();
    else if (repeatPattern === 'weekend') match = dow === 0 || dow === 6;
    else if (repeatPattern === 'custom' && repeatDays?.length) match = repeatDays.includes(dow);
    if (match) return candidate;
  }
  return null;
}

/**
 * Sync (create/update/delete) the native calendar event for a task.
 * No-op when not on native or calendar plugin not available.
 */
async function syncTaskCalendarEvent(opts: {
  taskId: string;
  enabled: boolean;
  title: string;
  emoji: string;
  description: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;
  durationMinutes: number | null;
  reminderEnabled: boolean;
  reminderOffset: number;
  repeatPattern: RepeatPattern;
  repeatDays?: number[];
  existingCalendarEventId?: string | null;
}): Promise<string | null> {
  if (!isCalendarAvailable()) {
    return opts.existingCalendarEventId ?? null;
  }

  // If disabled, delete any prior event
  if (!opts.enabled) {
    if (opts.existingCalendarEventId) {
      await deleteCalendarEventsById([opts.existingCalendarEventId]);
    }
    return null;
  }

  const start = computeNextTaskOccurrence({
    scheduledDate: opts.scheduledDate,
    scheduledTime: opts.scheduledTime,
    repeatPattern: opts.repeatPattern,
    repeatDays: opts.repeatDays,
  });
  if (!start) {
    // Nothing future to schedule; clean up any old event
    if (opts.existingCalendarEventId) {
      await deleteCalendarEventsById([opts.existingCalendarEventId]);
    }
    return null;
  }

  const durMin = Math.max(5, opts.durationMinutes || 30);
  const end = new Date(start.getTime() + durMin * 60 * 1000);

  const result = await replaceCalendarEvent(
    {
      title: `${opts.emoji} ${opts.title}`.trim(),
      description: opts.description || 'Synced from Rilo',
      startDate: start,
      endDate: end,
      reminderMinutes: opts.reminderEnabled ? Math.max(0, opts.reminderOffset || 0) : undefined,
    },
    opts.existingCalendarEventId || undefined,
  );

  if (result.success && result.calendarEventId) {
    // Persist the new event ID on the task row
    try {
      await supabase
        .from('user_tasks')
        .update({ calendar_event_id: result.calendarEventId } as any)
        .eq('id', opts.taskId);
    } catch (e) {
      console.warn('[CalendarSync] Failed to persist calendar_event_id', e);
    }
    return result.calendarEventId;
  }
  return null;
}
import {
  TASK_EXECUTOR_TYPES,
  type CompleteTaskPayload,
  type UncompleteTaskPayload,
  type CompleteSubtaskPayload,
  type UncompleteSubtaskPayload,
} from '@/lib/offline/executors/taskCompletionExecutors';

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
  pro_link_type: ProLinkType | null;
  pro_link_value: string | null;
  // Goal tracking fields
  goal_enabled: boolean;
  goal_type: 'timer' | 'count' | null;
  goal_target: number | null;
  goal_unit: string | null;
  // Duration
  duration_minutes: number | null;
  // Routine link
  source_routine_id: string | null;
  // Native calendar event ID (when user enabled "Add to Calendar")
  calendar_event_id?: string | null;
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
  pro_link_type?: ProLinkType | null;
  pro_link_value?: string | null;
  goal_enabled?: boolean;
  goal_type?: 'timer' | 'count' | null;
  goal_target?: number | null;
  goal_unit?: string | null;
  order_index?: number;
  /** When true, also create a native calendar event for the next occurrence (Plus only, native only). */
  calendar_sync_enabled?: boolean;
  /** Estimated duration in minutes — used as event length when calendar sync is on. */
  duration_minutes?: number | null;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  description?: string | null;
  is_active?: boolean;
  order_index?: number;
  is_urgent?: boolean;
  linked_playlist_id?: string | null;
  pro_link_type?: ProLinkType | null;
  pro_link_value?: string | null;
  time_period?: TimePeriod | null;
}

// Color mapping for UI
// Palette: FFE0F5, FFE6C9, FFF492, E2F9F0, D7E9FF, E0FBB8, F0E3FF
export const TASK_COLORS: Record<TaskColor, string> = {
  pink: '#FFE0F5',
  peach: '#FFE6C9',
  yellow: '#FFF492',
  lime: '#E2F9F0',
  sky: '#D7E9FF',
  mint: '#E0FBB8',
  lavender: '#F0E3FF',
  purple: '#F0E3FF',
  blue: '#D7E9FF',
  red: '#FFE0F5',
  orange: '#FFE6C9',
  green: '#E2F9F0',
};

export const TASK_COLOR_CLASSES: Record<TaskColor, string> = {
  pink: 'bg-pink',
  peach: 'bg-peach',
  yellow: 'bg-yellow',
  lime: 'bg-lime',
  sky: 'bg-sky',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  // Legacy aliases → 7-color palette
  purple: 'bg-lavender',
  blue: 'bg-sky',
  red: 'bg-pink',
  orange: 'bg-peach',
  green: 'bg-lime',
};

export const TASK_TINT_CLASSES: Record<TaskColor, string> = {
  pink: 'bg-pink',
  peach: 'bg-peach',
  yellow: 'bg-yellow',
  lime: 'bg-lime',
  sky: 'bg-sky',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  purple: 'bg-lavender',
  blue: 'bg-sky',
  red: 'bg-pink',
  orange: 'bg-peach',
  green: 'bg-lime',
};

export const TASK_MID_CLASSES: Record<TaskColor, string> = {
  pink: 'bg-pink-mid',
  peach: 'bg-peach-mid',
  yellow: 'bg-yellow-mid',
  lime: 'bg-lime-mid',
  sky: 'bg-sky-mid',
  mint: 'bg-mint-mid',
  lavender: 'bg-lavender-mid',
  purple: 'bg-lavender-mid',
  blue: 'bg-sky-mid',
  red: 'bg-pink-mid',
  orange: 'bg-peach-mid',
  green: 'bg-lime-mid',
};

// ============================================
// HOOKS - QUERIES
// ============================================

/**
 * Get ALL active tasks (cached) - base query that rarely refetches
 */
export const useAllActiveTasks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['planner-all-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Offline: don't hit the network — return whatever the IDB cache
      // already rehydrated so the planner doesn't blank out. If the cache
      // hasn't rehydrated yet, throw so React Query keeps prior data and
      // doesn't commit an empty list (which would hide all tasks).
      if (!getIsOnline()) {
        const cached = queryClient.getQueryData<UserTask[]>(['planner-all-tasks', user.id]);
        if (cached && cached.length > 0) return cached;
        throw new Error('offline-no-cache');
      }

      const { data: tasks, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name, cover_image_url)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      // Transient refetch failure → keep cached list rather than wiping it.
      if (error) {
        const cached = queryClient.getQueryData<UserTask[]>(['planner-all-tasks', user.id]);
        if (cached) return cached;
        throw error;
      }
      return tasks as UserTask[];
    },
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes - tasks rarely change
    // Don't auto-retry while offline — we already returned cached data via
    // placeholderData; retries just spam errors without changing anything.
    retry: (failureCount, err) =>
      err instanceof Error && err.message === 'offline-no-cache' ? false : failureCount < 1,
    // No gcTime override — inherit the 7-day default so the IndexedDB
    // persister can rehydrate this query offline after app restart.
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

  // Sort tasks: repeating tasks use time-based sorting, one-time tasks sort purely by order_index
  const sortedTasks = [...tasksForDate].sort((a, b) => {
    const aIsOneTime = !a.repeat_pattern || a.repeat_pattern === 'none';
    const bIsOneTime = !b.repeat_pattern || b.repeat_pattern === 'none';
    
    // Repeating tasks always come before one-time tasks (handled by SortableTaskList grouping)
    // But within each group, apply different sorting:
    
    // Both are one-time: sort purely by order_index (user-controlled)
    if (aIsOneTime && bIsOneTime) {
      return a.order_index - b.order_index;
    }
    
    // Both are repeating: use time-based sorting
    if (!aIsOneTime && !bIsOneTime) {
      const aHasTime = !!a.scheduled_time;
      const bHasTime = !!b.scheduled_time;
      const aHasPeriod = !!a.time_period;
      const bHasPeriod = !!b.time_period;
      
      if (aHasTime && bHasTime) return a.scheduled_time!.localeCompare(b.scheduled_time!);
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;
      
      if (aHasPeriod && bHasPeriod) {
        const aOrder = getTimePeriodSortOrder(a.time_period);
        const bOrder = getTimePeriodSortOrder(b.time_period);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.order_index - b.order_index;
      }
      
      if (aHasPeriod && !bHasPeriod) return 1;
      if (!aHasPeriod && bHasPeriod) return -1;
      
      return a.order_index - b.order_index;
    }
    
    // Repeating before one-time
    if (!aIsOneTime && bIsOneTime) return -1;
    return 1;
  });

  return {
    data: sortedTasks,
    isLoading,
  };
};

/**
 * Get uncompleted one-time tasks from past dates that should carry forward to today.
 * These are tasks with repeat_pattern='none' and scheduled_date < today that have no completion.
 */
export const useCarryForwardTasks = () => {
  const { user } = useAuth();
  const { data: allTasks = [], isLoading: tasksLoading } = useAllActiveTasks();
  const todayStr = getLocalDateStr();

  // Get all past one-time task IDs to check completions
  const pastOneTimeTasks = allTasks.filter(
    t => t.repeat_pattern === 'none' && t.scheduled_date && t.scheduled_date < todayStr
  );

  const pastTaskIds = pastOneTimeTasks.map(t => t.id);

  // Query completions for these past tasks on their original dates
  const { data: pastCompletions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['carry-forward-completions', user?.id, pastTaskIds.join(',')],
    queryFn: async () => {
      if (!user?.id || pastTaskIds.length === 0) return [];

      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .in('task_id', pastTaskIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && pastTaskIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  // Filter: one-time tasks that have ANY completion should not carry forward
  const completedTaskIds = new Set(
    pastCompletions.map(c => c.task_id)
  );

  const carryForwardTasks = pastOneTimeTasks.filter(t => !completedTaskIds.has(t.id));

  return {
    data: carryForwardTasks,
    isLoading: tasksLoading || completionsLoading,
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
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['planner-completions', user?.id, dateStr],
    queryFn: async () => {
      if (!user?.id) return { tasks: [], subtasks: [] };

      // Offline: don't hit the network. Return whatever's currently cached
      // (which already includes optimistic updates from completeTask /
      // uncompleteTask) so the UI doesn't blink back to the unchecked state.
      if (!getIsOnline()) {
        const cached = queryClient.getQueryData<{
          tasks: TaskCompletion[];
          subtasks: SubtaskCompletion[];
        }>(['planner-completions', user.id, dateStr]);
        if (cached) return cached;
        // Same logic as planner-all-tasks: don't commit an empty result that
        // would mark every task as un-completed before rehydrate finishes.
        throw new Error('offline-no-cache');
      }

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

      // If a refetch fails (transient network), keep the cached data so the
      // UI doesn't drop optimistic updates. React Query will retry on the
      // next focus / reconnect.
      if (tasksResult.error || subtasksResult.error) {
        const cached = queryClient.getQueryData<{
          tasks: TaskCompletion[];
          subtasks: SubtaskCompletion[];
        }>(['planner-completions', user.id, dateStr]);
        if (cached) return cached;
        if (tasksResult.error) throw tasksResult.error;
        if (subtasksResult.error) throw subtasksResult.error;
      }

      return {
        tasks: tasksResult.data as TaskCompletion[],
        subtasks: subtasksResult.data as SubtaskCompletion[],
      };
    },
    enabled: !!user?.id,
    // Keep showing the previous data while React Query refetches in the
    // background — prevents the "task untoggles itself" flash.
    placeholderData: keepPreviousData,
    // Always refetch on mount so the UI reconciles with the server after
    // app cold-start. Cached data still renders instantly via the IDB
    // persister; this just guarantees the UI catches up if the persisted
    // snapshot was older than the actual server state (e.g. after writes
    // from another device, or after our optimistic update was overwritten
    // by a stale rehydrate).
    staleTime: 0,
    refetchOnMount: 'always',
    retry: (failureCount, err) =>
      err instanceof Error && err.message === 'offline-no-cache' ? false : failureCount < 1,
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
      const pageSize = 1000;
      let from = 0;
      const allTemplates: TaskTemplate[] = [];

      while (true) {
        let query = supabase
          .from('admin_task_bank')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + pageSize - 1);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;

        const batch = (data || []) as TaskTemplate[];
        allTemplates.push(...batch);

        if (batch.length < pageSize) break;
        from += pageSize;
      }

      return allTemplates;
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

      // For one-time tasks, always insert at the top of the list
      // by shifting existing one-time tasks down and using order_index 0
      let finalOrderIndex = taskData.order_index;
      const effectiveRepeat = taskData.repeat_pattern || 'none';
      
      if (effectiveRepeat === 'none' && (finalOrderIndex === undefined || finalOrderIndex === -1)) {
        finalOrderIndex = 0;
        // Shift existing one-time tasks down so new task appears at top
        const { data: existing } = await supabase
          .from('user_tasks')
          .select('id, order_index')
          .eq('user_id', user.id)
          .eq('repeat_pattern', 'none')
          .eq('is_active', true);
        if (existing && existing.length > 0) {
          await Promise.all(
            existing.map(t =>
              supabase.from('user_tasks').update({ order_index: (t.order_index ?? 0) + 1 }).eq('id', t.id)
            )
          );
        }
      } else if (finalOrderIndex === -1) {
        finalOrderIndex = 0;
      }

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
          ...(finalOrderIndex !== undefined ? { order_index: finalOrderIndex } : {}),
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

      // Sync to native calendar if requested (Plus-gated in UI)
      if (taskData.calendar_sync_enabled) {
        await syncTaskCalendarEvent({
          taskId: task.id,
          enabled: true,
          title: taskData.title,
          emoji: taskData.emoji || '☀️',
          description: taskData.description ?? null,
          scheduledDate: taskData.scheduled_date || null,
          scheduledTime: taskData.scheduled_time || null,
          durationMinutes: taskData.duration_minutes ?? null,
          reminderEnabled: !!taskData.reminder_enabled,
          reminderOffset: taskData.reminder_offset || 0,
          repeatPattern: (taskData.repeat_pattern || 'none') as RepeatPattern,
          repeatDays: taskData.repeat_days,
          existingCalendarEventId: null,
        });
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
      toast({ title: 'Task created! ✨' });
    },
    onError: (error) => {
      console.error('Create task error:', error);
      toast({ title: 'Failed to create task', variant: 'destructive' });
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
      toast({ title: 'Added to your routines! 🎧' });
    },
    onError: (error) => {
      console.error('Quick add playlist task error:', error);
      toast({ title: 'Failed to add to routines', variant: 'destructive' });
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
      toast({ title: 'Failed to update task', variant: 'destructive' });
    },
  });
};

/**
 * Delete a task
 */
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (taskId: string) => {
      // Cancel local notification before deleting
      if (isLocalNotificationsAvailable()) {
        await cancelTaskReminder(taskId);
      }

      // Check if this task belongs to a routine before deleting
      const { data: taskData } = await supabase
        .from('user_tasks')
        .select('source_routine_id')
        .eq('id', taskId)
        .single();

      const routineId = taskData?.source_routine_id;

      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // If this task belonged to a routine, check if any tasks remain
      if (routineId && user) {
        const { count } = await supabase
          .from('user_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('source_routine_id', routineId)
          .eq('is_active', true);

        if (count === 0) {
          // No tasks left — remove the routine from user's bank
          await supabase
            .from('user_routines_bank')
            .delete()
            .eq('user_id', user.id)
            .eq('routine_id', routineId);
        }
      }

      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-routines-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-added-bank-routines'] });
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
      const payload: CompleteTaskPayload = { userId: user.id, taskId, dateStr };

      // Optimistic cache update — UI flips instantly even before the write
      // is confirmed. Reconciled by the invalidation in onSuccess once the
      // network write (or queue drain) finishes.
      const completionsKey = ['planner-completions', user.id, dateStr];
      queryClient.setQueryData(completionsKey, (prev: any) => {
        const base = prev ?? { tasks: [], subtasks: [] };
        const already = (base.tasks ?? []).some((t: any) => t.task_id === taskId);
        if (already) return base;
        return {
          ...base,
          tasks: [
            ...(base.tasks ?? []),
            {
              id: `optimistic-${taskId}-${dateStr}`,
              task_id: taskId,
              user_id: user.id,
              completed_date: dateStr,
              created_at: new Date().toISOString(),
              goal_progress: null,
            },
          ],
        };
      });

      // Offline path: enqueue and return — UI already reflects success.
      if (!getIsOnline()) {
        await enqueueMutation(TASK_EXECUTOR_TYPES.COMPLETE_TASK, payload);
        return { completion: null, streakIncreased: false, unlockedStep: null, queued: true };
      }

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

      if (error) {
        // Network-shaped failure → enqueue for later, don't surface error.
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          await enqueueMutation(TASK_EXECUTOR_TYPES.COMPLETE_TASK, payload);
          return { completion: null, streakIncreased: false, unlockedStep: null, queued: true };
        }
        throw error;
      }

      // Update streak
      const streakResult = await updateStreak(user.id, dateStr);
      
      // Update presence metrics
      await updatePresence(user.id, dateStr);

      // Check if this unlocks next project step
      const stepResult = await checkAndUnlockNextProjectStep(user.id, taskId, dateStr);

      // Fire analytics (non-blocking)
      try {
        const { Analytics } = await import('@/lib/firebaseAnalytics');
        Analytics.taskCompleted(taskId);
      } catch { /* ignore */ }

      return { completion: data, streakIncreased: streakResult.increased, unlockedStep: stepResult };
    },
    onSuccess: (result, variables) => {
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
      // Update challenge progress
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-routine-infos'] });
      // Update routine pro-task completion percentage
      queryClient.invalidateQueries({ queryKey: ['routine-preview-completion'] });
      // Step unlock query refresh is handled by the UI celebration callback
      // to allow the celebration modal to show before tasks appear
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
      const payload: UncompleteTaskPayload = { userId: user.id, taskId, dateStr };

      // Optimistic cache update
      const completionsKey = ['planner-completions', user.id, dateStr];
      queryClient.setQueryData(completionsKey, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: (prev.tasks ?? []).filter((t: any) => t.task_id !== taskId),
        };
      });

      if (!getIsOnline()) {
        await enqueueMutation(TASK_EXECUTOR_TYPES.UNCOMPLETE_TASK, payload);
        return;
      }

      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .eq('completed_date', dateStr);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          await enqueueMutation(TASK_EXECUTOR_TYPES.UNCOMPLETE_TASK, payload);
          return;
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      const dateStr = format(variables.date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ queryKey: ['planner-completions', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
      // Update weekly task completion badges
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
      queryClient.invalidateQueries({ queryKey: ['routine-preview-completion'] });
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
      const payload: CompleteSubtaskPayload = { userId: user.id, subtaskId, dateStr };

      const completionsKey = ['planner-completions', user.id, dateStr];
      queryClient.setQueryData(completionsKey, (prev: any) => {
        const base = prev ?? { tasks: [], subtasks: [] };
        const already = (base.subtasks ?? []).some((s: any) => s.subtask_id === subtaskId);
        if (already) return base;
        return {
          ...base,
          subtasks: [
            ...(base.subtasks ?? []),
            {
              id: `optimistic-${subtaskId}-${dateStr}`,
              subtask_id: subtaskId,
              user_id: user.id,
              completed_date: dateStr,
              created_at: new Date().toISOString(),
            },
          ],
        };
      });

      if (!getIsOnline()) {
        await enqueueMutation(TASK_EXECUTOR_TYPES.COMPLETE_SUBTASK, payload);
        return null;
      }

      const { data, error } = await supabase
        .from('subtask_completions')
        .insert({
          subtask_id: subtaskId,
          user_id: user.id,
          completed_date: dateStr,
        })
        .select()
        .single();

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          await enqueueMutation(TASK_EXECUTOR_TYPES.COMPLETE_SUBTASK, payload);
          return null;
        }
        throw error;
      }
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
      const payload: UncompleteSubtaskPayload = { userId: user.id, subtaskId, dateStr };

      const completionsKey = ['planner-completions', user.id, dateStr];
      queryClient.setQueryData(completionsKey, (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: (prev.subtasks ?? []).filter((s: any) => s.subtask_id !== subtaskId),
        };
      });

      if (!getIsOnline()) {
        await enqueueMutation(TASK_EXECUTOR_TYPES.UNCOMPLETE_SUBTASK, payload);
        return;
      }

      const { error } = await supabase
        .from('subtask_completions')
        .delete()
        .eq('subtask_id', subtaskId)
        .eq('user_id', user.id)
        .eq('completed_date', dateStr);

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
          await enqueueMutation(TASK_EXECUTOR_TYPES.UNCOMPLETE_SUBTASK, payload);
          return;
        }
        throw error;
      }
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
export async function updateStreak(userId: string, completedDateStr: string): Promise<{ increased: boolean }> {
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

  // Check if recovery was used today — if so, continue from recovered streak
  if (streak.streak_recovery_used_at) {
    const recoveryDate = format(parseISO(streak.streak_recovery_used_at), 'yyyy-MM-dd');
    if (recoveryDate === today) {
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
      toast({ title: 'Failed to reorder tasks', variant: 'destructive' });
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
  const dateStr = getLocalDateStr(date);

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

      const dateStr = getLocalDateStr(date);

      // Check if this is a one-time task
      const { data: task } = await supabase
        .from('user_tasks')
        .select('repeat_pattern')
        .eq('id', taskId)
        .single();

      if (task?.repeat_pattern === 'none') {
        // For one-time tasks, reschedule to tomorrow instead of creating a skip record
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = getLocalDateStr(tomorrow);

        const { error } = await supabase
          .from('user_tasks')
          .update({ scheduled_date: tomorrowStr })
          .eq('id', taskId);

        if (error) throw error;
        return { task_id: taskId, skipped_date: dateStr, snoozed_to_date: tomorrowStr, user_id: user.id, created_at: new Date().toISOString(), id: '' } as TaskSkip;
      }

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
    onSuccess: (result, { date }) => {
      const dateStr = getLocalDateStr(date);
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['routine-preview-completion'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-routine-infos'] });
      queryClient.invalidateQueries({ queryKey: ['carry-forward-completions'] });
      
      // Show appropriate toast based on whether it was rescheduled (one-time) or skipped
      if (result.snoozed_to_date) {
        toast({ title: 'Task moved to tomorrow' });
      } else {
        toast({ title: 'Task skipped for today' });
      }
    },
    onError: (error) => {
      console.error('Skip task error:', error);
      toast({ title: 'Failed to skip task', variant: 'destructive' });
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

      const fromDateStr = getLocalDateStr(fromDate);
      const toDateStr = getLocalDateStr(toDate);

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
      const fromDateStr = getLocalDateStr(fromDate);
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, fromDateStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['routine-preview-completion'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-routine-infos'] });

      const toDateFormatted = format(toDate, 'MMM d');
      toast({ title: `Rescheduled to ${toDateFormatted}` });
    },
    onError: (error) => {
      console.error('Snooze task error:', error);
      toast({ title: 'Failed to reschedule task', variant: 'destructive' });
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

      const dateStr = getLocalDateStr(date);

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
      const dateStr = getLocalDateStr(date);
      queryClient.invalidateQueries({ queryKey: ['planner-skips', user?.id, dateStr] });
      queryClient.invalidateQueries({ queryKey: ['routine-preview-completion'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge-routine-infos'] });
      toast({ title: 'Skip undone' });
    },
    onError: (error) => {
      console.error('Undo skip error:', error);
      toast({ title: 'Failed to undo skip', variant: 'destructive' });
    },
  });
};

/**
 * Recover a broken streak (regular or gold) using a recovery shield.
 * Users have a pool of 3 shields (1 free + 2 for subscribers). Never resets.
 */
export const useRecoverStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ previousStreak, type = 'streak' }: { previousStreak: number; type?: 'streak' | 'gold' }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current recovery count
      const { data: current } = await supabase
        .from('user_streaks')
        .select('streak_recovery_count')
        .eq('user_id', user.id)
        .single();

      const count = (current as any)?.streak_recovery_count || 0;
      if (count >= 3) throw new Error('No recovery shields remaining');

      const updates: any = {
        streak_recovery_count: count + 1,
        streak_recovery_used: true,
        streak_recovery_used_at: new Date().toISOString(),
      };

      if (type === 'streak') {
        updates.current_streak = previousStreak;
        updates.last_completion_date = format(new Date(), 'yyyy-MM-dd');
      } else {
        updates.current_gold_streak = previousStreak;
        updates.last_gold_date = format(new Date(), 'yyyy-MM-dd');
      }

      const { error } = await supabase
        .from('user_streaks')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
      queryClient.invalidateQueries({ queryKey: ['gold-streak'] });
    },
    onError: (error) => {
      console.error('Recover streak error:', error);
      toast({ title: 'Failed to recover streak', variant: 'destructive' });
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
    mutationFn: async (goal: 7 | 14 | 30 | 50 | 90 | 180 | 270 | 365) => {
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
