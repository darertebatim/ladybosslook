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
  duration_minutes: number;
  icon: string;
  task_order: number;
  is_active: boolean;
  created_at: string;
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

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('routine_plan_tasks')
        .select('*')
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

// Add routine plan to user's planner
export function useAddRoutinePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('Must be logged in');

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('routine_plans')
        .select('*, category:routine_categories(*)')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      // Get plan tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('routine_plan_tasks')
        .select('*')
        .eq('plan_id', planId)
        .eq('is_active', true)
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      // Create parent task
      const { data: parentTask, error: parentError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title: plan.title,
          emoji: plan.icon,
          color: plan.color,
          repeat_pattern: 'daily',
          tag: plan.category?.name || null,
          is_active: true,
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Create subtasks
      if (tasks && tasks.length > 0) {
        const subtasks = tasks.map((task, index) => ({
          task_id: parentTask.id,
          title: `${task.title} (${task.duration_minutes} min)`,
          order_index: index,
        }));

        const { error: subtasksError } = await supabase
          .from('user_subtasks')
          .insert(subtasks);

        if (subtasksError) throw subtasksError;
      }

      // Track that user added this plan
      const { error: trackError } = await supabase
        .from('user_routine_plans')
        .insert({
          user_id: user.id,
          plan_id: planId,
          is_active: true,
        });

      if (trackError) throw trackError;

      return parentTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-routine-plans'] });
      queryClient.invalidateQueries({ queryKey: ['routine-plan'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
