import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ToolAccessConfig {
  tool_id: string;
  requires_subscription: boolean;
  free_usage_limit: number | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  status: 'active' | 'expired' | 'trial' | 'cancelled';
  platform: 'ios' | 'web' | 'stripe';
  product_id: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  revenuecat_id: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as any;
      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const { data: toolConfigs = [] } = useQuery({
    queryKey: ['tool-access-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_access_config')
        .select('*') as any;
      if (error) throw error;
      return data as ToolAccessConfig[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const isSubscribed = subscription?.status === 'active' || subscription?.status === 'trial';

  const isTrialing = subscription?.status === 'trial';

  const subscriptionStatus = subscription?.status ?? null;
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at) : null;
  const platform = subscription?.platform ?? null;

  /**
   * Check if user has access to a specific tool or content.
   * For tools: checks tool_access_config
   * For content types: pass requiresSubscription boolean directly
   */
  const hasAccess = (opts: { toolId?: string; requiresSubscription?: boolean }): boolean => {
    // If user is subscribed, always has access
    if (isSubscribed) return true;

    // Check tool-specific config
    if (opts.toolId) {
      const config = toolConfigs.find(c => c.tool_id === opts.toolId);
      if (!config) return true; // Tool not configured = free
      return !config.requires_subscription;
    }

    // For content with requires_subscription flag
    if (opts.requiresSubscription !== undefined) {
      return !opts.requiresSubscription;
    }

    return true;
  };

  const getToolConfig = (toolId: string): ToolAccessConfig | undefined => {
    return toolConfigs.find(c => c.tool_id === toolId);
  };

  return {
    subscription,
    isSubscribed,
    isTrialing,
    subscriptionStatus,
    trialEndsAt,
    expiresAt,
    platform,
    isLoading: subLoading,
    hasAccess,
    getToolConfig,
    toolConfigs,
  };
};
