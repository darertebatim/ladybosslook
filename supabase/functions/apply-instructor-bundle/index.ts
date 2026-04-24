import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  instructor_slug: string;
  attribution_source?: 'appsflyer' | 'url' | 'admin_assignment';
  raw_attribution?: Record<string, unknown> | null;
}

interface Granted {
  program: boolean;
  routines: number;
  playlists: number;
  channels: number;
  trial: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: must be a logged-in user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing authorization' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Validate caller's JWT using anon client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ error: 'Invalid auth' }, 401);
    }
    const userId = userRes.user.id;

    // Parse + validate body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    const slug = (body.instructor_slug || '').trim().toLowerCase();
    if (!slug) return json({ error: 'instructor_slug required' }, 400);
    const source = body.attribution_source ?? 'url';
    const rawAttribution = body.raw_attribution ?? { source, slug };

    // Service-role client for privileged work
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Lookup instructor
    const { data: instructor, error: insErr } = await admin
      .from('instructors')
      .select('id, slug, display_name, default_program_slug, default_routine_ids, default_playlist_ids, default_channel_ids, plus_trial_days')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (insErr) {
      return json({ error: 'Lookup failed', detail: insErr.message }, 500);
    }
    if (!instructor) {
      return json({ error: 'Instructor not found' }, 404);
    }

    const granted: Granted = {
      program: false,
      routines: 0,
      playlists: 0,
      channels: 0,
      trial: false,
    };

    // 2. Create referral row (unique per user+instructor → idempotent)
    const { error: refErr } = await admin.from('instructor_referrals').insert({
      user_id: userId,
      instructor_id: instructor.id,
      attribution_source: source,
      raw_attribution: rawAttribution,
    });
    if (refErr) {
      const code = (refErr as { code?: string }).code;
      if (code === '23505') {
        return json({ ok: true, already_applied: true, granted });
      }
      return json({ error: 'Referral insert failed', detail: refErr.message }, 500);
    }

    // 3. Tag profile (latest instructor wins)
    await admin
      .from('profiles')
      .update({ referred_by_instructor_id: instructor.id })
      .eq('id', userId);

    // 4. Auto-enroll in default program
    if (instructor.default_program_slug) {
      const { data: existingEnroll } = await admin
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('program_slug', instructor.default_program_slug)
        .maybeSingle();

      if (!existingEnroll) {
        const { data: catalog } = await admin
          .from('program_catalog')
          .select('title')
          .eq('slug', instructor.default_program_slug)
          .maybeSingle();
        const courseName = catalog?.title || instructor.default_program_slug;

        const { error: enrollErr } = await admin.from('course_enrollments').insert({
          user_id: userId,
          program_slug: instructor.default_program_slug,
          course_name: courseName,
          status: 'active',
        });
        if (!enrollErr) granted.program = true;
        else console.warn('Enroll failed:', enrollErr.message);
      }
    }

    // 5. Add default routines (uses provision_routine_for_user RPC)
    const routineIds: string[] = instructor.default_routine_ids || [];
    for (const routineId of routineIds) {
      const { data: result, error: rpcErr } = await admin.rpc('provision_routine_for_user', {
        p_user_id: userId,
        p_routine_id: routineId,
      });
      if (rpcErr) {
        console.warn('Routine provision failed for', routineId, rpcErr.message);
        continue;
      }
      const r = result as { ok?: boolean; skipped?: boolean } | null;
      if (r?.ok) granted.routines += 1;
    }

    // 6. Unlock default playlists via playlist_saves
    const playlistIds: string[] = instructor.default_playlist_ids || [];
    for (const playlistId of playlistIds) {
      const { data: alreadySaved } = await admin
        .from('playlist_saves')
        .select('id')
        .eq('user_id', userId)
        .eq('playlist_id', playlistId)
        .maybeSingle();
      if (alreadySaved) continue;

      const { error: saveErr } = await admin.from('playlist_saves').insert({
        user_id: userId,
        playlist_id: playlistId,
      });
      if (!saveErr) granted.playlists += 1;
      else console.warn('Playlist save failed:', saveErr.message);
    }

    // 7. Auto-join chat channels (remove from exclusions)
    const channelIds: string[] = instructor.default_channel_ids || [];
    if (channelIds.length > 0) {
      const { error: chErr } = await admin
        .from('feed_channel_exclusions')
        .delete()
        .eq('user_id', userId)
        .in('channel_id', channelIds);
      if (!chErr) granted.channels = channelIds.length;
    }

    // 8. Plus trial — ONE TIME across all instructors
    if ((instructor.plus_trial_days || 0) > 0) {
      const { data: profile } = await admin
        .from('profiles')
        .select('plus_trial_granted_at')
        .eq('id', userId)
        .maybeSingle();

      if (!profile?.plus_trial_granted_at) {
        const expiresAt = new Date(
          Date.now() + instructor.plus_trial_days * 24 * 60 * 60 * 1000,
        ).toISOString();

        const { error: subErr } = await admin.from('user_subscriptions').insert({
          user_id: userId,
          program_slug: 'simora-plus',
          status: 'active',
          platform: 'instructor_trial',
          product_id: `instructor_trial_${instructor.slug}`,
          expires_at: expiresAt,
        });
        if (!subErr) {
          await admin
            .from('profiles')
            .update({
              plus_trial_granted_at: new Date().toISOString(),
              plus_trial_granted_by_instructor_id: instructor.id,
            })
            .eq('id', userId);
          granted.trial = true;
        }
      }
    }

    console.log(`[apply-instructor-bundle] ✅ ${slug} → user ${userId}`, granted);

    return json({
      ok: true,
      instructor: {
        id: instructor.id,
        slug: instructor.slug,
        display_name: instructor.display_name,
      },
      granted,
    });
  } catch (err: any) {
    console.error('[apply-instructor-bundle] Error:', err);
    return json({ error: 'Internal error', detail: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}