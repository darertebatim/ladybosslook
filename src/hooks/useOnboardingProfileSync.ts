import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const KEYS = {
  nickname: 'simora_onboarding_nickname',
  gender: 'simora_onboarding_gender',
  ageGroup: 'simora_onboarding_age_group',
};

/**
 * After signup, syncs onboarding answers (nickname, gender, age group)
 * from localStorage into the user's profile.
 */
export function useOnboardingProfileSync(userId: string | undefined) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!userId || hasRun.current) return;

    const nickname = localStorage.getItem(KEYS.nickname);
    const gender = localStorage.getItem(KEYS.gender);
    const ageGroup = localStorage.getItem(KEYS.ageGroup);

    // Nothing to sync
    if (!nickname && !gender && !ageGroup) return;

    hasRun.current = true;

    (async () => {
      try {
        const updates: Record<string, string> = {};

        if (nickname) updates.full_name = nickname;
        if (gender) updates.gender = gender.toLowerCase();
        if (ageGroup) updates.date_of_birth = ageGroup; // Store age group as-is; profile has no age_group field

        // Only update fields that are currently empty
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, gender, date_of_birth')
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
        // Don't overwrite date_of_birth with age group if user already has one set
        // Age group is informational — store in onboarding_answers table only

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
