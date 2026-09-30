import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * The user's first name for greetings. Always prefers the profile name
 * (profiles.full_name) — the single source of truth shown on the Profile
 * page — and falls back to the auth account name only when the profile
 * has no name yet.
 */
export function useFirstName(): string {
  const { user } = useAuth();

  const { data: profileName } = useQuery({
    queryKey: ['profile-first-name', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .maybeSingle();
      return (data?.full_name ?? '').toString().trim();
    },
  });

  const raw =
    profileName ||
    (user?.user_metadata?.full_name || user?.user_metadata?.name || '')
      .toString()
      .trim();

  return raw.split(' ')[0] || '';
}
