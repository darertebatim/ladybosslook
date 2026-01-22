import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting drip notification check...');

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Get today's date (midnight UTC for date comparison)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Find all active rounds with playlists (including first_session_date and drip_offset_days)
    const { data: activeRounds, error: roundsError } = await supabase
      .from('program_rounds')
      .select(`
        id,
        round_name,
        start_date,
        first_session_date,
        drip_offset_days,
        audio_playlist_id,
        program_slug,
        audio_playlists (
          id,
          name
        )
      `)
      .not('audio_playlist_id', 'is', null);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      throw roundsError;
    }

    console.log(`Found ${activeRounds?.length || 0} rounds with playlists`);

    let notificationsSent = 0;
    let roundsProcessed = 0;

    for (const round of activeRounds || []) {
      // Use first_session_date for drip timing, fallback to start_date
      const dripBaseDate = round.first_session_date || round.start_date;
      if (!dripBaseDate) {
        console.log(`Skipping round "${round.round_name}" - no first_session_date or start_date`);
        continue;
      }

      // Parse the drip base date (may include time)
      const dripBase = dripBaseDate.includes('T') 
        ? new Date(dripBaseDate)
        : new Date(dripBaseDate + 'T00:00:00');
      
      // Extract the hour and minute from first_session_date for time-based triggering
      const sessionHour = dripBase.getUTCHours();
      const sessionMinute = dripBase.getUTCMinutes();
      
      // Check if current time matches the session time (within 30-minute window)
      // This ensures drip content is released at the same time as the first session
      const hourMatches = currentHour === sessionHour;
      const minuteWithinWindow = Math.abs(currentMinute - sessionMinute) < 30;
      
      if (!hourMatches || !minuteWithinWindow) {
        console.log(`Skipping round "${round.round_name}" - not time yet (session time: ${sessionHour}:${sessionMinute.toString().padStart(2, '0')} UTC, current: ${currentHour}:${currentMinute.toString().padStart(2, '0')} UTC)`);
        continue;
      }
      
      console.log(`Round "${round.round_name}" - time matches! (session time: ${sessionHour}:${sessionMinute.toString().padStart(2, '0')} UTC)`);

      const dripOffset = round.drip_offset_days || 0;
      
      // Calculate days since drip base date (using date only, not time)
      const dripBaseDateOnly = new Date(dripBase);
      dripBaseDateOnly.setUTCHours(0, 0, 0, 0);
      const daysSinceDripBase = Math.floor((today.getTime() - dripBaseDateOnly.getTime()) / (1000 * 60 * 60 * 24));
      
      // The effective day for drip content, accounting for freezes/forwards
      // New logic: drip_delay_days = 1 means at first session, so effective day 0 corresponds to drip_delay_days = 1
      // effective_drip_day = daysSinceDripBase - dripOffset + 1
      const effectiveDripDay = daysSinceDripBase - dripOffset + 1;

      console.log(`Round "${round.round_name}": drip base = ${dripBaseDate}, ${daysSinceDripBase} days since, offset: ${dripOffset}, effective drip day: ${effectiveDripDay}`);

      // Skip if first session hasn't happened yet (effective drip day < 1)
      if (effectiveDripDay < 1) {
        console.log(`Skipping round "${round.round_name}" - first session hasn't happened yet`);
        continue;
      }

      roundsProcessed++;

      // Find tracks that unlock today (drip_delay_days === effectiveDripDay)
      // Note: drip_delay_days = 0 is always available (no notification needed)
      // drip_delay_days = 1 unlocks at first session, = 2 unlocks 1 day after, etc.
      const { data: unlockedTracks, error: tracksError } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          drip_delay_days,
          audio_content (
            id,
            title
          )
        `)
        .eq('playlist_id', round.audio_playlist_id)
        .eq('drip_delay_days', effectiveDripDay);

      if (tracksError) {
        console.error('Error fetching tracks:', tracksError);
        continue;
      }

      if (!unlockedTracks || unlockedTracks.length === 0) {
        console.log(`No tracks unlocking today for round "${round.round_name}"`);
        continue;
      }

      console.log(`${unlockedTracks.length} track(s) unlocking today for round "${round.round_name}"`);

      // Get users enrolled in this round
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('round_id', round.id)
        .eq('status', 'active');

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        continue;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log(`No active enrollments for round "${round.round_name}"`);
        continue;
      }

      const userIds = enrollments.map(e => e.user_id);
      console.log(`Found ${userIds.length} enrolled users`);

      // Get push subscriptions for these users
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('No push subscriptions found for enrolled users');
        continue;
      }

      // Send notifications and create feed posts for each unlocked track
      for (const track of unlockedTracks) {
        const trackTitle = track.audio_content?.title || 'New Content';
        const playlistName = round.audio_playlists?.name || round.round_name;

        // Create a feed post for this drip unlock (if round has a channel)
        try {
          // Check if round has a channel
          const { data: roundChannel } = await supabase
            .from('feed_channels')
            .select('id')
            .eq('round_id', round.id)
            .single();

          if (roundChannel) {
            // Get an admin user ID for the author
            const { data: adminUser } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'admin')
              .limit(1)
              .single();

            await supabase.from('feed_posts').insert({
              channel_id: roundChannel.id,
              author_id: adminUser?.user_id || null,
              post_type: 'drip_unlock',
              title: `🎧 New Lesson Available!`,
              content: `"${trackTitle}" is now available. Tap to listen!`,
              action_type: 'play_audio',
              action_data: { 
                playlistId: round.audio_playlist_id, 
                audioId: track.audio_content?.id,
                label: 'Listen Now'
              },
              is_system: true,
              send_push: false, // We're already sending push separately
            });
            console.log(`Created feed post for track "${trackTitle}" in round channel`);
          }
        } catch (feedErr) {
          console.error('Error creating feed post:', feedErr);
          // Don't fail the whole function if feed post creation fails
        }

        // Call send-push-notification for each subscribed user
        for (const sub of subscriptions) {
          try {
            const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: sub.user_id,
                title: '🎧 New Content Available!',
                body: `"${trackTitle}" is now available in ${playlistName}`,
                data: {
                  type: 'drip_unlock',
                  playlist_id: round.audio_playlist_id,
                  track_id: track.audio_content?.id,
                },
              },
            });

            if (pushError) {
              console.error(`Failed to send push to user ${sub.user_id}:`, pushError);
            } else {
              notificationsSent++;
              console.log(`Sent notification to user ${sub.user_id} for track "${trackTitle}"`);
            }
          } catch (err) {
            console.error(`Error sending push to user ${sub.user_id}:`, err);
          }
        }
      }
    }

    // Log the run
    await supabase.from('pn_schedule_logs').insert({
      function_name: 'send-drip-notifications',
      sent_count: notificationsSent,
      failed_count: 0,
      status: 'success',
    });

    // Update schedule last run
    await supabase
      .from('push_notification_schedules')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_count: notificationsSent
      })
      .eq('function_name', 'send-drip-notifications');

    console.log(`Drip notification check complete. Processed ${roundsProcessed} rounds, sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
        roundsProcessed,
        message: `Sent ${notificationsSent} drip notifications` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-drip-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});