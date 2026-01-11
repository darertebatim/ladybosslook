import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting session reminder check...');

    const now = new Date();
    
    // Find sessions starting in the next 24 hours or next 1 hour
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Find upcoming sessions
    const { data: upcomingSessions, error: sessionsError } = await supabase
      .from('program_sessions')
      .select(`
        id,
        title,
        session_date,
        meeting_link,
        duration_minutes,
        round_id,
        session_number,
        program_rounds (
          id,
          round_name,
          program_slug,
          google_meet_link
        )
      `)
      .gte('session_date', now.toISOString())
      .lte('session_date', in24Hours.toISOString())
      .eq('status', 'scheduled');

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      throw sessionsError;
    }

    console.log(`Found ${upcomingSessions?.length || 0} upcoming sessions`);

    let postsCreated = 0;
    let notificationsSent = 0;

    for (const session of upcomingSessions || []) {
      const sessionDate = new Date(session.session_date);
      const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Determine reminder type based on time
      let reminderType: '24h' | '1h' | null = null;
      if (hoursUntil <= 1.1 && hoursUntil >= 0.9) {
        reminderType = '1h';
      } else if (hoursUntil <= 24.1 && hoursUntil >= 23.9) {
        reminderType = '24h';
      }

      if (!reminderType) continue;

      const round = session.program_rounds;
      if (!round) continue;

      console.log(`Processing ${reminderType} reminder for session "${session.title}" (Round: ${round.round_name})`);

      // Check if we already created a reminder for this session at this interval
      const reminderKey = `session_${session.id}_${reminderType}`;
      const { data: existingPost } = await supabase
        .from('feed_posts')
        .select('id')
        .eq('action_data->>reminderKey', reminderKey)
        .single();

      if (existingPost) {
        console.log(`Reminder already exists for ${reminderKey}`);
        continue;
      }

      // Get the round's channel
      const { data: roundChannel } = await supabase
        .from('feed_channels')
        .select('id')
        .eq('round_id', round.id)
        .single();

      if (!roundChannel) {
        console.log(`No channel found for round ${round.id}`);
        continue;
      }

      // Get admin user for author
      const { data: adminUser } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      // Format session time
      const timeStr = sessionDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
      const dateStr = sessionDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });

      const meetingUrl = session.meeting_link || round.google_meet_link;
      const title = reminderType === '1h' 
        ? `📅 Session Starting in 1 Hour!`
        : `📅 Session Tomorrow!`;
      
      const content = reminderType === '1h'
        ? `"${session.title}" starts at ${timeStr}. Get ready to join!`
        : `Don't forget: "${session.title}" is scheduled for ${dateStr} at ${timeStr}.`;

      // Create feed post
      const { error: postError } = await supabase.from('feed_posts').insert({
        channel_id: roundChannel.id,
        author_id: adminUser?.user_id || null,
        post_type: 'session_reminder',
        title,
        content,
        action_type: meetingUrl ? 'join_session' : 'none',
        action_data: { 
          meetingUrl,
          sessionId: session.id,
          label: 'Join Session',
          reminderKey,
        },
        is_system: true,
        send_push: true,
      });

      if (postError) {
        console.error('Error creating feed post:', postError);
      } else {
        postsCreated++;
        console.log(`Created ${reminderType} reminder post for session "${session.title}"`);
      }

      // Send push notifications to enrolled users
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('round_id', round.id)
        .eq('status', 'active');

      if (enrollments && enrollments.length > 0) {
        const userIds = enrollments.map(e => e.user_id);
        
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', userIds);

        for (const sub of subscriptions || []) {
          try {
            const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: sub.user_id,
                title,
                body: content,
                data: {
                  type: 'session_reminder',
                  session_id: session.id,
                  meeting_url: meetingUrl,
                },
              },
            });

            if (!pushError) {
              notificationsSent++;
            }
          } catch (err) {
            console.error(`Error sending push to user ${sub.user_id}:`, err);
          }
        }
      }
    }

    console.log(`Session reminder check complete. Created ${postsCreated} posts, sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsCreated,
        notificationsSent,
        message: `Created ${postsCreated} session reminders` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-session-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
