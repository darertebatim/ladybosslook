import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addRoutineToUserPlanner } from '@/hooks/useRoutinesBank';
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
 * Idempotent per (user, instructor): unique constraint on instructor_referrals
 * prevents double-application by the same instructor; different instructors stack.
 */
export async function applyInstructorSetup(
  userId: string,
  instructor: PendingInstructor,
): Promise<{ ok: boolean; granted: { program: boolean; routines: number; playlists: number; channels: number; trial: boolean } }> {
  const granted = { program: false, routines: 0, playlists: 0, channels: 0, trial: false };

  try {
    // 1. Create referral record (unique constraint prevents duplicate per instructor)
    const { error: refErr } = await supabase.from('instructor_referrals').insert({
      user_id: userId,
      instructor_id: instructor.id,
      attribution_source: instructor.source,
      raw_attribution: instructor.rawAttribution ?? { source: instructor.source, slug: instructor.slug },
    } as any);

    if (refErr) {
      // 23505 = unique violation → already applied by this instructor; treat as success
      const code = (refErr as any).code;
      if (code !== '23505') {
        console.warn('[InstructorOnboarding] Failed to record referral:', refErr.message);
        return { ok: false, granted };
      }
      console.log('[InstructorOnboarding] Already applied by', instructor.slug, '— skipping');
      return { ok: true, granted };
    }

    // 2. Tag profile (latest instructor wins for the tag column)
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
        const courseName = (catalog as any)?.title || instructor.default_program_slug;

        await supabase.from('course_enrollments').insert({
          user_id: userId,
          program_slug: instructor.default_program_slug,
          course_name: courseName,
          status: 'active',
        });
        granted.program = true;
      }
    }

    // 4. Add default routines to user's bank
    const routineIds = instructor.default_routine_ids || [];
    for (const routineId of routineIds) {
      try {
        const { data: alreadyAdded } = await supabase
          .from('user_routines_bank')
          .select('id')
          .eq('user_id', userId)
          .eq('routine_id', routineId)
          .maybeSingle();
        if (alreadyAdded) continue;

        // Use the same flow as "Add to my routines" so the routine shows up
        // in the Routine Player AND its tasks land in the Planner immediately.
        await addRoutineToUserPlanner(userId, routineId);
        granted.routines += 1;
      } catch (err) {
        console.warn('[InstructorOnboarding] Failed to add routine', routineId, err);
      }
    }

    // 5. Unlock default audio playlists (free access via playlist_saves)
    const playlistIds = instructor.default_playlist_ids || [];
    for (const playlistId of playlistIds) {
      try {
        const { data: alreadySaved } = await supabase
          .from('playlist_saves' as any)
          .select('id')
          .eq('user_id', userId)
          .eq('playlist_id', playlistId)
          .maybeSingle();
        if (alreadySaved) continue;

        await supabase.from('playlist_saves' as any).insert({
          user_id: userId,
          playlist_id: playlistId,
        });
        granted.playlists += 1;
      } catch (err) {
        console.warn('[InstructorOnboarding] Failed to unlock playlist', playlistId, err);
      }
    }

    // 5b. Auto-join chat channels — channels are visible by default; we just
    // ensure the user is NOT in feed_channel_exclusions so the channel shows up.
    const channelIds = instructor.default_channel_ids || [];
    if (channelIds.length > 0) {
      try {
        const { error: chErr } = await supabase
          .from('feed_channel_exclusions')
          .delete()
          .eq('user_id', userId)
          .in('channel_id', channelIds);
        if (!chErr) granted.channels = channelIds.length;
      } catch (err) {
        console.warn('[InstructorOnboarding] Failed to auto-join channels', err);
      }
    }

    // 6. Grant Plus trial — ONE TIME ONLY across all instructors
    if (instructor.plus_trial_days > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plus_trial_granted_at')
        .eq('id', userId)
        .maybeSingle();

      if (!(profile as any)?.plus_trial_granted_at) {
        const expiresAt = new Date(Date.now() + instructor.plus_trial_days * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('user_subscriptions').insert({
          user_id: userId,
          program_slug: 'simora-plus',
          status: 'active',
          platform: 'instructor_trial',
          product_id: `instructor_trial_${instructor.slug}`,
          expires_at: expiresAt,
        } as any);
        await supabase
          .from('profiles')
          .update({
            plus_trial_granted_at: new Date().toISOString(),
            plus_trial_granted_by_instructor_id: instructor.id,
          } as any)
          .eq('id', userId);
        granted.trial = true;
      }
    }

    console.log('[InstructorOnboarding] ✅ Applied setup from', instructor.slug, granted);
    return { ok: true, granted };
  } catch (err) {
    console.warn('[InstructorOnboarding] Unexpected error:', err);
    return { ok: false, granted };
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
  const ran = useRef(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInstructor | null>(null);

  useEffect(() => {
    if (!userId || ran.current) return;
    ran.current = true;

    const run = async () => {
      let pending = readPendingSlug();
      let autoApply = false;

      // Fallback: admin assigned an instructor on the profile directly
      if (!pending) {
        const serverSlug = await readServerAssignedInstructorSlug(userId);
        if (!serverSlug) return;
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
          return;
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
          return;
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
          }
        } else {
          setPendingInvite(invite);
        }
      } catch (err) {
        console.warn('[InstructorOnboarding] Detect error:', err);
      }
    };

    // Defer slightly so the profile row from handle_new_user trigger exists.
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [userId]);

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