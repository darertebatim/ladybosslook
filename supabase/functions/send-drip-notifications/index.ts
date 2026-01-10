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

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Find all active rounds with playlists (including drip_offset_days)
    const { data: activeRounds, error: roundsError } = await supabase
      .from('program_rounds')
      .select(`
        id,
        round_name,
        start_date,
        drip_offset_days,
        audio_playlist_id,
        program_slug,
        audio_playlists (
          id,
          name
        )
      `)
      .not('audio_playlist_id', 'is', null)
      .lte('start_date', todayStr);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      throw roundsError;
    }

    console.log(`Found ${activeRounds?.length || 0} rounds with playlists`);

    let notificationsSent = 0;

    for (const round of activeRounds || []) {
      // Calculate days since round start, accounting for drip offset
      const roundStart = new Date(round.start_date + 'T00:00:00');
      const dripOffset = round.drip_offset_days || 0;
      const daysSinceStart = Math.floor((today.getTime() - roundStart.getTime()) / (1000 * 60 * 60 * 24));
      
      // The effective day for drip content, accounting for freezes/forwards
      // If drip_offset_days is +7, we're effectively 7 days behind, so subtract the offset
      const effectiveDay = daysSinceStart - dripOffset;

      console.log(`Round "${round.round_name}": ${daysSinceStart} days since start, offset: ${dripOffset}, effective day: ${effectiveDay}`);

      // Skip if effective day is negative (round hasn't effectively started yet due to freeze)
      if (effectiveDay < 0) {
        console.log(`Skipping round "${round.round_name}" - effective day is negative due to freeze`);
        continue;
      }

      // Find tracks that unlock today (drip_delay_days === effectiveDay)
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
        .eq('drip_delay_days', effectiveDay);

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

      // Send notifications
      for (const track of unlockedTracks) {
        const trackTitle = track.audio_content?.title || 'New Content';
        const playlistName = round.audio_playlists?.name || round.round_name;

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

    console.log(`Drip notification check complete. Sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent,
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
