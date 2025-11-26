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

    // The two specific users that need enrollments
    const enrollmentsToCreate = [
      {
        user_id: '53a1b6f4-3754-43dc-bf5a-65ed6cdb4b31',
        email: 'nazanin126@yahoo.com',
        course_name: 'Courageous Character Course',
        program_slug: 'courageous-character',
        status: 'active'
      },
      {
        user_id: '5c6b0506-66ed-4f58-b274-2353ffa53a98',
        email: 'kianooshq@yahoo.com',
        course_name: 'Courageous Character Course',
        program_slug: 'courageous-character',
        status: 'active'
      }
    ];

    const results = [];

    for (const enrollment of enrollmentsToCreate) {
      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', enrollment.user_id)
        .eq('program_slug', enrollment.program_slug)
        .maybeSingle();

      if (!existing) {
        const { data, error } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: enrollment.user_id,
            course_name: enrollment.course_name,
            program_slug: enrollment.program_slug,
            status: enrollment.status
          })
          .select();

        if (error) {
          console.error('Error creating enrollment:', enrollment.email, error);
          results.push({ email: enrollment.email, status: 'error', error: error.message });
        } else {
          console.log('✓ Created enrollment for:', enrollment.email);
          results.push({ email: enrollment.email, status: 'created', data });
        }
      } else {
        results.push({ email: enrollment.email, status: 'already_exists' });
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
