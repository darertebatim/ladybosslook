import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const defaultGoal = body.goal || 7;

    // Update all users without a streak goal
    const { data, error } = await supabase
      .from('user_streaks')
      .update({ 
        streak_goal: defaultGoal, 
        streak_goal_set_at: new Date().toISOString() 
      })
      .is('streak_goal', null)
      .select('user_id');

    if (error) {
      console.error('Error updating streak goals:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedCount = data?.length || 0;
    console.log(`✅ Updated ${updatedCount} users with default streak goal of ${defaultGoal} days`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedCount,
        goal: defaultGoal,
        message: `Set ${defaultGoal}-day streak goal for ${updatedCount} users`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
