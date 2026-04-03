import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const KEYS = {
  nickname: 'simora_onboarding_nickname',
  gender: 'simora_onboarding_gender',
  ageGroup: 'simora_onboarding_age_group',
  language: 'simora_onboarding_language',
};

/** Map onboarding label → profile language code */
const LANGUAGE_MAP: Record<string, string> = {
  'English only': 'en',
  'Persian': 'fa',
  'Turkish': 'tr',
  'Spanish': 'es',
};

/**
 * After signup, syncs onboarding answers (nickname, gender, age group, language)
 * from localStorage into the user's profile.
 */
export function useOnboardingProfileSync(userId: string | undefined) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;

    const nickname = localStorage.getItem(KEYS.nickname);
    const gender = localStorage.getItem(KEYS.gender);
    const ageGroup = localStorage.getItem(KEYS.ageGroup);
    const language = localStorage.getItem(KEYS.language);

    // Nothing to sync
    if (!nickname && !gender && !ageGroup && !language) return;

    hasRun.current = true;

    (async () => {
      try {
        // Only update fields that are currently empty
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, gender, date_of_birth, preferred_language')
          .eq('id', userId)
          .single();

        if (!profile) return;

        const finalUpdates: Record<string, string> = {};
        if (nickname && (!profile.full_name || profile.full_name.trim() === '')) {
          finalUpdates.full_name = nickname;
        }
        if (gender && !profile.gender) {
          finalUpdates.gender = gender.toLowerCase();
        }
        if (language && !profile.preferred_language) {
          const code = LANGUAGE_MAP[language] || language.toLowerCase();
          if (code && code !== 'en') {
            // Only set if it's a second language (not "English only")
            finalUpdates.preferred_language = code;
          }
        }
        // Age group is informational — stored in onboarding_answers table only

        if (Object.keys(finalUpdates).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(finalUpdates)
            .eq('id', userId);

          if (error) {
            console.error('[OnboardingSync] Profile update failed:', error);
            hasRun.current = false;
            return;
          }
          console.log('[OnboardingSync] Updated profile:', Object.keys(finalUpdates));
        }

        // Clean up localStorage
        Object.values(KEYS).forEach(k => localStorage.removeItem(k));
      } catch (err) {
        console.error('[OnboardingSync] Failed:', err);
        hasRun.current = false;
      }
    })();
  }, [userId]);
}
