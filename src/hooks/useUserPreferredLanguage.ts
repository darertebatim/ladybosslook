import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/** Maps profile language codes (fa, en) to playlist/content language values (persian, american) */
const PROFILE_TO_CONTENT_LANG: Record<string, string> = {
  fa: 'persian',
  en: 'american',
  tr: 'turkish',
  es: 'spanish',
};

/**
 * Returns the user's preferred language mapped to content language values.
 * E.g., profile stores "fa" → returns "persian"
 */
export function useUserPreferredLanguage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['user-preferred-language', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user!.id)
        .single();
      if (error) return null;
      return data?.preferred_language || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const mapped = data ? PROFILE_TO_CONTENT_LANG[data] || data : null;
  return mapped;
}

/**
 * Sort comparator: items matching the user's preferred language come first.
 * Use with Array.sort(): items.sort(preferredLanguageSorter(lang))
 */
export function preferredLanguageSorter(preferredLang: string | null) {
  return (a: { language?: string }, b: { language?: string }) => {
    if (!preferredLang) return 0;
    const aMatch = a.language === preferredLang ? 0 : 1;
    const bMatch = b.language === preferredLang ? 0 : 1;
    return aMatch - bMatch;
  };
}
