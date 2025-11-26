import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const usersToFix = [
      { email: 'hanieh_shahkaram@yahoo.com', user_id: '24f386d3-18e1-4bf9-8e71-bc0034721bbb' },
      { email: 'marjankasraeenia@gmail.com', user_id: 'd40bbae6-0265-457d-ac35-191c005cd5c9' },
      { email: 'nazifazmary123@gmail.com', user_id: 'ac33b2c9-acde-4bde-a77d-3fb8cbe59817' },
      { email: 'sagharzohari@yahoo.com', user_id: '9d6ac004-d1cc-425e-99b2-5a60d27060b7' }
    ];

    const results = [];

    for (const user of usersToFix) {
      // Update orders to link user_id
      const { error: orderError } = await supabase
        .from('orders')
        .update({ user_id: user.user_id })
        .eq('email', user.email)
        .eq('product_name', 'Empowered Woman Coaching')
        .is('user_id', null);

      if (orderError) {
        console.error('Order update error:', user.email, orderError);
      }

      // Create enrollment
      const { data: enrollData, error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.user_id,
          course_name: 'Empowered Woman Coaching',
          program_slug: 'empowered-woman-coaching',
          status: 'active'
        })
        .select();

      if (enrollError) {
        if (enrollError.message.includes('duplicate')) {
          results.push({ email: user.email, status: 'already_enrolled' });
        } else {
          console.error('Enrollment error:', user.email, enrollError);
          results.push({ email: user.email, status: 'error', error: enrollError.message });
        }
      } else {
        console.log('✓ Enrolled:', user.email);
        results.push({ email: user.email, status: 'enrolled', data: enrollData });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
