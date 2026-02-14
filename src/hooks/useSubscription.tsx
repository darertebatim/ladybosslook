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

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['user-subscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') as any;

      if (error) throw error;
      return (data || []) as UserSubscription[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Check if user has ANY active subscription
  const isSubscribed = subscriptions.length > 0;

  // Check if user has access to a specific program's subscription content
  const hasAccessToProgram = (programSlug: string): boolean => {
    if (!programSlug) return false;
    return subscriptions.some(sub => sub.program_slug === programSlug);
  };

  // Get active subscription for a specific program
  const getSubscriptionForProgram = (programSlug: string): UserSubscription | undefined => {
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
