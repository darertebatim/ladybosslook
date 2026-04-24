import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getStoredAttribution,
  isAttributionProcessed,
  markAttributionProcessed,
} from '@/lib/appsflyer';

const URL_INSTRUCTOR_KEY = 'rilo_instructor_slug_pending';

export interface PendingInstructor {
  id: string;
  slug: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  default_program_slug: string | null;
  default_routine_ids: string[];
  default_playlist_ids: string[];
  default_channel_ids: string[];
  plus_trial_days: number;
  source: 'appsflyer' | 'url';
  rawAttribution: Record<string, unknown> | null;
}

/**
 * Capture an instructor slug from the URL (?instructor=sarah) so it survives
 * the auth/signup roundtrip even on web. AppsFlyer covers the native install
 * case automatically; this is the explicit web-link fallback.
 *
 * Note: we do NOT clear the processed flag here — the hook below decides
 * per-instructor whether to show the invite modal again (stacking).
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

function readPendingSlug(): { slug: string; source: 'appsflyer' | 'url'; raw: Record<string, unknown> | null } | null {
  try {
    const fromUrl = localStorage.getItem(URL_INSTRUCTOR_KEY);
    if (fromUrl) return { slug: fromUrl, source: 'url', raw: null };
  } catch {/* ignore */}

  if (isAttributionProcessed()) return null;
  const attribution = getStoredAttribution();
  if (attribution?.instructorSlug) {
    return { slug: attribution.instructorSlug, source: 'appsflyer', raw: attribution.raw };
  }
  return null;
}

/**
 * Server-side admin assignment fallback. If an admin sets
 * profiles.referred_by_instructor_id directly (no URL/AppsFlyer),
 * we still want the full setup to run on the user's next app open.
 */
async function readServerAssignedInstructorSlug(userId: string): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by_instructor_id')
      .eq('id', userId)
      .maybeSingle();
    const instructorId = (profile as any)?.referred_by_instructor_id;
    if (!instructorId) return null;

    // Only auto-trigger if no referral row yet for this instructor
    const { data: existing } = await supabase
      .from('instructor_referrals')
      .select('id')
      .eq('user_id', userId)
      .eq('instructor_id', instructorId)
      .maybeSingle();
    if (existing) return null;

    const { data: ins } = await supabase
      .from('instructors')
      .select('slug')
      .eq('id', instructorId)
      .eq('is_active', true)
      .maybeSingle();
    return (ins as any)?.slug ?? null;
  } catch {
    return null;
  }
}

function clearPendingSlug() {
  try { localStorage.removeItem(URL_INSTRUCTOR_KEY); } catch {/* ignore */}
  markAttributionProcessed();
}

/**
 * Apply an instructor's setup to a user (enroll in program, add routines, tag profile,
 * grant Plus trial if eligible, create referral record).
 *
 * All work runs server-side via the `apply-instructor-bundle` edge function.
 * Idempotent per (user, instructor): the edge function relies on the unique
 * constraint on `instructor_referrals` to prevent double-application by the
 * same instructor; different instructors stack.
 */
export async function applyInstructorSetup(
  _userId: string,
  instructor: PendingInstructor,
): Promise<{ ok: boolean; granted: { program: boolean; routines: number; playlists: number; channels: number; trial: boolean } }> {
  const empty = { program: false, routines: 0, playlists: 0, channels: 0, trial: false };
  try {
    const { data, error } = await supabase.functions.invoke('apply-instructor-bundle', {
      body: {
        instructor_slug: instructor.slug,
        attribution_source: instructor.source,
        raw_attribution:
          instructor.rawAttribution ?? { source: instructor.source, slug: instructor.slug },
      },
    });

    if (error) {
      console.warn('[InstructorOnboarding] Edge function error:', error.message);
      return { ok: false, granted: empty };
    }

    const result = data as { ok?: boolean; granted?: typeof empty; already_applied?: boolean } | null;
    if (!result?.ok) {
      return { ok: false, granted: empty };
    }

    const granted = result.granted ?? empty;
    console.log('[InstructorOnboarding] ✅ Applied setup from', instructor.slug, granted);
    return { ok: true, granted };
  } catch (err) {
    console.warn('[InstructorOnboarding] Unexpected error:', err);
    return { ok: false, granted: empty };
  }
}

/**
 * Detects a pending instructor invite for the current user and exposes it to UI.
 *
 * Behaviour:
 * - If no pending slug → returns null (nothing to do).
 * - If pending slug found and user already has a referral row from THAT instructor → clears pending, returns null.
 * - Otherwise → looks up the instructor and exposes it via `pendingInvite`.
 *   The UI (InstructorInviteModal) shows a confirmation, then calls `accept()` to apply.
 *
 * Different instructors stack — the unique constraint is per (user_id, instructor_id).
 */
export function useInstructorOnboarding(userId: string | undefined) {
  const queryClient = useQueryClient();
  const attempts = useRef(0);
  const [pendingInvite, setPendingInvite] = useState<PendingInstructor | null>(null);

  useEffect(() => {
    if (!userId) return;
    attempts.current = 0;
    let cancelled = false;
    let timer: number | null = null;

    const run = async (): Promise<boolean> => {
      attempts.current += 1;
      let pending = readPendingSlug();
      let autoApply = false;

      // Fallback: admin assigned an instructor on the profile directly
      if (!pending) {
        const serverSlug = await readServerAssignedInstructorSlug(userId);
        if (!serverSlug) return attempts.current >= 5;
        pending = { slug: serverSlug, source: 'url', raw: { source: 'admin_assignment' } };
        autoApply = true; // skip the invite modal — admin already decided
      }

      try {
        // Look up instructor
        const { data: instructor, error: lookupErr } = await supabase
          .from('instructors')
          .select('id, slug, display_name, photo_url, bio, default_program_slug, default_routine_ids, default_playlist_ids, default_channel_ids, plus_trial_days')
          .eq('slug', pending.slug)
          .eq('is_active', true)
          .maybeSingle();

        if (lookupErr || !instructor) {
          console.warn('[InstructorOnboarding] Instructor not found:', pending.slug);
          clearPendingSlug();
          return true;
        }

        // Already applied by this specific instructor? bail (stacking allowed for others).
        const { data: existing } = await supabase
          .from('instructor_referrals')
          .select('id')
          .eq('user_id', userId)
          .eq('instructor_id', (instructor as any).id)
          .maybeSingle();

        if (existing) {
          clearPendingSlug();
          return true;
        }

        const ins = instructor as any;
        const invite: PendingInstructor = {
          id: ins.id,
          slug: ins.slug,
          display_name: ins.display_name,
          photo_url: ins.photo_url,
          bio: ins.bio,
          default_program_slug: ins.default_program_slug,
          default_routine_ids: ins.default_routine_ids || [],
          default_playlist_ids: ins.default_playlist_ids || [],
          default_channel_ids: ins.default_channel_ids || [],
          plus_trial_days: ins.plus_trial_days || 0,
          source: pending.source,
          rawAttribution: pending.raw,
        };

        if (autoApply) {
          // Server-assigned: silently apply full setup, no modal
          const result = await applyInstructorSetup(userId, invite);
          if (result.ok) {
            console.log('[InstructorOnboarding] Auto-applied admin-assigned instructor', invite.slug, result.granted);
            clearPendingSlug();
            queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
            queryClient.invalidateQueries({ queryKey: ['user-enrollment-slugs'] });
            queryClient.invalidateQueries({ queryKey: ['planner-all-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['user-routines-bank'] });
            queryClient.invalidateQueries({ queryKey: ['new-home-data'] });
            queryClient.invalidateQueries({ queryKey: ['home-data', userId] });
            return true;
          }
          return attempts.current >= 5;
        } else {
          setPendingInvite(invite);
          return true;
        }
      } catch (err) {
        console.warn('[InstructorOnboarding] Detect error:', err);
        return attempts.current >= 5;
      }
    };

    const schedule = (delay: number) => {
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        const done = await run();
        if (!done && !cancelled) schedule(2500);
      }, delay);
    };

    // Defer slightly so auth/profile state settles, then retry a few times.
    schedule(1500);
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [userId, queryClient]);

  const accept = useCallback(async () => {
    if (!userId || !pendingInvite) return;
    const result = await applyInstructorSetup(userId, pendingInvite);
    if (result.ok) {
      clearPendingSlug();
      setPendingInvite(null);
    }
    return result;
  }, [userId, pendingInvite]);

  const decline = useCallback(() => {
    clearPendingSlug();
    setPendingInvite(null);
  }, []);

  return { pendingInvite, accept, decline };
}