import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const APP_SETTING_KEY = 'default_onboarding_flow';

export function useDefaultOnboarding() {
  const { data: flowId = '' as string, isLoading } = useQuery({
    queryKey: ['app-setting', APP_SETTING_KEY],
    queryFn: async () => {
      const { data } = await (supabase
        .from('app_settings')
        .select('value')
        .eq('key', APP_SETTING_KEY)
        .maybeSingle() as any);
      return (data?.value as string) || '';
    },
    staleTime: 1000 * 60 * 10,
  });

  return { flowId, isLoading };
}

export function useSetDefaultOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (flowId: string) => {
      const { error } = await (supabase
        .from('app_settings')
        .upsert({ key: APP_SETTING_KEY, value: flowId, updated_at: new Date().toISOString() }, { onConflict: 'key' }) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-setting', APP_SETTING_KEY] });
    },
  });
}
