import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PaywallVariantId = 'classic' | 'gradient' | 'minimal' | 'bold' | 'comparison' | 'limited-offer' | 'vip' | 'onboarding';

const APP_SETTING_KEY = 'default_paywall_variant';

export function useDefaultPaywall() {
  const { data: variant = 'classic' as PaywallVariantId, isLoading } = useQuery({
    queryKey: ['app-setting', APP_SETTING_KEY],
    queryFn: async () => {
      const { data } = await (supabase
        .from('app_settings')
        .select('value')
        .eq('key', APP_SETTING_KEY)
        .maybeSingle() as any);
      return (data?.value as PaywallVariantId) || 'classic';
    },
    staleTime: 1000 * 60 * 10,
  });

  return { variant, isLoading };
}

export function useSetDefaultPaywall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variant: PaywallVariantId) => {
      const { error } = await (supabase
        .from('app_settings')
        .upsert({ key: APP_SETTING_KEY, value: variant, updated_at: new Date().toISOString() }, { onConflict: 'key' }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-setting', APP_SETTING_KEY] });
    },
  });
}
