import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const KEY = 'lead_campaigns_inactive';
const QK = ['app-setting', KEY];

/** Keys of lead campaigns the admin has deactivated (hidden from tabs). */
export function useInactiveLeadCampaigns() {
  const { data = [] as string[], isLoading } = useQuery({
    queryKey: QK,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase
        .from('app_settings')
        .select('value')
        .eq('key', KEY)
        .maybeSingle() as any);
      try {
        const parsed = JSON.parse((data?.value as string) || '[]');
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    },
  });

  return { inactive: data, isLoading };
}

export function useSetLeadCampaignActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keys }: { keys: string[] }) => {
      const { error } = await (supabase
        .from('app_settings')
        .upsert(
          { key: KEY, value: JSON.stringify(keys), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK }),
  });
}
