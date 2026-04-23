import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getStoredAttribution,
  isAttributionProcessed,
  markAttributionProcessed,
} from '@/lib/appsflyer';

const URL_INSTRUCTOR_KEY = 'rilo_instructor_slug_pending';

/**
 * Capture an instructor slug from the URL (?instructor=sarah) so it survives
 * the auth/signup roundtrip even on web. AppsFlyer covers the native install
 * case automatically; this is the explicit web-link fallback.
 */
export function captureInstructorFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('instructor') || params.get('ref');
    if (slug) {
      localStorage.setItem(URL_INSTRUCTOR_KEY, slug.trim().toLowerCase());
    }
  } catch {/* ignore */}
}

function getPendingInstructorSlug(): string | null {
  try {
    const fromUrl = localStorage.getItem(URL_INSTRUCTOR_KEY);
    if (fromUrl) return fromUrl;
  } catch {/* ignore */}

  if (isAttributionProcessed()) return null;
  const attribution = getStoredAttribution();
  return attribution?.instructorSlug || null;
}

/**
 * Auto-applies an instructor's setup to a newly-signed-up user.
 * Idempotent — safe to mount on every layout render.
 *
 * Flow:
 * 1. Read pending instructor slug (from AppsFlyer attribution or ?instructor= URL).
 * 2. If user already has an `instructor_referrals` row, do nothing.
 * 3. Look up instructor → enroll in default program, add default routines,
 *    tag profile, create referral record. Trial granting is handled by the
 *    welcome sheet (so the user sees what they're getting).
 */
export function useInstructorOnboarding(userId: string | undefined) {
  const ran = useRef(false);

  useEffect(() => {
    if (!userId || ran.current) return;
    ran.current = true;

    const run = async () => {
      const slug = getPendingInstructorSlug();
      if (!slug) return;

      try {
        // Already linked? bail.
        const { data: existing } = await supabase
          .from('instructor_referrals')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        if (existing) {
          markAttributionProcessed();
          localStorage.removeItem(URL_INSTRUCTOR_KEY);
          return;
        }

        // Look up instructor
        const { data: instructor, error: lookupErr } = await supabase
          .from('instructors')
          .select('id, slug, display_name, default_program_slug, default_routine_ids')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (lookupErr || !instructor) {
          console.warn('[InstructorOnboarding] Instructor not found:', slug);
          markAttributionProcessed();
          localStorage.removeItem(URL_INSTRUCTOR_KEY);
          return;
        }

        const attribution = getStoredAttribution();

        // 1. Create referral record
        const { error: refErr } = await supabase.from('instructor_referrals').insert({
          user_id: userId,
          instructor_id: instructor.id,
          attribution_source: attribution ? 'appsflyer' : 'url',
          raw_attribution: attribution?.raw ?? { source: 'url_param', slug },
        } as any);
        if (refErr) {
          console.warn('[InstructorOnboarding] Failed to record referral:', refErr.message);
          return; // don't mark processed — let it retry next session
        }

        // 2. Tag profile
        await supabase
          .from('profiles')
          .update({ referred_by_instructor_id: instructor.id } as any)
          .eq('id', userId);

        // 3. Auto-enroll in default program
        if (instructor.default_program_slug) {
          const { data: existingEnroll } = await supabase
            .from('course_enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('program_slug', instructor.default_program_slug)
            .maybeSingle();

          if (!existingEnroll) {
            const { data: catalog } = await supabase
              .from('program_catalog' as any)
              .select('title')
              .eq('slug', instructor.default_program_slug)
              .maybeSingle();
            const courseName =
              (catalog as any)?.title || instructor.default_program_slug;

            await supabase.from('course_enrollments').insert({
              user_id: userId,
              program_slug: instructor.default_program_slug,
              course_name: courseName,
              status: 'active',
            });
          }
        }

        // 4. Add default routines to user's bank
        const routineIds = instructor.default_routine_ids || [];
        if (routineIds.length > 0) {
          for (const routineId of routineIds) {
            try {
              const { data: alreadyAdded } = await supabase
                .from('user_routines_bank')
                .select('id')
                .eq('user_id', userId)
                .eq('routine_id', routineId)
                .maybeSingle();
              if (alreadyAdded) continue;

              await supabase.from('user_routines_bank').insert({
                user_id: userId,
                routine_id: routineId,
                added_at: new Date().toISOString(),
              } as any);
            } catch (err) {
              console.warn('[InstructorOnboarding] Failed to add routine', routineId, err);
            }
          }
        }

        markAttributionProcessed();
        localStorage.removeItem(URL_INSTRUCTOR_KEY);
        console.log('[InstructorOnboarding] ✅ Applied setup from instructor:', instructor.slug);
      } catch (err) {
        console.warn('[InstructorOnboarding] Unexpected error:', err);
      }
    };

    // Defer slightly so the profile row from handle_new_user trigger exists.
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [userId]);
}