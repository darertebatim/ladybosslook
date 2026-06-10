import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserSubscription {
  id: string;
  user_id: string;
  program_slug: string | null;
  status: string;
  platform: string;
  product_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') as any;

      if (error) throw error;
      
      // Filter out expired subscriptions (sandbox subscriptions expire quickly)
      const now = new Date().toISOString();
      return ((data || []) as UserSubscription[]).filter(sub => {
        if (!sub.expires_at) return true; // No expiry = active
        return sub.expires_at > now;
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Also check course_enrollments for admin-enrolled users
  const { data: enrolledSlugs = [], isLoading: enrollLoading } = useQuery({
    queryKey: ['user-enrollment-slugs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', user.id)
        .eq('status', 'active') as any;
      if (error) throw error;
      return ((data || []) as { program_slug: string | null }[])
        .map(e => e.program_slug)
        .filter(Boolean) as string[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = subsLoading || enrollLoading;

  // Any slug belonging to the Plus family (iOS: 'simora-plus', web monthly: 'simora-plus',
  // web annual: 'simora-plus-annual', future variants: 'simora-plus-*') unlocks Plus access.
  const isPlusSlug = (s: string | null | undefined): boolean =>
    !!s && (s === 'simora-plus' || s.startsWith('simora-plus-'));

  const hasAnyPlus =
    subscriptions.some(sub => isPlusSlug(sub.program_slug)) ||
    enrolledSlugs.some(isPlusSlug);

  // Check if user has ANY active subscription or enrollment in a subscription program
  const isSubscribed = subscriptions.length > 0 || hasAnyPlus;

  // Check if user has access to a specific program's subscription content
  const hasAccessToProgram = (programSlug: string): boolean => {
    if (!programSlug) return false;
    // Plus gating: any Plus-family sub/enrollment grants access
    if (isPlusSlug(programSlug)) return hasAnyPlus;
    // Check user_subscriptions first
    if (subscriptions.some(sub => sub.program_slug === programSlug)) return true;
    // Fall back to course_enrollments (admin-enrolled users)
    return enrolledSlugs.includes(programSlug);
  };

  // Get active subscription for a specific program
  const getSubscriptionForProgram = (programSlug: string): UserSubscription | undefined => {
    if (isPlusSlug(programSlug)) {
      return subscriptions.find(sub => isPlusSlug(sub.program_slug));
    }
    return subscriptions.find(sub => sub.program_slug === programSlug);
  };

  return {
    subscriptions,
    isSubscribed,
    isLoading,
    hasAccessToProgram,
    getSubscriptionForProgram,
  };
};
