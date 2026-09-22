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

const WAITLIST_KEY = 'lead_campaigns_waitlist';
const WAITLIST_QK = ['app-setting', WAITLIST_KEY];

/** Keys of lead campaigns currently in waitlist mode (no active webinar). */
export function useWaitlistLeadCampaigns() {
  const { data = [] as string[], isLoading } = useQuery({
    queryKey: WAITLIST_QK,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase
        .from('app_settings')
        .select('value')
        .eq('key', WAITLIST_KEY)
        .maybeSingle() as any);
      try {
        const parsed = JSON.parse((data?.value as string) || '[]');
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    },
  });

  return { waitlist: data, isLoading };
}

export function useSetLeadCampaignWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keys }: { keys: string[] }) => {
      const { error } = await (supabase
        .from('app_settings')
        .upsert(
          { key: WAITLIST_KEY, value: JSON.stringify(keys), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WAITLIST_QK }),
  });
}

const SLOT_KEY = 'lead_campaigns_slot_choice';
const SLOT_QK = ['app-setting', SLOT_KEY];

/** Keys of lead campaigns where visitors pick their own session instead of timezone routing. */
export function useSlotChoiceLeadCampaigns() {
  const { data = [] as string[], isLoading } = useQuery({
    queryKey: SLOT_QK,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await (supabase
        .from('app_settings')
        .select('value')
        .eq('key', SLOT_KEY)
        .maybeSingle() as any);
      try {
        const parsed = JSON.parse((data?.value as string) || '[]');
        return Array.isArray(parsed) ? (parsed as string[]) : [];
      } catch {
        return [];
      }
    },
  });

  return { slotChoice: data, isLoading };
}

export function useSetLeadCampaignSlotChoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keys }: { keys: string[] }) => {
      const { error } = await (supabase
        .from('app_settings')
        .upsert(
          { key: SLOT_KEY, value: JSON.stringify(keys), updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        ) as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SLOT_QK }),
  });
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
