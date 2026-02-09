import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Types
export interface RoutineCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface RoutinePlan {
  id: string;
  category_id: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  icon: string;
  color: string;
  estimated_minutes: number;
  points: number;
  is_featured: boolean;
  is_popular: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  category?: RoutineCategory;
  average_rating?: number;
  rating_count?: number;
}

export interface RoutinePlanSection {
  id: string;
  plan_id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  section_order: number;
  is_active: boolean;
  created_at: string;
}

export interface RoutinePlanTask {
  id: string;
  plan_id: string;
  title: string;
  description?: string | null;
  icon: string;
  color?: string; // Task color for display
  task_order: number;
  is_active: boolean;
  created_at: string;
  linked_playlist_id: string | null;
  tag?: string | null; // Category tag for filtering
  // Pro Task fields
  pro_link_type: 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | null;
  pro_link_value: string | null;
  // Goal fields
  goal_enabled?: boolean;
  goal_target?: number | null;
  goal_type?: string | null;
  goal_unit?: string | null;
  // Joined data
  linked_playlist?: {
    id: string;
    name: string;
  } | null;
}

export interface RoutinePlanRating {
  id: string;
  plan_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface UserRoutinePlan {
  id: string;
  user_id: string;
  plan_id: string;
  added_at: string;
  is_active: boolean;
}

export interface RoutinePlanWithDetails extends RoutinePlan {
  sections: RoutinePlanSection[];
  tasks: RoutinePlanTask[];
  userRating?: number;
  isAdded?: boolean;
}

// Fetch all active categories
export function useRoutineCategories() {
  return useQuery({
    queryKey: ['routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as RoutineCategory[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes cache
  });
}

// Fetch plans with optional category filter
export function useRoutinePlans(categorySlug?: string) {
  return useQuery({
    queryKey: ['routine-plans', categorySlug],
    queryFn: async () => {
      let query = supabase
        .from('routine_plans')
        .select(`
          *,
          category:routine_categories(*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categorySlug) {
        // First get category id
        const { data: categoryData } = await supabase
          .from('routine_categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();

        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get ratings for each plan
      const planIds = data.map(p => p.id);
      const { data: ratingsData } = await supabase
        .from('routine_plan_ratings')
        .select('plan_id, rating')
        .in('plan_id', planIds);

      // Calculate average ratings
      const ratingsByPlan: Record<string, { total: number; count: number }> = {};
      ratingsData?.forEach(r => {
        if (!ratingsByPlan[r.plan_id]) {
          ratingsByPlan[r.plan_id] = { total: 0, count: 0 };
        }
        ratingsByPlan[r.plan_id].total += r.rating;
        ratingsByPlan[r.plan_id].count += 1;
      });

      return data.map(plan => ({
        ...plan,
        average_rating: ratingsByPlan[plan.id] 
          ? ratingsByPlan[plan.id].total / ratingsByPlan[plan.id].count 
          : undefined,
        rating_count: ratingsByPlan[plan.id]?.count || 0,
      })) as RoutinePlan[];
    },
  });
}

// Fetch featured plans for banner
export function useFeaturedPlans() {
  return useQuery({
    queryKey: ['routine-plans-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as RoutinePlan[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch popular plans
export function usePopularPlans() {
  return useQuery({
    queryKey: ['routine-plans-popular'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_plans')
        .select(`
          *,
          category:routine_categories(*)
        `)
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data as RoutinePlan[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Fetch single plan with all details
export function useRoutinePlan(planId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routine-plan', planId],
    queryFn: async () => {
      if (!planId) return null;

      // Fetch plan
      const { data: plan, error: planError } = await supabase
        .from('routine_plans')
        .select(`
          *,
          category:routine_categories(*)
        `)
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      // Fetch sections
      const { data: sections, error: sectionsError } = await supabase
        .from('routine_plan_sections')
        .select('*')
        .eq('plan_id', planId)
        .eq('is_active', true)
        .order('section_order', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch tasks with linked playlist info
      const { data: tasks, error: tasksError } = await supabase
        .from('routine_plan_tasks')
        .select(`
          *,
          linked_playlist:audio_playlists!linked_playlist_id(id, name)
        `)
        .eq('plan_id', planId)
        .eq('is_active', true)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Check if user has rated this plan
      let userRating: number | undefined;
      if (user) {
        const { data: ratingData } = await supabase
          .from('routine_plan_ratings')
          .select('rating')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .single();

        userRating = ratingData?.rating;
      }

      // Check if user has added this plan
      let isAdded = false;
      if (user) {
        const { data: addedData } = await supabase
          .from('user_routine_plans')
          .select('id')
          .eq('plan_id', planId)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        isAdded = !!addedData;
      }

      return {
        ...plan,
        sections: sections || [],
        tasks: tasks || [],
        userRating,
        isAdded,
      } as RoutinePlanWithDetails;
    },
    enabled: !!planId,
  });
}

// Fetch user's added routine plans
export function useUserRoutinePlans() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-routine-plans', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_routine_plans')
        .select(`
          *,
          plan:routine_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

// Add routine plan to user's planner - creates individual tasks (not subtasks) for iOS Reminders sync
export function useAddRoutinePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      planId, 
      selectedTaskIds, 
      editedTasks,
      syntheticTasks,
    }: { 
      planId: string; 
      selectedTaskIds?: string[]; 
      editedTasks?: { 
        id: string; 
        title?: string; 
        icon?: string; 
        color?: string;
        repeatPattern?: 'daily' | 'weekly' | 'monthly' | 'none';
        scheduledTime?: string | null;
        tag?: string | null;
        linked_playlist_id?: string | null;
        pro_link_type?: 'playlist' | 'journal' | 'channel' | 'program' | 'planner' | 'inspire' | 'route' | 'breathe' | 'water' | 'period' | 'emotion' | 'audio' | 'mood' | null;
        pro_link_value?: string | null;
      }[];
      syntheticTasks?: RoutinePlanTask[];
    }) => {
      if (!user) throw new Error('Must be logged in');

      // Check if this is a synthetic plan (created on-the-fly, not from database)
      const isSyntheticPlan = planId.startsWith('synthetic-');

      let tasks: RoutinePlanTask[] = [];
      let planTitle = 'Routine';
      let planIcon = '✨';
      let planCategoryName: string | null = null;
      let planScheduleType = 'daily';

      if (isSyntheticPlan && syntheticTasks) {
        // Use the provided synthetic tasks directly
        tasks = selectedTaskIds 
          ? syntheticTasks.filter(t => selectedTaskIds.includes(t.id))
          : syntheticTasks;
        // Extract title from first task's tag or title
        if (tasks.length > 0) {
          planTitle = tasks[0].title;
          planIcon = tasks[0].icon || '✨';
        }
      } else {
        // Get plan details from database (including schedule_type)
        const { data: plan, error: planError } = await supabase
          .from('routine_plans')
          .select('*, category:routine_categories(*)')
          .eq('id', planId)
          .single();

        if (planError) throw planError;
        
        planTitle = plan.title;
        planIcon = plan.icon;
        planCategoryName = plan.category?.name;
        planScheduleType = (plan as any).schedule_type || 'daily';

        // Get plan tasks with linked playlist info
        const { data: allTasks, error: tasksError } = await supabase
          .from('routine_plan_tasks')
          .select(`
            *,
            linked_playlist:audio_playlists!linked_playlist_id(id, name)
          `)
          .eq('plan_id', planId)
          .eq('is_active', true)
          .order('task_order', { ascending: true });

        if (tasksError) throw tasksError;

        // Filter tasks if selectedTaskIds provided
        tasks = selectedTaskIds 
          ? (allTasks?.filter(t => selectedTaskIds.includes(t.id)) || []) as RoutinePlanTask[]
          : (allTasks || []) as RoutinePlanTask[];
      }

      // Create a map of edited task data
      const editedTasksMap = new Map(editedTasks?.map(t => [t.id, t]) || []);

      // Get current max order_index for user's tasks
      const { data: existingTasks } = await supabase
        .from('user_tasks')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1);

      const startOrderIndex = (existingTasks?.[0]?.order_index ?? -1) + 1;

      // Create individual tasks for each routine plan task
      const today = new Date();
      if (tasks && tasks.length > 0) {
        const userTasks = tasks.map((task, index) => {
          const edited = editedTasksMap.get(task.id);
          // Determine pro_link fields - prefer edited values, fall back to template
          const proLinkType = edited?.pro_link_type ?? task.pro_link_type ?? (task.linked_playlist_id ? 'playlist' : null);
          const proLinkValue = edited?.pro_link_value ?? task.pro_link_value ?? task.linked_playlist_id ?? null;
          
          // Determine repeat_pattern and scheduling based on plan schedule_type
          let repeatPattern = edited?.repeatPattern || 'daily';
          let repeatDays: number[] | null = null;
          let scheduledDate: string | null = null;

          if (planScheduleType === 'weekly' && (task as any).schedule_days?.length > 0) {
            repeatPattern = 'custom';
            repeatDays = (task as any).schedule_days;
          } else if (planScheduleType === 'challenge' && (task as any).drip_day) {
            repeatPattern = 'none';
            const dripDay = (task as any).drip_day as number;
            const taskDate = new Date(today);
            taskDate.setDate(taskDate.getDate() + (dripDay - 1));
            scheduledDate = taskDate.toISOString().split('T')[0];
          }

          return {
            user_id: user.id,
            title: edited?.title || task.title,
            emoji: edited?.icon || task.icon || planIcon,
            color: edited?.color || ROUTINE_COLOR_CYCLE[index % ROUTINE_COLOR_CYCLE.length],
            repeat_pattern: repeatPattern,
            repeat_days: repeatDays,
            scheduled_date: scheduledDate,
            scheduled_time: edited?.scheduledTime || null,
            // For pro-linked tasks, use 'pro' as category; otherwise use the category name or plan title
            // Priority: edited tag > task's own tag > proLinkType check > planCategoryName > planTitle
            tag: proLinkType ? 'pro' : (edited?.tag ?? task.tag ?? planCategoryName ?? planTitle),
            linked_playlist_id: proLinkType === 'playlist' ? proLinkValue : null,
            pro_link_type: proLinkType,
            pro_link_value: proLinkValue,
            is_active: true,
            order_index: startOrderIndex + index,
          };
        });

        const { error: tasksInsertError } = await supabase
          .from('user_tasks')
          .insert(userTasks);

        if (tasksInsertError) throw tasksInsertError;
      }

      // Only track if it's a real plan (not synthetic)
      if (!isSyntheticPlan) {
        const { error: trackError } = await supabase
          .from('user_routine_plans')
          .insert({
            user_id: user.id,
            plan_id: planId,
            is_active: true,
          });

        if (trackError) throw trackError;
      }

      return { success: true, taskCount: tasks?.length || 0 };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-routine-plans'] });
      queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
      queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
    },
  });
}

// Rate a routine plan
export function useRateRoutinePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ planId, rating }: { planId: string; rating: number }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('routine_plan_ratings')
        .upsert({
          plan_id: planId,
          user_id: user.id,
          rating,
        }, {
          onConflict: 'plan_id,user_id',
        });

      if (error) throw error;
    },
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ['routine-plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['routine-plans'] });
    },
  });
}

// Fetch routine plans that have Pro Tasks (any pro_link_type)
export function useProRoutinePlans() {
  return useQuery({
    queryKey: ['pro-routine-plans'],
    queryFn: async () => {
      // Get plan IDs that have at least one task with pro_link_type OR linked_playlist_id
      const { data: plansWithProTasks, error: proError } = await supabase
        .from('routine_plan_tasks')
        .select('plan_id')
        .or('pro_link_type.not.is.null,linked_playlist_id.not.is.null')
        .eq('is_active', true);
      
      if (proError) throw proError;
      
      const planIds = [...new Set(plansWithProTasks?.map(t => t.plan_id) || [])];
      
      if (planIds.length === 0) return [];
      
      const { data: plans, error: plansError } = await supabase
        .from('routine_plans')
        .select(`
          *,
          category:routine_categories(*)
        `)
        .in('id', planIds)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(10);
      
      if (plansError) throw plansError;
      return plans as RoutinePlan[];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
