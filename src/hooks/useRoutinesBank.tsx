import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/localDate';

// Types for Routines Bank
export interface RoutineBankItem {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  cover_aspect?: string; // 'square' | '6x4'
  category: string;
  color: string | null;
  emoji: string | null;
  is_active: boolean | null;
  is_popular: boolean | null;
  is_free?: boolean;
  is_focus?: boolean;
  is_moment?: boolean;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  schedule_type?: string; // 'daily' | 'drip' | 'project' | 'program'
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
  monthly_day?: number | null; // For monthly mode: day of month (1-31)
  is_once?: boolean; // For one-time tasks
  // Fields from joined admin_task_bank
  pro_link_type?: string | null;
  pro_link_value?: string | null;
  linked_playlist_id?: string | null;
  color?: string | null;
  description?: string | null;
  category?: string | null;
  repeat_pattern?: string | null;
  repeat_days?: number[] | null;
  // Duration
  duration_minutes?: number | null;
  // Goal fields from admin_task_bank
  goal_enabled?: boolean;
  goal_target?: number | null;
  goal_type?: string | null;
  goal_unit?: string | null;
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
  task_display_order?: number;
  description?: string | null;
}

// Fetch categories directly from routine_categories table (admin-managed)
export function useRoutineBankCategories() {
  return useQuery({
    queryKey: ['routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('slug, name, icon, color, display_order, task_display_order, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Pro category goes last
      const sorted = (data || []).sort((a, b) => {
        if (a.slug === 'pro') return 1;
        if (b.slug === 'pro') return -1;
        const aOrder = a.display_order || 0;
        const bOrder = b.display_order || 0;
        if (aOrder === 0 && bOrder === 0) return 0;
        if (aOrder === 0) return 1;
        if (bOrder === 0) return -1;
        return aOrder - bOrder;
      });

      return sorted.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || 'Sparkles',
        color: cat.color || 'purple',
        emoji: cat.icon,
        task_display_order: cat.task_display_order ?? 0,
        description: (cat as any).description || null,
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

// Fetch featured routines (for home promo banners)
export function useFeaturedRoutinesBank() {
  return useQuery({
    queryKey: ['routines-bank-featured'],
    queryFn: async (): Promise<RoutineBankItem[]> => {
      const query = supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true);
      
      const { data, error } = await (query as any)
        .eq('is_featured', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      return (data || []) as RoutineBankItem[];
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
      }> = {};
      
      if (taskIds.length > 0) {
        const { data: bankTasks } = await supabase
          .from('admin_task_bank')
          .select('id, pro_link_type, pro_link_value, linked_playlist_id, color, description, category, repeat_pattern, repeat_days, goal_enabled, goal_target, goal_type, goal_unit')
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
      }));

      // Fetch linked program info if this is a program routine
      let linkedProgram: { title: string; cover_image_url: string | null } | null = null;
      if ((routine as any).linked_program_slug) {
        const { data: programData } = await supabase
          .from('program_catalog')
          .select('title, cover_image_url')
          .eq('slug', (routine as any).linked_program_slug)
          .single();
        if (programData) {
          linkedProgram = programData;
        }
      }

      return {
        ...routine,
        sections: sections || [],
        tasks: enrichedTasks || [],
        linkedProgram,
      } as RoutineBankWithDetails & { linkedProgram: { title: string; cover_image_url: string | null } | null };
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
        .select('routine_id, completed_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data.map(d => d.routine_id);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch completed project routine IDs
export function useCompletedRoutines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['completed-routines', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();

      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('routine_id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      if (error) throw error;
      return new Set(data.map(d => d.routine_id));
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
      return addRoutineToUserPlanner(user.id, routineId, { selectedTaskIds, editedTasks });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['user-routines-bank'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
    },
  });
}

/**
 * Standalone version of "add routine from bank" that can be called outside
 * React (e.g. from instructor onboarding). Mirrors the mutation in
 * useAddRoutineFromBank — creates user_tasks, the pro-task launcher,
 * auto-enrolls in linked program if applicable, and tracks the routine
 * in user_routines_bank so it shows up in My Routines and the Routine Player.
 */
export async function addRoutineToUserPlanner(
  userId: string,
  routineId: string,
  opts: {
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
    /** Force the effective start date (overrides challenge_start_date / startDayOfWeek). */
    startDate?: Date;
  } = {},
): Promise<{ success: boolean; taskCount: number }> {
  const { selectedTaskIds, editedTasks, startDate: forcedStartDate } = opts;

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
        duration_minutes: number | null;
      }> = {};
      
      if (taskIds.length > 0) {
        const { data: bankTasks } = await supabase
          .from('admin_task_bank')
          .select('id, pro_link_type, pro_link_value, linked_playlist_id, color, category, time_period, goal_enabled, goal_target, goal_type, goal_unit, repeat_pattern, repeat_days, duration_minutes')
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
            duration_minutes: bt.duration_minutes ?? null,
          };
        });
      }

      // Check if synthetic pro-task is selected
      const proTaskPrefix = '__pro_task_routine_';
      const hasProTask = selectedTaskIds?.some(id => id.startsWith(proTaskPrefix)) ?? false;
      
      // Filter tasks if selectedTaskIds provided (exclude synthetic IDs)
      let tasks = selectedTaskIds
        ? allTasks?.filter(t => selectedTaskIds.includes(t.id)) || []
        : allTasks || [];

      // Create edited tasks map
      const editedTasksMap = new Map(editedTasks?.map(t => [t.id, t]) || []);

      // Get current max order_index
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', userId)
        .order('order_index', { ascending: false })
        .limit(1);

      const startOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

      // Determine schedule type from routine
      const scheduleType = (routine as any).schedule_type || 'daily';
      const startDayOfWeek = (routine as any).start_day_of_week as number | null;
      
      // Calculate the effective start date
      let effectiveStartDate: Date;
      if (forcedStartDate) {
        effectiveStartDate = new Date(forcedStartDate);
      } else if ((routine as any).challenge_start_date) {
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

      // Calculate the effective end date
      let repeatEndDate: string | null = null;
      const endMode = (routine as any).end_mode || 'never';
      if (endMode === 'date' && (routine as any).end_date) {
        repeatEndDate = (routine as any).end_date;
      } else if (endMode === 'after_days' && (routine as any).end_after_days) {
        const endDate = new Date(effectiveStartDate);
        endDate.setDate(endDate.getDate() + (routine as any).end_after_days);
        repeatEndDate = getLocalDateStr(endDate);
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
          let projectStep: number | null = null;

          if (scheduleType === 'drip') {
            const dripDay = (task as any).drip_day as number;
            const taskScheduleDays = (task as any).schedule_days as number[] | null;
            
            if (taskScheduleDays && taskScheduleDays.length > 0) {
              repeatPattern = 'weekly';
              repeatDays = taskScheduleDays;
              scheduledDate = getLocalDateStr(effectiveStartDate);
            } else if (dripDay) {
              repeatPattern = 'none';
              const taskDate = new Date(effectiveStartDate);
              taskDate.setDate(taskDate.getDate() + (dripDay - 1));
              scheduledDate = getLocalDateStr(taskDate);
            } else {
              repeatPattern = 'none';
            }
          } else if (scheduleType === 'project') {
            // Project: all tasks are one-time, ordered sequentially
            repeatPattern = 'none';
            scheduledDate = getLocalDateStr(new Date());
            // step number from drip_day, fallback to index+1
            projectStep = (task as any).drip_day ?? (index + 1);
          } else {
            // Normal routines: use per-task repeat from bank, allow user edits to override
            const monthlyDay = (task as any).monthly_day as number | null;
            const isOnce = (task as any).is_once === true;
            
            if (isOnce) {
              // One-time task: no repeating
              repeatPattern = 'none';
              scheduledDate = getLocalDateStr(effectiveStartDate);
            } else if (monthlyDay != null) {
              // Monthly task: repeat on specific day of month
              repeatPattern = 'monthly';
              const now = new Date();
              const year = now.getFullYear();
              const month = now.getMonth();
              const targetDate = new Date(year, month, monthlyDay);
              if (targetDate < now) {
                targetDate.setMonth(targetDate.getMonth() + 1);
              }
              scheduledDate = getLocalDateStr(targetDate);
            } else {
              repeatPattern = edited?.repeatPattern || bankTask?.repeat_pattern || 'daily';
              repeatDays = bankTask?.repeat_days || null;
              if (startDayOfWeek != null || (routine as any).challenge_start_date) {
                scheduledDate = getLocalDateStr(effectiveStartDate);
              }
              if (repeatPattern === 'none' && !scheduledDate) {
                scheduledDate = getLocalDateStr(new Date());
              }
            }
          }

          return {
            user_id: userId,
            title: edited?.title || task.title,
            emoji: edited?.icon || task.emoji || routine.emoji || '✨',
            color: edited?.color || bankTask?.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
            repeat_pattern: repeatPattern,
            repeat_days: repeatDays,
            scheduled_date: scheduledDate,
            scheduled_time: edited?.scheduledTime || null,
            // Group all routine tasks under the routine's category (not individual task categories)
            tag: edited?.tag ?? routine.category,
            // Copy time_period from admin_task_bank
            time_period: bankTask?.time_period ?? null,
            linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : null,
            pro_link_type: proLinkType,
            pro_link_value: proLinkValue,
            is_active: scheduleType === 'project' ? (projectStep === 1 || projectStep === null) : true,
            order_index: startOrderIndex + index,
            // Copy goal settings from admin task bank
            goal_enabled: bankTask?.goal_enabled ?? false,
            goal_target: bankTask?.goal_target ?? null,
            goal_type: bankTask?.goal_type ?? null,
            goal_unit: bankTask?.goal_unit ?? null,
            // Copy duration for smart estimate support
            duration_minutes: bankTask?.duration_minutes ?? null,
            repeat_end_date: repeatEndDate,
            // Project tracking
            source_routine_id: routineId,
            project_step: projectStep,
          };
        });

        const { error: insertError } = await supabase
          .from('user_tasks')
          .insert(userTasks);

        if (insertError) throw insertError;
      }

      // Insert synthetic pro-task (routine launcher) if selected — placed after routine tasks
      if (hasProTask) {
        const proTaskEdited = editedTasks?.find(t => t.id.startsWith(proTaskPrefix));
        const proTaskOrder = startOrderIndex + tasks.length;
        const { error: proError } = await supabase
          .from('user_tasks')
          .insert({
            user_id: userId,
            title: proTaskEdited?.title || routine.title,
            emoji: proTaskEdited?.icon || '🎬',
            color: proTaskEdited?.color || 'mint',
            repeat_pattern: 'daily',
            tag: routine.category,
            pro_link_type: 'routine',
            pro_link_value: routineId,
            is_active: true,
            order_index: proTaskOrder,
            source_routine_id: null,
          });
        if (proError) {
          console.error('Error inserting pro-task:', proError);
        }
      }

      // Auto-enroll user in program if this is a "program" type routine
      if (scheduleType === 'program' && (routine as any).linked_program_slug) {
        const programSlug = (routine as any).linked_program_slug as string;
        
        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('program_slug', programSlug)
          .eq('status', 'active')
          .maybeSingle();

        if (!existingEnrollment) {
          // Find the auto-enrollment round for this program (same logic as store/stripe)
          let roundId: string | null = null;
          const { data: autoEnroll } = await supabase
            .from('program_auto_enrollment')
            .select('round_id')
            .eq('program_slug', programSlug)
            .maybeSingle();

          if (autoEnroll?.round_id) {
            roundId = autoEnroll.round_id;
          } else {
            // Fallback: find active round
            const { data: activeRound } = await (supabase
              .from('program_rounds')
              .select('id') as any)
              .eq('program_slug', programSlug)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            roundId = activeRound?.id || null;
          }

          // Get program title from catalog
          const { data: programInfo } = await supabase
            .from('program_catalog')
            .select('title')
            .eq('slug', programSlug)
            .single();

          const { error: enrollError } = await supabase
            .from('course_enrollments')
            .insert({
              user_id: userId,
              program_slug: programSlug,
              course_name: programInfo?.title || programSlug,
              round_id: roundId,
              status: 'active',
            });

          if (enrollError) {
            console.error('Error auto-enrolling in program:', enrollError);
          }
        }
      }

      // Track that user added this routine from bank
      const { error: trackError } = await supabase
        .from('user_routines_bank')
        .upsert({
          user_id: userId,
          routine_id: routineId,
          is_active: true,
          title: routine.title,
          emoji: routine.emoji,
          cover_image_url: routine.cover_image_url,
          category: routine.category,
          color: routine.color,
          schedule_type: scheduleType,
          is_focus: (routine as any).is_focus ?? false,
        } as any, {
          onConflict: 'user_id,routine_id',
        });

      if (trackError) {
        console.error('Error tracking routine addition:', trackError);
        // Don't throw - the tasks were already added successfully
      }

      return { success: true, taskCount: tasks.length };
}
