import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types for Routines Bank
export interface RoutineBankItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  category: string;
  color: string | null;
  emoji: string | null;
  is_active: boolean | null;
  is_popular: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  schedule_type?: string; // 'daily' | 'challenge'
  challenge_start_date?: string | null;
  start_day_of_week?: number | null;
}

export interface RoutineBankSection {
  id: string;
  routine_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  section_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface RoutineBankTask {
  id: string;
  routine_id: string;
  task_id: string | null;
  title: string;
  emoji: string | null;
  section_id: string | null;
  section_title: string | null;
  task_order: number | null;
  created_at: string | null;
  // Schedule fields
  schedule_days?: number[] | null; // For weekly mode: weekday numbers (0=Sun..6=Sat)
  drip_day?: number | null; // For challenge mode: day number (1-based)
  // Fields from joined admin_task_bank
  pro_link_type?: string | null;
  pro_link_value?: string | null;
  linked_playlist_id?: string | null;
  color?: string | null;
  description?: string | null;
  category?: string | null;
  repeat_pattern?: string | null;
  repeat_days?: number[] | null;
  // Goal fields from admin_task_bank
  goal_enabled?: boolean;
  goal_target?: number | null;
  goal_type?: string | null;
  goal_unit?: string | null;
  // Time period from admin_task_bank
  time_period?: string | null;
}

export interface RoutineBankWithDetails extends RoutineBankItem {
  sections: RoutineBankSection[];
  tasks: RoutineBankTask[];
}

// Unique categories from routine_categories table (single source of truth)
export interface RoutineBankCategory {
  slug: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
}

// Fetch categories directly from routine_categories table (admin-managed)
export function useRoutineBankCategories() {
  return useQuery({
    queryKey: ['routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('slug, name, icon, color, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Pro category goes last
      const sorted = (data || []).sort((a, b) => {
        if (a.slug === 'pro') return 1;
        if (b.slug === 'pro') return -1;
        return (a.display_order || 0) - (b.display_order || 0);
      });

      return sorted.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || 'Sparkles',  // icon column stores emoji
        color: cat.color || 'purple',
        emoji: cat.icon,  // same as icon for FluentEmoji
      })) as RoutineBankCategory[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch all active routines from bank
export function useRoutinesBank(categorySlug?: string) {
  return useQuery({
    queryKey: ['routines-bank', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categorySlug) {
        query = query.eq('category', categorySlug);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as RoutineBankItem[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch the welcome popup ritual (the one marked as is_welcome_popup)
export function useWelcomePopupRitual() {
  return useQuery({
    queryKey: ['welcome-popup-ritual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true)
        .eq('is_welcome_popup', true)
        .maybeSingle();

      if (error) throw error;
      return data as RoutineBankItem | null;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch popular routines
export function usePopularRoutinesBank() {
  return useQuery({
    queryKey: ['routines-bank-popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (error) throw error;

      return data as RoutineBankItem[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch featured routines (for banner)
export function useFeaturedRoutinesBank() {
  return useQuery({
    queryKey: ['routines-bank-featured'],
    queryFn: async () => {
      // For now, use popular routines as featured
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(3);

      if (error) throw error;
      return data as RoutineBankItem[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch single routine with all details
export function useRoutineBankDetail(routineId: string | undefined) {
  return useQuery({
    queryKey: ['routine-bank-detail', routineId],
    queryFn: async () => {
      if (!routineId) return null;

      // Fetch routine
      const { data: routine, error: routineError } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('id', routineId)
        .single();

      if (routineError) throw routineError;

      // Fetch sections
      const { data: sections, error: sectionsError } = await supabase
        .from('routines_bank_sections')
        .select('*')
        .eq('routine_id', routineId)
        .eq('is_active', true)
        .order('section_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('routines_bank_tasks')
        .select('*')
        .eq('routine_id', routineId)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Get pro_link info and goal info from admin_task_bank for each task
      const taskIds = tasks.filter(t => t.task_id).map(t => t.task_id);
      let taskDetails: Record<string, { 
        pro_link_type: string | null; 
        pro_link_value: string | null; 
        linked_playlist_id: string | null; 
        color: string | null;
        description: string | null;
        category: string | null;
        repeat_pattern: string | null;
        repeat_days: number[] | null;
        goal_enabled: boolean;
        goal_target: number | null;
        goal_type: string | null;
        goal_unit: string | null;
        time_period: string | null;
      }> = {};
      
      if (taskIds.length > 0) {
        const { data: bankTasks } = await supabase
          .from('admin_task_bank')
          .select('id, pro_link_type, pro_link_value, linked_playlist_id, color, description, category, repeat_pattern, repeat_days, goal_enabled, goal_target, goal_type, goal_unit, time_period')
          .in('id', taskIds);

        bankTasks?.forEach(bt => {
          taskDetails[bt.id] = {
            pro_link_type: bt.pro_link_type,
            pro_link_value: bt.pro_link_value,
            linked_playlist_id: bt.linked_playlist_id,
            color: bt.color,
            description: bt.description,
            category: bt.category,
            repeat_pattern: bt.repeat_pattern,
            repeat_days: bt.repeat_days,
            goal_enabled: bt.goal_enabled ?? false,
            goal_target: bt.goal_target,
            goal_type: bt.goal_type,
            goal_unit: bt.goal_unit,
            time_period: bt.time_period,
          };
        });
      }

      // Enrich tasks with pro_link info and goal info
      const enrichedTasks = tasks.map(task => ({
        ...task,
        pro_link_type: task.task_id ? taskDetails[task.task_id]?.pro_link_type : null,
        pro_link_value: task.task_id ? taskDetails[task.task_id]?.pro_link_value : null,
        linked_playlist_id: task.task_id ? taskDetails[task.task_id]?.linked_playlist_id : null,
        color: task.task_id ? taskDetails[task.task_id]?.color : null,
        description: task.task_id ? taskDetails[task.task_id]?.description : null,
        category: task.task_id ? taskDetails[task.task_id]?.category : null,
        repeat_pattern: task.task_id ? taskDetails[task.task_id]?.repeat_pattern : null,
        repeat_days: task.task_id ? taskDetails[task.task_id]?.repeat_days : null,
        goal_enabled: task.task_id ? taskDetails[task.task_id]?.goal_enabled : false,
        goal_target: task.task_id ? taskDetails[task.task_id]?.goal_target : null,
        goal_type: task.task_id ? taskDetails[task.task_id]?.goal_type : null,
        goal_unit: task.task_id ? taskDetails[task.task_id]?.goal_unit : null,
        time_period: task.task_id ? taskDetails[task.task_id]?.time_period : null,
      }));

      return {
        ...routine,
        sections: sections || [],
        tasks: enrichedTasks || [],
      } as RoutineBankWithDetails;
    },
    enabled: !!routineId,
  });
}

// Color cycle for variety in planner
const ROUTINE_COLOR_CYCLE = [
  'peach',
  'sky',
  'pink',
  'yellow',
  'lavender',
  'mint',
  'lime',
] as const;

// Fetch user's added bank routines (for filtering)
export function useUserAddedBankRoutines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-routines-bank', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('routine_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data.map(d => d.routine_id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

// Add routine from bank to user's planner
export function useAddRoutineFromBank() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      routineId,
      selectedTaskIds,
      editedTasks,
    }: {
      routineId: string;
      selectedTaskIds?: string[];
      editedTasks?: {
        id: string;
        title?: string;
        icon?: string;
        color?: string;
        repeatPattern?: string;
        scheduledTime?: string | null;
        tag?: string | null;
        pro_link_type?: string | null;
        pro_link_value?: string | null;
      }[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Get routine details
      const { data: routine, error: routineError } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('id', routineId)
        .single();

      if (routineError) throw routineError;

      // Get tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from('routines_bank_tasks')
        .select('*')
        .eq('routine_id', routineId)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Get pro_link info, goal info, AND category from admin_task_bank
      const taskIds = allTasks?.filter(t => t.task_id).map(t => t.task_id) || [];
      let taskDetails: Record<string, { 
        pro_link_type: string | null; 
        pro_link_value: string | null; 
        linked_playlist_id: string | null; 
        color: string | null;
        category: string | null;
        time_period: string | null;
        goal_enabled: boolean;
        goal_target: number | null;
        goal_type: string | null;
        goal_unit: string | null;
        repeat_pattern: string | null;
        repeat_days: number[] | null;
      }> = {};
      
      if (taskIds.length > 0) {
        const { data: bankTasks } = await supabase
          .from('admin_task_bank')
          .select('id, pro_link_type, pro_link_value, linked_playlist_id, color, category, time_period, goal_enabled, goal_target, goal_type, goal_unit, repeat_pattern, repeat_days')
          .in('id', taskIds);

        bankTasks?.forEach(bt => {
          taskDetails[bt.id] = {
            pro_link_type: bt.pro_link_type,
            pro_link_value: bt.pro_link_value,
            linked_playlist_id: bt.linked_playlist_id,
            color: bt.color,
            category: bt.category,
            time_period: bt.time_period,
            goal_enabled: bt.goal_enabled ?? false,
            goal_target: bt.goal_target,
            goal_type: bt.goal_type,
            goal_unit: bt.goal_unit,
            repeat_pattern: bt.repeat_pattern ?? 'daily',
            repeat_days: bt.repeat_days ?? null,
          };
        });
      }

      // Filter tasks if selectedTaskIds provided
      let tasks = selectedTaskIds
        ? allTasks?.filter(t => selectedTaskIds.includes(t.id)) || []
        : allTasks || [];

      // Create edited tasks map
      const editedTasksMap = new Map(editedTasks?.map(t => [t.id, t]) || []);

      // Get current max order_index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);

      const startOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

      // Determine schedule type from ritual
      const scheduleType = (routine as any).schedule_type || 'daily';
      const startDayOfWeek = (routine as any).start_day_of_week as number | null;
      
      // Calculate the effective start date
      let effectiveStartDate: Date;
      if ((routine as any).challenge_start_date) {
        effectiveStartDate = new Date((routine as any).challenge_start_date);
      } else if (startDayOfWeek != null) {
        // Find the next occurrence of this weekday (0=Sun..6=Sat)
        const today = new Date();
        const currentDay = today.getDay();
        let daysUntil = startDayOfWeek - currentDay;
        if (daysUntil <= 0) daysUntil += 7; // always next week if today or past
        effectiveStartDate = new Date(today);
        effectiveStartDate.setDate(today.getDate() + daysUntil);
      } else {
        effectiveStartDate = new Date();
      }

      // Create user tasks
      if (tasks.length > 0) {
        const userTasks = tasks.map((task, index) => {
          const edited = editedTasksMap.get(task.id);
          const bankTask = task.task_id ? taskDetails[task.task_id] : null;
          
          const proLinkType = edited?.pro_link_type ?? bankTask?.pro_link_type ?? null;
          const proLinkValue = edited?.pro_link_value ?? bankTask?.pro_link_value ?? bankTask?.linked_playlist_id ?? null;

          // Determine repeat_pattern and scheduling
          let repeatPattern: string;
          let repeatDays: number[] | null = null;
          let scheduledDate: string | null = null;

          if (scheduleType === 'challenge') {
            const dripDay = (task as any).drip_day as number;
            const taskScheduleDays = (task as any).schedule_days as number[] | null;
            
            if (taskScheduleDays && taskScheduleDays.length > 0) {
              // Challenge with per-task weekly schedule (e.g. Ladyboss Workout Plan)
              repeatPattern = 'weekly';
              repeatDays = taskScheduleDays;
              // Set scheduled_date to the effective start date so tasks don't appear before it
              scheduledDate = effectiveStartDate.toISOString().split('T')[0];
            } else if (dripDay) {
              // Sequential drip challenge
              repeatPattern = 'none';
              const taskDate = new Date(effectiveStartDate);
              taskDate.setDate(taskDate.getDate() + (dripDay - 1));
              scheduledDate = taskDate.toISOString().split('T')[0];
            } else {
              repeatPattern = 'none';
            }
          } else {
            // Normal rituals: use per-task repeat from bank, allow user edits to override
            repeatPattern = edited?.repeatPattern || bankTask?.repeat_pattern || 'daily';
            repeatDays = bankTask?.repeat_days || null;
            // If a start date is configured, set scheduled_date so tasks don't appear before it
            if (startDayOfWeek != null || (routine as any).challenge_start_date) {
              scheduledDate = effectiveStartDate.toISOString().split('T')[0];
            }
          }

          return {
            user_id: user.id,
            title: edited?.title || task.title,
            emoji: edited?.icon || task.emoji || routine.emoji || '✨',
            color: edited?.color || bankTask?.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
            repeat_pattern: repeatPattern,
            repeat_days: repeatDays,
            scheduled_date: scheduledDate,
            scheduled_time: edited?.scheduledTime || null,
            // Use category from admin_task_bank (the source of truth), fallback to routine.category
            tag: edited?.tag ?? bankTask?.category ?? routine.category,
            // Copy time_period from admin_task_bank
            time_period: bankTask?.time_period ?? null,
            linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : null,
            pro_link_type: proLinkType,
            pro_link_value: proLinkValue,
            is_active: true,
            order_index: startOrderIndex + index,
            // Copy goal settings from admin task bank
            goal_enabled: bankTask?.goal_enabled ?? false,
            goal_target: bankTask?.goal_target ?? null,
            goal_type: bankTask?.goal_type ?? null,
            goal_unit: bankTask?.goal_unit ?? null,
          };
        });

        const { error: insertError } = await supabase
          .from('user_tasks')
          .insert(userTasks);

        if (insertError) throw insertError;
      }

      // Track that user added this routine from bank
      const { error: trackError } = await supabase
        .from('user_routines_bank')
        .upsert({
          user_id: user.id,
          routine_id: routineId,
          is_active: true,
        }, {
          onConflict: 'user_id,routine_id',
        });

      if (trackError) {
        console.error('Error tracking routine addition:', trackError);
        // Don't throw - the tasks were already added successfully
      }

      return { success: true, taskCount: tasks.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    },
  });
}
