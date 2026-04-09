import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUERY_KEY = ['special-banner-settings'];

/** Fetch all special_banner_disabled_* settings from app_settings */
export function useSpecialBannerSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .like('key', 'special_banner_disabled_%');
      if (error) throw error;
      const map: Record<string, boolean> = {};
      (data || []).forEach((row) => {
        const component = row.key.replace('special_banner_disabled_', '');
        map[component] = row.value === 'true';
      });
      return map;
    },
    staleTime: 60_000,
  });
}

/** Toggle a special banner's disabled state in the DB */
export function useToggleSpecialBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ component, disabled }: { component: string; disabled: boolean }) => {
      const key = `special_banner_disabled_${component}`;
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: String(disabled), updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ key, value: String(disabled), description: `Disable ${component} special banner` });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** Standalone check for app-side components (uses a simple query) */
export async function checkSpecialBannerDisabled(component: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `special_banner_disabled_${component}`)
      .maybeSingle();
    return data?.value === 'true';
  } catch {
    return false;
  }
}
