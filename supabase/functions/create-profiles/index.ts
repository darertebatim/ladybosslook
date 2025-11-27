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

    const usersToCreate = [
      { email: 'fatanehzare97@icloud.com', name: 'Fataneh Zare' },
      { email: 'tjamziba@gmail.com', name: 'Tjamziba' }
    ];

    const results = [];

    for (const userData of usersToCreate) {
      console.log('Processing:', userData.email);
      
      // Create user account with email as password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.email,
        email_confirm: true
      });

      if (authError) {
        console.error('Auth error for', userData.email, ':', authError);
        results.push({ email: userData.email, status: 'auth_error', error: authError.message });
        continue;
      }

      const userId = authData.user.id;
      console.log('Created user:', userId);

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.name
        });

      if (profileError) {
        console.error('Profile error:', profileError);
      } else {
        console.log('Created profile');
      }

      // Update orders
      const { error: orderError } = await supabase
        .from('orders')
        .update({ user_id: userId })
        .eq('email', userData.email)
        .eq('product_name', 'Empowered Woman Coaching')
        .is('user_id', null);

      if (orderError) {
        console.error('Order error:', orderError);
      } else {
        console.log('Updated orders');
      }

      // Create enrollment
      const { data: enrollData, error: enrollError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: userId,
          course_name: 'Empowered Woman Coaching',
          program_slug: 'empowered-woman-coaching',
          status: 'active'
        })
        .select();

      if (enrollError) {
        console.error('Enrollment error:', enrollError);
        results.push({ email: userData.email, status: 'partial', user_id: userId, error: enrollError.message });
      } else {
        console.log('Created enrollment');
        results.push({ email: userData.email, status: 'success', user_id: userId });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
